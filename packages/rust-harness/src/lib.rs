pub mod soro_env;
pub mod bench_group;

pub use soro_env::SoroEnv;
pub use bench_group::{BenchGroup, BenchResult};

/// Proc-macro placeholder for benchmarking.
/// In the future, this will be a full procedural macro.
/// For now, it's a macro_rules that helps structure the benchmarks.
#[macro_export]
macro_rules! bench {
    ($name:ident, $func:expr) => {
        #[test]
        fn $name() {
            let env = $crate::SoroEnv::new();
            let mut group = $crate::BenchGroup::new(stringify!($name), &env);
            group.bench(stringify!($name), || $func(&env));
            // In a real runner, we'd output the results here.
            for result in group.results() {
                println!("{:?}", result);
            }
        }
    };
}

pub const VERSION: &str = "0.1.0";
