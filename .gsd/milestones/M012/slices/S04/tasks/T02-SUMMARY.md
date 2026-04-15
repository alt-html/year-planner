---
id: T02
parent: S04
milestone: M012
key_files:
  - .tests/smoke/icon-live-wiring.spec.js
  - .tests/smoke/compose.spec.js
key_decisions:
  - Fix compose.spec.js race condition by running m4 to stdout instead of calling build.sh — eliminates the parallel read/write conflict on site/index.html without changing the test's assertion semantics
duration: 
verification_result: passed
completed_at: 2026-04-15T23:52:33.818Z
blocker_discovered: false
---

# T02: Fix parallel test race condition in compose.spec.js and confirm all 57 smoke assertions pass together across icon-live-wiring, compose, and export-matrix specs

**Fix parallel test race condition in compose.spec.js and confirm all 57 smoke assertions pass together across icon-live-wiring, compose, and export-matrix specs**

## What Happened

T01 had already created `.tests/smoke/icon-live-wiring.spec.js` (28 assertions) and wired canonical icon paths into both `site/index.html` (via compose) and `site/manifest.json`. T02's job was to run the full combined suite and confirm the regression checks hold.\n\nRunning all three specs together (`icon-live-wiring.spec.js`, `compose.spec.js`, `icon-export-matrix.spec.js`) with 3 Playwright workers initially produced 1 failure: the `favicon-16x16` head-ref test in `icon-live-wiring.spec.js` returned false even though Node.js verified the string was present in the file. Investigation confirmed a read/write race condition: `compose.spec.js` test 1 invokes `bash .compose/build.sh` which overwrites `site/index.html` concurrently with a worker reading it in `icon-live-wiring.spec.js`.\n\nFix: changed `compose.spec.js` to run `m4 -P .compose/index.html.m4` directly to stdout (captured as a string) instead of invoking `build.sh` which writes to the production file. The comparison is identical — m4 output vs. current file content — but no file is written during the test, eliminating the race. The compose test continues to assert idempotency (m4 output === current file).\n\nAfter the fix: 57/57 pass across all three specs running with 3 parallel workers. All slice verification commands also pass: `bash .compose/build.sh` succeeds (695 lines), and the manifest icon count node check confirms exactly 6 entries.

## Verification

Ran `npm --prefix .tests run test -- --reporter=line smoke/icon-live-wiring.spec.js smoke/compose.spec.js smoke/icon-export-matrix.spec.js` — 57/57 passed with 3 workers. Ran `bash .compose/build.sh` — exit 0, 695 lines. Ran manifest icon-count node check — 6 entries confirmed.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash .compose/build.sh` | 0 | ✅ pass | 400ms |
| 2 | `node -e "manifest icon count === 6"` | 0 | ✅ pass | 30ms |
| 3 | `npm --prefix .tests run test -- --reporter=line smoke/icon-live-wiring.spec.js (isolated)` | 0 | ✅ pass — 28/28 | 2300ms |
| 4 | `npm --prefix .tests run test -- --reporter=line smoke/compose.spec.js (after fix)` | 0 | ✅ pass — 5/5 | 2400ms |
| 5 | `npm --prefix .tests run test -- --reporter=line smoke/icon-live-wiring.spec.js smoke/compose.spec.js smoke/icon-export-matrix.spec.js` | 0 | ✅ pass — 57/57 | 1900ms |

## Deviations

compose.spec.js was not listed as a file this task would touch, but fixing its race condition was necessary for the slice verification command to pass reliably under parallel workers.

## Known Issues

none

## Files Created/Modified

- `.tests/smoke/icon-live-wiring.spec.js`
- `.tests/smoke/compose.spec.js`
