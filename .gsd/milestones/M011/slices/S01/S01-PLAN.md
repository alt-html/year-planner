# S01: SyncClient.js + jsmdma sync API

**Goal:** Create SyncClient.js, rewrite Api.js to POST /year-planner/sync with jsmdma payload shape, update all 9 sync call sites in Vue methods and Storage.js, delete StorageRemote.js, update contexts.js, and verify payload shape with a new Playwright test.
**Demo:** After this: SyncClient.js is CDI-registered; Api.js posts to /year-planner/sync with jsmdma payload shape; StorageRemote.js is gone; Playwright mock test verifies payload shape and passes alongside existing sync-error test.

## Must-Haves

- SyncClient.js is CDI-registered and owns all HLC sync state management; Api.js exposes a single async sync(plannerId) method; StorageRemote.js is gone from the codebase and contexts.js; all 16 existing Playwright tests pass; sync-payload.spec.js passes with payload shape asserted.

## Proof Level

- This slice proves: contract — Playwright mocks the /year-planner/sync endpoint and verifies both payload shape (sync-payload.spec.js) and error-surface behavior (sync-error.spec.js). No live server required.

## Integration Closure

Upstream: data-api-core.esm.js vendor bundle (HLC, flatten, diff, merge, unflatten), storage-schema.js, StorageLocal (getActivePlnrUuid, _getPlnrDoc, getDevId, signedin), AuthProvider._authHeaders(). New wiring: SyncClient registered in CDI context as syncClient; Api constructor takes syncClient instead of storageRemote; StorageLocal exposes getActivePlnrUuid(); Vue methods call api.sync(plannerId) in place of the two old methods. What remains: S02 wires StorageLocal.markEdited() into updateLocalEntry() and other write paths; S03 handles MOD audit cleanup.

## Verification

- SyncClient catches HTTP errors and rethrows with status code so Api.sync can map 404→error.apinotavailable, 401→error.unauthorized, else→error.syncfailed — same model.error surface as before. SyncClient writes sync:{uuid} (serverClock), base:{uuid} (merged snapshot), and rev:{uuid} (field HLC stamps) to localStorage — all inspectable via browser devtools Application tab during manual debugging.

## Tasks

- [x] **T01: Create SyncClient.js and expose StorageLocal.getActivePlnrUuid()** `est:45m`
  Create the new SyncClient.js service that owns all jsmdma HLC sync state management, and add a public getActivePlnrUuid() method to StorageLocal so Vue call sites can resolve the current planner UUID.

Steps:
1. Create `site/js/service/SyncClient.js` with:
   - `import { HLC, flatten, diff, merge, unflatten } from '../vendor/data-api-core.esm.js'`
   - `import { keySync, keyRev, keyBase } from './storage-schema.js'`
   - Constructor: `constructor(model, storageLocal)` — CDI will register this as `syncClient`
   - Field: `this.url = '${api.url}'` (same CDI config injection pattern as Api.js)
   - Field: `this.qualifier = '@alt-html/year-planner/SyncClient'`
   - `markEdited(plannerId, dotPath)`: reads `rev:{plannerId}` from localStorage, ticks HLC with `HLC.tick(clock, Date.now())`, writes back. For S01 this is a working implementation so S02 can call it from updateLocalEntry. Read existing rev, get current clock from sync:{plannerId} or HLC.zero(), tick it, write `rev:{plannerId}[dotPath] = newClock`.
   - `async sync(plannerId, plannerDoc, authHeaders)`: (a) read `sync:{plannerId}` → clientClock (fallback `HLC.zero()`); (b) read `rev:{plannerId}` → fieldRevs (fallback {}); (c) read `base:{plannerId}` → base (fallback {}); (d) build payload `{ clientClock, deviceId: this.storageLocal.getDevId(), changes: [{ id: plannerId, doc: plannerDoc, fieldRevs }] }`; (e) POST `${this.url}year-planner/sync` with authHeaders and JSON payload; (f) on success response `{ serverClock, serverChanges }`: for each serverChange, call `merge(base, { doc: plannerDoc, fieldRevs }, { doc: serverChange.doc, fieldRevs: serverChange.fieldRevs })` to get `{ merged }`; write `base:{plannerId}` = merged; write `sync:{plannerId}` = serverClock; return merged; (g) throw on HTTP error (set err.status for Api to catch).
   - `prune(plannerId)`: removes `rev:{plannerId}`, `base:{plannerId}`, `sync:{plannerId}` from localStorage.
   - fetchJSON helper (same pattern as Api.js) inside SyncClient for the HTTP POST.

