import * as fs from "node:fs";
import * as path from "node:path";
import type { Command } from "commander";
import { BenchRunner } from "@sorobench/runner";
import type { BenchSuite, BenchRunResult } from "@sorobench/runner";
import { loadConfig } from "../utils/loadConfig.js";

export function registerRunCommand(program: Command): void {
  program
    .command("run")
    .description("Run benchmarks against configured contracts")
    .option("--function <name>", "Run only a specific function")
    .option("--suite <path>", "Path to a benchmark suite JSON file")
    .option("--save", "Save results as baseline")
    .option("--tag <tag>", "Tag for the run")
    .option("--out <dir>", "Output directory for reports")
    .option("--config <path>", "Path to config file")
    .action(async (options) => {
      try {
        const config = loadConfig(options.config);
        const runner = new BenchRunner(config);

        if (options.suite) {
          const suite = loadSuite(options.suite);
          runner.addSuite(suite);
        } else {
          for (const contract of config.contracts) {
            const contractId = contract.name;
            runner.addTask(contractId, contract.name, "__bench", []);
          }
        }

        const result = await runner.run();

        const outputDir = options.out ?? config.output.outputDir ?? "./bench-reports";
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

        for (const format of config.output.formats) {
          const output = formatResult(result, format);
          if (output) {
            const ext = format === "terminal" ? "txt" : format;
            const filePath = path.join(outputDir, `benchmark-${timestamp}.${ext}`);
            fs.writeFileSync(filePath, output, "utf-8");
            console.log(`Wrote ${format} report to ${filePath}`);
          }
        }

        printTerminalSummary(result);

        if (options.save) {
          const { BaselineManager } = await import("@sorobench/runner");
          const baselineManager = new BaselineManager(config.baseline);
          await baselineManager.save(result, options.tag);
          console.log(`Baseline saved${options.tag ? ` with tag "${options.tag}"` : ""}`);
        }
      } catch (err) {
        console.error("Benchmark run failed:", err instanceof Error ? err.message : err);
        process.exit(1);
      }
    });
}

function loadSuite(suitePath: string): BenchSuite {
  const resolvedPath = path.resolve(suitePath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`Suite file not found: ${resolvedPath}`);
    process.exit(1);
  }
  const raw = fs.readFileSync(resolvedPath, "utf-8");
  return JSON.parse(raw) as BenchSuite;
}

function formatResult(result: BenchRunResult, format: string): string | null {
  switch (format) {
    case "json":
      return JSON.stringify(result, null, 2);
    default:
      return null;
  }
}

function printTerminalSummary(result: BenchRunResult): void {
  console.log(`\n\u26A1 SoroBench v0.1.0 \u2014 ${result.config.project.name}`);
  console.log(`Timestamp: ${result.timestamp}`);
  console.log(`Duration: ${result.duration}ms\n`);
  for (const cr of result.results) {
    console.log(`Contract: ${cr.contractName}`);
    console.log("-".repeat(80));
    for (const fr of cr.functions) {
      const barLen = Math.round((fr.instructions / 100_000_000) * 20);
      const bar = "\u2588".repeat(barLen) + "\u2591".repeat(Math.max(0, 20 - barLen));
      console.log(
        `${fr.functionName.padEnd(30)} ${String(fr.instructions).padStart(12)} instr  ${String(fr.memBytes).padStart(10)} mem  ${fr.feeTotalXlm.toFixed(6).padStart(12)} XLM  ${bar} ${fr.instructionsPct.toFixed(1)}%`,
      );
    }
    console.log();
  }
}
