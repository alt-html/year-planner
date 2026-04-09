# Requirements

This file is the explicit capability and coverage contract for the project.

## Active

### AUTH-06 — Rewrite the client-side sync layer (Api.js, retire StorageRemote.js) to use the jsmdma sync protocol: `POST /year-planner/sync` with HLC-clocked dot-path fieldRevs, `clientClock`, `changes` array, and `serverChanges` response. Replace the current raw-localStorage-dump push/pull pattern entirely.
- Status: active
- Description: Rewrite the client-side sync layer (Api.js, retire StorageRemote.js) to use the jsmdma sync protocol: `POST /year-planner/sync` with HLC-clocked dot-path fieldRevs, `clientClock`, `changes` array, and `serverChanges` response. Replace the current raw-localStorage-dump push/pull pattern entirely.
- Primary owning slice: M011/S01
- Supporting slices: M011/S02
- Validation: mapped

### MOD-03 — Untitled
- Status: active
- Primary owning slice: M011/S01
- Validation: mapped
- Notes: In M011/S01 Api.js is rewritten to use jsmdma sync protocol. The sub-module split (SyncApi/AuthApi/ProfileApi) from original MOD-03 is partially superseded — Api.js becomes the jsmdma sync client wrapper; auth is handled by AuthProvider. StorageRemote.js is deleted.

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

### SYNC-06 — Implement `js/service/SyncClient.js` that wraps the jsmdma sync protocol for the year-planner. Uses `HLC` and `flatten` from the local `data-api-core.esm.js` bundle (jsmdma project). Manages `baseClock`, `fieldRevs`, and `baseSnapshot` per planner. Exposes `sync(plannerId)`, `markEdited(plannerId, dotPath)`, and `prune(plannerId)`. `StorageLocal.js` delegates all sync state management to `SyncClient`.
- Status: active
- Description: Implement `js/service/SyncClient.js` that wraps the jsmdma sync protocol for the year-planner. Uses `HLC` and `flatten` from the local `data-api-core.esm.js` bundle (jsmdma project). Manages `baseClock`, `fieldRevs`, and `baseSnapshot` per planner. Exposes `sync(plannerId)`, `markEdited(plannerId, dotPath)`, and `prune(plannerId)`. `StorageLocal.js` delegates all sync state management to `SyncClient`.
- Primary owning slice: M011/S01
- Validation: mapped
- Notes: Clarified: the vendor bundle is from the jsmdma project, not a standalone data-api project.

## Deferred

### SYNC-08 — Untitled
- Status: deferred
- Notes: Deferred from M011 — user confirmed pruning can come later. No primary owning slice until a future milestone is planned.

## Traceability

| ID | Class | Status | Primary owner | Supporting | Proof |
|---|---|---|---|---|---|
| AUTH-06 |  | active | M011/S01 | M011/S02 | mapped |
| MOD-03 |  | active | M011/S01 | none | mapped |
| MOD-05 |  | active | M011/S03 | none | mapped |
| MOD-06 |  | active | M011/S03 | none | mapped |
| MOD-07 |  | active | M011/S03 | none | mapped |
| MOD-08 |  | active | M011/S03 | none | mapped |
| MOD-09 |  | active | M011/S03 | none | mapped |
| SYNC-04 |  | active | M011/S02 | none | mapped |
| SYNC-05 |  | active | M011/S01 | none | mapped |
| SYNC-06 |  | active | M011/S01 | none | mapped |
| SYNC-08 |  | deferred | none | none | unmapped |

## Coverage Summary

- Active requirements: 10
- Mapped to slices: 10
- Validated: 0
- Unmapped active requirements: 0
