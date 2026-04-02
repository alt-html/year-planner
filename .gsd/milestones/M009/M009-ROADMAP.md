# M009: 

## Vision
Replace the cookie-era localStorage schema with a clean, HLC-ready, human-readable schema that directly supports the data-api sync protocol. Introduce stable device UUIDs, multi-planner-per-user-per-year support, dot-path fieldRevs per planner, base snapshots for 3-way text merge, and a one-time migration that preserves all existing user data. The app runs correctly on both fresh installs and migrated data. All 14 E2E tests pass.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | Vendor bundle integration + schema constants | low | — | ✅ | After this: HLC available in app. Key constants defined. Harness test green. |
| S02 | StorageLocal full rewrite | medium | S01 | ✅ | After this: all 14 tests green. localStorage in browser shows plnr:uuid keys with readable day objects. |
| S03 | One-time migration from old schema | medium | S02 | ✅ | After this: existing user data survives upgrade. Migration test green. All 14 tests green. |
