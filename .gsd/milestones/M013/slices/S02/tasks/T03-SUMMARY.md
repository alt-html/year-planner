---
id: T03
parent: S02
milestone: M013
key_files:
  - scripts/verify-no-url-state-params.sh
  - .tests/smoke/dark-mode.spec.js
  - .tests/e2e/clean-url-navigation.spec.js
key_decisions:
  - Tests that previously seeded theme state via ?theme=dark/?theme=light URL params now use emulateMedia({ colorScheme }) + addInitScript prefs-clear to achieve a deterministic fresh-install system-follow baseline — this is the correct pattern for any future test that needs a known light/dark starting state without hard navigation.
  - The grep gate script targets only site/js runtime code, not .tests/ — test fixtures are allowed to reference theme/lang/year as strings in assertions; the gate is specifically guarding against URL-param reads in production code paths.
duration: 
verification_result: passed
completed_at: 2026-04-16T05:40:56.805Z
blocker_discovered: false
---

# T03: Rewrote URL-param-driven smoke and clean-url tests to use in-app setup, and added verify-no-url-state-params.sh grep gate; all 45 slice-verification tests pass

**Rewrote URL-param-driven smoke and clean-url tests to use in-app setup, and added verify-no-url-state-params.sh grep gate; all 45 slice-verification tests pass**

## What Happened

The auto-fix was triggered because `smoke/dark-mode.spec.js` (1 test) and `clean-url-navigation.spec.js` (2 tests) still used `?theme=dark` and `?theme=light` URL params as test setup. These params are now intentionally ignored (R103 / T01), so the tests that relied on them to drive the theme state were failing.

**Root cause analysis:**
- `smoke/dark-mode.spec.js:4` — navigated to `/?theme=dark`, expected dark theme, but the URL param is a no-op; actual theme defaulted to system-follow (light OS), so `data-bs-theme` attribute was absent.
- `clean-url-navigation.spec.js:19` — same problem: `/?theme=dark` → dark mode not applied → `toHaveAttribute('data-bs-theme','dark')` failed.
- `clean-url-navigation.spec.js:46` — navigated to `/?theme=dark` (ignored, so light), clicked toggle (now dark), but expected light → failed.

**Fixes applied:**
1. `smoke/dark-mode.spec.js` — all three tests rewritten to use `emulateMedia({ colorScheme: ... })` + `addInitScript()` prefs-clear to set a deterministic fresh-install system-follow state rather than URL params.
2. `clean-url-navigation.spec.js` — tests at lines 19 and 46 rewritten to use `vm.setTheme()` in-app calls; test at line 28 updated to use `emulateMedia` + prefs-clear for explicit light baseline before toggle.
3. `scripts/verify-no-url-state-params.sh` — new grep gate script that checks `site/js` runtime code for any use of `urlParam('year'/'lang'/'theme')`, `searchParams.get('year'/'lang'/'theme')`, or `url.parameters.year/lang/theme`. Exits 0 when clean, exits 1 with file:line matches on violation. OAuth params (token, code, state) and share params (name, share) are explicitly out of scope.

All three slice verification commands pass: grep gate exits 0, and the full 45-test Playwright suite passes deterministically.

## Verification

bash scripts/verify-no-url-state-params.sh → exit 0, "✅ No forbidden app-state query-param surfaces found in runtime code."

npm --prefix .tests run test -- --reporter=line e2e/system-follow-preferences.spec.js e2e/clean-url-navigation.spec.js smoke/dark-mode.spec.js e2e/planner-management.spec.js e2e/cross-profile-sync.spec.js e2e/sync-payload.spec.js e2e/tp-col-coercion.spec.js → 45 passed (0 failed), ~16s runtime.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash scripts/verify-no-url-state-params.sh` | 0 | ✅ pass | 120ms |
| 2 | `npm --prefix .tests run test -- --reporter=line e2e/system-follow-preferences.spec.js e2e/clean-url-navigation.spec.js smoke/dark-mode.spec.js e2e/planner-management.spec.js e2e/cross-profile-sync.spec.js e2e/sync-payload.spec.js e2e/tp-col-coercion.spec.js` | 0 | ✅ pass — 45 passed | 16500ms |

## Deviations

None. All fixes were within the scope of the task plan. The doDarkToggle test (line 28 of clean-url-navigation.spec.js) was also updated from URL-param setup to explicit in-app setup even though it was passing coincidentally, aligning it with the task-plan requirement to remove all query-param-driven setup from these files.

## Known Issues

none

## Files Created/Modified

- `scripts/verify-no-url-state-params.sh`
- `.tests/smoke/dark-mode.spec.js`
- `.tests/e2e/clean-url-navigation.spec.js`
