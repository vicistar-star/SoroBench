import type { BenchRunResult } from "@sorobench/runner";

export function formatHtml(result: BenchRunResult): string {
  const contractRows = result.results
    .map(
      (cr) => `
    <div class="contract-section">
      <h2>Contract: ${escHtml(cr.contractName)}</h2>
      <table>
        <thead>
          <tr>
            <th onclick="sortTable(this, 0)">Function</th>
            <th onclick="sortTable(this, 1)">Instructions</th>
            <th onclick="sortTable(this, 2)">Mem (bytes)</th>
            <th onclick="sortTable(this, 3)">Fee (XLM)</th>
            <th onclick="sortTable(this, 4)">Budget %</th>
          </tr>
        </thead>
        <tbody>
          ${cr.functions
            .map(
              (fr) => `
            <tr>
              <td>${escHtml(fr.functionName)}</td>
              <td>${fr.instructions.toLocaleString()}</td>
              <td>${fr.memBytes.toLocaleString()}</td>
              <td class="${fr.feeTotalXlm > (result.config.thresholds.global.maxFeeXlm ?? Infinity) ? "threshold-fail" : ""}">${fr.feeTotalXlm.toFixed(8)}</td>
              <td>
                <div class="bar-container">
                  <div class="bar-fill" style="width:${Math.min(fr.instructionsPct, 100)}%"></div>
                  <span>${fr.instructionsPct.toFixed(1)}%</span>
                </div>
              </td>
            </tr>`,
            )
            .join("")}
        </tbody>
      </table>

      <div class="chart-container">
        <canvas id="chart-${escHtml(cr.contractName)}"></canvas>
      </div>
      <div class="chart-container">
        <canvas id="pie-${escHtml(cr.contractName)}"></canvas>
      </div>
    </div>`,
    )
    .join("");

  const chartData = result.results
    .map(
      (cr) => `{
      contract: ${JSON.stringify(cr.contractName)},
      labels: ${JSON.stringify(cr.functions.map((f) => f.functionName))},
      instructions: ${JSON.stringify(cr.functions.map((f) => f.instructions))},
      feeCpu: ${JSON.stringify(cr.functions.map((f) => f.feeCpuXlm))},
      feeRead: ${JSON.stringify(cr.functions.map((f) => f.feeReadXlm))},
      feeWrite: ${JSON.stringify(cr.functions.map((f) => f.feeWriteXlm))},
      feeEvent: ${JSON.stringify(cr.functions.map((f) => f.feeEventXlm))},
    }`,
    )
    .join(",\n");

  const commit = result.results[0]?.gitCommit;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SoroBench Report - ${escHtml(result.config.project.name)}</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0d1117; color: #c9d1d9; padding: 2rem; }
  h1 { color: #58a6ff; margin-bottom: 0.5rem; }
  h2 { color: #f0f6fc; margin: 1.5rem 0 0.5rem; }
  .meta { color: #8b949e; font-size: 0.9rem; margin-bottom: 2rem; }
  table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
  th, td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid #30363d; }
  th { background: #161b22; cursor: pointer; user-select: none; position: relative; }
  th:hover { background: #1c2333; }
  th::after { content: '\\25B4\\25BE'; font-size: 0.6rem; margin-left: 0.25rem; opacity: 0.4; vertical-align: middle; }
  tr:hover { background: #161b22; }
  .threshold-fail { color: #f85149; font-weight: bold; }
  .bar-container { display: flex; align-items: center; gap: 0.5rem; }
  .bar-fill { height: 1rem; background: #58a6ff; border-radius: 0.25rem; min-width: 2px; }
  .contract-section { margin-bottom: 2rem; padding: 1rem; border: 1px solid #30363d; border-radius: 0.5rem; }
  .chart-container { margin: 1.5rem 0; max-width: 600px; }
  .passed { color: #3fb950; }
  .failed { color: #f85149; }
</style>
</head>
<body>
<h1>\u26A1 SoroBench Report</h1>
<div class="meta">
  <p><strong>Project:</strong> ${escHtml(result.config.project.name)}</p>
  <p><strong>Timestamp:</strong> ${result.timestamp}</p>
  <p><strong>Duration:</strong> ${result.duration}ms</p>
  ${commit && commit !== "unknown" ? `<p><strong>Commit:</strong> ${escHtml(commit)}</p>` : ""}
</div>
${contractRows}
<script>
const datasets = [${chartData}];

datasets.forEach(function(d) {
  const barCtx = document.getElementById('chart-' + d.contract);
  if (barCtx) {
    new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: d.labels,
        datasets: [{
          label: 'Instructions',
          data: d.instructions,
          backgroundColor: '#58a6ff',
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true,
        color: '#c9d1d9',
        plugins: {
          title: { display: true, text: 'Instructions per Function', color: '#c9d1d9' }
        },
        scales: {
          x: { ticks: { color: '#8b949e' } },
          y: { ticks: { color: '#8b949e' }, beginAtZero: true }
        }
      }
    });
  }

  const pieCtx = document.getElementById('pie-' + d.contract);
  if (pieCtx) {
    new Chart(pieCtx, {
      type: 'doughnut',
      data: {
        labels: d.labels,
        datasets: [{
          label: 'CPU Fee',
          data: d.feeCpu,
          backgroundColor: ['#f0883e', '#58a6ff', '#3fb950', '#db6d28', '#bc8cff'],
        }]
      },
      options: {
        responsive: true,
        color: '#c9d1d9',
        plugins: {
          title: { display: true, text: 'CPU Fee Distribution', color: '#c9d1d9' }
        }
      }
    });
  }
});

function sortTable(th, col) {
  const table = th.closest('table');
  const tbody = table.querySelector('tbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));
  const dir = table.dataset.sortDir === col + 'asc' ? 'desc' : 'asc';
  table.dataset.sortDir = col + dir;
  rows.sort(function(a, b) {
    const aVal = a.cells[col].textContent.trim();
    const bVal = b.cells[col].textContent.trim();
    const aNum = parseFloat(aVal.replace(/,/g, ''));
    const bNum = parseFloat(bVal.replace(/,/g, ''));
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return dir === 'asc' ? aNum - bNum : bNum - aNum;
    }
    return dir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
  });
  rows.forEach(function(r) { tbody.appendChild(r); });
}
</script>
</body>
</html>`;
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
