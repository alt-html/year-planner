---
estimated_steps: 29
estimated_files: 8
skills_used:
  - test
  - lint
---

# T03: Align remaining regression suite and add uid-removal grep gate

## Skills Used

- `test`
- `lint`

Why this task exists
- R109 demands strict proof that cleanup did not regress existing behavior and that uid surfaces are fully purged.
- Existing E2E specs still seed/query uid-era contracts; they must be rewritten to validate the new runtime contract.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Existing Playwright E2E specs with uid-era setup | Fail suite with explicit file-level assertion; do not silently skip cases. | Mark verification failed and report timed-out spec names for follow-up. | Normalize fixture payloads to new contract (`userKey`, clean URL) before assertions. |
| Sync route mocks (`**/year-planner/sync`) | Fail affected sync tests with captured request/response diagnostics. | Treat as test failure; keep timeout thresholds explicit in spec loops. | Reject malformed sync payloads and assert contract fields directly. |
| `rg`-based uid grep gate script | Exit non-zero with matching file:line list. | N/A | Use strict pattern set (`\buid\b|\?uid|[?&]id=`) and exclude vendor fixtures intentionally. |

## Load Profile

- **Shared resources**: Playwright web server/context, test storageState seed, and mocked sync endpoint.
- **Per-operation cost**: multiple browser boots and sync mock assertions across targeted e2e files.
- **10x breakpoint**: CI runtime and test flake sensitivity before CPU/memory constraints.

## Negative Tests

- **Malformed inputs**: broken seeded docs (missing `meta.userKey`), invalid clocks, and corrupt localStorage JSON in test setup.
- **Error paths**: sync endpoint 5xx/timeout handling remains observable in existing sync-error suites after refactor.
- **Boundary conditions**: empty planner set, foreign-doc sync merge, and signout preserving planner keys.

## Steps

1. Update uid-era E2E files (`cross-profile-sync`, `sync-payload`, `hlc-write`, `tp-col-coercion`, `signout-wipe`) to seed and assert the userKey/document-UUID contract without `/?uid=` navigation assumptions.
2. Ensure planner-management and related tests assert behavior via active planner UUID/state, not uid-derived selectors or keys.
3. Add `scripts/verify-no-legacy-uid.sh` as a reproducible grep gate over runtime code (`site/index.html`, `site/js/**`) excluding vendor artifacts.
4. Run the targeted regression pack and fix remaining assertions to produce deterministic failure diagnostics.

## Must-Haves

- [ ] Updated targeted E2E specs no longer depend on uid query parameters or uid-seeded preference keys.
- [ ] Grep gate script fails on any reintroduced uid runtime surface.
- [ ] Regression pack passes with actionable output on failure.

## Inputs

- `.tests/e2e/cross-profile-sync.spec.js`
- `.tests/e2e/sync-payload.spec.js`
- `.tests/e2e/hlc-write.spec.js`
- `.tests/e2e/tp-col-coercion.spec.js`
- `.tests/e2e/signout-wipe.spec.js`
- `.tests/e2e/planner-management.spec.js`
- `site/js/Application.js`
- `site/js/service/StorageLocal.js`

## Expected Output

- `.tests/e2e/cross-profile-sync.spec.js`
- `.tests/e2e/sync-payload.spec.js`
- `.tests/e2e/hlc-write.spec.js`
- `.tests/e2e/tp-col-coercion.spec.js`
- `.tests/e2e/signout-wipe.spec.js`
- `.tests/e2e/planner-management.spec.js`
- `scripts/verify-no-legacy-uid.sh`

## Verification

bash scripts/verify-no-legacy-uid.sh && npm --prefix .tests run test -- --reporter=line e2e/cross-profile-sync.spec.js e2e/sync-payload.spec.js e2e/hlc-write.spec.js e2e/tp-col-coercion.spec.js e2e/signout-wipe.spec.js

## Observability Impact

- Signals added/changed: grep gate emits exact file:line matches for uid reintroduction; sync tests emit captured payload shape mismatches.
- How a future agent inspects this: run `bash scripts/verify-no-legacy-uid.sh` and `npm --prefix .tests run test -- --reporter=line e2e/cross-profile-sync.spec.js`.
- Failure state exposed: contract drift is localized to specific spec or source lines instead of broad suite failures.
