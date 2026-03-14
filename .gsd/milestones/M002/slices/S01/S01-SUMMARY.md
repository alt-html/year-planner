---
id: S01
parent: M002
milestone: M002
provides:
  - 5 domain-grouped method modules under js/vue/methods/
  - Updated app.js with spread-merge replacing monolithic controller import
  - Controller removed from CDI registration in contexts.js
requires: []
affects:
  - S02
  - S03
  - S04
  - S05
key_files:
  - js/vue/methods/calendar.js
  - js/vue/methods/entries.js
  - js/vue/methods/planner.js
  - js/vue/methods/auth.js
  - js/vue/methods/lifecycle.js
  - js/vue/app.js
  - js/config/contexts.js
key_decisions:
  - Mechanical extraction only — no refactoring of method bodies, preserving exact behaviour
  - controller.js left on disk (no longer imported) — can be deleted in future cleanup
  - model.js qualifier string unchanged — CDI autowiring unaffected
patterns_established:
  - Method modules export named const object literals with method shorthand (e.g. export const calendarMethods = { setYear() { ... } })
  - app.js spread-merges all method modules into Vue methods option
  - Modules needing Luxon import DateTime from CDN URL directly
observability_surfaces:
  - Vue console errors on boot if any method is missing
  - 14 Playwright E2E tests cover boot, entry CRUD, planner management, sync error
drill_down_paths:
  - .gsd/milestones/M002/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M002/slices/S01/tasks/T02-SUMMARY.md
duration: 15m
verification_result: passed
completed_at: 2026-03-14
---

# S01: Controller decomposition

**Split monolithic controller.js into 5 domain-grouped method modules with spread-merge in app.js — all 14 E2E tests pass**

## What Happened

Extracted all 36 method definitions from the 314-line `controller.js` into 5 focused modules under `js/vue/methods/`:
- `calendar.js` — 2 methods (setYear, navigateToYear)
- `entries.js` — 7 methods (updateEntry, updateWeekColour, updateEntryState, getEntry, getEntryType, getEntryColour, getEntryTypeIcon)
- `planner.js` — 10 methods (createPlanner, createLocalPlanner, deletePlannerByYear, showRenamePlanner, renamePlanner, getPlannerName, getPlannerNameByUidYear, getPlannerYears, sharePlanner, copyUrl)
- `auth.js` — 14 methods (showProfile, showRegister, register, signin, signout, showSignin, showResetPassword, showRecoverUser, showDonate, clearModalAlert, peekPass, unpeekPass, peekNewPass, unpeekNewPass)
- `lifecycle.js` — 3 methods (refresh, initialise, clearError)

Updated `app.js` to import and spread all 5 modules. Removed controller import and CDI registration from `contexts.js`.

## Verification

- All 14 Playwright E2E tests pass (14.4s)
- Diff of sorted method names between controller.js and combined methods/*.js is empty — no methods omitted
- `grep -rn "controller" js/` confirms no remaining imports of controller.js

## Requirements Advanced

- MOD-01 — Controller decomposed into 5 domain-grouped method modules

## Requirements Validated

- MOD-01 — All 14 E2E tests pass with split controller, proving behaviour-preserving decomposition

## New Requirements Surfaced

- None

## Requirements Invalidated or Re-scoped

- None

## Deviations

None.

## Known Limitations

- `controller.js` file still exists on disk — it's no longer imported but hasn't been deleted
- Auth methods (showProfile, showRegister, etc.) are not directly tested by E2E — they work because the Vue merge is correct, but auth flows weren't exercised

## Follow-ups

None — S02 (model restructuring) is the planned next step.

## Files Created/Modified

- `js/vue/methods/calendar.js` — new, 2 calendar methods
- `js/vue/methods/entries.js` — new, 7 entry methods
- `js/vue/methods/planner.js` — new, 10 planner methods
- `js/vue/methods/auth.js` — new, 14 auth methods
- `js/vue/methods/lifecycle.js` — new, 3 lifecycle methods
- `js/vue/app.js` — replaced controller import with 5 method module spread-merge
- `js/config/contexts.js` — removed controller import and CDI registration

## Forward Intelligence

### What the next slice should know
- The 5 method modules are plain object literals at `js/vue/methods/*.js`. S02 must update `this.fieldName` references inside these files when model fields move to grouped sub-objects.
- Cross-module `this` calls are common: refresh→setYear, createPlanner→createLocalPlanner, updateWeekColour→getEntry/getEntryType/updateEntry. These work because all methods merge onto the same Vue instance.
- The `mounted()` hook in app.js calls `this.refresh()` — this stays unchanged.

### What's fragile
- Cross-module `this` method calls — they're invisible at import time and only work because Vue merges everything flat. Breaking the merge pattern would silently break these calls.

### Authoritative diagnostics
- `cd .tests && npx playwright test` — 14 tests, ~15s. This is the authoritative verification for behaviour preservation.

### What assumptions changed
- Research said 34 methods — actual count is 36 method definitions (some like showProfile have empty bodies but still count as methods). All accounted for.
