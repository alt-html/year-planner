# S02 Research: StorageLocal HLC Write Wiring

**Slice goal:** After `storageLocal.updateLocalEntry()` is called, `localStorage.getItem('rev:' + plannerId)` contains a dot-path entry (e.g. `days.2026-04-09.tl`) with a valid HLC string. All 17 E2E tests pass.

---

## Summary

This is **targeted, straightforward work**. The machinery is already built:

- `SyncClient.markEdited(plannerId, dotPath)` exists and is fully implemented (S01)
- `StorageLocal.updateLocalEntry()` already has `_updateRev()` — a **parallel, independent** fieldRevs write that uses a different HLC tick pattern
- The acceptance criterion is to **replace `_updateRev()` with delegation to `syncClient.markEdited()`** — one call per field, not one bulk tick loop
- `SyncClient` is already CDI-registered. `StorageLocal` does not yet receive it as a constructor parameter.

The main work is: wire `syncClient` into `StorageLocal` constructor, replace `_updateRev()` call in `updateLocalEntry()` with `markEdited()` calls per field, and write the Playwright test that verifies `rev:{uuid}` contains a valid HLC dot-path entry after an edit.

---

## Current State (post-S01)

### StorageLocal._updateRev() — the old method to replace

```js
// site/js/service/StorageLocal.js  lines 195–207
_updateRev(uuid, isoDate, dayObj) {
    const devId = this.getDevId();
    const raw = localStorage.getItem(keyRev(uuid));
    const revs = raw ? JSON.parse(raw) : {};
    const syncRaw = localStorage.getItem(keySync(uuid));
    let clock = syncRaw || HLC.create(devId, Date.now());
    for (const field of [F_TYPE, F_TL, F_COL, F_NOTES, F_EMOJI]) {
        clock = HLC.tick(clock, Date.now());
        revs[`days.${isoDate}.${field}`] = clock;
    }
    localStorage.setItem(keyRev(uuid), JSON.stringify(revs));
}
```

**Problems with the existing `_updateRev`:**
1. Ticks a single shared `clock` sequentially across all 5 fields — produces stamps `t+1, t+2, t+3, t+4, t+5` for every save, even if only one field changed.
2. Does not use per-field history (ignores the existing field stamp in `revs[dotPath]`). This breaks monotonicity: if field A was last edited at `t+100` (from a prior sync), calling `_updateRev` with base clock `t+50` would write `t+51` — *regressing* the field clock.
3. Duplicates logic that `markEdited()` already implements correctly.

### SyncClient.markEdited() — the correct implementation

```js
// site/js/service/SyncClient.js  lines 53–67
markEdited(plannerId, dotPath) {
    const rawRev = localStorage.getItem(keyRev(plannerId));
    const revs = rawRev ? JSON.parse(rawRev) : {};
    const syncRaw = localStorage.getItem(keySync(plannerId));
    const baseClock = syncRaw || HLC_ZERO;
    const existingFieldClock = revs[dotPath] || baseClock;
    const newClock = HLC.tick(existingFieldClock, Date.now());
    revs[dotPath] = newClock;
    localStorage.setItem(keyRev(plannerId), JSON.stringify(revs));
}
```

This is correct: ticks from the **existing field clock** (or baseClock fallback), producing a strictly larger stamp per-field even during offline rapid edits to the same field.

### updateLocalEntry() — the write path

```js
// site/js/service/StorageLocal.js  lines 210–235
updateLocalEntry(mindex, day, entry, entryType, entryColour, notes = '', emoji = '') {
    // ... builds isoDate, finds/creates uuid ...
    this.setLocalPlanner(uuid, year, this.model.planner);
    // Update fieldRevs
    this._updateRev(uuid, isoDate, this.model.planner[mindex][String(day)]);
}
```

This is the **only write path** that needs wiring. There is no `setDayEntry()` method — `updateLocalEntry()` is the canonical write.

### Only call site of updateLocalEntry

```js
// site/js/vue/methods/entries.js  line 6
updateEntry(mindex, day, ...) {
    this.storageLocal.updateLocalEntry(mindex, day, entry, entryType, entryColour, notes, emoji);
    if (syncToRemote) { ... api.sync() ... }
}
```

