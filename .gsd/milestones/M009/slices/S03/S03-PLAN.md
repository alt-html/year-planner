# S03: One-time migration from old schema

**Goal:** Add one-time migration from old-schema localStorage data on first load. Detect key '0' (old identities array), convert all uid-yearM month blobs to plnr:uuid docs with new field names, remove old keys. Add Playwright migration test.
**Demo:** After this: After this: existing user data survives upgrade. Migration test green. All 14 tests green.

## Tasks
- [x] **T01: Migration from old-schema to M009 implemented; all 16 tests pass including dedicated migration E2E test.** — Add migrate() method to StorageLocal.js. Detects old-schema key '0', converts all uid-yearM month blobs to new plnr:uuid docs, writes prefs:uid, writes dev UUID, removes old keys. Idempotent.
  - Estimate: 30m
  - Files: js/service/StorageLocal.js
  - Verify: cd .tests && npx playwright test
- [x] **T02: migrate() wired into bootstrap via eager-call pattern in storage read methods.** — Wire migrate() into initialise() flow so it runs on first load before any reads.
  - Estimate: 10m
  - Files: js/service/StorageLocal.js
  - Verify: cd .tests && npx playwright test -- 16 passed
