# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A multi-lingual, offline-first progressive web app (PWA) year planner. Renders a weeks-by-months calendar grid with diary entries stored in browser localStorage. Supports 10 languages, light/dark themes, planner sharing via URL-encoded compressed state, and optional server-side sync for registered users.

Live at: https://d1uamxeylh4qir.cloudfront.net/

## Build & Run

No build step — this is a vanilla ES module browser app served as static files. Dependencies load from CDN (`jsdelivr.net`).

**Local dev server:**
```bash
cd .tests && npx http-server ../site -p 8080 -c-1
```

**Run all E2E tests:**
```bash
cd .tests && npx playwright test
```

**Run smoke tests only:**
```bash
cd .tests && npx playwright test smoke/ --reporter=line
```

**Run a single test file:**
```bash
cd .tests && npx playwright test e2e/boot.spec.js
```

**Run headed (visible browser):**
```bash
cd .tests && npx playwright test --headed
```

**Install test deps (first time):**
```bash
cd .tests && npm install && npx playwright install
```

## Architecture

### Entry Point & Bootstrapping

`index.html` → `js/main.js` — Uses `@alt-javascript/boot-vue` to wire up a CDI (Context & Dependency Injection) container, then mounts a Vue 3 app. The CDI context (`js/config/contexts.js`) registers singleton services and shared objects.

### Service Layer (`js/service/`)

- **`Storage`** — facade over StorageLocal; handles planner read/write, LZ-string compressed import/export
- **`StorageLocal`** — localStorage persistence using M009 schema (UUID-keyed planner documents with HLC clocks for CRDT sync). Owns preferences, identities, wipe, and migration. Does **not** own planner read/write (delegated to `PlannerStore`). Contains migration logic from legacy numeric-key schema
- **`PlannerStore`** — anti-corruption layer between jsmdma DocumentStore and Vue. Single writer of `plnr:*` localStorage keys. Exposes `model.days` as Vue reactive surface. CDI singleton
- **`SyncScheduler`** — event-driven sync triggers (online/visibilitychange/300ms debounce). Call `start()` once in `Application.run()`. CDI singleton
- **`StorageRemote`** — server sync (API-backed)
- **`Api`** — HTTP client for the backend API (spec in `api/openapi.yaml`)
- **`AuthProvider`** — authentication flows
- **`storage-schema.js`** — key constants (`KEY_DEV`, `KEY_IDS`, `keyPlnr()`, etc.) and day field names (`F_TL`, `F_COL`, `F_NOTES`, `F_EMOJI`, `F_TYPE`)

### Vue Layer (`js/vue/`)

- **`app.js`** — root component definition, merges method groups and model
- **`model.js`** — reactive state, composed from `model/calendar.js`, `model/planner.js`, `model/auth.js`, `model/ui.js`
- **`model-features.js`** — feature flags (`debug`, `signin`, `import`, `export`)
- **`methods/`** — grouped by concern: `calendar.js`, `entries.js`, `planner.js`, `auth.js`, `lifecycle.js`
- **`i18n.js`** + **`i18n/`** — Vue I18n setup with per-language message files (en, zh, hi, ar, es, pt, fr, ru, id, ja)

### Key Data Concepts

- **Planner document** (`plnr:{uuid}`) — `{ meta: {name, year, lang, theme, uid, created}, days: { "YYYY-MM-DD": {tp, tl, col, notes, emoji} } }`
- **Runtime model** uses `model.days['YYYY-MM-DD']` (ISO-date keyed flat object) — `PlannerStore` owns this reactive surface and maps directly to the storage format
- **Day fields** use short keys: `tp` (type), `tl` (tagline), `col` (colour), `notes`, `emoji`. Legacy schema used numeric keys `0`-`4`
- **HLC (Hybrid Logical Clock)** from `@alt-javascript/data-api-core` — used for CRDT field-level revision tracking (`rev:{uuid}`)

### localStorage Schema (M009)

| Key | Content |
|-----|---------|
| `dev` | Stable device UUID |
| `tok` | JWT auth token |
| `ids` | Identity map |
| `prefs:{uid}` | User preferences |
| `plnr:{uuid}` | Planner document |
| `rev:{uuid}` | Per-field HLC revisions |
| `base:{uuid}` | Base snapshot for 3-way merge |
| `sync:{uuid}` | Last server clock |

### Test Infrastructure (`.tests/`)

Playwright E2E tests with CDN route interception (tests mock CDN dependencies via `fixtures/cdn-routes.js` so they work offline). Global setup boots the app once to create a seeded `storageState` used by all tests. Tests wait for `[data-app-ready]` attribute on `<body>` to confirm the app has fully initialised.

## Key Conventions

- All JS uses native ES modules with bare CDN import URLs (no bundler)
- CDI wiring in `contexts.js` — constructor parameter names must match registered singleton names
- The `Application` class (`js/Application.js`) orchestrates init: reads URL params, merges with localStorage preferences, and populates the Vue model before mount
- Legacy → M009 migration in `StorageLocal.migrate()` is idempotent and runs automatically on first read
