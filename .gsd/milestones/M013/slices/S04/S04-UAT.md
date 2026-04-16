# S04: Verification Hardening & Requirement Closure — UAT

**Milestone:** M013
**Written:** 2026-04-16T06:52:59.231Z

# S04 User Acceptance Tests — M013 Verification Hardening & Requirement Closure

## Preconditions

- Repository root is `/Users/craig/src/github/alt-html/year-planner`
- All M013 slice dependencies (S01/S02/S03) have been applied (legacy surfaces removed, system-follow preferences implemented)
- Playwright E2E test environment is available (`npm --prefix .tests install` completed)
- Bash 5.0+ and standard Unix tools (jq, rg, etc.) are available

## Test Cases

### TC-S04-01: Verifier script exists and is executable

**Given** the repository is in clean M013 post-S04 state
**When** checking verifier artifacts
**Then** all must exist and be accessible:

1. File exists: `ls -l scripts/verify-m013-cleanup.sh` returns exit 0 and file size > 0
2. Is executable: `test -x scripts/verify-m013-cleanup.sh` returns exit 0
3. Syntax check: `bash -n scripts/verify-m013-cleanup.sh` returns exit 0 (no syntax errors)
4. npm alias exists: `rg "test:m013-cleanup" .tests/package.json` returns match with command `bash ../scripts/verify-m013-cleanup.sh`
5. CI integration: `rg "verify-m013-cleanup" .github/workflows/e2e.yml` returns matches for script invocation + artifact upload step

**Expected outcome:** All 5 checks pass without errors.

### TC-S04-02: Verifier runs all four stages in order

**Given** the verifier script is executable and the environment is ready
**When** running `bash scripts/verify-m013-cleanup.sh` from repo root
**Then** stdout/stderr output shows:

1. Preflight check passes (dependency scripts exist)
2. Stage 1 starts: "Stage: verify-no-legacy-uid" and exits 0
3. Stage 2 starts: "Stage: verify-no-url-state-params" and exits 0
4. Stage 3 starts: "Stage: verify-no-legacy-share-features" and exits 0
5. Stage 4 starts: "Stage: playwright-smoke-e2e" and contains "Running ... tests using ... workers"
6. Final success message: "M013 Verification PASS: all stages completed successfully"
7. Script exit code is 0

**Expected outcome:** Verifier exits 0 with all four stages passing and no "FAIL" markers in output.

### TC-S04-03: JSON report is written and has correct structure

**Given** the verifier script has completed successfully
**When** checking the report artifact
**Then** the report must exist and be valid:

1. File exists: `test -s .tests/test-results/m013-cleanup/M013-cleanup-report.json` returns exit 0
2. Is valid JSON: `jq . .tests/test-results/m013-cleanup/M013-cleanup-report.json` returns exit 0 with no parse errors
3. Has required top-level fields:
   - `jq .runTimestamp` is non-empty string (ISO 8601 timestamp)
   - `jq .overall` equals string "pass"
   - `jq .failedStage` is null (no stage failed)
   - `jq '.stages | length'` equals 4 (four stages recorded)
4. Each stage record has required fields: `stage`, `command`, `exitCode`, `verdict`, `timestamp`
5. All stage verdicts are "pass": `jq '.stages[] | select(.verdict != "pass") | length'` returns 0

**Expected outcome:** Report file is valid JSON with correct structure and all verdicts recorded as pass.

### TC-S04-04: Grep gates confirm no legacy uid navigation surfaces

**Given** the verifier script completed and site/index.html was updated
**When** running the verify-no-legacy-uid gate
**Then** it must find zero violations:

