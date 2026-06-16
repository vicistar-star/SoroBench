import * as fs from "node:fs";
import * as path from "node:path";
import type {
  StorageBackend,
  BenchRunResult,
  BaselineData,
} from "@sorobench/runner";

export class FileStorage implements StorageBackend {
  private basePath: string;

  constructor(basePath?: string) {
    this.basePath = basePath
      ? path.resolve(basePath)
      : path.resolve(process.cwd(), ".sorobench", "runs");
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  async save(result: BenchRunResult, tag?: string): Promise<void> {
    const commit = result.results[0]?.gitCommit ?? "unknown";
    const timestamp = result.timestamp.replace(/[:.]/g, "-");
    const filename = tag
      ? `${tag}.json`
      : `${timestamp}-${commit}.json`;
    const filePath = path.join(this.basePath, filename);
    fs.writeFileSync(filePath, JSON.stringify(result, null, 2), "utf-8");
  }

  async load(id: string): Promise<BenchRunResult> {
    const filePath = path.join(this.basePath, `${id}.json`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Run not found: ${id}`);
    }
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as BenchRunResult;
  }

  async list(): Promise<BaselineData[]> {
    const files = fs.readdirSync(this.basePath);
    const entries: BaselineData[] = [];

    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const filePath = path.join(this.basePath, file);
      const raw = fs.readFileSync(filePath, "utf-8");
      const run = JSON.parse(raw) as BenchRunResult;
      const stats = fs.statSync(filePath);
      entries.push({
        id: file.replace(/\.json$/, ""),
        results: run,
        createdAt: stats.mtime.toISOString(),
      });
    }

    entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return entries;
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
}
