# S02: StorageLocal HLC write wiring — UAT

**Milestone:** M011
**Written:** 2026-04-09T20:14:41.485Z

# S02: StorageLocal HLC write wiring — UAT

**Milestone:** M011
**Written:** 2026-04-10

## UAT Type

- UAT mode: artifact-driven (Playwright E2E)
- Why this mode is sufficient: The core observable output is a localStorage write (`rev:{uuid}` key populated with HLC strings). Playwright's `page.evaluate()` can read localStorage directly and assert the exact shape — no manual inspection needed.

## Preconditions

1. Dev server running: `cd .tests && npx http-server ../site -p 8080 -c-1`
2. Test deps installed: `cd .tests && npm install && npx playwright install`

## Smoke Test

Run the new HLC write test in isolation:
```
cd .tests && npx playwright test e2e/hlc-write.spec.js --reporter=line --workers=1
```
Expected: 1 test passes.

## Test Cases

### 1. HLC dot-path entries written to rev:{uuid} after day edit (SYNC-04)

1. Start from clean localStorage (test handles this via addInitScript).
2. Navigate to `/?uid=12345&year=2026`.
3. Wait for `[data-app-ready]`.
4. Click January day 1 cell.
5. Wait for `#entryModal.show`.
6. Fill `#yp-entry-textarea` with 'HLC test entry'.
7. Click `.yp-action-save`.
8. Wait for modal to disappear.
9. Read localStorage via `page.evaluate()` — find any `rev:*` key.
10. **Expected:** `rev:{uuid}` key exists; it contains at least one key matching `days.YYYY-MM-DD.{field}` pattern; all values are non-empty strings (HLC stamps).

### 2. All 18 tests pass (regression)

1. `cd .tests && npx playwright test --reporter=line --workers=1`
2. **Expected:** 18 passed, 0 failed.

### 3. markEdited fires unconditionally (not gated on sign-in)

1. Run `hlc-write.spec.js` (no session token is set — user is not signed in).
2. **Expected:** `rev:{uuid}` is still populated. (HLC tracking must occur on every edit, even offline/unsigned.)

### 4. All 5 fields tracked per edit

1. After saving any day entry, inspect `rev:{uuid}` in browser DevTools → Application → Local Storage.
2. **Expected:** Five keys for the edited date: `days.YYYY-MM-DD.tp`, `.tl`, `.col`, `.notes`, `.emoji` — each with a non-empty HLC string.

## Edge Cases

### rev:{uuid} key absent — planner not created

If `rev:{uuid}` is not found at all, the planner document was not created (initialise() skipped due to `dev` key in localStorage). 
- **Expected:** Any test that clears localStorage first (addInitScript pattern) will trigger initialise() and create the planner.

### Parallel test run flakiness (tooltip-xss)

`tooltip-xss.spec.js` is known to be flaky in parallel mode due to localStorage state pollution from other tests.
- **Expected:** Passes when run with `--workers=1`. Not related to S02 changes.

## Failure Signals

- `rev:*` key absent from localStorage → markEdited was skipped (likely plannerId null — check addInitScript clears localStorage).
- `rev:*` key present but empty `{}` → guard `if (plannerId && this.syncClient)` blocked — plannerId returned null.
- Dot-path keys present but values are empty strings → HLC tick returned empty (check SyncClient.markEdited implementation).
- Any of the 17 pre-existing tests fail → regression in entries.js edit (check updateEntry signature hasn't changed).

## Not Proven By This UAT

- That HLC stamps are monotonically increasing across multiple rapid offline edits to the same field (SyncClient unit test concern).
- That `fieldRevs` in sync payloads are populated with the real per-field stamps (wired through Api.sync — will be visible once a live server is configured).
- Multi-device merge correctness (requires live server and two sessions).

## Notes for Tester

The test must clear localStorage to work correctly — without this, globalSetup's seeded `dev` key prevents the planner from being created. The `addInitScript` guard pattern (`sessionStorage._seeded`) ensures the clear happens only once per page session, not on app-internal redirects. This pattern is now the standard for any test that observes rev:/base:/sync: writes.
