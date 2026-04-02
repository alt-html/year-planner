---
id: T01
parent: S02
milestone: M009
provides: []
requires: []
affects: []
key_files: ["js/service/StorageLocal.js", "js/vue/methods/entries.js", "js/service/Storage.js"]
key_decisions: ["StorageLocal handles both legacy uid (numeric, no dashes) and new UUID (has dashes) in setLocalPlanner/getLocalPlanner — callers in lifecycle.js pass uid, not uuid", "setLocalPreferences/getLocalPreferences translate between new internal {year,lang,theme,dark,names} format and old {0,1,2,3} format expected by planner.js callers", "Day field names changed: '0'->tp, '1'->tl, '2'->col, '3'->notes, '4'->emoji in entries.js and Storage.js"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "cd .tests && npx playwright test — 15 passed (6.1s). All 15 tests green including new HLC vendor smoke test and full E2E suite (entry CRUD, planner management, sync error, tooltip XSS, boot, compose, harness)."
completed_at: 2026-03-28T12:28:08.931Z
blocker_discovered: false
---

# T01: Rewrote StorageLocal.js to new M009 schema; updated entries.js and Storage.js field names; all 15 tests pass.

> Rewrote StorageLocal.js to new M009 schema; updated entries.js and Storage.js field names; all 15 tests pass.

## What Happened
---
id: T01
parent: S02
milestone: M009
key_files:
  - js/service/StorageLocal.js
  - js/vue/methods/entries.js
  - js/service/Storage.js
key_decisions:
  - StorageLocal handles both legacy uid (numeric, no dashes) and new UUID (has dashes) in setLocalPlanner/getLocalPlanner — callers in lifecycle.js pass uid, not uuid
  - setLocalPreferences/getLocalPreferences translate between new internal {year,lang,theme,dark,names} format and old {0,1,2,3} format expected by planner.js callers
  - Day field names changed: '0'->tp, '1'->tl, '2'->col, '3'->notes, '4'->emoji in entries.js and Storage.js
duration: ""
verification_result: passed
completed_at: 2026-03-28T12:28:08.931Z
blocker_discovered: false
---

# T01: Rewrote StorageLocal.js to new M009 schema; updated entries.js and Storage.js field names; all 15 tests pass.

**Rewrote StorageLocal.js to new M009 schema; updated entries.js and Storage.js field names; all 15 tests pass.**

## What Happened

Rewrote StorageLocal.js to the new M009 schema: plnr:{uuid} for planner documents, rev:{uuid} for dot-path fieldRevs, prefs:{uid} for preferences, dev for device UUID. The class converts between the new sparse-map planner document format and the runtime months array format the Vue model expects. Updated entries.js and Storage.js to use new day field names (tp/tl/col/notes/emoji instead of '0'..'4'). Key challenge: legacy callers pass uid (numeric timestamp, no dashes) to setLocalPlanner/getLocalPlanner — handled transparently by detecting the absence of '-' in the identifier. Preferences round-trip in both old and new format. 15/15 tests pass.

## Verification

cd .tests && npx playwright test — 15 passed (6.1s). All 15 tests green including new HLC vendor smoke test and full E2E suite (entry CRUD, planner management, sync error, tooltip XSS, boot, compose, harness).

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd .tests && npx playwright test` | 0 | ✅ pass — 15 passed | 6100ms |


## Deviations

setLocalPlanner/getLocalPlanner made smart about legacy uid vs planner UUID (no '-' in uid = numeric timestamp). setLocalPreferences preserves the '3' (names) key in old-format preferences and returns old-format from getLocalPreferences so callers expecting {0,1,2,3} continue to work.

## Known Issues

None.

## Files Created/Modified

- `js/service/StorageLocal.js`
- `js/vue/methods/entries.js`
- `js/service/Storage.js`


## Deviations
setLocalPlanner/getLocalPlanner made smart about legacy uid vs planner UUID (no '-' in uid = numeric timestamp). setLocalPreferences preserves the '3' (names) key in old-format preferences and returns old-format from getLocalPreferences so callers expecting {0,1,2,3} continue to work.

## Known Issues
None.
