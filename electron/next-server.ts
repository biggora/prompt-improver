import { spawn, ChildProcess } from "node:child_process";
import * as path from "node:path";
import * as fs from "node:fs";
import { app } from "electron";
import getPort from "get-port";
import * as http from "node:http";

let serverProcess: ChildProcess | null = null;
let currentPort: number | null = null;

interface StartOptions {
  env: Record<string, string>;
}

function resolveStandalonePath(): string {
  // In dev: <repo>/.next/standalone/server.js
  // In packaged build: resources/app.asar/.next/standalone/server.js (relative to app root)
  const candidates = [
    path.join(app.getAppPath(), ".next", "standalone", "server.js"),
    path.join(process.resourcesPath || "", "app.asar", ".next", "standalone", "server.js"),
    path.join(process.cwd(), ".next", "standalone", "server.js"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error(
    `Next.js standalone bundle not found. Tried: ${candidates.join(", ")}`,
  );
}

function waitForPort(port: number, timeoutMs = 15000): Promise<void> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      const req = http.get(
        { hostname: "127.0.0.1", port, path: "/", timeout: 1000 },
        (res) => {
          res.destroy();
          resolve();
        },
      );
      req.on("error", () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Next.js server did not become ready on port ${port}`));
        } else {
          setTimeout(tryConnect, 250);
        }
      });
      req.on("timeout", () => req.destroy());
    };
    tryConnect();
  });
}

export async function startNextServer(opts: StartOptions): Promise<number> {
  if (serverProcess) {
    throw new Error("Next.js server already running");
  }

  const port = await getPort();
  const serverJs = resolveStandalonePath();
  const cwd = path.dirname(serverJs);

  serverProcess = spawn(process.execPath, [serverJs], {
    cwd,
    env: {
      ...process.env,
      ...opts.env,
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
      NODE_ENV: "production",
      // Electron sets ELECTRON_RUN_AS_NODE so the bundled Electron exe runs as Node
      ELECTRON_RUN_AS_NODE: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  serverProcess.stdout?.on("data", (d) => process.stdout.write(`[next] ${d}`));
  serverProcess.stderr?.on("data", (d) => process.stderr.write(`[next] ${d}`));
  serverProcess.on("exit", (code) => {
    console.log(`[next] exited with code ${code}`);
    serverProcess = null;
  });

  await waitForPort(port);
  currentPort = port;
  return port;
}

export async function stopNextServer(): Promise<void> {
  if (!serverProcess) return;
  return new Promise((resolve) => {
    serverProcess!.once("exit", () => {
      serverProcess = null;
      currentPort = null;
      resolve();
    });
    serverProcess!.kill();
    setTimeout(() => {
      if (serverProcess) {
        serverProcess.kill("SIGKILL");
        serverProcess = null;
        currentPort = null;
        resolve();
      }
    }, 2000);
  });
}

export async function restartNextServer(opts: StartOptions): Promise<number> {
  await stopNextServer();
  return startNextServer(opts);
}

export function getCurrentPort(): number | null {
  return currentPort;
}
