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

  // --- Create a new planner (triggers full-page navigation) ---
  await page.click('button:has(.fas.fa-bars)');
  await page.click('.nav-settings .dropdown-item:has-text("New")');
  await page.waitForSelector('[data-app-ready]');
  // Verify navigation actually occurred
  expect(page.url()).not.toBe(originalUrl);

  // --- Rename the new planner (does NOT navigate) ---
  await page.click('button:has(.fas.fa-bars)');
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

  // --- Switch back to the original planner (triggers full-page navigation) ---
  await page.click('.nav a.dropdown-toggle');
  const navPromise1 = page.waitForNavigation();
  await page.locator('.dropdown-menu a.dropdown-item').filter({ hasText: /Year Planner/ }).first().click();
  await navPromise1;
  await page.waitForSelector('[data-app-ready]');
  expect(page.url()).toBe(originalUrl);

  // --- Switch to "My Test Planner" so we can delete it (triggers full-page navigation) ---
  await page.click('.nav a.dropdown-toggle');
  const navPromise2 = page.waitForNavigation();
  await page.locator('.dropdown-menu a.dropdown-item:has-text("My Test Planner")').click();
  await navPromise2;
  await page.waitForSelector('[data-app-ready]');

  // --- Delete "My Test Planner" (triggers full-page navigation + location.reload()) ---
  await page.click('button:has(.fas.fa-bars)');
  await page.click('.nav-settings [data-target="#deleteModal"]');
  await page.waitForSelector('#deleteModal.show');
  // deletePlannerByYear does window.location.href then location.reload() — two navigations.
  // waitForNavigation() cannot survive the double navigation (ERR_ABORTED on first).
  // Instead: remove [data-app-ready] marker, click confirm, then wait for it to reappear.
  await page.evaluate(() => {
    delete document.body.dataset.appReady;
  });
  await page.click('#deleteModal .modal-footer .btn-primary');
  await page.waitForSelector('[data-app-ready]', { timeout: 15000 });

  // --- Verify "My Test Planner" no longer appears in the Year dropdown ---
  await page.click('.nav a.dropdown-toggle');
  await expect(page.locator('.dropdown-menu a.dropdown-item:has-text("My Test Planner")')).not.toBeVisible();
});
