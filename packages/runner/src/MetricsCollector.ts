import type { BenchFunctionResult } from "./types";
import type { SimulationResult } from "./SorobanExecutor";

const STROOPS_PER_XLM = 10_000_000;
const MAX_INSTRUCTIONS = 100_000_000;
const MAX_MEM_BYTES = 40_000_000;

const INSTR_WEIGHT_PER_UNIT = 1;
const READ_WEIGHT_PER_BYTE = 100;
const WRITE_WEIGHT_PER_BYTE = 200;
const EVENT_WEIGHT_PER_BYTE = 50;

export class MetricsCollector {
  collect(result: SimulationResult, functionName: string): BenchFunctionResult {
    const instructionsPct = (result.instructions / MAX_INSTRUCTIONS) * 100;
    const memPct = (result.memBytes / MAX_MEM_BYTES) * 100;
    const feeTotalXlm = result.feeTotal / STROOPS_PER_XLM;

    const instrWeight = result.instructions * INSTR_WEIGHT_PER_UNIT;
    const readWeight = result.readBytes * READ_WEIGHT_PER_BYTE;
    const writeWeight = result.writeBytes * WRITE_WEIGHT_PER_BYTE;
    const eventWeight = result.eventBytes * EVENT_WEIGHT_PER_BYTE;
    const totalWeight = instrWeight + readWeight + writeWeight + eventWeight;

    let feeCpuXlm = 0;
    let feeReadXlm = 0;
    let feeWriteXlm = 0;
    let feeEventXlm = 0;
    let feeTxSizeXlm = 0;

    if (totalWeight > 0) {
      feeCpuXlm = (instrWeight / totalWeight) * feeTotalXlm;
      feeReadXlm = (readWeight / totalWeight) * feeTotalXlm;
      feeWriteXlm = (writeWeight / totalWeight) * feeTotalXlm;
      feeEventXlm = (eventWeight / totalWeight) * feeTotalXlm;
    }

    const round = (v: number) => Math.round(v * 1_000_000) / 1_000_000;

    return {
      functionName,
      instructions: result.instructions,
      instructionsPct: round(instructionsPct),
      instructionsP50: 0,
      instructionsP95: 0,
      instructionsStddev: 0,
      memBytes: result.memBytes,
      memPct: round(memPct),
      readEntries: result.readEntries,
      readBytes: result.readBytes,
      writeEntries: result.writeEntries,
      writeBytes: result.writeBytes,
      eventCount: result.eventCount,
      eventBytes: result.eventBytes,
      feeTotalXlm: round(feeTotalXlm),
      feeCpuXlm: round(feeCpuXlm),
      feeReadXlm: round(feeReadXlm),
      feeWriteXlm: round(feeWriteXlm),
      feeEventXlm: round(feeEventXlm),
      feeTxSizeXlm: round(feeTxSizeXlm),
    };
  }
}
