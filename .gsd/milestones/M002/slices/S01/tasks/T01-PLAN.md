---
estimated_steps: 7
estimated_files: 7
---

# T01: Create 5 method modules and update app.js merge point

**Slice:** S01 — Controller decomposition
**Milestone:** M002

## Description

Extract all 34 methods from the monolithic `controller.js` into 5 domain-grouped modules under `js/vue/methods/`. Each module exports a named const object literal with method shorthand (never arrow functions). Update `app.js` to import all 5 modules and spread them into the Vue `methods` option, replacing the single `controller` import.

Method grouping (from research):
- **calendar.js** (2): `setYear`, `navigateToYear`
- **entries.js** (7): `updateEntry`, `updateWeekColour`, `updateEntryState`, `getEntry`, `getEntryType`, `getEntryColour`, `getEntryTypeIcon`
- **planner.js** (9): `createPlanner`, `createLocalPlanner`, `deletePlannerByYear`, `showRenamePlanner`, `renamePlanner`, `getPlannerName`, `getPlannerNameByUidYear`, `getPlannerYears`, `sharePlanner`, `copyUrl`
- **auth.js** (12): `showProfile`, `showRegister`, `register`, `signin`, `signout`, `showSignin`, `showResetPassword`, `showRecoverUser`, `showDonate`, `clearModalAlert`, `peekPass`, `unpeekPass`, `peekNewPass`, `unpeekNewPass`
- **lifecycle.js** (3): `refresh`, `initialise`, `clearError`

Note: planner.js has 10 methods (sharePlanner + copyUrl counted separately). auth.js has 14 methods. Total = 2+7+10+14+3 = 36. Recount from controller.js to be exact during implementation.

## Steps

1. Create `js/vue/methods/calendar.js` — export `calendarMethods` containing `setYear` and `navigateToYear`. Import Luxon DateTime (needed by `setYear`).
2. Create `js/vue/methods/entries.js` — export `entryMethods` containing all 7 entry methods. Import Luxon DateTime (needed by `updateWeekColour`).
3. Create `js/vue/methods/planner.js` — export `plannerMethods` containing all planner methods including `sharePlanner` and `copyUrl`. Import Luxon DateTime (needed by `createLocalPlanner` and `renamePlanner`).
4. Create `js/vue/methods/auth.js` — export `authMethods` containing all auth/modal methods. No Luxon import needed.
5. Create `js/vue/methods/lifecycle.js` — export `lifecycleMethods` containing `refresh`, `initialise`, `clearError`. No Luxon import needed.
6. Update `js/vue/app.js` — remove `import { controller } from './controller.js'`, add imports for all 5 method modules, replace `methods: controller` with `methods: { ...calendarMethods, ...entryMethods, ...plannerMethods, ...authMethods, ...lifecycleMethods }`.
7. Verify all 34 methods from `controller.js` are accounted for across the 5 modules — no method omitted, no method duplicated. Use method shorthand syntax throughout (no arrow functions).

## Must-Haves

- [ ] All methods from controller.js are present in exactly one module (no omissions, no duplicates)
- [ ] Every method uses shorthand syntax (`methodName() {}`) not arrow functions
- [ ] Each module exports a single named const object literal
- [ ] Luxon DateTime imported only in modules that use it (calendar, entries, planner)
- [ ] `app.js` spread-merges all 5 modules into `methods`
- [ ] `app.js` no longer imports `controller.js`
- [ ] Method names are preserved exactly — no renames

## Verification

- Count methods in new modules matches count in controller.js (34 methods)
- `node -e "..."` or similar quick syntax check to confirm no import errors
- App loads in browser via E2E harness test: `cd .tests && npx playwright test smoke/harness.spec.js`

## Observability Impact

- Signals added/changed: None — no new logging or error paths. Same methods, just reorganised.
- How a future agent inspects this: Read `app.js` to see the 5 imports and spread pattern. Read any method module to find methods for that domain.
- Failure state exposed: Missing method → Vue runtime TypeError in browser console; arrow function → `this` is undefined in method body.

## Inputs

- `js/vue/controller.js` — source of all 34 methods, provides exact method bodies to extract
- `js/vue/app.js` — current merge point using `methods: controller`
- S01-RESEARCH.md method grouping — defines which methods go in which module

## Expected Output

- `js/vue/methods/calendar.js` — exports `calendarMethods` with 2 methods
- `js/vue/methods/entries.js` — exports `entryMethods` with 7 methods
- `js/vue/methods/planner.js` — exports `plannerMethods` with 10 methods (including sharePlanner, copyUrl)
- `js/vue/methods/auth.js` — exports `authMethods` with 14 methods
- `js/vue/methods/lifecycle.js` — exports `lifecycleMethods` with 3 methods
- `js/vue/app.js` — updated to import and spread all 5 modules
