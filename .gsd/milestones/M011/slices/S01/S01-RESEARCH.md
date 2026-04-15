# M011/S01 — Research: SyncClient.js + jsmdma sync API

**Date:** 2026-04-09
**Status:** Ready for planning

---

## Summary

S01 is moderate-complexity wiring work on well-understood ground. The jsmdma protocol shape is fully specified in D007, the data-api-core vendor bundle already exports everything needed (`HLC`, `flatten`, `merge`, `diff`, `unflatten`), and `StorageLocal.js` already manages all four key families (`rev:`, `base:`, `sync:`, `plnr:`). The task is to create `SyncClient.js`, rewrite `Api.js`, delete `StorageRemote.js`, update `contexts.js`, and write a Playwright sync payload test.

The one structural complexity worth flagging: `Api.js` currently exposes two methods (`synchroniseToLocal`, `synchroniseToRemote`) called from **9 call sites** across 4 Vue method files and `Storage.js`. These all collapse into a single `api.sync(plannerId)`. The call sites must be updated as part of the `Api.js` rewrite — they are not a separate task. The existing `sync-error.spec.js` test intercepts `**/api/planner/**` — this glob will NOT match the new `/year-planner/sync` endpoint. That test must be updated to intercept the new path.

All 16 existing tests pass on the baseline (confirmed).

## Recommendation

Build in this order:
1. Create `SyncClient.js` — the new service that owns all HLC state management
2. Rewrite `Api.js` — single `sync(plannerId)` method, remove `storageRemote` from constructor, update all 9 call sites in Vue methods
3. Delete `StorageRemote.js`, update `contexts.js`
4. Update `sync-error.spec.js` to intercept `/year-planner/sync`
5. Write new `sync-payload.spec.js` Playwright test verifying payload shape

This order is forced: SyncClient must exist before Api can delegate to it; the existing sync test must be updated before running the full suite.

## Implementation Landscape

### Key Files

- `site/js/service/SyncClient.js` — **does not exist**; must be created. Constructor: `constructor(model, storageLocal)`. CDI will register it as `syncClient` (lowercase first letter of class name — confirmed pattern).

- `site/js/service/Api.js` (111 lines) — rewrite entirely. Remove `storageRemote` from constructor. Replace `synchroniseToLocal(syncPrefs)` + `synchroniseToRemote()` with `async sync(plannerId)`. Keep `deleteAccount()` and `_authHeaders()`. The `url` field uses template literal `'${api.url}'` — preserve this pattern. The `model` import at top of file (`import { model } from "../vue/model.js"`) is only used by `modalErr()` — keep it.

- `site/js/service/StorageRemote.js` (84 lines) — delete entirely. References obsolete `uid-year` schema throughout: `data[uid + '-' + year]`, `data['0']` for identities, etc. Confirmed dead.

- `site/js/config/contexts.js` — update: add `import SyncClient from '../service/SyncClient.js'`, add `new Singleton(SyncClient)`, remove `import StorageRemote` and `new Singleton(StorageRemote)`.

- `site/js/service/StorageLocal.js` (633 lines) — add `markEdited(plannerId, dotPath)` public method that delegates to `syncClient.markEdited()`. This is an S01 task (the interface contract), not S02. S02 wires the actual call sites inside `updateLocalEntry()` and other write methods. Note: `StorageLocal` already has `_updateRev()` which stamps ALL fields at once — this is not the same as per-field HLC tracking via `markEdited()`. S02 will need to reconcile this.

- `site/js/vue/methods/lifecycle.js` — `this.api.synchroniseToLocal(false)` → `this.api.sync(plannerId)` (need to resolve `plannerId` from `this.storageLocal._findPlnrUuid(this.uid, this.year)`)

- `site/js/vue/methods/planner.js` — 4 call sites: `synchroniseToLocal(false)` (×2) and `synchroniseToRemote()` (×2)

- `site/js/vue/methods/auth.js` — `this.api.synchroniseToLocal(true)` → `this.api.sync(plannerId)`

- `site/js/vue/methods/entries.js` — `synchroniseToRemote()` + `synchroniseToLocal(false)` call sites

- `site/js/service/Storage.js` — `this.api.synchroniseToRemote()` in `deletePlannerByYear()`

- `.tests/e2e/sync-error.spec.js` — **MUST be updated**: currently intercepts `**/api/planner/**`; new endpoint is `/year-planner/sync`. The route glob must change to `**/year-planner/sync` (or `**sync**`). Session inject and error-alert check remain the same.

- `.tests/e2e/sync-payload.spec.js` — **new file**; Playwright test with mocked `/year-planner/sync`; verifies `{ clientClock, deviceId, changes: [{ id, doc, fieldRevs }] }` shape.

### Build Order

1. **`SyncClient.js`** — unblocks everything. Contains `markEdited(plannerId, dotPath)`, `async sync(plannerId, plannerDoc, authHeaders)`, `prune(plannerId)`. Reads `sync:{uuid}` fresh each call, uses `HLC.tick()` for clock advance, builds the payload, POSTs to `/year-planner/sync`, applies `merge(base, local, remote)` to server delta, writes `base:{uuid}` and `sync:{uuid}` after success.

2. **`Api.js` rewrite + call sites** — once `SyncClient.js` exists, rewrite `Api.js` to inject `syncClient` via CDI constructor, implement `async sync(plannerId)` delegating to `syncClient.sync(...)`. Update all 9 call sites across Vue methods and `Storage.js`. The call sites need to resolve the current planner UUID — use `this.storageLocal._findPlnrUuid(this.uid, this.year)` (or expose a public accessor).

