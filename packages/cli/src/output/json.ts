import type { BenchRunResult } from "@sorobench/runner";

export function formatJson(result: BenchRunResult): string {
  return JSON.stringify(result, null, 2);
}
