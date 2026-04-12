// .tests/e2e/cross-profile-sync.spec.js
// Verifies: multi-doc sync delivers all user-owned planners across devices.
const { test, expect } = require('../fixtures/cdn');

function makeFakeJwt(sub = 'shared-user-uuid') {
  function b64u(obj) {
    return Buffer.from(JSON.stringify(obj)).toString('base64url');
  }
  const now = Math.floor(Date.now() / 1000);
  return b64u({ alg: 'HS256', typ: 'JWT' }) + '.' +
         b64u({ sub, iat: now, iat_session: now }) + '.fakesig';
}

const SHARED_USER    = 'shared-user-uuid';

test('signed-in user syncs all owned planners in one request', async ({ page }) => {
  // Seed two user-owned planners locally
  await page.addInitScript(({ token }) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('plnr:plan-a', JSON.stringify({
      meta: { name: 'Work 2026', userKey: 'shared-user-uuid', year: 2026 },
      days: { '2026-01-15': { tp: 1, tl: 'Dentist', col: 2, notes: '', emoji: '' } },
    }));
    localStorage.setItem('plnr:plan-b', JSON.stringify({
      meta: { name: 'Home 2026', userKey: 'shared-user-uuid', year: 2026 },
      days: { '2026-03-20': { tp: 0, tl: 'Holiday', col: 3, notes: 'Beach', emoji: '' } },
    }));
    localStorage.setItem('active-planner', 'plan-a');
  }, { token: makeFakeJwt(SHARED_USER) });

  let capturedBody = null;

  await page.route('**/year-planner/sync', async (route) => {
    const req = route.request();
    capturedBody = JSON.parse(req.postData() || 'null');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ serverClock: '0000000000001-000001-server', serverChanges: [] }),
    });
  });

  await page.goto('/?uid=12345&year=2026');
  await page.waitForSelector('[data-app-ready]');

  const deadline = Date.now() + 5000;
  while (capturedBody === null && Date.now() < deadline) {
    await page.waitForTimeout(100);
  }

  expect(capturedBody).not.toBeNull();
  // Both user-owned planners should be in the changes array
  expect(capturedBody.changes.length).toBe(2);
  const keys = capturedBody.changes.map(c => c.key).sort();
  expect(keys).toEqual(['plan-a', 'plan-b']);
});

test('device-local planners are NOT included in sync payload', async ({ page }) => {
  await page.addInitScript(({ token }) => {
    localStorage.setItem('auth_token', token);
    // User-owned planner
    localStorage.setItem('plnr:user-plan', JSON.stringify({
      meta: { name: 'Synced', userKey: 'shared-user-uuid', year: 2026 },
      days: {},
    }));
    // Device-local planner (different userKey)
    localStorage.setItem('plnr:device-plan', JSON.stringify({
      meta: { name: 'Local', userKey: 'device-uuid-abc', year: 2026 },
      days: { '2026-06-01': { tp: 0, tl: 'Local only', col: 0, notes: '', emoji: '' } },
    }));
    localStorage.setItem('active-planner', 'user-plan');
  }, { token: makeFakeJwt(SHARED_USER) });

  let capturedBody = null;

  await page.route('**/year-planner/sync', async (route) => {
    capturedBody = JSON.parse(route.request().postData() || 'null');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ serverClock: '0000000000001-000001-server', serverChanges: [] }),
    });
  });

  await page.goto('/?uid=12345&year=2026');
  await page.waitForSelector('[data-app-ready]');

  const deadline = Date.now() + 5000;
  while (capturedBody === null && Date.now() < deadline) {
    await page.waitForTimeout(100);
  }

  expect(capturedBody).not.toBeNull();
  // Only the user-owned planner should be synced
  expect(capturedBody.changes.length).toBe(1);
  expect(capturedBody.changes[0].key).toBe('user-plan');
});

test('foreign docs from server are stored locally', async ({ page }) => {
  await page.addInitScript(({ token }) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('plnr:my-plan', JSON.stringify({
      meta: { name: 'Mine', userKey: 'shared-user-uuid', year: 2026 },
      days: {},
    }));
    localStorage.setItem('active-planner', 'my-plan');
  }, { token: makeFakeJwt(SHARED_USER) });

  let syncCount = 0;

  await page.route('**/year-planner/sync', async (route) => {
    syncCount++;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        serverClock: '0000000000001-000001-server',
        serverChanges: [{
          _key: 'foreign-plan',
          _rev: '0000000000001-000001-server',
          _fieldRevs: {},
          meta: { name: 'From Other Device', userKey: SHARED_USER, year: 2026 },
          days: { '2026-07-04': { tp: 0, tl: 'Independence Day', col: 1, notes: '', emoji: '' } },
        }],
      }),
    });
  });

  await page.goto('/?uid=12345&year=2026');
  await page.waitForSelector('[data-app-ready]');

  const deadline = Date.now() + 5000;
  while (syncCount === 0 && Date.now() < deadline) {
    await page.waitForTimeout(100);
  }
  await page.waitForTimeout(500);

  // Foreign doc should be stored in localStorage
  const foreignDoc = await page.evaluate(() => {
    const raw = localStorage.getItem('plnr:foreign-plan');
    return raw ? JSON.parse(raw) : null;
  });

  expect(foreignDoc).not.toBeNull();
  expect(foreignDoc.meta.name).toBe('From Other Device');
  expect(foreignDoc.days['2026-07-04']?.tl).toBe('Independence Day');
});
