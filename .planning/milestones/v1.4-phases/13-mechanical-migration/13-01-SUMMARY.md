---
phase: 13-mechanical-migration
plan: "01"
subsystem: build/test-infra
tags: [bootstrap5, cdn, sri, playwright, migration]
dependency_graph:
  requires: []
  provides: [bs5-cdn-link, bs5-css-fixture, bs5-route-intercept, bs5-migration-spec]
  affects: [site/index.html, .compose/fragments/head.html, .tests/fixtures/cdn-routes.js, .tests/fixtures/bootstrap.min.css, .tests/e2e/bs5-migration.spec.js]
tech_stack:
  added: []
  patterns: [SRI-hash-verification, playwright-cdn-intercept, m4-compose-build]
key_files:
  created:
    - .tests/e2e/bs5-migration.spec.js
  modified:
    - site/index.html
    - .compose/fragments/head.html
    - .tests/fixtures/cdn-routes.js
    - .tests/fixtures/bootstrap.min.css
decisions:
  - "SRI hash sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB verified by computing SHA-384 of the downloaded file — matches plan spec exactly"
  - "Both site/index.html and .compose/fragments/head.html must be kept in sync; build.sh regenerates index.html from fragments"
metrics:
  duration: "~10 minutes"
  completed: "2026-04-14"
  tasks_completed: 3
  files_modified: 5
requirements_satisfied:
  - MIG-01
  - MIG-04
  - MIG-12
---

# Phase 13 Plan 01: Bootstrap 5.3.8 CDN Swap and Test Infrastructure Summary

One-liner: Swapped Bootstrap CDN from Stackpath 4.3.1 to jsDelivr 5.3.8 with verified SRI hash, updated Playwright fixture intercept to serve BS5 CSS offline, and created bs5-migration.spec.js test scaffold covering SRI (MIG-01), btn-close (MIG-04), and featureModal (MIG-12).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 0 | Create bs5-migration.spec.js test scaffold | 2587f01 | .tests/e2e/bs5-migration.spec.js |
| 1 | Swap CDN link to Bootstrap 5.3.8 and download BS5 fixture | 49ad77e | site/index.html, .tests/fixtures/bootstrap.min.css |
| 2 | Update Playwright cdn-routes.js to intercept BS5 CDN URL | 74c78ca | .tests/fixtures/cdn-routes.js |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated compose fragment head.html and rebuilt index.html**

- **Found during:** Task 2 verification (smoke test run)
- **Issue:** `compose.spec.js` COMP-02 test rebuilds `site/index.html` from `.compose/fragments/` via `build.sh` and asserts the result is identical to the committed file. The compose fragment `head.html` still had the BS4 CDN link, so `build.sh` was overwriting the BS5 link in `site/index.html` on every build.
- **Fix:** Updated `.compose/fragments/head.html` Bootstrap CSS link to BS5.3.8, then ran `bash .compose/build.sh` to regenerate `site/index.html` so both files are consistent.
- **Files modified:** `.compose/fragments/head.html`, `site/index.html`
- **Commit:** 574c2fa

## Verification Results

All plan verification criteria passed:

1. `grep "bootstrap@5.3.8" site/index.html` — matches BS5 CDN link with SRI hash
2. `grep "bootstrap@5.3.8" .tests/fixtures/cdn-routes.js` — matches BS5 intercept route
3. `grep -r "bootstrap/4.3.1" site/ .tests/fixtures/cdn-routes.js` — no matches (BS4 fully removed)
4. `test -f .tests/e2e/bs5-migration.spec.js` — file exists with 4 tests
5. `cd .tests && npx playwright test smoke/ --reporter=line` — 9/9 passed

## Known Stubs

Tests 3 and 4 in bs5-migration.spec.js (featureModal open/close — MIG-12) will fail until Plan 03 adds `showFeatureModal` state and `closeFeatureModal()` method to the Vue app. This is intentional per Wave 0 convention — test scaffold created before implementation.

## Self-Check: PASSED

All created files verified present on disk. All task commits verified in git log.
