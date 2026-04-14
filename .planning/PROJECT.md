# Year Planner

## What This Is

A multi-lingual, offline-first progressive web app (PWA) year planner. Renders a weeks-by-months calendar grid where users can add diary entries (tagline, colour, notes, emoji, type) per day. Data is stored in browser localStorage. Supports 10 languages, light/dark themes, planner sharing via URL-encoded compressed state, and optional server-side sync for registered users using the jsmdma HLC-based sync protocol.

Live at: https://d1uamxeylh4qir.cloudfront.net/

## Current State

**Shipped:** v1.3 jsmdma Sync (2026-04-13)

The app now has a complete jsmdma HLC-based bidirectional sync layer. The vertical rail is fully inside Vue with flyout UI for planner management (create/switch/delete/share), theme selection, and sign-in/sign-out. jQuery and Bootstrap JS dependencies are removed. 32 Playwright E2E tests and 4 contract tests cover the sync protocol against a live backend.

## Core Value

Offline-first local planner that works without an account, and syncs bidirectionally when signed in — without data loss across devices.

## Requirements

### Validated

- ✓ **AUTH-06**: jsmdma sync protocol wired — Api.js POSTs to `/year-planner/sync` with HLC-clocked fieldRevs, clientClock, changes array. StorageRemote.js deleted. — v1.3
- ✓ **MOD-03**: StorageRemote.js deleted. All synchroniseToLocal/synchroniseToRemote references removed. — v1.3
- ✓ **MOD-05**: SquareUp payment integration removed — v1.3
- ✓ **MOD-06**: Donate flag and window.ftoggle global removed — v1.3
- ✓ **MOD-07**: Lodash replaced with native Array methods — v1.3
- ✓ **MOD-09**: Orphan modal fragment audit complete — 5 active, 7 orphans deleted — v1.3
- ✓ **SYNC-04**: HLC write-path wired — markEdited() called for all 5 day fields on every edit — v1.3
- ✓ **SYNC-05**: POST /year-planner/sync wired end-to-end with jsmdma payload shape — v1.3
- ✓ **SYNC-06**: SyncClient.js implemented with markEdited/sync/prune, CDI-registered — v1.3
- ✓ **SYNC-08**: SyncClient.prune() wired to planner deletion lifecycle — v1.3

## Current Milestone: v1.4 Bootstrap 5 & UI Generalisation

**Goal:** Migrate from Bootstrap 4.x to 5, leverage BS5 features to improve the UI, and generalise app-specific (`yp-*`) CSS/HTML into reusable patterns for sibling apps.

**Target features:**
- Bootstrap 4 → 5 migration (CSS/markup — jQuery bridge already gone)
- Audit and adopt BS5 improvements where they benefit the planner UI
- Modernise markup to BS5 idioms (`data-bs-*`, updated utilities/components)
- Generalise `yp-*` CSS classes and HTML structures into reusable, app-agnostic patterns

### Active

(Requirements to be defined below)

### Out of Scope

- **MOD-08** (Vue shorthand bindings): Cosmetic-only — v-bind:/v-on: vs :/@ shorthand. Vue 3 supports both identically; 41× v-bind: and 27× v-on: in index.html are harmless. Changing across 6 fragment files risks typos with zero functional benefit.
- **SquareUp donations**: Removed in Phase 2. Not needed; can be re-added if required.
- **Separate OpenAPI spec**: Superseded by jsmdma protocol (data-api-core) which IS the sync API.

## Context

- **Tech stack**: Vanilla ES module browser app, no bundler, CDN dependencies (`jsdelivr.net`)
- **Assets**: `site/` (index.html, css/, js/, manifest.json, icons)
- **localStorage schema** (M009): `dev`, `tok`, `plnr:{uuid}`, `rev:{uuid}`, `base:{uuid}`, `sync:{uuid}` — HLC-ready
- **Auth**: Federated auth (Google/Apple/Microsoft) in `AuthProvider.js` — Google client ID configured, Apple/Microsoft pending
- **Sync**: PlannerStore + SyncClientAdapter (vendored jsmdma-client.esm.js) + SyncScheduler debounce layer
- **Rail**: Vertical rail inside Vue `#app` with flyout submenus (calendar/planner selector, marker, emoji, settings)
- **Build system**: `.compose/build.sh` assembles `site/index.html` from `.compose/fragments/` via m4 macros
- **Tests**: 32 Playwright E2E tests + 4 contract tests in `.tests/`
- **Entry**: `site/index.html` → `site/js/main.js` → `@alt-javascript/boot-vue` CDI bootstrap → Vue 3 Options API mount
- **CDI wiring**: `site/js/config/contexts.js` registers all services as singletons; constructor parameter names must match registered names (camelCase class name)

## Constraints

- **Tech stack**: Vanilla ES modules + Vue 3 Options API — no bundler, no npm build step
- **CDN dependencies**: All external libs via CDN; use local vendor bundles for sync-critical code (data-api-core.esm.js)
- **CDI pattern**: All new services must be wired through CDI (contexts.js) — D005
- **Offline-first**: Core planner must work without auth/network; sync is additive
- **No migrate-again**: localStorage schema locked at M009 level — D001

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| m4 for HTML composition | Zero install cost, pre-installed, no npm deps, produces committed index.html | ✓ Good |
| Vue 3 Options API (no migration) | Lower risk than Composition API migration; same runtime pattern | ✓ Good |
| All modules through CDI | Consistent DI pattern, auto-injects logger/config | ✓ Good |
| Client-generated UUIDs | Offline-first — planner must exist before first sync | ✓ Good |
| SyncClient.js separate from StorageLocal | Separation of concerns: storage CRUD vs sync protocol | ✓ Good |
| jsmdma IS the sync API (no OpenAPI spec) | data-api-core.esm.js is the tested, living contract | ✓ Good |
| StorageRemote.js deleted (no stub) | Incompatible with M009 plnr:{uuid} schema; dead code creates confusion | ✓ Good |
| Fire-and-forget api.sync() calls | UI must not block on sync — all 9 Vue call sites omit await | ✓ Good |
| markEdited() ticks from per-field clock | Monotonically increasing stamps offline; ticking from sync clock produces identical stamps for rapid edits | ✓ Good |
| HLC_ZERO from storage-schema.js | Keeps all storage constants in one place; avoids HLC.zero() re-import | ✓ Good |
| Rail inside Vue #app | Eliminates jQuery/Bootstrap JS bridge; flyouts controlled via Vue reactivity | ✓ Good |
| PlannerStore + SyncClientAdapter | Evolved from standalone SyncClient CDI singleton; embeds sync adapter inside store for tighter integration | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-14 after v1.4 milestone start*
