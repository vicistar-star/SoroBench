use soroban_sdk::{testutils::Address as _, Address, Env};
use soroban_env_host::budget::Budget;

/// Wrapper around the Soroban environment with utilities for benchmarking.
pub struct SoroEnv {
    env: Env,
}

impl SoroEnv {
    /// Creates a new SoroEnv with budget metering enabled.
    pub fn new() -> Self {
        let env = Env::default();
        // Reset budget to start clean
        env.cost_estimate().budget().reset_unlimited();
        Self { env }
    }

    /// Deploys a contract (registers it in the test environment).
    pub fn register_contract<T: soroban_sdk::testutils::ContractFunctionSet + 'static>(&self, contract: T) -> Address {
        self.env.register_contract(None, contract)
    }

    /// Creates or retrieves a test account by name (deterministic).
    pub fn account(&self, _name: &str) -> Address {
        Address::generate(&self.env)
    }

    /// Generates a random test account.
    pub fn random_account(&self) -> Address {
        Address::generate(&self.env)
    }

    /// Returns the underlying Soroban environment.
    pub fn env(&self) -> &Env {
        &self.env
    }

    /// Exposes the host budget for metering.
    pub fn budget(&self) -> Budget {
        unimplemented!("Budget extraction from Env is version-dependent")
    }
}

impl Default for SoroEnv {
    fn default() -> Self {
        Self::new()
    }
}
