---
id: T02
parent: S04
milestone: M013
key_files:
  - site/index.html
  - .compose/fragments/rail.html
  - .compose/fragments/nav.html
  - .compose/fragments/footer.html
  - scripts/verify-m013-cleanup.sh
  - .gsd/REQUIREMENTS.md
key_decisions:
  - Converted 11 legacy URL-param nav links to in-app Vue method calls (setTheme/jumpToYear/setLang) rather than using href anchors, keeping URL clean and consistent with post-M013 architecture.
  - Added mkdir -p inside write_report() rather than only at script top, because Playwright clears test-results/ mid-run — this ensures the report is always written regardless of run ordering.
duration: 
verification_result: passed
completed_at: 2026-04-16T06:50:03.955Z
blocker_discovered: false
---

# T02: Fixed 11 legacy uid/?id= navigation surfaces in site/index.html and compose fragments, ran integrated M013 gate to exit 0 (263/272 tests pass), and closed R007/R109 with concrete S04 evidence.

**Fixed 11 legacy uid/?id= navigation surfaces in site/index.html and compose fragments, ran integrated M013 gate to exit 0 (263/272 tests pass), and closed R007/R109 with concrete S04 evidence.**

## What Happened

T01 had noted that three legacy grep gates would fail on pre-existing violations in site/index.html — 2 theme flyout links (lines 338–339) using ?uid= hrefs, 2 year-navigation chevron links (lines 393, 395) using ?uid= hrefs, and 10 language-dropdown items (lines 574–583) using ?id= hrefs. These 14 URL-param-based navigation attributes were the sole remaining blocker for the unified gate.

All 11 `<a>` elements (2 theme + 2 year-nav + 10 lang) were converted from `v-bind:href` URL navigation to in-app Vue method calls:
- Theme links → `href="#" v-on:click.prevent="setTheme('light'/'dark'); toggleFlyout(null)"`
- Year chevrons → `href="#" v-on:click.prevent="jumpToYear(year±1)"`
- Language items → `href="#" v-on:click.prevent="setLang('XX')"`

The same patterns existed in the three compose source fragments (`.compose/fragments/rail.html`, `nav.html`, `footer.html`) and were updated identically. `m4 -P .compose/index.html.m4` was re-run to regenerate site/index.html from the updated fragments, keeping the compose contract clean (compose.spec.js COMP-02 passes).

A secondary issue was discovered: `write_report()` in scripts/verify-m013-cleanup.sh wrote the JSON report with `> "$REPORT"`, but Playwright's test runner clears the `test-results/` directory during execution, removing the pre-created `m013-cleanup/` subdirectory. Fixed by adding `mkdir -p "$REPORT_DIR"` inside `write_report()` so it re-creates the directory before writing, making the report write robust regardless of when in the run lifecycle it is called.

After both fixes, `bash scripts/verify-m013-cleanup.sh` exits 0 with all four stages passing (verify-no-legacy-uid, verify-no-url-state-params, verify-no-legacy-share-features, playwright-smoke-e2e — 263 tests pass, 9 skipped). The JSON report is written at `.tests/test-results/m013-cleanup/M013-cleanup-report.json` with `overall:pass` and `failedStage:null`.

R007 was updated from `active` to `validated` with evidence citing the unified gate exit 0 and the report artifact. R109 validation text was refreshed to cite the final S04 integrated proof (three grep gates + 263/272 Playwright tests + unified runner artifact). Active requirements count is now 0 — all M013 requirement debt is closed.

## Verification

Ran `bash scripts/verify-m013-cleanup.sh` — exit 0, all four stages passed. Confirmed `test -s .tests/test-results/m013-cleanup/M013-cleanup-report.json` is non-empty and valid JSON with `overall:pass`. Ran slice verification command verbatim: `bash scripts/verify-m013-cleanup.sh && test -s .tests/test-results/m013-cleanup/M013-cleanup-report.json && rg -n '### R007|### R109|Status: validated|verify-m013-cleanup.sh' .gsd/REQUIREMENTS.md` — exit 0, both requirements show `validated` status with `verify-m013-cleanup.sh` cited. Confirmed `Active requirements: 0` in REQUIREMENTS.md coverage summary.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash scripts/verify-no-legacy-uid.sh` | 0 | ✅ pass | 200ms |
| 2 | `bash scripts/verify-no-url-state-params.sh` | 0 | ✅ pass | 150ms |
| 3 | `bash scripts/verify-no-legacy-share-features.sh` | 0 | ✅ pass | 100ms |
| 4 | `bash scripts/verify-m013-cleanup.sh (all 4 stages)` | 0 | ✅ pass | 24000ms |
| 5 | `test -s .tests/test-results/m013-cleanup/M013-cleanup-report.json` | 0 | ✅ pass | 10ms |
| 6 | `rg -n '### R007|### R109|Status: validated|verify-m013-cleanup.sh' .gsd/REQUIREMENTS.md` | 0 | ✅ pass | 50ms |

## Deviations

Added `mkdir -p \"$REPORT_DIR\"` inside `write_report()` in verify-m013-cleanup.sh (the plan did not mention this fix). Required because Playwright's test runner deletes the test-results/ directory at startup, which removes the pre-created output directory. Also updated .compose fragments alongside site/index.html — the plan referenced only site/index.html but the compose contract (COMP-02) requires fragments and composed output to stay in sync.

## Known Issues

none

## Files Created/Modified

- `site/index.html`
- `.compose/fragments/rail.html`
- `.compose/fragments/nav.html`
- `.compose/fragments/footer.html`
- `scripts/verify-m013-cleanup.sh`
- `.gsd/REQUIREMENTS.md`
