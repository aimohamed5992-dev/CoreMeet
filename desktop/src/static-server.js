"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json",
};

/**
 * Serves the bundled SPA over loopback so React Router (history mode) and
 * absolute asset paths work exactly as they do on the web. Unknown paths fall
 * back to index.html.
 */
function startStaticServer(rootDir) {
  return new Promise((resolve, reject) => {
    const index = path.join(rootDir, "index.html");
    if (!fs.existsSync(index)) {
      return reject(new Error(`bundled app not found at ${rootDir} — run "npm run sync"`));
    }

    const server = http.createServer((req, res) => {
      try {
        const url = new URL(req.url, "http://localhost");
        let pathname = decodeURIComponent(url.pathname);
        if (pathname.includes("..")) pathname = "/";

        let filePath = path.join(rootDir, pathname);
        if (!filePath.startsWith(rootDir)) filePath = index;

        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
          // SPA fallback: anything without a file extension → index.html
          filePath = path.extname(pathname) ? filePath : index;
        }
        if (!fs.existsSync(filePath)) filePath = index;

        const body = fs.readFileSync(filePath);
        res.writeHead(200, {
          "Content-Type": MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream",
          "Cache-Control": filePath === index ? "no-cache" : "public, max-age=31536000",
        });
        res.end(body);
      } catch (err) {
        res.writeHead(500);
        res.end(String(err));
      }
    });

    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ server, origin: `http://127.0.0.1:${port}` });
    });
  });
}

module.exports = { startStaticServer };
