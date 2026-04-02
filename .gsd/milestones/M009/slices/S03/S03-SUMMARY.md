---
id: S03
parent: M009
milestone: M009
provides:
  - One-time migration from old schema: uid-yearM blobs → plnr:uuid sparse-map docs
  - Old keys removed: '0', uid, uid-year*
  - New keys written: dev, prefs:uid, plnr:uuid, rev:uuid, base:uuid, sync:uuid
  - Day entries migrated with new field names: tp/tl/col/notes/emoji
requires:
  - slice: S02
    provides: StorageLocal with new schema write methods
affects:
  []
key_files:
  - js/service/StorageLocal.js
  - .tests/e2e/migration.spec.js
  - .tests/globalSetup.js
key_decisions:
  - Eager migrate() in read methods pattern — required because CDI lifecycle calls storage reads before Vue mounted()
  - migrate() dev-exists guard: removes stale '0' and returns cleanly rather than skipping entirely
  - sessionStorage flag in migration test prevents addInitScript re-seeding on redirect
patterns_established:
  - Eager migration trigger pattern: call migrate() from read methods (getLocalIdentities, getLocalPreferences, getLocalPlanner) so migration fires before any storage read regardless of caller order
observability_surfaces:
  - none
drill_down_paths:
  - .gsd/milestones/M009/slices/S03/tasks/T01-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-28T12:53:50.515Z
blocker_discovered: false
---

# S03: One-time migration from old schema

**One-time migration from old schema to M009 implemented and tested; 16/16 tests pass.**

## What Happened

One-time migration from old cookie-era schema fully implemented. The critical insight was that CDI calls Application.init() (which reads storage) before Vue's mounted() lifecycle triggers initialised()/refresh(). Solved by calling migrate() eagerly from every storage read entry point. The migrate() guard was refined: if dev exists, just clean up stale '0' and return. globalSetup updated. 16/16 tests pass including the dedicated migration E2E test.

## Verification

cd .tests && npx playwright test — 16 passed (6.1s).

## Requirements Advanced

- STO-02 — migrate() converts old uid-yearM blobs to new day objects with tp/tl/col/notes/emoji keys

## Requirements Validated

- SYNC-07 — Playwright migration test: seeds old-schema data, reloads, verifies old keys absent and day entries intact with new field names. 16/16 tests pass.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

migrate() called eagerly from read methods (getLocalIdentities/getLocalPreferences/getLocalPlanner) rather than only from initialised() — required because CDI Application.init() reads storage before Vue mount triggers initialised(). globalSetup.js updated to wait for dev OR '0'. Migration test uses sessionStorage flag to prevent re-seeding on redirect.

## Known Limitations

None.

## Follow-ups

None.

## Files Created/Modified

- `js/service/StorageLocal.js` — Added migrate() method + eager migrate() calls in read methods + migrate() guard updated
- `.tests/e2e/migration.spec.js` — Migration Playwright E2E test
- `.tests/globalSetup.js` — Wait for dev OR '0' (M009 schema compat)
