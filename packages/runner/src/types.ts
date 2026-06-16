/**
 * Configuration for a single contract to be benchmarked.
 */
export interface ContractConfig {
  /** Human-readable name of the contract */
  name: string;
  /** Path to the compiled .wasm file */
  wasmPath: string;
  /** Optional path to the contract source code */
  sourcePath?: string;
}

/**
 * Configuration for the benchmark runner.
 */
export interface RunnerConfig {
  /** Number of warmup runs before sampling (not recorded) */
  warmupRuns: number;
  /** Number of sampling runs to collect metrics from */
  samplingRuns: number;
  /** Stellar network to run against */
  network: "testnet" | "mainnet";
  /** Soroban RPC URL */
  rpcUrl: string;
}

/**
 * Threshold configuration for a single metric.
 */
export interface ThresholdConfig {
  /** Maximum allowed CPU instructions */
  maxInstructions?: number;
  /** Maximum allowed memory in bytes */
  maxMemBytes?: number;
  /** Maximum allowed transaction fee in XLM */
  maxFeeXlm?: number;
  /** Maximum allowed read bytes */
  maxReadBytes?: number;
  /** Maximum allowed write bytes */
  maxWriteBytes?: number;
  /** Percentage threshold for regression alerts (e.g., 5 for 5%) */
  regressionThresholdPct?: number;
}

/**
 * Configuration for performance thresholds.
 */
export interface ThresholdsConfig {
  /** Global thresholds applied to all functions */
  global: ThresholdConfig;
  /** Per-function threshold overrides */
  functions: Record<string, ThresholdConfig>;
}

/**
 * Configuration for baseline storage and comparison.
 */
export interface BaselineConfig {
  /** Storage backend type */
  store: "file" | "sqlite" | "postgres";
  /** Path to storage (for file or sqlite) */
  path?: string;
  /** Connection string (for postgres) */
  connectionString?: string;
  /** Default regression threshold percentage if not specified in ThresholdConfig */
  regressionThresholdPct?: number;
}

/**
 * Configuration for output formatters.
 */
export interface OutputConfig {
  /** Formats to generate */
  formats: ("terminal" | "html" | "json" | "csv" | "github-comment")[];
  /** Directory to write report files to */
  outputDir: string;
  /** Whether to generate flame graphs */
  flameGraph: boolean;
}

/**
 * Configuration for alerts and notifications.
 */
export interface AlertConfig {
  /** Slack notification settings */
  slack?: {
    webhookUrl: string;
    onThresholdBreached: boolean;
    onRegression: boolean;
  };
  /** Generic webhook notification settings */
  webhook?: {
    url: string;
    onThresholdBreached: boolean;
  };
}

/**
 * Root configuration object for SoroBench.
 */
export interface SoroBenchConfig {
  /** Project metadata */
  project: {
    name: string;
    description?: string;
  };
  /** List of contracts to benchmark */
  contracts: ContractConfig[];
  /** Runner settings */
  runner: RunnerConfig;
  /** Threshold settings */
  thresholds: ThresholdsConfig;
  /** Baseline settings */
  baseline: BaselineConfig;
  /** Output settings */
  output: OutputConfig;
  /** Optional alert settings */
  alerts?: AlertConfig;
}

/**
 * Result of a benchmark for a single function.
 */
export interface BenchFunctionResult {
  /** Name of the function invoked */
  functionName: string;
  /** Total instructions consumed */
  instructions: number;
  /** Instructions as a percentage of the network limit */
  instructionsPct: number;
  /** 50th percentile (median) of instructions across runs */
  instructionsP50: number;
  /** 95th percentile of instructions across runs */
  instructionsP95: number;
  /** Standard deviation of instructions across runs */
  instructionsStddev: number;
  /** Memory consumed in bytes */
  memBytes: number;
  /** Memory as a percentage of the network limit */
  memPct: number;
  /** Number of ledger entries read */
  readEntries: number;
  /** Total bytes read from ledger */
  readBytes: number;
  /** Number of ledger entries written */
  writeEntries: number;
  /** Total bytes written to ledger */
  writeBytes: number;
  /** Total number of events emitted */
  eventCount: number;
  /** Total bytes of events emitted */
  eventBytes: number;
  /** Total transaction fee in XLM */
  feeTotalXlm: number;
  /** Portion of fee for CPU instructions */
  feeCpuXlm: number;
  /** Portion of fee for ledger reads */
  feeReadXlm: number;
  /** Portion of fee for ledger writes */
  feeWriteXlm: number;
  /** Portion of fee for events */
  feeEventXlm: number;
  /** Portion of fee for transaction size */
  feeTxSizeXlm: number;
}

