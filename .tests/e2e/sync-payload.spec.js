// .tests/e2e/sync-payload.spec.js
// Verifies: POST /year-planner/sync carries the correct jsmdma payload shape (D007).
const { test, expect } = require('../fixtures/cdn');

/** Build a fake but structurally valid JWT (client-side decodeJwt doesn't verify signature) */
function makeFakeJwt(sub = 'test-uuid') {
  function b64u(obj) {
    return Buffer.from(JSON.stringify(obj)).toString('base64url');
  }
  const now = Math.floor(Date.now() / 1000);
  return b64u({ alg: 'HS256', typ: 'JWT' }) + '.' +
         b64u({ sub, iat: now, iat_session: now }) + '.fakesig';
}

const PLANNER_UUID = 'aaaaaaaa-0000-4000-8000-000000012345';

test('sync POST carries jsmdma payload shape (D007)', async ({ page }) => {
  let capturedBody = null;

  await page.addInitScript(({ token, uuid }) => {
    localStorage.setItem('auth_token', token);
    // Seed a planner keyed by userKey (UUID contract) so SyncClientAdapter includes it in sync
    localStorage.setItem('plnr:' + uuid, JSON.stringify({
      meta: { name: '2026', year: 2026, lang: 'en', theme: 'light', dark: false, userKey: 'test-uuid' },
      days: { '2026-04-01': { tp: 1, tl: 'Test', col: 0, notes: '', emoji: '' } },
    }));
    localStorage.setItem('rev:' + uuid, JSON.stringify({}));
    localStorage.setItem('base:' + uuid, JSON.stringify({}));
    localStorage.setItem('sync:' + uuid, '0000000000000-000000-00000000');
    localStorage.setItem('active-planner', uuid);
  }, { token: makeFakeJwt(), uuid: PLANNER_UUID });

  await page.route('**/year-planner/sync', async (route) => {
    const req = route.request();
    capturedBody = JSON.parse(req.postData() || 'null');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ serverClock: '0000000000001-000000-00000000', serverChanges: [] }),
    });
  });

  await page.goto('/?year=2026');
  await page.waitForSelector('[data-app-ready]');
  const deadline = Date.now() + 5000;
  while (capturedBody === null && Date.now() < deadline) {
    await page.waitForTimeout(100);
  }
  expect(capturedBody).not.toBeNull();
  expect(capturedBody.collection).toBe('planners');
  expect(typeof capturedBody.clientClock).toBe('string');
  expect(Array.isArray(capturedBody.changes)).toBe(true);
  expect(capturedBody.changes.length).toBeGreaterThan(0);
  const change = capturedBody.changes[0];
  expect(typeof change.key).toBe('string');
  expect(change.id).toBeUndefined();
  expect(change.doc !== undefined).toBe(true);
  expect(change.fieldRevs !== undefined).toBe(true);
  expect(typeof change.baseClock).toBe('string');
});
