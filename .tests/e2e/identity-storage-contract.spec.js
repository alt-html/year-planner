/**
 * identity-storage-contract.spec.js
 *
 * Regression coverage for the storage identity contract (M013/S01/T01):
 *  - Bootstrap writes prefs under prefs:${userKey} (device UUID or JWT UUID)
 *  - Planner document metadata retains meta.userKey
 *  - No numeric uid key is required for app start
 *  - Malformed/missing preference payloads are handled gracefully
 *  - Multiple planners with mixed old/new metadata normalise without data loss
 */
const { test, expect } = require('../fixtures/cdn');

// UUID v4 pattern
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// ── Helper: clear storage before each test ───────────────────────────────────

async function clearStorage(context) {
  await context.addInitScript(() => {
    if (sessionStorage.getItem('_contract_cleared')) return;
    sessionStorage.setItem('_contract_cleared', '1');
    localStorage.clear();
  });
}

// ── Happy-path tests ─────────────────────────────────────────────────────────

test('fresh boot: prefs stored under prefs:${deviceUUID}', async ({ page, context }) => {
  await clearStorage(context);

  await page.goto('http://localhost:8080');
  await page.waitForSelector('[data-app-ready]');

  const devKey = await page.evaluate(() => localStorage.getItem('dev'));
  expect(devKey).toBeTruthy();
  expect(devKey).toMatch(UUID_RE);

  const prefKeys = await page.evaluate(() =>
    Object.keys(localStorage).filter(k => k.startsWith('prefs:'))
  );
  expect(prefKeys.length).toBeGreaterThan(0);

  // prefs key must be UUID-format, not a numeric uid
  for (const pk of prefKeys) {
    const part = pk.slice('prefs:'.length);
    expect(part).toMatch(UUID_RE);
  }

  // prefs key must match the device UUID
  expect(prefKeys).toContain(`prefs:${devKey}`);

  // prefs payload should use named fields (no numeric aliases)
  const prefPayload = await page.evaluate((key) => {
    try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
  }, `prefs:${devKey}`);
  expect(prefPayload).not.toBeNull();
  expect(prefPayload.year).toBeDefined();
  expect(prefPayload.lang).toBeDefined();
  expect(prefPayload.theme).toMatch(/^(light|dark)$/);
  expect(prefPayload.names).toBeDefined();
  expect(prefPayload['0']).toBeUndefined();
  expect(prefPayload['1']).toBeUndefined();
  expect(prefPayload['2']).toBeUndefined();
  expect(prefPayload['3']).toBeUndefined();
});

test('fresh boot: planner document metadata contains userKey', async ({ page, context }) => {
  await clearStorage(context);

  await page.goto('http://localhost:8080');
  await page.waitForSelector('[data-app-ready]');

  const planners = await page.evaluate(() =>
    Object.keys(localStorage)
      .filter(k => k.startsWith('plnr:'))
      .map(k => {
        try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; }
      })
      .filter(Boolean)
  );
  expect(planners.length).toBeGreaterThan(0);

  for (const p of planners) {
    expect(p.meta).toBeDefined();
    expect(p.meta.userKey).toBeDefined();
    expect(p.meta.userKey).toMatch(UUID_RE);
  }
});

test('fresh boot: no numeric uid key required for app start', async ({ page, context }) => {
  await clearStorage(context);

  await page.goto('http://localhost:8080');
  await page.waitForSelector('[data-app-ready]');

  // Legacy '0' key must not exist
  const legacyKey = await page.evaluate(() => localStorage.getItem('0'));
  expect(legacyKey).toBeNull();

  // No prefs stored under a purely numeric key (prefs:1234567890)
  const numericPrefKeys = await page.evaluate(() =>
    Object.keys(localStorage).filter(k => k.startsWith('prefs:') && /^\d+$/.test(k.slice(6)))
  );
  expect(numericPrefKeys).toHaveLength(0);
});

// ── Migration: numeric prefs key is migrated to UUID key ────────────────────

test('_migratePrefsKey: prefs:${numericUid} is migrated to prefs:${deviceUUID}', async ({ page, context }) => {
  await context.addInitScript(() => {
    if (sessionStorage.getItem('_contract_cleared')) return;
    sessionStorage.setItem('_contract_cleared', '1');
    localStorage.clear();

    const deviceUUID = '12345678-abcd-4000-8000-000000000001';
    localStorage.setItem('dev', deviceUUID);
    // Seed a numeric-uid prefs key (legacy state after old migration)
    localStorage.setItem('prefs:9876543210', JSON.stringify({
      year: 2025, lang: 'fr', theme: 'dark', dark: true, names: null,
    }));
  });

  await page.goto('http://localhost:8080');
  await page.waitForSelector('[data-app-ready]');

  // Old numeric key must be gone
  const oldKey = await page.evaluate(() => localStorage.getItem('prefs:9876543210'));
  expect(oldKey).toBeNull();

  // New UUID key must exist and be normalized to named fields
  const newPrefs = await page.evaluate(() => {
    try {
      return JSON.parse(localStorage.getItem('prefs:12345678-abcd-4000-8000-000000000001'));
    } catch (e) {
      return null;
    }
  });
  expect(newPrefs).toBeTruthy();
  expect(newPrefs.year).toBe(2025);
  expect(newPrefs.lang).toBe('fr');
  expect(newPrefs.theme).toBe('dark');
  expect(newPrefs['0']).toBeUndefined();
  expect(newPrefs['1']).toBeUndefined();
  expect(newPrefs['2']).toBeUndefined();
  expect(newPrefs['3']).toBeUndefined();
  expect(newPrefs.dark).toBeUndefined();
});

