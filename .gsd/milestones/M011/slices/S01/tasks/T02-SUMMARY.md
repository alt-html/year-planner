---
id: T02
parent: S01
milestone: M011
key_files:
  - site/js/service/Api.js
  - site/js/config/contexts.js
  - site/js/vue/methods/lifecycle.js
  - site/js/vue/methods/planner.js
  - site/js/vue/methods/auth.js
  - site/js/vue/methods/entries.js
  - site/js/service/Storage.js
key_decisions:
  - Kept module-level fetchJSON in Api.js so deleteAccount() can still use it — SyncClient has its own internal fetchJSON
  - Storage.js deletePlannerByYear: removed synchroniseToRemote entirely — no point syncing a planner being deleted
  - Fire-and-forget call pattern preserved for all Vue method call sites (no await added, matching original behavior)
duration: 
verification_result: passed
completed_at: 2026-04-09T10:49:46.898Z
blocker_discovered: false
---

# T02: Rewrote Api.js with a single async sync(plannerId) method, replaced all 9 old synchroniseToLocal/synchroniseToRemote call sites, deleted StorageRemote.js, and registered SyncClient in contexts.js

**Rewrote Api.js with a single async sync(plannerId) method, replaced all 9 old synchroniseToLocal/synchroniseToRemote call sites, deleted StorageRemote.js, and registered SyncClient in contexts.js**

## What Happened

Read all 10 input files before making changes. Rewrote Api.js: replaced constructor(model, storageLocal, storageRemote, authProvider) with constructor(model, storageLocal, syncClient, authProvider), removed both old sync methods, and added async sync(plannerId) that guards on signedin+plannerId, calls this.syncClient.sync(), and maps HTTP errors to model.error strings (404→apinotavailable, 401→unauthorized, else→syncfailed). Kept fetchJSON at module level so deleteAccount() can continue using it. Updated all 9 call sites across 5 files. Deleted StorageRemote.js. Updated contexts.js to add SyncClient and remove StorageRemote. All 9 smoke tests continue to pass.

## Verification

Ran the task-plan composite verification command (StorageRemote.js absent, syncClient present in Api.js, storageRemote absent from Api.js, StorageRemote absent from contexts.js, no old sync method names in any of the 5 call-site files) — all checks passed. Then ran 9 Playwright smoke tests — all passed in 4.8s.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `! test -f site/js/service/StorageRemote.js && grep -q 'syncClient' site/js/service/Api.js && ! grep -q 'storageRemote' site/js/service/Api.js && ! grep -q 'StorageRemote' site/js/config/contexts.js && ! grep -q 'synchroniseToLocal|synchroniseToRemote' site/js/vue/methods/lifecycle.js site/js/vue/methods/planner.js site/js/vue/methods/auth.js site/js/vue/methods/entries.js site/js/service/Storage.js` | 0 | ✅ pass | 75ms |
| 2 | `cd .tests && npx playwright test smoke/ --reporter=line` | 0 | ✅ pass | 4800ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `site/js/service/Api.js`
- `site/js/config/contexts.js`
- `site/js/vue/methods/lifecycle.js`
- `site/js/vue/methods/planner.js`
- `site/js/vue/methods/auth.js`
- `site/js/vue/methods/entries.js`
- `site/js/service/Storage.js`
