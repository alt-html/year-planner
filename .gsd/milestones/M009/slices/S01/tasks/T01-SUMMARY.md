---
id: T01
parent: S01
milestone: M009
provides: []
requires: []
affects: []
key_files: ["js/service/storage-schema.js", ".tests/smoke/harness.spec.js"]
key_decisions: ["Imported HLC via relative path ../vendor/data-api-core.esm.js from storage-schema.js (js/service/ to js/vendor/)", "No changes needed to index.html or .compose/ fragments — data-api-core.esm.js is already in js/vendor/ and served by http-server", "SYNC-01 smoke test uses page.evaluate() to dynamically import the vendor bundle at runtime"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "cd .tests && npx playwright test — 15 passed (6.7s)"
completed_at: 2026-03-28T12:21:44.534Z
blocker_discovered: false
---

# T01: Created storage-schema.js with all M009 key/field constants; added SYNC-01 smoke test — 15/15 pass

> Created storage-schema.js with all M009 key/field constants; added SYNC-01 smoke test — 15/15 pass

## What Happened
---
id: T01
parent: S01
milestone: M009
key_files:
  - js/service/storage-schema.js
  - .tests/smoke/harness.spec.js
key_decisions:
  - Imported HLC via relative path ../vendor/data-api-core.esm.js from storage-schema.js (js/service/ to js/vendor/)
  - No changes needed to index.html or .compose/ fragments — data-api-core.esm.js is already in js/vendor/ and served by http-server
  - SYNC-01 smoke test uses page.evaluate() to dynamically import the vendor bundle at runtime
duration: ""
verification_result: passed
completed_at: 2026-03-28T12:21:44.535Z
blocker_discovered: false
---

# T01: Created storage-schema.js with all M009 key/field constants; added SYNC-01 smoke test — 15/15 pass

**Created storage-schema.js with all M009 key/field constants; added SYNC-01 smoke test — 15/15 pass**

## What Happened

Created js/service/storage-schema.js exporting all localStorage key constants (KEY_DEV, KEY_TOK, KEY_IDS, keyPrefs, keyPlnr, keyRev, keyBase, keySync) and day field name constants (F_TYPE, F_TL, F_COL, F_NOTES, F_EMOJI) plus HLC_ZERO and re-exported HLC. Added SYNC-01 smoke test to harness.spec.js — it navigates to the app, then dynamically imports /js/vendor/data-api-core.esm.js in browser context, creates a clock, ticks it, and verifies the ticked clock is greater than the original. All 15 tests pass (14 existing + 1 new).

## Verification

cd .tests && npx playwright test — 15 passed (6.7s)

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd .tests && npx playwright test` | 0 | ✅ pass | 6700ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `js/service/storage-schema.js`
- `.tests/smoke/harness.spec.js`


## Deviations
None.

## Known Issues
None.
