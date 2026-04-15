---
estimated_steps: 42
estimated_files: 1
skills_used: []
---

# T02: Write hlc-write.spec.js Playwright test and confirm 18 tests pass

Write `.tests/e2e/hlc-write.spec.js` that edits a day entry and asserts the `rev:{uuid}` localStorage key contains valid per-field HLC dot-path entries.

Test pattern (follow `entry-crud.spec.js` — no localStorage.clear() needed because globalSetup seeds the planner):

```js
// .tests/e2e/hlc-write.spec.js
const { test, expect } = require('../fixtures/cdn');

test('editing a day entry writes HLC dot-path to rev:{uuid} (SYNC-04)', async ({ page }) => {
    await page.goto('/?uid=12345&year=2026');
    await page.waitForSelector('[data-app-ready]');

    // Edit Jan day 1 (same selector pattern as entry-crud.spec.js)
    const janColumn = page.locator('#yp-months .col-xs-12.col-sm-6.col-md-4.col-lg-3.col-xl-1').first();
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
```

After writing, run the full test suite and confirm 18 tests pass (17 from S01 + this new one).

If the test fails because `rev:*` key is absent, the most likely cause is that T01 wiring is not working — check that `syncClient` appears in `model.js` and that `markEdited` is being called in `entries.js`.

## Inputs

- `site/js/vue/methods/entries.js`
- `site/js/service/SyncClient.js`
- `.tests/e2e/entry-crud.spec.js`
- `.tests/fixtures/cdn.js`

## Expected Output

- `.tests/e2e/hlc-write.spec.js`

## Verification

cd .tests && npx playwright test --reporter=line 2>&1 | tail -5
