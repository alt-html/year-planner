---
id: S02
parent: M009
milestone: M009
provides:
  - StorageLocal with new M009 schema
  - plnr:{uuid} sparse-map planner documents
  - rev:{uuid} dot-path fieldRevs updated on every entry edit
  - prefs:{uid} in new format with legacy compat read/write
  - New day field names tp/tl/col/notes/emoji throughout js/service/ and js/vue/methods/
requires:
  []
affects:
  - S03
key_files:
  - js/service/StorageLocal.js
  - js/vue/methods/entries.js
  - js/service/Storage.js
key_decisions:
  - Dual-mode uid/uuid handling in setLocalPlanner/getLocalPlanner — numeric uid (no '-') triggers find-or-create planner lookup
  - Preferences translated between old {0,1,2,3} and new {year,lang,theme,dark,names} on every read/write
  - Day field names tp/tl/col/notes/emoji used throughout — no numeric string keys remain in entries.js or Storage.js
patterns_established:
  - Dual-mode uid/uuid detection: no '-' in identifier = legacy uid, treat as uid for planner lookup. Use for any future migration-compatible API.
observability_surfaces:
  - none
drill_down_paths:
  - .gsd/milestones/M009/slices/S02/tasks/T01-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-28T12:28:35.912Z
blocker_discovered: false
---

# S02: StorageLocal full rewrite

**StorageLocal fully rewritten to new M009 schema; day field names updated throughout; 15/15 tests pass.**

## What Happened

Full StorageLocal rewrite delivered in a single task. The new implementation reads/writes plnr:{uuid} documents in { meta, days: { 'YYYY-MM-DD': {tp,tl,col,notes,emoji} } } format, converts to/from the runtime [mindex][day] months array for Vue reactivity, and maintains rev:{uuid} dot-path fieldRevs on every edit. entries.js and Storage.js updated to use new field names throughout.

## Verification

cd .tests && npx playwright test — 15 passed (6.1s). Full E2E suite green including entry CRUD, planner management, sync error, tooltip XSS, boot, compose, harness, and HLC vendor smoke test.

## Requirements Advanced

- SYNC-02 — StorageLocal now writes plnr:{uuid} documents with stable UUID keys and HLC fieldRevs
- SYNC-03 — Planner docs are sparse {days: {'YYYY-MM-DD': {...}}} maps, not arrays
- SYNC-04 — rev:{uuid} updated with dot-path HLC entry per field on every updateLocalEntry call
- STO-02 — Day objects use tp/tl/col/notes/emoji throughout the codebase

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

setLocalPlanner/getLocalPlanner made smart about legacy uid vs planner UUID. Preferences round-trip in both formats to maintain compat with planner.js callers.

## Known Limitations

None for S02 scope.

## Follow-ups

S03 migration adds the one-time old-schema detection and migration logic. updateEntryState in entries.js still calls api.synchroniseToLocal on every modal open — that will be cleaned up in M010.

## Files Created/Modified

- `js/service/StorageLocal.js` — Full rewrite to new M009 schema — plnr:uuid, rev:uuid, prefs:uid, dev, HLC fieldRevs, sparse-map planner docs
- `js/vue/methods/entries.js` — Day field accessors updated: '0'->tp, '1'->tl, '2'->col, '3'->notes, '4'->emoji
- `js/service/Storage.js` — Day field accessors updated to match new names
