// E2E-01: Year grid structure tests
// Verifies that the app boots correctly and renders 12 month columns with the correct year label.

const { test, expect } = require('../fixtures/cdn');

test('year grid renders 12 months (E2E-01)', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('[data-app-ready]');

  const monthHeaders = page.locator('#yp-months .yp-header-cell h5, #yp-months .yp-header-cell-right h5');
  await expect(monthHeaders).toHaveCount(12);
});

test('year label shows current year (E2E-01)', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('[data-app-ready]');

  const currentYear = new Date().getFullYear().toString();
  const yearLabel = page.locator('#yp-weekdays .yp-header-cell h5').first();
  await expect(yearLabel).toContainText(currentYear);
});
