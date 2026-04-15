---
estimated_steps: 56
estimated_files: 2
skills_used: []
---

# T03: Update sync-error.spec.js route glob and write sync-payload.spec.js

Update the existing sync-error test to intercept the new /year-planner/sync endpoint. Write a new sync-payload.spec.js Playwright test that verifies the jsmdma payload shape (clientClock, deviceId, changes array with id/doc/fieldRevs). Run the full suite and confirm all tests pass.

Steps:

1. Update `.tests/e2e/sync-error.spec.js`:
   - Change the page.route() glob from `'**/api/planner/**'` to `'**/year-planner/sync'`
   - Keep everything else unchanged: SESSION_JSON injection, goto('/'), waitForSelector('[data-app-ready]'), waitForTimeout(1000), expect(.alert-danger).toBeVisible()

2. Write `.tests/e2e/sync-payload.spec.js`:
   ```js
   // .tests/e2e/sync-payload.spec.js
   // Verifies: POST /year-planner/sync carries the correct jsmdma payload shape (D007).
   const { test, expect } = require('../fixtures/cdn');

   const SESSION_JSON = JSON.stringify({"0":"test-uuid","1":0});

   test('sync POST carries jsmdma payload shape (D007)', async ({ page }) => {
     let capturedBody = null;

     // Inject signed-in session. Guard against double-run on navigation with sessionStorage flag.
     await page.addInitScript((sessionData) => {
       if (sessionStorage.getItem('_seeded')) return;
       sessionStorage.setItem('_seeded', '1');
       localStorage.setItem('1', sessionData);
     }, SESSION_JSON);

     // Intercept /year-planner/sync, capture request body, return minimal valid response.
     await page.route('**/year-planner/sync', async (route) => {
       const req = route.request();
       capturedBody = JSON.parse(req.postData() || 'null');
       await route.fulfill({
         status: 200,
         contentType: 'application/json',
         body: JSON.stringify({ serverClock: '0000000000001-000000-00000000', serverChanges: [] }),
       });
     });

     await page.goto('/?uid=12345&year=2026');
     await page.waitForSelector('[data-app-ready]');

     // Wait for the async startup sync to fire
     await page.waitForTimeout(2000);

     // Verify payload was captured and has the correct jsmdma shape
     expect(capturedBody).not.toBeNull();
     expect(typeof capturedBody.clientClock).toBe('string');
     expect(typeof capturedBody.deviceId).toBe('string');
     expect(Array.isArray(capturedBody.changes)).toBe(true);
     if (capturedBody.changes.length > 0) {
       const change = capturedBody.changes[0];
       expect(typeof change.id).toBe('string');
       expect(change.doc !== undefined).toBe(true);
       expect(change.fieldRevs !== undefined).toBe(true);
     }
   });
   ```

3. Run the full test suite and confirm all tests pass:
   ```
   cd .tests && npx playwright test --reporter=line
   ```
   Expected: 17 tests pass (16 existing + 1 new sync-payload test).

Constraints:
- The `addInitScript` guard (`sessionStorage._seeded`) is required per M009 KNOWLEDGE — without it the seed re-runs on app-internal redirects and can cause test flakiness.
- The test navigates to `/?uid=12345&year=2026` so the app has explicit uid+year, avoiding the need to pre-seed a planner. The app's `initialise()` in lifecycle.js runs before `api.sync()` (confirmed in code), creating the planner first. Then `getActivePlnrUuid(12345, 2026)` returns the created UUID, so `api.sync()` fires.
- The waitForTimeout(2000) is intentional — same pattern as sync-error.spec.js (1s) but slightly longer since we're also waiting for planner creation in initialise().
- The payload shape check allows `changes` to be empty (a fresh planner has no entries, so `doc` is empty and changes may be `[{ id, doc: {}, fieldRevs: {} }]` or `[]` depending on implementation). The test should handle both cases — the critical assertion is that the outer shape (clientClock, deviceId, changes array) is always present.

## Inputs

- `site/js/service/Api.js`
- `site/js/service/SyncClient.js`
- `.tests/e2e/sync-error.spec.js`
- `.tests/fixtures/cdn.js`

## Expected Output

- `.tests/e2e/sync-error.spec.js`
- `.tests/e2e/sync-payload.spec.js`

## Verification

cd .tests && npx playwright test --reporter=line 2>&1 | grep -E 'passed|failed'
