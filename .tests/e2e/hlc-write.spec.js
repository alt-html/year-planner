// E2E (SYNC-04): HLC dot-path written to rev:{uuid} on day entry edit
// Verifies that after editing a day cell, the rev:{uuid} localStorage key
// contains valid per-field HLC dot-path entries (days.YYYY-MM-DD.{field}).

const { test, expect } = require('../fixtures/cdn');

test('editing a day entry writes HLC dot-path to rev:{uuid} (SYNC-04)', async ({ page }) => {
    // Clear localStorage so initialised() returns false and lifecycle.initialise()
    // runs on mount, creating the planner for uid=12345/year=2026.
    // Guard with sessionStorage flag to avoid re-clearing on app-internal redirects.
    await page.addInitScript(() => {
        if (sessionStorage.getItem('_seeded')) return;
        sessionStorage.setItem('_seeded', '1');
        localStorage.clear();
        // Suppress pester modal so it doesn't intercept clicks in this test
        localStorage.setItem('pester_signin', String(Date.now()));
    });

    await page.goto('/?uid=12345&year=2026');
    await page.waitForSelector('[data-app-ready]');

    // Edit Jan day 1 (same selector pattern as entry-crud.spec.js)
    const janColumn = page.locator('#yp-months .col-12.col-sm-6.col-md-4.col-lg-3.col-xl-1').first();
    const day1Cell = janColumn.locator('.yp-cell').filter({ hasText: /^1\s/ }).first();
    await day1Cell.click();
    await page.waitForSelector('#entryModal.show');
    await page.fill('#yp-entry-textarea', 'HLC test entry');
    await page.click('#entryModal .yp-action-save');
    await expect(page.locator('#entryModal')).not.toBeVisible();

    // Read rev:{uuid} from localStorage
    const revEntry = await page.evaluate(() => {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('rev:')) {
                const raw = localStorage.getItem(key);
                return { key, revs: raw ? JSON.parse(raw) : {} };
            }
        }
        return null;
    });

    expect(revEntry).not.toBeNull();
    const keys = Object.keys(revEntry.revs);
    expect(keys.length).toBeGreaterThan(0);
    // Keys must match days.YYYY-MM-DD.{field} pattern
    const dayKeys = keys.filter(k => /^days\.\d{4}-\d{2}-\d{2}\./.test(k));
    expect(dayKeys.length).toBeGreaterThan(0);
    // Values must be non-empty HLC strings
    for (const k of dayKeys) {
        expect(typeof revEntry.revs[k]).toBe('string');
        expect(revEntry.revs[k].length).toBeGreaterThan(0);
    }
});
