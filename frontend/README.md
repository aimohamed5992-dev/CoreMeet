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
├── components/     Logo, icons, HeroIllustration (hand-built SVG brand assets)
├── layouts/        MarketingLayout (public header/footer)
├── pages/          LandingPage + step placeholders
├── lib/            api.ts (axios), config.ts (env)
├── styles/         tokens.css (design system: color, type, spacing, shadows)
└── App.tsx         routes
```

Routing is in place; `/login`, `/register` land in step 2, `/app` + `/join/:code`
in step 3, `/meeting/:code` in step 4.

The dev server proxies `/api` and `/hubs` (WebSocket) to `VITE_API_BASE_URL`.
