#!/usr/bin/env node
import { Command } from "commander";
import { registerRunCommand } from "./commands/run.js";
import { registerCompareCommand } from "./commands/compare.js";
import { registerBaselineCommand } from "./commands/baseline.js";
import { registerRegressionCommand } from "./commands/regression.js";
import { registerFlamegraphCommand } from "./commands/flamegraph.js";
import { registerHistoryCommand } from "./commands/history.js";
import { registerReportCommand } from "./commands/report.js";
import { registerDashboardCommand } from "./commands/dashboard.js";

const program = new Command();

program
  .name("sorobench")
  .description("Performance Benchmarking Suite for Soroban Smart Contracts")
  .version("0.1.0");

registerRunCommand(program);
registerCompareCommand(program);
registerBaselineCommand(program);
registerRegressionCommand(program);
registerFlamegraphCommand(program);
registerHistoryCommand(program);
registerReportCommand(program);
registerDashboardCommand(program);

program.parse(process.argv);

export { program };
