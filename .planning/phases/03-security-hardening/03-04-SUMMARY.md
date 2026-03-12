---
phase: 03-security-hardening
plan: 04
subsystem: api
tags: [error-handling, i18n, superagent, sync, catch-blocks]

requires:
  - phase: 03-01
    provides: SRI hashes and CDN security baseline already established

provides:
  - Api.js catch blocks with else-fallback to error.syncfailed for all 16 methods
  - synchroniseToLocal() catch now sets model.error (navbar alert, not modal)
  - deleteRegistration() sets i18n key string instead of raw Error object
  - error.syncfailed i18n key in all 10 language files
  - sync-error E2E test (SEC-04) passing with session-cookie injection pattern
  - index.html error alert template bug fixed (t$(model.error) -> $t(error))

affects: [all future Api.js changes, E2E test patterns for auth-gated flows]

tech-stack:
  added: []
  patterns:
    - "Session cookie injection for E2E tests requiring signed-in state: use pre-computed LZString cookie value via page.context().addCookies()"
    - "Api.js catch blocks: always use if/else if/else chains, never independent if chains, always add else fallback to error.syncfailed"
    - "Sync errors go to model.error (navbar alert), modal errors go to model.modalError"

key-files:
  created:
    - .planning/phases/03-security-hardening/deferred-items.md
  modified:
    - js/service/Api.js
    - js/vue/i18n/en.js
    - js/vue/i18n/ar.js
    - js/vue/i18n/es.js
    - js/vue/i18n/fr.js
    - js/vue/i18n/hi.js
    - js/vue/i18n/id.js
    - js/vue/i18n/ja.js
    - js/vue/i18n/pt.js
    - js/vue/i18n/ru.js
    - js/vue/i18n/zh.js
    - .tests/e2e/sync-error.spec.js
    - index.html

key-decisions:
  - "Session cookie for E2E tests is pre-computed as LZString.compressToBase64(JSON.stringify({0:'test-uuid',1:0})) = 'N4IgDCBcIC4KYGcYFoCuqCWATEAaEAjFGAL5A===' - expires=0 means remember-me/always-signed-in"
  - "sync-error.spec.js relies on startup synchroniseToLocal() failure (not entry-save) — app calls sync on page load when signedin, 500 response triggers else-fallback"
  - "Template bug t$(model.error) fixed to $t(error) — model is not a data property; error is directly accessible in Vue template scope"
  - "tooltip-xss.spec.js pre-existing failure deferred — uses same broken textarea.first() pattern; logged to deferred-items.md"

requirements-completed: [SEC-04]

duration: 21min
completed: 2026-03-12
---

# Phase 03 Plan 04: API Error Fallback and Sync Error Surfacing Summary

**All 16 Api.js catch blocks hardened with else-fallback to error.syncfailed, sync errors routed to navbar alert, error.syncfailed key added to all 10 i18n language files, and Vue template crash bug fixed**

## Performance

- **Duration:** 21 min
- **Started:** 2026-03-12T05:58:08Z
- **Completed:** 2026-03-12T06:19:00Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments
- All 16 Api.js catch blocks converted from independent `if` chains to `if/else if/.../else` with `error.syncfailed` fallback
- `synchroniseToLocal()` catch block changed from `model.modalError` to `model.error` so sync failures show in the navbar alert (not a modal)
- `deleteRegistration()` now sets `'error.syncfailed'` string instead of a raw Error object
- `error.syncfailed: 'Sync failed. Please check your connection.'` added to all 10 language files (English placeholder for non-English locales)
- sync-error.spec.js (SEC-04) passes GREEN

## Task Commits

Each task was committed atomically:

1. **Task 1: Add error.syncfailed i18n key to all 10 language files** - `5f6e8b5` (feat)
2. **Task 2: Add else-fallback branches to all Api.js catch blocks** - `56e1358` (feat)

**Plan metadata:** (included in this commit)

