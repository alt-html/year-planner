// E2E-03: Planner management lifecycle — create, rename, switch, delete
// Requires CDN fixtures for offline CI use.
//
// IMPORTANT: createLocalPlanner(), deletePlannerByYear(), and planner switch links
// all trigger full-page navigation. After each, re-wait for [data-app-ready] before
// proceeding. Skipping this causes the next interaction to fire before CDI initializes.

'use strict';

const { test, expect } = require('../fixtures/cdn');

test('planner management: create, rename, switch, delete (E2E-03)', async ({ page }) => {
  // --- Initial load ---
  await page.goto('/');
  await page.waitForSelector('[data-app-ready]');
  const originalUrl = page.url();

  // Extract uid from original URL for later navigation
  const originalUid = new URL(originalUrl).searchParams.get('uid');

  // --- Create a new planner (triggers full-page navigation) ---
  // Menu button is visually hidden (accessible from rail); toggle dropdown via jQuery
  await page.evaluate(() => { $('.nav-settings').closest('.btn-group').find('[data-toggle="dropdown"]').dropdown('toggle'); });
  await page.click('.nav-settings .dropdown-item:has-text("New")');
  await page.waitForSelector('[data-app-ready]');
  // Verify navigation actually occurred
  expect(page.url()).not.toBe(originalUrl);

  // Capture the new planner's uid for later navigation
  const newPlannerUid = new URL(page.url()).searchParams.get('uid');

  // --- Rename the new planner (does NOT navigate) ---
  await page.evaluate(() => { $('.nav-settings').closest('.btn-group').find('[data-toggle="dropdown"]').dropdown('toggle'); });
  await page.click('.nav-settings .dropdown-item:has-text("Rename")');
  await page.waitForSelector('#rename', { state: 'visible' });
  // Use fill() to set the DOM value then dispatch input event to trigger Vue v-model
  await page.locator('#title').fill('My Test Planner');
  await page.evaluate(() => {
    const el = document.querySelector('#title');
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  // Trigger blur to invoke focusout -> renamePlanner() (saves name, sets rename=false)
  await page.evaluate(() => {
    document.querySelector('#title')?.blur();
  });
  // Wait for rename form to hide (jQuery $().hide() called by renamePlanner())
  await page.waitForSelector('#rename', { state: 'hidden' });
  // Assert new planner name is visible in navbar brand
  await expect(page.locator('.navbar-brand').first()).toContainText('My Test Planner');

  // --- Switch back to the original planner via direct URL navigation ---
  await page.goto(`/?uid=${originalUid}&year=2026&lang=en&theme=light`);
  await page.waitForSelector('[data-app-ready]');
  expect(page.url()).toContain(`uid=${originalUid}`);

  // --- Switch to "My Test Planner" so we can delete it ---
  await page.goto(`/?uid=${newPlannerUid}&year=2026&lang=en&theme=light`);
  await page.waitForSelector('[data-app-ready]');
  await expect(page.locator('.navbar-brand').first()).toContainText('My Test Planner');

  // --- Delete "My Test Planner" (triggers full-page navigation + location.reload()) ---
  await page.evaluate(() => { $('.nav-settings').closest('.btn-group').find('[data-toggle="dropdown"]').dropdown('toggle'); });
  await page.click('.nav-settings [data-target="#deleteModal"]');
  await page.waitForSelector('#deleteModal.show');
  // deletePlannerByYear does window.location.href then location.reload() — two navigations.
  // Instead: remove [data-app-ready] marker, click confirm, then wait for it to reappear.
  await page.evaluate(() => {
    delete document.body.dataset.appReady;
  });
  await page.click('#deleteModal .modal-footer .btn-primary');
  await page.waitForSelector('[data-app-ready]', { timeout: 15000 });

  // --- Verify "My Test Planner" is gone — navigating to its uid should NOT show its name ---
  // After deletion, the planner's data is removed from localStorage.
  // The app will redirect to the first remaining planner or create a new one.
  const brandText = await page.locator('.navbar-brand').first().textContent();
  expect(brandText).not.toContain('My Test Planner');
});