1. Run gate: `bash scripts/verify-no-legacy-uid.sh` exits 0
2. No uid= patterns in site/index.html: `rg '\?uid=' site/index.html` returns no matches
3. No legacy uid mutation paths in site/js/**:
   - `rg 'location.href.*=.*uid' site/js/` returns no matches
   - `rg 'getUrlParams.*uid' site/js/` returns no matches
4. Navigation links in compose fragments use in-app methods:
   - `rg 'v-on:click' .compose/fragments/rail.html | wc -l` shows multiple click handlers
   - `rg 'href="#"' .compose/fragments/nav.html` confirms navigation uses preventable href="#"

**Expected outcome:** Grep gate exits 0 with zero violations; navigation uses Vue methods, not URL parameters.

### TC-S04-05: URL-state-params gate confirms no app-state query parameters

**Given** site/index.html and Application.js were updated
**When** running the verify-no-url-state-params gate
**Then** it must find zero app-state parameter surfaces:

1. Run gate: `bash scripts/verify-no-url-state-params.sh` exits 0
2. No bootstrap from URL params: `rg 'getUrlParams' site/js/ | rg -v '//' | wc -l` shows only utility definition, no call sites
3. Application.js does not read year/lang/theme from URL: `rg 'parseURLState|this.url.parameters|getUrlParam' site/js/Application.js` returns no matches
4. Preferences are read from localStorage only: `rg 'getLocalPreferences|prefs.lang|prefs.theme|prefs.year' site/js/Application.js | wc -l` shows multiple hits (preferences sourced from storage)

**Expected outcome:** Grep gate exits 0; URL parameters are not parsed or used for state initialization.

### TC-S04-06: Share/feature surfaces gate confirms no legacy UI controls

**Given** compose fragments and Vue model were updated
**When** running the verify-no-legacy-share-features gate
**Then** it must find zero share/feature surfaces:

1. Run gate: `bash scripts/verify-no-legacy-share-features.sh` exits 0
2. No share modal in runtime: `rg 'shareModal|sharePlanner|setModelFromImportString|getExportString' site/js/` returns no matches
3. No feature flag system: `rg 'feature\.|showFeatureModal|toggleFeatureModal|model-features' site/js/` returns no matches
4. Compose fragments do not reference removed modals:
   - `rg 'shareModal|featureModal|import-export' .compose/fragments/` returns no matches
   - Generated site/index.html confirms fragments were composed correctly: `wc -l site/index.html` shows expected line count

**Expected outcome:** Grep gate exits 0; no share or feature-flag surfaces remain in runtime or compose output.

### TC-S04-07: Playwright smoke+e2e suite passes with 263/272 tests

**Given** the full test environment is ready and app is running
**When** running `npm --prefix .tests run test -- --reporter=line e2e/ smoke/`
**Then** the test suite must show:

1. Total test count: output contains "Running 272 tests using"
2. Passing tests: output contains "263 passed"
3. Skipped tests: output contains "9 skipped" (server-side contract tests)
4. No failures: output does NOT contain "failed" or exit code is not 0 for test command
5. System-follow preferences tests all pass: `rg 'system-follow-preferences' .tests/test-results/` shows passing test output (if in verbose mode)

**Expected outcome:** Test suite exits 0 with 263 passing tests and 9 skipped; no test failures.

### TC-S04-08: Requirements R007 and R109 show validated status

**Given** the requirement registry has been updated after the integrated gate passed
**When** checking REQUIREMENTS.md
**Then** both requirements must show validated status with S04 evidence:

1. R007 exists and is validated: `rg '### R007' .gsd/REQUIREMENTS.md -A 3 | rg 'Status: validated'` returns match
2. R007 validation cites S04: `rg '### R007' .gsd/REQUIREMENTS.md -A 10 | rg 'verify-m013-cleanup|M013-cleanup-report'` returns match
3. R109 exists and is validated: `rg '### R109' .gsd/REQUIREMENTS.md -A 3 | rg 'Status: validated'` returns match
4. R109 validation cites final integrated proof: `rg '### R109' .gsd/REQUIREMENTS.md -A 10 | rg 'all four stages pass|263.*Playwright|unified runner'` returns match
5. No active M013 requirements remain: `rg 'owner:M013' .gsd/REQUIREMENTS.md | rg 'Status: active'` returns no matches

**Expected outcome:** Both R007 and R109 show validated status with concrete S04 evidence; active requirement count is 0.

### TC-S04-09: Slice verification command succeeds (full closure)

**Given** all previous test cases have passed
**When** running the full slice verification command from the plan:
```bash
bash scripts/verify-m013-cleanup.sh && \
  test -s .tests/test-results/m013-cleanup/M013-cleanup-report.json && \
  rg -n '### R007|### R109|Status: validated|verify-m013-cleanup.sh' .gsd/REQUIREMENTS.md
```
**Then** the command must:

1. Exit with code 0 (no failures at any step)
2. Produce grep output showing:
   - R007 and R109 section headers
   - At least 4 lines containing "validated" (both R007 and R109 lines)
   - At least 2 lines containing "verify-m013-cleanup.sh" (evidence citations)

**Expected outcome:** Full closure command exits 0; requirements show validated with S04 evidence.

### TC-S04-10: Legacy surfaces are truly removed (negative test)

**Given** all slices have been applied
**When** searching the runtime source for legacy patterns
**Then** all legacy patterns must be absent:

1. No legacy uid mechanics:
   - `rg 'model\.uid|getUrls.*uid|uid.*navigation' site/js/` returns no matches
   - `rg 'localStorage.*uid[\"\'()]' site/js/` returns no matches (only key constant definitions allowed)

2. No legacy share surfaces:
   - `rg 'export.*string|import.*string|share.*link' site/js/` returns no matches
   - `rg 'shareModal|sharePlanner' site/js/` returns no matches

3. No feature-flag system:
   - `rg 'feature\.|showFeatureModal|featureModal' site/js/` returns no matches
   - `rg 'model-features' site/js/` returns no matches

4. No legacy URL-param bootstrap:
   - `rg 'getUrlParameters.*year|getUrlParameters.*lang' site/js/` returns no matches
   - `rg 'this.url.*year|this.url.*lang' site/js/` returns no matches

**Expected outcome:** All negative searches return zero matches, confirming legacy surfaces are removed.

## Edge Cases & Resilience Tests

### EC-S04-01: Verifier handles missing dependency scripts gracefully

**When** one of the three grep gate scripts is deleted
**And** `bash scripts/verify-m013-cleanup.sh` is run
**Then** the verifier must:
- Print "Required gate script not found: <path>"
- Create JSON report with `failedStage: "preflight"` and `overall: "fail"`
- Exit with code 1

### EC-S04-02: JSON report survives Playwright's test-results/ cleanup

**When** `bash scripts/verify-m013-cleanup.sh` is run
**Then** the report file must exist at `.tests/test-results/m013-cleanup/M013-cleanup-report.json` even though Playwright clears test-results/ during its run

### EC-S04-03: Multiple runs do not corrupt the report

**When** `bash scripts/verify-m013-cleanup.sh` is run twice in succession
**Then** each run must produce a valid report with the correct timestamp (second report timestamp > first report timestamp)

## Summary

All test cases must pass. The M013 legacy cleanup is considered complete when:
1. All four verification stages exit 0 (TC-S04-02)
2. The JSON report is valid and shows overall:pass (TC-S04-03)
3. All three grep gates confirm zero violations (TC-S04-04 through TC-S04-06)
4. Playwright tests pass at 263/272 (TC-S04-07)
5. Requirements R007 and R109 show validated status (TC-S04-08)
6. Full closure command exits 0 (TC-S04-09)
7. All legacy patterns are absent from runtime source (TC-S04-10)
