---
estimated_steps: 1
estimated_files: 3
skills_used: []
---

# T01: Rewrite StorageLocal.js + update entries.js and Storage.js field names

Full rewrite of StorageLocal.js to new schema. Update entries.js day field accessors. Update Storage.js field accessors.

## Inputs

- `js/service/StorageLocal.js`
- `js/vue/methods/entries.js`
- `js/service/Storage.js`
- `js/service/storage-schema.js`
- `js/vue/methods/planner.js`
- `js/vue/methods/lifecycle.js`

## Expected Output

- `js/service/StorageLocal.js rewritten`
- `js/vue/methods/entries.js updated`
- `js/service/Storage.js updated`

## Verification

cd .tests && npx playwright test -- 15 passed
