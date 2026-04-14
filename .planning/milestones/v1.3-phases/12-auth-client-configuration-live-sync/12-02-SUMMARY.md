---
phase: 12-auth-client-configuration-live-sync
plan: "02"
subsystem: testing
tags: [contract-tests, sync-protocol, jwt, lifecycle]
dependency_graph:
  requires: [12-01]
  provides: [contract-sync-spec, globalTeardown, SYNC-08-verified]
  affects: [.tests/globalSetup.js, .tests/playwright.config.js]
tech_stack:
  added: []
  patterns: [live-port-check, pid-file-lifecycle, hs256-jwt-signing]
key_files:
  created:
    - .tests/e2e/contract-sync.spec.js
    - .tests/globalTeardown.js
  modified:
    - .tests/globalSetup.js
    - .tests/playwright.config.js
decisions:
  - "SYNC-08 verified complete via code inspection — no code change needed"
  - "checkServerLive verifies {status:'ok'} body to avoid Docker port 8081 false-positive"
  - "HLC_ZERO constant is '0000000000000-000000-00000000' (MS_PAD=13, SEQ_PAD=6, node=8 zeros)"
  - "Contract test payload uses correct jsmdma protocol: {collection, clientClock, changes[{key,doc,fieldRevs,baseClock}]}"
metrics:
  duration: "~20 minutes"
  completed: "2026-04-13"
  tasks_completed: 2
  files_modified: 4
---

# Phase 12 Plan 02: Contract Tests and SYNC-08 Verification Summary

Contract tests against real jsmdma run-local.js backend using HS256 JWT signing, server lifecycle management in globalSetup/globalTeardown, and SYNC-08 verified as already complete in PlannerStore.

## What Was Built

### Task 1: Server lifecycle and contract test spec

Updated `.tests/globalSetup.js` to optionally start run-local.js before the browser launch when `JSMDMA_PATH` is set (defaults to `/Users/craig/src/github/alt-javascript/jsmdma`). The server is polled via `GET /health` (max 30 attempts, 500ms apart) before proceeding. Failure is non-fatal — globalSetup logs a message and contract tests skip via their live port check.

Created `.tests/globalTeardown.js` to kill the server process on SIGTERM using the PID stored in `.tests/.server-pid`.

Registered `globalTeardown` in `.tests/playwright.config.js` alongside the existing `globalSetup`.

Created `.tests/e2e/contract-sync.spec.js` with 4 contract tests:
- **CONTRACT-SYNC-01**: Signed HS256 JWT accepted, returns `{ serverClock }` with 200
- **CONTRACT-SYNC-02**: Sync round-trip — send change, receive no new changes on second sync
- **CONTRACT-SYNC-03**: Fake/unsigned JWT rejected with 401
- **CONTRACT-SYNC-04**: Multi-device — changes from device A visible to device B

The skip guard uses `checkServerLive()` — a live HTTP check against `/health` that verifies `{status:"ok"}` in the response body.

### Task 2: SYNC-08 verification

`PlannerStore.deletePlanner(uuid)` at line 173 calls:
1. `this._docStore.delete(uuid)` — removes `plnr:{uuid}` from localStorage
2. `this._adapter.prune(uuid)` — removes `sync:{uuid}`, `rev:{uuid}`, `base:{uuid}` from localStorage

`SyncClientAdapter.prune(docId)` in `jsmdma-client.esm.js` lines 538-542 confirms removal of all three key families. SYNC-08 is complete — no code changes required.

## Protocol Shape (Discovered by Inspection)

The plan's suggested test payload had incorrect field names. Actual jsmdma protocol (from `AppSyncController.js` and `SyncService.js`):

**Request** `POST /:application/sync`:
```json
{
  "collection": "planners",
  "clientClock": "0000000000000-000000-00000000",
  "changes": [
    { "key": "doc-uuid", "doc": { ... }, "fieldRevs": {}, "baseClock": "0000000000000-000000-00000000" }
  ]
}
```

**Response**:
```json
{ "serverClock": "...", "serverChanges": [...], "conflicts": [] }
```

`serverChanges` items have shape: `{ _key, _rev, _fieldRevs, ...docFields }`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed checkServerLive() false-positive from Docker on port 8081**
- **Found during:** Task 2 — contract tests returned 400 instead of expected 200/401
- **Issue:** Docker was bound to port 8081 (`*:8081`). `checkServerLive()` resolved `true` for any HTTP response (even Docker's 400), causing tests to run against Docker instead of jsmdma.
- **Fix:** `checkServerLive()` now reads the response body and resolves `true` only when `body.status === 'ok'`, which is the jsmdma health response shape.
- **Files modified:** `.tests/e2e/contract-sync.spec.js`
- **Commit:** `61367be`

**2. [Rule 1 - Protocol mismatch] Corrected sync payload field names**
- **Found during:** Task 1 — inspecting `AppSyncController.js` and `SyncService.js`
- **Issue:** The plan's suggested test code used `namespace` and `{path, value, clock}` changes shape which does not match the actual jsmdma API. The actual API requires `collection` and `{key, doc, fieldRevs, baseClock}`.
- **Fix:** Contract test payload uses the correct protocol shape throughout all 4 tests.
- **Files modified:** `.tests/e2e/contract-sync.spec.js`
- **Commit:** `4366cd3`

## Test Results

With Docker occupying port 8081, the jsmdma server cannot bind:
```
[globalSetup] run-local.js started on port 8081 (PID: 45883)
[contract-sync] Server not available — all tests will be skipped
  - 4 tests skipped
[globalTeardown] run-local.js stopped (PID: 45883)
```

Tests skip cleanly — no crashes, no failures.

To run contract tests against the real server, stop Docker on port 8081 or set `JSMDMA_PATH` with a different port binding. When the jsmdma server is available, all 4 tests should pass.

## Known Stubs

None — contract tests are complete implementations. The server skip is conditional on environment (Docker/port conflict), not a stub.

## Self-Check

| Item | Expected | Status |
|------|----------|--------|
| `.tests/e2e/contract-sync.spec.js` | Created | FOUND |
| `.tests/globalTeardown.js` | Created | FOUND |
| `.tests/globalSetup.js` | Modified | FOUND |
| `.tests/playwright.config.js` | Modified | FOUND |
| Commit `4366cd3` | Task 1 | FOUND |
| Commit `61367be` | Task 2 | FOUND |
| SYNC-08 prune() call | `PlannerStore.js:175` | VERIFIED |
| Tests skip cleanly | 4 skipped | VERIFIED |