No other files call `updateLocalEntry()`. Confirmed with `rg`.

---

## Implementation Plan

### What to change

**1. StorageLocal constructor — add `syncClient` parameter**

Current: `constructor(api, model, storage)`
Required: `constructor(api, model, storage, syncClient)`

CDI name must be `syncClient` (camelCase) to match the registered singleton name. CDI resolves by parameter name.

**Important CDI ordering concern:** `SyncClient` constructor takes `(model, storageLocal)` — i.e. SyncClient depends on StorageLocal. StorageLocal would now depend on SyncClient. This is a **circular dependency**.

Mitigation options:
- Option A: Don't inject via constructor. Instead, do a lazy `this.syncClient = null` init in constructor and have StorageLocal access it via late binding. Retrieve `syncClient` from CDI/storage reference at first use.
- Option B: Inject `syncClient` into StorageLocal constructor anyway and rely on CDI lazy init (if CDI defers construction until all singletons are registered). **Check if CDI handles circular deps.**
- Option C: Do NOT inject SyncClient into StorageLocal at all. Instead, call `markEdited()` from the Vue layer in `entries.js` (after `updateLocalEntry()`) rather than inside StorageLocal.

**Checking CDI behavior:** The `@alt-javascript/cdi@3` CDI registers all singletons by class constructor name, then instantiates lazily on first access. Circular deps via constructor injection would deadlock. **Option C is the safest approach for this codebase.**

**Option C — call markEdited in the Vue layer:**

```js
// entries.js — updateEntry()
updateEntry(mindex, day, entry, entryType, entryColour, notes = '', emoji = '') {
    this.storageLocal.updateLocalEntry(mindex, day, entry, entryType, entryColour, notes, emoji);
    // Wire HLC field tracking for sync
    const plannerId = this.storageLocal.getActivePlnrUuid(this.uid, this.year);
    if (plannerId) {
        const year = this.year;
        const month = String(mindex + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        const isoDate = `${year}-${month}-${d}`;
        for (const field of ['tp', 'tl', 'col', 'notes', 'emoji']) {
            this.syncClient.markEdited(plannerId, `days.${isoDate}.${field}`);
        }
    }
    if (syncToRemote) {
        this.api.sync(plannerId);
    }
}
```

Wait — `this.syncClient` would need to be on the Vue app `this`. The Vue methods have access to CDI-registered singletons via the model/app binding. Need to check if `syncClient` is accessible on `this` in Vue methods.

**Actually, looking at the pattern more carefully:**

`entries.js` uses `this.storageLocal`, `this.api`, `this.uid`, `this.year` — all Vue model / CDI singletons injected into the app. `this.syncClient` would be available in Vue if registered.

But the **cleanest approach** is Option D: **inject `syncClient` into StorageLocal as a late-set property**, not via constructor — avoids CDI circular dep. StorageLocal sets `this.syncClient = null` in constructor; contexts.js wires it manually after both are instantiated. But that requires init() lifecycle hooks.

**Simplest correct approach — Option E:**

Leave StorageLocal constructor unchanged. Replace `_updateRev()` body to call out to a `this.syncClient` reference that gets **lazy-set from the CDI container**. Since CDI singletons are all instantiated on first access, and `syncClient` would already exist by the time any Vue method calls `updateLocalEntry()`, a late-binding approach works:

```js
// StorageLocal constructor — add optional param
constructor(api, model, storage, syncClient) {
    ...
    this.syncClient = syncClient || null;
}
```

In `@alt-javascript/cdi@3`, singletons are registered by class and CDI resolves constructor parameters by name. If CDI resolves StorageLocal's params before SyncClient is instantiated (and SyncClient needs StorageLocal), there's a deadlock risk.

**Actually examining the CDI singleton order in contexts.js:**
```
Api, Application, AuthProvider, Storage, StorageLocal, SyncClient
```

