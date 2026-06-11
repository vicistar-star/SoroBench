# SoroBench — 10-Day Development Plan (→ 65% Completion)

**Goal:** Build a robust monorepo foundation with all core libraries, CLI commands, Rust harness, output formatters, storage backends, and example suites. Reach 65% completion — fully functional for local developer use, ready for contributors to build the remaining 35% (dashboard UI, enterprise features, CI polish).

**Status Tracking:**
| Phase | % of Total | Cumulative |
|-------|-----------|------------|
| Monorepo + Config | 5% | 5% |
| Shared Types | 5% | 10% |
| Rust Harness Crate | 15% | 25% |
| TS Runner Package | 10% | 35% |
| CLI Commands | 15% | 50% |
| Output Formats | 8% | 58% |
| Storage Package | 5% | 63% |
| Flamegraph Package | 2% | 65% |

---

## Day 1 — Monorepo Scaffold & Configuration

**Goal:** Initialize the monorepo with npm workspaces, Turborepo, TypeScript configs, and project configuration types. Every subsequent day depends on this skeleton.

**Files to create:**
- `package.json` — root with workspaces pointing to `packages/*`
- `turbo.json` — build pipeline caching for all packages
- `tsconfig.base.json` — shared TypeScript config
- `tsconfig.json` — root TS config extending base
- `.gitignore` — node_modules, target, dist, .sorobench/history.db
- `.env.example` — env vars template
- `sorobench.config.json` — project config with contracts, runner settings, thresholds, baseline, output
- `.sorobench/baseline.json` — empty baseline placeholder
- `packages/cli/package.json`
- `packages/runner/package.json`
- `packages/rust-harness/Cargo.toml`
- `packages/flamegraph/package.json`
- `packages/storage/package.json`
- `packages/dashboard/package.json`

**Prompt:**
```
You are building the SoroBench monorepo skeleton. Create the root monorepo configuration files:

1. Root `package.json` with npm workspaces: ["packages/*"], devDependencies: typescript, turbo, @types/node, name "@sorobench/monorepo", scripts for build/lint/test/dev:dashboard.
2. `turbo.json` with pipeline for build, test, lint, dev tasks across packages.
3. `tsconfig.base.json` with strict TypeScript config targeting ES2022, moduleResolution bundler, paths for @sorobench/* packages.
4. Root `tsconfig.json` extending base, referencing all packages.
5. `.gitignore` ignoring node_modules, dist, target, .sorobench/history.db, bench-reports, .env.
6. `.env.example` with STELLAR_SECRET_KEY placeholder.
7. `sorobench.config.json` matching the README spec: contracts array, runner settings (warmupRuns, samplingRuns, network, rpcUrl), thresholds (global + per-function), baseline config, output formats.
8. `.sorobench/baseline.json` — empty JSON object placeholder.

Then create stub `package.json` for each package (cli, runner, flamegraph, storage, dashboard) and `Cargo.toml` for rust-harness with soroban-env-host and soroban-sdk dev-dependencies. Each package.json should have name @sorobench/<name>, version 0.1.0, proper main/exports pointing to dist/index.js, and build script "tsc".

Do NOT deviate from the README spec. Use MIT license in each package. All package versions start at 0.1.0.
```

---

## Day 2 — Shared Types & Core Interfaces

**Goal:** Define every shared TypeScript type and interface used across the entire project. This becomes the type contract for all packages.

**Files to create:**
- `packages/runner/src/types.ts` — all shared types

