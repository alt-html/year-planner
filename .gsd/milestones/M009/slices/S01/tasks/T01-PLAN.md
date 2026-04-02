---
estimated_steps: 1
estimated_files: 2
skills_used: []
---

# T01: Create storage-schema.js and add SYNC-01 smoke test

1. Create js/service/storage-schema.js with all key constants and field name exports, importing HLC from ../vendor/data-api-core.esm.js\n2. Add SYNC-01 smoke test to .tests/smoke/harness.spec.js\n3. Run full test suite to verify all 15 tests pass

## Inputs

- `js/vendor/data-api-core.esm.js`
- `.tests/smoke/harness.spec.js`

## Expected Output

- `js/service/storage-schema.js`
- `updated .tests/smoke/harness.spec.js`

## Verification

cd .tests && npx playwright test
