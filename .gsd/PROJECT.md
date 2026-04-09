# Year Planner

## What This Is

A multi-lingual, offline-first progressive web app (PWA) year planner. Renders a weeks-by-months calendar grid where users can add diary entries (tagline, colour, notes, emoji, type) per day. Data is stored in browser localStorage. Supports 10 languages, light/dark themes, planner sharing via URL-encoded compressed state, and optional server-side sync for registered users using the jsmdma HLC-based sync protocol.

Live at: https://d1uamxeylh4qir.cloudfront.net/

## Core Value

Offline-first local planner that works without an account, and syncs bidirectionally when signed in — without data loss across devices.

## Current State

- Vanilla ES module browser app, no bundler, dependencies from CDN (`jsdelivr.net`)
- All web assets in `site/` (index.html, css/, js/, manifest.json, icons)
- localStorage schema at M009 level: `dev`, `tok`, `plnr:{uuid}`, `rev:{uuid}`, `base:{uuid}`, `sync:{uuid}` — HLC-ready
- Federated auth (Google/Apple/Microsoft) skeleton in `AuthProvider.js` — client IDs not yet configured
- Old sync protocol still in place: `Api.js` uses `POST /api/planner` dump approach; `StorageRemote.js` uses obsolete uid-year schema
- 14 Playwright E2E tests pass; test harness in `.tests/`

## Architecture / Key Patterns

- **Entry:** `site/index.html` → `site/js/main.js` → `@alt-javascript/boot-vue` CDI bootstrap → Vue 3 Options API mount
- **CDI wiring:** `site/js/config/contexts.js` registers all services as singletons; constructor parameter names must match registered names
- **Service layer:** `Storage`, `StorageLocal` (633 lines, full schema impl), `StorageRemote` (84 lines, dead — to be deleted in M011), `Api`, `AuthProvider`, `SyncClient` (planned M011)
- **Vue layer:** `app.js`, grouped methods (`methods/auth.js`, `calendar.js`, `entries.js`, `lifecycle.js`, `planner.js`), grouped model (`model/auth.js`, `calendar.js`, `planner.js`, `ui.js`)
- **jsmdma protocol:** `site/js/vendor/data-api-core.esm.js` — local bundle; exports `HLC`, `flatten`, `merge`, `unflatten`, `diff`, `textMerge`
- **Tests:** Playwright E2E in `.tests/`; CDN routes intercepted via `fixtures/cdn-routes.js`; global setup creates seeded `storageState`

## Capability Contract

See `.gsd/REQUIREMENTS.md` for the explicit capability contract, requirement status, and coverage mapping.

## Milestone Sequence

- [x] M001: Migration — Move from old server-rendered to client-side Vue app
- [x] M002: JS Modularisation — Split monolithic controller, model, Api into domain modules
- [x] M003: Storage Modernisation — Replace cookies with localStorage; remove consent modal
- [x] M004: Auth & API Contract — Federated auth skeleton; OpenAPI contract groundwork
- [x] M005: UI/UX Design Research — Design direction and component research
- [x] M006: UI/UX Polish & Finalisation — Visual polish, theme, typography
- [x] M007: Boot v3 Uplift — Upgrade to @alt-javascript/boot-vue@3; fix test harness
- [x] M008: Day Data Model Extension — Add notes and emoji fields to day objects
- [x] M009: localStorage Schema Redesign & Migration — HLC-ready schema; one-time migration from old schema
- [x] M010: Source Root Tidy — Move web assets to site/
- [ ] M011: jsmdma Sync Protocol & MOD Cleanup — SyncClient.js + jsmdma HLC sync + StorageRemote retired + MOD-05–09 resolved
