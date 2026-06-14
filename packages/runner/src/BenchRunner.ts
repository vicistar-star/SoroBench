import { Keypair, Networks } from "@stellar/stellar-sdk";
import { SorobanExecutor } from "./SorobanExecutor.js";
import { Sampler } from "./Sampler.js";
import { ThresholdEvaluator } from "./ThresholdEvaluator.js";
import { BaselineManager } from "./BaselineManager.js";
import type {
  SoroBenchConfig,
  BenchRunResult,
  BenchContractResult,
  BenchFunctionResult,
  BenchSuite,
  RunnerConfig,
} from "./types.js";

export interface BenchTask {
  contractId: string;
  contractName: string;
  method: string;
  args: any[];
}

export class BenchRunner {
  private executor: SorobanExecutor;
  private sampler: Sampler;
  private thresholdEvaluator: ThresholdEvaluator;
  private baselineManager: BaselineManager;
  private tasks: BenchTask[] = [];
  private suites: BenchSuite[] = [];

  constructor(private config: SoroBenchConfig) {
    const runnerConfig = config.runner;
    const networkPassphrase = this.resolveNetworkPassphrase(runnerConfig.network);
    this.executor = new SorobanExecutor(runnerConfig.rpcUrl, networkPassphrase);
    this.sampler = new Sampler(runnerConfig.warmupRuns, runnerConfig.samplingRuns);
    this.thresholdEvaluator = new ThresholdEvaluator(config.thresholds);
    this.baselineManager = new BaselineManager(config.baseline);
  }

  addTask(contractId: string, contractName: string, method: string, args: any[]): void {
    this.tasks.push({ contractId, contractName, method, args });
  }

  addSuite(suite: BenchSuite): void {
    this.suites.push(suite);
  }

  async run(): Promise<BenchRunResult> {
    const startTime = Date.now();
    const contractResults: BenchContractResult[] = [];

    const gitCommit = await this.getGitCommit();
    const gitBranch = await this.getGitBranch();
    const timestamp = new Date().toISOString();

    for (const suite of this.suites) {
      const contractName = suite.contract;
      const contractConfig = this.config.contracts.find((c) => c.name === contractName);
      const contractId = contractConfig?.name ?? contractName;

      const fnResults: BenchFunctionResult[] = [];
      for (const bench of suite.benchmarks) {
        if (bench.parameterize) {
          for (const [paramKey, paramValues] of Object.entries(bench.parameterize)) {
            for (const paramValue of paramValues) {
              const args = { ...bench.args, [paramKey]: paramValue };
              const name = `${bench.name}:${paramKey}=${paramValue}`;
              try {
                const result = await this.sampler.sample(
                  this.executor,
                  contractId,
                  bench.function,
                  Object.values(args),
                );
                result.functionName = name;
                fnResults.push(result);
              } catch (err) {
                console.error(`Benchmark failed: ${contractName}.${name}`, err);
              }
            }
          }
        } else {
          const args = bench.args ? Object.values(bench.args) : [];
          try {
            const result = await this.sampler.sample(
              this.executor,
              contractId,
              bench.function,
              args,
            );
            fnResults.push(result);
          } catch (err) {
            console.error(`Benchmark failed: ${contractName}.${bench.name}`, err);
          }
        }
      }

      contractResults.push({
        contractName,
        functions: fnResults,
        timestamp,
        gitCommit,
        gitBranch,
      });
    }

    for (const task of this.tasks) {
      try {
        const result = await this.sampler.sample(
          this.executor,
          task.contractId,
          task.method,
          task.args,
        );
        let cr = contractResults.find((c) => c.contractName === task.contractName);
        if (!cr) {
          cr = {
            contractName: task.contractName,
            functions: [],
            timestamp,
            gitCommit,
            gitBranch,
          };
          contractResults.push(cr);
        }
        cr.functions.push(result);
      } catch (err) {
        console.error(`Benchmark failed: ${task.contractName}.${task.method}`, err);
      }
    }

    const runResult: BenchRunResult = {
      results: contractResults,
      config: this.config,
      timestamp,
      duration: Date.now() - startTime,
    };

    return runResult;
  }

  async runSuite(suite: BenchSuite): Promise<BenchFunctionResult[]> {
    const contractName = suite.contract;
    const contractConfig = this.config.contracts.find((c) => c.name === contractName);
    const contractId = contractConfig?.name ?? contractName;

    const results: BenchFunctionResult[] = [];
    for (const bench of suite.benchmarks) {
      if (bench.parameterize) {
        for (const [paramKey, paramValues] of Object.entries(bench.parameterize)) {
          for (const paramValue of paramValues) {
            const name = `${bench.name}:${paramKey}=${paramValue}`;
            const args = { ...bench.args, [paramKey]: paramValue };
            try {
              const result = await this.sampler.sample(
                this.executor,
                contractId,
                bench.function,
                Object.values(args),
              );
              result.functionName = name;
              results.push(result);
            } catch (err) {
              console.error(`Benchmark failed: ${contractName}.${name}`, err);
            }
          }
        }
      } else {
        const args = bench.args ? Object.values(bench.args) : [];
        try {
          const result = await this.sampler.sample(
            this.executor,
            contractId,
            bench.function,
            args,
          );
          results.push(result);
        } catch (err) {
          console.error(`Benchmark failed: ${contractName}.${bench.name}`, err);
        }
      }
    }

    return results;
  }

  getThresholdEvaluator(): ThresholdEvaluator {
    return this.thresholdEvaluator;
  }

  getBaselineManager(): BaselineManager {
    return this.baselineManager;
  }

  private resolveNetworkPassphrase(network: RunnerConfig["network"]): string {
    if (network === "mainnet") {
      return Networks.PUBLIC;
    }
    return Networks.TESTNET;
  }

  private async getGitCommit(): Promise<string> {
    try {
      const { execSync } = await import("node:child_process");
      return execSync("git rev-parse HEAD", { encoding: "utf-8" }).trim();
    } catch {
      return "unknown";
    }
  }

  private async getGitBranch(): Promise<string | undefined> {
    try {
      const { execSync } = await import("node:child_process");
      return execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf-8" }).trim();
    } catch {
      return undefined;
    }
  }
}