2. In `site/js/service/StorageLocal.js`, add one public method after the existing `_findPlnrUuid` method:
   ```js
   getActivePlnrUuid(uid, year) {
       return this._findPlnrUuid(uid, year);
   }
   ```

Constraints:
- SyncClient's `markEdited` stub must be functional (not a no-op) — S02 will call it from updateLocalEntry. The method should write to `rev:{plannerId}` correctly.
- `merge` from data-api-core is exported as `merge` (aliased from merge2 internally): `merge(base, local, remote)` where local/remote are `{ doc, fieldRevs }`. Base is a plain object (the days content from base:{uuid}).
- If serverChanges is empty or absent, skip the merge loop and still write `sync:{plannerId}` = serverClock.
- Use the same fetchJSON function pattern as the existing Api.js (check response.ok, throw with err.status set).
- HLC_ZERO is exported from storage-schema.js — use that instead of `HLC.zero()` for the fallback to avoid re-importing HLC separately.
  - Files: `site/js/service/SyncClient.js`, `site/js/service/StorageLocal.js`
  - Verify: grep -q 'getActivePlnrUuid' site/js/service/StorageLocal.js && test -f site/js/service/SyncClient.js && grep -q 'markEdited' site/js/service/SyncClient.js && grep -q 'year-planner/sync' site/js/service/SyncClient.js

- [x] **T02: Rewrite Api.js, update all 9 call sites, delete StorageRemote.js, update contexts.js** `est:45m`
  Rewrite Api.js to replace the two old sync methods with a single async sync(plannerId) that delegates to syncClient. Update all 9 call sites across Vue methods and Storage.js. Delete StorageRemote.js. Update contexts.js to register SyncClient and remove StorageRemote.

Steps:

1. Rewrite `site/js/service/Api.js`:
   - Constructor: `constructor(model, storageLocal, syncClient, authProvider)` — note: `storageRemote` parameter removed, `syncClient` added
   - Keep: `this.url = '${api.url}'`, `this.qualifier`, `this.model`, `this.storageLocal`, `this.authProvider`
   - Add: `this.syncClient = syncClient`
   - Remove: `this.storageRemote = storageRemote`
   - Keep `_authHeaders()` and `deleteAccount()` unchanged
   - Keep `modalErr()` unchanged
   - Remove `synchroniseToLocal(syncPrefs)` method entirely
   - Remove `synchroniseToRemote()` method entirely
   - Add `async sync(plannerId)` method:
     ```js
     async sync(plannerId) {
         if (!this.storageLocal.signedin() || !plannerId) return;
         try {
             const doc = this.storageLocal._getPlnrDoc(plannerId);
             await this.syncClient.sync(plannerId, doc.days || {}, this._authHeaders());
         } catch (err) {
             if (err.status == 404)
                 this.model.error = 'error.apinotavailable';
             else if (err.status == 401)
                 this.model.error = 'error.unauthorized';
             else
                 this.model.error = 'error.syncfailed';
         }
     }
     ```

