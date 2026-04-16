/**
 * migration.spec.js — E2E test for legacy-key pruning behavior.
 *
 * Legacy numeric schema parsing/migration has been removed.
 * The app now prunes unsupported old keys and bootstraps fresh modern state.
 */
const { test, expect } = require('../fixtures/cdn');

test('legacy numeric schema is pruned and app reinitializes modern state', async ({ page, context }) => {

  // ── 1. Seed old-schema data before navigation ────────────────────────────
  await context.addInitScript(() => {
    if (sessionStorage.getItem('_migration_seeded')) return;
    sessionStorage.setItem('_migration_seeded', '1');

    localStorage.clear();

    const uid  = 1234567890;
    const year = 2026;

    // Old identities array (key '0')
    localStorage.setItem('0', JSON.stringify([
      { 0: uid, 1: 'TestAgent/1.0', 2: 0, 3: 0 },
    ]));

    // Old preferences (key = String(uid))
    localStorage.setItem(String(uid), JSON.stringify({
      0: year, 1: 'en', 2: 0,
      3: { [String(year)]: { en: 'My Migrated Planner' } },
    }));

    // Old month keys (uid-yearMonth)
    const march = {};
    march['15'] = { '0': 0, '1': 'test entry', '2': 2, '3': 'some notes', '4': '😀' };
    localStorage.setItem(`${uid}-${year}3`, JSON.stringify(march));

    const july = {};
    july['4'] = { '0': 1, '1': 'july fourth', '2': 3, '3': '', '4': '🎉' };
    localStorage.setItem(`${uid}-${year}7`, JSON.stringify(july));
  });

  // ── 2. Navigate — app should boot cleanly ────────────────────────────────
  await page.goto('http://localhost:8080');
  await page.waitForSelector('[data-app-ready]');

  // ── 3. Legacy keys are pruned ────────────────────────────────────────────
  const oldIdentitiesKey = await page.evaluate(() => localStorage.getItem('0'));
  expect(oldIdentitiesKey).toBeNull();

  const oldPrefKey = await page.evaluate(() => localStorage.getItem('1234567890'));
  expect(oldPrefKey).toBeNull();

  const oldMarchKey = await page.evaluate(() => localStorage.getItem('1234567890-20263'));
  expect(oldMarchKey).toBeNull();

  const oldJulyKey = await page.evaluate(() => localStorage.getItem('1234567890-20267'));
  expect(oldJulyKey).toBeNull();

  // ── 4. Modern keys are initialized ───────────────────────────────────────
  const devKey = await page.evaluate(() => localStorage.getItem('dev'));
  expect(devKey).toBeTruthy();
  expect(devKey).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);

  const prefPayload = await page.evaluate((dk) => {
    try {
      return JSON.parse(localStorage.getItem(`prefs:${dk}`));
    } catch (e) {
      return null;
    }
  }, devKey);

  expect(prefPayload).toBeTruthy();
  expect(prefPayload.year).toBeDefined();
  expect(prefPayload.lang).toMatch(/^(en|zh|hi|ar|es|pt|fr|ru|id|ja)$/);
  expect(prefPayload.theme).toMatch(/^(light|dark)$/);
  expect(prefPayload.names).toBeDefined();

  // ── 5. Old day entries are not migrated into planner docs ────────────────
  const hasOldEntries = await page.evaluate(() => {
    const planners = Object.keys(localStorage)
      .filter(k => k.startsWith('plnr:'))
      .map(k => {
        try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; }
      })
      .filter(Boolean);

    return planners.some((p) => (p?.days && (p.days['2026-03-15'] || p.days['2026-07-04'])));
  });

  expect(hasOldEntries).toBe(false);
});
