# Cloud Meet — mobile app

Flutter app for Android + iOS, hitting the same backend as the web client.

## Status

Built step by step alongside the web features:

| Step | Scope | State |
|------|-------|-------|
| 6 | Scaffold, theme, i18n (en/ar + RTL), auth (login / register / refresh / me / logout), routing | ✅ |
| 7 | Dashboard (recent meetings), start instant meeting, join by code/link, lobby | ✅ |
| 8 | Meeting room — WebRTC full mesh + SignalR, camera/mic, roster | ✅ |
| 9 | Chat, participants + host end, remote control (controller side) | ✅ |
| 10 | Polish, release builds, docs | ⬜ |

## Run

```bash
flutter pub get
flutter run
```

By default it talks to the hosted API (`https://coremeetapis.urapp4u.com`). Point
it at a local backend with `--dart-define` (Android emulator reaches the host at
`10.0.2.2`):

```bash
flutter run \
  --dart-define=COREMEET_API_BASE=http://10.0.2.2:5099 \
  --dart-define=COREMEET_HUB_URL=http://10.0.2.2:5099/hubs/meeting
```

On the iOS simulator use `http://localhost:5099`. A physical device needs your
machine's LAN IP and the API bound to `0.0.0.0`.

> Local HTTP (cleartext) is allowed in debug builds only — see
> `android/app/src/debug/AndroidManifest.xml` and `Info.plist`
> `NSAppTransportSecurity`. Release builds are HTTPS-only.

## Checks

```bash
flutter analyze
flutter test
```

## Architecture

- **State** — Riverpod (`StateNotifier` / `Provider`, no codegen).
- **Networking** — `dio`. `rawDioProvider` is interceptor-free (auth endpoints +
  refresh replay); `dioProvider` attaches the bearer token and refreshes once on
  a 401 before retrying.
- **Auth** — `AuthController` owns the session, persisted in the platform
  keystore via `flutter_secure_storage`. Cold start restores the cached session
  and verifies it against `/api/auth/me` in the background.
- **Routing** — `go_router` with an auth-aware `redirect`; a splash route covers
  the unresolved state.
- **i18n** — `gen-l10n` from `lib/l10n/app_{en,ar}.arb` (class `L`). Locale is
  chosen in-app (`LocaleController`, persisted to `SharedPreferences`); English
  is default, Arabic opt-in. RTL follows the locale automatically.
- **Theme** — `AppTheme` light/dark, palette mirrored from the web tokens.

```
lib/
  main.dart                     bootstrap + ProviderScope
  src/
    app.dart                    MaterialApp.router
    config/env.dart             dart-define configuration
    theme/app_theme.dart
    localization/               LocaleController, context.l10n
    router/app_router.dart
    network/                    dio clients, ApiException, errorText
    auth/                       models, TokenStore, AuthController
    meetings/                   models, MeetingsRepository, meeting_code parser,
                                myMeetingsProvider, MeetingStatusChip
    features/
      splash/  auth/  dashboard/  lobby/  room/
    util/relative_time.dart
    widgets/                    BrandLogo, LanguageToggle, BusyButton
  l10n/                         .arb sources + generated app_localizations*
integration_test/               auth_flow_test.dart, meeting_flow_test.dart
                                (need a running backend; --dart-define=CM_PAUSE=N
                                 holds each screen for screenshots)
```

### Meeting room (step 8)

- **Signaling** — `signalr_netcore` client (`MeetingHub`), same hub + events as the
  web client (`roomPeers` / `peerJoined` / `peerLeft` / `peerMediaState`, plus the
  `offer` / `answer` / `iceCandidate` relay).
- **Media** — `flutter_webrtc` `getUserMedia` (falls back to audio-only when there's
  no camera, e.g. the iOS simulator). Mic/camera mute toggle the track's `enabled`;
  camera-off also drops the outgoing video track. `Helper.switchCamera` flips
  front/back.
- **Mesh** — `PeerMesh`: one `RTCPeerConnection` per peer; the joiner offers, those
  already in the room answer; SDP + ICE are JSON strings, byte-compatible with the
  web client (verified Flutter↔Web both directions).
- **State** — `RoomController` (`StateNotifierProvider.autoDispose.family` by code)
  owns hub + mesh + media and exposes `RoomState` (phase, roster, local stream,
  `remoteFeeds` by connection id, `remoteMedia`). The lobby's mic/cam choice comes
  from `lobbyPrefsProvider`.
- Adaptive tile grid, top status bar, participants sheet, confirm-on-leave.

ICE servers: `Env.iceServersJson` — STUN-only by default. For carrier-grade NAT,
pass a TURN server (same shape as the web's `VITE_ICE_SERVERS`):
`--dart-define=COREMEET_ICE_SERVERS='[{"urls":"stun:…"},{"urls":["turn:…"],"username":"…","credential":"…"}]'`.

Permissions: camera + mic in `AndroidManifest.xml` and `Info.plist`
(`NSCameraUsageDescription` / `NSMicrophoneUsageDescription`). iOS deployment
target is 13.0 (flutter_webrtc minimum).

The lobby's camera/mic toggles set the state carried into the room; the live
camera preview starts in the room.

### Chat + control (step 9)

- **Chat** — `chatMessage` hub event → `RoomState.messages` + an unread badge;
  `ChatSheet` bottom sheet.
- **Participants** — `_PeopleSheet` shows roles / connection; the host gets
  "End for everyone" (`meetingsApi.end`).
- **Remote control — controller side** (works on iOS + Android): when a remote
  participant is `Presenting`, their tile shows *Request control*; on grant a
  `ControlOverlay` captures touches (drag → move, tap → click, long-press →
  right-click, double-tap → dbl-click) and an on-screen keyboard, encodes them
  as the same `ControlEvent` JSON the web uses, and relays via `SendControlEvent`
  — the person being controlled must be on the **Cloud Meet desktop app**, which does the injection.
- **Remote control — target side**: consent dialog on `controlRequested` +
  a "being controlled" banner with instant Stop.

**Not yet built (documented follow-ups):** screen-share *out* from the phone
(Android MediaProjection foreground service / iOS ReplayKit broadcast
extension), and the Android accessibility service that would let a phone *be*
controlled. iOS can never be controlled (no input-injection API).
