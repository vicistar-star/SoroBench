import type { BenchRunResult, BenchFunctionResult } from "@sorobench/runner";

const CSV_HEADERS = [
  "contract",
  "function",
  "instructions",
  "instructions_pct",
  "instructions_p50",
  "instructions_p95",
  "instructions_stddev",
  "mem_bytes",
  "mem_pct",
  "read_entries",
  "read_bytes",
  "write_entries",
  "write_bytes",
  "event_count",
  "event_bytes",
  "fee_total_xlm",
  "fee_cpu_xlm",
  "fee_read_xlm",
  "fee_write_xlm",
  "fee_event_xlm",
  "fee_tx_size_xlm",
  "timestamp",
  "git_commit",
  "git_branch",
].join(",");

function escapeCsv(val: unknown): string {
  const str = String(val ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function formatCsv(result: BenchRunResult): string {
  const lines: string[] = [CSV_HEADERS];

  for (const cr of result.results) {
    for (const fr of cr.functions) {
      const row = [
        cr.contractName,
        fr.functionName,
        fr.instructions,
        fr.instructionsPct,
        fr.instructionsP50,
        fr.instructionsP95,
        fr.instructionsStddev,
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
        cr.gitBranch ?? "",
      ].map(escapeCsv);
      lines.push(row.join(","));
    }
  }

  return lines.join("\n") + "\n";
}
