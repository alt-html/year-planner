---
id: T01
parent: S03
milestone: M009
provides: []
requires: []
affects: []
key_files: ["js/service/StorageLocal.js", ".tests/e2e/migration.spec.js", ".tests/globalSetup.js"]
key_decisions: ["migrate() called from getLocalIdentities/getLocalPreferences/getLocalPlanner so it fires before CDI Application.init() reads storage", "migrate() guard: if dev exists, remove stale '0' and return — handles transitional state where setLocalIdentities wrote '0' compat key", "setLocalIdentities only writes '0' compat key when dev doesn't exist yet (pre-migration path only)", "Migration test uses sessionStorage flag to seed old data only on first navigation (not on redirect)", "globalSetup.js waits for dev OR '0' to support M009 schema"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "cd .tests && npx playwright test — 16 passed (6.1s). Migration test verifies old keys removed, new keys present, day entries intact with new field names (tl, col, notes, emoji)."
completed_at: 2026-03-28T12:53:17.430Z
blocker_discovered: false
---

# T01: Migration from old-schema to M009 implemented; all 16 tests pass including dedicated migration E2E test.

> Migration from old-schema to M009 implemented; all 16 tests pass including dedicated migration E2E test.

## What Happened
---
id: T01
parent: S03
milestone: M009
key_files:
  - js/service/StorageLocal.js
  - .tests/e2e/migration.spec.js
  - .tests/globalSetup.js
key_decisions:
  - migrate() called from getLocalIdentities/getLocalPreferences/getLocalPlanner so it fires before CDI Application.init() reads storage
  - migrate() guard: if dev exists, remove stale '0' and return — handles transitional state where setLocalIdentities wrote '0' compat key
  - setLocalIdentities only writes '0' compat key when dev doesn't exist yet (pre-migration path only)
  - Migration test uses sessionStorage flag to seed old data only on first navigation (not on redirect)
  - globalSetup.js waits for dev OR '0' to support M009 schema
duration: ""
verification_result: passed
completed_at: 2026-03-28T12:53:17.430Z
blocker_discovered: false
---

# T01: Migration from old-schema to M009 implemented; all 16 tests pass including dedicated migration E2E test.

**Migration from old-schema to M009 implemented; all 16 tests pass including dedicated migration E2E test.**

## What Happened

Added migrate() to StorageLocal.js. The core challenge was ordering: CDI calls Application.init() before Vue mounts, so storage reads happen before initialised() triggers migrate(). Fixed by calling migrate() eagerly from getLocalIdentities, getLocalPreferences, and getLocalPlanner. The compat write of '0' in setLocalIdentities was conditional on dev not existing. The migrate() dev-exists guard was updated to do a quick cleanup of stale '0' rather than a full skip. globalSetup.js updated to wait for the new dev key. Migration test uses sessionStorage flag to prevent re-seeding on redirect navigation. 16/16 tests pass.

## Verification

cd .tests && npx playwright test — 16 passed (6.1s). Migration test verifies old keys removed, new keys present, day entries intact with new field names (tl, col, notes, emoji).

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd .tests && npx playwright test` | 0 | ✅ pass — 16 passed | 6100ms |


## Deviations

migrate() needed to be called from getLocalIdentities(), getLocalPreferences(), and getLocalPlanner() in addition to initialised() — because CDI's init() lifecycle calls Application.init() which reads storage BEFORE Vue mounted() calls refresh()/initialised(). The migration had to be triggered eagerly on any first read, not just on initialised(). The setLocalIdentities compat write of '0' had to be conditional on dev not existing. The migrate() guard was changed to: if dev exists, just clean up any stale '0' and return (rather than skipping entirely). globalSetup.js updated to wait for dev OR '0'. Migration test needed sessionStorage flag to prevent addInitScript re-seeding on redirect.

## Known Issues

None.

## Files Created/Modified

- `js/service/StorageLocal.js`
- `.tests/e2e/migration.spec.js`
- `.tests/globalSetup.js`


## Deviations
migrate() needed to be called from getLocalIdentities(), getLocalPreferences(), and getLocalPlanner() in addition to initialised() — because CDI's init() lifecycle calls Application.init() which reads storage BEFORE Vue mounted() calls refresh()/initialised(). The migration had to be triggered eagerly on any first read, not just on initialised(). The setLocalIdentities compat write of '0' had to be conditional on dev not existing. The migrate() guard was changed to: if dev exists, just clean up any stale '0' and return (rather than skipping entirely). globalSetup.js updated to wait for dev OR '0'. Migration test needed sessionStorage flag to prevent addInitScript re-seeding on redirect.

## Known Issues
None.