**Prompt:**
```
Create the shared type definitions for SoroBench at `packages/runner/src/types.ts`. These types are used by ALL packages (cli, runner, storage, flamegraph, dashboard). Include:

- `ContractConfig` — name, wasm path, optional source path
- `RunnerConfig` — warmupRuns, samplingRuns, network ("testnet"|"mainnet"), rpcUrl
- `ThresholdConfig` — maxInstructions?, maxMemBytes?, maxFeeXlm?, maxReadBytes?, maxWriteBytes?, regressionThresholdPct?
- `ThresholdsConfig` — global: ThresholdConfig, functions: Record<string, ThresholdConfig>
- `BaselineConfig` — store ("file"|"sqlite"|"postgres"), path?, connectionString?, regressionThresholdPct?
- `OutputConfig` — formats: ("terminal"|"html"|"json"|"csv"|"github-comment")[], outputDir, flameGraph: boolean
- `AlertConfig` — slack?: { webhookUrl, onThresholdBreached, onRegression }, webhook?: { url, onThresholdBreached }
- `SoroBenchConfig` — project, contracts: ContractConfig[], runner: RunnerConfig, thresholds: ThresholdsConfig, baseline: BaselineConfig, output: OutputConfig, alerts?: AlertConfig
- `BenchFunctionResult` — functionName, instructions, instructionsPct, instructionsP50, instructionsP95, instructionsStddev, memBytes, memPct, readEntries, readBytes, writeEntries, writeBytes, eventCount, eventBytes, feeTotalXlm, feeCpuXlm, feeReadXlm, feeWriteXlm, feeEventXlm, feeTxSizeXlm
- `BenchContractResult` — contractName, functions: BenchFunctionResult[], timestamp, gitCommit, gitBranch?, tag?
- `BenchRunResult` — results: BenchContractResult[], config: SoroBenchConfig, timestamp, duration
- `BaselineData` — id, tag?, results: BenchRunResult, createdAt
- `ComparisonRow` — functionName, before: number, after: number, delta: number, changePct: number, status: "improved"|"regressed"|"unchanged"
- `ComparisonResult` — contractName, rows: ComparisonRow[], threshold: number, passed: boolean
- `RegressionResult` — functionName, metric, measured, threshold, overBy
- `BenchmarkDefinition` — name, function, args: Record<string, unknown>?, parameterize?: Record<string, unknown[]>
- `BenchSuite` — name, contract, wasm, setup?: { accounts?: { id, initial_balance }[] }, benchmarks: BenchmarkDefinition[]
- `StorageBackend` — interface with save(result: BenchRunResult, tag?: string): Promise<void>; load(id: string): Promise<BenchRunResult>; list(): Promise<BaselineData[]>; getHistory(functionName: string, lastN: number): Promise<any[]>
- `OutputFormatter` — interface with format(result: BenchRunResult): string
- `FlameGraphData` — name, value, children: FlameGraphData[]

Export everything. All interfaces and types must be fully documented with JSDoc. Strict TypeScript throughout.
```

---

## Day 3 — Rust Harness: Core API (lib, soro_env, bench_group)

**Goal:** Build the Rust `sorobench` crate foundation — the Soroban test environment wrapper and the `BenchGroup` API for defining benchmarks.

**Files to create:**
- `packages/rust-harness/src/lib.rs`
- `packages/rust-harness/src/soro_env.rs`
- `packages/rust-harness/src/bench_group.rs`

**Prompt:**
```
Create the Rust sorobench crate core files. This crate provides a Rust-native benchmarking harness for Soroban smart contracts.

First update `Cargo.toml` with:
- name = "sorobench", version = "0.1.0", edition = "2021"
- [dependencies]: soroban-sdk = "22.0.0", soroban-env-host = "22.0.0", serde = { version = "1", features = ["derive"] }, serde_json = "1"
- [lib]: crate-type = ["lib"]

Create `lib.rs`:
- Re-export all public types from modules
- Define the main `sorobench::bench` proc macro placeholder as a function-like macro (doc-hidden, just wraps a function pointer pattern for now — use a `#[macro_export]` macro_rules! that delegates to a function)

Create `soro_env.rs`:
- `SoroEnv` struct wrapping `soroban_sdk::Env`
- `new()` — creates a new test environment with budget tracking enabled
- `deploy<T: ContractFunctionSet>(&self, contract: T) -> soroban_sdk::BytesN<32>` — deploys a contract and returns contract ID
- `account(&self, name: &str) -> soroban_sdk::Address` — creates/retrieves a test account by name (deterministic from name hash)
- `random_account(&self) -> soroban_sdk::Address` — generates a random test account
- `budget(&self) -> soroban_env_host::budget::Budget` — exposes the host budget for metering
- Uses `Env::default()` with `budget` enabled via `enable_budget_metering`