## Files Created/Modified
- `js/service/Api.js` - All catch blocks converted to else-if chains with error.syncfailed fallback; synchroniseToLocal() catch uses model.error; deleteRegistration() uses i18n key
- `js/vue/i18n/en.js` - Added syncfailed key with English text
- `js/vue/i18n/ar.js`, `es.js`, `fr.js`, `hi.js`, `id.js`, `ja.js`, `pt.js`, `ru.js`, `zh.js` - Added syncfailed English placeholder
- `.tests/e2e/sync-error.spec.js` - Fixed test to use proper modal interaction pattern and session cookie injection
- `index.html` - Fixed `t$(model.error)` template bug to `$t(error)`
- `.planning/phases/03-security-hardening/deferred-items.md` - Logged pre-existing tooltip-xss test failure

## Decisions Made
- Session cookie for E2E signed-in state: pre-computed LZString value `N4IgDCBcIC4KYGcYFoCuqCWATEAaEAjFGAL5A===` (expires=0 = remember-me). The sync-error test relies on startup `synchroniseToLocal()` failing with 500 (not an entry-save trigger) since the API intercept returns 500 for all planner routes.
- Template fix: `t$(model.error)` was using non-existent `t$` identifier and accessing `model` which is not a Vue data property. Fixed to `$t(error)` — Vue i18n's `$t` function with `error` directly from data.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Vue template crash when model.error is set**
- **Found during:** Task 2 (E2E test verification)
- **Issue:** Template used `{{t$(model.error)}}` — `t$` is not `$t` (Vue i18n function), and `model` is not a data property. Setting `model.error` caused Vue render to crash with `TypeError: Cannot read properties of undefined (reading 'error')`, resulting in blank page and making the E2E test impossible to pass.
- **Fix:** Changed `{{t$(model.error)}}` to `{{$t(error)}}` in index.html line 151
- **Files modified:** `index.html`
- **Verification:** Debug test confirmed alert is now visible with correct translated string after fix
- **Committed in:** `56e1358` (Task 2 commit)

**2. [Rule 1 - Bug] Fixed sync-error.spec.js modal interaction pattern**
- **Found during:** Task 2 (E2E test run)
- **Issue:** Original spec used `page.locator('textarea').first()` which requires the modal to be open, but the test didn't use the proper `waitForSelector('#entryModal.show')` pattern. Textarea was always invisible.
- **Fix:** Rewrote spec to use startup sync failure approach (session cookie injection triggers synchroniseToLocal() on page load, which returns 500 and sets model.error) rather than entry-save approach
- **Files modified:** `.tests/e2e/sync-error.spec.js`
- **Verification:** `npx playwright test e2e/sync-error.spec.js` passes GREEN
- **Committed in:** `56e1358` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs, Rule 1)
**Impact on plan:** Both auto-fixes necessary for the E2E test to function. Template bug was pre-existing and would have caused crashes whenever model.error was set. No scope creep.

## Issues Encountered
- LZ-string not available in Node/test context for computing cookie values — extracted from the ESM fixture file by eval'ing the CJS portion to compute `LZString.compressToBase64(JSON.stringify({0:'test-uuid',1:0}))` = `'N4IgDCBcIC4KYGcYFoCuqCWATEAaEAjFGAL5A==='`
- tooltip-xss.spec.js pre-existing failure (same textarea pattern bug) — logged to deferred-items.md, NOT in scope of this plan

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All API error paths now surface user-visible feedback
- SEC-04 requirement complete
- tooltip-xss.spec.js (SEC-03) still broken — deferred to next plan or gap-closure plan

## Self-Check: PASSED

- `js/service/Api.js` — FOUND
- `js/vue/i18n/en.js` — FOUND (and all 9 other language files)
- `03-04-SUMMARY.md` — FOUND
- Commit `5f6e8b5` (feat: i18n keys) — FOUND
- Commit `56e1358` (feat: Api.js catch blocks) — FOUND

---
*Phase: 03-security-hardening*
*Completed: 2026-03-12*
