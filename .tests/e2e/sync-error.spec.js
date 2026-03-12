// .tests/e2e/sync-error.spec.js
// Verifies: sync failures are surfaced as visible error messages (SEC-04).
// Uses page.route() to make the sync API return 500, then triggers a sync
// and verifies the .alert-danger div becomes visible.
const { test, expect } = require('../fixtures/cdn');

test('sync failure shows visible error alert (SEC-04)', async ({ page }) => {
  // Intercept all API calls and return 500 to simulate sync failure
  await page.route('**/api/planner/**', (route) => route.fulfill({
    status: 500,
    body: JSON.stringify({ error: 'Internal Server Error' }),
    contentType: 'application/json',
  }));

  await page.goto('/');
  await page.waitForSelector('[data-app-ready]');

  // Trigger synchroniseToLocal by reloading while signed in is not needed —
  // trigger synchroniseToRemote by modifying data (save an entry) while the
  // API is intercepted to 500.
  // Alternative: force a sync by calling the method via page.evaluate if the
  // above is not reliable. Try the entry-save approach first.
  const cell = page.locator('.yp-cell').first();
  await cell.click();
  const textarea = page.locator('textarea').first();
  await textarea.fill('sync test');
  await page.keyboard.press('Escape');

  // Wait briefly for any async sync attempt
  await page.waitForTimeout(500);

  // The alert-danger div must be visible
  const alert = page.locator('.alert-danger');
  await expect(alert).toBeVisible({ timeout: 3000 });
});
