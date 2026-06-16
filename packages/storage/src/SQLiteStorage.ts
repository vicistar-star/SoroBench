import Database from "better-sqlite3";
import * as path from "node:path";
import * as fs from "node:fs";
import type {
  StorageBackend,
  BenchRunResult,
  BaselineData,
  BenchContractResult,
  BenchFunctionResult,
} from "@sorobench/runner";

export class SQLiteStorage implements StorageBackend {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const resolvedPath = dbPath
      ? path.resolve(dbPath)
      : path.resolve(process.cwd(), ".sorobench", "history.db");
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.db = new Database(resolvedPath);
    this.db.pragma("journal_mode = WAL");
    this.initSchema();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS bench_runs (
        id TEXT PRIMARY KEY,
        contract_name TEXT NOT NULL,
        git_commit TEXT NOT NULL,
        git_branch TEXT,
        tag TEXT,
        timestamp TEXT NOT NULL,
        duration REAL NOT NULL,
        results_json TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS bench_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id TEXT NOT NULL,
        function_name TEXT NOT NULL,
        instructions INTEGER NOT NULL,
        mem_bytes INTEGER NOT NULL,
        read_entries INTEGER NOT NULL,
        write_entries INTEGER NOT NULL,
        event_count INTEGER NOT NULL,
        fee_total_xlm REAL NOT NULL,
        FOREIGN KEY (run_id) REFERENCES bench_runs(id)
      );

      CREATE INDEX IF NOT EXISTS idx_bench_results_run_id ON bench_results(run_id);
      CREATE INDEX IF NOT EXISTS idx_bench_results_fn ON bench_results(git_commit, function_name);
    `);
  }

  async save(result: BenchRunResult, tag?: string): Promise<void> {
    const insertRun = this.db.prepare(`
      INSERT OR REPLACE INTO bench_runs (id, contract_name, git_commit, git_branch, tag, timestamp, duration, results_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertResult = this.db.prepare(`
      INSERT INTO bench_results (run_id, function_name, instructions, mem_bytes, read_entries, write_entries, event_count, fee_total_xlm)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = this.db.transaction(() => {
      for (const cr of result.results) {
        const id = tag ?? `${cr.gitCommit}-${cr.contractName}-${Date.now()}`;
        insertRun.run(
          id,
          cr.contractName,
          cr.gitCommit,
          cr.gitBranch ?? null,
          tag ?? null,
          cr.timestamp,
          result.duration,
          JSON.stringify(result),
        );
        for (const fr of cr.functions) {
          insertResult.run(
            id,
            fr.functionName,
            fr.instructions,
            fr.memBytes,
            fr.readEntries,
            fr.writeEntries,
            fr.eventCount,
            fr.feeTotalXlm,
          );
        }
      }
    });
    transaction();
  }

  async load(id: string): Promise<BenchRunResult> {
    const row = this.db
      .prepare("SELECT results_json FROM bench_runs WHERE id = ?")
      .get(id) as { results_json: string } | undefined;
    if (!row) {
      throw new Error(`Run not found: ${id}`);
    }
    return JSON.parse(row.results_json) as BenchRunResult;
  }

  async list(): Promise<BaselineData[]> {
    const rows = this.db
      .prepare(
        "SELECT DISTINCT id, tag, timestamp, results_json FROM bench_runs ORDER BY timestamp DESC",
      )
      .all() as { id: string; tag: string | null; timestamp: string; results_json: string }[];

    return rows.map((row) => ({
      id: row.id,
      tag: row.tag ?? undefined,
      results: JSON.parse(row.results_json) as BenchRunResult,
      createdAt: row.timestamp,
    }));
  }

  getHistory(
    functionName: string,
    lastN: number,
  ): Promise<{ commit: string; branch?: string; instructions: number; feeTotalXlm: number; date: string }[]> {
    const rows = this.db
      .prepare(
        `SELECT r.git_commit, r.git_branch, b.function_name, b.instructions, b.fee_total_xlm, r.timestamp as date
         FROM bench_results b
         JOIN bench_runs r ON b.run_id = r.id
         WHERE b.function_name = ?
         ORDER BY r.timestamp DESC
         LIMIT ?`,
      )
      .all(functionName, lastN) as {
      git_commit: string;
      git_branch: string | null;
      function_name: string;
      instructions: number;
      fee_total_xlm: number;
      date: string;
    }[];

    return Promise.resolve(
      rows.map((row) => ({
        commit: row.git_commit,
        branch: row.git_branch ?? undefined,
        instructions: row.instructions,
        feeTotalXlm: row.fee_total_xlm,
        date: row.date,
      })),
    );
  }
}
