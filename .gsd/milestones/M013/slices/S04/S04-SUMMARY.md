---
id: S04
parent: M013
milestone: M013
provides:
  - Unified M013 verification runner (scripts/verify-m013-cleanup.sh)
  - Structured JSON verification report (.tests/test-results/m013-cleanup/M013-cleanup-report.json)
  - CI/local parity via .github/workflows/e2e.yml integration
  - Fixed 11 legacy URL-param navigation surfaces
  - All M013 requirement debt closed (R007/R109 validated)
  - Complete regression proof (3 grep gates + 263/272 Playwright tests)
requires:
  []
affects:
  []
key_files:
  - scripts/verify-m013-cleanup.sh
  - site/index.html
  - .compose/fragments/rail.html
  - .compose/fragments/nav.html
  - .compose/fragments/footer.html
  - .tests/package.json
  - .github/workflows/e2e.yml
  - .tests/test-results/m013-cleanup/M013-cleanup-report.json
  - .gsd/REQUIREMENTS.md
key_decisions:
  - D027 — Orchestrator-gate architecture: single repo-level verification entrypoint ensures CI and local proof paths cannot drift. Three fast grep gates run first before expensive Playwright tests to fail fast on violations.
patterns_established:
  - Playwright clears test-results/ at startup — any script writing artifacts must re-create output directory inside write function, not just at top level.
  - URL-param navigation violations can hide in compose fragments — always update both fragments and composed output to maintain COMP-02 contract.
  - Trap handlers + manual exit capture enables fine-grained JSON reporting without set -e, allowing post-mortem diagnosis of which stage failed.
observability_surfaces:
  - none
drill_down_paths:
  []
duration: ""
verification_result: passed
completed_at: 2026-04-16T06:52:59.231Z
blocker_discovered: false
---

# S04: Verification Hardening & Requirement Closure

**Delivered unified M013 verification orchestrator with integrated regression proof (all four legacy gates + 263 Playwright tests pass) and closed requirement debt (R007/R109 validated).**

## What Happened

S04 completed the final assembly and verification phase for the M013 legacy cleanup milestone. The slice delivered:

1. **Unified verification orchestrator** (`scripts/verify-m013-cleanup.sh`): A single-entry-point bash script that runs three legacy grep gates (uid, URL-state-params, share/feature surfaces) followed by the full Playwright smoke+e2e suite. The script uses structured JSON reporting to record per-stage verdicts, fail-fast exit codes, and timestamps in `.tests/test-results/m013-cleanup/M013-cleanup-report.json`.

2. **Fixed 11 legacy URL-param navigation surfaces**: Converted all remaining ?uid= and ?id= href attributes in site/index.html and compose fragments to Vue in-app method calls (setTheme, jumpToYear, setLang). These were blocking the three grep gates from passing.

3. **Integrated regression proof**: All four verification stages pass:
   - verify-no-legacy-uid: grep gates on site/index.html + site/js/** → exit 0
   - verify-no-url-state-params: grep gates on runtime source → exit 0
   - verify-no-legacy-share-features: grep gates on compose fragments + Vue → exit 0
   - playwright-smoke-e2e: 263 tests pass, 9 skipped (server-side contract tests requiring live API)

4. **Closed milestone requirement debt**: R007 (continuity) and R109 (quality-attribute) both validated with concrete S04 evidence. Active requirement count is now 0 across M013.

5. **CI/local parity**: Updated .github/workflows/e2e.yml to invoke the unified verifier instead of raw Playwright, ensuring CI and local verification paths remain synchronized.

## Architecture Decisions

- **Fire-and-forget JSON reporting**: The verifier uses a trap EXIT handler plus manual exit code capture to ensure the report is always written, even on unexpected abort. The report directory is re-created inside write_report() to handle Playwright's mid-run test-results/ cleanup.
- **Fail-fast ordering**: Grep gates run first (fast, <1s each) before expensive Playwright tests, surfacing violations early.
- **No mocking or partial proofs**: The integrated gate runs the full real test suite — 272 Playwright tests. The 9 skipped tests are server-side contract tests (require live backend API); the 263 passing tests provide comprehensive regression proof.

## Integration Boundaries

**Upstream surfaces consumed:**
- `scripts/verify-no-legacy-uid.sh`, `scripts/verify-no-url-state-params.sh`, `scripts/verify-no-legacy-share-features.sh` (grep gate scripts from S01/S02/S03)
- `.tests/e2e/`, `.tests/smoke/` Playwright test suites
- Current `.github/workflows/e2e.yml` CI workflow

**New wiring introduced:**
- `scripts/verify-m013-cleanup.sh` — orchestrator runner
- `.tests/test-results/m013-cleanup/M013-cleanup-report.json` — structured verification artifact
- `"test:m013-cleanup"` npm script alias

**No breaking changes**: The verifier is additive; existing Playwright, CI, and local workflows remain functional and can continue to call e2e/smoke tests independently.

## Patterns & Lessons

1. **Playwright clears test-results/ at startup**: Any script writing artifacts into test-results/ must re-create its output directory inside the write function, not just at top-level. This was discovered during integration when the report directory vanished mid-run.

2. **URL-param navigation can hide in compose fragments**: Six of the 11 fixed URL-param violations were in `.compose/fragments/` source files, not directly in site/index.html. The compose build contract (COMP-02) requires fragments and output to stay in sync — always update both when fixing navigation surfaces.

3. **Trap handlers + manual exit capture provides fine-grained failure reporting**: Rather than using `set -e`, manual exit capture via `local exit_code=0; "$@" || exit_code=$?` allows each stage's failure to be recorded in JSON before the script exits. This pattern enables post-mortem diagnosis of which stage failed without re-running the entire gate.

## Remaining Work

None — M013 is complete. All slices (S01/S02/S03/S04) are verified, all requirement debt is closed, and the integrated gate passes with full regression proof.

## Verification

All verification checks passed:

✅ Unified verifier script created and wired into CI (`bash scripts/verify-m013-cleanup.sh` exit 0)
✅ All four stages pass: verify-no-legacy-uid, verify-no-url-state-params, verify-no-legacy-share-features, playwright-smoke-e2e (263 pass, 9 skipped)
✅ JSON report artifact created at `.tests/test-results/m013-cleanup/M013-cleanup-report.json` with overall:pass and failedStage:null
✅ CI integration verified: `.github/workflows/e2e.yml` updated to use unified verifier + artifact upload
✅ npm alias verified: `.tests/package.json` has `test:m013-cleanup` script
✅ Legacy surfaces verified removed: all three grep gates confirm zero uid/?id=/share/feature violations
✅ Requirement R007 validated with S04 evidence (unified gate exit 0, report artifact)
✅ Requirement R109 validated with S04 evidence (final integrated proof: 3 grep gates + 263/272 tests + unified runner)
✅ Active M013 requirement count: 0 (all debt closed)

Full closure verification command: `bash scripts/verify-m013-cleanup.sh && test -s .tests/test-results/m013-cleanup/M013-cleanup-report.json && rg -n '### R007|### R109|Status: validated|verify-m013-cleanup.sh' .gsd/REQUIREMENTS.md` → exit 0

## Requirements Advanced

None.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Operational Readiness

None.

## Deviations

None.

## Known Limitations

None.

## Follow-ups

None.

## Files Created/Modified

None.
