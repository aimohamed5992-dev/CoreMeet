"use strict";

const path = require("path");
const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, screen: eScreen } = require("electron");
const { ControlServer } = require("./server");
const { Injector } = require("./injector");
const { accessibilityGranted, requestAccessibility } = require("./permissions");

const fs = require("fs");

const PORT = Number(process.env.COREMEET_AGENT_PORT || 47800);
const DEBUG_LOG = process.env.COREMEET_AGENT_LOG || null;
const dbg = (...a) => {
  console.log(...a);
  if (DEBUG_LOG) { try { fs.appendFileSync(DEBUG_LOG, a.map(String).join(" ") + "\n"); } catch {} }
};
const ALLOWED_ORIGINS = (process.env.COREMEET_AGENT_ORIGINS || "https://coremeet.urapp4u.com")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const state = {
  listening: false,
  connected: false,
  controlledBy: null,
  paused: false,
  accessibility: true,
};

let win = null;
let tray = null;
let server = null;
let injector = null;

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => showWindow());
  app.whenReady().then(main);
}

async function main() {
  if (process.platform === "darwin") app.dock?.hide();

  injector = new Injector({ dryRun: !!process.env.COREMEET_AGENT_DRYRUN });
  state.accessibility = injector.dryRun || accessibilityGranted();
  await injector.ready().catch((e) => console.error("injector init failed:", e.message));

  createWindow();
  createTray();
  await startServer();

  eScreen.on("display-metrics-changed", () => injector.refreshScreenSize().catch(() => {}));
  eScreen.on("display-added", () => injector.refreshScreenSize().catch(() => {}));
  eScreen.on("display-removed", () => injector.refreshScreenSize().catch(() => {}));
}

function createWindow() {
  win = new BrowserWindow({
    width: 380,
    height: 460,
    resizable: false,
    fullscreenable: false,
    maximizable: false,
    title: "CoreMeet Control Agent",
    icon: iconPath(),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(path.join(__dirname, "..", "renderer", "index.html"));
  win.once("ready-to-show", () => showWindow());
  win.on("close", (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      win.hide();
    }
  });
  win.webContents.on("did-finish-load", pushState);
}

function createTray() {
  const img = nativeImage.createFromPath(trayIconPath());
  tray = new Tray(img.isEmpty() ? nativeImage.createFromPath(iconPath()) : img);
  tray.setToolTip("CoreMeet Control Agent");
  refreshTrayMenu();
  tray.on("click", () => showWindow());
}

function refreshTrayMenu() {
  if (!tray) return;
  const status = state.controlledBy
    ? `Controlled by ${state.controlledBy}`
    : state.connected
      ? "CoreMeet connected"
      : state.listening
        ? "Waiting for CoreMeet"
        : "Starting…";
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: status, enabled: false },
      { type: "separator" },
      {
        label: state.paused ? "Resume input" : "Pause input (block control)",
        click: () => setPaused(!state.paused),
      },
      { label: "Show status window", click: () => showWindow() },
      { type: "separator" },
      { label: "Quit", click: () => quit() },
    ]),
  );
}

async function startServer() {
  server = new ControlServer({ port: PORT, allowedOrigins: ALLOWED_ORIGINS });

  server.on("listening", () => { dbg("agent: listening on", PORT); state.listening = true; sync(); });
  server.on("connect", ({ origin }) => { dbg("agent: page connected", origin); state.connected = true; sync(); });
  server.on("disconnect", () => {
    state.connected = false;
    state.controlledBy = null;
    injector.releaseAll().catch(() => {});
    sync();
  });
  server.on("session", ({ state: s, by }) => {
    dbg("agent: session", s, by || "");
    state.controlledBy = s === "stop" ? null : by || "Someone";
    if (s === "stop") injector.releaseAll().catch(() => {});
    sync();
  });
  server.on("control", ({ event }) => {
    if (state.paused) return;
    if (!state.accessibility) { state.accessibility = accessibilityGranted(); if (!state.accessibility) return void sync(); }
    if (injector.dryRun) dbg("[dryrun] event", JSON.stringify(event));
    injector.apply(event).catch((e) => console.error("apply failed:", e.message));
  });
  server.on("blocked", ({ reason, origin }) => console.warn(`blocked connection (${reason}):`, origin));
  server.on("warn", ({ error }) => console.warn("server:", error.message));

  try {
    await server.start();
  } catch (e) {
    console.error("Could not start on port", PORT, "-", e.message);
    state.listening = false;
    sync();
  }
}

function setPaused(paused) {
  state.paused = paused;
  if (paused) injector.pause(); else injector.resume();
  server?.notify({ t: "agent", paused });
  sync();
}

function sync() {
  refreshTrayMenu();
  pushState();
}

function pushState() {
  win?.webContents.send("state", { ...state, port: PORT, screen: injector?.screenSize });
}

function showWindow() {
  if (!win) return;
  win.show();
  win.focus();
}

function quit() {
  app.isQuitting = true;
  server?.stop().finally(() => app.quit());
}

// ---- IPC from the status window ----
ipcMain.handle("get-state", () => ({ ...state, port: PORT, screen: injector?.screenSize }));
ipcMain.handle("set-paused", (_e, paused) => { setPaused(!!paused); return state.paused; });
ipcMain.handle("request-accessibility", () => { requestAccessibility(); return true; });
ipcMain.handle("recheck-accessibility", () => {
  state.accessibility = accessibilityGranted();
  sync();
  return state.accessibility;
});
ipcMain.handle("quit", () => quit());

app.on("window-all-closed", (e) => e.preventDefault()); // live in the tray
app.on("before-quit", () => { app.isQuitting = true; });

function iconPath() { return path.join(__dirname, "..", "assets", "icon.png"); }
function trayIconPath() { return path.join(__dirname, "..", "assets", "tray.png"); }
