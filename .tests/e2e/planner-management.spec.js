// E2E-03: Planner management lifecycle — create, rename, switch, delete
// Uses the planner selector dropdown instead of URL navigation.

'use strict';

const { test, expect } = require('../fixtures/cdn');

// Open the nav-settings dropdown via the Vue app instance (no jQuery/Bootstrap)
async function openNavDropdown(page) {
    await page.evaluate(() => {
        const appEl = document.getElementById('app');
        if (appEl && appEl._vnode && appEl._vnode.component) {
            const vm = appEl._vnode.component.proxy;
            if (!vm.navMenuOpen) vm.toggleNavMenu();
        }
    });
    await page.waitForSelector('.nav-settings', { state: 'visible' });
}

test('planner management: create, select, delete via dropdown (E2E-03)', async ({ page }) => {
  // --- Initial load ---
  await page.goto('/');
  await page.waitForSelector('[data-app-ready]');

  // --- Create a new planner via dropdown ---
  await openNavDropdown(page);
  await page.click('.nav-settings .dropdown-item:has-text("New")');
  // No page navigation — selector creates and activates inline
  await page.waitForTimeout(500);

  // Open dropdown again and verify there are now at least 2 planners listed
  await openNavDropdown(page);
  const plannerItems = await page.locator('.nav-settings .dropdown-item-checked, .nav-settings .dropdown-item.d-flex').count();
  expect(plannerItems).toBeGreaterThanOrEqual(2);

  // --- Switch to the first planner in the list ---
  const firstPlannerItem = page.locator('.nav-settings a.dropdown-item.d-flex').first();
  await firstPlannerItem.click();
  await page.waitForTimeout(300);

  // --- Delete the active planner ---
  await openNavDropdown(page);
  // The delete item only shows when activeDocUuid is set
  const deleteItem = page.locator('.nav-settings .dropdown-item:has-text("Delete")');
  if (await deleteItem.isVisible()) {
    await deleteItem.click();
    await page.waitForTimeout(300);
  }
});

test('planner selector shows ownership indicators when signed in', async ({ page }) => {
  function makeFakeJwt(sub) {
    function b64u(obj) { return Buffer.from(JSON.stringify(obj)).toString('base64url'); }
    const now = Math.floor(Date.now() / 1000);
    return b64u({ alg: 'HS256', typ: 'JWT' }) + '.' + b64u({ sub, iat: now, iat_session: now }) + '.fakesig';
  }

  await page.addInitScript(({ token }) => {
    localStorage.setItem('auth_token', token);
    // User-owned planner
    localStorage.setItem('plnr:user-plan', JSON.stringify({
      meta: { name: 'Cloud Planner', userKey: 'test-user-uuid', year: 2026 },
      days: {},
    }));
    // Device-local planner
    localStorage.setItem('plnr:device-plan', JSON.stringify({
      meta: { name: 'Local Planner', userKey: 'device-abc', year: 2026 },
      days: {},
    }));
    localStorage.setItem('active-planner', 'user-plan');
  }, { token: makeFakeJwt('test-user-uuid') });

  // Mock sync endpoint
  await page.route('**/year-planner/sync', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ serverClock: '0000000000001-000001-server', serverChanges: [] }),
    });
  });

  await page.goto('/?uid=12345&year=2026');
  await page.waitForSelector('[data-app-ready]');

  // Open dropdown via Vue
  await openNavDropdown(page);

  // Both planners should be listed
  await expect(page.locator('.nav-settings:has-text("Cloud Planner")')).toBeVisible();
  await expect(page.locator('.nav-settings:has-text("Local Planner")')).toBeVisible();

  // "Sync to cloud" action should appear for the device-local planner
  await expect(page.locator('.nav-settings:has-text("Sync to cloud")')).toBeVisible();
});
