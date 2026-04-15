---
phase: 18-auth-module-extraction
plan: "02"
subsystem: auth
tags: [auth, cdi, module-extraction, refactor]
dependency_graph:
  requires: [site/js/auth/AuthService.js, site/js/auth/OAuthClient.js, site/js/auth/auth-config.js]
  provides: [site/js/config/contexts.js (updated CDI wiring)]
  affects: [site/js/config/contexts.js]
tech_stack:
  added: []
  patterns: [CDI singleton swap, import graph cleanup]
key_files:
  created: []
  modified:
    - site/js/config/contexts.js
  deleted:
    - site/js/service/AuthProvider.js
    - site/js/config/auth-config.js
decisions:
  - Import AuthService from ../auth/AuthService.js in contexts.js — old AuthProvider path removed
  - Deleted site/js/service/AuthProvider.js (all functionality in site/js/auth/ module)
  - Deleted site/js/config/auth-config.js (config now at site/js/auth/auth-config.js)
metrics:
  duration: ~10 minutes
  completed: "2026-04-15"
  tasks_completed: 1
  tasks_checkpoint: 1
  files_modified: 1
  files_deleted: 2
---

# Phase 18 Plan 02: CDI Swap — Auth Module Go-Live Summary

**One-liner:** Rewired CDI to import AuthService from site/js/auth/ and deleted old AuthProvider.js and config/auth-config.js, completing auth module extraction — full E2E suite 50 passed, 0 failed.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | CDI swap — rewire contexts.js, delete old files (AUT-04) | db0d62d | site/js/config/contexts.js (modified), site/js/service/AuthProvider.js (deleted), site/js/config/auth-config.js (deleted) |

## Tasks at Checkpoint

| Task | Name | Status |
|------|------|--------|
| 2 | Verify auth module extraction end-to-end | Awaiting human-verify |

## What Was Built

### Task 1 — CDI swap (AUT-04)

Single edit to `site/js/config/contexts.js`:
- Import changed from `import AuthProvider from '../service/AuthProvider.js'` to `import AuthService from '../auth/AuthService.js'`
- Singleton registration changed from `new Singleton(AuthProvider)` to `new Singleton(AuthService)`

Old files deleted:
- `site/js/service/AuthProvider.js` — 200-line monolithic provider, superseded by the new auth/ module
- `site/js/config/auth-config.js` — old config location, superseded by `site/js/auth/auth-config.js`

Dangling import checks:
- `grep -r "service/AuthProvider" site/js/` — no matches
- `grep -r "config/auth-config" site/js/` — no matches

No other files required modification — CDI resolves `Api.js` and `Application.js` `authProvider` params via the `@alt-html/year-planner/AuthProvider` qualifier set inside `AuthService.constructor`.

## Automated E2E Results (Task 2 pre-run)

```
Running 54 tests using 5 workers
  4 skipped  (contract tests — require live backend, GITHUB_CLIENT_ID/SECRET env vars)
  50 passed  (11.6s)
  0 failed
```

Tests covered: boot, auth-modal, signout-wipe, signin-pester, entry-crud, planner-management, rail-toggle, sync-payload, hlc-write, migration, bs5-migration, tooltip-xss, tp-col-coercion, cross-profile-sync, sync-error, smoke suite (compose, css-generalisation, dark-mode, harness).

## Checkpoint: Task 2 — Human Verification Required

**Status:** Awaiting human-verify gate

**What was built:** Complete auth module extraction — `site/js/auth/` module is live via CDI. Old `AuthProvider.js` and `config/auth-config.js` deleted.

**Automated verification:** PASSED — 50/54 tests pass (4 skipped — contract tests need live backend)

**Human verification steps:**
1. Start local dev server and open the app in browser
2. Verify the auth modal appears with Google and GitHub buttons (Apple/Microsoft hidden)
3. If possible: sign in with GitHub, verify sign-in works
4. Sign out — verify planner data is still visible (not wiped)
5. Check browser console for errors — no CDI wiring failures

**Resume signal:** Type "approved" or describe any issues found

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Single-line edit to contexts.js | Only the import path and class name changed — all other CDI registrations unchanged |
| No modification to Api.js or Application.js | CDI qualifier match handles injection automatically |
| Deleted both old files atomically in same commit | Avoids transient state with dangling imports |

## Deviations from Plan

None — plan executed exactly as written. The automated verification command in the plan referenced the main repo path (`/Users/craig/src/github/alt-html/year-planner`) rather than the worktree path — verification was run against the correct worktree path instead.

## Known Stubs

None — contexts.js is fully wired to the new auth module. No placeholder data.

## Threat Surface Scan

T-18-04 mitigated: `AuthService.qualifier = '@alt-html/year-planner/AuthProvider'` confirmed present — CDI resolves authProvider params in Api.js and Application.js correctly (50 E2E tests pass including boot and auth-modal).

T-18-05 mitigated: grep confirms no remaining imports to `service/AuthProvider` — deleted file has no dangling references.

T-18-06 mitigated: grep confirms no remaining imports to `config/auth-config` — deleted file has no dangling references. AuthService imports from `./auth-config.js` (same folder).

No new unplanned threat surface introduced.

## Self-Check

### Files Modified/Deleted

- [x] site/js/config/contexts.js — FOUND, contains `import AuthService from '../auth/AuthService.js'`
- [x] site/js/service/AuthProvider.js — DELETED (confirmed not found)
- [x] site/js/config/auth-config.js — DELETED (confirmed not found)

### Commits

- [x] db0d62d — feat(18-02): CDI swap — import AuthService, delete old AuthProvider.js and config/auth-config.js

## Self-Check: PASSED