Create `bench_group.rs`:
- `BenchGroup` struct holding function name, results vec, and a reference to the environment's budget
- `new(name: &str, env: &SoroEnv) -> Self` — create a new benchmark group
- `bench(&mut self, name: &str, f: impl Fn())` — runs the closure, captures instruction count and memory from the budget before/after, records the delta in an internal results vec. Does warmup runs internally.
- `results(&self) -> &Vec<BenchResult>` — returns collected results
- `BenchResult` struct: name, instructions, mem_bytes, read_entries, write_entries, event_count

All Rust code must be idiomatic, well-typed, and ready for `cargo build`. Use `soroban_sdk::testutils::budget` for budget metering.
```

---

## Day 4 — Rust Harness: Runner, Metrics, Output, Macros

**Goal:** Complete the Rust harness with the `BenchRunner` orchestrator, metrics collection, output serialization, and the `#[bench]` macro.

**Files to create:**
- `packages/rust-harness/src/bench_runner.rs`
- `packages/rust-harness/src/metrics.rs`
- `packages/rust-harness/src/output.rs`
- `packages/rust-harness/src/macros.rs`

**Prompt:**
```
Complete the Rust sorobench crate with four remaining modules.

Create `bench_runner.rs`:
- `BenchRunner` struct holding a list of `BenchGroup` closures
- `new() -> Self` — creates empty runner
- `group(&mut self, name: &str, f: fn(&mut BenchGroup))` — registers a benchmark group by name
- `run(&mut self)` — iterates groups, runs each, collects all results. After running, calls `OutputFormatter::print_summary(&self.results)` and optionally writes JSON to a file. Returns `Vec<GroupResult>` where GroupResult has group_name and Vec<BenchResult>.

Create `metrics.rs`:
- `MetricsCollector` struct wrapping the host budget
- `new(env: &SoroEnv) -> Self`
- `collect(&self) -> MetricsSnapshot` — reads current state from budget: instructions_consumed, memory_bytes, read_entry_count, write_entry_count, event_count
- `MetricsSnapshot` struct with all fields as u64
- `delta(&self, before: &MetricsSnapshot, after: &MetricsSnapshot) -> MetricsDelta` — computes the difference between two snapshots
- `MetricsDelta` struct with same fields as u64 (the delta values)

Create `output.rs`:
- `OutputFormatter` struct
- `format_summary(results: &[GroupResult]) -> String` — produces a formatted table matching the README terminal output style (ASCII table with columns: Function, Instructions, Mem (bytes), Fee (XLM), Budget Usage with bar)
- `format_json(results: &[GroupResult]) -> String` — serializes to JSON using serde_json
- `write_file(results: &[GroupResult], path: &str)` — writes JSON to file

Create `macros.rs`:
- A `#[macro_export]` macro_rules! `bench` that accepts a function and registers it with BenchRunner
- `bench_group!` macro for defining a group inline
- Keep it simple — the macro should expand to a BenchRunner setup + run pattern

Update `lib.rs` to include and re-export all four new modules.
```

---

## Day 5 — TypeScript Runner Package

**Goal:** Build the `@sorobench/runner` package — the TypeScript-side benchmark runner with Soroban RPC execution, metric collection, multi-run sampling, and statistics.

**Files to create:**
- `packages/runner/src/BenchRunner.ts`
- `packages/runner/src/SorobanExecutor.ts`
- `packages/runner/src/MetricsCollector.ts`
- `packages/runner/src/Sampler.ts`
- `packages/runner/src/BaselineManager.ts`
- `packages/runner/src/ThresholdEvaluator.ts`
- `packages/runner/src/index.ts`
- `packages/runner/package.json` (update from stub)

**Prompt:**
```
Build the @sorobench/runner TypeScript package. This is the core execution engine for running benchmarks against Soroban RPC endpoints.

package.json: name "@sorobench/runner", version 0.1.0, main "dist/index.js", types "dist/index.d.ts", scripts: build "tsc", test "vitest run". Dependencies: @stellar/stellar-sdk, dependencies for config loading (node:fs, node:path). devDependencies: typescript, @types/node, vitest.

Create `SorobanExecutor.ts`:
- `SorobanExecutor` class that wraps Soroban RPC calls via @stellar/stellar-sdk
- Constructor takes rpcUrl, networkPassphrase, sourceKeypair? (optional — for testnet it can be ephemeral)
- `simulateTransaction(contractId: string, method: string, args: any[]): Promise<SimulationResult>` — simulates a contract invocation and returns resource consumption from the simulation result
- `SimulationResult` interface: success: boolean, instructions: number, memBytes: number, readEntries: number, readBytes: number, writeEntries: number, writeBytes: number, eventCount: number, eventBytes: number, feeTotal: number, footprint: string[], error?: string
- Uses `Server.simulateTransaction` from @stellar/stellar-sdk, parses the `SorobanTransactionData` from the result

