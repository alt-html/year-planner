---
estimated_steps: 24
estimated_files: 2
skills_used: []
---

# T01: Create SyncClient.js and expose StorageLocal.getActivePlnrUuid()

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

## Inputs

- `site/js/service/StorageLocal.js`
- `site/js/service/storage-schema.js`
- `site/js/vendor/data-api-core.esm.js`

## Expected Output

- `site/js/service/SyncClient.js`
- `site/js/service/StorageLocal.js`

## Verification

grep -q 'getActivePlnrUuid' site/js/service/StorageLocal.js && test -f site/js/service/SyncClient.js && grep -q 'markEdited' site/js/service/SyncClient.js && grep -q 'year-planner/sync' site/js/service/SyncClient.js

## Observability Impact

SyncClient.sync writes sync:{uuid}, base:{uuid}, rev:{uuid} to localStorage on every successful sync — inspectable in browser devtools. Throws with err.status set on HTTP failure so Api.sync can map to model.error.
