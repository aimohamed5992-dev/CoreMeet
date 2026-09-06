# CoreMeet — frontend

React 19 + Vite + TypeScript client for CoreMeet.

```bash
cp .env.example .env
npm install
npm run dev      # http://localhost:5173
```

`npm run build` type-checks and produces `dist/`. `npm run lint` runs oxlint.

## Structure

```
src/
├── components/     Logo, Avatar, icons, HeroIllustration, ProtectedRoute
├── layouts/        MarketingLayout (public), AppLayout (authenticated shell)
├── pages/          LandingPage, DashboardPage, auth/ (Login, Register, AuthShell)
├── lib/
│   ├── api.ts          axios instance + JWT attach + 401→refresh→retry
│   └── auth/           AuthContext, tokenStore, authApi, types
├── styles/         tokens.css (design system: color, type, spacing, shadows)
└── App.tsx         routes
```

Auth is wired: register/login/logout, session persisted to `localStorage`,
protected routes redirect to `/login`. `/app` + `/join/:code` get their real
screens in step 3, `/meeting/:code` in step 4.

The dev server proxies `/api` and `/hubs` (WebSocket) to `VITE_API_BASE_URL`.
