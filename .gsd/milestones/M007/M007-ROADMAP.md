# M007: Boot v3 Uplift

**Vision:** Replace all @alt-javascript v2 CDN imports with v3.0.3, adopt the cleaner Boot/Context/Singleton API, migrate config to ProfileAwareConfig, wire boot-vue's createCdiApp, and keep all 14 E2E tests green throughout.

## Success Criteria

- App boots in the browser using only @alt-javascript v3.0.3 CDN bundles — no v2 references remain
- `js/config/config.js` uses `ProfileAwareConfig` + `BrowserProfileResolver` instead of the v2 URL-key encoding
- `js/config/contexts.js` uses `Context`/`Singleton` helpers and no longer manually constructs `LoggerFactory`/`LoggerCategoryCache`
- `js/main.js` uses `Boot.boot({config})` + `createCdiApp` from `boot-vue` instead of raw `ApplicationContext` construction
- All service classes continue to autowire via the existing `this.qualifier`/`this.logger = null` pattern unchanged
- All 14 existing Playwright E2E tests pass
- Playwright CDN fixture intercepts cover all six v3 bundle URLs so tests run fully offline

## Key Risks / Unknowns

- `Boot.boot()` global context setup must happen before `ApplicationContext` starts — wrong ordering silently breaks logger autowiring
- `createCdiApp` runs CDI with `{ run: false }` — `Application.run()` must be called explicitly after mount, not by the CDI lifecycle
- `ProfileAwareConfig` shape (nested `profiles.dev.*` overlay) is new; misconfiguration produces silent fallback to base values rather than an error

## Proof Strategy

- Boot.boot() ordering risk → retire in S01 by verifying logger autowires correctly in all services after the change
- createCdiApp/run() split risk → retire in S02 by confirming `data-app-ready` fires and the app fully mounts in the boot E2E test
- ProfileAwareConfig shape risk → retire in S01 by confirming API url resolves to `localhost:8081` when running on `localhost:8080`

## Verification Classes

- Contract verification: all 14 Playwright E2E tests pass (`cd .tests && npx playwright test`)
- Integration verification: app boots and mounts fully in browser with all v3 bundles (boot.spec.js `data-app-ready` assertion)
- Operational verification: none
- UAT / human verification: spot-check the running app in Docker — year grid renders, entries work, no console errors

## Milestone Definition of Done

This milestone is complete only when all are true:

- All JS files import from `@alt-javascript/*@3` CDN URLs only — grep confirms zero v2 references
- `config.js` uses `ProfileAwareConfig`/`BrowserProfileResolver`; the old `"http://127+0+0+1:8080/"` key is gone
- `contexts.js` uses `Context`/`Singleton`; manual `LoggerFactory` construction is gone
- `main.js` uses `Boot.boot()` + `createCdiApp`; raw `new ApplicationContext()` is gone
- All 14 E2E tests pass clean
- CDN fixture intercepts in `cdn.js` cover all 6 v3 bundles plus lodash-es; old v2 intercepts removed

## Requirement Coverage

- Covers: MOD-09 (CDI wiring pattern)
- Partially covers: none
- Leaves for later: none
- Orphan risks: none

## Slices

- [x] **S01: Core framework swap — config, contexts, Boot.boot()** `risk:high` `depends:[]`
  > After this: app boots with v3 config/logger/cdi bundles; `ProfileAwareConfig` resolves env-specific API URL; services autowire logger correctly; boot E2E test passes.

- [x] **S02: main.js — wire boot-vue createCdiApp + E2E fixture coverage** `risk:medium` `depends:[S01]`
  > After this: all 14 E2E tests pass with offline-intercepted v3 CDN fixtures; zero v2 CDN references remain in the codebase.

## Boundary Map

### S01 → S02

Produces:
- `js/config/config.js` — v3 `ProfileAwareConfig` instance, same `has()`/`get()` interface
- `js/config/contexts.js` — `Context([...Singleton(...)])` array, `loggerFactory`/`loggerCategoryCache` removed (Boot provides them via global root)
- All six service classes untouched — CDI wiring pattern is backward-compatible

Consumes:
- nothing (first slice)

### S02

Produces:
- `js/main.js` — `Boot.boot({config})` + `createCdiApp({contexts, config, rootComponent, onReady})` pattern
- `.tests/fixtures/cdn.js` — intercept routes for all 6 v3 ESM bundles + lodash-es; old v2 routes removed
- `.tests/fixtures/` — local copies of all 6 v3 ESM bundle files

Consumes:
- S01: stable config and contexts exports
