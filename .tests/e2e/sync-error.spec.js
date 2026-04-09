// .tests/e2e/sync-error.spec.js
// Verifies: sync failures are surfaced as visible error messages (SEC-04).
// Uses page.route() to make the sync API return 500, then triggers a sync
// and verifies the .alert-danger div becomes visible.
//
// Session setup: injects a fake session into localStorage (key '1', JSON encoded,
// expires=0 means "remember me") so signedin() returns true and
// synchroniseToLocal/Remote() are not short-circuited before the route
// intercept can return 500.
const { test, expect } = require('../fixtures/cdn');

// Session JSON: {0: "test-uuid", 1: 0} — expires=0 means "remember me" / always signed in
const SESSION_JSON = JSON.stringify({"0":"test-uuid","1":0});

test('sync failure shows visible error alert (SEC-04)', async ({ page }) => {
  // Inject a signed-in session into localStorage before the page loads.
  // Key '1' holds the session: {0: uuid, 1: expires}
  await page.addInitScript((sessionData) => {
    localStorage.setItem('1', sessionData);
  }, SESSION_JSON);

  // Intercept the new sync endpoint and return 500 to simulate sync failure.
  // On app startup, api.sync() POSTs to /year-planner/sync — this will return 500
  // and trigger the else-fallback: model.error = 'error.syncfailed'
  await page.route('**/year-planner/sync', (route) => route.fulfill({
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
