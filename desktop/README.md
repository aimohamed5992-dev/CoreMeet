# CoreMeet Desktop

The full CoreMeet meeting app packaged for **Windows and macOS** (Electron),
loading the same web UI and hitting the same backend. Unlike the browser, the
desktop app can **share the screen natively** and **be remotely controlled** —
input injection is built in, so no separate helper is needed.

## Develop

```bash
npm install
npm run dev        # starts the frontend Vite server + Electron with live reload
```

`npm run dev` expects the repo layout `CoreMeet/{frontend,desktop}`.

## Run a production build locally

```bash
npm start          # builds frontend → app/, then launches Electron
```

## Package installers

```bash
npm run dist:mac     # dist/CoreMeet-<v>-universal.dmg   (Intel + Apple Silicon)
npm run dist:win     # dist/CoreMeet-<v>-x64.exe         (NSIS installer)
npm run dist:linux   # dist/CoreMeet-<v>-x86_64.AppImage
```

Each script runs `npm run sync` first (frontend build → `app/`). Windows is
cross-built from macOS (bundled Wine + NSIS). The bundled web UI points at the
hosted API via `frontend/.env.production.local`.

**Unsigned** (no certs): macOS Gatekeeper needs right-click → *Open* → *Open*;
Windows SmartScreen needs *More info* → *Run anyway*. Set `CSC_LINK` /
`CSC_KEY_PASSWORD` (+ `APPLE_ID` / `APPLE_APP_SPECIFIC_PASSWORD`) for signed builds.

## Auto-update

`electron-updater` checks the generic feed in `package.json` `build.publish.url`
(`https://coremeet.urapp4u.com/desktop/`). Release = run `dist:*`, then upload the
installer **plus** `dist/latest.yml` / `dist/latest-mac.yml` to that path. The app
checks 8 s after launch and every 6 h, downloads in the background, and offers a
restart; **Help → Check for Updates…** forces it. No-ops in dev.

## Layout

```
src/main.js            app lifecycle, window, permissions, external links
src/preload.js         window.coremeetDesktop bridge (isDesktop, screen picker, control)
src/static-server.js   loopback static host for the bundled SPA (history-mode routing)
src/menu.js            application menu
scripts/sync-frontend.js  build the frontend and copy it into app/
scripts/dev.js         dev runner
app/                   the built frontend  (generated, gitignored)
```

## Screen share

`navigator.mediaDevices.getDisplayMedia()` from the web UI is intercepted by
`session.setDisplayMediaRequestHandler` in the main process:

- **macOS 14.4+ / Windows** — the native OS picker (`useSystemPicker: true`),
  which also handles the Screen Recording permission prompt.
- **Older / Linux** — our own picker window (`src/picker.html`) listing screens
  and windows with live thumbnails.

macOS needs *Screen Recording* permission (System Settings → Privacy &
Security); the packaged app prompts on first use, and the handler opens the
settings pane if it's denied.

## Remote control (as a target)

When another participant is granted control of this machine's shared screen
(consent in the meeting UI), the renderer relays each input event over IPC and
`src/control.js` injects it with nut.js — **no separate agent**.

- `window.coremeetDesktop.control` (preload) — `injectEvent`, `setActive`,
  `accessibilityOk`, `requestAccessibility`, `onPauseChanged`, `onBlocked`.
- The frontend's `useControlAgent` uses this IPC path when `coremeetDesktop`
  is present; a plain browser can't be a target (status `absent`).
- The injector loads lazily on the first session. **Controls → Pause remote
  control** is an instant kill-switch.
- macOS needs *Accessibility* permission (Privacy & Security → Accessibility);
  the app triggers the prompt and opens the pane when it's missing.
- `CM_CONTROL_DRYRUN=1` logs events instead of injecting (used in tests).

## Status

| Step | Scope | State |
|------|-------|-------|
| 1 | Shell: window, bundled SPA, menu, permissions, external links | ✅ |
| 2 | Native screen share (`desktopCapturer` + source picker) | ✅ |
| 3 | Built-in remote-control target (nut.js in main + IPC) | ✅ |
| 4 | Gate remote control to the desktop app (backend + web) | ✅ |
| 5 | Installers (.dmg / .exe), auto-update, retired `agent/`, docs | ✅ |
