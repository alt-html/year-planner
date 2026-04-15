---
id: S01
parent: M011
milestone: M011
provides:
  - SyncClient.js CDI singleton ready for S02 to call markEdited() from updateLocalEntry() write paths
  - Api.sync(plannerId) unified method ready for any future sync call sites
  - getActivePlnrUuid(uid, year) public method on StorageLocal for use by any sync call site
  - sync-payload.spec.js pattern for mocking /year-planner/sync in future tests
  - Established localStorage.clear() + sessionStorage._seeded guard pattern for tests needing initialise() to run
requires:
  - slice: data-api-core.esm.js vendor bundle
    provides: HLC, flatten, diff, merge, unflatten used in SyncClient
  - slice: storage-schema.js
    provides: HLC_ZERO, keySync, keyRev, keyBase constants
  - slice: StorageLocal._findPlnrUuid()
    provides: backing implementation for getActivePlnrUuid()
  - slice: AuthProvider._authHeaders()
    provides: used by Api.sync() to build auth headers passed to SyncClient.sync()
affects:
  []
key_files:
  - site/js/service/SyncClient.js (new — jsmdma HLC sync protocol service)
  - site/js/service/Api.js (rewritten — single sync(plannerId) method)
  - site/js/config/contexts.js (SyncClient added, StorageRemote removed)
  - site/js/service/StorageLocal.js (getActivePlnrUuid() added)
  - site/js/vue/methods/lifecycle.js (call site updated)
  - site/js/vue/methods/planner.js (3 call sites updated)
  - site/js/vue/methods/auth.js (call site updated)
  - site/js/vue/methods/entries.js (2 call sites updated)
  - site/js/service/Storage.js (sync call removed from deletePlannerByYear)
  - .tests/e2e/sync-payload.spec.js (new — jsmdma payload shape assertion)
  - .tests/e2e/sync-error.spec.js (route glob updated to /year-planner/sync)
key_decisions:
  - SyncClient.js owns all HLC sync state (rev/base/sync localStorage keys) — StorageLocal delegates, does not duplicate sync logic
  - markEdited() ticks HLC from the existing per-field clock (not always from sync clock) to ensure monotonically increasing stamps offline
  - HLC_ZERO imported from storage-schema.js, not via HLC.zero() — keeps all storage constants in one place
  - Api.js fetchJSON retained at module level for deleteAccount(); SyncClient has its own internal fetchJSON — intentional separation
  - deletePlannerByYear sync call removed entirely (not replaced) — no point syncing a deleted planner
  - Fire-and-forget call pattern preserved for all 9 Vue call sites — UI must not block on sync
  - StorageRemote.js deleted with no stub retained — incompatible with M009 plnr:{uuid} schema
patterns_established:
  - SyncClient CDI pattern: registered as syncClient, injected into Api constructor, owns rev/base/sync localStorage keys
  - Fire-and-forget api.sync() calls: all Vue call sites omit await — UI must not block on sync
  - localStorage.clear() + sessionStorage._seeded guard in test addInitScript: required when test needs initialise() to run from clean state
  - Dual fetchJSON pattern: SyncClient and Api each have their own module-level fetchJSON — intentional, not an oversight
observability_surfaces:
  - Browser devtools Application tab: rev:{uuid}, base:{uuid}, sync:{uuid} localStorage keys inspectable after sync
  - Browser Network tab: POST /year-planner/sync request visible with full JSON payload when signed in
  - model.error surface: 404→error.apinotavailable, 401→error.unauthorized, else→error.syncfailed — all visible as .alert-danger in UI
drill_down_paths:
  - .gsd/milestones/M011/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M011/slices/S01/tasks/T02-SUMMARY.md
  - .gsd/milestones/M011/slices/S01/tasks/T03-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-04-09T17:20:31.365Z
blocker_discovered: false
---

# S01: SyncClient.js + jsmdma sync API

**Replaced the obsolete push/pull sync layer with SyncClient.js implementing the jsmdma HLC protocol; Api.js now POSTs to /year-planner/sync; StorageRemote.js is deleted; all 17 Playwright tests pass including a new sync-payload shape assertion.**

## What Happened

## Overview

S01 delivered the core sync rewrite: three tasks across 12 files, establishing the jsmdma HLC-based sync protocol in the year-planner client.

