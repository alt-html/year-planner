// .tests/e2e/tp-col-coercion.spec.js
// Verifies that sync payload sends tp/col as integers even when stored as '' in localStorage.
const { test, expect } = require('../fixtures/cdn');

function makeFakeJwt(sub = 'test-uuid') {
  function b64u(obj) {
    return Buffer.from(JSON.stringify(obj)).toString('base64url');
  }
  const now = Math.floor(Date.now() / 1000);
  return b64u({ alg: 'HS256', typ: 'JWT' }) + '.' +
         b64u({ sub, iat: now, iat_session: now }) + '.fakesig';
}

test('sync payload sends tp/col as integers not empty strings', async ({ page }) => {
  let capturedBody = null;

  await page.addInitScript((token) => {
    localStorage.setItem('auth_token', token);

    // Seed a planner with tp/col stored as empty strings (legacy Vue bug)
    const uuid = 'test-planner-tp-col';
    const doc = {
      meta: { uid: 12345, year: 2026, name: '2026', lang: 'en', theme: 'light', dark: false },
      days: {
        '2026-03-01': { tp: '', tl: 'work day', col: '', notes: '', emoji: '' },
        '2026-03-02': { tp: 1,  tl: 'event',    col: 2,  notes: '', emoji: '' },
      },
    };
    localStorage.setItem(`plnr:${uuid}`, JSON.stringify(doc));
    localStorage.setItem(`sync:${uuid}`, '0000000000000-000000-00000000');
    localStorage.setItem(`rev:${uuid}`,  '{}');
    localStorage.setItem(`base:${uuid}`, '{}');
  }, makeFakeJwt());

  await page.route('**/year-planner/sync', async (route) => {
    capturedBody = JSON.parse(route.request().postData() || 'null');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ serverClock: '0000000000001-000000-00000000', serverChanges: [] }),
    });
  });

  await page.goto('/?uid=12345&year=2026');
  await page.waitForSelector('[data-app-ready]');
  const deadline = Date.now() + 5000;
  while (capturedBody === null && Date.now() < deadline) {
    await page.waitForTimeout(100);
  }

  expect(capturedBody).not.toBeNull();
  const days = capturedBody.changes[0]?.doc?.days || {};
  const day = days['2026-03-01'];
  expect(day).toBeDefined();
  expect(typeof day.tp).toBe('number');
  expect(day.tp).toBe(0);
  expect(typeof day.col).toBe('number');
  expect(day.col).toBe(0);

  // Verify integer values pass through correctly
  const day2 = days['2026-03-02'];
  expect(day2.tp).toBe(1);
  expect(day2.col).toBe(2);
});
