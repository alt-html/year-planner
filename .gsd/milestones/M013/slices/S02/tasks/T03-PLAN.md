---
estimated_steps: 30
estimated_files: 8
skills_used:
  - test
  - lint
---

# T03: Harden clean-URL regression coverage and add query-state grep gate

## Skills Used

- `test`
- `lint`

Why this task exists
- R103 requires durable proof that app-state query params do not return through future edits.
- S01 test pack still contains `?year`/`?theme` assumptions; this task aligns all affected suites to in-app state setup.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Playwright specs that still seed via query params | Fail fast with explicit file/test names and update fixtures to localStorage/setup APIs. | Surface timed-out spec names; keep suite deterministic via focused commands. | Normalize seed setup using init scripts and guard flags; reject malformed seed payloads in assertions. |
| New grep gate script for query-state surfaces | Exit non-zero with matching file:line output. | N/A | Use targeted patterns to avoid false positives from unrelated strings. |
| System-follow event simulation hooks in tests | Keep current state and fail assertions with mode/effective diagnostic output. | Mark test failed with clear wait condition rather than hanging event waits. | Validate test hook payloads before dispatching synthetic events. |

## Load Profile

- **Shared resources**: Playwright browser context, seeded localStorage state, and deterministic CDN fixture routes.
- **Per-operation cost**: multiple short browser boot cycles and event dispatch assertions.
- **10x breakpoint**: suite runtime/flakiness before compute limits; keep selectors and waits deterministic.

## Negative Tests

- **Malformed inputs**: invalid query params and invalid mode values should be ignored safely.
- **Error paths**: simulated missing system APIs/listener failures should preserve current explicit state.
- **Boundary conditions**: switching system→explicit→system repeatedly should keep URL unchanged and state coherent.

## Steps

1. Update `.tests/e2e/clean-url-navigation.spec.js` and `.tests/smoke/dark-mode.spec.js` to remove query-param-driven setup and assert clean URL invariants under in-app interactions.
2. Align affected regression specs (`planner-management`, `cross-profile-sync`, `sync-payload`, `tp-col-coercion`) to in-app year/theme/lang state setup instead of `?year`/`?theme` navigation.
3. Add `scripts/verify-no-url-state-params.sh` to enforce absence of runtime `year/lang/theme` query-state surfaces (while permitting OAuth callback params).
4. Expand `.tests/e2e/system-follow-preferences.spec.js` with explicit negative and boundary scenarios for mode switching/event handling.
5. Run the focused regression pack and stabilize selectors/waits so failures are actionable and non-flaky.

## Must-Haves

- [ ] Clean-url tests no longer depend on `?theme`/`?year` setup.
- [ ] Grep gate fails if app-state query-surface patterns return in runtime code.
- [ ] Focused regression command passes with deterministic diagnostics.

## Inputs

- `.tests/e2e/clean-url-navigation.spec.js`
- `.tests/smoke/dark-mode.spec.js`
- `.tests/e2e/planner-management.spec.js`
- `.tests/e2e/cross-profile-sync.spec.js`
- `.tests/e2e/sync-payload.spec.js`
- `.tests/e2e/tp-col-coercion.spec.js`
- `.tests/e2e/system-follow-preferences.spec.js`
- `site/js/Application.js`
- `site/js/vue/methods/lifecycle.js`

## Expected Output

- `.tests/e2e/clean-url-navigation.spec.js`
- `.tests/smoke/dark-mode.spec.js`
- `.tests/e2e/planner-management.spec.js`
- `.tests/e2e/cross-profile-sync.spec.js`
- `.tests/e2e/sync-payload.spec.js`
- `.tests/e2e/tp-col-coercion.spec.js`
- `.tests/e2e/system-follow-preferences.spec.js`
- `scripts/verify-no-url-state-params.sh`

## Verification

bash scripts/verify-no-url-state-params.sh && npm --prefix .tests run test -- --reporter=line e2e/system-follow-preferences.spec.js e2e/clean-url-navigation.spec.js smoke/dark-mode.spec.js e2e/planner-management.spec.js e2e/cross-profile-sync.spec.js e2e/sync-payload.spec.js e2e/tp-col-coercion.spec.js

## Observability Impact

- Signals added/changed: grep gate output and focused Playwright failures identify exact query-state regression points.
- How a future agent inspects this: run `bash scripts/verify-no-url-state-params.sh` and the focused Playwright command from this task.
- Failure state exposed: file:line matches for forbidden patterns plus test-level mode/state mismatch details.
