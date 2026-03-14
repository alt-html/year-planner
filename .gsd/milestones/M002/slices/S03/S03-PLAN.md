# S03: API layer modularisation and fetch migration

**Goal:** Replace all superagent HTTP calls in Api.js with native fetch via a shared `fetchJSON` helper. Split Api methods into SyncApi, AuthApi, ProfileApi sub-modules imported by the Api facade. Remove superagent CDN dependency. All 14 E2E tests pass, including the sync-error test.
**Demo:** Api.js delegates to 3 focused sub-modules using fetch. No superagent script tag in index.html. Sync-error E2E test still shows visible error alert on API failure.

## Must-Haves

- `js/service/api-utils.js` created with `fetchJSON` helper that throws on non-OK responses
- `js/service/SyncApi.js` created with synchroniseToRemote/synchroniseToLocal using fetchJSON
- `js/service/AuthApi.js` created with register/signin/deleteRegistration using fetchJSON
- `js/service/ProfileApi.js` created with all profile/verify/email/payment methods using fetchJSON
- `Api.js` refactored as facade delegating to sub-modules
- superagent script tag removed from `.compose/fragments/head.html`
- `window.request = superagent;` removed from `Application.js`
- `index.html` recomposed via `.compose/build.sh`
- All 14 Playwright E2E tests pass (especially sync-error test)

## Proof Level

- This slice proves: integration
- Real runtime required: yes (E2E tests boot the app and test sync error flow)
- Human/UAT required: no

## Verification

- `cd .tests && npx playwright test` — all 14 tests pass
- `grep -r "superagent\|window\.request" js/ .compose/ index.html` — no remaining references

## Observability / Diagnostics

- Runtime signals: fetch errors surface as model.error or model.modalError values, rendered as .alert-danger in templates
- Inspection surfaces: browser devtools Network tab shows fetch requests; console shows uncaught promise rejections
- Failure visibility: sync-error E2E test verifies the error alert is visible on API failure
- Redaction constraints: none

## Integration Closure

- Upstream surfaces consumed: `js/service/Api.js` (source of all API methods), `js/Application.js` (superagent init), `.compose/fragments/head.html` (superagent CDN tag)
- New wiring introduced in this slice: Api.js facade pattern delegating to SyncApi/AuthApi/ProfileApi sub-modules via fetchJSON
- What remains before the milestone is truly usable end-to-end: S04 (dependency cleanup), S05 (CDI wiring + final integration)

## Tasks

- [x] **T01: Create api-utils.js and 3 API sub-modules** `est:30m`
  - Why: Core deliverable — split Api methods into focused modules with fetch replacing superagent
  - Files: `js/service/api-utils.js`, `js/service/SyncApi.js`, `js/service/AuthApi.js`, `js/service/ProfileApi.js`
  - Do: Create `api-utils.js` with `fetchJSON(url, options)` helper. Create 3 sub-module classes, each with constructor taking the same dependencies as Api (model, storageLocal, storageRemote, i18n). Move methods per research grouping. Replace all `request.METHOD(url).send(data).set(headers).then().catch()` with `fetchJSON(url, {method, body, headers}).then().catch()`. Keep `modalErr` as a shared method on each class or in api-utils. Delete `getData()` (unused).
  - Verify: Files created, all method signatures preserved
  - Done when: All 3 sub-module files exist with all methods using fetchJSON

- [x] **T02: Refactor Api.js as facade, remove superagent, recompose, verify** `est:20m`
  - Why: Wire sub-modules into Api facade, remove superagent dependency, verify all tests pass
  - Files: `js/service/Api.js`, `js/Application.js`, `.compose/fragments/head.html`, `index.html`
  - Do: Refactor Api.js to import SyncApi/AuthApi/ProfileApi and delegate all method calls. Remove `window.request = superagent;` from Application.js. Remove superagent script tag from head.html. Run `.compose/build.sh` to recompose index.html. Run E2E tests. Fix any fetch-related issues.
  - Verify: `cd .tests && npx playwright test` — all 14 pass; `grep -r "superagent" js/ .compose/ index.html` — no references
  - Done when: All 14 E2E tests pass, no superagent references remain

## Files Likely Touched

- `js/service/api-utils.js` (new)
- `js/service/SyncApi.js` (new)
- `js/service/AuthApi.js` (new)
- `js/service/ProfileApi.js` (new)
- `js/service/Api.js` (modified — facade)
- `js/Application.js` (modified — remove superagent init)
- `.compose/fragments/head.html` (modified — remove superagent tag)
- `index.html` (recomposed)