## T01 — SyncClient.js + StorageLocal.getActivePlnrUuid()

Created `site/js/service/SyncClient.js` with a module-level fetchJSON helper (matching Api.js pattern) and the `SyncClient` class with three methods:

- **markEdited(plannerId, dotPath)** — reads `rev:{plannerId}`, ticks HLC for the target field from its existing field clock (fallback: baseClock from `sync:{plannerId}`, fallback: HLC_ZERO), writes back. Produces monotonically increasing stamps per-field even while offline.
- **async sync(plannerId, plannerDoc, authHeaders)** — reads `sync:{uuid}` (clientClock), `rev:{uuid}` (fieldRevs), `base:{uuid}` (base snapshot), builds the jsmdma payload `{clientClock, deviceId, changes:[{id, doc, fieldRevs}]}`, POSTs to `${url}year-planner/sync`, runs 3-way merge on serverChanges using data-api-core `merge()`, writes `base:{uuid}`, `sync:{uuid}`, `rev:{uuid}` back to localStorage on success, throws with `err.status` set on HTTP errors.
- **prune(plannerId)** — removes all three localStorage keys for a planner.

Added `getActivePlnrUuid(uid, year)` to `StorageLocal.js` as a thin public wrapper over the private `_findPlnrUuid()`.

Key design choices: HLC_ZERO imported from storage-schema.js (not HLC.zero() directly), markEdited ticks from existing field clock not always from sync clock, empty serverChanges still writes plannerDoc as new base snapshot.

## T02 — Api.js rewrite + 9 call sites + StorageRemote.js deleted

Rewrote `Api.js`: removed `storageRemote` constructor parameter, added `syncClient`, removed `synchroniseToLocal()` and `synchroniseToRemote()`, added single `async sync(plannerId)` that guards on `!signedin() || !plannerId`, delegates to `this.syncClient.sync()`, and maps HTTP errors to model.error strings (404→apinotavailable, 401→unauthorized, else→syncfailed). Module-level fetchJSON retained for `deleteAccount()`.

Updated all 9 call sites across 5 files — all preserved as fire-and-forget (no await added):
- `lifecycle.js`: `synchroniseToLocal(false)` → resolve plannerId + `api.sync(plannerId)`
- `planner.js` (3 sites): both old methods replaced; `createPlanner()` resolves plannerId once, reuses for both calls
- `auth.js`: `synchroniseToLocal(true)` → resolve + sync
- `entries.js` (2 sites): both replaced
- `Storage.js`: `synchroniseToRemote()` in `deletePlannerByYear()` removed entirely (no point syncing a deleted planner)

Deleted `site/js/service/StorageRemote.js`. Updated `contexts.js` to register `SyncClient` and remove `StorageRemote`.

## T03 — Test updates + sync-payload.spec.js

Updated `sync-error.spec.js` route glob from `**/api/planner/**` to `**/year-planner/sync`.

Wrote `sync-payload.spec.js` to verify jsmdma POST body shape. Initial implementation failed because `globalSetup.js` seeds storageState with `dev` key → `StorageLocal.initialised()` returns true → `lifecycle.refresh()` skips `initialise()` → `getActivePlnrUuid(12345, 2026)` returns null → `api.sync(null)` returns early → route intercept never fires. Fixed by adding `localStorage.clear()` at start of `addInitScript` (guarded by `sessionStorage._seeded`), forcing a clean slate so `initialise()` always runs. This pattern is now recorded in KNOWLEDGE.md.

Final result: 17/17 Playwright tests pass. The new test verifies that `capturedBody.clientClock`, `capturedBody.deviceId`, and `capturedBody.changes[]` are all present with correct types.

## Patterns Established

- **SyncClient CDI pattern**: registered as `syncClient` (camelCase), injected into Api as constructor parameter. Owns all sync state (rev/base/sync localStorage keys) independently of StorageLocal.
- **Fire-and-forget sync calls**: all Vue call sites call `api.sync()` without await — UI does not block on sync.
- **localStorage.clear() in test addInitScript**: required when test needs `initialise()` to run from a clean slate, guarded by `sessionStorage._seeded`.
- **fetchJSON duplication by design**: SyncClient and Api each have their own module-level fetchJSON — deliberate separation of concerns, not an oversight.

