# Quick Task: In the PlannerStore, is const isOld = dayObj['1'] !== undefined || dayObj['0'] !== undefined; required any longer?  the old format shouldn't be needed should it?  If not lets clean it up?

**Date:** 2026-04-16
**Branch:** main

## What Changed
- Removed legacy numeric day-field handling from `PlannerStore.importDays()`.
- Deleted `isOld` branch and all `dayObj['0'..'4']` mapping in PlannerStore.
- `importDays()` now imports only the modern schema fields: `tp`, `tl`, `col`, `notes`, `emoji`.
- Added regression coverage to lock the new contract:
  - modern shape imports correctly
  - legacy numeric payload in `importDays()` is ignored (no day entry created)

## Files Modified
- `site/js/service/PlannerStore.js`
- `.tests/e2e/plannerstore-import-modern.spec.js`

## Verification
- `npm --prefix .tests run test -- --reporter=line e2e/plannerstore-import-modern.spec.js e2e/planner-management.spec.js e2e/migration.spec.js`
- Result: **4 passed**.
