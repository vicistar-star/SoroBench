import type { Frame } from "./FlameGraphBuilder.js";

const FRAME_HEIGHT = 18;
const PADDING_TOP = 40;
const PADDING_BOTTOM = 30;
const FONT_SIZE = 11;
const COLORS = [
  "#e06c75", "#98c379", "#61afef", "#c678dd", "#56b6c2",
  "#d19a66", "#abb2bf", "#be5046", "#7ec8e3", "#e5c07b",
  "#5c6370", "#8e44ad", "#27ae60", "#2980b9", "#d35400",
];

export class SVGRenderer {
  render(
    frames: Frame[],
    options?: { width?: number; height?: number; colors?: string[] },
  ): string {
    const width = options?.width ?? 1200;
    const maxDepth = frames.reduce((m, f) => Math.max(m, f.depth), 0) + 1;
    const height = options?.height ?? PADDING_TOP + maxDepth * FRAME_HEIGHT + PADDING_BOTTOM;
    const colors = options?.colors ?? COLORS;

    const rects = frames
      .map((frame) => {
        const rx = frame.x * width;
        const rw = Math.max(frame.width * width - 1, 1);
        const ry = PADDING_TOP + frame.depth * FRAME_HEIGHT;
        const colorIndex =
          Math.abs(
            frame.name.split("").reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0),
          ) % colors.length;
        const color = colors[colorIndex];
        const total = frame.value;
        const totalVal = total >= 1_000_000
          ? `${(total / 1_000_000).toFixed(2)}M`
          : total >= 1_000
            ? `${(total / 1_000).toFixed(1)}K`
            : String(total);

        const escapedName = escapeXml(frame.name);
        const hoverText = `${escapedName} \u2014 ${totalVal} instructions`;

        return `    <rect x="${rx.toFixed(2)}" y="${ry}" width="${rw.toFixed(2)}" height="${FRAME_HEIGHT - 1}" fill="${color}" rx="1" data-name="${escapedName}" data-value="${frame.value}">
      <title>${hoverText}</title>
    </rect>`;
      })
      .join("\n");

    const zoomScript = `
    <script type="text/javascript"><![CDATA[
      var selected = null;
      var svg = document.documentElement;
      svg.addEventListener('click', function(e) {
        var target = e.target;
        if (target.tagName !== 'rect') return;
        var name = target.getAttribute('data-name');
        if (!name) return;
        if (selected === name) {
          selected = null;
          svg.querySelectorAll('rect').forEach(function(r) { r.style.display = ''; });
          return;
        }
        selected = name;
        svg.querySelectorAll('rect').forEach(function(r) {
          var parts = (r.getAttribute('data-name') || '').split('\\u2014');
          var rn = parts[0] ? parts[0].trim() : '';
          r.style.display = (rn === name || r.getAttribute('data-name') === name) ? '' : 'none';
        });
      });
      svg.addEventListener('mouseover', function(e) {
        var target = e.target;
        if (target.tagName !== 'rect') return;
        target.setAttribute('stroke', '#fff');
        target.setAttribute('stroke-width', '1');
      });
      svg.addEventListener('mouseout', function(e) {
        var target = e.target;
        if (target.tagName !== 'rect') return;
        target.removeAttribute('stroke');
        target.removeAttribute('stroke-width');
      });
    ]]><\/script>`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background: #1e1e1e; font-family: monospace;">
  <text x="${width / 2}" y="20" text-anchor="middle" fill="#abb2bf" font-size="14" font-weight="bold">SoroBench Flame Graph</text>
  <text x="${width / 2}" y="${height - 8}" text-anchor="middle" fill="#5c6370" font-size="10">Click a frame to zoom, click again to reset | Hover for details</text>
${rects}
${zoomScript}
</svg>`;
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
