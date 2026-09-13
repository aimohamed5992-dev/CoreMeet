"use strict";

const { app, dialog } = require("electron");

/**
 * Auto-update via the generic feed in package.json `build.publish`
 * (https://coremeet.urapp4u.com/desktop/ — upload the installers + latest*.yml
 * there). No-ops in dev and stays silent on network / 404 errors.
 */
function installUpdater(log) {
  if (!app.isPackaged) return { checkNow() {} };

  let autoUpdater;
  try {
    ({ autoUpdater } = require("electron-updater"));
  } catch (e) {
    log?.("electron-updater unavailable:", e.message);
    return { checkNow() {} };
  }

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on("error", (e) => log?.("updater error:", e.message));
  autoUpdater.on("update-available", (i) => log?.("update available:", i.version));
  autoUpdater.on("update-downloaded", async (i) => {
    const { response } = await dialog.showMessageBox({
      type: "info",
      buttons: ["Restart now", "Later"],
      defaultId: 0,
      message: `Cloud Meet ${i.version} is ready`,
      detail: "Restart to finish updating.",
    });
    if (response === 0) autoUpdater.quitAndInstall();
  });

  const check = () => autoUpdater.checkForUpdates().catch((e) => log?.("check failed:", e.message));
  setTimeout(check, 8000);
  setInterval(check, 6 * 60 * 60 * 1000);

  return {
    async checkNow() {
      try {
        const r = await autoUpdater.checkForUpdates();
        if (!r?.updateInfo || r.updateInfo.version === app.getVersion()) {
          dialog.showMessageBox({ message: "You're on the latest version." });
        }
      } catch (e) {
        dialog.showMessageBox({ type: "warning", message: "Couldn't check for updates.", detail: e.message });
      }
    },
  };
}

module.exports = { installUpdater };
