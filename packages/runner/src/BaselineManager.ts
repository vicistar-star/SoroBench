import * as fs from "node:fs";
import * as path from "node:path";
import type {
  BaselineConfig,
  BenchRunResult,
  BaselineData,
  ComparisonResult,
  ComparisonRow,
  BenchContractResult,
  BenchFunctionResult,
} from "./types";

export class BaselineManager {
  private config: BaselineConfig;

  constructor(config: BaselineConfig) {
    this.config = config;
  }

  async save(result: BenchRunResult, tag?: string): Promise<void> {
    const baselinePath = this.resolvePath();
    const dir = path.dirname(baselinePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    let existing: BaselineData[] = [];
    if (fs.existsSync(baselinePath)) {
      const raw = fs.readFileSync(baselinePath, "utf-8");
      existing = JSON.parse(raw);
    }

    const entry: BaselineData = {
      id: tag ?? `baseline-${Date.now()}`,
      tag,
      results: result,
      createdAt: new Date().toISOString(),
    };

    const tagIndex = existing.findIndex((e) => e.tag === tag);
    if (tagIndex >= 0) {
      existing[tagIndex] = entry;
    } else {
      existing.push(entry);
    }

    fs.writeFileSync(baselinePath, JSON.stringify(existing, null, 2), "utf-8");
  }

  async load(tag: string): Promise<BenchRunResult | null> {
    const all = await this.list();
    const match = all.find((e) => e.tag === tag);
    return match?.results ?? null;
  }

  async list(): Promise<BaselineData[]> {
    const baselinePath = this.resolvePath();
    if (!fs.existsSync(baselinePath)) {
      return [];
    }
    const raw = fs.readFileSync(baselinePath, "utf-8");
    return JSON.parse(raw) as BaselineData[];
  }

  async getHistory(
    functionName: string,
    lastN: number,
  ): Promise<{ commit: string; branch?: string; instructions: number; feeTotalXlm: number; date: string }[]> {
    const all = await this.list();
    const history: { commit: string; branch?: string; instructions: number; feeTotalXlm: number; date: string }[] = [];

    for (const entry of all) {
      for (const cr of entry.results.results) {
        for (const fr of cr.functions) {
          if (fr.functionName === functionName) {
            history.push({
              commit: cr.gitCommit,
              branch: cr.gitBranch,
              instructions: fr.instructions,
              feeTotalXlm: fr.feeTotalXlm,
              date: cr.timestamp,
            });
          }
        }
      }
    }

    history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return history.slice(0, lastN);
  }

  compare(
    current: BenchRunResult,
    baseline: BenchRunResult,
    thresholdPct: number,
  ): ComparisonResult[] {
    const results: ComparisonResult[] = [];

    for (const currentCr of current.results) {
      const baselineCr = baseline.results.find(
        (b) => b.contractName === currentCr.contractName,
      );
      if (!baselineCr) continue;

      const rows = this.compareContractResults(currentCr, baselineCr, thresholdPct);
      const passed = rows.every((r) => r.status !== "regressed");

      results.push({
        contractName: currentCr.contractName,
        rows,
        threshold: thresholdPct,
        passed,
      });
    }

    return results;
  }

  private compareContractResults(
    current: BenchContractResult,
    baseline: BenchContractResult,
    thresholdPct: number,
  ): ComparisonRow[] {
    const rows: ComparisonRow[] = [];
    const allFunctions = new Set([
      ...current.functions.map((f) => f.functionName),
      ...baseline.functions.map((f) => f.functionName),
    ]);

    for (const fn of allFunctions) {
      const cur = current.functions.find((f) => f.functionName === fn);
      const base = baseline.functions.find((f) => f.functionName === fn);
      const before = base?.instructions ?? 0;
      const after = cur?.instructions ?? 0;
      const delta = after - before;
      const changePct = before > 0 ? ((delta / before) * 100) : 0;

      let status: "improved" | "regressed" | "unchanged";
      if (Math.abs(changePct) <= thresholdPct) {
        status = "unchanged";
      } else if (changePct < 0) {
        status = "improved";
      } else {
        status = "regressed";
      }

      rows.push({
        functionName: fn,
        before,
        after,
        delta,
        changePct: Math.round(changePct * 100) / 100,
        status,
      });
    }

    return rows;
  }

  private resolvePath(): string {
    return this.config.path ?? ".sorobench/baseline.json";
  }
}
