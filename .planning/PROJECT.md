# Year Planner

## What This Is

A multi-lingual, offline-first progressive web app (PWA) year planner. Renders a weeks-by-months calendar grid where users can add diary entries (tagline, colour, notes, emoji, type) per day. Data is stored in browser localStorage. Supports 10 languages, light/dark themes, planner sharing via URL-encoded compressed state, and optional server-side sync for registered users using the jsmdma HLC-based sync protocol.

Live at: https://d1uamxeylh4qir.cloudfront.net/

## Current State

**Shipped:** v1.4 Bootstrap 5 & UI Generalisation (2026-04-14)

Migrated from Bootstrap 4.3.1 to 5.3.8 with full markup modernisation (data-bs-* attributes, updated utility classes). BS5 native dark mode (data-bs-theme="dark") wired alongside .yp-dark class. CSS generalised — design tokens, rail styles, and dot styles extracted into separate files; all bare custom properties namespaced to --yp-*. Feature modal converted to Vue-reactive state, eliminating the last Bootstrap JS dependency. SRI integrity hashes added for all CDN resources. 47 Playwright tests (32 E2E + 9 smoke + 4 contract + 2 dark mode).

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

### Validated (v1.4)

- ✓ **MIG-01..12**: Full Bootstrap 5.3.8 migration — CDN swap, data-bs-* attributes, utility class renames, feature modal Vue conversion — v1.4
- ✓ **DRK-01..04**: BS5 native dark mode wired, redundant overrides removed, visual audit passed — v1.4
- ✓ **CSS-01..05**: CSS generalisation — design-tokens.css, rail.css, dots.css extracted; --yp-* namespace; head.html updated — v1.4

### Out of Scope

- **MOD-08** (Vue shorthand bindings): Cosmetic-only — v-bind:/v-on: vs :/@ shorthand. Vue 3 supports both identically; 41× v-bind: and 27× v-on: in index.html are harmless. Changing across 6 fragment files risks typos with zero functional benefit.
- **SquareUp donations**: Removed in Phase 2. Not needed; can be re-added if required.
- **Separate OpenAPI spec**: Superseded by jsmdma protocol (data-api-core) which IS the sync API.

## Context

- **Tech stack**: Vanilla ES module browser app, no bundler, CDN dependencies (`jsdelivr.net` for Bootstrap 5.3.8, `unpkg.com` for Phosphor Icons)
- **Assets**: `site/` (index.html, css/, js/, manifest.json, icons)
- **localStorage schema** (M009): `dev`, `tok`, `plnr:{uuid}`, `rev:{uuid}`, `base:{uuid}`, `sync:{uuid}` — HLC-ready
- **Auth**: Federated auth (Google/Apple/Microsoft) in `AuthProvider.js` — Google client ID configured, Apple/Microsoft pending
- **Sync**: PlannerStore + SyncClientAdapter (vendored jsmdma-client.esm.js) + SyncScheduler debounce layer
- **Rail**: Vertical rail inside Vue `#app` with flyout submenus (calendar/planner selector, marker, emoji, settings)
- **Build system**: `.compose/build.sh` assembles `site/index.html` from `.compose/fragments/` via m4 macros
- **CSS architecture**: design-tokens.css (theme properties), rail.css (rail panel), dots.css (dot swatches), main.css (layout/components), yp-dark.css (dark overrides) — all custom properties use --yp-* namespace
- **Tests**: 47 Playwright tests (32 E2E + 9 CSS smoke + 4 contract + 2 dark mode) in `.tests/`
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

| BS5 migration (no JS bundle) | All interactivity is Vue-reactive; BS5 CSS-only via CDN | ✓ Good |
| CSS --yp-* namespace | Prevents collision with BS5 --bs-* properties; enables multi-app reuse | ✓ Good |
| Separate CSS files (tokens/rail/dots) | Modular loading, clearer maintenance boundaries | ✓ Good |

---
*Last updated: 2026-04-14 after v1.4 milestone*
