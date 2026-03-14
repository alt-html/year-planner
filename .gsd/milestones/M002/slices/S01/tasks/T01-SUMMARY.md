---
id: T01
parent: S01
milestone: M002
provides:
  - 5 domain-grouped method modules under js/vue/methods/
  - Updated app.js with spread-merge of all method modules
key_files:
  - js/vue/methods/calendar.js
  - js/vue/methods/entries.js
  - js/vue/methods/planner.js
  - js/vue/methods/auth.js
  - js/vue/methods/lifecycle.js
  - js/vue/app.js
key_decisions:
  - Preserved exact method bodies from controller.js — no refactoring, just mechanical extraction
patterns_established:
  - Method modules export named const object literals (e.g. calendarMethods) with method shorthand
  - app.js imports and spreads all method modules into Vue methods option
  - Modules that need Luxon import DateTime from the CDN URL directly
observability_surfaces:
  - Vue console errors on boot if any method is missing or arrow function breaks this binding
  - E2E tests exercise boot, entry CRUD, planner management, sync error handling
duration: 10m
verification_result: passed
completed_at: 2026-03-14
blocker_discovered: false
---

# T01: Create 5 method modules and update app.js merge point

**Split monolithic controller.js into 5 domain-grouped method modules and wired them into app.js via spread merge**

## What Happened

Created `js/vue/methods/` directory with 5 modules extracted mechanically from `controller.js`:
- `calendar.js` (2 methods: setYear, navigateToYear)
- `entries.js` (7 methods: updateEntry, updateWeekColour, updateEntryState, getEntry, getEntryType, getEntryColour, getEntryTypeIcon)
- `planner.js` (9 methods: createPlanner, createLocalPlanner, deletePlannerByYear, showRenamePlanner, renamePlanner, getPlannerName, getPlannerNameByUidYear, getPlannerYears, sharePlanner, copyUrl)
- `auth.js` (12 methods: showProfile, showRegister, register, signin, signout, showSignin, showResetPassword, showRecoverUser, showDonate, clearModalAlert, peekPass, unpeekPass, peekNewPass, unpeekNewPass)
- `lifecycle.js` (3 methods: refresh, initialise, clearError)

Updated `app.js` to import all 5 modules and spread them into `methods: { ...calendarMethods, ...entryMethods, ...plannerMethods, ...authMethods, ...lifecycleMethods }`. Removed the `import { controller }` from `app.js`.

Verified all method names from the original controller are present in the new modules (diff of sorted method names is empty).

## Verification

- `cd .tests && npx playwright test` — all 14 tests passed (18.8s)
- Diff of sorted method names between controller.js and combined methods/*.js — empty (all 36 method definitions accounted for)

## Diagnostics

- Missing methods surface as `TypeError: this.xxx is not a function` in browser console and cause E2E test failures
- Cross-module `this` calls (e.g. refresh→setYear, createPlanner→createLocalPlanner) work because all methods merge onto the same Vue instance

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `js/vue/methods/calendar.js` — new, 2 calendar methods
- `js/vue/methods/entries.js` — new, 7 entry methods
- `js/vue/methods/planner.js` — new, 9 planner methods (plus copyUrl = 10)
- `js/vue/methods/auth.js` — new, 12 auth methods (plus peekPass/unpeekPass/peekNewPass/unpeekNewPass = 14 total with clearModalAlert)
- `js/vue/methods/lifecycle.js` — new, 3 lifecycle methods
- `js/vue/app.js` — replaced controller import with 5 method module imports and spread merge
