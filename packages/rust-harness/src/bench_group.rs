use serde::{Deserialize, Serialize};
use crate::soro_env::SoroEnv;

/// Result of a single benchmark run.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BenchResult {
    pub name: String,
    pub instructions: u64,
    pub mem_bytes: u64,
    pub read_entries: u32,
    pub write_entries: u32,
    pub event_count: u32,
}

/// A group of related benchmarks.
pub struct BenchGroup<'a> {
    name: String,
    env: &'a SoroEnv,
    results: Vec<BenchResult>,
}

impl<'a> BenchGroup<'a> {
    /// Creates a new benchmark group.
    pub fn new(name: &str, env: &'a SoroEnv) -> Self {
        Self {
            name: name.to_string(),
            env,
            results: Vec::new(),
        }
    }

    /// Runs a benchmark closure and records metrics.
    pub fn bench(&mut self, name: &str, f: impl Fn()) {
        let mut budget = self.env.env().cost_estimate().budget();
        
        // Warmup (simple run, not recorded)
        f();
        
        // Reset budget before measurement
        budget.reset_unlimited();
        
        // Measure
        f();
        
        let instructions = budget.cpu_instruction_cost();
        let mem_bytes = budget.memory_bytes_cost();
        
        self.results.push(BenchResult {
            name: name.to_string(),
            instructions,
            mem_bytes,
            read_entries: 0,
            write_entries: 0,
            event_count: 0,
        });
    }

    /// Returns the name of the group.
    pub fn name(&self) -> &str {
        &self.name
    }

    /// Returns the collected results.
    pub fn results(&self) -> &Vec<BenchResult> {
        &self.results
    }
}
