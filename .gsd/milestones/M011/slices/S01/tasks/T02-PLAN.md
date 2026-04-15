---
estimated_steps: 54
estimated_files: 8
skills_used: []
---

# T02: Rewrite Api.js, update all 9 call sites, delete StorageRemote.js, update contexts.js

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

## Inputs

- `site/js/service/SyncClient.js`
- `site/js/service/StorageLocal.js`
- `site/js/service/Api.js`
- `site/js/config/contexts.js`
- `site/js/service/StorageRemote.js`
- `site/js/vue/methods/lifecycle.js`
- `site/js/vue/methods/planner.js`
- `site/js/vue/methods/auth.js`
- `site/js/vue/methods/entries.js`
- `site/js/service/Storage.js`

## Expected Output

- `site/js/service/Api.js`
- `site/js/config/contexts.js`
- `site/js/vue/methods/lifecycle.js`
- `site/js/vue/methods/planner.js`
- `site/js/vue/methods/auth.js`
- `site/js/vue/methods/entries.js`
- `site/js/service/Storage.js`

## Verification

! test -f site/js/service/StorageRemote.js && grep -q 'syncClient' site/js/service/Api.js && ! grep -q 'storageRemote' site/js/service/Api.js && ! grep -q 'StorageRemote' site/js/config/contexts.js && ! grep -q 'synchroniseToLocal\|synchroniseToRemote' site/js/vue/methods/lifecycle.js site/js/vue/methods/planner.js site/js/vue/methods/auth.js site/js/vue/methods/entries.js site/js/service/Storage.js

## Observability Impact

Api.sync catches and maps HTTP error codes to model.error strings (same surface as before). Fire-and-forget call pattern preserved — errors are visible via Vue-rendered .alert-danger element.
