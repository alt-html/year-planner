# S06: S06: Integrated Verification and Sign-off — UAT

**Milestone:** M012
**Written:** 2026-04-16T00:45:19.966Z

# S06 User Acceptance Testing

## Preconditions
- Milestone M012/S01–S05 complete (icon candidates, winner selection, web/PWA exports, live wiring, desktop packaging all done)
- site/icons/matrix.json and site/icons/desktop-matrix.json exist with all required entries
- All icon PNG files exist in site/icons/ and site/icons/desktop/
- .tests/ directory is set up with npm dependencies installed
- bash, Node.js, npm available in PATH

## Test Suite 1: Visual Sign-off Spec Execution

### UAT-1.1: Run the visual sign-off spec in isolation
**Steps:**
1. Open terminal in project root
2. Execute: `npm --prefix .tests run test -- --reporter=line verification/S06-visual-sign-off.spec.js`
3. Wait for all tests to complete

**Expected Outcomes:**
- 29/29 tests pass
- No timeouts or skipped tests
- Execution completes in under 10s
- Three output files created:
  - `.tests/test-results/icon-visual-signoff/S06-visual-sign-off.html` (≥80 KB)
  - `.tests/test-results/icon-visual-signoff/S06-visual-sign-off-sheet.png` (≥100 KB)
  - `.tests/test-results/icon-visual-signoff/S06-sign-off-report.json` (readable JSON with `verdict: "pass"`)

### UAT-1.2: Inspect the generated sign-off sheet HTML
**Steps:**
1. Open `.tests/test-results/icon-visual-signoff/S06-visual-sign-off.html` in a browser
2. Scroll through the document and verify all icon surfaces render
3. Check that each surface is labeled with its purpose (any, maskable, monochrome) and size

**Expected Outcomes:**
- HTML loads without JS errors
- All icon surfaces visible (web favicons, iOS apple-touch, PWA icons in 3 purposes, desktop ico/icns badges)
- Labels clearly show purpose and size (e.g., "PWA any 192×192", "ICO 256×256")
- Ico embedded as image renders (visible icon image)
- Icns shown as styled badge (browsers don't support ICNS)

### UAT-1.3: Verify negative-boundary tests reject invalid inputs
**Steps:**
1. Run T01 spec and confirm 9 negative-boundary tests are included in the 29 total
2. Spot-check one: manually edit `site/icons/matrix.json` to remove a required size, run spec, observe failure with explicit diagnostics
3. Restore the file

**Expected Outcomes:**
- Spec shows all 29 tests pass normally
- Negative tests clearly identify failures (e.g., "missing 'any' purpose for size 16")
- Failure is explicit and actionable
- After restoration, spec passes again

## Test Suite 2: Integrated Runner Execution

### UAT-2.1: Run the full integrated sign-off runner
**Steps:**
1. Open terminal in project root
2. Execute: `bash scripts/verify-icon-integration-signoff.sh`
3. Monitor output as stages execute
4. Wait for completion (expect 2–3 minutes total)

**Expected Outcomes:**
- Each stage prints `[stage] START: <name>` and `[stage] PASS: <name>`
- All 8 stages report PASS (export-canonical, export-desktop, smoke-matrix, smoke-wiring, smoke-desktop, visual-signoff, full-suite, artifact-assertions)
- Final message: "Sign-off PASSED — all stages green"
- Exit code: 0

### UAT-2.2: Verify integrated runner via npm alias
**Steps:**
1. Execute: `npm --prefix .tests run test:icon-signoff`
2. Verify it invokes the same runner script

**Expected Outcomes:**
- npm alias successfully executes the runner
- Output identical to direct script invocation
- Exit code: 0

### UAT-2.3: Verify JSON report structure
**Steps:**
1. After runner completes, examine `.tests/test-results/icon-visual-signoff/S06-sign-off-report.json`
2. Verify JSON parses cleanly
3. Check that all 8 stages are recorded with name, command, exitCode, verdict

**Expected Outcomes:**
- JSON is valid (no parse errors)
- `verdict` field is "pass"
- All 8 stages listed with exitCode 0 and verdict "pass"
- `artifacts` object records HTML, screenshot, report paths with success flags

### UAT-2.4: Test runner failure handling
**Steps:**
1. Manually break a contract: edit `site/icons/matrix.json` and remove a required size
2. Re-run: `bash scripts/verify-icon-integration-signoff.sh`
3. Observe that runner stops and examine the JSON report

**Expected Outcomes:**
- Runner stops before reaching full-playwright-suite
- JSON report written despite failure
- Report identifies the failing stage
- No data loss — report is created and readable
- Restore the file and re-run; runner passes again

## Test Suite 3: Documentation and Integration

### UAT-3.1: Review sign-off checklist
**Steps:**
1. Open `.tests/verification/S06-sign-off-checklist.md`
2. Verify it documents required surfaces, artifact locations, all 8 stages, and human review steps

**Expected Outcomes:**
- Checklist is complete and readable
- Matches the actual runner stage count (8)
- Artifact paths match runner output locations
- Clear enough for future audits without re-reading code

### UAT-3.2: Confirm full Playwright suite passes
**Steps:**
1. The integrated runner includes the full Playwright suite as stage 7
2. Verify from runner output that all tests pass

**Expected Outcomes:**
- All existing E2E and smoke tests pass
- No new failures introduced by S06 work

## UAT Sign-off Criteria

All of the following must be true to consider S06 successfully verified:

✅ Visual sign-off spec executes with 29/29 tests passing
✅ All visual artifacts (HTML, PNG, JSON) are created and non-zero byte
✅ Integrated runner completes with exit code 0 and all 8 stages green
✅ JSON report is valid and shows verdict clearly
✅ HTML sign-off sheet shows all required surfaces and is browser-readable
✅ Negative-boundary tests demonstrate that invalid inputs are rejected with diagnostics
✅ Runner failure handling works: JSON written on failure, failing stage identified
✅ npm alias `test:icon-signoff` works
✅ Checklist documentation is present and complete
✅ Full Playwright suite passes (no regressions)
✅ Future agent can run the sign-off reproducibly without re-reading code