/**
 * Result of a benchmark for a single contract.
 */
export interface BenchContractResult {
  /** Human-readable name of the contract */
  contractName: string;
  /** Results for each function benchmarked */
  functions: BenchFunctionResult[];
  /** ISO timestamp of when the benchmark was run */
  timestamp: string;
  /** Git commit hash at the time of the run */
  gitCommit: string;
  /** Git branch name at the time of the run */
  gitBranch?: string;
  /** Optional user-provided tag for the run */
  tag?: string;
}

/**
 * Complete result of a single benchmark run across all contracts.
 */
export interface BenchRunResult {
  /** List of contract results */
  results: BenchContractResult[];
  /** Configuration used for the run */
  config: SoroBenchConfig;
  /** ISO timestamp of when the run started */
  timestamp: string;
  /** Total duration of the run in milliseconds */
  duration: number;
}

/**
 * Data stored for a baseline.
 */
export interface BaselineData {
  /** Unique identifier for the baseline */
  id: string;
  /** Optional tag for the baseline */
  tag?: string;
  /** The full benchmark run result used as baseline */
  results: BenchRunResult;
  /** ISO timestamp of when the baseline was created */
  createdAt: string;
}

/**
 * A single row in a comparison table.
 */
export interface ComparisonRow {
  /** Name of the function compared */
  functionName: string;
  /** Value in the "before" run */
  before: number;
  /** Value in the "after" run */
  after: number;
  /** Absolute difference between after and before */
  delta: number;
  /** Percentage change from before to after */
  changePct: number;
  /** Status of the change */
  status: "improved" | "regressed" | "unchanged";
}

/**
 * Result of comparing two benchmark runs for a contract.
 */
export interface ComparisonResult {
  /** Name of the contract compared */
  contractName: string;
  /** Rows for each metric/function compared */
  rows: ComparisonRow[];
  /** The threshold percentage used for the comparison */
  threshold: number;
  /** Whether the comparison passed the threshold */
  passed: boolean;
}

/**
 * Details of a regression for a specific function and metric.
 */
export interface RegressionResult {
  /** Name of the function that regressed */
  functionName: string;
  /** Name of the metric that regressed */
  metric: string;
  /** The measured value */
  measured: number;
  /** The threshold value exceeded */
  threshold: number;
  /** Amount by which the threshold was exceeded */
  overBy: number;
}

/**
 * Definition of a single benchmark to run.
 */
export interface BenchmarkDefinition {
  /** Name of the benchmark */
  name: string;
  /** Contract function to call */
  function: string;
  /** Arguments to pass to the function */
  args?: Record<string, unknown>;
  /** Optional parameterization for running the same function with multiple values */
  parameterize?: Record<string, unknown[]>;
}

/**
 * A suite of benchmarks for a contract.
 */
export interface BenchSuite {
  /** Name of the benchmark suite */
  name: string;
  /** Contract identifier */
  contract: string;
  /** Path to the compiled .wasm file */
  wasm: string;
  /** Optional setup steps */
  setup?: {
    /** Accounts to create for the test */
    accounts?: {
      /** Account identifier/name */
      id: string;
      /** Initial balance in XLM */
      initial_balance: string;
    }[];
  };
  /** List of benchmarks to execute */
  benchmarks: BenchmarkDefinition[];
}

/**
 * Interface for storage backends.
 */
export interface StorageBackend {
  /** Saves a benchmark run result */
  save(result: BenchRunResult, tag?: string): Promise<void>;
  /** Loads a benchmark run result by ID */
  load(id: string): Promise<BenchRunResult>;
  /** Lists all saved baselines */
  list(): Promise<BaselineData[]>;
  /** Retrieves historical data for a specific function */
  getHistory(functionName: string, lastN: number): Promise<any[]>;
}

/**
 * Interface for output formatters.
 */
export interface OutputFormatter {
  /** Formats a benchmark run result into a string */
  format(result: BenchRunResult): string;
}

/**
 * Data structure for flame graph visualization.
 */
export interface FlameGraphData {
  /** Name of the frame (usually function name) */
  name: string;
  /** Value associated with the frame (e.g., instructions) */
  value: number;
  /** Child frames */
  children: FlameGraphData[];
}

export const TYPES_VERSION = "0.1.0";
