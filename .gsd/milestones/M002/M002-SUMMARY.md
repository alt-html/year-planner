---
id: M002
provides:
  - 5 domain-grouped method modules replacing monolithic controller.js
  - 4 domain-grouped model sub-files replacing monolithic model.js
  - Native fetch replacing superagent in Api.js
  - SquareUp/payment code removed, lodash replaced with native methods
  - Feature flags as proper ES6 module
  - 3 CDN dependencies removed (superagent, lodash-es, squareup)
key_decisions:
  - Flat spread merge for both method modules and model sub-files — no template changes needed
  - Api.js kept as single file with inline fetchJSON — sub-module split deferred due to test environment limitations
  - donate feature flag set to false after payment infrastructure removal
patterns_established:
  - Method modules export named const object literals spread into Vue methods option
  - Model sub-files export named const objects spread flat into model for data()
  - fetchJSON(url, options) pattern with error-throwing semantics for all HTTP calls
  - Native Array methods (filter, find, findIndex, map, Set) for all collection operations
observability_surfaces:
  - 14 Playwright E2E tests covering boot, entry CRUD, planner management, sync error, XSS, compose
requirement_outcomes:
  - id: MOD-01
    from_status: active
    to_status: validated
    proof: 5 method modules created, all 14 E2E tests pass
  - id: MOD-02
    from_status: active
    to_status: validated
    proof: 4 model sub-files created, flat merge preserves runtime behaviour
  - id: MOD-03
    from_status: active
    to_status: partial
    proof: fetch migration complete, sub-module split deferred
  - id: MOD-04
    from_status: active
    to_status: validated
    proof: superagent CDN removed, no references remain
  - id: MOD-05
    from_status: active
    to_status: validated
    proof: SquareUp.js deleted, all payment code removed
  - id: MOD-06
    from_status: active
    to_status: validated
    proof: lodash imports replaced with native Array methods
  - id: MOD-08
    from_status: active
    to_status: validated
    proof: model-features.js rewritten without window.ftoggle
duration: ~2h
verification_result: passed
completed_at: 2026-03-14
---

# M002: JS Modularisation

**Decomposed monolithic Vue controller, model, and API service into focused ES6 modules, removed 3 CDN dependencies, all 14 E2E tests pass**

## What Happened

M002 decomposed the monolithic JavaScript architecture across 5 slices:

**S01 (Controller decomposition):** Split the 314-line `controller.js` into 5 domain-grouped method modules under `js/vue/methods/` — calendar (2 methods), entries (7), planner (10), auth (14), lifecycle (3). `app.js` imports and spreads all modules into Vue's `methods` option.

**S02 (Model restructuring):** Split the 43-field `model.js` into 4 domain sub-files under `js/vue/model/` — calendar (10 fields), planner (12), auth (17), ui (9). Flat spread merge preserves the runtime model shape — no template or method changes needed. 17 dynamic fields previously only set by Application.js at runtime are now declared with initial values.

**S03 (Fetch migration):** Replaced all 18 superagent HTTP calls in `Api.js` with a `fetchJSON` helper using native `fetch`. The helper throws on non-OK responses with `.status` property, preserving existing catch handler patterns. Superagent CDN tag and `window.request` global removed. Sub-module split (SyncApi/AuthApi/ProfileApi) was attempted but reverted — ES module imports from Api.js to sibling files failed in the test CDN fixture environment.

**S04 (Dependency cleanup):** Deleted SquareUp.js and all payment code (modal, buttons, API methods, CDI registration). Replaced all 8 lodash calls in StorageLocal.js and StorageRemote.js with native Array equivalents. Rewrote model-features.js as proper ES6 module without `window.ftoggle` global.

**S05 (Integration verification):** Deleted orphaned controller.js. Full integration verified — 14 tests pass, app boots with no console errors.

## Cross-Slice Verification

| Success Criterion | Status | Evidence |
|---|---|---|
| controller.js replaced by 5 method modules | ✅ | S01: app.js spreads 5 modules, all 14 tests pass |
| model.js restructured into sub-objects | ✅ | S02: 4 sub-files, flat merge, all 14 tests pass |
| superagent replaced with fetch | ✅ | S03: fetchJSON helper, sync-error test passes |
| superagent CDN dependency removed | ✅ | S03: no superagent references in codebase |
| SquareUp.js and payment code removed | ✅ | S04: file deleted, all references removed |
| lodash replaced with native methods | ✅ | S04: no lodash imports remain |
| Feature flags in proper ES6 module | ✅ | S04: window.ftoggle removed |
| All 14 E2E tests pass | ✅ | S05: 14 passed (10.8s) |
| App boots with no console errors | ✅ | S05: browser verification, only verbose DOM suggestions |
| .compose/build.sh produces valid index.html | ✅ | Compose test passes (723 lines) |

## Requirement Changes

- MOD-01: active → validated — 5 method modules, all E2E tests pass
- MOD-02: active → validated — 4 model sub-files, flat merge preserves behaviour
- MOD-03: active → partial — fetch migration complete, sub-module file split deferred
- MOD-04: active → validated — superagent removed, no references
- MOD-05: active → validated — SquareUp and payment code removed
- MOD-06: active → validated — lodash replaced with native Array methods
- MOD-08: active → validated — ES6 module without window global

## Forward Intelligence

### What the next milestone should know
- The codebase now has clear module boundaries: methods in `js/vue/methods/`, model state in `js/vue/model/`, services in `js/service/`
- Api.js is still a single 400-line file — future split should investigate why ES module imports from Api.js to sibling .js files fail in the Playwright CDN fixture test environment
- CDI autowiring works on the flat model object — `qualifier`, `api`, `storage`, `storageLocal`, `messages` are null properties that CDI fills by name matching
- Template-bound Api methods (setUsername, setPassword, sendRecoverPasswordEmail, etc.) are called from .compose fragments without `api.` prefix and are likely broken at runtime — they're never tested because auth features are behind feature flags

### What's fragile
- Cross-module `this` method calls — methods in different modules call each other via Vue instance `this` (e.g. `refresh()` calls `this.setYear()`). Works because Vue merges everything flat, but invisible at import time.
- Test CDN fixture environment — ES module import chains from app code to local sibling files don't resolve when CDN fixtures are intercepting. This blocked the Api.js sub-module split.

### Authoritative diagnostics
- `cd .tests && npx playwright test` — 14 tests, ~11s. Primary verification for all M002 changes.
- `grep -rn 'superagent\|lodash\|SquareUp' js/ .compose/ index.html` — should return nothing

### What assumptions changed
- S02 was rated `risk:high` but flat merge made it trivially safe
- S03 sub-module split was expected to be straightforward but ES module imports failed in test environment
- Milestone completed faster than expected due to flat-merge approach avoiding template cascade
