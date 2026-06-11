use crate::bench_runner::GroupResult;

/// Formats and writes benchmark results to various outputs.
pub struct OutputFormatter;

impl OutputFormatter {
    /// Produces an ASCII summary table matching the README terminal output style.
    pub fn format_summary(results: &[GroupResult]) -> String {
        let mut output = String::new();
        output.push_str("⚡ SoroBench v0.1.0\n\n");

        for grp in results {
            output.push_str(&format!("Group: {}\n", grp.group_name));
            output.push_str(&format!(
                "{:<25} {:>12} {:>14} {:>12} {:>20}\n",
                "Function", "Instructions", "Mem (bytes)", "Fee (XLM)", "Budget Usage"
            ));
            output.push_str(&"-".repeat(85));
            output.push('\n');

            for r in &grp.results {
                let pct = if r.instructions > 0 {
                    r.instructions as f64 / 100_000_000.0 * 100.0
                } else {
                    0.0
                };
                let bar_len = (pct / 10.0).round() as usize;
                let bar: String = "█".repeat(bar_len.min(10));
                let empty: String = "░".repeat(10usize.saturating_sub(bar_len));
                let fee = r.instructions as f64 * 1e-7;

                output.push_str(&format!(
                    "{:<25} {:>12} {:>14} {:>12.8} {:>3.0}% {}{}\n",
                    r.name, r.instructions, r.mem_bytes, fee, pct, bar, empty
                ));
            }
            output.push('\n');
        }

        output
    }

    /// Serializes results to a JSON string.
    pub fn format_json(results: &[GroupResult]) -> String {
        serde_json::to_string_pretty(results).unwrap_or_else(|_| "[]".to_string())
    }

    /// Writes results as JSON to the given file path.
    pub fn write_file(results: &[GroupResult], path: &str) -> std::io::Result<()> {
        let json = Self::format_json(results);
        std::fs::write(path, json)
    }
}
