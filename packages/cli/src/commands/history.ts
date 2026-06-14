import type { Command } from "commander";
import { BaselineManager } from "@sorobench/runner";
import { loadConfig } from "../utils/loadConfig.js";

export function registerHistoryCommand(program: Command): void {
  program
    .command("history")
    .description("View historical benchmark data for a function")
    .requiredOption("--function <name>", "Function name to query history for")
    .option("--last <number>", "Number of historical entries to show", "20")
    .option("--format <format>", "Output format (terminal|json|csv)", "terminal")
    .option("--config <path>", "Path to config file")
    .action(async (options) => {
      try {
        const config = loadConfig(options.config);
        const baselineManager = new BaselineManager(config.baseline);
        const history = await baselineManager.getHistory(options.function, parseInt(options.last, 10));

        if (history.length === 0) {
          console.log(`No historical data found for function "${options.function}"`);
          return;
        }

        const format = options.format as string;

        if (format === "json") {
          console.log(JSON.stringify(history, null, 2));
        } else if (format === "csv") {
          console.log("commit,branch,instructions,feeTotalXlm,date");
          for (const entry of history) {
            console.log(`${entry.commit},${entry.branch ?? ""},${entry.instructions},${entry.feeTotalXlm},${entry.date}`);
          }
        } else {
          console.log(`\nHistory for function "${options.function}":`);
          console.log("-".repeat(90));
          console.log(
            `${"Date".padEnd(25)} ${"Commit".padEnd(12)} ${"Instructions".padStart(14)} ${"Fee (XLM)".padStart(14)} ${"Branch".padEnd(15)}`,
          );
          console.log("-".repeat(90));
          for (const entry of history) {
            const date = new Date(entry.date).toLocaleDateString();
            const shortCommit = entry.commit.substring(0, 8);
            console.log(
              `${date.padEnd(25)} ${shortCommit.padEnd(12)} ${String(entry.instructions).padStart(14)} ${entry.feeTotalXlm.toFixed(6).padStart(14)} ${(entry.branch ?? "").padEnd(15)}`,
            );
          }
          console.log();
        }
      } catch (err) {
        console.error("Failed to retrieve history:", err instanceof Error ? err.message : err);
        process.exit(1);
      }
    });
}
