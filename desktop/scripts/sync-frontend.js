"use strict";

/**
 * Builds the web frontend (production) and copies the result into desktop/app/
 * so it can be bundled into the installer.
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "..");
const frontend = path.join(root, "frontend");
const dist = path.join(frontend, "dist");
const target = path.join(__dirname, "..", "app");

console.log("• building frontend (production)…");
execSync("npm run build", { cwd: frontend, stdio: "inherit" });

if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.error("✗ frontend build produced no index.html");
  process.exit(1);
}

fs.rmSync(target, { recursive: true, force: true });
fs.cpSync(dist, target, { recursive: true });
console.log(`• copied ${dist} → ${target}`);
