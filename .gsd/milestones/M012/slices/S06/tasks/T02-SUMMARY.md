---
id: T02
parent: S06
milestone: M012
key_files:
  - scripts/verify-icon-integration-signoff.sh
  - .tests/package.json
  - .tests/verification/S06-sign-off-checklist.md
  - .tests/test-results/icon-visual-signoff/S06-sign-off-report.json
key_decisions:
  - Runner writes the JSON report on both success and failure (using || { write_report; exit 1; } pattern) so the failing stage is always identifiable from the artifact alone — no log parsing needed
  - Stage results are accumulated in a temp TSV file rather than bash arrays to avoid subshell scoping issues with set -uo pipefail
  - artifact-assertions is an explicit final stage (not folded into the script exit) so its pass/fail appears as a named entry in the JSON report
duration: 
verification_result: passed
completed_at: 2026-04-16T00:40:00.083Z
blocker_discovered: false
---

# T02: Add integrated sign-off runner (8-stage shell script + npm alias + checklist) that executes export refresh → smoke contracts → visual spec → full Playwright suite and writes a structured JSON verdict

**Add integrated sign-off runner (8-stage shell script + npm alias + checklist) that executes export refresh → smoke contracts → visual spec → full Playwright suite and writes a structured JSON verdict**

## What Happened

Created `scripts/verify-icon-integration-signoff.sh` — an 8-stage bash runner that provides a single reproducible command for the complete R006 sign-off sequence.

**Runner design:**
- `set -uo pipefail` with explicit per-stage exit-code capture (`bash -c CMD || exit_code=$?`) so failure of one stage stops the run without hiding error context.
- A `run_stage NAME CMD` helper prints phase-tagged `[stage]` logs, appends a TSV record to a temp file, and returns 1 on failure.
- A `check_artifacts` function independently verifies the three required output files are present and non-zero byte, even when all test stages pass.
- A `write_report` function calls Python3 to read the TSV stage log and emit `S06-sign-off-report.json` with per-stage name/command/exitCode/verdict fields, artifact path flags, and an optional `failedStage` key on any non-zero run.
- The `trap 'rm -f "${STAGE_LOG}"' EXIT` cleans up the temp TSV; `${REPORT_JSON}` is always kept.
- All eight stage calls use `|| { write_report; exit 1; }` so the JSON report is written even when the run fails — the failing stage is always identifiable without digging through log output.

**Stages (in order):**
1. `export-canonical-icon-matrix` — `bash scripts/export-canonical-icon-matrix.sh`
2. `export-desktop-packaging-assets` — `bash scripts/export-desktop-packaging-assets.sh`
3. `smoke-icon-export-matrix` — `npm --prefix .tests run test -- --reporter=line smoke/icon-export-matrix.spec.js`
4. `smoke-icon-live-wiring` — `npm --prefix .tests run test -- --reporter=line smoke/icon-live-wiring.spec.js`
5. `smoke-icon-desktop-packaging` — `npm --prefix .tests run test -- --reporter=line smoke/icon-desktop-packaging.spec.js`
6. `s06-visual-sign-off` — `npm --prefix .tests run test -- --reporter=line verification/S06-visual-sign-off.spec.js`
7. `full-playwright-suite` — `npm --prefix .tests run test -- --reporter=line`
8. `artifact-assertions` — checks HTML, PNG, and JSON non-zero-byte presence

**npm alias:** Added `"test:icon-signoff": "bash ../scripts/verify-icon-integration-signoff.sh"` to `.tests/package.json`.

**Checklist:** `.tests/verification/S06-sign-off-checklist.md` documents required web/PWA and desktop surfaces, artifact locations, all eight stage names/commands, and human review steps for marking R006 satisfied.

**Run outcome:** `bash scripts/verify-icon-integration-signoff.sh` completed with exit 0. All 8 stages passed; `S06-sign-off-report.json` updated to the integrated format with `verdict: pass`.

## Verification

Three slice-level checks all pass:

1. `npm --prefix .tests run test -- --reporter=line verification/S06-visual-sign-off.spec.js` → 29/29 tests passed (2.9s)
2. `bash scripts/verify-icon-integration-signoff.sh` → exit 0, all 8 stages green, integrated JSON report written
3. `test -s .tests/test-results/icon-visual-signoff/S06-visual-sign-off-sheet.png && test -s .tests/test-results/icon-visual-signoff/S06-sign-off-report.json` → both files present and non-zero byte

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash scripts/verify-icon-integration-signoff.sh` | 0 | ✅ pass — all 8 stages green, verdict:pass in JSON report | 120000ms |
| 2 | `npm --prefix .tests run test -- --reporter=line verification/S06-visual-sign-off.spec.js` | 0 | ✅ pass — 29/29 tests passed in 2.9s | 2900ms |
| 3 | `test -s .tests/test-results/icon-visual-signoff/S06-visual-sign-off-sheet.png` | 0 | ✅ pass — PNG present | 10ms |
| 4 | `test -s .tests/test-results/icon-visual-signoff/S06-sign-off-report.json` | 0 | ✅ pass — integrated JSON report present with verdict:pass | 10ms |

## Deviations

none

## Known Issues

none

## Files Created/Modified

- `scripts/verify-icon-integration-signoff.sh`
- `.tests/package.json`
- `.tests/verification/S06-sign-off-checklist.md`
- `.tests/test-results/icon-visual-signoff/S06-sign-off-report.json`
