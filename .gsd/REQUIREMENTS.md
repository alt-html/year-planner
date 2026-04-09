# Requirements

This file is the explicit capability and coverage contract for the project.

## Active

### MOD-05 — Untitled
- Status: active
- Primary owning slice: M011/S03
- Validation: mapped

### MOD-06 — Untitled
- Status: active
- Primary owning slice: M011/S03
- Validation: mapped

### MOD-07 — Untitled
- Status: active
- Primary owning slice: M011/S03
- Validation: mapped

### MOD-08 — Untitled
- Status: active
- Primary owning slice: M011/S03
- Validation: mapped

### MOD-09 — Untitled
- Status: active
- Primary owning slice: M011/S03
- Validation: mapped

### SYNC-04 — Untitled
- Status: active
- Primary owning slice: M011/S02
- Validation: mapped
- Notes: Will be implemented when StorageLocal is wired to call SyncClient.markEdited() on every field write in M011/S02.

### SYNC-05 — Untitled
- Status: active
- Primary owning slice: M011/S01
- Validation: mapped
- Notes: Base snapshot management is part of SyncClient.sync() — persisted to base:{uuid} after each successful sync in M011/S01.

## Validated

### AUTH-06 — Rewrite the client-side sync layer (Api.js, retire StorageRemote.js) to use the jsmdma sync protocol: `POST /year-planner/sync` with HLC-clocked dot-path fieldRevs, `clientClock`, `changes` array, and `serverChanges` response. Replace the current raw-localStorage-dump push/pull pattern entirely.
- Status: validated
- Description: Rewrite the client-side sync layer (Api.js, retire StorageRemote.js) to use the jsmdma sync protocol: `POST /year-planner/sync` with HLC-clocked dot-path fieldRevs, `clientClock`, `changes` array, and `serverChanges` response. Replace the current raw-localStorage-dump push/pull pattern entirely.
- Primary owning slice: M011/S01
- Supporting slices: M011/S02
- Validation: SyncClient.js created; Api.js rewrites to POST /year-planner/sync with jsmdma payload shape {clientClock, deviceId, changes[{id,doc,fieldRevs}]}; StorageRemote.js deleted; sync-payload.spec.js Playwright test verifies payload shape; all 17 tests pass. M011/S01 complete 2026-04-09.

### MOD-03 — Untitled
- Status: validated
- Primary owning slice: M011/S01
- Validation: StorageRemote.js deleted from codebase and removed from contexts.js. All references to synchroniseToLocal/synchroniseToRemote replaced across 5 Vue method files and Storage.js. M011/S01 complete 2026-04-09.
- Notes: In M011/S01 Api.js is rewritten to use jsmdma sync protocol. The sub-module split (SyncApi/AuthApi/ProfileApi) from original MOD-03 is partially superseded — Api.js becomes the jsmdma sync client wrapper; auth is handled by AuthProvider. StorageRemote.js is deleted.

### SYNC-06 — Implement `js/service/SyncClient.js` that wraps the jsmdma sync protocol for the year-planner. Uses `HLC` and `flatten` from the local `data-api-core.esm.js` bundle (jsmdma project). Manages `baseClock`, `fieldRevs`, and `baseSnapshot` per planner. Exposes `sync(plannerId)`, `markEdited(plannerId, dotPath)`, and `prune(plannerId)`. `StorageLocal.js` delegates all sync state management to `SyncClient`.
- Status: validated
- Description: Implement `js/service/SyncClient.js` that wraps the jsmdma sync protocol for the year-planner. Uses `HLC` and `flatten` from the local `data-api-core.esm.js` bundle (jsmdma project). Manages `baseClock`, `fieldRevs`, and `baseSnapshot` per planner. Exposes `sync(plannerId)`, `markEdited(plannerId, dotPath)`, and `prune(plannerId)`. `StorageLocal.js` delegates all sync state management to `SyncClient`.
- Primary owning slice: M011/S01
- Validation: SyncClient.js implemented with markEdited(plannerId, dotPath), async sync(plannerId, plannerDoc, authHeaders), and prune(plannerId). Manages rev:{uuid}, base:{uuid}, sync:{uuid} per planner. Uses HLC and flatten/merge from data-api-core.esm.js vendor bundle. CDI-registered as syncClient singleton. M011/S01 complete 2026-04-09.
- Notes: Clarified: the vendor bundle is from the jsmdma project, not a standalone data-api project.

## Deferred

### SYNC-08 — Untitled
- Status: deferred
- Notes: Deferred from M011 — user confirmed pruning can come later. No primary owning slice until a future milestone is planned.

## Traceability

| ID | Class | Status | Primary owner | Supporting | Proof |
|---|---|---|---|---|---|
| AUTH-06 |  | validated | M011/S01 | M011/S02 | SyncClient.js created; Api.js rewrites to POST /year-planner/sync with jsmdma payload shape {clientClock, deviceId, changes[{id,doc,fieldRevs}]}; StorageRemote.js deleted; sync-payload.spec.js Playwright test verifies payload shape; all 17 tests pass. M011/S01 complete 2026-04-09. |
| MOD-03 |  | validated | M011/S01 | none | StorageRemote.js deleted from codebase and removed from contexts.js. All references to synchroniseToLocal/synchroniseToRemote replaced across 5 Vue method files and Storage.js. M011/S01 complete 2026-04-09. |
| MOD-05 |  | active | M011/S03 | none | mapped |
| MOD-06 |  | active | M011/S03 | none | mapped |
| MOD-07 |  | active | M011/S03 | none | mapped |
| MOD-08 |  | active | M011/S03 | none | mapped |
| MOD-09 |  | active | M011/S03 | none | mapped |
| SYNC-04 |  | active | M011/S02 | none | mapped |
| SYNC-05 |  | active | M011/S01 | none | mapped |
| SYNC-06 |  | validated | M011/S01 | none | SyncClient.js implemented with markEdited(plannerId, dotPath), async sync(plannerId, plannerDoc, authHeaders), and prune(plannerId). Manages rev:{uuid}, base:{uuid}, sync:{uuid} per planner. Uses HLC and flatten/merge from data-api-core.esm.js vendor bundle. CDI-registered as syncClient singleton. M011/S01 complete 2026-04-09. |
| SYNC-08 |  | deferred | none | none | unmapped |

## Coverage Summary

- Active requirements: 7
- Mapped to slices: 7
- Validated: 3 (AUTH-06, MOD-03, SYNC-06)
- Unmapped active requirements: 0
