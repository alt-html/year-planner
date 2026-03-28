---
id: M007
title: "Boot v3 Uplift"
status: complete
completed_at: 2026-03-28T09:21:21.606Z
key_decisions:
  - vueStarter (boot-vue@3) used instead of Boot.boot() + createCdiApp separately — vueStarter is a composite that handles config detection, CDI context setup, Vue app creation, and mount in one call, which is cleaner and avoids the ordering risk noted in the milestone risks.
  - ProfileAwareConfig is used directly without ConfigFactory.getConfig() wrapping — it implements has()/get() natively and Boot.detectConfig() cannot wrap it cleanly in browser mode.
  - cdn-routes.js extracted as a shared helper used by both globalSetup.js and the per-test cdn.js fixture, ensuring consistent CDN interception in all test execution contexts.
  - SRI integrity attributes stripped from index.html in globalSetup.js route interception — Playwright's fixture mechanism handles this automatically for per-test context, but globalSetup needs it explicitly since fixture middleware isn't active.
  - app.js exports a plain component definition (no Vue.createApp call at module load) — Vue app creation is fully delegated to vueStarter.
key_files:
  - js/main.js
  - js/config/config.js
  - js/config/contexts.js
  - js/Application.js
  - js/vue/app.js
  - .tests/fixtures/cdn-routes.js
  - .tests/fixtures/cdn.js
  - .tests/globalSetup.js
  - .tests/fixtures/alt-javascript-boot-vue-esm.js
  - .tests/fixtures/alt-javascript-boot-esm.js
  - .tests/fixtures/alt-javascript-cdi-esm.js
  - .tests/fixtures/alt-javascript-config-esm.js
  - .tests/fixtures/alt-javascript-logger-esm.js
  - .tests/fixtures/alt-javascript-common-esm.js
  - .tests/fixtures/lodash-es.min.js
lessons_learned:
  - vueStarter from boot-vue@3 is a complete bootstrap entry point — prefer it over manually chaining Boot.boot() + createCdiApp. It eliminates the CDI ordering risk entirely.
  - The CDN intercept pattern needs to be registered in both per-test fixtures and globalSetup for full coverage. Extracting a shared cdn-routes.js helper eliminates the risk of divergence between the two contexts.
  - SRI integrity hashes on CDN tags will cause browser verification failures when routes are intercepted with local fixture files. Either strip integrity attrs (as done here in globalSetup) or serve fixtures with matching content.
  - ProfileAwareConfig in browser mode cannot be further wrapped by ConfigFactory.getConfig() — it must be used directly. The has()/get() interface is satisfied natively.
  - When grepping for v2 CDN references, check both js/ source files and .tests/fixtures/cdn*.js to confirm the fixture interception layer is also clean.
---

# M007: Boot v3 Uplift

**Replaced all @alt-javascript v2 CDN imports with v3.0.x bundles, adopted the vueStarter/ProfileAwareConfig/Context+Singleton API, and kept all 14 E2E tests green with fully offline fixture interception.**

## What Happened

M007 replaced the entire @alt-javascript CDN stack from v2 to v3.0.x across two slices.

**S01 — Core framework swap:** `js/config/config.js` was rewritten to use `ProfileAwareConfig` + `BrowserProfileResolver`, replacing the old `ConfigFactory.getConfig()` + v2 URL-key encoding pattern (`"http://127+0+0+1:8080/"`). `js/config/contexts.js` was updated to use `Context` + `Singleton` helpers from the v3 cdi ESM bundle, dropping the bare class-array pattern. The v2 manual `LoggerFactory`/`LoggerCategoryCache` construction was removed — the global root is populated automatically by vueStarter. The six service classes (`Api`, `Application`, `AuthProvider`, `Storage`, `StorageLocal`, `StorageRemote`) were untouched; the `this.qualifier`/`this.logger = null` CDI wiring pattern is backward-compatible with v3.

**S02 — main.js wire-up and E2E fixture coverage:** `js/main.js` was rewritten to use `vueStarter` from `@alt-javascript/boot-vue@3`, which handles the full CDI context setup, Vue app creation, and mount — replacing the previous raw `ApplicationContext` construction. `js/Application.js` was trimmed to configure the Vue app only; mounting is delegated to vueStarter. `js/vue/app.js` was updated to export a plain component definition rather than calling `Vue.createApp` on module load.

A `cdn-routes.js` shared helper was extracted to serve intercept registration to both the per-test `cdn.js` fixture and `globalSetup.js`. Seven new fixture files were added to `.tests/fixtures/` (the six v3 ESM bundles + lodash-es). All 14 Playwright E2E tests pass with fully offline CDN interception.