Create `MetricsCollector.ts`:
- `MetricsCollector` class
- `collect(result: SimulationResult): BenchFunctionResult` — transforms a raw simulation result into a fully populated BenchFunctionResult with percentages (instructionsPct = instructions/100M, memPct = memBytes/40MB) and fee breakdown using current testnet fee rates
- Fee calculation: uses the Soroban fee model — baseFee + (instructions * instrFeeRate + readBytes * readFeeRate + writeBytes * writeFeeRate + eventBytes * eventFeeRate + txSizeBytes * txSizeFeeRate). Use constants matching current testnet fee schedule.
- P50/P95/stddev are left as 0 (populated by Sampler)

Create `Sampler.ts`:
- `Sampler` class
- Constructor takes warmupRuns: number, samplingRuns: number
- `sample(executor: SorobanExecutor, contractId: string, method: string, args: any[]): Promise<BenchFunctionResult>` — runs warmupRuns (discarded), then samplingRuns (collected), computes statistics
- `computeStats(samples: number[]): { p50: number, p95: number, stddev: number, mean: number }` — computes percentile and stddev metrics

Create `BaselineManager.ts`:
- `BaselineManager` class
- Constructor takes config: BaselineConfig
- `save(result: BenchRunResult, tag?: string): Promise<void>` — saves to file or storage backend
- `load(tag: string): Promise<BenchRunResult | null>` — loads a baseline by tag
- `compare(current: BenchRunResult, baseline: BenchRunResult, thresholdPct: number): ComparisonResult` — compares current vs baseline, returns per-function deltas and pass/fail
- File-based storage saves to JSON file path from config

Create `ThresholdEvaluator.ts`:
- `ThresholdEvaluator` class
- Constructor takes thresholds: ThresholdsConfig
- `evaluate(result: BenchFunctionResult): RegressionResult[]` — checks result against configured thresholds, returns list of exceeded thresholds
- `evaluateAll(results: BenchContractResult): { passed: boolean, failures: RegressionResult[] }` — checks all functions in a contract result

Create `BenchRunner.ts`:
- `BenchRunner` class orchestrating the full flow
- Constructor takes config (RunnerConfig, contracts, thresholds, baseline config merged from SoroBenchConfig)
- `run(): Promise<BenchRunResult>` — runs all benchmarks across all contracts, collects results, evaluates thresholds, optionally saves baseline
- `runSuite(suite: BenchSuite): Promise<BenchFunctionResult[]>` — runs a YAML-defined suite
- Uses SorobanExecutor, MetricsCollector, Sampler, ThresholdEvaluator internally

Create `index.ts` re-exporting: BenchRunner, BenchSuite, SorobanExecutor, MetricsCollector, Sampler, BaselineManager, ThresholdEvaluator, and all types from types.ts (re-export from a relative path to types.ts).

IMPORTANT: Keep types.ts as the single source of truth — import types from './types' throughout. Do NOT redefine types.
```

---

## Day 6 — CLI Package: Commands (Part 1)

**Goal:** Build the CLI entry point and first four commands: `run`, `compare`, `baseline`, `regression`.

**Files to create:**
- `packages/cli/package.json` (update from stub)
- `packages/cli/src/index.ts`
- `packages/cli/src/commands/run.ts`
- `packages/cli/src/commands/compare.ts`
- `packages/cli/src/commands/baseline.ts`
- `packages/cli/src/commands/regression.ts`

**Prompt:**
```
Build the @sorobench/cli package with the CLI entry point and first four commands.

package.json: name "@sorobench/cli", version 0.1.0, bin: { sorobench: "./dist/index.js" }, main "dist/index.js", types "dist/index.d.ts", scripts: build "tsc". Dependencies: commander, @sorobench/runner, @sorobench/storage, @sorobench/flamegraph, chalk, (output formatters). devDependencies: typescript, @types/node, @types/commander.

