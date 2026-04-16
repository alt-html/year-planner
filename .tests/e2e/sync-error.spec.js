// .tests/e2e/sync-error.spec.js
// Verifies: sync failures are surfaced as visible error messages (SEC-04).
const { test, expect } = require('../fixtures/cdn');

function makeFakeJwt(sub = 'test-uuid') {
  function b64u(obj) {
    return Buffer.from(JSON.stringify(obj)).toString('base64url');
  }
  const now = Math.floor(Date.now() / 1000);
  return b64u({ alg: 'HS256', typ: 'JWT' }) + '.' +
         b64u({ sub, iat: now, iat_session: now }) + '.fakesig';
}

test('sync failure shows visible error alert (SEC-04)', async ({ page }) => {
  await page.addInitScript((token) => {
    localStorage.setItem('auth_token', token);
  }, makeFakeJwt());

  await page.route('**/year-planner/sync', (route) => route.fulfill({
    status: 500,
    body: JSON.stringify({ error: 'Internal Server Error' }),
    contentType: 'application/json',
  }));

  await page.goto('/');
  await page.waitForSelector('[data-app-ready]');
  await page.waitForTimeout(1000);

  const alert = page.locator('.alert-danger');
  await expect(alert).toBeVisible({ timeout: 3000 });
  await expect(page.locator('.yp-error-alert')).toBeVisible({ timeout: 3000 });
});
