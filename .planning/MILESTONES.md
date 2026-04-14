# Milestones

## v1.3 jsmdma Sync (Shipped: 2026-04-13)

**Phases completed:** 2 phases (11-12), 5 plans

**Key accomplishments:**

- jsmdma HLC sync protocol implemented — SyncClient.js with markEdited/sync/prune, Api.js rewritten to POST /year-planner/sync, StorageRemote.js deleted
- Per-field HLC write-path wired — every day entry edit stamps dot-path HLC entries to rev:{uuid} in localStorage
- Code modernisation complete — SquareUp, lodash, donate flag removed; 7 orphan modal fragments deleted; CDI wiring audited
- Rail migrated into Vue — jQuery/Bootstrap JS bridge removed, flyout UI with planner selector and settings
- Contract tests against live jsmdma backend — signed JWT minting, run-local.js server lifecycle, SYNC-08 prune verification

**Tech debt accepted:** 4 items (see milestones/v1.3-MILESTONE-AUDIT.md)

---