Create `index.ts`:
- #!/usr/bin/env node shebang
- Import Commander.js `program`
- Set name "sorobench", description from README, version "0.1.0"
- Register all 8 commands by importing and calling their register functions
- Export `program` for testing
- Call `program.parse(process.argv)`

Create `commands/run.ts`:
- Export `registerRunCommand(program: Command)` that adds a `run` command
- Options: --function <name>, --param-scale <scale>, --suite <path>, --save, --tag <tag>, --out <dir>, --config <path>
- Default config path is ./sorobench.config.json in CWD
- Loads config, creates BenchRunner, calls runner.run(), formats output based on config.output.formats, saves if --save, writes reports to output directory

Create `commands/compare.ts`:
- Export `registerCompareCommand(program: Command)`
- Required options: --before <wasm>, --after <wasm>
- Optional: --config <path>, --out <dir>
- Compiles both wasm files, runs benchmarks on each, diffs results, prints comparison table

Create `commands/baseline.ts`:
- Export `registerBaselineCommand(program: Command)`
- Subcommands: save, list, compare
- `baseline save --tag <tag>` — runs benchmarks and saves as baseline
- `baseline list` — lists saved baselines
- `baseline compare --tag <tag>` — runs current benchmarks and compares against saved baseline

Create `commands/regression.ts`:
- Export `registerRegressionCommand(program: Command)`
- Options: --base <branch|tag>, --head <branch|tag> (default HEAD), --format <format> (default terminal), --threshold <pct>
- Compares two baseline-identified runs, outputs regression report
- Supports --format github-comment for CI output

Each command should use @sorobench/runner types and classes. Load config with a shared `loadConfig(path?: string): SoroBenchConfig` helper. Import output formatters from the output/ directory.
```

---

## Day 7 — CLI Package: Commands (Part 2)

**Goal:** Build the remaining four CLI commands: `flamegraph`, `history`, `report`, `dashboard`.

**Files to create:**
- `packages/cli/src/commands/flamegraph.ts`
- `packages/cli/src/commands/history.ts`
- `packages/cli/src/commands/report.ts`
- `packages/cli/src/commands/dashboard.ts`

**Prompt:**
```
Build the remaining four CLI commands for @sorobench/cli.

Create `commands/flamegraph.ts`:
- Export `registerFlamegraphCommand(program: Command)`
- Options: --function <name>, --all, --out <path> (default ./flamegraph.svg), --config <path>
- Runs benchmarks with call trace collection, parses the call trace into FlameGraphData, generates SVG via @sorobench/flamegraph package, writes to output path
- If --all, generates one flamegraph per function

Create `commands/history.ts`:
- Export `registerHistoryCommand(program: Command)`
- Options: --function <name> (required), --last <number> (default 20), --format (terminal|json|csv, default terminal), --config <path>
- Queries storage backend for historical data, formats and displays
- Uses @sorobench/storage SQLiteStorage

Create `commands/report.ts`:
- Export `registerReportCommand(program: Command)`
- Options: --run <id> (default "latest"), --format (html|json|csv|pdf, default html), --out <path> (default ./bench-reports)
- Loads a run result (from latest run or by ID), formats it as specified, writes to file
- PDF is a stub that writes HTML and notes "PDF export requires wkhtmltopdf"

Create `commands/dashboard.ts`:
- Export `registerDashboardCommand(program: Command)`
- Options: --port <number> (default 4242), --config <path>
- Starts a local express/http server that serves the React dashboard build
- For now, prints a message: "Starting SoroBench dashboard server... (requires @sorobench/dashboard build)" and starts a static file server pointing to the dashboard dist directory

Each command should use Commander.js patterns matching Day 6. Use shared config loading helper. Import types from @sorobench/runner. Handle errors gracefully with process.exit(1) on failure.
```

---

## Day 8 — Output Formats & Core Logic

**Goal:** Build all five output formatters, plus the baseline and threshold evaluator wiring. This is the "reporting engine."

**Files to create:**
- `packages/cli/src/output/terminal.ts`
- `packages/cli/src/output/html.ts`
- `packages/cli/src/output/json.ts`
- `packages/cli/src/output/csv.ts`
- `packages/cli/src/output/github-comment.ts`
- `packages/cli/src/output/index.ts`

**Prompt:**
```
Build all five output formatters for the CLI package. Each formatter implements the OutputFormatter interface.

