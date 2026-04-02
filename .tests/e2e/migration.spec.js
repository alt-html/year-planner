/**
 * migration.spec.js — E2E test for one-time schema migration (M009)
 *
 * Seeds old-schema localStorage data, reloads the app, and verifies:
 *  - Old keys ('0', uid, uid-yearM) are removed
 *  - New keys (dev, plnr:uuid, prefs:uid) are present
 *  - All day entry data is intact with new field names (tl, col, emoji, notes)
 */
const { test, expect } = require('../fixtures/cdn');

test('migration: old-schema data survives upgrade to M009 schema', async ({ page, context }) => {

  // ── 1. Seed old-schema data before navigation ────────────────────────────
  // addInitScript runs on every navigation including redirects.
  // Use a sessionStorage flag to run the seed only on the first navigation.
  await context.addInitScript(() => {
    if (sessionStorage.getItem('_migration_seeded')) return;
    sessionStorage.setItem('_migration_seeded', '1');

    // Clear M009 state from consent.json to simulate a genuine old-schema install
    localStorage.removeItem('dev');
    // Remove any plnr:, rev:, base:, sync:, ids, prefs: keys
    const toRemove = Object.keys(localStorage).filter(k =>
      k.startsWith('plnr:') || k.startsWith('rev:') || k.startsWith('base:') ||
      k.startsWith('sync:') || k.startsWith('prefs:') || k === 'ids'
    );
    toRemove.forEach(k => localStorage.removeItem(k));

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

    // Old month 3 (March) planner with an entry on day 15
    const march = {};
    march['15'] = { '0': 0, '1': 'test entry', '2': 2, '3': 'some notes', '4': '😀' };
    localStorage.setItem(`${uid}-${year}3`, JSON.stringify(march));

    // Old month 7 (July) planner with an entry on day 4
    const july = {};
    july['4'] = { '0': 1, '1': 'july fourth', '2': 3, '3': '', '4': '🎉' };
    localStorage.setItem(`${uid}-${year}7`, JSON.stringify(july));
  });

  // ── 2. Navigate — migration fires in initialised() ───────────────────────
  await page.goto('http://localhost:8080');
  await page.waitForSelector('[data-app-ready]');

  // ── 3. Old keys must be gone ─────────────────────────────────────────────
  const oldIdentitiesKey = await page.evaluate(() => localStorage.getItem('0'));
  expect(oldIdentitiesKey).toBeNull();

  const oldPrefKey = await page.evaluate(() => localStorage.getItem('1234567890'));
  expect(oldPrefKey).toBeNull();

  const oldMarchKey = await page.evaluate(() => localStorage.getItem('1234567890-20263'));
  expect(oldMarchKey).toBeNull();

  // ── 4. New keys must exist ────────────────────────────────────────────────
  const devKey = await page.evaluate(() => localStorage.getItem('dev'));
  expect(devKey).toBeTruthy();
  expect(devKey).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);

  const prefKeys = await page.evaluate(() =>
    Object.keys(localStorage).filter(k => k.startsWith('prefs:'))
  );
  expect(prefKeys.length).toBeGreaterThan(0);

  // ── 5. Planner data migrated ──────────────────────────────────────────────
  const planners = await page.evaluate(() => {
    return Object.keys(localStorage)
      .filter(k => k.startsWith('plnr:'))
      .map(k => JSON.parse(localStorage.getItem(k)));
  });
  expect(planners.length).toBeGreaterThan(0);

  // ── 6. March 15 entry intact with new field names ─────────────────────────
  const marchEntry = await page.evaluate(() => {
    const planners = Object.keys(localStorage)
      .filter(k => k.startsWith('plnr:'))
      .map(k => JSON.parse(localStorage.getItem(k)));
    for (const p of planners) {
      for (const [isoDate, day] of Object.entries(p.days || {})) {
        if (isoDate === '2026-03-15') return day;
      }
    }
    return null;
  });

  expect(marchEntry).not.toBeNull();
  expect(marchEntry.tl).toBe('test entry');
  expect(marchEntry.col).toBe(2);
  expect(marchEntry.notes).toBe('some notes');
  expect(marchEntry.emoji).toBe('😀');
  // Old numeric keys must NOT be present
  expect(marchEntry['1']).toBeUndefined();
  expect(marchEntry['2']).toBeUndefined();

  // ── 7. July 4 entry intact ────────────────────────────────────────────────
  const julyEntry = await page.evaluate(() => {
    const planners = Object.keys(localStorage)
      .filter(k => k.startsWith('plnr:'))
      .map(k => JSON.parse(localStorage.getItem(k)));
    for (const p of planners) {
      for (const [isoDate, day] of Object.entries(p.days || {})) {
        if (isoDate === '2026-07-04') return day;
      }
    }
    return null;
  });

  expect(julyEntry).not.toBeNull();
  expect(julyEntry.tl).toBe('july fourth');
  expect(julyEntry.tp).toBe(1);
  expect(julyEntry.emoji).toBe('🎉');
});