CDI with lazy instantiation: StorageLocal is constructed before SyncClient is in `contexts.js` ordering — but CDI typically instantiates all on first access, not at registration time. So StorageLocal would be constructed when first accessed, and by then SyncClient may or may not have been instantiated.

**Resolution: The safest approach for this codebase is to add `syncClient` as an optional 4th constructor param, and replace `_updateRev()` with delegation to `this.syncClient.markEdited()`. CDI@3 constructs singletons lazily (on first get() call), so by the time `updateLocalEntry()` is called from a Vue user interaction, both singletons will have been constructed. Constructor circular dep is only a problem if both are constructed simultaneously at startup, which CDI@3 avoids by deferring until first access.**

This is the recommended approach: it matches the D006 architectural decision ("StorageLocal delegates to SyncClient — not the other way around") and keeps the HLC logic inside the service layer, not the Vue layer.

**2. Remove `_updateRev()`, replace with `syncClient.markEdited()` calls**

In `updateLocalEntry()`, replace:
```js
this._updateRev(uuid, isoDate, this.model.planner[mindex][String(day)]);
```
With:
```js
if (this.syncClient) {
    for (const field of [F_TYPE, F_TL, F_COL, F_NOTES, F_EMOJI]) {
        this.syncClient.markEdited(uuid, `days.${isoDate}.${field}`);
    }
}
```

Then remove the `_updateRev()` method entirely (or keep as private fallback — but removing is cleaner).

**3. Write the Playwright test**

New test file: `.tests/e2e/hlc-write.spec.js`

Pattern: same `localStorage.clear()` + `sessionStorage._seeded` guard from `sync-payload.spec.js`. Navigate to the app, edit a day entry (use same selector pattern as `entry-crud.spec.js`), then read `localStorage.getItem('rev:' + plannerId)` via `page.evaluate()`, assert it contains a dot-path key `days.YYYY-MM-DD.tl` with a string value matching HLC format.

HLC format to validate: A valid HLC string from `data-api-core` looks like `0000000000001-000000-00000000` or similar (wallclock-counter-nodeId). Use a regex `/.+-.+-.+/` or simply `typeof === 'string' && revs[key].length > 0`.

**Key insight from KNOWLEDGE.md / S01:** The test must:
1. `localStorage.clear()` at start of `addInitScript` (guarded by `sessionStorage._seeded`) so `initialise()` runs and creates the planner
2. Navigate to `/?uid=12345&year=2026`
3. Wait for `[data-app-ready]`
4. Click a day cell to trigger `updateEntry` → `updateLocalEntry` → `markEdited`
5. Save the entry
6. Read `localStorage.getItem('rev:' + uuid)` from the page (need to find uuid from `plnr:*` keys)
7. Assert dot-path key with valid HLC string exists

**Getting the UUID in the test:** Use `page.evaluate()` to enumerate `localStorage` keys starting with `plnr:` and return the first UUID, then read `rev:{uuid}`.

---

## Files to Change

| File | Change |
|------|--------|
| `site/js/service/StorageLocal.js` | Add `syncClient` as 4th constructor param; replace `_updateRev()` call with `syncClient.markEdited()` per field; remove `_updateRev()` method |
| `.tests/e2e/hlc-write.spec.js` | New test: edit entry → assert `rev:{uuid}` has dot-path HLC entry |

**No change needed to:**
- `contexts.js` — `SyncClient` already registered
- `site/js/service/SyncClient.js` — `markEdited()` already implemented
- `site/js/config/contexts.js` — no new registrations needed

---

## Circular Dependency Risk Assessment

`SyncClient(model, storageLocal)` → needs StorageLocal  
`StorageLocal(api, model, storage, syncClient)` → would need SyncClient

**CDI@3 behavior:** Singletons are registered at startup but instantiated lazily (on first `.get()` call). Boot order:
- `Application.js` triggers CDI init → singletons are registered but not yet constructed
- Vue mounts → lifecycle `initialise()` runs → `storageLocal.getLocalIdentities()` → StorageLocal is first constructed here
- At that point, CDI constructs StorageLocal's deps: api, model, storage, syncClient — which causes SyncClient to be constructed
- SyncClient's deps: model, storageLocal — storageLocal is **already being constructed** (mid-construction) → potential circular dep deadlock

