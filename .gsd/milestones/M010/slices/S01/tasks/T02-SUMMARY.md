---
id: T02
parent: S01
milestone: M010
provides: []
requires: []
affects: []
key_files: [".compose/build.sh", ".tests/playwright.config.js", ".tests/smoke/compose.spec.js", ".docker/Dockerfile-nginx-16-alpine", "AGENTS.md"]
key_decisions: ["Playwright compose smoke test path updated from ROOT/index.html to ROOT/site/index.html"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: ".compose/build.sh ran and confirmed site/index.html written. grep confirmed site/ in each changed file."
completed_at: 2026-04-02T22:49:31.895Z
blocker_discovered: false
---

# T02: Updated .compose/build.sh, playwright.config.js, Dockerfile, AGENTS.md, and compose.spec.js to target site/

> Updated .compose/build.sh, playwright.config.js, Dockerfile, AGENTS.md, and compose.spec.js to target site/

## What Happened
---
id: T02
parent: S01
milestone: M010
key_files:
  - .compose/build.sh
  - .tests/playwright.config.js
  - .tests/smoke/compose.spec.js
  - .docker/Dockerfile-nginx-16-alpine
  - AGENTS.md
key_decisions:
  - Playwright compose smoke test path updated from ROOT/index.html to ROOT/site/index.html
duration: ""
verification_result: passed
completed_at: 2026-04-02T22:49:31.895Z
blocker_discovered: false
---

# T02: Updated .compose/build.sh, playwright.config.js, Dockerfile, AGENTS.md, and compose.spec.js to target site/

**Updated .compose/build.sh, playwright.config.js, Dockerfile, AGENTS.md, and compose.spec.js to target site/**

## What Happened

Updated four tooling files to point at site/: build.sh output target, playwright.config.js webServer root, Dockerfile COPY source, AGENTS.md dev server command. Also updated .tests/smoke/compose.spec.js which read ROOT/index.html directly (not caught in the initial tooling scan). Ran build.sh to confirm site/index.html is produced cleanly.

## Verification

.compose/build.sh ran and confirmed site/index.html written. grep confirmed site/ in each changed file.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `.compose/build.sh` | 0 | ✅ pass — site/index.html composed (1135 lines) | 200ms |
| 2 | `grep 'site/' .compose/build.sh && grep 'site' .tests/playwright.config.js && grep 'site/' .docker/Dockerfile-nginx-16-alpine` | 0 | ✅ pass | 30ms |


## Deviations

compose.spec.js also referenced root index.html and needed updating — was caught and fixed before verification.

## Known Issues

None.

## Files Created/Modified

- `.compose/build.sh`
- `.tests/playwright.config.js`
- `.tests/smoke/compose.spec.js`
- `.docker/Dockerfile-nginx-16-alpine`
- `AGENTS.md`


## Deviations
compose.spec.js also referenced root index.html and needed updating — was caught and fixed before verification.

## Known Issues
None.
