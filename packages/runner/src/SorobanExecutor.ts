import {
  SorobanRpc,
  TransactionBuilder,
  Operation,
  Keypair,
  nativeToScVal,
  Account,
} from "@stellar/stellar-sdk";

export interface SimulationResult {
  success: boolean;
  instructions: number;
  memBytes: number;
  readEntries: number;
  readBytes: number;
  writeEntries: number;
  writeBytes: number;
  eventCount: number;
  eventBytes: number;
  feeTotal: number;
  footprint: string[];
  error?: string;
}

export class SorobanExecutor {
  private server: SorobanRpc.Server;
  private networkPassphrase: string;
  private sourceKeypair?: Keypair;

  constructor(rpcUrl: string, networkPassphrase: string, sourceKeypair?: Keypair) {
    this.server = new SorobanRpc.Server(rpcUrl);
    this.networkPassphrase = networkPassphrase;
    this.sourceKeypair = sourceKeypair;
  }

  async simulateTransaction(
    contractId: string,
    method: string,
    args: any[],
  ): Promise<SimulationResult> {
    const kp = this.sourceKeypair ?? Keypair.random();
    const publicKey = kp.publicKey();

    let sourceAccount: Account;
    try {
      sourceAccount = await this.server.getAccount(publicKey);
    } catch {
      sourceAccount = new Account(publicKey, "0");
    }

    const tx = new TransactionBuilder(sourceAccount, {
      fee: "100",
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(
        Operation.invokeContractFunction({
          contract: contractId,
          function: method,
          args: args.map((a) => this.toScVal(a)),
        }),
      )
      .setTimeout(30)
      .build();

    const rawResponse = await this.server.simulateTransaction(tx);
    const response = SorobanRpc.parseRawSimulation(rawResponse);

    if (SorobanRpc.Api.isSimulationError(response)) {
      return {
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
        error: response.error,
      };
    }

    if (SorobanRpc.Api.isSimulationSuccess(response)) {
      return this.parseSuccessResponse(response);
    }

    return {
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
      error: "Simulation requires state restoration",
    };
  }

  private parseSuccessResponse(
    response: SorobanRpc.Api.SimulateTransactionSuccessResponse,
  ): SimulationResult {
    const cost = response.cost;
    const instructions = parseInt(cost.cpuInsns) || 0;
    const memBytes = parseInt(cost.memBytes) || 0;

    const sorobanData = response.transactionData.build();
    const resources = sorobanData.resources();
    const readBytes = resources.readBytes();
    const writeBytes = resources.writeBytes();

    const readEntries = response.transactionData.getReadOnly().length;
    const writeEntries = response.transactionData.getReadWrite().length;

    const events = response.events || [];
    const eventCount = events.length;
    const eventBytes = events.reduce((sum: number, evt: any) => {
      try {
        return sum + evt.toXDR().length;
      } catch {
        return sum;
      }
    }, 0);

    const feeStroops = parseInt(response.minResourceFee || "0") || 0;

    return {
      success: true,
      instructions,
      memBytes,
      readEntries,
      readBytes,
      writeEntries,
      writeBytes,
      eventCount,
      eventBytes,
      feeTotal: feeStroops,
      footprint: [],
    };
  }

  private toScVal(value: unknown): any {
    if (value === null || value === undefined) {
      return nativeToScVal(null);
    }
    if (typeof value === "number") {
      return nativeToScVal(value, { type: "i128" });
    }
    if (typeof value === "string") {
      return nativeToScVal(value);
    }
    if (typeof value === "boolean") {
      return nativeToScVal(value);
    }
    if (Array.isArray(value)) {
      return nativeToScVal(value.map((v) => this.toScVal(v)));
    }
    if (typeof value === "object") {
      const entries = Object.entries(value as Record<string, unknown>).map(
        ([k, v]) => [k, this.toScVal(v)],
      );
      return nativeToScVal(Object.fromEntries(entries));
    }
    return nativeToScVal(value);
  }
}