**This confirms circular injection is risky.** The safe resolution is: **add `syncClient` as an optional param and set `this.syncClient = syncClient || null`**, then verify with a test run whether CDI handles it or deadlocks. If it deadlocks, fall back to Option C (late-set after construction via an explicit init hook).

**However**, looking at the actual CDI@3 behavior: it uses JS class constructors. If StorageLocal is being constructed and CDI tries to construct SyncClient (to inject), and SyncClient needs StorageLocal — CDI would try to get the StorageLocal singleton, which is currently being constructed. In JS, the partially-constructed instance is not yet in the singleton registry, so CDI would try to construct a second StorageLocal, which loops. This **will deadlock or error**.

**Definitive resolution:** Do NOT inject `syncClient` via StorageLocal constructor. Instead:

**Option F — init() lifecycle hook or post-construction setter:**

CDI@3 supports `init()` method called after all singletons are registered. If StorageLocal has an `init()` method, call `this.syncClient = cdiContext.get('syncClient')` there. But this requires importing the CDI context into StorageLocal — adds coupling.

**Option G (recommended) — call markEdited from entries.js Vue layer:**

`entries.js` already has `this.storageLocal` and can be given `this.syncClient` too (both are CDI singletons accessible from Vue). The Vue methods do `this.storageLocal.updateLocalEntry(...)` — just add `this.syncClient.markEdited(...)` calls in the same `updateEntry()` method, after `updateLocalEntry()`. This avoids the circular dep entirely and keeps the Vue layer as the orchestration layer.

```js
// entries.js — final approach
updateEntry(mindex, day, entry, entryType, entryColour, notes = '', emoji = '', syncToRemote = false) {
    this.storageLocal.updateLocalEntry(mindex, day, entry, entryType, entryColour, notes, emoji);
    // Wire HLC field tracking for jsmdma sync (S02)
    const year = this.year;
    const month = String(mindex + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const isoDate = `${year}-${month}-${d}`;
    const plannerId = this.storageLocal.getActivePlnrUuid(this.uid, year);
    if (plannerId) {
        for (const field of ['tp', 'tl', 'col', 'notes', 'emoji']) {
            this.syncClient.markEdited(plannerId, `days.${isoDate}.${field}`);
        }
    }
    if (syncToRemote) {
        this.api.sync(plannerId);
    }
},
```

**But wait: is `this.syncClient` accessible in Vue methods?** The Vue app `this` in Options API gets all CDI singletons merged into it. Check how `this.api`, `this.storageLocal`, etc. are available — they come from the model or CDI method injection pattern.

Looking at `entries.js`: it uses `this.storageLocal`, `this.api`, `this.uid`, `this.year`. The `this` in Vue methods is the component instance. In CDI boot-vue@3, CDI singletons are injected into the Vue app — so `this.syncClient` should be available just like `this.storageLocal` and `this.api`, provided `syncClient` is registered in `contexts.js`. It is already registered. So `this.syncClient` is accessible in Vue methods.

**This is the cleanest, safest approach. No circular dep, no constructor change, aligns with the pattern already established.**

However, there is still the matter of the **existing `_updateRev()` method** in StorageLocal. It currently runs on every `updateLocalEntry()` call and does its own (flawed) HLC writes. If both `_updateRev()` AND `markEdited()` run, they'll write to `rev:{uuid}` twice — the second write wins (overwriting the first in a JSON parse/stringify cycle if they're separate calls). This is fine as long as `markEdited()` is called **after** `updateLocalEntry()` (which calls `_updateRev()` internally). The `markEdited()` calls would overwrite the `_updateRev()` stamps with correct per-field ticks.

But this is still messy. The right fix is to **remove `_updateRev()` from StorageLocal** entirely and keep only `markEdited()` as the fieldRevs writer. To remove `_updateRev()` from StorageLocal without circular dep, just delete it from `updateLocalEntry()` — the call `this._updateRev(uuid, isoDate, ...)` on line 235. Do NOT add syncClient to StorageLocal constructor.

