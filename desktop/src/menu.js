"use strict";

const { app, Menu, shell } = require("electron");

const isMac = process.platform === "darwin";

function buildMenu(win, control, updater) {
  const rebuild = () => buildMenu(win, control, updater);
  /** @type {import('electron').MenuItemConstructorOptions[]} */
  const template = [
    ...(isMac
      ? [{
          label: app.name,
          submenu: [
            { role: "about" },
            {
              label: "Check for Updates…",
              enabled: !!updater,
              click: () => updater?.checkNow(),
            },
            { type: "separator" },
            { role: "services" },
            { type: "separator" },
            { role: "hide" },
            { role: "hideOthers" },
            { role: "unhide" },
            { type: "separator" },
            { role: "quit" },
          ],
        }]
      : []),
    {
      label: "File",
      submenu: [isMac ? { role: "close" } : { role: "quit" }],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Controls",
      submenu: [
        {
          label: control?.isPaused() ? "Resume remote control" : "Pause remote control",
          enabled: !!control,
          click: () => {
            control?.setPaused(!control.isPaused());
            rebuild();
          },
        },
      ],
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        ...(isMac ? [{ type: "separator" }, { role: "front" }] : [{ role: "close" }]),
      ],
    },
    {
      role: "help",
      submenu: [
        ...(isMac
          ? []
          : [
              {
                label: "Check for Updates…",
                enabled: !!updater,
                click: () => updater?.checkNow(),
              },
              { type: "separator" },
            ]),
        {
          label: "CoreMeet on the web",
          click: () => shell.openExternal("https://coremeet.urapp4u.com"),
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

module.exports = { buildMenu };
