use serde::{Deserialize, Serialize};
use crate::bench_group::{BenchGroup, BenchResult};
use crate::output::OutputFormatter;

/// Result of running an entire benchmark group.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GroupResult {
    pub group_name: String,
    pub results: Vec<BenchResult>,
}

/// Orchestrates benchmark groups and collects results.
pub struct BenchRunner {
    groups: Vec<(String, fn(&mut BenchGroup))>,
}

impl BenchRunner {
    pub fn new() -> Self {
        Self {
            groups: Vec::new(),
        }
    }

    pub fn group(&mut self, name: &str, f: fn(&mut BenchGroup)) {
        self.groups.push((name.to_string(), f));
    }

    pub fn run(&mut self) -> Vec<GroupResult> {
        let mut group_results: Vec<GroupResult> = Vec::new();

        for (name, func) in &self.groups {
            let env = crate::SoroEnv::new();
            let mut group = BenchGroup::new(name, &env);
            func(&mut group);
            group_results.push(GroupResult {
                group_name: name.clone(),
                results: group.results().clone(),
            });
        }

        // Print summary and write JSON output
        let summary = OutputFormatter::format_summary(&group_results);
        println!("{}", summary);

        let json = OutputFormatter::format_json(&group_results);
        println!("{}", json);

        group_results
    }
}

impl Default for BenchRunner {
    fn default() -> Self {
        Self::new()
    }
}
