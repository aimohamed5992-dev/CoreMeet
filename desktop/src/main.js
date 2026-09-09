"use strict";

const path = require("path");
const fs = require("fs");
const { app, BrowserWindow, ipcMain, shell, session } = require("electron");
const { startStaticServer } = require("./static-server");
const { buildMenu } = require("./menu");
const { installScreenShare } = require("./screen-share");
const { installControl } = require("./control");
const { installUpdater } = require("./updater");

let control = null;
let updater = null;

app.setName("CoreMeet");

const LOG = process.env.CM_LOG;
const log = (...a) => {
  const line = `[${new Date().toISOString()}] ${a.join(" ")}`;
  console.log(line);
  if (LOG) { try { fs.appendFileSync(LOG, line + "\n"); } catch {} }
};

const isDev = process.argv.includes("--dev") || !!process.env.CM_DEV;
const DEV_URL = process.env.CM_DEV_URL || "http://localhost:5173";
const APP_DIR = path.join(__dirname, "..", "app");

// The deployed web app. The desktop shell loads this directly so UI changes ship
// without a desktop rebuild; the bundled copy in app/ is the offline fallback.
const PROD_URL = process.env.CM_APP_URL || "https://coremeet.urapp4u.com";

const BRAND_BG = "#f7faf8";
const BRAND_BG_DARK = "#0b130e";

let mainWindow = null;
let staticServer = null;
let usedFallback = false;

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
  app.whenReady().then(main);
}

async function main() {
  // A meeting app: grant camera / mic / screen-capture without a prompt.
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    const allowed = ["media", "display-capture", "clipboard-read", "clipboard-sanitized-write"];
    callback(allowed.includes(permission));
  });
  session.defaultSession.setPermissionCheckHandler(() => true);

  installScreenShare(log);
  control = installControl(() => mainWindow, log);
  updater = installUpdater(log);

  const startUrl = isDev ? DEV_URL : PROD_URL;
  createWindow(startUrl);
}

// Offline fallback: if the hosted site can't be reached, serve the SPA that was
// bundled at build time from a loopback static server.
async function loadBundledFallback(reason) {
  if (usedFallback || isDev || !mainWindow) return;
  usedFallback = true;
  try {
    if (!staticServer) staticServer = await startStaticServer(APP_DIR);
    log("falling back to bundled app:", reason, "->", staticServer.origin);
    mainWindow.loadURL(staticServer.origin);
  } catch (e) {
    log("fallback failed:", e.message);
  }
}

function createWindow(startUrl) {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 960,
    minHeight: 620,
    backgroundColor: BRAND_BG,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: true,
    },
  });

  buildMenu(mainWindow, control, updater);
  log("loading", startUrl);
  mainWindow.loadURL(startUrl);
  mainWindow.once("ready-to-show", () => {
    log("ready-to-show");
    mainWindow.show();
  });
  mainWindow.webContents.on("did-finish-load", () => log("did-finish-load"));
  mainWindow.webContents.on("did-fail-load", (_e, code, desc, url, isMainFrame) => {
    log("did-fail-load", code, desc, url);
    // -3 is ERR_ABORTED (redirects / user navigation) — not a real failure.
    if (isMainFrame && code !== -3) loadBundledFallback(`${code} ${desc}`);
  });
  mainWindow.webContents.on("render-process-gone", (_e, d) =>
    log("render-process-gone", JSON.stringify(d)));
  if (isDev) mainWindow.webContents.openDevTools({ mode: "detach" });

  if (process.env.CM_SHOT) {
    mainWindow.webContents.once("did-finish-load", () => {
      setTimeout(async () => {
        const img = await mainWindow.webContents.capturePage();
        fs.writeFileSync(process.env.CM_SHOT, img.toPNG());
        log("shot ->", process.env.CM_SHOT);
      }, 2500);
    });
  }

  // External links open in the user's browser; never navigate away in-app.
  // Internal = the hosted site, or the loopback fallback server.
  const isInternalOrigin = (origin) =>
    origin === new URL(PROD_URL).origin ||
    origin === new URL(DEV_URL).origin ||
    (staticServer && origin === staticServer.origin);
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (e, url) => {
    if (!isInternalOrigin(new URL(url).origin)) {
      e.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.on("closed", () => (mainWindow = null));
}

// ---- IPC ----
ipcMain.on("desktop:version", (e) => (e.returnValue = app.getVersion()));
// remote-control target IPC is wired in ./control.js

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    usedFallback = false;
    createWindow(isDev ? DEV_URL : PROD_URL);
  }
});
app.on("before-quit", () => {
  control?.dispose();
  staticServer?.server.close();
});

// theme background follows the OS so the window doesn't flash white in dark mode
app.on("ready", () => {
  const { nativeTheme } = require("electron");
  const apply = () => mainWindow?.setBackgroundColor(
    nativeTheme.shouldUseDarkColors ? BRAND_BG_DARK : BRAND_BG,
  );
  nativeTheme.on("updated", apply);
});
