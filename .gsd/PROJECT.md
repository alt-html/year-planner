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
- **M011/S01 complete:** New jsmdma sync protocol wired end-to-end — `SyncClient.js` CDI-registered; `Api.js` POSTs to `/year-planner/sync` with `{clientClock, deviceId, changes[]}` payload; `StorageRemote.js` deleted; all 17 Playwright tests pass
- **M011/S02 complete:** HLC write-path wired — `entries.js` calls `syncClient.markEdited()` for all 5 day fields on every edit; `_updateRev()` removed from `StorageLocal.js`; `hlc-write.spec.js` Playwright test confirms `rev:{uuid}` populated with dot-path HLC entries after edit; all 18 Playwright tests pass
- 18 Playwright E2E tests pass; test harness in `.tests/`

## Architecture / Key Patterns

- **Entry:** `site/index.html` → `site/js/main.js` → `@alt-javascript/boot-vue` CDI bootstrap → Vue 3 Options API mount
- **CDI wiring:** `site/js/config/contexts.js` registers all services as singletons; constructor parameter names must match registered names (camelCase class name)
- **Service layer:** `Storage`, `StorageLocal`, `Api` (single `sync(plannerId)` method), `SyncClient` (markEdited/sync/prune — HLC state owner), `AuthProvider`; StorageRemote is deleted
- **Vue layer:** `app.js`, grouped methods (`methods/auth.js`, `calendar.js`, `entries.js`, `lifecycle.js`, `planner.js`), grouped model (`model/auth.js`, `calendar.js`, `planner.js`, `ui.js`)
- **jsmdma protocol:** `site/js/vendor/data-api-core.esm.js` — local bundle; exports `HLC`, `flatten`, `merge`, `unflatten`, `diff`, `textMerge`; `HLC_ZERO` re-exported from `storage-schema.js`
- **Sync call pattern:** all Vue call sites call `api.sync(plannerId)` fire-and-forget (no await); plannerId resolved via `storageLocal.getActivePlnrUuid(uid, year)` at call site
- **HLC write-path:** `entries.js updateEntry()` calls `syncClient.markEdited(plannerId, days.${isoDate}.${field})` for all 5 fields unconditionally (not gated on syncToRemote); rev:{uuid} localStorage key populated with per-field dot-path HLC strings after every edit
- **Tests:** Playwright E2E in `.tests/`; CDN routes intercepted via `fixtures/cdn-routes.js`; global setup creates seeded `storageState`; tests needing `initialise()` to run must call `localStorage.clear()` in `addInitScript` (guarded by `sessionStorage._seeded`)

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
- [ ] M011: jsmdma Sync Protocol & MOD Cleanup — S01 ✅ S02 ✅; S03 pending (MOD audit)
