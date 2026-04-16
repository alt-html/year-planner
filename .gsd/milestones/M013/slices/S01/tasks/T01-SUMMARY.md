---
id: T01
parent: S01
milestone: M013
key_files:
  - site/js/service/storage-schema.js
  - site/js/service/StorageLocal.js
  - site/js/service/Storage.js
  - site/js/vue/model/planner.js
  - .tests/e2e/identity-storage-contract.spec.js
  - .tests/e2e/migration.spec.js
key_decisions:
  - Moved userKey declaration to top of migrate() loop so keyPrefs(userKey) is in scope before the preference write — previously the const was inside the inner year loop
  - Added _migratePrefsKey() as a single-pass scan rather than a full rewrite loop to avoid O(n^2) localStorage traversal on large keysets
  - Removed identity-push from setModelFromImportString entirely (not just uid assignment) — the push was uid-dependent and T02 will redesign share/import flow; dropping it now avoids a half-broken state
duration: 
verification_result: passed
completed_at: 2026-04-16T04:31:40.563Z
blocker_discovered: false
---

# T01: Refactored storage identity contract to key preferences by userKey (UUID) and added 9-test regression suite covering bootstrap, migration, and error paths

**Refactored storage identity contract to key preferences by userKey (UUID) and added 9-test regression suite covering bootstrap, migration, and error paths**

## What Happened

The storage identity contract had prefs stored under numeric uid keys (`prefs:1234567890`) and `setModelFromImportString` mutating `model.uid` from imported URL state. The task corrects the persistence layer before broader runtime cleanup in T02.

**storage-schema.js**: Renamed the `keyPrefs(uid)` parameter to `keyPrefs(userKey)` for semantic clarity — no functional change here, but anchors the correct API name.

**StorageLocal.js** — five targeted changes:
1. `setLocalPreferences(userKey, …)` / `getLocalPreferences(userKey)` — parameter rename + internal `PreferencesStore` calls updated to `String(userKey)`.
2. `getDefaultLocalPreferences()` — now resolves `model.userKey || ClientAuthSession.getUserUuid() || DeviceSession.getDeviceId()` instead of the numeric `model.uid || getLocalUid()`.
3. `setLocalFromModel()` — resolves the same userKey chain before calling `setLocalPreferences`; this is the live write path that runs on every `refresh()`, so after this change prefs are persisted under the device/JWT UUID.
4. `migrate()` (legacy path) — moved the `userKey` declaration to before the identity loop so `keyPrefs(userKey)` is in scope when writing migrated prefs; this ensures fresh migrations also land under the UUID key, not the numeric uid.
5. New `_migratePrefsKey()` method — runs in the `devExists` branch of `migrate()` and promotes any `prefs:${numericUid}` key to `prefs:${userKey}` (UUID) for users who ran older migrations. No-ops if the UUID-keyed prefs already exist.

**Storage.js**: Removed `this.model.uid = importer[0]['0']` and the dependent identity-push block from `setModelFromImportString`. The uid was being read from a shared URL and clobbered the model's identity — this was the primary runtime state mutation that T01 targets. Preferences, year, days, lang, and theme are still imported correctly.

**planner.js**: Updated the `uid` field comment to document it as deprecated and owned by Application.init(), signalling to T02 that it is safe to remove after Application.js is cleaned up.

**identity-storage-contract.spec.js** (new, 8 tests): covers fresh-boot prefs key shape, planner `meta.userKey` presence, no legacy `'0'` key after start, numeric-prefs migration, malformed JSON resilience, missing-prefs fallback, missing planner meta resilience, and multi-planner normalization boundary case.

**migration.spec.js**: Added two assertion blocks — prefs keys must match UUID format (not numeric uid), and all migrated planner docs must carry `meta.userKey` in UUID format.

## Verification

Ran both target test suites against the running local dev server (http-server site -p 8080):

`npm --prefix .tests run test -- --reporter=line e2e/identity-storage-contract.spec.js` → 8 passed (6.0s)
`npm --prefix .tests run test -- --reporter=line e2e/migration.spec.js` → 1 passed (2.7s)

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm --prefix .tests run test -- --reporter=line e2e/identity-storage-contract.spec.js` | 0 | ✅ pass — 8/8 tests passed | 6000ms |
| 2 | `npm --prefix .tests run test -- --reporter=line e2e/migration.spec.js` | 0 | ✅ pass — 1/1 test passed | 2700ms |

## Deviations

The task plan listed planner.js as having fields removed, but uid is still set by Application.js (T02's scope) so only the comment was updated to mark it deprecated. This avoids breaking Application.init() before T02 lands.

## Known Issues

Application.js still calls `getLocalPreferences(this.model.uid)` (numeric) on init — prefs will be empty on first read but correctly written under userKey during refresh. T02 will fix the read path.

## Files Created/Modified

- `site/js/service/storage-schema.js`
- `site/js/service/StorageLocal.js`
- `site/js/service/Storage.js`
- `site/js/vue/model/planner.js`
- `.tests/e2e/identity-storage-contract.spec.js`
- `.tests/e2e/migration.spec.js`
