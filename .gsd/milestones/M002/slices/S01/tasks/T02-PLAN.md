---
estimated_steps: 4
estimated_files: 2
---

# T02: Remove controller from CDI and run full E2E verification

**Slice:** S01 — Controller decomposition
**Milestone:** M002

## Description

Remove the monolithic `controller` import and CDI registration from `contexts.js`. The controller object was only consumed by `app.js` (now replaced by method module imports) and registered in CDI as a plain object reference — no class depends on it via constructor injection. After removal, run all 14 Playwright E2E tests to prove the split is behaviour-preserving.

## Steps

1. Remove `import { controller } from '../vue/controller.js'` from `js/config/contexts.js`.
2. Remove `{name:'controller', Reference: controller}` from the contexts array in `js/config/contexts.js`.
3. Verify no remaining imports of `controller.js` exist anywhere in `js/`: `grep -r "controller" js/ --include="*.js"` should show zero import statements.
4. Run `cd .tests && npx playwright test` — all 14 tests must pass.

## Must-Haves

- [ ] `contexts.js` no longer imports `controller.js`
- [ ] `contexts.js` no longer registers the controller in the CDI context array
- [ ] No file in `js/` imports from `controller.js`
- [ ] All 14 Playwright E2E tests pass

## Verification

- `cd .tests && npx playwright test` — 14 tests pass, 0 failures
- `grep -rn "import.*controller" js/ --include="*.js"` — returns no matches
- `grep -rn "controller" js/config/contexts.js` — returns no matches

## Observability Impact

- Signals added/changed: None
- How a future agent inspects this: Check `contexts.js` to confirm controller is not in the CDI context array. Run E2E tests to confirm app still boots.
- Failure state exposed: CDI boot failure would show in browser console if any class expected a `controller` dependency (none do — verified by grep).

## Inputs

- `js/config/contexts.js` — current file with controller import and registration
- `js/vue/app.js` — already updated in T01 to use method module imports instead of controller
- T01 completed — all 5 method modules exist and app.js merges them

## Expected Output

- `js/config/contexts.js` — modified: controller import and registration removed
- All 14 E2E tests passing — proves the decomposition is behaviour-preserving
