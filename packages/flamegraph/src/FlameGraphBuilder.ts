import type { FlameGraphData } from "@sorobench/runner";

export interface Frame {
  name: string;
  value: number;
  depth: number;
  x: number;
  width: number;
}

export class FlameGraphBuilder {
  build(data: FlameGraphData): Frame[] {
    const frames: Frame[] = [];
    this.layout(data, 0, 0, 1, frames);
    return frames;
  }

  private layout(
    node: FlameGraphData,
    depth: number,
    xOffset: number,
    xLimit: number,
    frames: Frame[],
  ): void {
    if (node.value <= 0) return;

    const sorted = [...node.children].sort((a, b) => b.value - a.value);
    const total = node.value;

    let x = xOffset;
    for (const child of sorted) {
      const width = child.value / total;
      frames.push({
        name: child.name,
        value: child.value,
        depth,
        x: x,
        width: Math.min(width, xLimit - (x - xOffset)),
      });
      this.layout(child, depth + 1, x, x + width, frames);
      x += width;
    }
  }
}
