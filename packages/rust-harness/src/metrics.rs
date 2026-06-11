use serde::{Deserialize, Serialize};
use crate::soro_env::SoroEnv;

/// A snapshot of budget metrics at a point in time.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetricsSnapshot {
    pub instructions: u64,
    pub memory_bytes: u64,
    pub read_entry_count: u64,
    pub write_entry_count: u64,
    pub event_count: u64,
}

/// The delta (difference) between two metric snapshots.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetricsDelta {
    pub instructions: u64,
    pub memory_bytes: u64,
    pub read_entry_count: u64,
    pub write_entry_count: u64,
    pub event_count: u64,
}

/// Collects budget metrics from the Soroban environment.
pub struct MetricsCollector<'a> {
    env: &'a SoroEnv,
}

impl<'a> MetricsCollector<'a> {
    pub fn new(env: &'a SoroEnv) -> Self {
        Self { env }
    }

    pub fn collect(&self) -> MetricsSnapshot {
        let budget = self.env.env().cost_estimate().budget();
        MetricsSnapshot {
            instructions: budget.cpu_instruction_cost(),
            memory_bytes: budget.memory_bytes_cost(),
            read_entry_count: 0,
            write_entry_count: 0,
            event_count: 0,
        }
    }

    pub fn delta(&self, before: &MetricsSnapshot, after: &MetricsSnapshot) -> MetricsDelta {
        MetricsDelta {
            instructions: after.instructions.saturating_sub(before.instructions),
            memory_bytes: after.memory_bytes.saturating_sub(before.memory_bytes),
            read_entry_count: after.read_entry_count.saturating_sub(before.read_entry_count),
            write_entry_count: after.write_entry_count.saturating_sub(before.write_entry_count),
            event_count: after.event_count.saturating_sub(before.event_count),
        }
    }
}
