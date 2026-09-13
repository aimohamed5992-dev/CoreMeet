"use strict";

/**
 * Dev runner: starts the frontend Vite dev server, waits for it, then launches
 * Electron pointed at it with live reload.
 */
const { spawn } = require("child_process");
const path = require("path");
const http = require("http");

const root = path.join(__dirname, "..", "..");
const frontend = path.join(root, "frontend");
const DEV_URL = "http://localhost:5173";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const vite = spawn(npm, ["run", "dev"], { cwd: frontend, stdio: "inherit" });

function wait(attempt = 0) {
  http
    .get(DEV_URL, () => launch())
    .on("error", () => {
      if (attempt > 60) {
        console.error("✗ vite dev server never came up");
        process.exit(1);
      }
      setTimeout(() => wait(attempt + 1), 500);
    });
}

function launch() {
  const electron = spawn(require("electron"), [path.join(__dirname, "..", "src", "main.js"), "--dev"], {
    stdio: "inherit",
    env: { ...process.env, CM_DEV: "1", CM_DEV_URL: DEV_URL },
  });
  electron.on("close", () => {
    vite.kill();
    process.exit(0);
  });
}

process.on("SIGINT", () => {
  vite.kill();
  process.exit(0);
});

wait();
