import * as fs from "node:fs";
import * as path from "node:path";
import * as http from "node:http";
import type { Command } from "commander";
import { loadConfig } from "../utils/loadConfig.js";

export function registerDashboardCommand(program: Command): void {
  program
    .command("dashboard")
    .description("Start the SoroBench dashboard server")
    .option("--port <number>", "Dashboard server port", "4242")
    .option("--config <path>", "Path to config file")
    .action(async (options) => {
      try {
        const config = loadConfig(options.config);
        const port = parseInt(options.port, 10);
        const dashboardDist = path.resolve(
          process.cwd(),
          "packages",
          "dashboard",
          "dist",
        );

        console.log(`\u26A1 SoroBench Dashboard`);
        console.log(`Project: ${config.project.name}`);
        console.log(`Starting dashboard server on http://localhost:${port} ...`);
        console.log(`(Requires @sorobench/dashboard build)`);

        const server = http.createServer((req, res) => {
          if (req.url === "/" || req.url === "/index.html") {
            const indexPath = path.join(dashboardDist, "index.html");
            if (fs.existsSync(indexPath)) {
              const html = fs.readFileSync(indexPath, "utf-8");
              res.writeHead(200, { "Content-Type": "text/html" });
              res.end(html);
            } else {
              res.writeHead(200, { "Content-Type": "text/html" });
              res.end(
                `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>SoroBench Dashboard</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #1a1a2e; color: #e0e0e0; }
  .msg { text-align: center; }
  h1 { color: #4a9eff; }
</style>
</head>
<body>
  <div class="msg">
    <h1>\u26A1 SoroBench Dashboard</h1>
    <p>Project: ${config.project.name}</p>
    <p>Dashboard UI build not found. Run <code>npm run build:dashboard</code> to build it.</p>
    <p style="color: #888; margin-top: 40px;">SoroBench v0.1.0</p>
  </div>
</body>
</html>`,
              );
            }
          } else {
            const filePath = path.join(dashboardDist, req.url ?? "");
            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
              const content = fs.readFileSync(filePath);
              const ext = path.extname(filePath);
              const mime: Record<string, string> = {
                ".html": "text/html",
                ".js": "application/javascript",
                ".css": "text/css",
                ".svg": "image/svg+xml",
                ".png": "image/png",
                ".json": "application/json",
              };
              res.writeHead(200, { "Content-Type": mime[ext] ?? "application/octet-stream" });
              res.end(content);
            } else {
              res.writeHead(404);
              res.end("Not found");
            }
          }
        });

        server.listen(port, () => {
          console.log(`Dashboard server running at http://localhost:${port}`);
        });
      } catch (err) {
        console.error("Failed to start dashboard:", err instanceof Error ? err.message : err);
        process.exit(1);
      }
    });
}
