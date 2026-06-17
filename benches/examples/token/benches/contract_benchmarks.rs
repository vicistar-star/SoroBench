// benches/examples/token/benches/contract_benchmarks.rs

use sorobench::{bench, BenchGroup, BenchRunner, SoroEnv};
use token::{TokenClient, TokenContract};

fn bench_transfer(c: &mut BenchGroup) {
    let env = SoroEnv::new();
    let contract_id = env.deploy(TokenContract {});
    let client = TokenClient::new(&env, &contract_id);

    let sender = env.account("sender");
    let recipient = env.account("recipient");
    client.mint(&sender, &1_000_000_000i128);

    c.bench("transfer_1k", || {
        client.transfer(&sender, &recipient, &1_000i128);
    });

    c.bench("transfer_1m", || {
        client.transfer(&sender, &recipient, &1_000_000i128);
    });
}

fn bench_balance(c: &mut BenchGroup) {
    let env = SoroEnv::new();
    let contract_id = env.deploy(TokenContract {});
    let client = TokenClient::new(&env, &contract_id);

    let account = env.account("user");
    client.mint(&account, &1_000i128);

    c.bench("balance_warm", || {
        client.balance(&account);
    });

    let cold_account = env.account("cold_user");
    c.bench("balance_cold", || {
        client.balance(&cold_account);
    });
}

fn bench_batch_transfer(c: &mut BenchGroup) {
    let env = SoroEnv::new();
    let contract_id = env.deploy(TokenContract {});
    let client = TokenClient::new(&env, &contract_id);

    let sender = env.account("sender");
    client.mint(&sender, &1_000_000_000i128);

    for n in [1, 10, 50, 100, 500] {
        let recipients: Vec<_> = (0..n).map(|_| env.random_account()).collect();
        c.bench(format!("batch_transfer_{n}_recipients"), || {
            client.batch_transfer(&sender, &recipients, &1_000i128);
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