## What Remains for S02 and S03

- S02: wire `SyncClient.markEdited()` into `StorageLocal.updateLocalEntry()` and all other write paths so field-level HLC clocks advance on every edit.
- S03: MOD audit and cleanup of outstanding MOD-05–09 items.

## Verification

All slice-level verification checks passed:

**T01 checks (all pass):**
- `grep -q 'getActivePlnrUuid' site/js/service/StorageLocal.js` → exit 0
- `test -f site/js/service/SyncClient.js` → exit 0
- `grep -q 'markEdited' site/js/service/SyncClient.js` → exit 0
- `grep -q 'year-planner/sync' site/js/service/SyncClient.js` → exit 0

**T02 checks (all pass):**
- `! test -f site/js/service/StorageRemote.js` → exit 0
- `grep -q 'syncClient' site/js/service/Api.js` → exit 0
- `! grep -q 'storageRemote' site/js/service/Api.js` → exit 0
- `! grep -q 'StorageRemote' site/js/config/contexts.js` → exit 0
- `! grep -q 'synchroniseToLocal|synchroniseToRemote'` in all 5 call-site files → exit 0

**T03 check:**
- `cd .tests && npx playwright test --reporter=line` → 17 passed (6.9s), 0 failed

All 17 tests pass including sync-error.spec.js (updated glob) and new sync-payload.spec.js (jsmdma payload shape assertion).

## Requirements Advanced

None.

## Requirements Validated

- AUTH-06 — Api.js rewrites to POST /year-planner/sync with HLC-clocked fieldRevs, clientClock, changes array. StorageRemote.js deleted. sync-payload.spec.js verifies payload shape. 17/17 tests pass.
- SYNC-05 — POST /year-planner/sync wired end-to-end: SyncClient builds payload, Api.sync() calls it, all 9 call sites updated. sync-payload.spec.js mock test verifies payload shape D007.
- SYNC-06 — SyncClient.js implemented with markEdited/sync/prune. Uses HLC and merge from data-api-core.esm.js. Manages rev/base/sync per planner. CDI-registered as syncClient.
- MOD-03 — StorageRemote.js deleted from codebase and contexts.js. All synchroniseToLocal/synchroniseToRemote references removed from 5 files.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

T03: Task plan addInitScript did not include localStorage.clear(). Added after discovering globalSetup storageState dev key prevents initialise() from running (getActivePlnrUuid returns null, api.sync returns early, route intercept never fires). Pattern recorded in KNOWLEDGE.md.

## Known Limitations

None. S02 will wire markEdited() into StorageLocal write paths so field-level HLC clocks actually advance on edits. Until then, fieldRevs in sync payloads will be empty ({}) for new planners.

## Follow-ups

S02: Wire SyncClient.markEdited() into StorageLocal.updateLocalEntry() and all other day-entry write paths so fieldRevs advance on every edit. S03: MOD audit and cleanup of MOD-05–09 items.

## Files Created/Modified

- `site/js/service/SyncClient.js` — New CDI-registered service implementing markEdited(), async sync(), and prune() using jsmdma HLC protocol
- `site/js/service/Api.js` — Rewritten: storageRemote removed, syncClient injected, synchroniseToLocal/Remote replaced by single sync(plannerId)
- `site/js/config/contexts.js` — SyncClient registered as singleton, StorageRemote removed
- `site/js/service/StorageLocal.js` — getActivePlnrUuid(uid, year) public wrapper added
- `site/js/vue/methods/lifecycle.js` — synchroniseToLocal call replaced with getActivePlnrUuid + api.sync()
- `site/js/vue/methods/planner.js` — 3 call sites updated: both old sync methods replaced, plannerId resolved once in createPlanner()
- `site/js/vue/methods/auth.js` — synchroniseToLocal call replaced with getActivePlnrUuid + api.sync()
- `site/js/vue/methods/entries.js` — 2 call sites updated
- `site/js/service/Storage.js` — synchroniseToRemote in deletePlannerByYear removed entirely
- `.tests/e2e/sync-payload.spec.js` — New Playwright test asserting jsmdma POST payload shape (clientClock, deviceId, changes[])
- `.tests/e2e/sync-error.spec.js` — Route glob updated from **/api/planner/** to **/year-planner/sync
