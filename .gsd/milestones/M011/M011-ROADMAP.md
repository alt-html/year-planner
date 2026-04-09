# M011: jsmdma Sync Protocol & MOD Cleanup

## Vision
Replace the obsolete push/pull sync layer with a proper jsmdma HLC-based bidirectional sync: build SyncClient.js, rewrite Api.js to POST /year-planner/sync, wire HLC field tracking into every StorageLocal write, delete the dead StorageRemote.js, and resolve outstanding MOD-02 era cleanup items. When complete, field-level HLC clocks are tracked on every edit and the sync payload is shaped correctly for the jsmdma backend — ready to wire to a live server the moment client IDs are configured.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | S01 | high | — | ✅ | After this: SyncClient.js is CDI-registered; Api.js posts to /year-planner/sync with jsmdma payload shape; StorageRemote.js is gone; Playwright mock test verifies payload shape and passes alongside existing sync-error test. |
| S02 | S02 | medium | — | ✅ | After this: editing any day entry writes a dot-path HLC entry to rev:{uuid} in localStorage; Playwright test confirms this; all 14 E2E tests pass. |
| S03 | S03 | low | — | ✅ | After this: MOD audit is documented; all pending MOD-05–09 items are resolved or explicitly deferred with rationale; all 14 tests pass. |
