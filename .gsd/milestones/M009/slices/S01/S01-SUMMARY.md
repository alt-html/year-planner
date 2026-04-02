---
id: S01
parent: M009
milestone: M009
provides:
  - js/service/storage-schema.js with all key/field constants for S02 import
requires:
  []
affects:
  - S02
key_files:
  - js/service/storage-schema.js
  - .tests/smoke/harness.spec.js
key_decisions:
  - data-api-core.esm.js already in js/vendor/ — no index.html changes needed
  - SYNC-01 uses dynamic import in browser evaluate to verify the vendor bundle
patterns_established:
  - storage-schema.js is the single source of truth for all localStorage key names and day field names
observability_surfaces:
  - none
drill_down_paths:
  - .gsd/milestones/M009/slices/S01/tasks/T01-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-28T12:22:01.101Z
blocker_discovered: false
---

# S01: Vendor bundle integration + schema constants

**Schema constants module + SYNC-01 smoke test in place; 15/15 tests pass**

## What Happened

Created the schema constants module and verified the HLC vendor bundle is accessible in the browser. No index.html or fragment changes needed because data-api-core.esm.js is already in js/vendor/. All 15 tests pass.

## Verification

All 15 tests pass: cd .tests && npx playwright test (15 passed in 6.7s)

## Requirements Advanced

None.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

None.

## Known Limitations

None.

## Follow-ups

None.

## Files Created/Modified

- `js/service/storage-schema.js` — New file: localStorage key builders, field name constants, HLC_ZERO, HLC re-export
- `.tests/smoke/harness.spec.js` — Added SYNC-01 smoke test verifying HLC importable from vendor bundle
