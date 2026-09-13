"use strict";

const { ipcMain, systemPreferences, shell } = require("electron");
const { Injector } = require("./control-injector");

/**
 * Remote-control TARGET side, built in. When another participant is granted
 * control of this machine's shared screen (consent happens in the meeting UI),
 * the renderer relays each input event over IPC and we inject it into the OS
 * with nut.js — no separate agent.
 *
 * The injector is created lazily on the first active session so the native
 * module (and the macOS Accessibility prompt) only load when actually needed.
 */
function installControl(getWindow, log) {
  let injector = null;
  let ready = null;
  let active = false;
  let paused = false;
  let controllerName = null;

  const isMac = process.platform === "darwin";
  const accessibilityOk = () =>
    !isMac || systemPreferences.isTrustedAccessibilityClient(false);

  async function ensureInjector() {
    if (injector) return ready;
    injector = new Injector({ dryRun: !!process.env.CM_CONTROL_DRYRUN });
    ready = injector.ready().catch((e) => log?.("injector init failed:", e.message));
    return ready;
  }

  function notifyRenderer(channel, payload) {
    const win = getWindow();
    if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
  }

  ipcMain.on("desktop:control-active", async (_e, { active: a, byName }) => {
    active = !!a;
    controllerName = a ? byName || "Someone" : null;
    log?.(`control ${active ? "started by " + controllerName : "stopped"}`);
    if (active) {
      await ensureInjector();
      if (!accessibilityOk()) {
        notifyRenderer("desktop:control-blocked", "accessibility");
        systemPreferences.isTrustedAccessibilityClient(true); // trigger the prompt
      }
    } else {
      injector?.releaseAll().catch(() => {});
    }
  });

  ipcMain.on("desktop:control-event", (_e, json) => {
    if (!active || paused || !injector) return;
    try {
      const ev = JSON.parse(json);
      if (injector.dryRun) log?.("[dryrun] event", json);
      injector.apply(ev);
    } catch (err) {
      log?.("bad control event:", err.message);
    }
  });

  ipcMain.on("desktop:control-accessibility-status", (e) => {
    e.returnValue = accessibilityOk();
  });
  ipcMain.on("desktop:control-accessibility-request", () => {
    if (isMac) {
      systemPreferences.isTrustedAccessibilityClient(true);
      shell.openExternal(
        "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility",
      );
    }
  });

  return {
    /** Menu "Pause remote control". */
    setPaused(next) {
      paused = !!next;
      if (paused) injector?.releaseAll().catch(() => {});
      notifyRenderer("desktop:control-paused", paused);
      log?.(`control ${paused ? "paused" : "resumed"}`);
    },
    isPaused: () => paused,
    isActive: () => active,
    controllerName: () => controllerName,
    dispose() {
      injector?.releaseAll().catch(() => {});
    },
  };
}

module.exports = { installControl };
