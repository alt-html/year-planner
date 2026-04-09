# Requirements

This file is the explicit capability and coverage contract for the project.

## Active

### MOD-09 — Untitled
- Status: active
- Primary owning slice: M011/S03
- Validation: mapped

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

### MOD-05 — Remove SquareUp payment integration
- Status: validated
- Description: Remove SquareUp payment integration
- Primary owning slice: M011/S03
- Validation: SquareUp.js deleted in M002/S04; grep of site/js/ and index.html confirms zero squareup references; pay.html modal fragment deleted in M011/S03.

### MOD-06 — Clean feature flags — remove donate flag and window.ftoggle global
- Status: validated
- Description: Clean feature flags — remove donate flag and window.ftoggle global
- Primary owning slice: M011/S03
- Validation: model-features.js has no donate flag or window.ftoggle global; only debug/signin flags remain; cleaned in M002/S04.

### MOD-07 — Replace lodash with native Array methods
- Status: validated
- Description: Replace lodash with native Array methods
- Primary owning slice: M011/S03
- Validation: Zero lodash/_.  references in site/js/ or index.html; all 8 lodash calls replaced with native Array methods in M002/S04.

### SYNC-04 — Untitled
- Status: validated
- Primary owning slice: M011/S02
- Validation: markEdited() wired in entries.js updateEntry() for all 5 day fields (tp, tl, col, notes, emoji); hlc-write.spec.js Playwright test confirms rev:{uuid} localStorage key contains dot-path keys matching days.YYYY-MM-DD.{field} with non-empty HLC strings after any edit; all 18 tests pass. M011/S02 complete 2026-04-10.
- Notes: Will be implemented when StorageLocal is wired to call SyncClient.markEdited() on every field write in M011/S02.

### SYNC-05 — Untitled
- Status: validated
- Primary owning slice: M011/S01
- Validation: POST /year-planner/sync endpoint wired end-to-end: SyncClient builds payload, Api.sync() calls it, all 9 Vue/Storage call sites updated. sync-payload.spec.js Playwright mock test verifies payload shape (D007). All 17 tests pass. M011/S01 complete 2026-04-09.
- Notes: Base snapshot management is part of SyncClient.sync() — persisted to base:{uuid} after each successful sync in M011/S01.

### SYNC-06 — Implement `js/service/SyncClient.js` that wraps the jsmdma sync protocol for the year-planner. Uses `HLC` and `flatten` from the local `data-api-core.esm.js` bundle (jsmdma project). Manages `baseClock`, `fieldRevs`, and `baseSnapshot` per planner. Exposes `sync(plannerId)`, `markEdited(plannerId, dotPath)`, and `prune(plannerId)`. `StorageLocal.js` delegates all sync state management to `SyncClient`.
- Status: validated
- Description: Implement `js/service/SyncClient.js` that wraps the jsmdma sync protocol for the year-planner. Uses `HLC` and `flatten` from the local `data-api-core.esm.js` bundle (jsmdma project). Manages `baseClock`, `fieldRevs`, and `baseSnapshot` per planner. Exposes `sync(plannerId)`, `markEdited(plannerId, dotPath)`, and `prune(plannerId)`. `StorageLocal.js` delegates all sync state management to `SyncClient`.
- Primary owning slice: M011/S01
- Validation: SyncClient.js implemented with markEdited(plannerId, dotPath), async sync(plannerId, plannerDoc, authHeaders), and prune(plannerId). Manages rev:{uuid}, base:{uuid}, sync:{uuid} per planner. Uses HLC and flatten/merge from data-api-core.esm.js vendor bundle. CDI-registered as syncClient singleton. M011/S01 complete 2026-04-09.
- Notes: Clarified: the vendor bundle is from the jsmdma project, not a standalone data-api project.

## Deferred

### MOD-08 — Update Vue template bindings from v-bind:/v-on: to :/@ shorthand
- Status: deferred
- Description: Update Vue template bindings from v-bind:/v-on: to :/@ shorthand
- Primary owning slice: M011/S03
- Validation: Deferred — no validation required. Vue 3 supports both forms identically; this is a style preference only.
- Notes: Cosmetic-only change; Vue 3 supports both v-bind:/v-on: and :/@ shorthand identically. 41× v-bind: and 27× v-on: in index.html are harmless. Changing them across 6 fragment files risks introducing typos with zero functional benefit. Deferred to a future cosmetic pass.

### SYNC-08 — Untitled
- Status: deferred
- Notes: Deferred from M011 — user confirmed pruning can come later. No primary owning slice until a future milestone is planned.

## Traceability

| ID | Class | Status | Primary owner | Supporting | Proof |
|---|---|---|---|---|---|
| AUTH-06 |  | validated | M011/S01 | M011/S02 | SyncClient.js created; Api.js rewrites to POST /year-planner/sync with jsmdma payload shape {clientClock, deviceId, changes[{id,doc,fieldRevs}]}; StorageRemote.js deleted; sync-payload.spec.js Playwright test verifies payload shape; all 17 tests pass. M011/S01 complete 2026-04-09. |
| MOD-03 |  | validated | M011/S01 | none | StorageRemote.js deleted from codebase and removed from contexts.js. All references to synchroniseToLocal/synchroniseToRemote replaced across 5 Vue method files and Storage.js. M011/S01 complete 2026-04-09. |
| MOD-05 |  | validated | M011/S03 | none | SquareUp.js deleted in M002/S04; grep of site/js/ and index.html confirms zero squareup references; pay.html modal fragment deleted in M011/S03. |
| MOD-06 |  | validated | M011/S03 | none | model-features.js has no donate flag or window.ftoggle global; only debug/signin flags remain; cleaned in M002/S04. |
| MOD-07 |  | validated | M011/S03 | none | Zero lodash/_.  references in site/js/ or index.html; all 8 lodash calls replaced with native Array methods in M002/S04. |
| MOD-08 |  | deferred | M011/S03 | none | Deferred — no validation required. Vue 3 supports both forms identically; this is a style preference only. |
| MOD-09 |  | active | M011/S03 | none | mapped |
| SYNC-04 |  | validated | M011/S02 | none | markEdited() wired in entries.js updateEntry() for all 5 day fields (tp, tl, col, notes, emoji); hlc-write.spec.js Playwright test confirms rev:{uuid} localStorage key contains dot-path keys matching days.YYYY-MM-DD.{field} with non-empty HLC strings after any edit; all 18 tests pass. M011/S02 complete 2026-04-10. |
| SYNC-05 |  | validated | M011/S01 | none | POST /year-planner/sync endpoint wired end-to-end: SyncClient builds payload, Api.sync() calls it, all 9 Vue/Storage call sites updated. sync-payload.spec.js Playwright mock test verifies payload shape (D007). All 17 tests pass. M011/S01 complete 2026-04-09. |
| SYNC-06 |  | validated | M011/S01 | none | SyncClient.js implemented with markEdited(plannerId, dotPath), async sync(plannerId, plannerDoc, authHeaders), and prune(plannerId). Manages rev:{uuid}, base:{uuid}, sync:{uuid} per planner. Uses HLC and flatten/merge from data-api-core.esm.js vendor bundle. CDI-registered as syncClient singleton. M011/S01 complete 2026-04-09. |
| SYNC-08 |  | deferred | none | none | unmapped |

## Coverage Summary

- Active requirements: 1
- Mapped to slices: 1
- Validated: 8 (AUTH-06, MOD-03, MOD-05, MOD-06, MOD-07, SYNC-04, SYNC-05, SYNC-06)
- Unmapped active requirements: 0
