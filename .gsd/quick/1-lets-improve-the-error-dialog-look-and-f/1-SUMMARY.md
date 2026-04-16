# Quick Task: lets improve the error dialog look and feel, its justr an ugly red box, surely there is a nicer option in Bootstrap 5 or just vanilla css

**Date:** 2026-04-16
**Branch:** main

## What Changed
- Reworked the global sync/error alert and auth-modal error alert markup to use a richer, structured alert layout (icon + body + close) while keeping Bootstrap `alert alert-danger` semantics.
- Added a new reusable `.yp-error-alert` style in `site/css/main.css` using Bootstrap 5.3 danger subtle tokens (`--bs-danger-bg-subtle`, `--bs-danger-border-subtle`, `--bs-danger-text-emphasis`) plus rounded corners, left accent border, and softer shadow.
- Improved alert accessibility and UX with `aria-live="polite"`, tighter spacing, and consistent close-button behavior.
- Re-composed `site/index.html` from compose fragments.
- Extended E2E sync-error test to assert the new `.yp-error-alert` class is rendered when an error occurs.

## Files Modified
- `.compose/fragments/grid.html`
- `.compose/fragments/modals/auth.html`
- `site/css/main.css`
- `site/index.html`
- `.tests/e2e/sync-error.spec.js`

## Verification
- `bash .compose/build.sh`
- `npm --prefix .tests run test -- --reporter=line e2e/sync-error.spec.js`
- `npm --prefix .tests run test -- --reporter=line smoke/compose.spec.js`
- Result: all executed tests passed.
