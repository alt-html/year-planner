// E2E-02: Entry CRUD test
// Exercises the full create, edit, and delete cycle for a single day cell entry.

const { test, expect } = require('../fixtures/cdn');

test('entry CRUD: create, see, edit, delete (E2E-02)', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('[data-app-ready]');

  // Target January day 1 — use text filter for year-independence (avoids blank offset cells)
  const janColumn = page.locator('#yp-months .col-12.col-sm-6.col-md-4.col-lg-3.col-xl-1').first();
  const day1Cell = janColumn.locator('.yp-cell').filter({ hasText: /^1\s/ }).first();

  // --- Create ---
  await day1Cell.click();
  await page.waitForSelector('#entryModal.show');
  await page.fill('#yp-entry-textarea', 'Test entry text');
  await page.click('#entryModal .yp-action-save');
  await expect(page.locator('#entryModal')).not.toBeVisible();
  await expect(day1Cell.locator('.yp-cell-text').nth(1)).toContainText('Test entry');

  // --- Edit ---
  await day1Cell.click();
  await page.waitForSelector('#entryModal.show');
  await page.fill('#yp-entry-textarea', 'Edited entry text');
  await page.click('#entryModal .yp-action-save');
  await expect(page.locator('#entryModal')).not.toBeVisible();
  await expect(day1Cell.locator('.yp-cell-text').nth(1)).toContainText('Edited entry');

  // --- Delete (clear textarea) ---
  await day1Cell.click();
  await page.waitForSelector('#entryModal.show');
  await page.fill('#yp-entry-textarea', '');
  await page.click('#entryModal .yp-action-save');
  await expect(page.locator('#entryModal')).not.toBeVisible();
  await expect(day1Cell.locator('.yp-cell-text').nth(1)).not.toContainText('Edited entry');
});
