# S02: Model restructuring

**Goal:** Split the monolithic 43-field `model.js` into 4 domain-grouped source files under `js/vue/model/`, with all 17 dynamic fields (currently ghost fields set only by Application.js) declared with initial values. The flat model for `data()` is preserved via spread merge — no template or method module changes needed.
**Demo:** `model.js` imports 4 domain sub-files and spreads them flat alongside CDI fields. All ~60 model fields are documented in source. All 14 Playwright E2E tests pass unchanged.

## Must-Haves

- 4 model sub-files created: `calendar.js`, `planner.js`, `auth.js`, `ui.js` under `js/vue/model/`
- All 17 dynamic fields (set by Application.js) declared with sensible initial values in sub-files
- All 43 static fields from model.js distributed across sub-files or kept in model.js (CDI fields)
- `model.js` imports all 4 sub-files and spreads them into the exported model object
- CDI fields (qualifier, logger, api, messages, storage, storageLocal) and feature import stay in model.js
- No template or method module changes
- All 14 Playwright E2E tests pass

## Proof Level

- This slice proves: integration
- Real runtime required: yes (E2E tests boot the app in a browser)
- Human/UAT required: no

## Verification

- `cd .tests && npx playwright test` — all 14 tests pass
- `node -e "..."` inline check that all field names from original model.js appear in the new spread

## Observability / Diagnostics

- Runtime signals: Vue console errors on boot if any model field is missing (undefined in template bindings)
- Inspection surfaces: browser devtools Vue tab — all reactive data properties visible. E2E tests exercise boot, entry CRUD, planner management
- Failure visibility: Playwright test output shows which test failed and the browser console error
- Redaction constraints: none

## Integration Closure

- Upstream surfaces consumed: `js/vue/model.js` (source of all model fields), `js/Application.js` (dynamic field population — no changes needed)
- New wiring introduced in this slice: model.js spread-merge of 4 domain sub-files replaces inline field declarations
- What remains before the milestone is truly usable end-to-end: S03 (API split), S04 (dependency cleanup), S05 (CDI wiring + final integration)

## Tasks

- [x] **T01: Create 4 model sub-files and update model.js merge point** `est:20m`
  - Why: This is the core deliverable — split model fields into domain-grouped source files and wire them back into the flat model
  - Files: `js/vue/model/calendar.js`, `js/vue/model/planner.js`, `js/vue/model/auth.js`, `js/vue/model/ui.js`, `js/vue/model.js`
  - Do: Create `js/vue/model/` directory. Extract fields from model.js into 4 sub-files per the research grouping. Declare dynamic fields (from Application.js) with sensible defaults (null, '', 0, false, []). Each sub-file exports a named const. Update model.js to import all 4 and spread into the model object alongside CDI fields and feature import. Verify no field name duplicates across sub-files.
  - Verify: `cd .tests && npx playwright test` — all 14 tests pass. Grep confirms all original field names present in new files.
  - Done when: All sub-files exist, model.js uses spread merge, no fields missing, all 14 E2E tests pass

## Files Likely Touched

- `js/vue/model/calendar.js` (new)
- `js/vue/model/planner.js` (new)
- `js/vue/model/auth.js` (new)
- `js/vue/model/ui.js` (new)
- `js/vue/model.js` (modified)