**Final decision: two-file change:**
1. `StorageLocal.js` — remove the `this._updateRev(...)` call from `updateLocalEntry()` (and optionally remove the `_updateRev()` method body)
2. `entries.js` — add `markEdited()` calls per-field after `updateLocalEntry()`
3. `hlc-write.spec.js` — new Playwright test

---

## Test Pattern

```js
// .tests/e2e/hlc-write.spec.js
const { test, expect } = require('../fixtures/cdn');

test('editing a day entry writes HLC dot-path to rev:{uuid} (SYNC-04)', async ({ page }) => {
    // Clean slate — same pattern as sync-payload.spec.js
    await page.addInitScript(() => {
        if (sessionStorage.getItem('_seeded')) return;
        sessionStorage.setItem('_seeded', '1');
        localStorage.clear();
    });

    await page.goto('/?uid=12345&year=2026');
    await page.waitForSelector('[data-app-ready]');

    // Find Jan day 1 cell and open it (same pattern as entry-crud.spec.js)
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
                const uuid = key.slice(4);
                const raw = localStorage.getItem(key);
                const revs = raw ? JSON.parse(raw) : {};
                return { uuid, revs };
            }
        }
        return null;
    });

    expect(revEntry).not.toBeNull();
    // Should have at least one dot-path entry for the edited day
    const keys = Object.keys(revEntry.revs);
    expect(keys.length).toBeGreaterThan(0);
    // Each value should be a non-empty string (HLC format)
    const firstKey = keys[0];
    expect(firstKey).toMatch(/^days\.\d{4}-\d{2}-\d{2}\./);
    expect(typeof revEntry.revs[firstKey]).toBe('string');
    expect(revEntry.revs[firstKey].length).toBeGreaterThan(0);
});
```

---

## Implementation Order

**T01 — StorageLocal + entries.js wiring (30 min)**
1. In `StorageLocal.updateLocalEntry()`: remove the `this._updateRev(...)` call
2. In `StorageLocal`: remove the `_updateRev()` method body (it becomes dead code)
3. In `entries.js updateEntry()`: add the per-field `markEdited()` calls after `updateLocalEntry()`
4. Verify: run all 17 tests pass (no behavior regressions)

**T02 — Playwright test (15 min)**
1. Write `.tests/e2e/hlc-write.spec.js` with the pattern above
2. Run: confirm test passes (18 tests total, 18 pass)

---

## Verification Commands

```bash
# Baseline — should still be 17 pass after T01
cd .tests && npx playwright test --reporter=line

# After T02 — should be 18 pass
cd .tests && npx playwright test --reporter=line

# Structural check
grep -q '_updateRev' site/js/service/StorageLocal.js && echo "FAIL: _updateRev still present" || echo "OK: _updateRev removed"
grep -q 'markEdited' site/js/vue/methods/entries.js && echo "OK: markEdited wired" || echo "FAIL: markEdited missing"
```

---

## Constraints & Gotchas

1. **Circular dep is real** — do not inject `syncClient` into `StorageLocal` constructor; wire from Vue `entries.js` instead
2. **`_updateRev()` must be removed**, not just left as a no-op — if both run, `_updateRev()` writes incorrect sequential timestamps that confuse LWW merge
3. **`this.syncClient` IS accessible in Vue methods** — it's a CDI singleton, same as `this.api` and `this.storageLocal`
4. **Field names**: use string literals `'tp', 'tl', 'col', 'notes', 'emoji'` rather than `F_TYPE` etc. in `entries.js` (which doesn't import them) — or import the constants
5. **`syncToRemote` param**: `updateEntry` has an 8th param `syncToRemote`; the `markEdited` calls should run unconditionally (regardless of syncToRemote flag) since HLC tracking should happen on every edit
6. **Test planner UUID**: test reads `rev:*` key from localStorage — no need to know the UUID in advance; enumerate to find the first `rev:` key
7. **No session needed**: Unlike sync-payload.spec.js, the hlc-write test doesn't need `signedin()` to be true — `markEdited()` is purely localStorage and doesn't check auth
