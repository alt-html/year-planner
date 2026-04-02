# S01: Vendor bundle integration + schema constants

**Goal:** Import HLC from the vendor bundle and create the schema constants module; add and pass the SYNC-01 smoke test
**Demo:** After this: After this: HLC available in app. Key constants defined. Harness test green.

## Tasks
- [x] **T01: Created storage-schema.js with all M009 key/field constants; added SYNC-01 smoke test — 15/15 pass** — 1. Create js/service/storage-schema.js with all key constants and field name exports, importing HLC from ../vendor/data-api-core.esm.js\n2. Add SYNC-01 smoke test to .tests/smoke/harness.spec.js\n3. Run full test suite to verify all 15 tests pass
  - Estimate: 30m
  - Files: js/service/storage-schema.js, .tests/smoke/harness.spec.js
  - Verify: cd .tests && npx playwright test
