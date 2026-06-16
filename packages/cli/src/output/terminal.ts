import chalk from "chalk";
import type { BenchRunResult, BenchContractResult, BenchFunctionResult } from "@sorobench/runner";

const MAX_INSTRUCTIONS = 100_000_000;
const BAR_WIDTH = 20;

export function formatTerminal(result: BenchRunResult): string {
  const lines: string[] = [];

  lines.push(chalk.cyan(`\u26A1 SoroBench v0.1.0 \u2014 ${result.config.project.name}`));
  lines.push(`Timestamp: ${result.timestamp}`);
  lines.push(`Duration: ${result.duration}ms`);
  const commit = result.results[0]?.gitCommit;
  if (commit && commit !== "unknown") {
    lines.push(`Commit: ${commit}`);
  }
  lines.push("");

  for (const cr of result.results) {
    lines.push(chalk.cyan.bold(`\u2500 Contract: ${cr.contractName}`));
    lines.push("");

    const header = `${chalk.cyan("Function".padEnd(30))} ${chalk.cyan("Instructions".padStart(12))}  ${chalk.cyan("Mem (bytes)".padStart(10))}  ${chalk.cyan("Fee (XLM)".padStart(12))}  ${chalk.cyan("Budget Usage")}`;
    lines.push(header);
    lines.push(chalk.dim("\u2500".repeat(header.length)));

    for (const fr of cr.functions) {
      const barLen = Math.round((fr.instructions / MAX_INSTRUCTIONS) * BAR_WIDTH);
      const bar = "\u2588".repeat(Math.min(barLen, BAR_WIDTH)) + "\u2591".repeat(Math.max(0, BAR_WIDTH - barLen));
      const pctStr = `${fr.instructionsPct.toFixed(1)}%`;
      lines.push(
        `${fr.functionName.padEnd(30)} ${chalk.yellow(String(fr.instructions).padStart(12))}  ${chalk.white(String(fr.memBytes).padStart(10))}  ${chalk.green(fr.feeTotalXlm.toFixed(6).padStart(12))}  ${chalk.blue(bar)} ${pctStr}`,
      );
    }
    lines.push("");

    lines.push(chalk.cyan.bold("  Fee Breakdown:"));
    for (const fr of cr.functions) {
      lines.push(`  ${chalk.bold(fr.functionName)}:`);
      const total =
        fr.feeCpuXlm + fr.feeReadXlm + fr.feeWriteXlm + fr.feeEventXlm + fr.feeTxSizeXlm || 1;
      const cpuBar = renderFeeBar(fr.feeCpuXlm / total, chalk.yellow);
      const readBar = renderFeeBar(fr.feeReadXlm / total, chalk.blue);
      const writeBar = renderFeeBar(fr.feeWriteXlm / total, chalk.magenta);
      const eventBar = renderFeeBar(fr.feeEventXlm / total, chalk.green);
      lines.push(`    CPU:   ${cpuBar} ${fr.feeCpuXlm.toFixed(8)} XLM`);
      lines.push(`    Read:  ${readBar} ${fr.feeReadXlm.toFixed(8)} XLM`);
      lines.push(`    Write: ${writeBar} ${fr.feeWriteXlm.toFixed(8)} XLM`);
      lines.push(`    Event: ${eventBar} ${fr.feeEventXlm.toFixed(8)} XLM`);
    }
    lines.push("");
  }

  lines.push(chalk.cyan.bold("\u2500 Thresholds"));
  let allPassed = true;
  for (const cr of result.results) {
    for (const fr of cr.functions) {
      const violations: string[] = [];
      if (fr.feeTotalXlm > (result.config.thresholds.global.maxFeeXlm ?? Infinity)) {
        violations.push(`fee ${fr.feeTotalXlm} > ${result.config.thresholds.global.maxFeeXlm}`);
      }
      if (fr.instructions > (result.config.thresholds.global.maxInstructions ?? Infinity)) {
        violations.push(
          `instructions ${fr.instructions} > ${result.config.thresholds.global.maxInstructions}`,
        );
      }
      if (violations.length > 0) {
        allPassed = false;
        lines.push(chalk.red(`  \u2716 ${cr.contractName}.${fr.functionName}: ${violations.join(", ")}`));
      }
    }
  }
  if (allPassed) {
    lines.push(chalk.green("  \u2714 All thresholds passed"));
  }
  lines.push("");

  return lines.join("\n");
}

function renderFeeBar(fraction: number, color: (s: string) => string): string {
  const w = 10;
  const filled = Math.round(fraction * w);
  const bar = "\u2588".repeat(Math.min(filled, w)) + "\u2591".repeat(Math.max(0, w - filled));
  return color(bar);
}
