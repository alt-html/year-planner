# M002: JS Modularisation

**Vision:** Decompose the monolithic Vue controller, model, and API service into focused, single-responsibility ES6 modules. The app behaves identically afterward — all 14 E2E tests pass, no user-visible changes. The codebase is clean and ready for M003 (storage) and M004 (auth) to work against well-defined module boundaries.

## Success Criteria

- controller.js replaced by 5 domain-grouped method modules
- model.js restructured from flat bag into grouped sub-objects
- Api.js replaced by SyncApi, AuthApi, ProfileApi modules
- superagent replaced with native fetch
- SquareUp.js and all payment code removed
- lodash replaced with native Array methods
- Feature flags in a proper ES6 module without window globals
- All HTML template bindings updated and recomposed via m4
- All new modules wired through CDI
- All 14 Playwright E2E tests pass unchanged

## Key Risks / Unknowns

- **Model restructuring cascades to templates** — Changing model field paths requires updating ~75 template bindings across 18 .compose fragments. One missed binding breaks the app.
- **CDI wiring with split modules** — Splitting Api.js into 3 modules changes constructor parameter names and the dependency graph.
- **fetch vs superagent error semantics** — Error handling patterns differ; the UI error feedback must still work correctly.

## Proof Strategy

- Model restructuring cascade → retire in S02 by proving all 14 E2E tests pass with restructured model and updated templates
- CDI wiring with split modules → retire in S05 by proving the app boots with all new modules resolved by CDI
- fetch error semantics → retire in S03 by proving sync-error.spec.js still passes with fetch-based API modules

## Verification Classes

- Contract verification: 14 Playwright E2E tests (boot, entry CRUD, planner management, sync error, tooltip XSS, compose, harness)
- Integration verification: app boots in browser with no console errors, all user flows work
- Operational verification: Docker serve works, .compose/build.sh produces valid index.html
- UAT / human verification: visual spot-check that app looks and behaves the same

## Milestone Definition of Done

This milestone is complete only when all are true:

- All 5 slices complete
- controller.js, Api.js, model.js replaced by focused modules
- superagent, lodash, and SquareUp CDN dependencies removed
- HTML templates updated in .compose fragments and recomposed
- All new modules wired through CDI in contexts.js
- All 14 existing Playwright E2E tests pass
- App boots with no console errors
- .compose/build.sh produces valid recomposed index.html

## Requirement Coverage

- Covers: MOD-01, MOD-02, MOD-03, MOD-04, MOD-05, MOD-06, MOD-07, MOD-08, MOD-09, MOD-10
- Partially covers: none
- Leaves for later: STO-01–STO-05 (M003), AUTH-01–AUTH-06 (M004)
- Orphan risks: none

## Slices

- [ ] **S01: Controller decomposition** `risk:medium` `depends:[]`
  > After this: controller.js replaced by 5 domain-grouped method modules (calendar, entries, planner, auth, ui-lifecycle). App boots and all 14 E2E tests pass. Methods still use flat model fields.

- [ ] **S02: Model restructuring and template update** `risk:high` `depends:[S01]`
  > After this: model.js split into grouped sub-objects. All .compose HTML fragments updated with new field paths. index.html recomposed via m4. All 14 E2E tests pass with restructured model.

- [ ] **S03: API layer modularisation and fetch migration** `risk:medium` `depends:[S01]`
  > After this: Api.js replaced by SyncApi, AuthApi, ProfileApi using native fetch. superagent CDN dependency removed. Sync-error E2E test still passes. All 14 tests pass.

- [ ] **S04: Dependency cleanup** `risk:low` `depends:[S01,S03]`
  > After this: SquareUp.js deleted, payment modal removed, lodash replaced with native methods, feature flags in proper ES6 module. All 14 tests pass.

- [ ] **S05: CDI wiring and integration verification** `risk:low` `depends:[S01,S02,S03,S04]`
  > After this: All new modules registered in contexts.js. Full integration verified — app boots, all 14 Playwright tests pass, no console errors. Milestone complete.

## Boundary Map

### S01 → S02

Produces:
- `js/vue/methods/calendar.js` → `calendarMethods` object (setYear, navigateToYear)
- `js/vue/methods/entries.js` → `entryMethods` object (updateEntry, getEntry, getEntryType, getEntryColour, getEntryTypeIcon, updateWeekColour, updateEntryState)
- `js/vue/methods/planner.js` → `plannerMethods` object (createPlanner, createLocalPlanner, deletePlannerByYear, showRenamePlanner, renamePlanner, getPlannerName, getPlannerNameByUidYear, getPlannerYears, sharePlanner, copyUrl)
- `js/vue/methods/auth.js` → `authMethods` object (register, signin, signout, showSignin, showRegister, showResetPassword, showRecoverUser, showProfile, peekPass, unpeekPass, peekNewPass, unpeekNewPass, clearModalAlert)
- `js/vue/methods/lifecycle.js` → `lifecycleMethods` object (refresh, initialise, setLocalFromModel, clearError)
- `js/vue/app.js` → updated to import and merge all method modules

Consumes:
- nothing (first slice)

### S01 → S03

Produces:
- Same method modules as above — S03 depends on controller being split so Api.js split doesn't conflict

Consumes:
- nothing (first slice)

### S02 → S05

Produces:
- `js/vue/model/auth.js` → auth-related state (uuid, username, password, etc.)
- `js/vue/model/planner.js` → planner-related state (planner, month, day, entry, etc.)
- `js/vue/model/calendar.js` → calendar-related state (year, firstWeekdayOfMonth, daysInMonth, etc.)
- `js/vue/model/ui.js` → UI transient state (error, warning, modalError, loaded, etc.)
- `js/vue/model.js` → updated to compose sub-objects into flat model for Vue data()
- Updated .compose HTML fragments with new binding paths
- Recomposed index.html

Consumes from S01:
- Split method modules (must be updated to use new model field paths)

### S03 → S04

Produces:
- `js/service/SyncApi.js` → synchroniseToRemote(), synchroniseToLocal() using fetch
- `js/service/AuthApi.js` → register(), signin(), deleteRegistration() using fetch
- `js/service/ProfileApi.js` → setUsername(), setPassword(), setEmail(), setMobile(), sendVerificationEmail(), verifyEmailToken(), sendRecoverPasswordEmail(), sendRecoverUsernameEmail(), email() using fetch
- `js/service/api-utils.js` → shared error handler, fetch wrapper
- superagent CDN script tag removed from index.html

Consumes from S01:
- Split method modules (controller no longer calls monolithic `this.api.xxx`)

### S04 → S05

Produces:
- SquareUp.js deleted, payment modal HTML removed
- `js/vue/model-features.js` → rewritten as proper ES6 module without window.ftoggle
- lodash-es CDN import removed from StorageLocal.js and StorageRemote.js
- Native Array methods replacing _.filter, _.find, _.findIndex, _.uniq, _.map, _.remove

Consumes from S01:
- Split method modules (payment methods removed from auth methods module)
Consumes from S03:
- Split API modules (payment API methods removed from ProfileApi)

### S05

Produces:
- `js/config/contexts.js` → updated with all new module registrations
- Verified: all 14 E2E tests pass, app boots cleanly, no console errors

Consumes from S01: split method modules
Consumes from S02: restructured model, updated templates
Consumes from S03: split API modules
Consumes from S04: cleaned up dependencies
