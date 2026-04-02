---
id: S01
parent: M010
milestone: M010
provides:
  - site/ as the canonical web root for all serving contexts
requires:
  []
affects:
  []
key_files:
  - site/
  - .compose/build.sh
  - .tests/playwright.config.js
  - .tests/smoke/compose.spec.js
  - .docker/Dockerfile-nginx-16-alpine
  - AGENTS.md
key_decisions:
  - git mv used throughout so git tracks renames cleanly
  - compose.spec.js path fix included in T02 scope after discovery
patterns_established:
  - Web assets live under site/ — serve site/ as the document root in all contexts (local dev, Docker, CI)
observability_surfaces:
  - none
drill_down_paths:
  - .gsd/milestones/M010/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M010/slices/S01/tasks/T02-SUMMARY.md
  - .gsd/milestones/M010/slices/S01/tasks/T03-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-04-02T22:50:00.266Z
blocker_discovered: false
---

# S01: Move assets to site/ and update tooling

**All web assets relocated to site/, build pipeline and test harness updated, 16/16 E2E tests green**

## What Happened

Moved all web-serving assets (index.html, css/, js/, manifest.json, 6 icon/favicon files) into site/ using git mv. Updated four tooling files and one smoke test that had hardcoded root paths. All 16 Playwright tests pass. Project root is now tooling/config only.

## Verification

16/16 Playwright tests pass. .compose/build.sh writes site/index.html. No web-serving files at root.

## Requirements Advanced

- COMP-03 — Project root is now tooling/config only; all web assets are in site/

## Requirements Validated

- COMP-02 — compose.spec.js idempotency test passes against site/index.html
- TEST-02 — Playwright webServer boots from site/, all 16 tests pass

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

.tests/smoke/compose.spec.js had a hardcoded path to ROOT/index.html that wasn't caught in the initial tooling scan — fixed as part of T02.

## Known Limitations

None.

## Follow-ups

None.

## Files Created/Modified

- `site/` — All web assets moved here via git mv
- `.compose/build.sh` — Output target changed from index.html to site/index.html
- `.tests/playwright.config.js` — webServer root changed from .. to ../site
- `.tests/smoke/compose.spec.js` — Compose smoke test path updated from ROOT/index.html to ROOT/site/index.html
- `.docker/Dockerfile-nginx-16-alpine` — COPY source changed from . to site/
- `AGENTS.md` — Dev server command updated to serve ../site
