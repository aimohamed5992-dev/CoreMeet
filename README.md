# CoreMeet

A Google Meet–style video meeting platform. Sign in, start a **New meeting**, share
the code, and talk face to face in the browser over **WebRTC**.

- **Backend:** ASP.NET Core Web API (.NET 10) + EF Core 9 + **Pomelo MySQL** provider
- **Frontend:** React 19 + Vite + TypeScript
- **Real-time:** SignalR (signaling) + WebRTC (media, peer-to-peer mesh)
- **Database:** MySQL 8 / MariaDB 10.4+

### In-meeting

Camera + mic with pre-join lobby and device pickers, mid-call device switching,
screen share (presenter takes the stage, others move to a side rail), live
participant roster, in-call chat, host "end for everyone", keyboard shortcuts
(**m** mute · **e** camera · **c** chat). Google-Meet-style monochrome controls.

### Access & identity

- **Guests** can join any meeting from its link — a pre-join screen asks for a
  name (required) and an optional photo, and lets them set camera/mic before
  entering. **An account is only needed to _create_ a meeting.**
- Signed-in users can upload an optional profile photo (Profile & photo in the
  account menu). Images are resized client-side to 256px and stored as a data URI.

### Theming

Light is the default; a toggle (header / lobby / meeting room) switches to dark
and the choice is remembered in `localStorage`. System preference is not followed.

### Marketing site

The landing page is a full marketing page — hero, logo cloud, feature rows,
feature grid, product showcase, how-it-works, animated stats, testimonials,
security, FAQ accordion, CTA and a multi-column footer — with scroll-reveal and
micro-animations via `framer-motion`.

Photography is generated with the **Manus** agent API (keys in
`~/.documentary_keys`) and lives in `frontend/public/manus/*.jpg` (resized +
compressed). `BrandImage` falls back to a brand gradient if an asset is missing.
Regenerate with `scratchpad/manus_gen.py` (edit the `SCENES` brief, then
`sips` to optimise into `public/manus/`).

```
CoreMeet/
├── backend/            ASP.NET Core solution (CoreMeet.slnx)
│   └── src/CoreMeet.Api
├── frontend/           React + Vite app
├── infra/              docker-compose (MySQL + Adminer)
└── README.md
```

---

## Build plan (5 steps)

| Step | Scope | Status |
|------|-------|--------|
| **1** | Scaffolding: both projects, DB schema + EF migration, design system, logo, landing page, routing, API client | ✅ done |
| **2** | Authentication — email + password (BCrypt), JWT + rotating refresh tokens, register/login/logout UI, protected routes | ✅ done |
| **3** | Meetings — create / join by code, participant roster, SignalR hub (presence + live chat), redesigned dashboard + meeting room shell | ✅ done |
| **4** | WebRTC — full-mesh RTCPeerConnection, live video/audio tiles, mic + camera toggle (with remote state signaling), screen share via `replaceTrack` | ✅ done |
| **5** | Pre-join lobby with camera preview + device pickers, in-call device switching, keyboard shortcuts, lobby presence, solo-room hint, smooth-scroll nav | ✅ done |

All five steps complete.

### WebRTC notes

- **Topology:** full mesh — each participant holds one `RTCPeerConnection` per
  other participant. Good for small rooms (≈ up to 6–8); an SFU would be the next
  step for larger calls.
- **Signaling:** the joining client sends offers to everyone already in the room
  (learned via `roomPeers`); the others answer. ICE candidates are trickled and
  buffered until the remote description is set.
- **STUN only** (`stun:stun.l.google.com:19302`). Peers on different NATs will
  need a **TURN** server — add it to `config.iceServers` in `frontend/src/lib/config.ts`.

---

## Running the app

### 1. Database (MySQL 8 or MariaDB 10.4+)

Either start the bundled container:

```bash
cd infra && docker compose up -d mysql
```

…or use an existing server (e.g. XAMPP). Set `ConnectionStrings:Default` in
`backend/src/CoreMeet.Api/appsettings.Development.json` to match — the default is
`server=localhost;port=3306;database=coremeet;user=root;password=` (XAMPP style,
empty root password). The server version is auto-detected at startup.

### 2. Backend

```bash
cd backend/src/CoreMeet.Api
dotnet ef database update      # applies all migrations, creates the DB if needed
dotnet run                     # http://localhost:5099
```

Check: `curl http://localhost:5099/api/health` and `/api/health/db`.
OpenAPI doc: `http://localhost:5099/openapi/v1.json`.

**Auth endpoints:** `POST /api/auth/register` · `POST /api/auth/login` ·
`POST /api/auth/refresh` · `POST /api/auth/logout` · `GET /api/auth/me` (Bearer).
Access tokens last 30 min; refresh tokens 7 days and rotate on every use
(reuse of a rotated token revokes the whole chain).

**Meeting endpoints:** `POST /api/meetings` (create) · `GET /api/meetings/mine` ·
`GET /api/meetings/{code}` · `POST /api/meetings/{code}/join` ·
`POST /api/meetings/{code}/end` (host only). Codes look like `abc-defg-hij`.

**Realtime hub:** `/hubs/meeting` (SignalR, JWT via `?access_token=`). Client calls
`JoinRoom(code, participantId)` then receives `peerJoined` / `peerLeft` /
`roomPeers` / `chatMessage`; `SendChatMessage(text)` broadcasts + persists.
`SendOffer` / `SendAnswer` / `SendIceCandidate` relay WebRTC signaling;
`SetMediaState(audio, video)` broadcasts `peerMediaState` so remote tiles show
muted-mic / camera-off.

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                    # http://localhost:5173
```

---

## Database schema (created in step 1)

- **users** — `id`, `name`, `email` (unique), `password_hash`, `avatar_color`, `created_at`
- **refresh_tokens** — `id`, `user_id`, `token_hash` (unique), `expires_at`, `revoked_at?`, `replaced_by_token_hash?`
- **meetings** — `id`, `code` (unique), `title`, `host_id`, `status`, timestamps
- **meeting_participants** — `id`, `meeting_id`, `user_id?`, `display_name`, `role`, `is_connected`, join/leave times
- **chat_messages** — `id`, `meeting_id`, `sender_participant_id`, `sender_name`, `content`, `sent_at`

Endpoints for meetings / chat are wired up in later steps.

---

## Notes

- `NU1903` build warning comes from `Microsoft.OpenApi` 2.0.0, a transitive
  dependency pinned by `Microsoft.AspNetCore.OpenApi` 10.0.10. It only affects
  untrusted YAML parsing, which this API does not do. It clears when ASP.NET Core
  ships an updated OpenApi package.
- Images: `manus` was not reachable and the image-generation credit balance was
  empty, so brand visuals are hand-built SVG (see `frontend/src/components`).
