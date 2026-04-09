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
- **M011 complete (2026-04-10):** jsmdma sync protocol fully wired, MOD cleanup done — 18/18 Playwright tests pass
  - S01: `SyncClient.js` CDI-registered; `Api.js` POSTs to `/year-planner/sync` with `{clientClock, deviceId, changes[]}` jsmdma payload; `StorageRemote.js` deleted; `sync-payload.spec.js` mock test verifies payload shape
  - S02: HLC write-path wired — `entries.js` calls `syncClient.markEdited()` for all 5 day fields on every edit; `hlc-write.spec.js` confirms `rev:{uuid}` populated with dot-path HLC entries after any edit
  - S03: MOD-05/06/07/09 validated; MOD-08 deferred (cosmetic only); 7 orphan modal fragment files deleted from `.compose/fragments/modals/`
- 18 Playwright E2E tests pass; test harness in `.tests/`
- `.compose/fragments/modals/` contains exactly 5 active files: auth.html, delete.html, entry.html, feature.html, share.html

## Architecture / Key Patterns

- **Entry:** `site/index.html` → `site/js/main.js` → `@alt-javascript/boot-vue` CDI bootstrap → Vue 3 Options API mount
- **CDI wiring:** `site/js/config/contexts.js` registers all services as singletons; constructor parameter names must match registered names (camelCase class name)
- **Service layer:** `Storage`, `StorageLocal`, `Api` (single `sync(plannerId)` method), `SyncClient` (markEdited/sync/prune — HLC state owner), `AuthProvider`; `StorageRemote` is deleted
- **Vue layer:** `app.js`, grouped methods (`methods/auth.js`, `calendar.js`, `entries.js`, `lifecycle.js`, `planner.js`), grouped model (`model/auth.js`, `calendar.js`, `planner.js`, `ui.js`)
- **jsmdma protocol:** `site/js/vendor/data-api-core.esm.js` — local bundle; exports `HLC`, `flatten`, `merge`, `unflatten`, `diff`, `textMerge`; `HLC_ZERO` re-exported from `storage-schema.js`
- **Sync call pattern:** all Vue call sites call `api.sync(plannerId)` fire-and-forget (no await); plannerId resolved via `storageLocal.getActivePlnrUuid(uid, year)` at call site
- **HLC write path:** `entries.js` calls `syncClient.markEdited(plannerId, dotPath)` immediately after each field write; `markEdited()` ticks the per-field HLC from `rev:{uuid}[dotPath]` (monotonically increasing even offline); guard: `if (plannerId && this.syncClient)`
- **Compose build:** `.compose/build.sh` assembles `site/index.html` from `.compose/fragments/` via m4 macros; 5 active modal fragments (auth, delete, entry, feature, share)

## What's Next

- **Live server sync:** configure client IDs in `AuthProvider.js` for Google/Apple/Microsoft federated auth; point `Api.js` sync endpoint at a running jsmdma backend server
- **MOD-08 (deferred cosmetic):** convert `v-bind:`/`v-on:` to `:`/`@` shorthand across 6 fragment files — safe to batch when touching those files for other reasons