2. Update 9 call sites (all become `this.api.sync(plannerId)` with plannerId resolved first):
   - `site/js/vue/methods/lifecycle.js` line 8 in `refresh()`: replace `this.api.synchroniseToLocal(false)` with:
     ```js
     const plannerId = this.storageLocal.getActivePlnrUuid(this.uid, this.year);
     this.api.sync(plannerId);
     ```
   - `site/js/vue/methods/planner.js` line 6 in `createPlanner()`: replace `this.api.synchroniseToLocal(false)` with `const plannerId = this.storageLocal.getActivePlnrUuid(this.uid, this.year); this.api.sync(plannerId);`
   - `site/js/vue/methods/planner.js` line 8 in `createPlanner()`: replace `this.api.synchroniseToRemote()` with `this.api.sync(plannerId);` (reuse the plannerId already resolved above)
   - `site/js/vue/methods/planner.js` line 41 in `showRenamePlanner()`: replace `this.api.synchroniseToLocal(false)` with `const plannerId = this.storageLocal.getActivePlnrUuid(this.uid, this.year); this.api.sync(plannerId);`
   - `site/js/vue/methods/planner.js` line 54 in `renamePlanner()`: replace `this.api.synchroniseToRemote()` with `const plannerId = this.storageLocal.getActivePlnrUuid(this.uid, this.year); this.api.sync(plannerId);`
   - `site/js/vue/methods/auth.js` line 14 in `signInWith()`: replace `this.api.synchroniseToLocal(true)` with `const plannerId = this.storageLocal.getActivePlnrUuid(this.uid, this.year); this.api.sync(plannerId);`
   - `site/js/vue/methods/entries.js` line 8 in `updateEntry()` (inside the `if (syncToRemote)` block): replace `this.api.synchroniseToRemote()` with `const plannerId = this.storageLocal.getActivePlnrUuid(this.uid, this.year); this.api.sync(plannerId);`
   - `site/js/vue/methods/entries.js` line 13 in `updateEntryState()`: replace `this.api.synchroniseToLocal(false)` with `const plannerId = this.storageLocal.getActivePlnrUuid(this.uid, this.year); this.api.sync(plannerId);`
   - `site/js/service/Storage.js` line 42 in `deletePlannerByYear()`: remove `this.api.synchroniseToRemote();` entirely — there is no point syncing a planner that is being deleted locally.

3. Delete `site/js/service/StorageRemote.js` (remove the file entirely).

4. Update `site/js/config/contexts.js`:
   - Add `import SyncClient from '../service/SyncClient.js';` (after the existing service imports)
   - Add `new Singleton(SyncClient),` to the context array
   - Remove `import StorageRemote from '../service/StorageRemote.js';`
   - Remove `new Singleton(StorageRemote),` from the context array

Constraints:
- CDI constructor parameter names must exactly match registered singleton names. The class `SyncClient` registers as `syncClient` (camelCase first letter). The `Api` constructor parameter must be `syncClient` (matching exactly).
- `api.sync()` must guard on BOTH `!this.storageLocal.signedin()` and `!plannerId` — returning silently for either (same silent no-op behavior as the original code when not signed in).
- The `createPlanner()` method in planner.js has BOTH a synchroniseToLocal AND a synchroniseToRemote call — both should be replaced. The plannerId resolution only needs to happen once: resolve before the first call, reuse for the second.
- Do NOT add `await` before `this.api.sync(plannerId)` in Vue methods unless the original call was awaited — the original calls were fire-and-forget. Keep the same pattern.
- The import of `model` at the top of Api.js (used only by `modalErr()`) should be kept.
  - Files: `site/js/service/Api.js`, `site/js/config/contexts.js`, `site/js/service/StorageRemote.js`, `site/js/vue/methods/lifecycle.js`, `site/js/vue/methods/planner.js`, `site/js/vue/methods/auth.js`, `site/js/vue/methods/entries.js`, `site/js/service/Storage.js`
  - Verify: ! test -f site/js/service/StorageRemote.js && grep -q 'syncClient' site/js/service/Api.js && ! grep -q 'storageRemote' site/js/service/Api.js && ! grep -q 'StorageRemote' site/js/config/contexts.js && ! grep -q 'synchroniseToLocal\|synchroniseToRemote' site/js/vue/methods/lifecycle.js site/js/vue/methods/planner.js site/js/vue/methods/auth.js site/js/vue/methods/entries.js site/js/service/Storage.js

