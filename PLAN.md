
# 🎬 Movie Explorer — project plan

A pet project for a frontend portfolio. A web app for searching movies through the public
[TMDB](https://www.themoviedb.org/) API. The goal is not "one more tutorial exercise" but
a finished product with a live link.

The methodology is **tracer bullet** (from "The Pragmatic Programmer"): first wire a thin
but **end-to-end** slice through every layer (browser → page → server proxy → TMDB →
render → deploy), then grow features on top. Every phase is a working vertical slice that
can be deployed and shown. **We deploy from Phase 0.**

---

## What the project demonstrates

| Skill | Where in the project |
|---|---|
| Next.js App Router (RSC + Client Components) | Home/detail are server-side, search/favorites are client-side |
| TypeScript | Types for TMDB API responses, props, store |
| API work + security | Route Handler as a proxy, key stays on the server |
| UX states | loading (skeleton), error, empty, 404 |
| Performance | SSR, `next/image`, fetch cache, infinite scroll |
| Responsive + theming | mobile-first, dark theme |
| Clean architecture | api/ui/features split, reusable components |

---

## Stack

- **Next.js 16 (App Router) + React 19 + TypeScript** — the foundation
- **Tailwind CSS** — responsive layout
- **TanStack Query** — cache, loading, errors, infinite scroll on the client
- **PostgreSQL + Drizzle ORM** — accounts and per-user favorites (Phase 7; originally
  planned as Zustand + persist in localStorage, see Phase 5)
- **Better Auth** — email + password, session in an httpOnly cookie
- **TMDB API** — the data (free key)
- **Vercel** — deployment
- **ESLint** — code style

> The key Next trick: the Route Handler `app/api/tmdb/[...path]` as a proxy to TMDB.
> The client never sees the API key — a nice thing to point at in an interview.

---

## Target project structure

The structure below is the original target from the start of the project. What actually
shipped is documented in [`README.md`](./README.md); the notable deviations are that
`store/` disappeared with Phase 7 (favorites moved to the server), and shadcn/ui with its
`components/ui/` was not needed.

```
src/
├── app/
│   ├── layout.tsx              # root layout, providers, theme
│   ├── page.tsx                # home (RSC) — trending
│   ├── movie/[id]/page.tsx     # detail page (RSC)
│   ├── search/page.tsx         # search results
│   ├── favorites/page.tsx      # favorites (client)
│   ├── not-found.tsx           # 404
│   ├── error.tsx               # error boundary
│   └── api/tmdb/[...path]/route.ts  # TMDB proxy (key on the server)
│
├── components/
│   ├── movie-card.tsx
│   ├── movie-grid.tsx
│   ├── search-bar.tsx          # client, debounce
│   ├── filters.tsx
│   ├── favorite-button.tsx     # client
│   ├── theme-toggle.tsx
│   └── header.tsx
│
├── features/
│   └── movies/
│       ├── api.ts              # request functions for /api/tmdb
│       ├── types.ts            # TMDB types
│       └── queries.ts          # TanStack Query hooks
│
├── lib/
│   └── tmdb.ts                 # server-side TMDB client (with the key)
│
└── providers/
    └── query-provider.tsx      # TanStack Query client
```

---

## Phases (tracer bullet)

### ✅ Phase 0 — The tracer round
The thinnest end-to-end slice: prove the whole pipe works.

- [x] `create-next-app` (TS, Tailwind, App Router, src/) — Next 16 + React 19, Node 22 (`.nvmrc`)
- [x] Route Handler `app/api/tmdb/[...path]/route.ts` — TMDB proxy (key on the server)
- [x] Server client `lib/tmdb.ts` (supports both the v4 token and the v3 key)
- [x] Home (RSC) fetches trending and renders a list of titles + a graceful error state
- [x] Put a real TMDB key into `.env.local` (your step — needs a TMDB account)
- [x] Deploy to Vercel + the TMDB env key

**Wires up:** browser → Next page → server proxy → TMDB → render → the internet.
**Done when:** the production link shows a list of titles. The key is absent from Network.
**NOT doing:** design, images, rich types, states.

### ✅ Phase 1 — A real home page
The same path, but the slice becomes "product-grade".

- [x] `MovieCard` + `MovieGrid`, posters through `next/image`
- [x] Responsive grid
- [x] Dark theme (`next-themes`) + `Header` + `ThemeToggle`
- [x] `Movie` types, server client `lib/tmdb.ts`

**Done when:** the home page looks like a finished product and is deployed.
**NOT doing:** search, filters, detail page.

### ✅ Phase 2 — Detail page
A new end-to-end slice for one feature: click → data → screen.

- [x] `/movie/[id]` (RSC): poster, overview, rating, genres
- [x] Navigation from a card
- [x] `generateMetadata` (SEO/link previews)

**Done when:** clicking a card opens a working movie page in production.
**NOT doing:** cast, trailer, similar (grown in Phase 6).

### ✅ Phase 3 — Search
An end-to-end slice of client-side interaction.

- [x] Wire up TanStack Query (`QueryProvider`)
- [x] `SearchBar` with debounce
- [x] `/search` page with results in `MovieGrid`

**Done when:** searching by title works in production.
**NOT doing:** infinite scroll, filters.

### ✅ Phase 4 — Feed: infinite scroll + filters
Deepen search/feed to production quality. Implemented on a new `/discover` page
(`discover/movie`); search moved to the same infinite feed through the reusable
`InfiniteMovieGrid`.

- [x] `useInfiniteQuery` + `IntersectionObserver`
- [x] Filters: genre / year / sorting
- [x] Filters synced with the URL (`searchParams`)
- [x] Reset filters

**Done when:** the feed scrolls infinitely and filters change both URL and results.

### ✅ Phase 5 — Favorites
An end-to-end slice of client state + persistence.

- [x] Zustand store + `persist` (localStorage)
- [x] `FavoriteButton` on the card and the detail page
- [x] `/favorites` page
- [x] Guard against hydration errors (mounted flag)

**Done when:** favorites can be added/removed and survive a reload.
**NOT doing:** auth/DB (stretch).

### ✅ Phase 6 — Finishing the detail page and polish
Come back and fill in what was deferred.

- [x] Detail page: cast, trailer (YouTube, lazy), similar movies
- [x] States everywhere: skeleton (`loading.tsx`) / `error.tsx` / empty / `not-found.tsx`
- [x] a11y: alt, focus, contrast
- [x] ESLint clean (0 errors). Lighthouse: a11y/best-practices/SEO 98–100 on every page;
      perf — detail 90, home ~88–91, discover ~80–86 (mobile + throttling, live TMDB).
      Discover is lower because it loads client-side — SSR of the first page is a possible
      optimization.
- [x] README: stack, screenshots, "what I learned"

**Done when:** every state is handled, Lighthouse is green, the README is ready.

### ✅ Phase 7 — Accounts and server-side favorites
Favorites stop being "on this browser" and become personal: login + database.

- [x] PostgreSQL (Docker locally, Neon in production) + Drizzle ORM, migrations
- [x] Better Auth authentication (email + password), session in an httpOnly cookie
- [x] `favorites` table with `UNIQUE(user_id, movie_id)`; `/api/favorites` (+ `/import`) under the session
- [x] Favorites on TanStack Query with an optimistic toggle (replacing Zustand + localStorage)
- [x] `/login` and `/register` screens, user state in the header (`AuthNav`)
- [x] Protection: `proxy.ts` (optimistic redirect) + DAL `requireUser` (check next to the data)
- [x] One-off transfer of old localStorage favorites to the server on first sign-in

**Done when:** every user has their own favorites; isolation verified end-to-end; the
production build is green.
**Why Better Auth and not NextAuth:** more modern, recommended by the Next 16 docs,
generates the Drizzle schema itself, less code for email + password.

---

## Stretch (if time allows)

- [ ] TV shows in addition to movies
- [x] Auth (Better Auth) + favorites in the database — **done, see Phase 7**
- [ ] Tests (Vitest + React Testing Library) for 2–3 components
- [ ] PWA

---

## Quality checklist (what separates this from a tutorial)

- [x] loading / error / empty handled everywhere
- [x] No API key leaking to the client (verified in Network)
- [x] Responsive from 320px
- [x] `next/image` with correct sizes, no layout shift
- [x] Dark theme with no flash on load
- [x] Meaningful commits (feat/fix/refactor), not a single "init"
- [x] README with a live link and screenshots
- [x] Deployment works; opening it on a phone — check manually
