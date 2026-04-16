---
estimated_steps: 30
estimated_files: 8
skills_used:
  - best-practices
  - test
---

# T02: Rewire application/bootstrap and UI navigation away from uid query state

## Skills Used

- `best-practices`
- `test`

Why this task exists
- The slice demo requires user-facing behavior: identity/state must work without uid query mechanics while preserving planner workflows.
- This task closes the integration seam between storage contract changes and Vue/UI behavior.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `site/js/Application.js` bootstrap sequence | Fail fast with explicit app-ready test failure; do not silently fallback to uid state. | N/A | Guard URL/session param parsing and ignore unknown planner-state params. |
| Vue method wiring in `site/js/vue/methods/*.js` | Keep previous active planner/year in memory and surface failed interaction test instead of hard navigation. | N/A | Coerce invalid year/theme/lang inputs to safe defaults before persist/update. |
| Template bindings in `site/index.html` | Prevent default link navigation and keep state mutation in Vue methods; fail clean-url test on accidental reload. | N/A | Ignore malformed dropdown/event payload and keep current state. |

## Load Profile

- **Shared resources**: Vue reactive model state, browser history API, and planner list rendering.
- **Per-operation cost**: constant-time state mutation per interaction (year/theme/lang toggle) plus preference write.
- **10x breakpoint**: repeated rapid navigation/toggles can thrash render/update cycle if handlers trigger full reloads.

## Negative Tests

- **Malformed inputs**: non-numeric year entry, unsupported language token, invalid theme value.
- **Error paths**: missing active planner on delete/switch path must not crash modal actions.
- **Boundary conditions**: first-run empty storage and multi-planner state transitions across different years.

## Steps

1. Refactor `site/js/Application.js` init flow to stop reading/writing uid query parameters for app state and initialize from `userKey` + stored preferences.
2. Update `site/js/vue/methods/lifecycle.js`, `site/js/vue/methods/planner.js`, `site/js/vue/methods/rail.js`, and `site/js/vue/methods/calendar.js` so year/theme/lang/planner actions mutate reactive state and persist preferences without `window.location.search` reload semantics.
3. Replace uid/id query-string `href` bindings in `site/index.html` with explicit `v-on:click.prevent` handlers that call the new state mutation methods; remove stale `deletePlannerByYear(uid,year)` wiring.
4. Add `.tests/e2e/clean-url-navigation.spec.js` to assert year/theme/lang interactions keep URL clean and do not trigger hard navigation.
5. Update `.tests/smoke/dark-mode.spec.js` and `.tests/e2e/planner-management.spec.js` expectations for non-query navigation behavior.

## Must-Haves

- [ ] No UI control depends on `/?uid=...` or `/?id=...` links.
- [ ] Year/theme/lang changes are in-app state transitions with preference persistence.
- [ ] Planner create/select/delete remains functional without uid references.

## Inputs

- `site/js/Application.js`
- `site/index.html`
- `site/js/vue/methods/lifecycle.js`
- `site/js/vue/methods/planner.js`
- `site/js/vue/methods/rail.js`
- `site/js/vue/methods/calendar.js`
- `.tests/e2e/planner-management.spec.js`
- `.tests/smoke/dark-mode.spec.js`

## Expected Output

- `site/js/Application.js`
- `site/index.html`
- `site/js/vue/methods/lifecycle.js`
- `site/js/vue/methods/planner.js`
- `site/js/vue/methods/rail.js`
- `site/js/vue/methods/calendar.js`
- `.tests/e2e/clean-url-navigation.spec.js`
- `.tests/smoke/dark-mode.spec.js`

## Verification

npm --prefix .tests run test -- --reporter=line e2e/clean-url-navigation.spec.js e2e/planner-management.spec.js smoke/dark-mode.spec.js

## Observability Impact

- Signals added/changed: interaction tests detect accidental hard navigations by asserting URL stability and app-ready continuity.
- How a future agent inspects this: run `npm --prefix .tests run test -- --reporter=line e2e/clean-url-navigation.spec.js` and inspect navigation/assertion traces.
- Failure state exposed: stale query-bound links or broken planner action handlers surface as deterministic UI assertion failures.
