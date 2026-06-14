import * as fs from "node:fs";
import * as path from "node:path";
import type { Command } from "commander";
import { BenchRunner, BaselineManager } from "@sorobench/runner";
import type { SoroBenchConfig, BenchRunResult, ComparisonResult } from "@sorobench/runner";
import { loadConfig } from "../utils/loadConfig.js";

export function registerCompareCommand(program: Command): void {
  program
    .command("compare")
    .description("Compare two benchmark runs (before/after wasm)")
    .requiredOption("--before <wasm>", "Path to the before (baseline) .wasm file")
    .requiredOption("--after <wasm>", "Path to the after (current) .wasm file")
    .option("--config <path>", "Path to config file")
    .option("--out <dir>", "Output directory for comparison report")
    .action(async (options) => {
      try {
        const baseConfig = loadConfig(options.config);
        const beforeConfig = cloneWithContract(baseConfig, options.before);
        const afterConfig = cloneWithContract(baseConfig, options.after);

        console.log("Running benchmark with before wasm...");
        const beforeRunner = new BenchRunner(beforeConfig);
        for (const contract of beforeConfig.contracts) {
          beforeRunner.addTask(contract.name, contract.name, "__bench", []);
        }
        const beforeResult = await beforeRunner.run();

        console.log("Running benchmark with after wasm...");
        const afterRunner = new BenchRunner(afterConfig);
        for (const contract of afterConfig.contracts) {
          afterRunner.addTask(contract.name, contract.name, "__bench", []);
        }
        const afterResult = await afterRunner.run();

        const thresholdPct = baseConfig.baseline.regressionThresholdPct ?? 5;
        const baselineManager = new BaselineManager(baseConfig.baseline);
        const comparisons = baselineManager.compare(afterResult, beforeResult, thresholdPct);

        const outputDir = options.out ?? "./bench-reports";
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        for (const comp of comparisons) {
          printComparison(comp);
          const jsonPath = path.join(outputDir, `compare-${comp.contractName}-${Date.now()}.json`);
          fs.writeFileSync(jsonPath, JSON.stringify(comp, null, 2), "utf-8");
          console.log(`Comparison written to ${jsonPath}`);
        }
      } catch (err) {
        console.error("Comparison failed:", err instanceof Error ? err.message : err);
        process.exit(1);
      }
    });
}

function cloneWithContract(base: SoroBenchConfig, wasmPath: string): SoroBenchConfig {
  return {
    ...base,
    contracts: base.contracts.map((c: { name: string; wasmPath: string; sourcePath?: string }) => ({
      ...c,
      wasmPath,
    })),
  };
}

function printComparison(comp: ComparisonResult): void {
  console.log(`\nComparison: ${comp.contractName}`);
  console.log(`Status: ${comp.passed ? "PASSED" : "FAILED"}`);
  console.log("-".repeat(90));
  console.log(
    `${"Function".padEnd(25)} ${"Before".padStart(12)} ${"After".padStart(12)} ${"Delta".padStart(12)} ${"Change %".padStart(10)} Status`,
  );
  console.log("-".repeat(90));
  for (const row of comp.rows) {
    const statusIcon = row.status === "regressed" ? "\u274C" : row.status === "improved" ? "\u2705" : "\u2796";
    console.log(
      `${row.functionName.padEnd(25)} ${String(row.before).padStart(12)} ${String(row.after).padStart(12)} ${String(row.delta).padStart(12)} ${`${row.changePct}%`.padStart(10)} ${statusIcon} ${row.status}`,
    );
  }
  console.log();
}
