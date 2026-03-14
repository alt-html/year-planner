---
id: M003
provides:
  - All persistence migrated from cookies to localStorage
  - Cookie consent modal removed — app auto-initialises
  - '@alt-javascript/cookies' CDN dependency removed
  - LZString compression removed for local storage (kept for share URLs)
  - E2E test infrastructure updated for localStorage flow
key_decisions:
  - Raw JSON stored in localStorage (no LZString compression needed)
  - Auto-initialise on first visit (no consent gating)
  - addInitScript pattern for injecting localStorage in tests (vs addCookies)
patterns_established:
  - localStorage.setItem/getItem/removeItem for all persistence
  - initialised() check replaces cookiesAccepted() consent check
observability_surfaces:
  - 14 Playwright E2E tests
  - localStorage inspector in DevTools shows all planner data
requirement_outcomes:
  - id: STO-01
    from_status: active
    to_status: validated
    proof: All cookie operations replaced with localStorage, document.cookie empty
  - id: STO-04
    from_status: active
    to_status: validated
    proof: Cookie consent modal removed from HTML, no #cookieModal in DOM
  - id: STO-05
    from_status: active
    to_status: validated
    proof: '@alt-javascript/cookies' import and CDI registration removed
  - id: STO-02
    from_status: active
    to_status: deferred
    proof: Keys still numeric ('0', '1', uid-year+month) — terse meaningful keys deferred
  - id: STO-03
    from_status: active
    to_status: validated
    proof: LZString kept for share URLs (Storage.getExportString) and base64 import
duration: ~35m
verification_result: passed
completed_at: 2026-03-14
---

# M003: Storage Modernisation

**Migrated all persistence from cookies to localStorage, removed cookie consent modal, removed @alt-javascript/cookies CDN dependency — all 14 E2E tests pass**

## What Happened

M003 executed in 2 slices:

**S01 (Storage migration + modal removal):** Rewrote StorageLocal.js to use `localStorage.setItem/getItem/removeItem` instead of `cookies.setCookie/getCookie/deleteCookie`. Dropped LZString compression for local storage (raw JSON stored directly — no 4KB limit concern). Removed `cookies` constructor param from StorageLocal and StorageRemote. Removed `@alt-javascript/cookies` CDN import and CDI registration. Removed cookie consent modal from HTML. Updated lifecycle to auto-initialise on first visit. Added `getLocalStorageData()` for sync. Recomposed index.html (708 lines).

**S02 (Test infrastructure):** Rewrote globalSetup.js for localStorage flow. Updated sync-error test to inject session via `addInitScript` instead of `addCookies`. Updated harness test to verify no `#cookieModal` exists. Updated compose test for removed fragments. Cleaned up CDN fixture (removed lodash, superagent, squareup routes). All 14 tests pass.

## Cross-Slice Verification

| Success Criterion | Status | Evidence |
|---|---|---|
| No cookies set by application | ✅ | `document.cookie` empty on boot |
| Data persists via localStorage | ✅ | localStorage keys visible after boot |
| Share URL feature works | ✅ | LZString kept for export/import |
| Cookie consent modal removed | ✅ | `#cookieModal` count 0 in test |
| @alt-javascript/cookies removed | ✅ | No import in contexts.js |
| All 14 E2E tests pass | ✅ | 14 passed (11.8s) |

## Forward Intelligence

### What the next milestone should know
- localStorage uses the same numeric key scheme as cookies ('0' for identities, '1' for session, 'uid' for preferences, 'uid-yearM' for planner months)
- LZString CDN dependency still loaded — used for share URLs and base64 import
- `initialised()` returns true when `localStorage.getItem('0') !== null`
- The Cookies class is completely removed from the codebase — no fallback path

### What's fragile
- Test globalSetup relies on app auto-initialising and writing to localStorage during the initial page load. If lifecycle.refresh() changes, globalSetup might need updating.

### Authoritative diagnostics
- `cd .tests && npx playwright test` — 14 tests, ~12s
- `localStorage` in browser DevTools shows all planner data
