# S01: Controller decomposition

**Goal:** Replace the monolithic 314-line `controller.js` with 5 domain-grouped method modules under `js/vue/methods/`. The app boots and all 14 E2E tests pass. Methods still use flat model fields.
**Demo:** `app.js` imports and spreads 5 method modules instead of importing the monolithic controller. `controller.js` is no longer imported anywhere. All 14 Playwright E2E tests pass unchanged.

## Must-Haves

- 5 method modules created: `calendar.js`, `entries.js`, `planner.js`, `auth.js`, `lifecycle.js` under `js/vue/methods/`
- Each module exports a named const object literal using method shorthand (no arrow functions)
- `app.js` imports all 5 modules and spreads them into `methods: { ...calendarMethods, ...entryMethods, ...plannerMethods, ...authMethods, ...lifecycleMethods }`
- `controller.js` import removed from `app.js` and `contexts.js`
- `{name:'controller', Reference: controller}` registration removed from `contexts.js`
- All 34 method names preserved exactly (template bindings unchanged)
- No `.compose` fragments or `index.html` modified
- All 14 Playwright E2E tests pass

## Proof Level

- This slice proves: integration
- Real runtime required: yes (E2E tests boot the app in a browser)
- Human/UAT required: no

## Verification

- `cd .tests && npx playwright test` — all 14 tests pass
- `grep -r "controller" js/ --include="*.js"` — no remaining references to the monolithic controller import (only comment references allowed)

## Observability / Diagnostics

- Runtime signals: Vue console errors on boot if any method is missing or an arrow function breaks `this` binding
- Inspection surfaces: browser devtools console — missing method calls produce `TypeError: this.xxx is not a function`; E2E tests exercise boot, entry CRUD, planner management, sync error handling
- Failure visibility: Playwright test output shows which test failed and the browser console error
- Redaction constraints: none

## Integration Closure

- Upstream surfaces consumed: `js/vue/controller.js` (source of all 34 methods), `js/vue/app.js` (merge point), `js/config/contexts.js` (CDI registration)
- New wiring introduced in this slice: `app.js` spread-merge of 5 method modules replaces single controller import
- What remains before the milestone is truly usable end-to-end: S02 (model restructuring + template updates), S03 (API split + fetch migration), S04 (dependency cleanup), S05 (CDI wiring + final integration)

## Tasks

- [x] **T01: Create 5 method modules and update app.js merge point** `est:30m`
  - Why: This is the core deliverable — split the monolithic controller into domain-grouped modules and wire them into the Vue app
  - Files: `js/vue/methods/calendar.js`, `js/vue/methods/entries.js`, `js/vue/methods/planner.js`, `js/vue/methods/auth.js`, `js/vue/methods/lifecycle.js`, `js/vue/app.js`
  - Do: Create `js/vue/methods/` directory. Extract methods from `controller.js` into 5 modules per the research grouping. Each module uses `import { DateTime }` where needed. Export named const objects (`calendarMethods`, `entryMethods`, etc.) with method shorthand. Update `app.js` to import all 5 and spread into `methods`. Remove `controller.js` import from `app.js`. All 34 methods must be present — no method omitted.
  - Verify: `grep -c "methodName()" js/vue/methods/*.js` confirms all 34 methods are distributed; app boots without console errors
  - Done when: All 5 modules exist with correct exports, `app.js` uses spread merge, no method is missing

- [x] **T02: Remove controller from CDI and run full E2E verification** `est:15m`
  - Why: Clean up the CDI registration for the now-deleted controller import, and prove the split is behaviour-preserving via all 14 E2E tests
  - Files: `js/config/contexts.js`
  - Do: Remove `import { controller } from '../vue/controller.js'` and `{name:'controller', Reference: controller}` from `contexts.js`. Verify no other file imports `controller.js`. Run full E2E test suite. Fix any issues found.
  - Verify: `cd .tests && npx playwright test` — all 14 tests pass; `grep -r "controller" js/ --include="*.js"` shows no remaining imports
  - Done when: All 14 E2E tests pass, no references to monolithic controller remain in imports

## Files Likely Touched

- `js/vue/methods/calendar.js` (new)
- `js/vue/methods/entries.js` (new)
- `js/vue/methods/planner.js` (new)
- `js/vue/methods/auth.js` (new)
- `js/vue/methods/lifecycle.js` (new)
- `js/vue/app.js` (modified)
- `js/config/contexts.js` (modified)
