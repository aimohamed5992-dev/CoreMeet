# CoreMeet

A Google Meet–style video meeting platform. Sign in, start a **New meeting**, share
the code, and talk face to face in the browser over **WebRTC**.

- **Backend:** ASP.NET Core Web API (.NET 10) + EF Core 9 + **Pomelo MySQL** provider
- **Frontend:** React 19 + Vite + TypeScript
- **Real-time:** SignalR (signaling) + WebRTC (media, peer-to-peer mesh)
- **Database:** MySQL 8

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
| 2 | Authentication — email + password, JWT + refresh, register/login UI | ⏳ |
| 3 | Meetings — create / join by code, participants, SignalR hub, redesigned dashboard | ⏳ |
| 4 | WebRTC — offer/answer/ICE signaling, peer mesh, video grid, mic/cam/screen-share | ⏳ |
| 5 | In-call chat, participant list, device settings, polish & final design pass | ⏳ |

Work stops after each step for review.

---

## Running step 1

### 1. Start MySQL

```bash
cd infra
docker compose up -d mysql
```

(or point `ConnectionStrings:Default` at any MySQL 8 instance)

### 2. Backend

```bash
cd backend/src/CoreMeet.Api
dotnet ef database update      # applies the InitialCreate migration
dotnet run                     # http://localhost:5099
```

Check: `curl http://localhost:5099/api/health` and `/api/health/db`.
OpenAPI doc: `http://localhost:5099/openapi/v1.json`.

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
- **meetings** — `id`, `code` (unique), `title`, `host_id`, `status`, timestamps
- **meeting_participants** — `id`, `meeting_id`, `user_id?`, `display_name`, `role`, `is_connected`, join/leave times
- **chat_messages** — `id`, `meeting_id`, `sender_participant_id`, `sender_name`, `content`, `sent_at`

Entities and endpoints for auth / meetings / chat are wired up in later steps.

---

## Notes

- `NU1903` build warning comes from `Microsoft.OpenApi` 2.0.0, a transitive
  dependency pinned by `Microsoft.AspNetCore.OpenApi` 10.0.10. It only affects
  untrusted YAML parsing, which this API does not do. It clears when ASP.NET Core
  ships an updated OpenApi package.
- Images: `manus` was not reachable and the image-generation credit balance was
  empty, so brand visuals are hand-built SVG (see `frontend/src/components`).
