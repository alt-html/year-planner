---
id: T01
parent: S01
milestone: M011
key_files:
  - site/js/service/SyncClient.js
  - site/js/service/StorageLocal.js
key_decisions:
  - Import HLC_ZERO from storage-schema.js (re-exported there) instead of calling HLC.zero() in SyncClient to avoid duplicate zero-clock instantiation
  - markEdited ticks from existing field clock (fallback baseClock) not always from sync clock — ensures monotonically increasing stamps offline
  - When serverChanges is empty, write current plannerDoc as new base snapshot so next sync has an accurate baseline
duration: 
verification_result: passed
completed_at: 2026-04-09T10:46:52.256Z
blocker_discovered: false
---

# T01: Created SyncClient.js with markEdited/sync/prune and added StorageLocal.getActivePlnrUuid()

**Created SyncClient.js with markEdited/sync/prune and added StorageLocal.getActivePlnrUuid()**

## What Happened

Read StorageLocal.js, storage-schema.js, Api.js, and the data-api-core.esm.js export list before writing. Created site/js/service/SyncClient.js with a module-level fetchJSON helper matching the Api.js pattern, and class SyncClient with: markEdited() (ticks HLC per-field clock into rev:{uuid}), async sync() (builds jsmdma payload, POSTs to year-planner/sync, runs 3-way merge, writes sync:/base:/rev: to localStorage), and prune() (removes all three keys). Added getActivePlnrUuid(uid, year) to StorageLocal.js as a thin public wrapper over _findPlnrUuid().

## Verification

All four task-plan verification commands pass: getActivePlnrUuid present in StorageLocal.js, SyncClient.js exists, markEdited present in SyncClient.js, year-planner/sync present in SyncClient.js.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `grep -q 'getActivePlnrUuid' site/js/service/StorageLocal.js` | 0 | ✅ pass | 50ms |
| 2 | `test -f site/js/service/SyncClient.js` | 0 | ✅ pass | 10ms |
| 3 | `grep -q 'markEdited' site/js/service/SyncClient.js` | 0 | ✅ pass | 20ms |
| 4 | `grep -q 'year-planner/sync' site/js/service/SyncClient.js` | 0 | ✅ pass | 20ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `site/js/service/SyncClient.js`
- `site/js/service/StorageLocal.js`
