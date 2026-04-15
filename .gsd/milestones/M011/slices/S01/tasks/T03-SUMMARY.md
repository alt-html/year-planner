---
id: T03
parent: S01
milestone: M011
key_files:
  - .tests/e2e/sync-error.spec.js
  - .tests/e2e/sync-payload.spec.js
key_decisions:
  - Added localStorage.clear() in addInitScript before injecting session so initialised() returns false and lifecycle.initialise() runs unconditionally, creating the planner for uid=12345/year=2026 before api.sync() fires
duration: 
verification_result: passed
completed_at: 2026-04-09T10:58:06.642Z
blocker_discovered: false
---

# T03: Updated sync-error.spec.js route glob to **/year-planner/sync and added sync-payload.spec.js verifying jsmdma POST body shape; all 17 tests pass

**Updated sync-error.spec.js route glob to **/year-planner/sync and added sync-payload.spec.js verifying jsmdma POST body shape; all 17 tests pass**

## What Happened

Updated the page.route() glob in sync-error.spec.js from '**/api/planner/**' to '**/year-planner/sync' to match the new SyncClient endpoint. Wrote sync-payload.spec.js to verify the jsmdma POST body shape (clientClock, deviceId, changes[] with id/doc/fieldRevs). Initial implementation matched the task plan exactly but the test failed because the route intercept never fired — api.sync() was returning early due to a null plannerId. Root cause: globalSetup.js seeds the shared storageState with a 'dev' key, so StorageLocal.initialised() returns true, lifecycle.refresh() skips initialise(), and getActivePlnrUuid(12345, 2026) returns null. Fixed by adding localStorage.clear() at the start of addInitScript (guarded by the _seeded sessionStorage flag) to force a clean slate so initialise() always runs and creates the planner before api.sync() is called. All 17 tests (16 existing + 1 new) pass.

## Verification

Ran full Playwright suite: `cd .tests && npx playwright test --reporter=line` — 17 passed (6.9s). Both sync-error.spec.js (updated glob) and sync-payload.spec.js (new test) pass. The sync-payload test confirms the route intercept fires and capturedBody has the expected clientClock/deviceId/changes[] shape.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd .tests && npx playwright test --reporter=line 2>&1 | grep -E 'passed|failed'` | 0 | ✅ pass | 7300ms |

## Deviations

Task plan addInitScript did not include localStorage.clear(). Added after discovering the global storageState dev key prevents initialise() from running, leaving no planner UUID. The _seeded sessionStorage guard from task plan constraints was preserved.

## Known Issues

None.

## Files Created/Modified

- `.tests/e2e/sync-error.spec.js`
- `.tests/e2e/sync-payload.spec.js`
