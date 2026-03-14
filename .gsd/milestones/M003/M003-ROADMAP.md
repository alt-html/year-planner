# M003: Storage Modernisation

**Vision:** Replace cookie-based persistence with localStorage, remove cookie consent modal, and simplify the first-run experience. No cookies set by the application at any point.

## Success Criteria

- No cookies are set by the application at any point
- All planner data persists across page reloads via localStorage
- Share URL feature still works (LZString compression intact)
- Cookie consent modal is completely removed from HTML and JS
- `@alt-javascript/cookies` CDN dependency is removed
- All E2E tests pass (updated for localStorage)

## Key Risks / Unknowns

- Test infrastructure coupling — globalSetup.js, harness test, and compose test all reference cookie consent flow. Must update simultaneously.
- CDI constructor param removal — StorageLocal and StorageRemote constructors receive `cookies` param via CDI autowiring. Removing it changes the wiring signature.

## Proof Strategy

- Test infrastructure coupling → retire in S02 by updating all test files and running 14 tests
- CDI constructor param removal → retire in S01 by removing Cookies from CDI and updating constructors

## Verification Classes

- Contract verification: 14 Playwright E2E tests
- Integration verification: App boots, creates entries, reloads, data persists
- Operational verification: none (no server-side)
- UAT / human verification: none

## Milestone Definition of Done

This milestone is complete only when all are true:

- StorageLocal.js and StorageRemote.js use localStorage instead of cookies
- @alt-javascript/cookies CDN import and CDI registration removed
- Cookie consent modal HTML and JS removed
- index.html recomposed
- All E2E tests pass (updated for localStorage flow)
- App boots with no console errors
- Share URL export/import still works with LZString

## Requirement Coverage

- Covers: STO-01, STO-04, STO-05
- Partially covers: STO-02 (terse keys improvement deferred — current keys work)
- Leaves for later: STO-03 (LZString kept as-is, already working)
- Orphan risks: none

## Slices

- [x] **S01: Replace cookies with localStorage and remove consent modal** `risk:medium` `depends:[]`
  > After this: App boots without cookie consent modal, all data persisted in localStorage. Manual browser verification confirms no cookies set.
- [x] **S02: Update E2E test infrastructure for localStorage** `risk:low` `depends:[S01]`
  > After this: All 14 E2E tests pass with localStorage-based flow. Milestone complete.

## Boundary Map

### S01 → S02

Produces:
- StorageLocal.js using `localStorage.setItem/getItem/removeItem` instead of `cookies.setCookie/getCookie/deleteCookie`
- StorageRemote.js using localStorage instead of cookies
- No cookie consent modal in HTML
- `cookiesAccepted()` removed or replaced with localStorage existence check
- `Cookies` class removed from CDI contexts.js

Consumes:
- nothing (first slice)
