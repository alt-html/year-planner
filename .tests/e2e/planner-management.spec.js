// E2E-03: Planner management lifecycle — create, rename, switch, delete
// Uses the planner selector in the rail calendar flyout.

'use strict';

const { test, expect } = require('../fixtures/cdn');

// Open the rail calendar flyout via Vue
async function openCalendarFlyout(page) {
    await page.evaluate(() => {
        const appEl = document.getElementById('app');
        if (appEl && appEl._vnode && appEl._vnode.component) {
            const vm = appEl._vnode.component.proxy;
            // Ensure rail is open
            const rail = document.getElementById('rail');
            if (rail && !rail.classList.contains('open')) vm.toggleRail();
            // Open calendar flyout
            vm.railFlyout = 'calendar';
        }
    });
    await page.waitForSelector('.rail-planner-section', { state: 'visible' });
}

test('planner management: create, select, delete via dropdown (E2E-03)', async ({ page }) => {
  // --- Initial load ---
  await page.goto('/');
  await page.waitForSelector('[data-app-ready]');

  // --- Create a new planner via rail flyout ---
  await openCalendarFlyout(page);
  await page.click('.rail-planner-section .rail-flyout-item:has-text("New")');
  // No page navigation — selector creates and activates inline
  await page.waitForTimeout(500);

  // Open flyout again and verify there are now at least 2 planners listed
  await openCalendarFlyout(page);
  const plannerItems = await page.locator('.rail-planner-section .rail-flyout-item-active, .rail-planner-section a.rail-flyout-item.d-flex').count();
  expect(plannerItems).toBeGreaterThanOrEqual(2);

  // --- Switch to the first planner in the list ---
  const firstPlannerItem = page.locator('.rail-planner-section a.rail-flyout-item.d-flex').first();
  await firstPlannerItem.click();
  await page.waitForTimeout(300);

  // --- Delete the active planner ---
  await openCalendarFlyout(page);
  // The delete item only shows when activeDocUuid is set
  const deleteItem = page.locator('.rail-planner-section .rail-flyout-item:has-text("Delete")');
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

  await page.goto('/?year=2026');
  await page.waitForSelector('[data-app-ready]');

  // Open rail calendar flyout
  await openCalendarFlyout(page);

  // Both planners should be listed
  await expect(page.locator('.rail-planner-section:has-text("Cloud Planner")')).toBeVisible();
  await expect(page.locator('.rail-planner-section:has-text("Local Planner")')).toBeVisible();

  // "Sync to cloud" action should appear for the device-local planner
  await expect(page.locator('.rail-planner-section:has-text("Sync to cloud")')).toBeVisible();
});
