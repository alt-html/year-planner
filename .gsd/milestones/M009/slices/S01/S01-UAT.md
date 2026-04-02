# S01: Vendor bundle integration + schema constants — UAT

**Milestone:** M009
**Written:** 2026-03-28T12:22:01.101Z

## SYNC-01 — HLC vendor bundle accessible\n\n| Step | Action | Expected | Result |\n|------|--------|----------|--------|\n| 1 | Navigate to app | App loads, [data-app-ready] set | ✅ |\n| 2 | Dynamically import /js/vendor/data-api-core.esm.js in browser | HLC exported | ✅ |\n| 3 | Create and tick HLC clock | ticked > clock (string comparison) | ✅ |\n\nAll 15 tests pass: `cd .tests && npx playwright test`"
