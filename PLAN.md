
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
- [ ] Tests (Vitest + React Testing Library) for 2–3 components — **scheduled as Phase 9**
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

---

# Roadmap

Phases 0–7 shipped the product. What follows is ordered by what a reviewer notices
first, not by size: fix what contradicts the README, then add the engineering signals
that are missing entirely, then grow the product.

### ✅ Phase 8 — Honesty pass

Three defects that a reviewer finds by hand within a minute, and each one contradicts a
claim the README already makes. They come first so the next phases build on something
true.

- [x] **TMDB's hard 500-page cap.** `getNextPageParam` (`src/features/movies/queries.ts:7`)
      compares `page < total_pages`, but `total_pages` is routinely far above TMDB's
      hard limit of 500. Deep scrolling therefore requests page 501, gets a 422, and the
      error tile replaces the whole grid. Clamp to `Math.min(total_pages, 500)`.
- [x] **Favorites swallow failures.** `FavoritesList` (`src/components/favorites-list.tsx:13`)
      destructures only `{ data, isPending }`, so a failed fetch renders the "Nothing here
      yet" empty state — silent data loss dressed as an empty list. Add the `isError`
      branch, reusing the error tile wording from `InfiniteMovieGrid`.
- [x] **Silent rollback on the favorite toggle.** `useToggleFavorite`
      (`src/features/favorites/queries.ts`) rolls back optimistically with no user-facing
      feedback — the heart just jumps back. Add a minimal toast (or an inline message on
      the detail page); there is no toast primitive in the project yet.
- [x] Re-verify the "loading / error / empty handled everywhere" line in the quality
      checklist above — it is currently over-claimed because of the favorites case.

**Done when:** scrolling discover to the end stops cleanly, a failed favorites fetch shows
an error, and a rejected toggle says so.

### 🔜 Phase 9 — Tests and CI (the biggest missing signal)

There is not a single test in the repo and no `.github/`. This is the most common reason
a "portfolio-grade" claim gets discounted, and it is the one item already sitting unticked
in Stretch.

- [ ] Vitest + Testing Library, `npm run test`; jsdom environment, alias `@/` from tsconfig
- [ ] Component tests where there is real logic, not just markup: `FavoriteButton`
      (guest → redirect, signed-in → optimistic toggle), `Filters` (writes to the URL,
      omits the default sort, reset), `MobileNav` (Escape closes and restores focus,
      outside click closes), `MovieCard` (poster fallback, rating hidden at 0)
- [ ] One Playwright end-to-end path: sign up → add a favorite → reload → it is still there
- [ ] GitHub Actions: `lint` + `tsc --noEmit` + `test` + `build` on push and PR
- [ ] Status badge in the README

**Done when:** CI is green on a pull request and the badge is live.
**NOT doing:** chasing coverage percentages — a handful of meaningful tests beats a number.

### 🔜 Phase 10 — Harden the proxy, complete the SEO scaffolding

The README headlines `/api/tmdb/[...path]` as the security highlight, so it is exactly
where an interviewer will poke. Right now it is an open, uncached, unvalidated relay
backed by our key.

- [ ] Allowlist the forwarded paths (`trending/*`, `search/movie`, `discover/movie`,
      `movie/:id`, `genre/movie/list`) instead of passing `path.join("/")` through verbatim
- [ ] `Cache-Control: s-maxage=...` on the response — today every client call is a
      function invocation; only the inner data cache helps
- [ ] Basic rate limiting, and keep repeated query params intact
      (`Object.fromEntries` currently collapses them)
- [ ] `metadataBase`, `sitemap.ts`, `robots.ts` (noindex for `/login`, `/register`,
      `/favorites`), an OG image, and `Movie` JSON-LD on the detail page
- [ ] Boot-time env validation with zod — `DATABASE_URL` and `BETTER_AUTH_SECRET` are read
      unchecked today, and the TMDB credentials only throw lazily on the first fetch

**Done when:** the proxy rejects an unknown path, repeat visits hit the CDN, and the SEO
files resolve in production.

### 🔜 Phase 11 — Grow the product

In descending order of value; pick from the top rather than doing all of it.

- [ ] **Person pages** `/person/[id]` — cast names in `CastRow` are plain text today, a
      dead end in the navigation
- [ ] **More rails on the home page** — now playing / top rated / upcoming next to trending
- [ ] **Wider filters** — year and rating ranges, multi-genre; TMDB `discover` supports all
      of it, the UI exposes a single genre and a single exact year
- [ ] **Share** on the detail page
- [ ] **Keyboard-reachable feed** — the infinite grid loads only through an
      IntersectionObserver sentinel, so a keyboard-only user cannot reach page 2; add a
      "Load more" button and an `aria-live` region for appended results
- [ ] TV shows, PWA — the remaining Stretch items, last: much work, little new to show

**Done when:** each item ships behind its own commit and the deployment stays green.