Create `output/terminal.ts`:
- Exports `formatTerminal(result: BenchRunResult): string`
- Produces a color-coded terminal table matching the README example exactly:
  - Header: ⚡ SoroBench v0.1.0 — <project name>
  - ASCII table with columns: Function, Instructions, Mem (bytes), Fee (XLM), Budget Usage (bar chart ████░░░░░ + %)
  - Below table: summary of all thresholds passed/failed
  - Fee breakdown section for each function showing CPU/Read/Write/Event as colored bars
  - Use chalk for coloring: cyan for headers, green for passed, red for failed, yellow for warnings
  - Show budget usage bars proportional to 100M max instructions

Create `output/html.ts`:
- Exports `formatHtml(result: BenchRunResult): string`
- Produces a self-contained HTML page with:
  - Embedded Chart.js (use CDN link to chart.js 4.x)
  - Sortable table (use simple JS sort on click)
  - Bar chart showing instructions per function
  - Fee breakdown pie/doughnut chart for each function
  - Color-coded threshold indicators
  - Responsive CSS (inline)
  - Timestamp and git commit info in header
- The HTML must be fully self-contained (single file, no external assets other than chart.js CDN)

Create `output/json.ts`:
- Exports `formatJson(result: BenchRunResult): string`
- Pretty-printed JSON serialization of the full BenchRunResult

Create `output/csv.ts`:
- Exports `formatCsv(result: BenchRunResult): string`
- CSV with columns: contract, function, instructions, instructions_pct, mem_bytes, mem_pct, read_entries, read_bytes, write_entries, write_bytes, event_count, event_bytes, fee_total_xlm, fee_cpu_xlm, fee_read_xlm, fee_write_xlm, fee_event_xlm, fee_tx_size_xlm, timestamp, git_commit
- One row per function result

Create `output/github-comment.ts`:
- Exports `formatGithubComment(comparison: ComparisonResult): string`
- Produces a GitHub-flavored markdown table matching the README PR comment example:
  - Header: ⚡ SoroBench — Benchmark Diff (<base> → <head>)
  - Markdown table: Function, Before, After, Delta, Change with ✅/⚠️ indicators
  - Summary line about regression status
  - Links to full report

Create `output/index.ts`:
- Re-exports all formatters
- Exports a `formatOutput(result: BenchRunResult, format: string): string` dispatcher function
```

---

## Day 9 — Storage & Flamegraph Packages

**Goal:** Build the storage backends (SQLite, File) and the SVG flame graph generator.

**Files to create:**
- `packages/storage/src/SQLiteStorage.ts`
- `packages/storage/src/FileStorage.ts`
- `packages/storage/src/index.ts`
- `packages/storage/package.json` (update)
- `packages/flamegraph/src/CallTraceParser.ts`
- `packages/flamegraph/src/FlameGraphBuilder.ts`
- `packages/flamegraph/src/SVGRenderer.ts`
- `packages/flamegraph/src/index.ts`
- `packages/flamegraph/package.json` (update)

**Prompt:**
```
Build two packages: @sorobench/storage and @sorobench/flamegraph.

=== @sorobench/storage ===

package.json: name "@sorobench/storage", version 0.1.0, main "dist/index.js", scripts: build "tsc". Dependencies: better-sqlite3 (for SQLite), node:fs, node:path. devDependencies: typescript, @types/node, @types/better-sqlite3. Import types from @sorobench/runner (types.ts).

Create `SQLiteStorage.ts`:
- `SQLiteStorage` class implementing StorageBackend interface
- Constructor takes dbPath: string (default .sorobench/history.db)
- Initializes SQLite database with tables:
  - `bench_runs` — id (TEXT PRIMARY KEY), contract_name, git_commit, git_branch, tag, timestamp, duration, results_json
  - `bench_results` — id (INTEGER PRIMARY KEY), run_id (FK), function_name, instructions, mem_bytes, read_entries, write_entries, event_count, fee_total_xlm
  - Index on (git_commit, function_name)
- `save(result: BenchRunResult, tag?: string): Promise<void>` — inserts run and all function results in a transaction
- `load(id: string): Promise<BenchRunResult | null>` — loads by run ID
- `list(): Promise<BaselineData[]>` — returns all saved runs
- `getHistory(functionName: string, lastN: number): Promise<{commit, branch, instructions, feeTotalXlm, date}[]>` — queries historical data for trend charts

