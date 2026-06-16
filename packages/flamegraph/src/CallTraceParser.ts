import type { FlameGraphData } from "@sorobench/runner";

export class CallTraceParser {
  parse(traceData: string): FlameGraphData {
    const root: FlameGraphData = { name: "root", value: 0, children: [] };
    const lines = traceData.split("\n").filter((l) => l.trim().length > 0);
    const stack: { node: FlameGraphData; depth: number }[] = [];

    for (const line of lines) {
      const indent = line.search(/\S/);
      const trimmed = line.trim();

      const match = trimmed.match(
        /^(?:\[(\d+)\])?\s*(?:\|?\s*)?(\S[^(]*?)(?:\s*\((\d+)\))?\s*$/,
      );
      if (!match) continue;

      const name = match[2] || trimmed;
      const value = parseInt(match[3] || "1", 10);

      const node: FlameGraphData = { name, value, children: [] };

      while (stack.length > 0 && stack[stack.length - 1].depth >= indent) {
        stack.pop();
      }

      if (stack.length > 0) {
        stack[stack.length - 1].node.children.push(node);
      } else {
        root.children.push(node);
      }

      stack.push({ node, depth: indent });
    }

    this.aggregateValues(root);
    return root;
  }

  parseFromSimulation(simulationResult: any): FlameGraphData {
    const traceStr =
      simulationResult?.events
        ?.map((evt: any) => evt?.toString?.() ?? "")
        .filter(Boolean)
        .join("\n") ?? "";
    if (traceStr.length > 0) {
      return this.parse(traceStr);
    }
    return { name: "simulation", value: 0, children: [] };
  }

  private aggregateValues(node: FlameGraphData): number {
    if (node.children.length === 0) {
      return node.value;
    }
    let sum = 0;
    for (const child of node.children) {
      sum += this.aggregateValues(child);
    }
    node.value = sum;
    return sum;
  }
}
