import type { Command } from "commander";
import { BenchRunner, BaselineManager } from "@sorobench/runner";
import { loadConfig } from "../utils/loadConfig.js";

export function registerBaselineCommand(program: Command): void {
  const baselineCmd = program
    .command("baseline")
    .description("Manage benchmark baselines");

  baselineCmd
    .command("save")
    .description("Run benchmarks and save as baseline")
    .requiredOption("--tag <tag>", "Tag for the baseline")
    .option("--config <path>", "Path to config file")
    .action(async (options) => {
      try {
        const config = loadConfig(options.config);
        const runner = new BenchRunner(config);
        for (const contract of config.contracts) {
          runner.addTask(contract.name, contract.name, "__bench", []);
        }
        const result = await runner.run();
        const baselineManager = new BaselineManager(config.baseline);
        await baselineManager.save(result, options.tag);
        console.log(`Baseline saved with tag "${options.tag}"`);
      } catch (err) {
        console.error("Failed to save baseline:", err instanceof Error ? err.message : err);
        process.exit(1);
      }
    });

  baselineCmd
    .command("list")
    .description("List saved baselines")
    .option("--config <path>", "Path to config file")
    .action(async (options) => {
      try {
        const config = loadConfig(options.config);
        const baselineManager = new BaselineManager(config.baseline);
        const entries = await baselineManager.list();
        if (entries.length === 0) {
          console.log("No baselines found.");
          return;
        }
        console.log("\nSaved Baselines:");
        console.log("-".repeat(80));
        for (const entry of entries) {
          const contractNames = entry.results.results.map((r: { contractName: string }) => r.contractName).join(", ");
          console.log(
            `  [${entry.id}] ${entry.tag ? `"${entry.tag}" ` : ""}${contractNames}  (${new Date(entry.createdAt).toLocaleString()})`,
          );
        }
        console.log();
      } catch (err) {
        console.error("Failed to list baselines:", err instanceof Error ? err.message : err);
        process.exit(1);
      }
    });

  baselineCmd
    .command("compare")
    .description("Compare current benchmarks against a saved baseline")
    .requiredOption("--tag <tag>", "Tag of the baseline to compare against")
    .option("--config <path>", "Path to config file")
    .action(async (options) => {
      try {
        const config = loadConfig(options.config);
        const baselineManager = new BaselineManager(config.baseline);
        const baseline = await baselineManager.load(options.tag);
        if (!baseline) {
          console.error(`Baseline not found with tag "${options.tag}"`);
          process.exit(1);
        }

        const runner = new BenchRunner(config);
        for (const contract of config.contracts) {
          runner.addTask(contract.name, contract.name, "__bench", []);
        }
        const current = await runner.run();

        const thresholdPct = config.baseline.regressionThresholdPct ?? 5;
        const comparisons = baselineManager.compare(current, baseline, thresholdPct);

        let allPassed = true;
        for (const comp of comparisons) {
          console.log(`\nContract: ${comp.contractName}`);
          console.log(`Threshold: ${comp.threshold}%`);
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
          if (!comp.passed) {
            allPassed = false;
            console.log(`\n  Result: FAILED - Regressions detected`);
          } else {
            console.log(`\n  Result: PASSED`);
          }
        }

        if (!allPassed) {
          process.exit(1);
        }
      } catch (err) {
        console.error("Baseline comparison failed:", err instanceof Error ? err.message : err);
        process.exit(1);
      }
    });
}
