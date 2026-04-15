---
id: S02
parent: M011
milestone: M011
provides:
  - rev:{uuid} localStorage key populated with per-field dot-path HLC stamps after every day entry edit
  - hlc-write.spec.js Playwright test confirming the write-path is wired end-to-end
  - fieldRevs in future sync payloads will contain real per-field HLC stamps (not empty {})
requires:
  []
affects:
  - S03 — MOD audit can now verify the full sync write path (markEdited → rev: → sync payload) is correctly wired
key_files:
  - site/js/vue/methods/entries.js
  - .tests/e2e/hlc-write.spec.js
key_decisions:
  - markEdited fires unconditionally on every edit, not gated on syncToRemote — HLC tracking is always needed, not just when signed in
  - plannerId computed once and reused for both the markEdited loop and api.sync() to avoid duplicate getActivePlnrUuid calls
  - hlc-write.spec.js must clear localStorage in addInitScript (sessionStorage-guarded) because globalSetup storageState blocks initialise(), causing getActivePlnrUuid to return null
patterns_established:
  - Tests that observe rev:/base:/sync: localStorage writes must clear localStorage in addInitScript (guarded by sessionStorage._seeded) — globalSetup storageState alone is insufficient
  - HLC write-path pattern: compute isoDate from mindex/day/year, call getActivePlnrUuid once, loop over field constants with markEdited, guard with if (plannerId && this.syncClient)
observability_surfaces:
  - Browser DevTools → Application → Local Storage → rev:{uuid} key: populated with per-field dot-path HLC strings after any day edit
drill_down_paths:
  - .gsd/milestones/M011/slices/S02/tasks/T01-SUMMARY.md
  - .gsd/milestones/M011/slices/S02/tasks/T02-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-04-09T20:14:41.484Z
blocker_discovered: false
---

# S02: StorageLocal HLC write wiring

**HLC write-path wired: every day entry edit now stamps per-field dot-path HLC entries into rev:{uuid}, confirmed by a new Playwright test; all 18 tests pass.**

## What Happened

S01 built SyncClient.markEdited() but never called it. S02 closes that gap in three steps.

**T01 — Wire markEdited into entries.js**
The plan called for three edits (model.js, StorageLocal.js, entries.js), but model.js already had `syncClient: null` and StorageLocal.js had `_updateRev` already removed — both from S01. Only entries.js needed work. In `updateEntry()`, after the `storageLocal.updateLocalEntry()` call, the ISO date is computed from mindex/day/year, `getActivePlnrUuid` is called once, and a loop over `['tp', 'tl', 'col', 'notes', 'emoji']` calls `syncClient.markEdited(plannerId, days.${isoDate}.${field})` for each. The guard `if (plannerId && this.syncClient)` protects against null state. The same `plannerId` is reused in the `if (syncToRemote)` block below, eliminating a duplicate `getActivePlnrUuid` call. markEdited fires unconditionally — not gated on `syncToRemote` — ensuring HLC tracking on every edit regardless of auth state.

**T02 — Write hlc-write.spec.js Playwright test**
The test navigated to `/?uid=12345&year=2026`, clicked Jan day 1, filled the textarea, saved, then used `page.evaluate()` to scan localStorage for any `rev:*` key and assert it contained dot-path keys matching `days.YYYY-MM-DD.{field}` with non-empty HLC string values.

However, on first run the test failed: `rev:*` was found but empty (0 keys). Root cause: globalSetup seeds the `dev` localStorage key; `StorageLocal.initialised()` returns true; `lifecycle.refresh()` skips `initialise()`; without `initialise()`, no planner document is created; `getActivePlnrUuid(uid, year)` returns null; the `if (plannerId && this.syncClient)` guard silently skips all markEdited calls. Fix: add `localStorage.clear()` in `addInitScript`, guarded by `sessionStorage._seeded` (same pattern as sync-payload.spec.js). With the clean-slate approach, the app runs `initialise()` on mount, creates the planner, and the write path fires correctly. After this fix all 18 tests pass.

## Verification

T01: Three grep checks — syncClient in model.js ✅, _updateRev absent from StorageLocal.js ✅, markEdited in entries.js ✅. Full 17-test suite with --workers=1: 17/17 pass ✅.

T02: New hlc-write.spec.js added. Initial run revealed test failure (rev: key found but empty) — root cause diagnosed as globalSetup storageState blocking initialise(). Fix applied: localStorage.clear() in addInitScript (sessionStorage-guarded). Re-run: all 18 tests pass with --workers=1 in 21.9s ✅.

## Requirements Advanced

None.

## Requirements Validated

- SYNC-04 — hlc-write.spec.js Playwright test passes: rev:{uuid} populated with days.YYYY-MM-DD.{field} dot-path HLC strings after editing a day entry; all 18 tests pass

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

model.js and StorageLocal.js were already in the required state from S01 — only entries.js required editing in T01. The test fix (adding localStorage.clear() in addInitScript) was not in the original T02 plan but was necessary due to the globalSetup storageState issue documented in KNOWLEDGE.md.

## Known Limitations

HLC stamps are written but not yet verified to be monotonically increasing across rapid offline edits — that is a SyncClient unit-level concern, not covered by this Playwright integration test. fieldRevs visibility in sync payloads requires a live configured server.

## Follow-ups

S03 MOD audit should confirm the complete sync write-path chain is traceable: markEdited writes rev:{uuid} → Api.sync reads rev:{uuid} → POST /year-planner/sync includes fieldRevs. No additional follow-ups from S02 execution.

## Files Created/Modified

- `site/js/vue/methods/entries.js` — Added markEdited loop for all 5 day fields after updateLocalEntry; consolidated plannerId computation
- `.tests/e2e/hlc-write.spec.js` — New Playwright test: clears localStorage, edits day 1, asserts rev:{uuid} contains dot-path HLC entries
