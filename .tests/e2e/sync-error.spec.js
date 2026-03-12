// .tests/e2e/sync-error.spec.js
// Verifies: sync failures are surfaced as visible error messages (SEC-04).
// Uses page.route() to make the sync API return 500, then triggers a sync
// and verifies the .alert-danger div becomes visible.
//
// Session setup: injects a fake session cookie (LZ-base64 encoded, expires=0
// means "remember me") so signedin() returns true and synchroniseToLocal/Remote()
// are not short-circuited before the route intercept can return 500.
const { test, expect } = require('../fixtures/cdn');

// Pre-computed LZString.compressToBase64(JSON.stringify({"0":"test-uuid","1":0}))
// expires=0 means "remember me" / always signed in per StorageLocal.signedin()
const SESSION_COOKIE = 'N4IgDCBcIC4KYGcYFoCuqCWATEAaEAjFGAL5A===';

test('sync failure shows visible error alert (SEC-04)', async ({ page }) => {
  // Inject a signed-in session cookie before the page loads.
  // Cookie '1' holds the LZ-compressed session: {0: uuid, 1: expires}
  await page.context().addCookies([{
    name: '1',
    value: SESSION_COOKIE,
    domain: 'localhost',
    path: '/',
  }]);

  // Intercept all API calls and return 500 to simulate sync failure.
  // On app startup, synchroniseToLocal() is called — this will return 500
  // and trigger the else-fallback: model.error = 'error.syncfailed'
  await page.route('**/api/planner/**', (route) => route.fulfill({
    status: 500,
    body: JSON.stringify({ error: 'Internal Server Error' }),
    contentType: 'application/json',
  }));

  await page.goto('/');
  await page.waitForSelector('[data-app-ready]');

  // Wait briefly for the async startup sync to complete and model.error to be set
  await page.waitForTimeout(1000);

  // The alert-danger div must be visible — model.error = 'error.syncfailed'
  const alert = page.locator('.alert-danger');
  await expect(alert).toBeVisible({ timeout: 3000 });
});
