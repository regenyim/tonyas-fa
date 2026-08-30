# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **pnpm** (pinned via `packageManager` in package.json).

```bash
pnpm dev          # Next.js dev server on http://localhost:3000
pnpm build        # Production build (Note: TS errors are ignored — see next.config.mjs)
pnpm start        # Run the built app
pnpm lint         # eslint .
pnpm exec tsx scripts/test-db-connection.ts   # Sanity-check DATABASE_URL
```

There is **no test runner configured**. "Testing" in this repo means running the dev server and exercising the UI/API by hand. Don't claim a feature works from type-check or lint alone — see CONTRIBUTING.md's manual checklist.

`next.config.mjs` sets `typescript.ignoreBuildErrors: true` and `images.unoptimized: true`. A green `pnpm build` does **not** mean the code typechecks — run `pnpm exec tsc --noEmit` if you need that signal.

## Required environment

`.env.local` must define these or the server will throw on boot (see `lib/db.ts`, `lib/auth.ts`):

- `DATABASE_URL` — Neon Postgres connection string
- `AUTH_SECRET` — HMAC key for session JWTs
- `RESEND_API_KEY`, `RESERVATION_NOTIFY_TO`, `RESERVATION_EMAIL_FROM` — optional; if any are missing, new-reservation emails are skipped with a warning instead of failing (see `lib/reservation-notifications.ts`).

## Architecture

Next.js 16 App Router + React 19 + Neon serverless Postgres. Three concentric layers:

1. **`lib/` — server-only domain layer.** Every file starts with `import "server-only"` and must never be imported from a client component. `lib/db.ts` exports a single `sql` tagged-template client from `@neondatabase/serverless`. Domain modules (`reservations.ts`, `expenses.ts`, `settings.ts`) own all SQL and return camelCased objects matching `lib/types.ts`. The pattern for partial updates is hand-built dynamic SQL with `$1, $2…` parameter placeholders accumulated in a `values` array — follow this pattern when extending update endpoints rather than using an ORM.

2. **`app/api/**/route.ts` — thin HTTP layer.** Every admin route follows the same shape, in this order:
   ```ts
   const originError = enforceSameOrigin(request);  if (originError) return originError;
   const authError = await requireAdminSessionResponse(); if (authError) return authError;
   const parsed = await parseJsonBody(request, zodSchema);  if (!parsed.success) return parsed.response;
   // call lib/* function, map result to Response.json
   ```
   Helpers live in [lib/api.ts](lib/api.ts). Errors are returned as `{ success: false, error | errors }`; success as `{ success: true, ... }`. **User-facing error messages are in Hungarian** — match that when adding new ones (see `parseJsonBody`'s `"Érvénytelen JSON kérés."`, `"Nincs hitelesites"`, etc.).

3. **`app/admin/**` — protected pages.** [app/admin/layout.tsx](app/admin/layout.tsx) reads the `admin_session` cookie and calls `validateSession`; on failure it `redirect("/admin-login")`. Public pages (`app/booking`, `app/contact`, `app/faq`, root `app/page.tsx`) have no such gate.

### Auth model

Stateless HS256 JWT, hand-rolled in [lib/auth.ts](lib/auth.ts) (no `jose`/`jsonwebtoken` dep). Sessions live 8 hours. Admin passwords are PBKDF2-SHA256 with 100k iterations stored as `salt:hash` in `admin_users.password_hash` — **not bcrypt**, despite what the README claims. There is no logout-side invalidation; `destroySession` is a no-op and the cookie is just cleared client-side.

### Reservation state machine

`ReservationStatus` (in [lib/types.ts](lib/types.ts)) flows `BOOKED → TREE_TAGGED → CUT → PICKED_UP_PAID`, with `NO_SHOW` as a terminal off-ramp. Invariant enforced in [lib/reservations.ts](lib/reservations.ts): any status of `TREE_TAGGED`, `CUT`, or `PICKED_UP_PAID` requires a non-empty `treeNumbers`. When changing status logic, also revisit `findConflictingTreeNumbers` — tree numbers are stored as a comma-separated string and uniqueness is checked in app code, scoped per year (the same tree number is fine across years because the tagged trees are different each season).

### Year partitioning

`reservations`, `expenses`, and `settings` are partitioned by calendar year. The `years` table is the source of truth: it lists every season that exists and has a partial unique index ensuring exactly one row has `is_active = TRUE` at a time. Two distinct concepts:

- **Active year** ([lib/years.ts](lib/years.ts) `getActiveYear`) — server-side singleton. The public booking page uses the active year's settings; `POST /api/reservations` stamps new bookings with it; if there is no active year, both routes return 503 and the booking page renders a "season closed" notice.
- **View year** ([lib/years.ts](lib/years.ts) `getViewYear`) — admin's per-session lens, stored in the `admin_view_year` cookie (1-year TTL, written by `POST /api/admin/view-year`). All four admin pages (Áttekintés, Foglalások, Kiadások, Beállítások) filter by the view year. The dropdown in [components/admin-shell-nav.tsx](components/admin-shell-nav.tsx) sets the cookie and calls `router.refresh()` so server components re-fetch.

Year lifecycle is managed via [components/years-manager-dialog.tsx](components/years-manager-dialog.tsx): create (clones settings from the most recent prior year, except `available_days` which always start empty), activate (transactional — clears the existing `is_active` flag, sets the new one), delete (blocks if active or if any reservation/expense rows reference it; the FKs from data tables to `years` enforce this at the DB level too).

The cookie value is independently validated against `years` on every read — a stale cookie pointing to a deleted year falls back to the active year, then to the current calendar year.

### CSRF / origin check

`enforceSameOrigin` in `lib/api.ts` is **production-only** (skipped when `NODE_ENV !== "production"`, which includes the v0 preview environment). It compares the `Origin` header against `x-forwarded-host`/`host` + `x-forwarded-proto`. Mutating routes (POST/PATCH/DELETE) must call it; GETs typically don't.

## Conventions worth knowing

- **Path alias** `@/*` resolves from the repo root (see `tsconfig.json` and `components.json`). Use `@/lib/...`, `@/components/...`.
- **shadcn/ui** ("new-york" style) lives in `components/ui/`. Don't hand-edit those — re-add via the shadcn CLI if a primitive is wrong.
- **Tailwind v4** with design tokens in `app/globals.css`. CONTRIBUTING.md says to use semantic tokens, not hardcoded colors.
- **`[v0]`-prefixed `console.log`** is the project's debug-print convention (see `scripts/test-db-connection.ts`). Grep for them before shipping.
- **v0.app sync**: this repo is auto-synced from v0.app deployments. Manual edits and v0-driven edits both land on `main`; expect occasional churn from the v0 side.

## Design skills (non-negotiable)

For any UI, layout, visual, or frontend design work — including "small" changes — invoke these skills **before doing anything else**:

1. `impeccable` — primary design system; owns shape, craft, and all refine/enhance commands
2. `taste-skill` — aesthetic judgment and quality bar
3. `emil-design-eng` — design engineering perspective

This applies even if the change feels trivial. Skipping these because the task is "just a tweak" is not allowed.

### Polish before the last step

Before the final implementation step of any frontend feature or UI change, run `/impeccable polish` on the target. This is the last quality gate before code lands — do not skip it.

## Documentation

`docs/API.md` (endpoint shapes), `docs/DEPLOYMENT.md` (Vercel + table schemas), and `docs/DEVELOPMENT.md` (local setup, route pipeline) are intended to be code-accurate. If you spot a drift while working, fix the doc rather than working around it.
