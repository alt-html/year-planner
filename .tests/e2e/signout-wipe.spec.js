// .tests/e2e/signout-wipe.spec.js
// Verifies sign-out clears all auth, planner, sync, prefs, and identity keys,
// while preserving the `dev` (device UUID) key.
//
// Approach: seed localStorage with all key types, load the app (auth_token makes
// it look signed-in), open the settings dropdown, click "Sign Out…", then assert
// the storage state after the page redirects to origin.

const { test, expect } = require('../fixtures/cdn');

function makeFakeJwt(sub = 'test-uuid') {
  function b64u(obj) {
    return Buffer.from(JSON.stringify(obj)).toString('base64url');
  }
  const now = Math.floor(Date.now() / 1000);
  return b64u({ alg: 'HS256', typ: 'JWT' }) + '.' +
         b64u({ sub, iat: now, iat_session: now }) + '.fakesig';
}

test('sign-out clears all localStorage except dev key', async ({ page }) => {
  // addInitScript runs on every navigation (including the post-signout redirect).
  // Guard with a sentinel so we only seed on the first load.
  await page.addInitScript((token) => {
    window.__e2eEnabled = true;
    if (localStorage.getItem('__test_seeded')) return;
    localStorage.setItem('__test_seeded', '1');
    localStorage.setItem('dev', 'stable-device-uuid');
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_provider', 'google');
    localStorage.setItem('auth_time', String(Date.now()));
    localStorage.setItem('ids', JSON.stringify([{ uuid: 'user-1', name: '', provider: 'google', email: '' }]));
    localStorage.setItem('prefs:12345', JSON.stringify({ year: 2026, lang: 'en' }));
    localStorage.setItem('plnr:abc-123', JSON.stringify({ meta: { uid: 12345 }, days: {} }));
    localStorage.setItem('rev:abc-123',  '{}');
    localStorage.setItem('base:abc-123', '{}');
    localStorage.setItem('sync:abc-123', '0000000000000-000000-00000000');
    localStorage.setItem('anon_uid', 'anon-device-uuid');
  }, makeFakeJwt());

  // Stub sync so it doesn't fail
  await page.route('**/year-planner/sync', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ serverClock: '0000000000001-000000-00000000', serverChanges: [] }) })
  );

  await page.goto('/');
  await page.waitForSelector('[data-app-ready]');

  // Call signout() via the window.__testSignout hook exposed by main.js.
  // signout() → authProvider.signOut() (clears auth_token/auth_provider/auth_time)
  //           → storageLocal.wipe()   (clears plnr:*, rev:*, base:*, sync:*, prefs:*, ids, anon_uid)
  //           → window.location.href = window.location.origin (triggers navigation)
  await Promise.all([
    page.waitForURL('http://localhost:8080/', { timeout: 5000 }),
    page.evaluate(() => {
      if (typeof window.__testSignout !== 'function') {
        throw new Error('window.__testSignout not available — check main.js test hook');
      }
      window.__testSignout();
    }),
  ]);

  const storage = await page.evaluate(() => {
    const result = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      result[k] = localStorage.getItem(k);
    }
    return result;
  });

  // auth keys must be gone
  expect(storage['auth_token']).toBeUndefined();
  expect(storage['auth_provider']).toBeUndefined();
  expect(storage['auth_time']).toBeUndefined();
  // planner/sync keys must be gone
  expect(storage['plnr:abc-123']).toBeUndefined();
  expect(storage['rev:abc-123']).toBeUndefined();
  expect(storage['base:abc-123']).toBeUndefined();
  expect(storage['sync:abc-123']).toBeUndefined();
  // prefs must be gone
  expect(storage['prefs:12345']).toBeUndefined();
  // ids: wipe() removes it. The app may recreate it on boot as a fresh anonymous
  // identity (object map, no provider field). Assert the seeded google provider
  // identity is no longer present — the raw string must not contain "google".
  const idsRaw = storage['ids'] || '';
  expect(idsRaw).not.toContain('google');
  // anon_uid: wipe() removes the seeded value. App may recreate via DeviceSession.
  expect(storage['anon_uid']).not.toBe('anon-device-uuid');
  // dev key MUST survive
  expect(storage['dev']).toBe('stable-device-uuid');
});
