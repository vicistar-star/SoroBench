import * as fs from "node:fs";
import * as path from "node:path";
import type { Command } from "commander";
import { BaselineManager, ThresholdEvaluator } from "@sorobench/runner";
import { loadConfig } from "../utils/loadConfig.js";

export function registerRegressionCommand(program: Command): void {
  program
    .command("regression")
    .description("Compare two baselines and output regression report")
    .option("--base <branch|tag>", "Base baseline tag to compare from", "main")
    .option("--head <branch|tag>", "Head baseline tag to compare against", "HEAD")
    .option("--format <format>", "Output format (terminal|github-comment)", "terminal")
    .option("--threshold <pct>", "Regression threshold percentage", "5")
    .option("--config <path>", "Path to config file")
    .action(async (options) => {
      try {
        const config = loadConfig(options.config);
        const baselineManager = new BaselineManager(config.baseline);
        const thresholdPct = parseFloat(options.threshold);

        const baseBaseline = await baselineManager.load(options.base);
        const headBaseline = await baselineManager.load(options.head);

        if (!baseBaseline) {
          console.error(`Base baseline "${options.base}" not found`);
          process.exit(1);
        }
        if (!headBaseline) {
          console.error(`Head baseline "${options.head}" not found`);
          process.exit(1);
        }

        const comparisons = baselineManager.compare(headBaseline, baseBaseline, thresholdPct);

        if (options.format === "github-comment") {
          printGithubComment(comparisons, options.base, options.head);
        } else {
          printRegressionTable(comparisons);
        }

        const allPassed = comparisons.every((c) => c.passed);
        if (!allPassed) {
          process.exit(1);
        }
      } catch (err) {
        console.error("Regression check failed:", err instanceof Error ? err.message : err);
        process.exit(1);
      }
    });
}

function printRegressionTable(comparisons: { contractName: string; rows: { functionName: string; before: number; after: number; delta: number; changePct: number; status: string }[]; passed: boolean; threshold: number }[]): void {
  for (const comp of comparisons) {
    console.log(`\n\u26A1 SoroBench \u2014 Benchmark Diff (${comp.contractName})`);
    console.log(`Status: ${comp.passed ? "PASSED" : "REGRESSIONS DETECTED"}`);
    console.log("-".repeat(90));
    console.log(
      `${"Function".padEnd(25)} ${"Before".padStart(12)} ${"After".padStart(12)} ${"Delta".padStart(12)} ${"Change %".padStart(10)} Status`,
    );
    console.log("-".repeat(90));
    for (const row of comp.rows) {
      const icon = row.status === "regressed" ? "\u274C" : row.status === "improved" ? "\u2705" : "\u2796";
      console.log(
        `${row.functionName.padEnd(25)} ${String(row.before).padStart(12)} ${String(row.after).padStart(12)} ${String(row.delta).padStart(12)} ${`${row.changePct}%`.padStart(10)} ${icon} ${row.status}`,
      );
    }
    console.log();
  }
}

function printGithubComment(comparisons: { contractName: string; rows: { functionName: string; before: number; after: number; delta: number; changePct: number; status: string }[]; passed: boolean; threshold: number }[], base: string, head: string): void {
  console.log(`\u26A1 SoroBench \u2014 Benchmark Diff (${base} \u2192 ${head})\n`);
  let markdown = "";

  for (const comp of comparisons) {
    markdown += `### ${comp.contractName}\n\n`;
    markdown += `| Function | Before | After | Delta | Change |\n`;
    markdown += `|----------|--------|-------|-------|--------|\n`;

    for (const row of comp.rows) {
      const indicator = row.status === "regressed" ? " :warning:" : row.status === "improved" ? " :white_check_mark:" : " :heavy_minus_sign:";
      markdown += `| ${row.functionName} | ${row.before} | ${row.after} | ${row.delta} | ${row.changePct}%${indicator} |\n`;
    }
    markdown += "\n";

    if (comp.passed) {
      markdown += "**Result: PASSED** - No regressions detected.\n\n";
    } else {
      markdown += "**Result: FAILED** - Regressions detected above threshold.\n\n";
    }
  }

  console.log(markdown);
}
