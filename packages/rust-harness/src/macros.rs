/// Macro to define a standalone benchmark function.
///
/// Expands to a test that creates an environment, runs the benchmark,
/// and prints results.
#[macro_export]
macro_rules! bench {
    ($name:ident, $func:expr) => {
        #[test]
        fn $name() {
            let env = $crate::SoroEnv::new();
            let mut group = $crate::BenchGroup::new(stringify!($name), &env);
            group.bench(stringify!($name), || $func(&env));
            for result in group.results() {
                println!("{:?}", result);
            }
        }
    };
}

/// Macro to define a benchmark group inline.
///
/// Usage:
/// ```ignore
/// bench_group!(my_group, |group| {
///     group.bench("transfer", || { /* ... */ });
/// });
/// ```
#[macro_export]
macro_rules! bench_group {
    ($name:ident, $body:expr) => {
        #[test]
        fn $name() {
            let env = $crate::SoroEnv::new();
            let mut group = $crate::BenchGroup::new(stringify!($name), &env);
            let func: fn(&mut $crate::BenchGroup) = $body;
            func(&mut group);
            for result in group.results() {
                println!("{:?}", result);
            }
        }
    };
}