- [x] **T03: Update sync-error.spec.js route glob and write sync-payload.spec.js** `est:30m`
  Update the existing sync-error test to intercept the new /year-planner/sync endpoint. Write a new sync-payload.spec.js Playwright test that verifies the jsmdma payload shape (clientClock, deviceId, changes array with id/doc/fieldRevs). Run the full suite and confirm all tests pass.

Steps:

1. Update `.tests/e2e/sync-error.spec.js`:
   - Change the page.route() glob from `'**/api/planner/**'` to `'**/year-planner/sync'`
   - Keep everything else unchanged: SESSION_JSON injection, goto('/'), waitForSelector('[data-app-ready]'), waitForTimeout(1000), expect(.alert-danger).toBeVisible()

2. Write `.tests/e2e/sync-payload.spec.js`:
   ```js
   // .tests/e2e/sync-payload.spec.js
   // Verifies: POST /year-planner/sync carries the correct jsmdma payload shape (D007).
   const { test, expect } = require('../fixtures/cdn');

   const SESSION_JSON = JSON.stringify({"0":"test-uuid","1":0});

   test('sync POST carries jsmdma payload shape (D007)', async ({ page }) => {
     let capturedBody = null;

     // Inject signed-in session. Guard against double-run on navigation with sessionStorage flag.
     await page.addInitScript((sessionData) => {
       if (sessionStorage.getItem('_seeded')) return;
       sessionStorage.setItem('_seeded', '1');
       localStorage.setItem('1', sessionData);
     }, SESSION_JSON);

     // Intercept /year-planner/sync, capture request body, return minimal valid response.
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

     // Wait for the async startup sync to fire
     await page.waitForTimeout(2000);

     // Verify payload was captured and has the correct jsmdma shape
     expect(capturedBody).not.toBeNull();
     expect(typeof capturedBody.clientClock).toBe('string');
     expect(typeof capturedBody.deviceId).toBe('string');
     expect(Array.isArray(capturedBody.changes)).toBe(true);
     if (capturedBody.changes.length > 0) {
       const change = capturedBody.changes[0];
       expect(typeof change.id).toBe('string');
       expect(change.doc !== undefined).toBe(true);
       expect(change.fieldRevs !== undefined).toBe(true);
     }
   });
   ```

3. Run the full test suite and confirm all tests pass:
   ```
   cd .tests && npx playwright test --reporter=line
   ```
   Expected: 17 tests pass (16 existing + 1 new sync-payload test).

Constraints:
- The `addInitScript` guard (`sessionStorage._seeded`) is required per M009 KNOWLEDGE — without it the seed re-runs on app-internal redirects and can cause test flakiness.
- The test navigates to `/?uid=12345&year=2026` so the app has explicit uid+year, avoiding the need to pre-seed a planner. The app's `initialise()` in lifecycle.js runs before `api.sync()` (confirmed in code), creating the planner first. Then `getActivePlnrUuid(12345, 2026)` returns the created UUID, so `api.sync()` fires.
- The waitForTimeout(2000) is intentional — same pattern as sync-error.spec.js (1s) but slightly longer since we're also waiting for planner creation in initialise().
- The payload shape check allows `changes` to be empty (a fresh planner has no entries, so `doc` is empty and changes may be `[{ id, doc: {}, fieldRevs: {} }]` or `[]` depending on implementation). The test should handle both cases — the critical assertion is that the outer shape (clientClock, deviceId, changes array) is always present.
  - Files: `.tests/e2e/sync-error.spec.js`, `.tests/e2e/sync-payload.spec.js`
  - Verify: cd .tests && npx playwright test --reporter=line 2>&1 | grep -E 'passed|failed'

## Files Likely Touched

- site/js/service/SyncClient.js
- site/js/service/StorageLocal.js
- site/js/service/Api.js
- site/js/config/contexts.js
- site/js/service/StorageRemote.js
- site/js/vue/methods/lifecycle.js
- site/js/vue/methods/planner.js
- site/js/vue/methods/auth.js
- site/js/vue/methods/entries.js
- site/js/service/Storage.js
- .tests/e2e/sync-error.spec.js
- .tests/e2e/sync-payload.spec.js