The actual implementation deviated slightly from the plan: `Boot.boot()` was not used directly — instead `vueStarter` (from boot-vue@3) was used, which internally handles config detection, CDI context setup, and Vue app lifecycle. This is cleaner than manually calling `Boot.boot()` + `createCdiApp` separately.

Commit `7cdf30d` (feat: uplift to @alt-javascript v3 with vueStarter pattern) landed on the working branch and was merged to main via `c284e3b`.

## Success Criteria Results

- ✅ **App boots using only @alt-javascript v3.0.x CDN bundles — no v2 references remain.** `grep` across `js/` and `.tests/fixtures/cdn*.js` finds zero v2 `@alt-javascript` references. `index.html` imports only v3 ESM bundle URLs.
- ✅ **`js/config/config.js` uses `ProfileAwareConfig` + `BrowserProfileResolver`.** File confirmed: `localhost:8080` and `127.0.0.1:8080` map to `dev` profile; dev overlay carries `logging.format/level`; old `"http://127+0+0+1:8080/"` key is gone.
- ✅ **`js/config/contexts.js` uses `Context`/`Singleton` helpers.** File confirmed: `new Context([new Singleton(...)])` pattern; manual `LoggerFactory`/`LoggerCategoryCache` construction removed.
- ✅ **`js/main.js` uses `vueStarter` from boot-vue@3.** `Boot.boot()` + `createCdiApp` were folded into the `vueStarter` call, which is a cleaner composite. `raw new ApplicationContext()` is gone.
- ✅ **All service classes continue to autowire via `this.qualifier`/`this.logger = null`.** No service files were modified.
- ✅ **All 14 existing Playwright E2E tests pass.** Fresh test run: 14 passed in 6.2s.
- ✅ **Playwright CDN fixture intercepts cover all six v3 bundle URLs + lodash-es.** `cdn-routes.js` registers 6 `@alt-javascript/*@3` routes + 1 lodash-es route. Old v2 intercepts were not present (app previously hit real CDN); new intercepts enable fully offline testing.

## Definition of Done Results

- ✅ **All JS files import from `@alt-javascript/*@3` CDN URLs only.** `grep` confirms zero v2 references across `js/` and test fixture files.
- ✅ **`config.js` uses `ProfileAwareConfig`/`BrowserProfileResolver`; old `"http://127+0+0+1:8080/"` key is gone.** Confirmed in file contents.
- ✅ **`contexts.js` uses `Context`/`Singleton`; manual `LoggerFactory` construction is gone.** Confirmed in file contents.
- ✅ **`main.js` uses `vueStarter` (boot-vue@3); raw `new ApplicationContext()` is gone.** vueStarter subsumes Boot.boot() + createCdiApp in a single call. Confirmed.
- ✅ **All 14 E2E tests pass clean.** 14/14, 6.2s.
- ✅ **CDN fixture intercepts in `cdn-routes.js` cover all 6 v3 bundles plus lodash-es; old v2 intercepts removed.** cdn-routes.js has 6 `@alt-javascript` routes + 1 lodash-es route. No v2 routes present.
- ✅ **Both slices complete.** S01 ✓, S02 ✓. Slice summaries exist at expected paths.

## Requirement Outcomes

**MOD-09 — Wire all new modules through CDI:** Advanced. The v3 CDI Context/Singleton pattern is now in production in `contexts.js`. All service classes wire correctly through the vueStarter CDI lifecycle. Status remains active (full coverage deferred to post-M002 split work) but the v3 wiring foundation is validated.

**MOD-10 — All 14 existing Playwright E2E tests pass:** Validated by this milestone. 14/14 pass with the v3 stack.

All other active requirements (MOD-01 through MOD-08, STO-*, AUTH-*) are unaffected by this milestone and remain in their existing state.

## Deviations

vueStarter (boot-vue@3) was used instead of the planned Boot.boot() + createCdiApp() split. vueStarter is a higher-level composite that wraps both, so the plan's intent is fully met — this is a cleaner implementation, not a scope reduction. The manual global root population approach sketched in S01 was also superseded: vueStarter handles the logger/config injection internally.

## Follow-ups

MOD-09 (CDI wiring for split modules) remains active and is the primary target for a future milestone once the M002 sub-module split (SyncApi/AuthApi/ProfileApi) is completed. The v3 Context/Singleton foundation is now in place for that work.
