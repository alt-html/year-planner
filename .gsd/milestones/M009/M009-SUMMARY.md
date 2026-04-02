---
id: M009
title: "localStorage Schema Redesign & Migration"
status: complete
completed_at: 2026-03-28T12:54:48.241Z
key_decisions:
  - Eager migrate() pattern: called from read methods (getLocalIdentities/getLocalPreferences/getLocalPlanner) not just initialised() — required because CDI lifecycle calls Application.init() before Vue mounted()
  - migrate() dev-exists guard: if dev exists, remove stale '0' and return — handles transitional state from first-load setLocalIdentities compat write
  - setLocalIdentities writes '0' compat key only when dev doesn't exist (pre-migration path only)
  - setLocalPlanner/getLocalPlanner handle both legacy uid (numeric, no '-') and new planner UUID transparently
  - getLocalPreferences/setLocalPreferences translate between old {0,1,2,3} format and new {year,lang,theme,dark,names} format on every read/write
key_files:
  - js/service/StorageLocal.js
  - js/service/storage-schema.js
  - js/vendor/data-api-core.esm.js
  - js/vue/methods/entries.js
  - js/service/Storage.js
  - .tests/e2e/migration.spec.js
  - .tests/smoke/harness.spec.js
  - .tests/globalSetup.js
lessons_learned:
  - CDI calls init() on singletons before Vue mounts — any storage migration that needs to run before first read must be triggered eagerly from the read methods themselves, not from the Vue lifecycle
  - addInitScript in Playwright runs on EVERY navigation including redirects — use sessionStorage flags to gate first-load-only setup
  - Iterating localStorage by index while calling localStorage.setItem() during iteration can produce missed keys if insertion order changes — safer to collect keys first then process
  - The '0' compat write in setLocalIdentities created a re-migration trigger on second page load — guarding the compat write on dev-not-present was the correct fix
  - Playwright doesn't forward browser console.log to test reporter by default — use page.on('console') capture when debugging browser-side code
---

# M009: localStorage Schema Redesign & Migration

**Replaced cookie-era localStorage schema with HLC-ready M009 schema (plnr:uuid sparse-map docs, rev:uuid fieldRevs, dev UUID); one-time migration preserves all existing data; 16/16 E2E tests pass.**

## What Happened

M009 replaced the entire cookie-era localStorage schema with a clean HLC-ready M009 schema across three slices. S01 introduced the vendor bundle (data-api-core.esm.js) and the storage-schema.js constants module. S02 rewrote StorageLocal.js to use plnr:{uuid}/rev:{uuid}/prefs:{uid}/dev keys and updated entries.js and Storage.js to use readable field names (tp/tl/col/notes/emoji). S03 added one-time migration from old-schema data.\n\nThe most significant challenge was ordering: CDI calls Application.init() (which reads storage) before Vue's mounted() lifecycle. The initial plan to trigger migration from initialised() was insufficient — migration needed to fire on the first storage read, not the first initialised() call. Fixed with an eager migrate() pattern called from getLocalIdentities/getLocalPreferences/getLocalPlanner.\n\nA second ordering issue emerged from the compat write of '0' in setLocalIdentities: on first load, setLocalIdentities wrote '0' before dev was created, causing migrate() to re-run on the second page load. Fixed by guarding the compat write on dev-not-present. The migrate() dev-exists guard was also refined to remove stale '0' rather than returning entirely.\n\nFinal result: 16/16 tests pass including a full migration E2E test that seeds old-schema data and verifies clean migration to the new format with all day entries intact.

## Success Criteria Results

All 9 success criteria met. See VALIDATION.md for details. 16/16 Playwright tests pass.

## Definition of Done Results

- [x] S01 complete — js/vendor/data-api-core.esm.js, js/service/storage-schema.js; HLC smoke test passes\n- [x] S02 complete — StorageLocal.js full rewrite; entries.js and Storage.js field names updated; 15 tests pass\n- [x] S03 complete — migrate() in StorageLocal.js; migration.spec.js; globalSetup.js updated; 16 tests pass\n- [x] No numeric day-object keys ('0'..'4') remain in js/service/ or js/vue/methods/ source files\n- [x] All 16 Playwright E2E tests pass — final run 16 passed (6.1s)

## Requirement Outcomes

- SYNC-01 (dev UUID): **validated** — Playwright smoke test confirms HLC importable and dev key generated on load\n- SYNC-02 (multi-planner): **advanced** — plnr:uuid structure supports multiple planners; planner switcher uses getLocalPlanners()\n- SYNC-03 (nested map): **advanced** — planner docs use {meta,days:{'YYYY-MM-DD':{}}} sparse map\n- SYNC-04 (HLC fieldRevs): **advanced** — rev:{uuid} updated on every updateLocalEntry call\n- SYNC-05 (base snapshot): **advanced** — base:{uuid} written on planner creation (populated on sync in M010)\n- SYNC-07 (migration): **validated** — migration E2E test passes; old keys removed, new keys present, day data intact\n- STO-02 (schema redesign): **advanced** — numeric keys replaced with tp/tl/col/notes/emoji throughout\n- MOD-10: remains validated (16 tests pass, 0 failing)

## Deviations

None.

## Follow-ups

M010: SyncClient.js implementation, Api.js rewrite to use data-api protocol, SYNC-08 pruning. The base:{uuid} snapshot is written as empty {} on creation — it needs to be populated after successful sync in M010 to enable 3-way text merge for notes.
