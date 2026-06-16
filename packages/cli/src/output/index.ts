import type { BenchRunResult, ComparisonResult } from "@sorobench/runner";
import { formatTerminal } from "./terminal.js";
import { formatHtml } from "./html.js";
import { formatJson } from "./json.js";
import { formatCsv } from "./csv.js";
import { formatGithubComment } from "./github-comment.js";

export { formatTerminal } from "./terminal.js";
export { formatHtml } from "./html.js";
export { formatJson } from "./json.js";
export { formatCsv } from "./csv.js";
export { formatGithubComment } from "./github-comment.js";

export type OutputFormat = "terminal" | "html" | "json" | "csv" | "github-comment";

const FORMATTERS: Record<OutputFormat, (result: BenchRunResult) => string> = {
  terminal: formatTerminal,
  html: formatHtml,
  json: formatJson,
  csv: formatCsv,
  "github-comment": (result: BenchRunResult) => {
    const dummy: ComparisonResult[] = result.results.map((cr) => ({
      contractName: cr.contractName,
      rows: [],
      threshold: 0,
      passed: true,
    }));
    return formatGithubComment(dummy);
  },
};

export function formatOutput(result: BenchRunResult, format: string): string | null {
  const fn = FORMATTERS[format as OutputFormat];
  if (!fn) return null;
  return fn(result);
}
