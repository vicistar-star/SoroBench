import type { BenchFunctionResult } from "./types";
import type { SimulationResult, SorobanExecutor } from "./SorobanExecutor";
import { MetricsCollector } from "./MetricsCollector";

export class Sampler {
  private warmupRuns: number;
  private samplingRuns: number;
  private metricsCollector: MetricsCollector;

  constructor(warmupRuns: number, samplingRuns: number) {
    this.warmupRuns = warmupRuns;
    this.samplingRuns = samplingRuns;
    this.metricsCollector = new MetricsCollector();
  }

  async sample(
    executor: SorobanExecutor,
    contractId: string,
    method: string,
    args: any[],
  ): Promise<BenchFunctionResult> {
    for (let i = 0; i < this.warmupRuns; i++) {
      await executor.simulateTransaction(contractId, method, args);
    }

    const samples: SimulationResult[] = [];
    for (let i = 0; i < this.samplingRuns; i++) {
      const result = await executor.simulateTransaction(contractId, method, args);
      samples.push(result);
    }

    const successfulSamples = samples.filter((s) => s.success);
    if (successfulSamples.length === 0) {
      throw new Error(
        `All ${this.samplingRuns} sampling runs failed for ${contractId}:${method}. First error: ${samples[0]?.error}`,
      );
    }

    return this.aggregateResults(successfulSamples, method);
  }

  private aggregateResults(
    samples: SimulationResult[],
    functionName: string,
  ): BenchFunctionResult {
    const n = samples.length;
    if (n === 0) {
      const empty: SimulationResult = {
        success: false,
        instructions: 0,
        memBytes: 0,
        readEntries: 0,
        readBytes: 0,
        writeEntries: 0,
        writeBytes: 0,
        eventCount: 0,
        eventBytes: 0,
        feeTotal: 0,
        footprint: [],
      };
      return this.metricsCollector.collect(empty, functionName);
    }

    const instructionsValues = samples.map((s) => s.instructions);
    const memBytesValues = samples.map((s) => s.memBytes);
    const readEntriesValues = samples.map((s) => s.readEntries);
    const readBytesValues = samples.map((s) => s.readBytes);
    const writeEntriesValues = samples.map((s) => s.writeEntries);
    const writeBytesValues = samples.map((s) => s.writeBytes);
    const eventCountValues = samples.map((s) => s.eventCount);
    const eventBytesValues = samples.map((s) => s.eventBytes);
    const feeValues = samples.map((s) => s.feeTotal);

    const meanInstructions = this.mean(instructionsValues);
    const meanMemBytes = this.mean(memBytesValues);
    const meanReadEntries = this.mean(readEntriesValues);
    const meanReadBytes = this.mean(readBytesValues);
    const meanWriteEntries = this.mean(writeEntriesValues);
    const meanWriteBytes = this.mean(writeBytesValues);
    const meanEventCount = this.mean(eventCountValues);
    const meanEventBytes = this.mean(eventBytesValues);
    const meanFee = this.mean(feeValues);

    const instructionsP50 = this.percentile(instructionsValues, 50);
    const instructionsP95 = this.percentile(instructionsValues, 95);
    const instructionsStddev = this.stddev(instructionsValues, meanInstructions);

    const representative: SimulationResult = {
      success: true,
      instructions: Math.round(meanInstructions),
      memBytes: Math.round(meanMemBytes),
      readEntries: Math.round(meanReadEntries),
      readBytes: Math.round(meanReadBytes),
      writeEntries: Math.round(meanWriteEntries),
      writeBytes: Math.round(meanWriteBytes),
      eventCount: Math.round(meanEventCount),
      eventBytes: Math.round(meanEventBytes),
      feeTotal: Math.round(meanFee),
      footprint: samples[samples.length - 1]?.footprint ?? [],
    };

    const result = this.metricsCollector.collect(representative, functionName);
    result.instructionsP50 = instructionsP50;
    result.instructionsP95 = instructionsP95;
    result.instructionsStddev = instructionsStddev;

    return result;
  }

  computeStats(samples: number[]): {
    p50: number;
    p95: number;
    stddev: number;
    mean: number;
  } {
    const m = this.mean(samples);
    return {
      p50: this.percentile(samples, 50),
      p95: this.percentile(samples, 95),
      stddev: this.stddev(samples, m),
      mean: m,
    };
  }

  private mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private percentile(sortedValues: number[], pct: number): number {
    if (sortedValues.length === 0) return 0;
    const sorted = [...sortedValues].sort((a, b) => a - b);
    const index = Math.ceil((pct / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
  }

  private stddev(values: number[], meanVal: number): number {
    if (values.length <= 1) return 0;
    const squaredDiffs = values.map((v) => (v - meanVal) ** 2);
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
  }
}
