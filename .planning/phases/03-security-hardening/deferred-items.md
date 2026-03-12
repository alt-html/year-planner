# Deferred Items - Phase 03 Security Hardening

## Out-of-Scope Discoveries

### tooltip-xss.spec.js pre-existing failure
- **Discovered during:** 03-04 Task 2 verification
- **Issue:** e2e/tooltip-xss.spec.js fails because it uses `page.locator('textarea').first()` pattern which requires the modal to be open, but the test doesn't wait for `#entryModal.show` before filling. Same bug that sync-error.spec.js originally had.
- **Status:** Pre-existing failure (confirmed by stash test — failed before 03-04 changes)
- **Fix:** Apply same pattern fix as sync-error.spec.js: add `waitForSelector('#entryModal.show')` and use `#yp-entry-textarea` selector
- **Impact:** SEC-03 XSS test not currently running
