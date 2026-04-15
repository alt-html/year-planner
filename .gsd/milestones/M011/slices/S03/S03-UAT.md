# S03: MOD audit + cleanup — UAT

**Milestone:** M011
**Written:** 2026-04-09T21:28:19.660Z

# S03: MOD audit + cleanup — UAT

**Milestone:** M011
**Written:** 2026-04-10

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: S03 made no runtime code changes — only requirement status updates (DB/REQUIREMENTS.md) and file deletions (.compose/fragments/modals/). The deliverables are fully verifiable via filesystem inspection, compose build, and Playwright test run. No browser interaction is required.

## Preconditions

- Working directory: `/Users/craig/src/github/alt-html/year-planner`
- Node.js and Playwright installed (`cd .tests && npm install` run previously)
- sqlite3 available in PATH

## Smoke Test

Run `ls .compose/fragments/modals/ | sort` — expect exactly 5 lines: `auth.html`, `delete.html`, `entry.html`, `feature.html`, `share.html`. Any other file listed is a failure.

## Test Cases

### 1. Modal fragment directory contains exactly 5 files

1. Run: `ls .compose/fragments/modals/ | sort | tr '\n' ' '`
2. **Expected:** `auth.html delete.html entry.html feature.html share.html ` — exactly these 5 files, none added or remaining from the 7 that were deleted.

### 2. Deleted orphan files are gone

1. Run: `ls .compose/fragments/modals/pay.html .compose/fragments/modals/signin.html .compose/fragments/modals/register.html .compose/fragments/modals/reset-password.html .compose/fragments/modals/recover-username.html .compose/fragments/modals/cookie.html .compose/fragments/modals/settings.html 2>&1`
2. **Expected:** All 7 paths produce "No such file or directory" — exit code non-zero. None of the deleted files should exist.

### 3. Compose build succeeds and produces unchanged output

1. Run: `bash .compose/build.sh`
2. **Expected:** Exit code 0. The site/index.html is produced (or confirmed identical if already present). The deleted fragment files were never included in any .m4 template, so no content is lost.

### 4. MOD requirements show correct statuses in REQUIREMENTS.md

1. Run: `grep -A3 'MOD-0[5-9]' .gsd/REQUIREMENTS.md | grep -E '(validated|deferred)'`
2. **Expected:** MOD-05, MOD-06, MOD-07, MOD-09 all show `(validated)`; MOD-08 shows `(deferred)`.

### 5. MOD-08 deferred rationale is present in REQUIREMENTS.md

1. Run: `grep -A5 'MOD-08' .gsd/REQUIREMENTS.md`
2. **Expected:** Entry includes "deferred" status and rationale mentioning that Vue 3 supports both v-bind:/v-on: and :/@ forms identically.

### 6. All 18 Playwright tests pass

1. Run: `cd .tests && npx playwright test --reporter=line`
2. **Expected:** `18 passed` with exit code 0. No failures, no skipped tests. This confirms the file deletions introduced no regressions to the runtime app or test harness.

### 7. Database confirms requirement status

1. Run: `sqlite3 .gsd/gsd.db "SELECT id, status FROM requirements WHERE id LIKE 'MOD-%' ORDER BY id"`
2. **Expected:**
   - MOD-05 | validated
   - MOD-06 | validated
   - MOD-07 | validated
   - MOD-08 | deferred
   - MOD-09 | validated

## Edge Cases

### Compose build after deletion does not change site/index.html

1. Run: `git diff --name-only site/index.html` (or check file timestamp)
2. **Expected:** site/index.html is not modified — the deleted fragments were not part of any build input, so the output is byte-identical to the pre-S03 version.

### No squareup or pay references remain anywhere

1. Run: `grep -ri 'squareup\|pay\.html' site/js/ site/index.html .compose/` 2>/dev/null
2. **Expected:** No matches — SquareUp integration is fully excised at both the JS level (M002/S04) and the modal fragment level (S03).

## Failure Signals

- `ls .compose/fragments/modals/ | wc -l` returns anything other than 5 — either deletions didn't happen or unexpected files remain
- `bash .compose/build.sh` exits non-zero — a build input was accidentally removed
- Any Playwright test fails — regression introduced (unexpected, since no code changed)
- REQUIREMENTS.md shows MOD-05/06/07/09 as `active` or MOD-08 as `active` — requirement update didn't persist

## Not Proven By This UAT

- That the validated MOD items were correctly implemented in prior milestones — this UAT verifies status tracking only; the actual implementation evidence (grep output, code inspection) was gathered during M002/S04 and is noted in validation fields
- Live runtime behavior — S03 made no code changes; runtime correctness is covered by the 18 Playwright tests
- MOD-08 deferral outcome — the cosmetic v-bind:/v-on: conversion remains undone; this UAT confirms the deferral is recorded, not that the conversion will happen

## Notes for Tester

This slice was pure housekeeping with no code changes. The Playwright test run is the most meaningful signal — if all 18 pass after the file deletions, S03 is clean. The requirement status checks in REQUIREMENTS.md and the DB are secondary confirmation that the GSD database is consistent with what was executed.
