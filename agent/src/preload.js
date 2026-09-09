"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("agent", {
  getState: () => ipcRenderer.invoke("get-state"),
  setPaused: (paused) => ipcRenderer.invoke("set-paused", paused),
  requestAccessibility: () => ipcRenderer.invoke("request-accessibility"),
  recheckAccessibility: () => ipcRenderer.invoke("recheck-accessibility"),
  quit: () => ipcRenderer.invoke("quit"),
  onState: (cb) => {
    const h = (_e, s) => cb(s);
    ipcRenderer.on("state", h);
    return () => ipcRenderer.removeListener("state", h);
  },
});
