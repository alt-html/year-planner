---
phase: 17-github-oauth-client-flow
plan: "02"
subsystem: auth
tags: [github-oauth, e2e-tests, playwright, pkce, gho-requirements]
dependency_graph:
  requires: [17-01]
  provides: [GHO-01, GHO-02, GHO-03, GHO-04]
  affects: [.tests/e2e/auth-modal.spec.js]
tech_stack:
  added: []
  patterns: [playwright-exposeFunction-capture, route-mock-abort-navigation]
key_files:
  created: []
  modified:
    - .tests/e2e/auth-modal.spec.js
decisions:
  - "Used page.exposeFunction + localStorage.setItem override to capture oauth_intended_provider before navigation context is lost (GHO-02)"
  - "Replaced E2E-AUTH-02/03 (Apple/Microsoft click tests) with GHO-04 visibility-absence tests since buttons are now conditionally rendered"
metrics:
  duration: ~10 minutes
  completed: 2026-04-15
  tasks_completed: 1
  files_changed: 1
status: partial — awaiting checkpoint:human-verify (Task 2)
---

# Phase 17 Plan 02: E2E Tests & Human Verification Summary

**One-liner:** E2E test coverage added for all four GHO requirements; human end-to-end verification pending.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add E2E tests for GHO-01 through GHO-04 | 8453a8a | .tests/e2e/auth-modal.spec.js |

## What Was Built

### Task 1 — auth-modal.spec.js test updates

- **E2E-AUTH-01** (Google): retained unchanged.
- **E2E-AUTH-04** (GitHub button): new test — verifies GitHub sign-in button is visible, enabled, and initiates the `auth/github` BFF fetch.
- **GHO-02** (oauth_intended_provider write): new test — overrides `localStorage.setItem` via `page.exposeFunction` to capture the write before the navigation fires, confirming `'github'` is stored before the redirect.
- **GHO-04 x2** (Apple/Microsoft hidden): replaced old E2E-AUTH-02/03 click tests with absence tests (`toHaveCount(0)`) — buttons are now `v-if`-guarded and absent when clientId is empty.
- **GHO-03** (OAuth key cleanup): new test — seeds `oauth_intended_provider`, `oauth_state`, `oauth_code_verifier` into localStorage, navigates with `?token=fake-jwt-token`, verifies all three are removed and `auth_provider` is `'github'`.

All 6 auth-modal tests pass. Smoke suite 20/20 green.

## Tasks Pending (checkpoint)

| Task | Name | Type | Blocked by |
|------|------|------|-----------|
| 2 | Verify end-to-end GitHub OAuth sign-in against local jsmdma server | checkpoint:human-verify | Human tester |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] GHO-02 localStorage capture approach revised**
- **Found during:** Task 1 verification
- **Issue:** The plan's GHO-02 test read `localStorage.getItem('oauth_intended_provider')` after `waitForRequest('**/auth/github')`, but by that point the app had already set `window.location.href` causing navigation away — the page context was unloaded before the evaluate ran, returning null.
- **Fix:** Replaced with `page.exposeFunction('__captureLocalStorageSet', ...)` + `page.addInitScript` to intercept `localStorage.setItem` and tunnel the value back to the test runner synchronously before navigation.
- **Files modified:** `.tests/e2e/auth-modal.spec.js`
- **Commit:** 8453a8a

## Known Stubs

None — all test assertions target live behaviour driven by real authConfig values.

## Threat Flags

None — test mocks only; no new production security surface introduced.

## Self-Check: PASSED

- `.tests/e2e/auth-modal.spec.js` — exists, contains E2E-AUTH-04, GHO-02, GHO-03, GHO-04
- Commit 8453a8a present in git log
- Old E2E-AUTH-02 body (Apple click + modal close) — absent
- Old E2E-AUTH-03 body (Microsoft click + modal close) — absent
- `npx playwright test e2e/auth-modal.spec.js` — 6/6 passed
- `npx playwright test smoke/` — 20/20 passed
