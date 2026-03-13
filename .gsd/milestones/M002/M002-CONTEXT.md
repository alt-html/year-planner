# M002: JS Modularisation — Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

## Project Description

The Year Planner is a multi-lingual PWA using Vue 3 + CDN-loaded ES6 modules with @alt-javascript/cdi for dependency injection. The JavaScript layer has grown monolithic — a 314-line controller mixing 5+ concerns, a 503-line API class bundling sync/auth/profile/payment, and a flat 40+ field model object. This milestone decomposes them into focused, single-responsibility modules.

## Why This Milestone

The monolithic JS files make it hard to reason about individual capabilities, and impossible to surgically modify one concern (e.g. auth) without risking others (e.g. planner logic). M003 (storage modernisation) and M004 (auth replacement) both need clean module boundaries to work against. This refactoring establishes those boundaries.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Use the year planner exactly as before — identical behaviour, no visible changes
- (Developer) Navigate a well-organised JS codebase with focused modules instead of monolithic files

### Entry point / environment

- Entry point: `http://localhost:8080` (Docker nginx) or `http://localhost:8080` (http-server via Playwright)
- Environment: browser
- Live dependencies involved: none (refactoring only — no backend changes)

## Completion Class

- Contract complete means: all 14 Playwright E2E tests pass; no new tests needed
- Integration complete means: all modules wired through CDI; app boots and behaves identically
- Operational complete means: Docker serve still works; .compose/build.sh still produces valid index.html

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- All 14 Playwright E2E tests pass (`cd .tests && npx playwright test`)
- The app boots in the browser with no console errors
- Entry CRUD, planner management, and all existing user flows work unchanged
- `.compose/build.sh` produces a valid index.html that includes the updated template bindings

## Risks and Unknowns

- **Model restructuring breaks template bindings** — Renaming model fields requires updating ~75 template references across 18 .compose fragments. Missing one breaks the app silently.
- **CDI wiring order with split modules** — Splitting Api.js into 3 modules changes the dependency graph. CDI must resolve all constructor parameters correctly.
- **superagent → fetch error handling mismatch** — superagent exposes `err.status` in catch blocks; fetch requires checking `response.ok` and manually parsing error responses. The error feedback UI must still work.
- **Vue Options API `this` context across split method files** — Controller methods use `this.xxx` to access model state. When methods are split into separate files, they must still bind correctly to the Vue instance.

## Existing Codebase / Prior Art

- `js/vue/controller.js` — 314 lines, monolithic methods object mixed into Vue app
- `js/vue/model.js` — 59 lines, flat state bag with 40+ fields
- `js/vue/model-features.js` — 15 lines, feature flags with window.ftoggle global
- `js/vue/app.js` — 27 lines, Vue app creation (data + methods + mounted)
- `js/service/Api.js` — 503 lines, all HTTP calls (sync, auth, profile, payment, email)
- `js/service/Storage.js` — 96 lines, planner data access facade
- `js/service/StorageLocal.js` — 277 lines, cookie-based persistence
- `js/service/StorageRemote.js` — 85 lines, remote-to-local sync
- `js/service/SquareUp.js` — 90 lines, Square payment integration (to be removed)
- `js/config/contexts.js` — 39 lines, CDI wiring
- `js/config/config.js` — 31 lines, environment config
- `js/Application.js` — 92 lines, app bootstrapper
- `js/main.js` — 21 lines, CDI entry point
- `.compose/` — 18 HTML fragments assembled by m4

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- MOD-01 through MOD-10 — All M002 requirements
- MOD-10 (E2E tests pass) — The primary verification mechanism

## Scope

### In Scope

- Splitting controller.js into domain-grouped method modules
- Restructuring model.js into grouped sub-objects
- Splitting Api.js into SyncApi, AuthApi, ProfileApi
- Replacing superagent with native fetch
- Removing SquareUp.js and payment code
- Replacing lodash with native Array methods
- Cleaning up feature flags module
- Updating HTML template bindings and recomposing
- Wiring all new modules through CDI

### Out of Scope / Non-Goals

- Storage backend changes (M003)
- Auth mechanism changes (M004)
- New tests beyond the existing 14
- UX or visual changes
- Backend API changes

## Technical Constraints

- No build step — pure ES6 modules loaded from CDN
- Vue 3 Options API — not migrating to Composition API
- CDI wiring via @alt-javascript/cdi — all services must follow the qualifier + constructor injection pattern
- HTML composition via m4 — template changes go in .compose fragments, then build.sh
- SRI hashes — any CDN URL changes require regenerating integrity hashes via generate-sri.mjs

## Integration Points

- @alt-javascript/cdi — constructor-based DI; new modules must register in contexts.js
- .compose/build.sh — HTML fragments must be valid m4 input; recompose after template changes
- .tests/ Playwright suite — the verification harness; must pass unchanged

## Open Questions

- None — all decisions captured during discussion
