"use strict";

const { contextBridge, ipcRenderer } = require("electron");

/**
 * The only surface the web app sees. Its presence is how the frontend knows it
 * is running inside the desktop app (enables screen control as a target, native
 * screen-share picker, etc.).
 */
contextBridge.exposeInMainWorld("coremeetDesktop", {
  isDesktop: true,
  platform: process.platform,
  version: ipcRenderer.sendSync("desktop:version"),

  // Screen sharing is transparent: the web app calls getDisplayMedia() and the
  // main process shows the source picker — nothing to call here.

  // ---- remote control as a target ----
  control: {
    /** Relay one input event (raw JSON) for OS injection. */
    injectEvent: (json) => ipcRenderer.send("desktop:control-event", json),
    /** Mark a control session started / stopped. */
    setActive: (active, byName) =>
      ipcRenderer.send("desktop:control-active", { active, byName }),
    /** macOS Accessibility permission (always true elsewhere). */
    accessibilityOk: () => ipcRenderer.sendSync("desktop:control-accessibility-status"),
    requestAccessibility: () => ipcRenderer.send("desktop:control-accessibility-request"),
    /** Fires when the user pauses/resumes from the Controls menu. */
    onPauseChanged: (cb) => {
      const h = (_e, paused) => cb(paused);
      ipcRenderer.on("desktop:control-paused", h);
      return () => ipcRenderer.removeListener("desktop:control-paused", h);
    },
    /** Fires when injection can't proceed (e.g. "accessibility"). */
    onBlocked: (cb) => {
      const h = (_e, reason) => cb(reason);
      ipcRenderer.on("desktop:control-blocked", h);
      return () => ipcRenderer.removeListener("desktop:control-blocked", h);
    },
  },
});
