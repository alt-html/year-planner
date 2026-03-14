# S02: Update E2E test infrastructure for localStorage

**Goal:** Update all E2E test infrastructure to work with localStorage instead of cookies. All 14 tests pass. Milestone complete.
**Demo:** `cd .tests && npx playwright test` — all 14 tests pass.

## Must-Haves

- globalSetup.js rewritten — no cookie modal click, use localStorage for state
- harness.spec.js — cookie consent modal test removed/replaced
- compose.spec.js — cookie.html reference updated
- CDN fixture — cookies-related entries cleaned up
- All 14 tests pass

## Proof Level

- This slice proves: final-assembly
- Real runtime required: yes
- Human/UAT required: no

## Tasks

- [x] **T01: Update test infrastructure** `est:15m`
  - Why: Tests depend on cookie consent flow that no longer exists
  - Files: `.tests/globalSetup.js`, `.tests/smoke/harness.spec.js`, `.tests/smoke/compose.spec.js`, `.tests/fixtures/cdn.js`
  - Do: globalSetup.js — remove cookie modal click, wait for data-app-ready, then save storageState (which now includes localStorage). harness.spec.js — replace cookieModal test with "no cookie modal exists" or "app auto-initialises". compose.spec.js — remove cookie.html from expected fragments list and modals.html check. cdn.js — remove lodash and superagent fixture routes (no longer needed).
  - Verify: All 14 tests pass
  - Done when: Full green test suite
