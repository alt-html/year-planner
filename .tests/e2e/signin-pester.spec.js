// .tests/e2e/signin-pester.spec.js
// Verifies that the sign-in modal is shown automatically if the user is not
// signed in AND has not been pestered in the last 30 days.
const { test, expect } = require('../fixtures/cdn');

test('sign-in modal auto-shown when not signed in and pester not recent', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    // Ensure not signed in (no auth_token) and pester has never fired
  });

  await page.goto('/');
  await page.waitForSelector('[data-app-ready]');

  // Modal should appear automatically within 3 seconds of app ready
  await expect(page.locator('#authModal')).toHaveClass(/\bshow\b/, { timeout: 3000 });
});

test('sign-in modal NOT auto-shown if pestered recently', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    // Pretend we just pestered the user (1 hour ago)
    localStorage.setItem('pester_signin', String(Date.now() - 60 * 60 * 1000));
  });

  await page.goto('/');
  await page.waitForSelector('[data-app-ready]');

  // Wait for any async — modal must NOT appear
  await page.waitForTimeout(2000);
  const classes = await page.locator('#authModal').getAttribute('class') || '';
  expect(classes).not.toMatch(/\bshow\b/);
});

test('sign-in modal NOT auto-shown if user is signed in', async ({ page }) => {
  await page.addInitScript(() => {
    function b64u(obj) {
      return btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    }
    const now = Math.floor(Date.now() / 1000);
    const token = b64u({ alg: 'HS256', typ: 'JWT' }) + '.' +
                  b64u({ sub: 'user-uuid', iat: now, iat_session: now }) + '.fakesig';
    localStorage.setItem('auth_token', token);
    // No pester_signin key
  });

  await page.route('**/year-planner/sync', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ serverClock: '0000000000001-000000-00000000', serverChanges: [] }) })
  );

  await page.goto('/');
  await page.waitForSelector('[data-app-ready]');
  await page.waitForTimeout(2000);

  const classes = await page.locator('#authModal').getAttribute('class') || '';
  expect(classes).not.toMatch(/\bshow\b/);
});