// ── Negative tests ───────────────────────────────────────────────────────────

test('malformed JSON in prefs key does not crash app', async ({ page, context }) => {
  await context.addInitScript(() => {
    if (sessionStorage.getItem('_contract_cleared')) return;
    sessionStorage.setItem('_contract_cleared', '1');
    localStorage.clear();

    const deviceUUID = '12345678-abcd-4000-8000-000000000002';
    localStorage.setItem('dev', deviceUUID);
    localStorage.setItem(`prefs:${deviceUUID}`, 'not-valid-json{{{');
  });

  await page.goto('http://localhost:8080');
  // App must reach ready state without crashing
  await page.waitForSelector('[data-app-ready]');
});

test('missing prefs after bootstrap: defaults are written on refresh', async ({ page, context }) => {
  await context.addInitScript(() => {
    if (sessionStorage.getItem('_contract_cleared')) return;
    sessionStorage.setItem('_contract_cleared', '1');
    localStorage.clear();
    // dev exists but no prefs
    localStorage.setItem('dev', '12345678-abcd-4000-8000-000000000003');
  });

  await page.goto('http://localhost:8080');
  await page.waitForSelector('[data-app-ready]');

  // Prefs must be written by setLocalFromModel during refresh
  const prefKeys = await page.evaluate(() =>
    Object.keys(localStorage).filter(k => k.startsWith('prefs:'))
  );
  expect(prefKeys.length).toBeGreaterThan(0);
});

test('malformed planner doc (missing meta) does not crash app', async ({ page, context }) => {
  await context.addInitScript(() => {
    if (sessionStorage.getItem('_contract_cleared')) return;
    sessionStorage.setItem('_contract_cleared', '1');
    localStorage.clear();

    const deviceUUID = '12345678-abcd-4000-8000-000000000004';
    localStorage.setItem('dev', deviceUUID);
    // Planner with missing meta
    localStorage.setItem('plnr:00000000-0000-0000-0000-000000000099', JSON.stringify({
      days: { '2026-03-01': { tl: 'test', tp: 0, col: 0, notes: '', emoji: '' } },
    }));
  });

  await page.goto('http://localhost:8080');
  await page.waitForSelector('[data-app-ready]');
});

// ── Boundary: multiple planners with mixed old/new metadata ──────────────────

test('multiple planners: mixed old/new metadata normalises without data loss', async ({ page, context }) => {
  await context.addInitScript(() => {
    if (sessionStorage.getItem('_contract_cleared')) return;
    sessionStorage.setItem('_contract_cleared', '1');
    localStorage.clear();

    const userKey = '12345678-abcd-4000-8000-000000000005';
    localStorage.setItem('dev', userKey);

    // Planner 1: already has userKey
    localStorage.setItem('plnr:00000000-0000-0000-0000-000000000011', JSON.stringify({
      meta: { userKey, year: 2026, lang: 'en', theme: 'light', created: Date.now() },
      days: { '2026-01-01': { tl: 'New Year', tp: 0, col: 0, notes: '', emoji: '' } },
    }));

    // Planner 2: old format — uid present but no userKey (should be migrated by _migrateUserKey)
    localStorage.setItem('plnr:00000000-0000-0000-0000-000000000022', JSON.stringify({
      meta: { uid: 1234567890, year: 2025, lang: 'en', theme: 'light', created: Date.now() },
      days: { '2025-06-15': { tl: 'Summer', tp: 0, col: 0, notes: '', emoji: '' } },
    }));
  });

  await page.goto('http://localhost:8080');
  await page.waitForSelector('[data-app-ready]');

  const planners = await page.evaluate(() =>
    Object.keys(localStorage)
      .filter(k => k.startsWith('plnr:'))
      .map(k => {
        try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; }
      })
      .filter(Boolean)
  );

  expect(planners).toHaveLength(2);

  // Both planners must have userKey after migration
  for (const p of planners) {
    expect(p.meta?.userKey).toBeDefined();
    expect(p.meta.userKey).toMatch(UUID_RE);
  }

  // Day entries must not be lost
  const allDays = planners.flatMap(p => Object.entries(p.days || {}));
  const hasNewYear = allDays.some(([d, v]) => d === '2026-01-01' && v.tl === 'New Year');
  const hasSummer  = allDays.some(([d, v]) => d === '2025-06-15' && v.tl === 'Summer');
  expect(hasNewYear).toBe(true);
  expect(hasSummer).toBe(true);
});