Create `FileStorage.ts`:
- `FileStorage` class implementing StorageBackend
- Constructor takes basePath: string
- `save(result: BenchRunResult, tag?: string): Promise<void>` — writes JSON file as .sorobench/runs/<timestamp>-<commit>.json
- `load(id: string): Promise<BenchRunResult | null>` — loads from file by ID
- `list(): Promise<BaselineData[]>` — reads all files in runs directory
- `getHistory(functionName: string, lastN: number)` — reads all files, filters and sorts

Create `index.ts` re-exporting SQLiteStorage, FileStorage, and types.

=== @sorobench/flamegraph ===

package.json: name "@sorobench/flamegraph", version 0.1.0, main "dist/index.js", scripts: build "tsc". Import types from @sorobench/runner. devDependencies: typescript, @types/node.

Create `CallTraceParser.ts`:
- `CallTraceParser` class
- `parse(traceData: string): FlameGraphData` — parses a Soroban host call trace (indented tree format from README) into a FlameGraphData tree
- `parseFromSimulation(simulationResult: any): FlameGraphData` — extracts call trace from simulation result

Create `FlameGraphBuilder.ts`:
- `FlameGraphBuilder` class
- `build(data: FlameGraphData): { frames: Frame[] }` — converts tree to flat frame list with depth, x, width for SVG layout
- Each Frame: name, value (instruction count), depth, x (normalized offset 0-1), width (normalized 0-1)
- Uses standard flame graph layout algorithm (sort siblings by value, largest at bottom)

Create `SVGRenderer.ts`:
- `SVGRenderer` class
- `render(frames: Frame[], options?: { width?: number, height?: number, colors?: string[] }): string` — produces SVG string
- SVG features: colored rects per frame (function color based on name hash), hover text showing "function — N instructions (M%)", zoom on click (stretch clicked frame to full width), search/highlight support via JS embedded in SVG
- Standard flame graph colors (warm gradient or random pastel)
- Returns complete standalone SVG document

Create `index.ts` re-exporting CallTraceParser, FlameGraphBuilder, SVGRenderer, Frame, FlameGraphData.
```

---

## Day 10 — Examples, CI, Docker, & Integration

**Goal:** Build example benchmark suites, CI workflow, Docker setup, and final integration wiring. Validate the entire monorepo compiles and all pieces connect.

**Files to create:**
- `benches/token-suite.yaml`
- `benches/defi-suite.yaml`
- `benches/examples/token/benches/contract_benchmarks.rs`
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
- `.github/workflows/sorobench.yml`
- `docker/Dockerfile`
- `docker/docker-compose.yml`
- `packages/dashboard/src/main.tsx` (minimal stub)

**Prompt:**
```
Build the final integration layer: example suites, CI/CD, Docker, and a minimal dashboard stub.

Create `benches/token-suite.yaml`:
- Matches the README example exactly: name "Token Contract Full Suite", contract "token", wasm path, setup with alice/bob accounts, benchmarks for transfer (small + large), balance (cold + warm), mint (parameterized with amount scale [1000, 100000, 10000000, 1000000000])

Create `benches/defi-suite.yaml`:
- A multi-contract DeFi suite: contract IDs "amm", "token", "governance"
- AMM benchmarks: swap (parameterized amount + path length), add_liquidity, remove_liquidity
- Governance benchmarks: propose, vote, execute
- Uses YAML anchors/references to share account setup

Create `benches/examples/token/benches/contract_benchmarks.rs`:
- A compilable Rust benchmark file matching the README Rust harness example exactly
- Uses sorobench crate: bench_transfer, bench_balance, bench_batch_transfer groups
- Parameterized batch_transfer with [1, 10, 50, 100, 500] recipient counts
- Must compile with cargo bench (include proper use statements)

Create `.github/workflows/ci.yml`:
- GitHub Actions workflow for test + lint
- Triggers on push/PR to main
- Steps: checkout, setup Node 20, npm ci, npm run build, npm test, setup Rust, cargo build, cargo test
- Matrix for Node 18.x, 20.x

