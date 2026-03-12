// .tests/e2e/tooltip-xss.spec.js
// Verifies: Bootstrap tooltip XSS vector is closed (SEC-03).
// Injects <img src=x onerror=window.__xss=1> as entry text and verifies
// the onerror handler never fires — data-html="true" is not present on tooltips.
const { test, expect } = require('../fixtures/cdn');

test('tooltip does not execute injected HTML (SEC-03)', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('[data-app-ready]');

  // Inject XSS payload as entry text into the first available day cell
  const cell = page.locator('.yp-cell').first();
  await cell.click();

  // Type the XSS payload into the entry modal textarea
  const textarea = page.locator('textarea').first();
  await textarea.fill('<img src=x onerror=window.__xss=1>');

  // Save the entry (close modal — click outside or press Escape)
  await page.keyboard.press('Escape');

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