3. **`StorageRemote.js` deletion + `contexts.js` update** — once `Api.js` no longer references `storageRemote`, it's safe to delete. Update contexts.js atomically.

4. **`StorageLocal.markEdited()` stub** — add the public delegation method. The real wiring into `updateLocalEntry()` is S02, but the method signature must exist for `SyncClient` to be importable without errors.

5. **Test updates** — update `sync-error.spec.js` route intercept; write `sync-payload.spec.js`.

### Verification Approach

```bash
# After each step, run the full test suite:
cd .tests && npx playwright test --reporter=line

# Final verification:
# 1. All 16 existing tests pass
# 2. sync-payload.spec.js passes (payload shape confirmed)
# 3. StorageRemote.js absent: ls site/js/service/StorageRemote.js → not found
# 4. contexts.js has no StorageRemote reference: grep -n 'StorageRemote' site/js/config/contexts.js → empty
```

---

## Constraints

- **CDI constructor parameter names must exactly match registered singleton names.** `SyncClient` class → CDI registers as `syncClient`. So `Api.js` constructor parameter must be named `syncClient`, `StorageLocal.js` must have a `syncClient` parameter added if it needs to call `markEdited`. But wait — `StorageLocal` currently has `constructor(api, model, storage)` — adding `syncClient` as a parameter introduces a circular dependency risk (`api` needs `syncClient`, `storageLocal` needs `syncClient`, `syncClient` needs `storageLocal`). **This is the key architectural risk** (see Open Risks below).

- **No bundler** — `SyncClient.js` must use ES module `import` of `data-api-core.esm.js` via relative path `../vendor/data-api-core.esm.js`, same as `storage-schema.js` does.

- **`data-api-core.esm.js` vendor bundle** — exports: `HLC`, `flatten`, `unflatten`, `merge` (as `merge2` internally), `diff`, `textMerge`. The `merge` export signature is `merge(base, local, remote)` where `local` and `remote` are `{ doc: object, fieldRevs: object }` objects. This is confirmed from the bundle source.

- **`HLC.zero()`** returns `"0000000000000-000000-00000000"` — valid zero clock string used when `sync:{uuid}` is absent.

- **`_findPlnrUuid()` is private** on `StorageLocal` — the call sites in Vue methods will need a way to get the current planner UUID. Consider exposing `getActivePlnrUuid(uid, year)` as a public method, or have `api.sync()` call `storageLocal._findPlnrUuid()` directly (tolerated in this codebase — no strict privacy enforcement in JS).

## Common Pitfalls

- **Circular CDI dependency** — `SyncClient(model, storageLocal)` is safe; `StorageLocal(api, model, storage)` is safe; `Api(model, storageLocal, syncClient, authProvider)` is safe. The circular risk is if `StorageLocal` also injects `syncClient`. Resolve: `StorageLocal.markEdited()` should be a no-op stub in S01 (just the method signature). S02 will wire the actual delegation — and at that point, `syncClient` must be added to `StorageLocal`'s constructor, which means `storageLocal → syncClient → storageLocal`. CDI @alt-javascript/cdi@3 uses lazy proxy injection to resolve circular dependencies — confirmed by the fact that `StorageLocal` already injects `api` and `Api` injects `storageLocal` (mutual dependency already exists and works). So adding `syncClient` to `StorageLocal`'s constructor should also work via the same lazy proxy mechanism.

- **`sync-error.spec.js` will fail immediately after Api rewrite** — the route glob `**/api/planner/**` won't match `/year-planner/sync`. Update it in the same commit as the Api rewrite.

- **`synchroniseToLocal(syncPrefs)` had a `syncPrefs` boolean** — the `syncPrefs` flag controlled whether preferences were synced from the server response (`storageRemote.synchroniseLocalPlanners(body.data, syncPrefs)`). This concept disappears with the jsmdma payload — all changes come back via `serverChanges`. The call sites that pass `true` (auth.js) vs `false` (everywhere else) can all just become `api.sync(plannerId)` with no boolean.

- **`deletePlannerByYear` in `Storage.js` calls `synchroniseToRemote()`** — this should arguably just be skipped (you're deleting the planner, no point syncing it). Consider leaving it as a no-op or removing the sync call entirely rather than calling `api.sync()`.

- **`api.url` is the template literal string `'${api.url}'`** — this is a CDI config injection pattern, not a JS template literal. The `url` field gets populated at runtime by the CDI container reading config. Keep this pattern in the rewritten `Api.js`.

## Open Risks

- **CDI circular dependency: `StorageLocal` ↔ `SyncClient`** — In S01, `StorageLocal.markEdited()` is a stub that doesn't need `syncClient` injected yet. S02 will need to add `syncClient` to `StorageLocal`'s constructor. Before S02, verify that `@alt-javascript/cdi@3` handles this lazy proxy correctly (it already resolves `StorageLocal → Api → StorageLocal` today, so the pattern works — but adding a third node to the cycle is worth double-checking).

- **Call site resolution of `plannerId`** — 9 call sites in Vue methods need to pass the current planner UUID to `api.sync()`. The `model.uid` + `model.year` are always available in Vue method context, so `storageLocal._findPlnrUuid(this.uid, this.year)` works, but it's a private method call. Cleaner: expose `storageLocal.getActivePlnrUuid()` as a public method in this slice.

- **`sync:{uuid}` may be absent on planners created before `_createPlnr()` was updated in M009** — `HLC.zero()` fallback in `SyncClient.sync()` handles this correctly per the architectural decision. Verify the fallback path in the payload test.
