import * as fs from "node:fs";
import * as path from "node:path";
import type { SoroBenchConfig } from "@sorobench/runner";

export function loadConfig(configPath?: string): SoroBenchConfig {
  const resolvedPath = configPath
    ? path.resolve(configPath)
    : path.resolve(process.cwd(), "sorobench.config.json");
  if (!fs.existsSync(resolvedPath)) {
    console.error(`Config file not found: ${resolvedPath}`);
    process.exit(1);
  }
  const raw = fs.readFileSync(resolvedPath, "utf-8");
  try {
    const config = JSON.parse(raw) as SoroBenchConfig;
    if (!config.project?.name || !config.runner || !config.contracts) {
      console.error("Invalid config: missing required fields (project.name, runner, contracts)");
      process.exit(1);
    }
    return config;
  } catch (err) {
    console.error(`Failed to parse config file: ${resolvedPath}`, err);
    process.exit(1);
  }
}
