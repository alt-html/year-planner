---
id: S02
parent: M003
milestone: M003
provides:
  - globalSetup.js rewritten for localStorage (no cookie modal click)
  - harness.spec.js updated to verify no cookie modal exists
  - compose.spec.js updated to remove cookie.html from expected fragments
  - sync-error.spec.js updated to inject session via localStorage instead of cookies
  - CDN fixture cleaned up (removed lodash, superagent, squareup routes)
  - All 14 E2E tests pass
affects: []
key_files:
  - .tests/globalSetup.js
  - .tests/smoke/harness.spec.js
  - .tests/smoke/compose.spec.js
  - .tests/e2e/sync-error.spec.js
  - .tests/fixtures/cdn.js
key_decisions:
  - sync-error test uses addInitScript to inject localStorage before page load
  - CDN fixture trimmed to only actively-used CDN dependencies
duration: 15m
verification_result: passed
completed_at: 2026-03-14
---

# S02: Update E2E test infrastructure for localStorage

**All 14 E2E tests pass with localStorage-based flow — M003 milestone complete**

## What Happened

Rewrote globalSetup.js: removed cookie modal click, waits for `localStorage.getItem('0') !== null` instead of `document.cookie.includes('0=')`. Updated harness test to verify `#cookieModal` has count 0 (element doesn't exist) instead of checking not visible. Updated compose test to remove cookie.html and pay.html from expected fragments. Updated sync-error test to inject session via `page.addInitScript` setting localStorage instead of `addCookies`. Cleaned up CDN fixture by removing lodash, superagent, and squareup routes that are no longer needed.

## Verification

- All 14 Playwright E2E tests pass (10.5s, 11.8s on two consecutive runs)
