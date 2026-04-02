---
estimated_steps: 1
estimated_files: 1
skills_used: []
---

# T02: Wire migration into bootstrap

Wire migrate() into initialise() flow so it runs on first load before any reads.

## Inputs

- `js/service/StorageLocal.js`
- `js/vue/methods/lifecycle.js`

## Expected Output

- `js/service/StorageLocal.js with migrate() wired`

## Verification

cd .tests && npx playwright test -- 16 passed
