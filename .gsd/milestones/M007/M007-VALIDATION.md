---
verdict: needs-attention
remediation_round: 0
---

# Milestone Validation: M007

## Success Criteria Checklist

## Success Criteria Checklist

- [x] **App boots using only @alt-javascript v3.0.3 CDN bundles — no v2 references remain**
  Evidence: `js/main.js` imports `@alt-javascript/boot-vue@3`, `js/config/config.js` imports `@alt-javascript/config@3`, `js/config/contexts.js` imports `@alt-javascript/cdi@3`. Grep confirms zero `@alt-javascript/*@[^3]` references in `js/`. (Note: `luxon@2` references exist but are not an @alt-javascript package and are in scope.)

- [x] **`js/config/config.js` uses `ProfileAwareConfig` + `BrowserProfileResolver`**
  Evidence: File confirmed to use these exact imports. `localhost:8080` and `127.0.0.1:8080` map to `dev` profile. Old URL-key encoding (`"http://127+0+0+1:8080/"`) is gone.

- [x] **`js/config/contexts.js` uses `Context`/`Singleton` helpers, no manual LoggerFactory construction**
  Evidence: File confirmed to use `new Context([new Singleton(...)])`. No `LoggerFactory`/`LoggerCategoryCache`/`ConfigurableLogger` construction present.

- [x] **`js/main.js` uses `Boot.boot({config})` + `createCdiApp`/`vueStarter` from `boot-vue`**
  Evidence: `main.js` uses `vueStarter` from `@alt-javascript/boot-vue@3`. Note: `vueStarter` is the canonical current API (`createCdiApp` is deprecated in favour of it). The roadmap named `createCdiApp` but the fixture confirms these are equivalent — `createCdiApp` delegates to `vueStarter`. Criterion is met in substance.

- [x] **All service classes continue to autowire via existing `this.qualifier`/`this.logger = null` pattern unchanged**
  Evidence: S01 summary explicitly states service classes (`Api`, `Application`, `AuthProvider`, `Storage`, `StorageLocal`, `StorageRemote`) are unchanged.

- [x] **All 14 existing Playwright E2E tests pass**
  Evidence: `cd .tests && npx playwright test` — 14 passed (13.3s). All tests green.

- [~] **Playwright CDN fixture intercepts cover all six v3 bundle URLs so tests run fully offline**
  Evidence: **Partially met.** All six v3 bundle fixtures exist on disk and intercept routes are defined in `cdn-routes.js`. However, the per-test fixture `cdn.js` (used by all 14 specs via `require('../fixtures/cdn')`) does NOT include the v3 routes. Only `globalSetup.js` uses `cdn-routes.js`. Per-test CDN requests for v3 bundles fall through to the real CDN. Tests pass only because the machine has network access. The "fully offline" claim in the S02 summary is incorrect for the per-test fixture path.


## Slice Delivery Audit

## Slice Delivery Audit

| Slice | Claimed Output | Summary Evidence | Verdict |
|---|---|---|---|
| S01 | `config.js` — ProfileAwareConfig; `contexts.js` — Context/Singleton array; services unchanged | All three confirmed in code | ✅ Delivered |
| S01 | Boot.boot() ordering risk retired — loggers autowire correctly | 14 tests pass confirms this | ✅ Delivered |
| S01 | ProfileAwareConfig shape risk retired — api.url resolves to localhost:8081 on localhost:8080 | Config file confirms dev overlay; tests exercising API calls pass | ✅ Delivered |
| S02 | Seven fixture files in `.tests/fixtures/` | All seven files confirmed present on disk | ✅ Delivered |
| S02 | `cdn.js` updated with all 6 v3 + lodash-es intercept routes; old v2 routes removed | **Partial.** Routes exist in `cdn-routes.js` but `cdn.js` (per-test fixture used by all 14 specs) was NOT updated — still has only 10 routes, none covering v3 bundles | ⚠️ Partially Delivered |
| S02 | Zero v2 CDN references remain in `js/` or `cdn.js` | Confirmed by grep — no v2 @alt-javascript refs | ✅ Delivered |
| S02 | createCdiApp/run() split risk retired — data-app-ready fires, app fully mounts | boot.spec.js `waitForSelector('[data-app-ready]')` passes | ✅ Delivered |

**Deviation noted:** `main.js` uses `vueStarter` rather than the legacy `createCdiApp` name. This is an improvement (canonical API), not a regression. The roadmap named `createCdiApp` but the fixture ESM confirms `createCdiApp` is a deprecated alias for `vueStarter` — functionally identical.


## Cross-Slice Integration

## Cross-Slice Integration

### S01 → S02 boundary

**S01 produces:** `config.js` (ProfileAwareConfig), `contexts.js` (Context/Singleton array), services unchanged.
**S02 consumes:** stable config and contexts exports.

Actual `main.js` imports `config` from `./config/config.js` and `contexts` from `./config/contexts.js` and passes them to `vueStarter`. The boundary is intact.

### Global root / logger wiring

S01 summary notes that Boot.boot() global root is set manually in main.js via `getGlobalRef().boot = { contexts: { root: {...} } }`. The actual `main.js` does NOT contain this — it uses `vueStarter` which internally calls `Boot.boot({ config, contexts, run: false })`, letting the boot library handle the global root. This is cleaner than the manual approach described in S01 summary (S01 appears to have been superseded by S02's implementation). The integration works — tests confirm logger autowiring.

No cross-slice boundary mismatches that affect correctness.


## Requirement Coverage

## Requirement Coverage

**MOD-09 (CDI wiring pattern):** Covered. `contexts.js` uses `Context`/`Singleton` from v3 CDI; all service classes wired via CDI qualifiers. `vueStarter` calls `Boot.boot()` which initialises the CDI ApplicationContext.

**MOD-10 (All 14 E2E tests pass):** All 14 tests pass — confirmed by test run.

**All other active requirements (MOD-01 through MOD-08, STO-*, AUTH-*):** These are scoped to future milestones (M002–M004) and are not addressed by M007. This is expected per the roadmap's requirement coverage statement ("Covers: MOD-09 only").

No unaddressed requirements within M007's declared scope.


## Verdict Rationale
All six success criteria are met in substance. The one gap is that the per-test CDN fixture (cdn.js) was not updated with the v3 intercept routes — those routes were added to a new cdn-routes.js helper used only by globalSetup. This means per-test runs hit the real CDN for v3 bundles rather than running fully offline as claimed. All 14 tests pass and no behaviour is broken, but the "fully offline" guarantee is not delivered for the per-test fixture path. This is a minor, fixable gap that does not block milestone completion — the app is correctly migrated, tests are green, and the fixture files are present on disk. Verdict: needs-attention.
