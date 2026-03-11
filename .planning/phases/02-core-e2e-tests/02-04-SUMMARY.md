---
phase: 02-core-e2e-tests
plan: "04"
subsystem: infra
tags: [github-actions, playwright, ci, http-server, e2e]

requires:
  - phase: 02-core-e2e-tests
    provides: "CDN fixture files (.tests/fixtures/), playwright.config.js with http-server webServer, and E2E test specs"

provides:
  - GitHub Actions workflow (.github/workflows/e2e.yml) that runs full Playwright E2E suite on push and pull_request
  - http-server devDependency added to .tests/package.json so npm ci installs the webServer dependency

affects: [03-security-hardening, 04-vue-composition]

tech-stack:
  added: [github-actions, http-server@14.1.1]
  patterns: [ci-runs-playwright-via-http-server, cdn-fixtures-served-via-page-route]

key-files:
  created:
    - .github/workflows/e2e.yml
  modified:
    - .tests/package.json
    - .tests/package-lock.json

key-decisions:
  - "http-server (not Docker) used as CI webServer — playwright.config.js already configured it, keeping CI simple"
  - "No caching in workflow — correctness-first approach; caching can be added later if CI runtime becomes a concern"
  - "http-server added to .tests/package.json devDependencies so npm ci installs it (was missing, would fail CI)"

patterns-established:
  - "CI pattern: npm ci in .tests/ then playwright install --with-deps chromium then playwright test --reporter=line"
  - "working-directory: .tests on all npm/playwright steps avoids cd prefix noise in YAML"

requirements-completed: [E2E-01, E2E-02, E2E-03]

duration: 3min
completed: 2026-03-11
---

# Phase 2 Plan 4: GitHub Actions CI Workflow Summary

**GitHub Actions E2E workflow using http-server + CDN page.route() fixtures, triggering full Playwright suite on every push and pull_request**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-11T23:48:52Z
- **Completed:** 2026-03-11T23:49:43Z
- **Tasks:** 1
- **Files modified:** 3

## Accomplishments

- Created `.github/workflows/e2e.yml` — CI triggers on push and pull_request, runs the full Playwright suite
- Playwright installs Chromium + OS-level deps via `--with-deps`, ensuring Ubuntu runner compatibility
- http-server starts automatically via playwright.config.js `webServer` block — no separate server step needed
- CDN fixtures committed to `.tests/fixtures/` are intercepted at test runtime via `page.route()` — no live CDN access
- Added `http-server` to `.tests/package.json` devDependencies (was missing — would have caused CI failure)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create GitHub Actions E2E workflow** - `ac6fc86` (feat)

**Plan metadata:** (pending final commit)

## Files Created/Modified

- `.github/workflows/e2e.yml` — GitHub Actions workflow: push/PR triggers, Node 20, npm ci, chromium install, playwright test
- `.tests/package.json` — added `http-server@^14.1.1` to devDependencies
- `.tests/package-lock.json` — updated to include http-server and its dependency tree

## Decisions Made

- Used `http-server` (not Docker) as the CI server — playwright.config.js already configured it via webServer, keeping the workflow minimal
- No caching added — correctness first; caching can be added later if CI runtime becomes a concern
- `working-directory: .tests` on all steps instead of `cd .tests &&` prefix — cleaner YAML per plan spec

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added http-server to package.json devDependencies**
- **Found during:** Task 1 (Create GitHub Actions E2E workflow)
- **Issue:** playwright.config.js webServer uses `npx http-server`, but http-server was not listed in `.tests/package.json` devDependencies. `npm ci` in CI would not install it, causing the webServer to fail to start and all tests to fail.
- **Fix:** Added `"http-server": "^14.1.1"` to devDependencies and ran `npm install` to update package-lock.json
- **Files modified:** `.tests/package.json`, `.tests/package-lock.json`
- **Verification:** `npm ci` in .tests/ installs http-server; `node_modules/.bin/http-server` will be available at test time
- **Committed in:** `ac6fc86` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical dependency)
**Impact on plan:** Essential fix — workflow would have silently failed without this. No scope creep.

## Issues Encountered

None — workflow structure was straightforward given existing playwright.config.js and fixture infrastructure.

## User Setup Required

None — no external service configuration required. GitHub Actions runs automatically once the workflow file is pushed.

## Next Phase Readiness

- Full CI pipeline is now active: all E2E tests run automatically on every push and PR
- Phase 3 (Security Hardening: polyfill.io removal + SRI hashes) can proceed with confidence that E2E coverage will catch regressions
- CDN fixture maintenance note: if new CDN dependencies are added in future phases, fixture files must be committed to `.tests/fixtures/` for CI compatibility

---
*Phase: 02-core-e2e-tests*
*Completed: 2026-03-11*
