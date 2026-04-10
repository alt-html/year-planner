// .tests/e2e/sync-payload.spec.js
// Verifies: POST /year-planner/sync carries the correct jsmdma payload shape (D007).
const { test, expect } = require('../fixtures/cdn');

const SESSION_JSON = JSON.stringify({"0":"test-uuid","1":0});

test('sync POST carries jsmdma payload shape (D007)', async ({ page }) => {
  let capturedBody = null;

  await page.addInitScript((sessionData) => {
    if (sessionStorage.getItem('_seeded')) return;
    sessionStorage.setItem('_seeded', '1');
    localStorage.clear();
    localStorage.setItem('1', sessionData);
  }, SESSION_JSON);

  await page.route('**/year-planner/sync', async (route) => {
    const req = route.request();
    capturedBody = JSON.parse(req.postData() || 'null');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ serverClock: '0000000000001-000000-00000000', serverChanges: [] }),
    });
  });

  await page.goto('/?uid=12345&year=2026');
  await page.waitForSelector('[data-app-ready]');
  await page.waitForTimeout(2000);

  expect(capturedBody).not.toBeNull();
  expect(capturedBody.collection).toBe('planners');
  expect(typeof capturedBody.clientClock).toBe('string');
  expect(Array.isArray(capturedBody.changes)).toBe(true);
  if (capturedBody.changes.length > 0) {
    const change = capturedBody.changes[0];
    expect(typeof change.key).toBe('string');
    expect(change.id).toBeUndefined();
    expect(change.doc !== undefined).toBe(true);
    expect(change.fieldRevs !== undefined).toBe(true);
    expect(typeof change.baseClock).toBe('string');
  }
});
