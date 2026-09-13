"use strict";

const path = require("path");
const {
  BrowserWindow,
  desktopCapturer,
  ipcMain,
  session,
  systemPreferences,
  shell,
} = require("electron");

/**
 * Wires `navigator.mediaDevices.getDisplayMedia()` from the web UI to a real OS
 * source. Uses the native system picker where the platform supports it
 * (macOS 14.4+, Windows), and falls back to our own picker window otherwise.
 */
function installScreenShare(log) {
  session.defaultSession.setDisplayMediaRequestHandler(
    async (_request, callback) => {
      // macOS: a denied Screen Recording permission yields black frames.
      if (process.platform === "darwin" && !process.env.CM_FORCE_PICKER) {
        const status = systemPreferences.getMediaAccessStatus("screen");
        if (status === "denied" || status === "restricted") {
          log?.("screen recording permission:", status);
          shell.openExternal(
            "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture",
          );
          return callback(); // cancel; the user grants access then retries
        }
      }

      try {
        const source = await pickSource(log);
        // Video only — matches the web client's getDisplayMedia({ audio: false }).
        callback(source ? { video: source } : undefined);
      } catch (e) {
        log?.("screen picker failed:", e && (e.stack || e.message || String(e)));
        callback();
      }
    },
    // Prefer the OS picker (macOS 14.4+ / Windows); our handler is only invoked
    // when it isn't available. CM_FORCE_PICKER forces our own (used in tests).
    { useSystemPicker: !process.env.CM_FORCE_PICKER },
  );
}

async function pickSource(log) {
  let sources = [];
  try {
    sources = await desktopCapturer.getSources({
      types: ["screen", "window"],
      thumbnailSize: { width: 360, height: 220 },
      fetchWindowIcons: true,
    });
  } catch (e) {
    log?.("desktopCapturer.getSources failed:", e.message);
    if (process.platform === "darwin") {
      // Almost always a missing Screen Recording permission.
      shell.openExternal(
        "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture",
      );
    }
  }
  log?.(`desktopCapturer: ${sources.length} source(s)`);
  if (sources.length === 0) return null;

  const parent = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null;
  const picker = new BrowserWindow({
    width: 720,
    height: 560,
    parent: parent || undefined,
    modal: !!parent,
    resizable: false,
    minimizable: false,
    maximizable: false,
    show: false,
    title: "Choose what to share",
    backgroundColor: "#12191c",
    webPreferences: { preload: path.join(__dirname, "picker-preload.js") },
  });
  picker.once("ready-to-show", () => picker.show());
  picker.setMenuBarVisibility(false);
  picker.loadFile(path.join(__dirname, "picker.html"));

  const payload = sources.map((s) => ({
    id: s.id,
    name: s.name,
    kind: s.id.startsWith("screen:") ? "screen" : "window",
    thumbnail: s.thumbnail.toDataURL(),
    appIcon: s.appIcon && !s.appIcon.isEmpty() ? s.appIcon.toDataURL() : null,
  }));

  return new Promise((resolve) => {
    let done = false;
    const finish = (id) => {
      if (done) return;
      done = true;
      ipcMain.removeHandler("picker:sources");
      ipcMain.removeAllListeners("picker:choose");
      if (!picker.isDestroyed()) picker.close();
      resolve(id ? sources.find((s) => s.id === id) ?? null : null);
    };

    ipcMain.handle("picker:sources", () => payload);
    ipcMain.once("picker:choose", (_e, id) => finish(id));
    picker.on("closed", () => finish(null));
  });
}

module.exports = { installScreenShare };