Create `.github/workflows/release.yml`:
- Publish workflow triggered on tag push (v*)
- Builds all packages, publishes npm packages (dry-run for now), publishes crates.io (dry-run)

Create `.github/workflows/sorobench.yml`:
- The consumer-facing workflow from the README example (for end-users to copy)
- Build contracts, install SoroBench, run benchmarks, compare against base branch, post PR comment

Create `docker/Dockerfile`:
- Multi-stage Node + Rust build
- Stage 1: Rust with wasm target, build sorobench crate
- Stage 2: Node, install @sorobench/cli globally, set up entrypoint
- CMD: sorobench run

Create `docker/docker-compose.yml`:
- Services: sorobench (build from Dockerfile), postgres (for enterprise users, image postgres:16, port 5432, volume for data)
- Environment variables for postgres connection

Create `packages/dashboard/src/main.tsx`:
- Minimal React entry point
- Renders "SoroBench Dashboard — Coming Soon" with Tailwind-like inline styles
- package.json for dashboard already created on Day 1, just ensure it has react, react-dom, typescript devDependencies

Finally, run `npm install` at root to verify the monorepo resolves, and document any manual steps needed. All packages must compile with `npm run build` (TypeScript tsc).
```

---

## Completion Checklist (65% Milestone)

After Day 10, verify all of the following are complete:

### Monorepo Infrastructure
- [ ] Root `package.json` with workspaces
- [ ] `turbo.json` with build pipeline
- [ ] TypeScript configs (base + root)
- [ ] `.gitignore`, `.env.example`

### Shared Types
- [ ] All types defined in `packages/runner/src/types.ts`
- [ ] Used across all packages

### Rust Harness (`sorobench` crate)
- [ ] `SoroEnv` — Soroban test environment wrapper
- [ ] `BenchGroup` — benchmark definition API
- [ ] `BenchRunner` — group orchestration
- [ ] `MetricsCollector` / metrics module
- [ ] `OutputFormatter` / output module
- [ ] `#[bench]` macro
- [ ] Compiles with `cargo build`

### TypeScript Runner (`@sorobench/runner`)
- [ ] `SorobanExecutor` — RPC simulation
- [ ] `MetricsCollector` — metric transformation
- [ ] `Sampler` — multi-run statistics
- [ ] `BaselineManager` — save/load/compare
- [ ] `ThresholdEvaluator` — budget checks
- [ ] `BenchRunner` — orchestration
- [ ] Compiled with `tsc`

### CLI (`@sorobench/cli`)
- [ ] Entry point with Commander.js
- [ ] `run` command
- [ ] `compare` command
- [ ] `baseline` command (save, list, compare)
- [ ] `regression` command
- [ ] `flamegraph` command
- [ ] `history` command
- [ ] `report` command
- [ ] `dashboard` command (stub)

### Output Formats
- [ ] Terminal (color-coded table + budget bars)
- [ ] HTML (self-contained with Chart.js)
- [ ] JSON (pretty-printed)
- [ ] CSV (flat file)
- [ ] GitHub Comment (markdown table)

### Storage (`@sorobench/storage`)
- [ ] `SQLiteStorage` with schema and queries
- [ ] `FileStorage` with JSON file persistence

### Flamegraph (`@sorobench/flamegraph`)
- [ ] `CallTraceParser` — trace string → tree
- [ ] `FlameGraphBuilder` — tree → SVG frames
- [ ] `SVGRenderer` — standalone SVG output

### Examples & Integration
- [ ] `benches/token-suite.yaml`
- [ ] `benches/defi-suite.yaml`
- [ ] Example Rust bench file
- [ ] `.github/workflows/ci.yml`
- [ ] `.github/workflows/release.yml`
- [ ] `.github/workflows/sorobench.yml`
- [ ] `docker/Dockerfile`
- [ ] `docker/docker-compose.yml`
- [ ] Root `npm install` resolves
- [ ] `npm run build` compiles all TS packages

### What's NOT in 65% (Future Work)
- Web dashboard (React) — full implementation
- PostgreSQL storage adapter — full implementation
- PDF export (wkhtmltopdf integration)
- Slack/webhook alert delivery
- Advanced CI/CD workflow polish
- Enterprise multi-team features
- Comprehensive test suite
- CONTRIBUTING.md and other docs
- npm/crates.io publishing pipeline
