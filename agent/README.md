# CoreMeet Control Agent

A small tray app that lets a CoreMeet participant hand **mouse + keyboard control
of their own computer** to another person during a meeting — the piece a browser
can't do on its own.

## Why it exists

A web page can *send* control input (CoreMeet does this from the browser), but it
**cannot inject input into its own machine** — no browser API allows it. So the
person being controlled runs this native helper. It:

1. listens on `ws://127.0.0.1:47800` (loopback only — never a public interface),
2. accepts a connection from the CoreMeet meeting tab **only while that person is
   being controlled**,
3. replays the already-consented pointer/keyboard events through the OS via
   [nut.js](https://github.com/nut-tree/nut.js).

**Consent lives in the meeting, not here.** Every control session is approved
per-request inside CoreMeet, shows a "being controlled" banner, and can be
stopped instantly (Esc, the in-meeting Stop button, or this app's Pause / Quit).

## Platform support

| OS | Controlling others | Being controlled (this agent) |
|----|--------------------|-------------------------------|
| Windows | ✅ browser | ✅ |
| macOS | ✅ browser | ✅ — needs Accessibility permission (prompted on first run) |
| Linux (X11) | ✅ browser | ✅ |
| Linux (Wayland) | ✅ browser | ⚠️ limited — nut.js input injection is X11-only |
| Android | ✅ browser/app | ➡️ handled by the app's AccessibilityService (not this agent) |
| iOS | ✅ browser/app | ❌ impossible — no input-injection API exists on iOS |

The agent assumes the participant shared their **whole primary screen**. Sharing
a single window or a secondary display will offset the pointer mapping.

## Run from source

```bash
cd agent
npm install
npm start          # launches the tray app
npm test           # protocol tests (no native module needed — dry-run injector)
```

`npm install` downloads Electron and the nut.js prebuilt binary. If you only want
to run the tests, `npm install ws` is enough.

## Package installers

```bash
npm run dist:mac -- --universal   # dist/CoreMeet Control Agent-<v>-universal.dmg  (Intel + Apple Silicon)
npm run dist:win -- --x64         # dist/CoreMeet Control Agent Setup <v>.exe      (NSIS, x64)
npm run dist:linux                # dist/CoreMeet Control Agent-<v>.AppImage
```

electron-builder cross-builds Windows from macOS (it downloads its own Wine +
NSIS). Each installer bundles the darwin / win32 / linux `libnut` binaries and
picks the right one at runtime.

**These builds are unsigned** (no Apple Developer / code-signing certs):

- **macOS** — Gatekeeper blocks the first launch. Right-click the app → *Open* →
  *Open*, or System Settings → Privacy & Security → *Open Anyway*.
- **Windows** — SmartScreen warns. *More info* → *Run anyway*.

Set `CSC_LINK` / `CSC_KEY_PASSWORD` (and `APPLE_ID` / `APPLE_APP_SPECIFIC_PASSWORD`
for notarization) to produce signed installers.

## Configuration (env vars)

| Var | Default | Purpose |
|-----|---------|---------|
| `COREMEET_AGENT_PORT` | `47800` | Local WebSocket port (must match the web app). |
| `COREMEET_AGENT_ORIGINS` | `https://coremeet.urapp4u.com` | Extra allowed page origins, comma-separated. `localhost` / `127.0.0.1` are always allowed. |
| `COREMEET_AGENT_DRYRUN` | – | Set to `1` to log intended input instead of injecting it. |

## Protocol

The meeting tab opens the socket and sends:

```jsonc
{ "t": "hello", "app": "coremeet" }                       // → { "t": "welcome", ... }
{ "t": "session", "state": "start", "by": "Dana Lee" }    // who is controlling (for the UI)
{ "t": "session", "state": "stop" }
// then control events, coordinates normalised 0..1 of the shared frame:
{ "t": "move", "x": 0.5, "y": 0.5 }
{ "t": "down" | "up" | "click" | "dblclick", "button": 0, "x": 0.5, "y": 0.5 }
{ "t": "wheel", "dx": 0, "dy": 120, "x": 0.5, "y": 0.5 }
{ "t": "key", "code": "KeyC", "key": "c", "down": true, "mods": { "ctrl": true, "alt": false, "shift": false, "meta": false } }
```

Frames are capped at 4 KB. The agent relays nothing outward and holds no state
between sessions; closing the socket releases any held keys/buttons.

## Layout

```
src/main.js        Electron lifecycle, tray, status window, wiring
src/server.js      loopback WebSocket server (ControlServer)
src/injector.js    control events → OS input via nut.js (Injector; dry-run mode)
src/keymap.js      browser KeyboardEvent.code → nut.js Key
src/permissions.js macOS Accessibility check / prompt
renderer/          status window UI
```
