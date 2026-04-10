// .tests/e2e/rail-toggle.spec.js
// Verifies that the rail open/closed state persists via preferences.
const { test, expect } = require('../fixtures/cdn');

test('rail collapsed state persists across page reload', async ({ page }) => {
  // Only clear localStorage on the very first navigation, not on reload.
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('_test_init_done')) {
      sessionStorage.setItem('_test_init_done', '1');
      localStorage.clear();
      // Suppress pester modal
      localStorage.setItem('pester_signin', String(Date.now()));
    }
  });
  await page.goto('/');
  await page.waitForSelector('[data-app-ready]');

  // Rail is open by default
  await expect(page.locator('#rail')).not.toHaveClass(/yp-rail--collapsed/);

  // Toggle the rail via the custom event
  await page.evaluate(() => {
    document.dispatchEvent(new CustomEvent('yp-rail-toggle'));
  });

  // Rail is now collapsed
  await expect(page.locator('#rail')).toHaveClass(/yp-rail--collapsed/, { timeout: 1000 });

  // Reload — pref should be restored
  await page.reload();
  await page.waitForSelector('[data-app-ready]');

  // Rail still collapsed after reload
  await expect(page.locator('#rail')).toHaveClass(/yp-rail--collapsed/, { timeout: 1000 });
});

test('rail open by default when no preference saved', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('pester_signin', String(Date.now()));
  });
  await page.goto('/');
  await page.waitForSelector('[data-app-ready]');

  await expect(page.locator('#rail')).not.toHaveClass(/yp-rail--collapsed/);
});
