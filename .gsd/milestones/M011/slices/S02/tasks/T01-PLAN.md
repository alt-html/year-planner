---
estimated_steps: 28
estimated_files: 3
skills_used: []
---

# T01: Wire markEdited into entry write path (model.js, StorageLocal.js, entries.js)

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

## Inputs

- `site/js/vue/model.js`
- `site/js/service/StorageLocal.js`
- `site/js/vue/methods/entries.js`
- `site/js/service/SyncClient.js`

## Expected Output

- `site/js/vue/model.js`
- `site/js/service/StorageLocal.js`
- `site/js/vue/methods/entries.js`

## Verification

grep -q 'syncClient' site/js/vue/model.js && echo OK: model.js has syncClient; grep -q '_updateRev' site/js/service/StorageLocal.js && echo FAIL: _updateRev still present || echo OK: _updateRev removed; grep -q 'markEdited' site/js/vue/methods/entries.js && echo OK: markEdited wired || echo FAIL: markEdited missing; cd .tests && npx playwright test --reporter=line
