// .tests/e2e/signout-wipe.spec.js
// Verifies sign-out clears all auth credentials but preserves planner data
// in localStorage — asserting the offline-first contract (AUT-03).
//
// Approach: seed localStorage with all key types, load the app (auth_token makes
// it look signed-in), call window.__testSignout(), wait for auth_token to be
// removed, then assert storage state without any page navigation.

const { test, expect } = require('../fixtures/cdn');

function makeFakeJwt(sub = 'test-uuid') {
  function b64u(obj) {
    return Buffer.from(JSON.stringify(obj)).toString('base64url');
  }
  const now = Math.floor(Date.now() / 1000);
  return b64u({ alg: 'HS256', typ: 'JWT' }) + '.' +
         b64u({ sub, iat: now, iat_session: now }) + '.fakesig';
}

test('sign-out clears auth credentials but preserves planner data', async ({ page }) => {
  await page.addInitScript((token) => {
    window.__e2eEnabled = true;
    if (localStorage.getItem('__test_seeded')) return;
    localStorage.setItem('__test_seeded', '1');
    localStorage.setItem('dev', 'stable-device-uuid');
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_provider', 'google');
    localStorage.setItem('auth_time', String(Date.now()));
    localStorage.setItem('ids', JSON.stringify([{ uuid: 'user-1', name: '', provider: 'google', email: '' }]));
    localStorage.setItem('prefs:test-uuid', JSON.stringify({ year: 2026, lang: 'en' }));
    localStorage.setItem('plnr:abc-123', JSON.stringify({ meta: { userKey: 'test-uuid' }, days: {} }));
    localStorage.setItem('rev:abc-123',  '{}');
    localStorage.setItem('base:abc-123', '{}');
    localStorage.setItem('sync:abc-123', '0000000000000-000000-00000000');
    localStorage.setItem('anon_uid', 'anon-device-uuid');
    localStorage.setItem('oauth_intended_provider', 'google');
    localStorage.setItem('oauth_state', 'some-state-value');
    localStorage.setItem('oauth_code_verifier', 'some-verifier-value');
  }, makeFakeJwt());

  // Stub sync so it doesn't fail
  await page.route('**/year-planner/sync', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ serverClock: '0000000000001-000000-00000000', serverChanges: [] }) })
  );

  await page.goto('/');
  await page.waitForSelector('[data-app-ready]');

  // Call signout() via the window.__testSignout hook exposed by main.js.
  // signout() → authProvider.signOut() (clears auth_token/auth_provider/auth_time + oauth keys)
  //           → wipe() is NOT called — planner data survives (AUT-03)
  await page.evaluate(() => {
    if (typeof window.__testSignout !== 'function') {
      throw new Error('window.__testSignout not available — check main.js test hook');
    }
    window.__testSignout();
  });

  // Wait for sign-out to complete by watching for auth_token removal
  await page.waitForFunction(() => localStorage.getItem('auth_token') === null, { timeout: 5000 });

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

  // OAuth transient keys must be gone
  expect(storage['oauth_intended_provider']).toBeUndefined();
  expect(storage['oauth_state']).toBeUndefined();
  expect(storage['oauth_code_verifier']).toBeUndefined();

  // planner keys MUST survive (AUT-03: offline-first contract)
  expect(storage['plnr:abc-123']).toBeDefined();
  expect(storage['rev:abc-123']).toBeDefined();
  expect(storage['base:abc-123']).toBeDefined();
  expect(storage['sync:abc-123']).toBeDefined();

  // prefs MUST survive (keyed by JWT sub UUID — AUT-03 offline-first contract)
  expect(storage['prefs:test-uuid']).toBeDefined();

  // identity data MUST survive
  expect(storage['ids']).toBeDefined();
  expect(storage['anon_uid']).toBe('anon-device-uuid');

  // device UUID MUST survive
  expect(storage['dev']).toBe('stable-device-uuid');
});
