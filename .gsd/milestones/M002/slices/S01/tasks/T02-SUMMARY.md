---
id: T02
parent: S01
milestone: M002
provides:
  - Controller import and CDI registration removed from contexts.js
  - Full E2E verification that the split is behaviour-preserving
key_files:
  - js/config/contexts.js
key_decisions:
  - model.js qualifier string '@alt-html/year-planner/vue/controller' left unchanged — it's CDI autowiring config, not a controller import
patterns_established:
  - none
observability_surfaces:
  - none
duration: 5m
verification_result: passed
completed_at: 2026-03-14
blocker_discovered: false
---

# T02: Remove controller from CDI and run full E2E verification

**Removed controller import/registration from contexts.js and verified all 14 E2E tests pass**

## What Happened

Removed `import { controller } from '../vue/controller.js'` and `{name:'controller', Reference: controller}` from `contexts.js`. Verified no other file imports controller.js — only remaining references are the file itself and a CDI qualifier string in model.js (which is autowiring config, not an import).

## Verification

- `cd .tests && npx playwright test` — all 14 tests passed (14.4s)
- `grep -rn "controller" js/ --include="*.js"` — only controller.js self-reference and model.js qualifier string remain (both expected)

## Diagnostics

None — straightforward cleanup.

## Deviations

None.

## Known Issues

- `controller.js` file still exists on disk — it's no longer imported anywhere but hasn't been deleted. Can be deleted in a future cleanup or left as reference.

## Files Created/Modified

- `js/config/contexts.js` — removed controller import and CDI registration
