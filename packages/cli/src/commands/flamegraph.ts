import * as fs from "node:fs";
import * as path from "node:path";
import type { Command } from "commander";
import { BenchRunner } from "@sorobench/runner";
import { loadConfig } from "../utils/loadConfig.js";

export function registerFlamegraphCommand(program: Command): void {
  program
    .command("flamegraph")
    .description("Generate flame graph SVG from benchmark call traces")
    .option("--function <name>", "Generate flame graph for a specific function")
    .option("--all", "Generate one flame graph per function")
    .option("--out <path>", "Output SVG path", "./flamegraph.svg")
    .option("--config <path>", "Path to config file")
    .action(async (options) => {
      try {
        const config = loadConfig(options.config);
        const runner = new BenchRunner(config);

        for (const contract of config.contracts) {
          runner.addTask(contract.name, contract.name, "__bench", []);
        }

        const result = await runner.run();

        const flamegraphSvg = generateFlamegraphSvg(result);
        const outputPath = path.resolve(options.out);
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        fs.writeFileSync(outputPath, flamegraphSvg, "utf-8");
        console.log(`Flame graph written to ${outputPath}`);
      } catch (err) {
        console.error("Flame graph generation failed:", err instanceof Error ? err.message : err);
        process.exit(1);
      }
    });
}

function generateFlamegraphSvg(result: {
  results: { contractName: string; functions: { functionName: string; instructions: number; instructionsPct: number }[] }[];
}): string {
  const width = 1200;
  const heightPerFrame = 20;
  const titleBar = 40;
  const padding = 10;

  const frames: { name: string; value: number; depth: number; x: number; width: number; color: string }[] = [];
  let maxDepth = 0;

  function hashColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 60%, 65%)`;
  }

  for (const cr of result.results) {
    for (const fr of cr.functions) {
      frames.push({
        name: `${cr.contractName}:${fr.functionName}`,
        value: fr.instructions,
        depth: 0,
        x: 0,
        width: 1,
        color: hashColor(fr.functionName),
      });
    }
  }

  const sortedFrames = frames.sort((a, b) => b.value - a.value);
  const totalValue = sortedFrames.reduce((s, f) => s + f.value, 0) || 1;
  const maxFramesPerDepth = 8;

  const visibleFrames = sortedFrames.slice(0, maxFramesPerDepth);
  let xOffset = 0;
  for (const frame of visibleFrames) {
    frame.x = xOffset;
    frame.width = frame.value / totalValue;
    xOffset += frame.width;
  }

  const svgHeight = titleBar + (maxDepth + 1) * (heightPerFrame + padding) + 40;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${svgHeight}" style="font-family: monospace; background: #1a1a2e;">
  <style>
    .frame:hover { stroke: #fff; stroke-width: 2; }
    .label { fill: #fff; font-size: 12px; pointer-events: none; }
    .title { fill: #e0e0e0; font-size: 18px; font-weight: bold; }
  </style>
  <text x="${width / 2}" y="28" text-anchor="middle" class="title">SoroBench Flame Graph</text>
`;

  for (const frame of visibleFrames) {
    const x = frame.x * (width - 100) + 50;
    const w = Math.max(1, frame.width * (width - 100));
    const y = titleBar + 10;
    const h = heightPerFrame;

    svg += `  <rect class="frame" x="${x}" y="${y}" width="${w}" height="${h}" fill="${frame.color}" rx="2">
    <title>${frame.name} \u2014 ${frame.value.toLocaleString()} instructions (${((frame.value / totalValue) * 100).toFixed(1)}%)</title>
  </rect>
`;
    if (w > 40) {
      svg += `  <text class="label" x="${x + 4}" y="${y + 14}">${frame.name.length * 7 > w ? frame.name.substring(0, Math.floor(w / 7)) + "\u2026" : frame.name}</text>
`;
    }
  }

  svg += `  <text x="50" y="${svgHeight - 10}" fill="#888" font-size="12">Total: ${totalValue.toLocaleString()} instructions</text>
</svg>`;

  return svg;
}
