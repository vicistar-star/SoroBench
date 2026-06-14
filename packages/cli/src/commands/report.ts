import * as fs from "node:fs";
import * as path from "node:path";
import type { Command } from "commander";
import { BaselineManager } from "@sorobench/runner";
import type { BenchRunResult } from "@sorobench/runner";
import { loadConfig } from "../utils/loadConfig.js";

export function registerReportCommand(program: Command): void {
  program
    .command("report")
    .description("Generate a formatted report from a benchmark run")
    .option("--run <id>", "Run ID or 'latest' to use most recent baseline", "latest")
    .option("--format <format>", "Output format (html|json|csv)", "html")
    .option("--out <path>", "Output directory", "./bench-reports")
    .option("--config <path>", "Path to config file")
    .action(async (options) => {
      try {
        const config = loadConfig(options.config);
        const baselineManager = new BaselineManager(config.baseline);
        let result: BenchRunResult | null = null;

        if (options.run === "latest") {
          const entries = await baselineManager.list();
          if (entries.length === 0) {
            console.error("No baselines found. Run a benchmark first or specify --run <id>");
            process.exit(1);
          }
          const sorted = entries.sort(
            (a: { createdAt: string }, b: { createdAt: string }) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
          result = sorted[0].results;
        } else {
          result = await baselineManager.load(options.run);
        }

        if (!result) {
          console.error(`Run not found: ${options.run}`);
          process.exit(1);
        }

        const outputDir = path.resolve(options.out);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const format = options.format as string;

        switch (format) {
          case "json": {
            const jsonPath = path.join(outputDir, `report-${timestamp}.json`);
            fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), "utf-8");
            console.log(`JSON report written to ${jsonPath}`);
            break;
          }
          case "csv": {
            const csvPath = path.join(outputDir, `report-${timestamp}.csv`);
            const csv = generateCsv(result);
            fs.writeFileSync(csvPath, csv, "utf-8");
            console.log(`CSV report written to ${csvPath}`);
            break;
          }
          case "html":
          default: {
            const htmlPath = path.join(outputDir, `report-${timestamp}.html`);
            const html = generateHtml(result);
            fs.writeFileSync(htmlPath, html, "utf-8");
            console.log(`HTML report written to ${htmlPath}`);
            break;
          }
        }
      } catch (err) {
        console.error("Report generation failed:", err instanceof Error ? err.message : err);
        process.exit(1);
      }
    });
}

function generateCsv(result: BenchRunResult): string {
  const header = "contract,function,instructions,instructions_pct,mem_bytes,mem_pct,read_entries,read_bytes,write_entries,write_bytes,event_count,event_bytes,fee_total_xlm,fee_cpu_xlm,fee_read_xlm,fee_write_xlm,fee_event_xlm,fee_tx_size_xlm,timestamp,git_commit";
  const rows: string[] = [header];

  for (const cr of result.results) {
    for (const fr of cr.functions) {
      rows.push(
        [
          cr.contractName,
          fr.functionName,
          fr.instructions,
          fr.instructionsPct,
          fr.memBytes,
          fr.memPct,
          fr.readEntries,
          fr.readBytes,
          fr.writeEntries,
          fr.writeBytes,
          fr.eventCount,
          fr.eventBytes,
          fr.feeTotalXlm,
          fr.feeCpuXlm,
          fr.feeReadXlm,
          fr.feeWriteXlm,
          fr.feeEventXlm,
          fr.feeTxSizeXlm,
          cr.timestamp,
          cr.gitCommit,
        ].join(","),
      );
    }
  }

  return rows.join("\n");
}

function generateHtml(result: BenchRunResult): string {
  const projectName = result.config.project.name;
  const reportTime = new Date(result.timestamp).toLocaleString();
  const duration = result.duration;

  let fnRows = "";
  for (const cr of result.results) {
    for (const fr of cr.functions) {
      const barPct = Math.min(fr.instructionsPct, 100);
      fnRows += `<tr>
        <td>${cr.contractName}</td>
        <td>${fr.functionName}</td>
        <td>${fr.instructions.toLocaleString()}</td>
        <td>${fr.instructionsPct.toFixed(1)}%</td>
        <td>${fr.memBytes.toLocaleString()}</td>
        <td>${fr.memPct.toFixed(1)}%</td>
        <td>${fr.feeTotalXlm.toFixed(6)}</td>
        <td>
          <div style="background:#eee;border-radius:4px;overflow:hidden">
            <div style="width:${barPct}%;height:20px;background:${barPct > 80 ? "#e74c3c" : barPct > 50 ? "#f39c12" : "#2ecc71"};border-radius:4px"></div>
          </div>
        </td>
      </tr>`;
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SoroBench Report - ${projectName}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f6fa; color: #2c3e50; }
  .container { max-width: 1200px; margin: 0 auto; }
  h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
  .meta { color: #7f8c8d; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
  th { background: #3498db; color: #fff; padding: 12px 15px; text-align: left; cursor: pointer; }
  th:hover { background: #2980b9; }
  td { padding: 10px 15px; border-bottom: 1px solid #ecf0f1; }
  tr:hover { background: #f8f9fa; }
  .passed { color: #27ae60; font-weight: bold; }
  .failed { color: #e74c3c; font-weight: bold; }
</style>
</head>
<body>
<div class="container">
  <h1>\u26A1 SoroBench \u2014 ${projectName}</h1>
  <div class="meta">
    <p>Timestamp: ${reportTime} | Duration: ${duration}ms | Git: ${result.results[0]?.gitCommit?.substring(0, 8) ?? "unknown"}</p>
  </div>
  <table id="results">
    <thead>
      <tr>
        <th onclick="sortTable(0)">Contract</th>
        <th onclick="sortTable(1)">Function</th>
        <th onclick="sortTable(2)">Instructions</th>
        <th onclick="sortTable(3)">Instr %</th>
        <th onclick="sortTable(4)">Mem (bytes)</th>
        <th onclick="sortTable(5)">Mem %</th>
        <th onclick="sortTable(6)">Fee (XLM)</th>
        <th>Budget Usage</th>
      </tr>
    </thead>
    <tbody>
      ${fnRows}
    </tbody>
  </table>
</div>
<script>
function sortTable(col) {
  const table = document.getElementById("results");
  const tbody = table.tBodies[0];
  const rows = Array.from(tbody.rows);
  const isNumeric = col === 2 || col === 3 || col === 4 || col === 5 || col === 6;
  const dir = table.getAttribute("data-dir-" + col) === "asc" ? "desc" : "asc";
  table.setAttribute("data-dir-" + col, dir);
  rows.sort((a, b) => {
    const aVal = isNumeric ? parseFloat(a.cells[col].textContent) : a.cells[col].textContent;
    const bVal = isNumeric ? parseFloat(b.cells[col].textContent) : b.cells[col].textContent;
    return dir === "asc" ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
  });
  rows.forEach(r => tbody.appendChild(r));
}
</script>
</body>
</html>`;
}
