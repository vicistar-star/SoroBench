import type {
  ThresholdsConfig,
  BenchFunctionResult,
  BenchContractResult,
  RegressionResult,
} from "./types.js";

export class ThresholdEvaluator {
  private thresholds: ThresholdsConfig;

  constructor(thresholds: ThresholdsConfig) {
    this.thresholds = thresholds;
  }

  evaluate(result: BenchFunctionResult): RegressionResult[] {
    const failures: RegressionResult[] = [];
    const config = {
      ...this.thresholds.global,
      ...(this.thresholds.functions[result.functionName] ?? {}),
    };

    const checks: { metric: string; measured: number; threshold: number | undefined }[] = [
      { metric: "instructions", measured: result.instructions, threshold: config.maxInstructions },
      { metric: "memBytes", measured: result.memBytes, threshold: config.maxMemBytes },
      { metric: "feeTotalXlm", measured: result.feeTotalXlm, threshold: config.maxFeeXlm },
      { metric: "readBytes", measured: result.readBytes, threshold: config.maxReadBytes },
      { metric: "writeBytes", measured: result.writeBytes, threshold: config.maxWriteBytes },
    ];

    for (const check of checks) {
      if (check.threshold !== undefined && check.measured > check.threshold) {
        failures.push({
          functionName: result.functionName,
          metric: check.metric,
          measured: check.measured,
          threshold: check.threshold,
          overBy: check.measured - check.threshold,
        });
      }
    }

    return failures;
  }

  evaluateAll(results: BenchContractResult): {
    passed: boolean;
    failures: RegressionResult[];
  } {
    const allFailures: RegressionResult[] = [];

    for (const fnResult of results.functions) {
      const fnFailures = this.evaluate(fnResult);
      allFailures.push(...fnFailures);
    }

    return {
      passed: allFailures.length === 0,
      failures: allFailures,
    };
  }
}
