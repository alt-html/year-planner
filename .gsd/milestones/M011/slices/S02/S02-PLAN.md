# S02: StorageLocal HLC write wiring

**Goal:** Wire SyncClient.markEdited() into every StorageLocal write path so that editing any day entry writes a correct per-field HLC dot-path entry to rev:{uuid} in localStorage. Remove the flawed _updateRev() method.
**Demo:** After this: editing any day entry writes a dot-path HLC entry to rev:{uuid} in localStorage; Playwright test confirms this; all 14 E2E tests pass.

## Must-Haves

- `.tests/e2e/hlc-write.spec.js` passes: after editing a day entry, `localStorage.getItem('rev:{uuid}')` contains keys matching `days.YYYY-MM-DD.{field}` with valid non-empty HLC strings
- `_updateRev` is gone from `StorageLocal.js`
- `markEdited` calls appear in `entries.js`
- All 18 Playwright tests pass (17 existing + 1 new)

## Proof Level

- This slice proves: Integration — real browser localStorage writes verified by Playwright

## Integration Closure

S02 closes the write-path gap: markEdited() was built in S01 but never called on edits. After S02, fieldRevs in sync payloads will contain real per-field HLC stamps instead of empty {}.

## Verification

- Browser devtools Application tab: rev:{uuid} localStorage key now populated with per-field HLC entries after any day edit.

## Tasks

- [x] **T01: Wire markEdited into entry write path (model.js, StorageLocal.js, entries.js)** `est:25m`
  Three surgical edits that replace the flawed _updateRev() with correct delegation to syncClient.markEdited().

1. **model.js** — add `syncClient: null` so the CDI-injected singleton is accessible as `this.syncClient` in all Vue methods (same pattern as `api: null` and `storageLocal: null` already there).

2. **StorageLocal.js** — remove the `this._updateRev(...)` call at the end of `updateLocalEntry()` (line ~235), then delete the `_updateRev()` method body (lines ~195–207). No constructor change needed — avoids the circular CDI dependency documented in S02-RESEARCH.md.

3. **entries.js** — in `updateEntry()`, after `this.storageLocal.updateLocalEntry(...)`, add HLC tracking:
```js
// Wire HLC field tracking for jsmdma sync (SYNC-04)
const year = this.year;
const month = String(mindex + 1).padStart(2, '0');
const d = String(day).padStart(2, '0');
const isoDate = `${year}-${month}-${d}`;
const plannerId = this.storageLocal.getActivePlnrUuid(this.uid, year);
if (plannerId && this.syncClient) {
    for (const field of ['tp', 'tl', 'col', 'notes', 'emoji']) {
        this.syncClient.markEdited(plannerId, `days.${isoDate}.${field}`);
    }
}
```
Then update the `if (syncToRemote)` block below to reuse the `plannerId` already computed:
```js
if (syncToRemote) {
    this.api.sync(plannerId);
}
```

Important constraints:
- Use string literals `'tp', 'tl', 'col', 'notes', 'emoji'` — entries.js does not import storage-schema.js constants
- Guard with `if (plannerId && this.syncClient)` for safety against null state
- markEdited runs unconditionally (regardless of syncToRemote) — HLC tracking must happen on every edit, not only when signed in
- The plannerId computed here replaces the separate `getActivePlnrUuid` call inside the old `if (syncToRemote)` block — consolidate to one call
  - Files: `site/js/vue/model.js`, `site/js/service/StorageLocal.js`, `site/js/vue/methods/entries.js`
  - Verify: grep -q 'syncClient' site/js/vue/model.js && echo OK: model.js has syncClient; grep -q '_updateRev' site/js/service/StorageLocal.js && echo FAIL: _updateRev still present || echo OK: _updateRev removed; grep -q 'markEdited' site/js/vue/methods/entries.js && echo OK: markEdited wired || echo FAIL: markEdited missing; cd .tests && npx playwright test --reporter=line

- [x] **T02: Write hlc-write.spec.js Playwright test and confirm 18 tests pass** `est:20m`
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
  - Files: `.tests/e2e/hlc-write.spec.js`
  - Verify: cd .tests && npx playwright test --reporter=line 2>&1 | tail -5

## Files Likely Touched

- site/js/vue/model.js
- site/js/service/StorageLocal.js
- site/js/vue/methods/entries.js
- .tests/e2e/hlc-write.spec.js
