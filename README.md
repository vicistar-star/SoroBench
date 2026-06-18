# ⚡ SoroBench

### Performance Benchmarking Suite for Soroban Smart Contract Instruction & Fee Profiling

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Stellar](https://img.shields.io/badge/Stellar-Soroban-7C3AED?logo=stellar)](https://soroban.stellar.org)
[![Status: Alpha](https://img.shields.io/badge/Status-Alpha-orange)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![npm version](https://img.shields.io/npm/v/@sorobench/cli)](https://www.npmjs.com/package/@sorobench/cli)
[![crates.io](https://img.shields.io/crates/v/sorobench)](https://crates.io/crates/sorobench)

---

> **SoroBench** is a developer-first, zero-dependency benchmarking suite purpose-built for Soroban smart contracts on the Stellar network. Profile instruction counts, memory usage, ledger read/write costs, and fee consumption across every function in your contract — then track how those numbers change across commits, refactors, and deployments. No guesswork, no surprises on mainnet.

---

## 📑 Table of Contents

- [Why SoroBench?](#-why-sorobench)
- [Key Features](#-key-features)
- [Architecture Overview](#-architecture-overview)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
- [Usage](#-usage)
  - [CLI](#cli-usage)
  - [Rust Harness](#rust-harness)
  - [TypeScript Runner](#typescript-runner)
  - [Web Dashboard](#web-dashboard)
- [Benchmark Metrics](#-benchmark-metrics)
- [Budget Thresholds & Alerts](#-budget-thresholds--alerts)
- [Benchmark Suites](#-benchmark-suites)
- [Flame Graphs & Call Traces](#-flame-graphs--call-traces)
- [Historical Tracking & Regression Detection](#-historical-tracking--regression-detection)
- [Enterprise Features](#-enterprise-features)
- [CI/CD Integration](#-cicd-integration)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [Security](#-security)
- [Roadmap](#-roadmap)
- [License](#-license)

---

## 🌟 Why SoroBench?

Soroban's resource model is unique — every contract invocation is priced across multiple dimensions simultaneously: CPU instructions, memory bytes, ledger reads, ledger writes, event bytes, and transaction size. Optimizing for one can inadvertently inflate another. Without dedicated tooling, teams fly blind.

| Problem                      | Without SoroBench            | With SoroBench                       |
| ---------------------------- | ---------------------------- | ------------------------------------ |
| Instruction count visibility | Only visible post-simulation | Measured per-function, per-input     |
| Fee estimation accuracy      | Rough guesses                | Precise, reproducible measurements   |
| Performance regressions      | Caught in production         | Caught on PR, before merge           |
| Cross-function comparison    | Manual, tedious              | Automated suite with ranked output   |
| Budget headroom tracking     | Unknown                      | Visualized as % of Soroban limits    |
| Historical trends            | No baseline                  | Git-tracked benchmark history        |
| Input sensitivity analysis   | Untested                     | Parameterized benchmarks with ranges |
| Team performance standards   | Informal                     | Enforced via configurable thresholds |

SoroBench gives your team **numbers, not feelings** — every optimization decision backed by reproducible data.

---

## ✨ Key Features

### ⚡ Deep Instruction Profiling

- **Per-function instruction counts** — measure every exported function independently
- **Input parameterization** — benchmark across data size ranges (e.g. 1, 10, 100, 1000 items) to understand scaling behavior
- **Hot path identification** — pinpoint which internal functions consume the most instructions
- **Worst-case analysis** — automatically finds inputs that maximize resource consumption
- **Comparative benchmarking** — run two contract versions side by side and diff the results

### 💰 Fee Profiling

- **Full resource fee breakdown** — CPU instructions, read bytes, write bytes, event bytes, tx size, each priced separately
- **Base fee + resource fee decomposition** — understand exactly what you're paying for
- **Fee scaling charts** — visualize how fees grow with input size
- **Mainnet fee projection** — extrapolate testnet results to current mainnet fee schedule
- **Fee budget allocation** — see how each function consumes your transaction fee budget

### 📊 Reporting & Visualization

- **Terminal report** — color-coded, ranked output with budget utilization bars
- **HTML report** — rich, self-contained report with charts and sortable tables
- **JSON output** — machine-readable results for downstream tooling
- **Flame graphs** — SVG call trace visualizations showing instruction distribution
- **Trend charts** — historical performance graphs across git commits

### 🔔 Regression Detection

- **Baseline comparison** — compare against a stored baseline and fail on regressions
- **Configurable thresholds** — set per-function or global instruction/fee budgets
- **PR annotations** — post benchmark diffs directly to GitHub/GitLab pull requests
- **Slack / webhook alerts** — notify your team when benchmarks exceed thresholds

### 🏢 Enterprise Features

- **Team baselines** — shared benchmark baselines stored and versioned per workspace
- **Historical dashboard** — web UI tracking performance over time across the whole team
- **Multi-contract suite** — benchmark an entire protocol in one run
- **Export & compliance** — PDF/CSV benchmark reports for engineering reviews

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SoroBench Platform                          │
│                                                                     │
│  Input                                                              │
│  ┌────────────────┐   ┌─────────────────┐   ┌───────────────────┐  │
│  │  WASM Binary   │   │  Rust Harness   │   │  sorobench.       │  │
│  │  (.wasm)       │   │  (#[bench])     │   │  config.json      │  │
│  └───────┬────────┘   └────────┬────────┘   └─────────┬─────────┘  │
│          └────────────────────┼─────────────────────--┘             │
│                               ▼                                     │
│              ┌────────────────────────────┐                         │
│              │      Benchmark Runner      │                         │
│              │  - Soroban host env setup  │                         │
│              │  - Input parameterization  │                         │
│              │  - Warmup & sampling       │                         │
│              │  - Resource metering       │                         │
│              └──────────────┬─────────────┘                         │
│                             │                                       │
│         ┌───────────────────┼───────────────────┐                  │
│         ▼                   ▼                   ▼                  │
│  ┌─────────────┐   ┌────────────────┐   ┌──────────────┐          │
│  │  Instruction│   │  Fee           │   │  Regression  │          │
│  │  Profiler   │   │  Calculator    │   │  Detector    │          │
│  └──────┬──────┘   └───────┬────────┘   └──────┬───────┘          │
│         └──────────────────┼───────────────────┘                   │
│                            ▼                                        │
│              ┌────────────────────────────┐                         │
│              │      Result Aggregator     │                         │
│              │  - Baseline comparison     │                         │
│              │  - Statistical analysis    │                         │
│              │  - Threshold evaluation    │                         │
│              └──────────────┬─────────────┘                         │
│                             │                                       │
│     ┌───────────────────────┼──────────────────────┐               │
│     ▼                       ▼                      ▼               │
│  ┌──────────┐        ┌────────────┐        ┌─────────────┐         │
│  │ Terminal │        │   HTML /   │        │  Dashboard  │         │
│  │ Report   │        │ JSON / CSV │        │  (Web UI)   │         │
│  └──────────┘        └────────────┘        └─────────────┘         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

| Layer                | Technology                                                     |
| -------------------- | -------------------------------------------------------------- |
| Contract Execution   | Soroban host environment (`soroban-env-host`), Soroban RPC     |
| Rust Harness         | Custom `#[bench]` macro, `sorobench` crate                     |
| Instruction Metering | `soroban-env-host` budget metering API                         |
| CLI                  | Node.js, TypeScript, Commander.js                              |
| TypeScript Runner    | `@stellar/stellar-sdk`, `@sorobench/runner`                    |
| Reporting            | Terminal: `ink` + `chalk`; HTML: self-contained static report  |
| Flame Graphs         | SVG generation via `inferno` (adapted for Soroban call traces) |
| Charts               | `chart.js` (embedded in HTML reports)                          |
| Database             | SQLite (local history), PostgreSQL (team/enterprise)           |
| Web Dashboard        | React 18, Tailwind CSS, Recharts                               |
| CI/CD                | GitHub Actions, GitLab CI                                      |
| Package              | npm (`@sorobench/cli`), crates.io (`sorobench`)                |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **Rust** >= 1.74 with `wasm32-unknown-unknown` target
- **Stellar CLI** >= 0.9.x
- **wasm-opt** (optional, for pre-optimization benchmarking)

```bash
# Add wasm target if not already present
rustup target add wasm32-unknown-unknown

# Install wasm-opt (optional)
cargo install wasm-opt
```

### Installation

#### CLI (Node.js)

```bash
npm install -g @sorobench/cli
```

#### Rust Harness

Add to your contract's `Cargo.toml`:

```toml
[dev-dependencies]
sorobench = "0.2"

[[bench]]
name = "contract_benchmarks"
harness = false
```

#### Project Dev Dependency (TypeScript runner)

```bash
npm install --save-dev @sorobench/runner
```

### Configuration

Create `sorobench.config.json` in your project root:

```json
{
  "project": "My Token Protocol",
  "contracts": [
    {
      "name": "token",
      "wasm": "./target/wasm32-unknown-unknown/release/token.wasm",
      "source": "./contracts/token/src"
    },
    {
      "name": "governance",
      "wasm": "./target/wasm32-unknown-unknown/release/governance.wasm"
    }
  ],
  "runner": {
    "warmupRuns": 3,
    "samplingRuns": 10,
    "network": "testnet",
    "rpcUrl": "https://soroban-testnet.stellar.org"
  },
  "thresholds": {
    "global": {
      "maxInstructions": 50000000,
      "maxFeeXlm": 0.05
    },
    "functions": {
      "transfer": {
        "maxInstructions": 5000000,
        "maxFeeXlm": 0.005
      },
      "swap": {
        "maxInstructions": 20000000
      }
    }
  },
  "baseline": {
    "store": ".sorobench/baseline.json",
    "regressionThresholdPct": 10
  },
  "output": {
    "formats": ["terminal", "html", "json"],
    "outputDir": "./bench-reports",
    "flameGraph": true
  }
}
```

---

## 📖 Usage

### CLI Usage

#### Run all benchmarks

```bash
sorobench run
```

**Example Terminal Output:**

```
⚡ SoroBench v0.2.1  —  Token Contract

┌──────────────────────┬──────────────────┬────────────┬───────────┬──────────────────┐
│ Function             │ Instructions     │ Mem (bytes)│ Fee (XLM) │ Budget Usage     │
├──────────────────────┼──────────────────┼────────────┼───────────┼──────────────────┤
│ transfer             │    4,821,304      │   28,416   │ 0.00341   │ ████░░░░░  4.82% │
│ mint                 │    3,104,877      │   22,104   │ 0.00229   │ ███░░░░░░  3.10% │
│ burn                 │    2,980,112      │   21,008   │ 0.00218   │ ███░░░░░░  2.98% │
│ balance              │    1,204,331      │   14,200   │ 0.00089   │ █░░░░░░░░  1.20% │
│ allowance            │    1,198,004      │   13,904   │ 0.00088   │ █░░░░░░░░  1.20% │
│ approve              │    3,301,445      │   23,512   │ 0.00244   │ ███░░░░░░  3.30% │
│ set_admin            │    2,104,009      │   18,300   │ 0.00155   │ ██░░░░░░░  2.10% │
└──────────────────────┴──────────────────┴────────────┴───────────┴──────────────────┘

📊 Fee Breakdown — transfer
  CPU Instructions :  0.00289 XLM  ████████████████████░░  84.7%
  Read Bytes       :  0.00031 XLM  ██░░░░░░░░░░░░░░░░░░░░   9.1%
  Write Bytes      :  0.00018 XLM  █░░░░░░░░░░░░░░░░░░░░░   5.3%
  Event Bytes      :  0.00003 XLM  ░░░░░░░░░░░░░░░░░░░░░░   0.9%

✅ All thresholds passed.
📁 Reports: ./bench-reports/bench_20250605_143201.html
```

#### Run a specific function

```bash
sorobench run --function transfer
```

#### Parameterized benchmark (input scaling)

```bash
sorobench run --function transfer --param-scale amount:1000,10000,100000,1000000
```

Output shows how instructions scale with input size:

```
📈 transfer — Instruction Scaling (amount parameter)

  amount=1,000       →   4,201,004 instructions  (0.00298 XLM)
  amount=10,000      →   4,214,887 instructions  (0.00299 XLM)
  amount=100,000     →   4,219,441 instructions  (0.00300 XLM)
  amount=1,000,000   →   4,221,009 instructions  (0.00300 XLM)

  Verdict: ✅ O(1) — instruction count is constant w.r.t. amount value.
```

#### Compare two contract builds

```bash
sorobench compare \
  --before ./builds/v1.0/token.wasm \
  --after  ./builds/v1.1/token.wasm
```

Output:

```
⚡ SoroBench — Diff Report: v1.0 → v1.1

  Function     Before        After         Delta         Change
  ─────────────────────────────────────────────────────────────
  transfer     4,821,304     3,944,102     -877,202      ▼ 18.2% ✅
  mint         3,104,877     3,089,441     -15,436       ▼  0.5% ✅
  swap         9,201,004    10,445,887    +1,244,883     ▲ 13.5% ⚠️
  balance      1,204,331     1,204,331          0        → 0.0%

  ⚠️  swap exceeded regression threshold (+10%). Review before merging.
```

#### Save a baseline

```bash
sorobench baseline save --tag v1.0.0
```

#### Compare against baseline

```bash
sorobench baseline compare --tag v1.0.0
```

#### Generate flame graph

```bash
sorobench flamegraph --function transfer --out ./reports/transfer.svg
```

#### Serve the dashboard locally

```bash
sorobench dashboard
# Opens at http://localhost:4242
```

---

### Rust Harness

Write benchmarks directly in Rust alongside your contract using the `sorobench` crate:

```rust
// benches/contract_benchmarks.rs

use sorobench::{bench, BenchGroup, BenchRunner, SoroEnv};
use token::{TokenClient, TokenContract};

fn bench_transfer(c: &mut BenchGroup) {
    // Setup: create env and deploy contract
    let env = SoroEnv::new();
    let contract_id = env.deploy(TokenContract {});
    let client = TokenClient::new(&env, &contract_id);

    // Mint tokens to sender
    let sender = env.account("sender");
    let recipient = env.account("recipient");
    client.mint(&sender, &1_000_000_000i128);

    // Benchmark the transfer function
    c.bench("transfer_1m_stroops", || {
        client.transfer(&sender, &recipient, &1_000_000i128);
    });

    c.bench("transfer_max_amount", || {
        client.transfer(&sender, &recipient, &i128::MAX);
    });
}

fn bench_balance(c: &mut BenchGroup) {
    let env = SoroEnv::new();
    let contract_id = env.deploy(TokenContract {});
    let client = TokenClient::new(&env, &contract_id);
    let account = env.account("account");

    c.bench("balance_existing_account", || {
        client.balance(&account);
    });

    c.bench("balance_new_account", || {
        let new_account = env.random_account();
        client.balance(&new_account);
    });
}

// Parameterized: benchmark across list sizes
fn bench_batch_transfer(c: &mut BenchGroup) {
    let env = SoroEnv::new();
    let contract_id = env.deploy(TokenContract {});
    let client = TokenClient::new(&env, &contract_id);

    for n in [1, 10, 50, 100, 500] {
        let recipients: Vec<_> = (0..n).map(|_| env.random_account()).collect();
        c.bench(format!("batch_transfer_{n}_recipients"), || {
            client.batch_transfer(&env.account("sender"), &recipients, &1_000i128);
        });
    }
}

fn main() {
    let mut runner = BenchRunner::new();
    runner.group("transfer", bench_transfer);
    runner.group("balance", bench_balance);
    runner.group("batch_transfer", bench_batch_transfer);
    runner.run();
}
```

Run Rust benchmarks:

```bash
cargo bench
# SoroBench automatically picks up results from Cargo bench output
```

Or run through SoroBench directly:

```bash
sorobench run --harness rust
```

---

### TypeScript Runner

For teams running benchmarks against a live RPC (testnet or local node):

```typescript
import { BenchRunner, BenchSuite } from '@sorobench/runner';
import { Keypair, Networks } from '@stellar/stellar-sdk';

const runner = new BenchRunner({
  rpcUrl: 'https://soroban-testnet.stellar.org',
  networkPassphrase: Networks.TESTNET,
  sourceKeypair: Keypair.fromSecret(process.env.STELLAR_SECRET_KEY!),
  warmupRuns: 3,
  samplingRuns: 10,
});

const suite: BenchSuite = {
  name: 'Token Contract',
  contractId: 'CXXX...',
  benchmarks: [
    {
      name: 'transfer — small amount',
      method: 'transfer',
      args: [
        { type: 'address', value: 'GABC...' },
        { type: 'address', value: 'GXYZ...' },
        { type: 'i128', value: BigInt(1_000) },
      ],
    },
    {
      name: 'transfer — large amount',
      method: 'transfer',
      args: [
        { type: 'address', value: 'GABC...' },
        { type: 'address', value: 'GXYZ...' },
        { type: 'i128', value: BigInt(1_000_000_000) },
      ],
    },
    {
      name: 'balance — existing account',
      method: 'balance',
      args: [{ type: 'address', value: 'GABC...' }],
    },
  ],
};

const results = await runner.run(suite);
runner.printReport(results);
await runner.saveBaseline(results, './bench-reports/baseline.json');
```

---

### Web Dashboard

```bash
sorobench dashboard
# Opens at http://localhost:4242
```

Dashboard tabs:

- **Overview** — latest benchmark run summary across all contracts
- **Function Explorer** — drill into any function's full metric breakdown
- **Trend Charts** — instruction count and fee history over time (per git commit)
- **Flame Graphs** — interactive SVG call trace viewer
- **Comparisons** — side-by-side diff of any two benchmark runs
- **Thresholds** — configure and view budget limits per function
- **Baselines** — manage saved baselines and view regression history

---

## 📐 Benchmark Metrics

SoroBench measures and reports the following for every benchmark:

### Instruction Metrics

| Metric                | Description                                |
| --------------------- | ------------------------------------------ |
| `instructions`        | Total CPU instructions consumed            |
| `instructions_pct`    | % of Soroban max instruction budget (100M) |
| `instructions_p50`    | Median across sampling runs                |
| `instructions_p95`    | 95th percentile (worst-case indicator)     |
| `instructions_stddev` | Standard deviation (consistency indicator) |

### Memory Metrics

| Metric      | Description                             |
| ----------- | --------------------------------------- |
| `mem_bytes` | Total memory allocated during execution |
| `mem_pct`   | % of Soroban max memory budget (40MB)   |

### Ledger I/O Metrics

| Metric          | Description                      |
| --------------- | -------------------------------- |
| `read_entries`  | Number of ledger entries read    |
| `read_bytes`    | Total bytes read from ledger     |
| `write_entries` | Number of ledger entries written |
| `write_bytes`   | Total bytes written to ledger    |

### Fee Metrics

| Metric            | Description                       |
| ----------------- | --------------------------------- |
| `fee_total_xlm`   | Total estimated fee in XLM        |
| `fee_cpu_xlm`     | CPU instruction component of fee  |
| `fee_read_xlm`    | Ledger read component of fee      |
| `fee_write_xlm`   | Ledger write component of fee     |
| `fee_event_xlm`   | Event bytes component of fee      |
| `fee_tx_size_xlm` | Transaction size component of fee |

### Event Metrics

| Metric        | Description               |
| ------------- | ------------------------- |
| `event_count` | Number of events emitted  |
| `event_bytes` | Total bytes of event data |

---

## 🚨 Budget Thresholds & Alerts

Define per-function or global budgets in `sorobench.config.json`:

```json
{
  "thresholds": {
    "global": {
      "maxInstructions": 50000000,
      "maxMemBytes": 20000000,
      "maxFeeXlm": 0.05,
      "regressionThresholdPct": 10
    },
    "functions": {
      "transfer": {
        "maxInstructions": 5000000,
        "maxFeeXlm": 0.005,
        "maxReadBytes": 4096,
        "maxWriteBytes": 1024
      },
      "swap": {
        "maxInstructions": 25000000,
        "maxFeeXlm": 0.02
      }
    }
  },
  "alerts": {
    "slack": {
      "webhookUrl": "https://hooks.slack.com/services/XXX/YYY/ZZZ",
      "onThresholdBreached": true,
      "onRegression": true
    },
    "webhook": {
      "url": "https://your-server.io/bench-alerts",
      "onThresholdBreached": true
    }
  }
}
```

When a threshold is breached, SoroBench exits with a non-zero code (for CI) and posts alerts:

```
❌ Threshold Exceeded: swap

  Metric          Measured        Threshold       Over By
  ──────────────────────────────────────────────────────
  instructions    27,441,009      25,000,000      +9.8%
  fee_total_xlm   0.02241         0.02000         +12.1%

  Action required before merge.
```

---

## 📋 Benchmark Suites

Define reusable benchmark suites in YAML for CI and team sharing:

```yaml
# benches/token-suite.yaml
name: Token Contract Full Suite
contract: token
wasm: ./target/wasm32-unknown-unknown/release/token.wasm

setup:
  accounts:
    - id: alice
      initial_balance: 1000000000
    - id: bob
      initial_balance: 0

benchmarks:
  - name: transfer small
    function: transfer
    args:
      from: alice
      to: bob
      amount: 1000

  - name: transfer large
    function: transfer
    args:
      from: alice
      to: bob
      amount: 999999999

  - name: balance cold
    function: balance
    args:
      account: bob

  - name: balance warm
    function: balance
    args:
      account: alice

  - name: mint — parameterized
    function: mint
    parameterize:
      amount: [1000, 100000, 10000000, 1000000000]
```

Run a suite:

```bash
sorobench run --suite ./benches/token-suite.yaml
```

---

## 🔥 Flame Graphs & Call Traces

SoroBench generates SVG flame graphs from the Soroban host call trace, letting you see exactly which internal operations consume the most instructions.

```bash
# Generate flame graph for a specific function
sorobench flamegraph --function swap --out ./reports/swap-flamegraph.svg

# Generate for all functions
sorobench flamegraph --all --out ./reports/flamegraphs/
```

Flame graph example breakdown for `swap`:

```
swap (9,201,004 instructions — 100%)
├── authorize_invocation         (1,840,200 — 20.0%)
│   └── verify_signature         (1,104,120 — 12.0%)
├── get_reserves                 (1,012,110 — 11.0%)
│   ├── read_ledger_entry        (  506,055 —  5.5%)
│   └── decode_xdr               (  506,055 —  5.5%)
├── compute_swap_amount          (  736,080 —  8.0%)
├── update_reserves              (2,944,321 — 32.0%)
│   ├── write_ledger_entry       (1,840,200 — 20.0%)
│   └── encode_xdr               (1,104,121 — 12.0%)
└── emit_swap_event              (  368,040 —  4.0%)
```

---

## 📈 Historical Tracking & Regression Detection

SoroBench stores benchmark results in a local SQLite database (`.sorobench/history.db`) keyed by git commit SHA, enabling trend analysis across your development history.

### Saving results

```bash
# Auto-tagged with current git commit SHA and branch
sorobench run --save

# Manually tag a result
sorobench run --save --tag "post-swap-optimization"
```

### Viewing trends

```bash
# Show instruction trend for `swap` over last 20 commits
sorobench history --function swap --last 20

# Output:
# commit   branch    instructions    fee (XLM)   date
# a1b2c3   main      9,201,004       0.00654     2025-06-01
# d4e5f6   main     11,840,220       0.00841     2025-05-28  ▲ +28.7%
# g7h8i9   main      9,150,004       0.00650     2025-05-21
```

### Regression detection

```bash
# Compare HEAD against main branch baseline
sorobench regression --base main --head HEAD

# Compare against a saved tag
sorobench regression --base v1.0.0
```

---

## 🏢 Enterprise Features

### Shared Team Baselines

Store baselines in a shared PostgreSQL instance accessible to the whole team:

```json
{
  "baseline": {
    "store": "postgres",
    "connectionString": "postgresql://user:pass@bench-db:5432/sorobench",
    "regressionThresholdPct": 10
  }
}
```

### Multi-Contract Protocol Benchmarking

Benchmark an entire DeFi protocol suite — AMM, token, governance, oracle — in one run:

```bash
sorobench run --config ./sorobench.config.json
# Runs all contracts defined under "contracts" in config
```

### PDF Benchmark Reports

Export structured benchmark reports for engineering reviews:

```bash
sorobench report export \
  --run latest \
  --format pdf \
  --out ./reports/q2-bench-report.pdf
```

### Benchmark Budgets in Code Reviews

Embed benchmark budgets directly in your contract source as machine-readable annotations:

```rust
/// @sorobench:budget instructions=5000000
/// @sorobench:budget fee_xlm=0.005
/// @sorobench:budget write_bytes=1024
pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
    // ...
}
```

SoroBench reads these annotations and enforces them automatically without requiring config file entries.

---

## ⚙️ CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/sorobench.yml
name: Contract Benchmarks

on:
  pull_request:
    paths:
      - 'contracts/**'

jobs:
  bench:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # needed for git history comparison

      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: wasm32-unknown-unknown

      - name: Build contracts
        run: cargo build --target wasm32-unknown-unknown --release

      - name: Install SoroBench
        run: npm install -g @sorobench/cli

      - name: Run benchmarks
        run: sorobench run --save --out ./bench-reports
        env:
          STELLAR_SECRET_KEY: ${{ secrets.STELLAR_TEST_SECRET }}

      - name: Compare against base branch
        run: sorobench regression --base ${{ github.base_ref }} --head HEAD --format github-comment
        id: regression

      - name: Post PR comment
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `${{ steps.regression.outputs.comment }}`
            })

      - name: Upload reports
        uses: actions/upload-artifact@v4
        with:
          name: bench-reports
          path: ./bench-reports/
```

**Example PR Comment:**

```
⚡ SoroBench — Benchmark Diff (main → feature/swap-v2)

| Function   | Before (main)  | After (PR)     | Change       |
|------------|----------------|----------------|--------------|
| transfer   | 4,821,304      | 3,944,102      | ▼ -18.2% ✅  |
| swap       | 9,201,004      | 10,445,887     | ▲ +13.5% ⚠️  |
| mint       | 3,104,877      | 3,089,441      | ▼  -0.5% ✅  |
| balance    | 1,204,331      | 1,204,331      | →   0.0% ✅  |

⚠️ swap regressed beyond 10% threshold. Please review before merging.

📊 Full report: [View HTML Report](https://artifacts.example.com/bench-20250605.html)
```

### GitLab CI

```yaml
sorobench:
  image: rust:1.74
  stage: test
  before_script:
    - rustup target add wasm32-unknown-unknown
    - npm install -g @sorobench/cli
  script:
    - cargo build --target wasm32-unknown-unknown --release
    - sorobench run --save --ci --out ./bench-reports
    - sorobench regression --base $CI_MERGE_REQUEST_TARGET_BRANCH_NAME
  artifacts:
    paths:
      - bench-reports/
    reports:
      metrics: bench-reports/metrics.txt
  only:
    changes:
      - contracts/**/*
```

---

## 🗂 Project Structure

```
sorobench/
│
├── packages/
│   ├── cli/                              # @sorobench/cli — global CLI
│   │   ├── src/
│   │   │   ├── commands/
│   │   │   │   ├── run.ts                # `sorobench run`
│   │   │   │   ├── compare.ts            # `sorobench compare`
│   │   │   │   ├── baseline.ts           # `sorobench baseline`
│   │   │   │   ├── regression.ts         # `sorobench regression`
│   │   │   │   ├── flamegraph.ts         # `sorobench flamegraph`
│   │   │   │   ├── history.ts            # `sorobench history`
│   │   │   │   ├── report.ts             # `sorobench report`
│   │   │   │   └── dashboard.ts          # `sorobench dashboard`
│   │   │   ├── output/
│   │   │   │   ├── terminal.ts           # Color terminal reporter
│   │   │   │   ├── html.ts               # HTML report generator
│   │   │   │   ├── json.ts               # JSON output
│   │   │   │   ├── csv.ts                # CSV export
│   │   │   │   └── github-comment.ts     # GitHub PR comment formatter
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── runner/                           # @sorobench/runner — TS benchmark runner
│   │   ├── src/
│   │   │   ├── BenchRunner.ts            # Main runner class
│   │   │   ├── SorobanExecutor.ts        # Soroban RPC execution wrapper
│   │   │   ├── MetricsCollector.ts       # Resource metric collection
│   │   │   ├── Sampler.ts                # Multi-run sampling & statistics
│   │   │   ├── BaselineManager.ts        # Baseline save/load/compare
│   │   │   ├── ThresholdEvaluator.ts     # Budget threshold checks
│   │   │   ├── types.ts                  # Shared types
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── rust-harness/                     # sorobench crate (Rust)
│   │   ├── src/
│   │   │   ├── lib.rs                    # Crate entry point
│   │   │   ├── bench_group.rs            # BenchGroup API
│   │   │   ├── bench_runner.rs           # BenchRunner entry point
│   │   │   ├── soro_env.rs               # Soroban test env wrapper
│   │   │   ├── metrics.rs                # Instruction/memory metering
│   │   │   ├── output.rs                 # Result serialization
│   │   │   └── macros.rs                 # #[bench] macro definition
│   │   └── Cargo.toml
│   │
│   ├── flamegraph/                       # @sorobench/flamegraph — SVG generator
│   │   ├── src/
│   │   │   ├── CallTraceParser.ts        # Soroban host trace parser
│   │   │   ├── FlameGraphBuilder.ts      # Flame graph data structure
│   │   │   ├── SVGRenderer.ts            # SVG output renderer
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── storage/                          # @sorobench/storage — history & baselines
│   │   ├── src/
│   │   │   ├── SQLiteStorage.ts          # Local SQLite history store
│   │   │   ├── PostgresStorage.ts        # Team/enterprise PostgreSQL store
│   │   │   ├── FileStorage.ts            # JSON file baseline store
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── dashboard/                        # Web dashboard (React)
│       ├── src/
│       │   ├── components/
│       │   │   ├── Overview/             # Latest run summary
│       │   │   ├── FunctionExplorer/     # Per-function drill-down
│       │   │   ├── TrendChart/           # Historical trend charts
│       │   │   ├── FlameGraphViewer/     # Interactive SVG viewer
│       │   │   ├── ComparisonTable/      # Side-by-side diff view
│       │   │   └── ThresholdEditor/      # Budget config UI
│       │   ├── pages/
│       │   │   ├── Dashboard.tsx
│       │   │   ├── History.tsx
│       │   │   ├── Compare.tsx
│       │   │   └── Settings.tsx
│       │   └── main.tsx
│       └── package.json
│
├── benches/                              # Example benchmark suites
│   ├── token-suite.yaml
│   ├── defi-suite.yaml
│   └── examples/
│       └── token/
│           └── benches/
│               └── contract_benchmarks.rs
│
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml               # Includes PostgreSQL for team use
│
├── .github/
│   └── workflows/
│       ├── ci.yml                        # Test & lint
│       ├── release.yml                   # Publish npm + crates.io
│       └── sorobench.yml                 # Example consumer workflow
│
├── .sorobench/
│   ├── baseline.json                     # Default local baseline
│   └── history.db                        # Local SQLite history
│
├── sorobench.config.json                 # Project config
├── .env.example
├── package.json                          # Monorepo root (npm workspaces)
├── turbo.json                            # Turborepo pipeline
└── README.md
```

---

## 🗺 Roadmap

- [ ] **v0.2.0**: Advanced Flame Graphs with per-instruction gas cost visualization
- [ ] **v0.3.0**: Integration with Stellar RPC for live mainnet fee projections
- [ ] **v0.4.0**: Multi-contract cross-invocation profiling
- [ ] **v1.0.0**: Stable release with full CI/CD integration suites

## 🤝 Contributing

We welcome contributions from the Stellar developer community!

```bash
# Fork and clone
git clone https://github.com/vicistar-star/SoroBench.git
cd SoroBench

# Install Node dependencies
npm install

# Build Rust harness
cargo build

# Run tests
npm test
cargo test

# Start dashboard dev server
npm run dev:dashboard
```

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for our code of conduct and pull request process. We especially welcome:

- New output format targets (JUnit XML, CTRF, etc.)
- Additional Soroban metric dimensions as the protocol evolves
- Rust harness ergonomics improvements
- Dashboard UX contributions

---

## 🔒 Security

Please refer to our [SECURITY.md](SECURITY.md) for reporting vulnerabilities.

## 📄 License

SoroBench is released under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- [Stellar Development Foundation](https://stellar.org) for Soroban, `soroban-env-host`, and the resource metering APIs
- [Criterion.rs](https://github.com/bheisler/criterion.rs) for inspiration on Rust benchmarking ergonomics
- [Brendan Gregg](https://brendangregg.com/flamegraphs.html) for the flame graph methodology
- The Stellar developer community for feedback and early testing

---

<p align="center">
  Built with ❤️ for the Stellar ecosystem<br/>
  <a href="https://soroban.stellar.org">Soroban Docs</a> ·
  <a href="https://discord.gg/stellar">Stellar Discord</a> ·
  <a href="https://github.com/vicistar-star/SoroBench/issues">Report an Issue</a>
</p>
