// .tests/e2e/tooltip-xss.spec.js
// Verifies: Bootstrap tooltip XSS vector is closed (SEC-03).
// Injects <img src=x onerror=window.__xss=1> as entry text and verifies
// the onerror handler never fires — data-html="true" is not present on tooltips.
const { test, expect } = require('../fixtures/cdn');

test('tooltip does not execute injected HTML (SEC-03)', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('[data-app-ready]');

  // Target January day 1 — use text filter to avoid blank offset cells
  const janColumn = page.locator('#yp-months .col-xs-12.col-sm-6.col-md-4.col-lg-3.col-xl-1').first();
  const cell = janColumn.locator('.yp-cell').filter({ hasText: /^1\s/ }).first();

  // Inject XSS payload as entry text into the day cell
  await cell.click();

  // Wait for the entry modal to be visible before interacting with textarea
  await page.waitForSelector('#entryModal.show');

  // Type the XSS payload into the entry modal textarea
  await page.fill('#yp-entry-textarea', '<img src=x onerror=window.__xss=1>');

  // Save the entry via the modal Save button
  await page.click('#entryModal .yp-action-save');
  await expect(page.locator('#entryModal')).not.toBeVisible();

  // Hover over the cell to trigger tooltip rendering
  await cell.hover();
  await page.waitForTimeout(300); // allow tooltip to render

  // Verify __xss was never set
  const xssExecuted = await page.evaluate(() => window.__xss);
  expect(xssExecuted).toBeUndefined();

  // Also verify no data-html attribute remains on any tooltip element
  const dataHtmlCount = await page.locator('[data-html="true"]').count();
  expect(dataHtmlCount).toBe(0);
});
