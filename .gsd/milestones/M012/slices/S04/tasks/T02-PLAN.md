---
estimated_steps: 9
estimated_files: 6
skills_used:
  - test
  - best-practices
---

# T02: Add live wiring smoke contract and run targeted regression checks

Why: Wiring is only complete when tests prove production references are correct and every referenced icon is reachable. Do: add a dedicated smoke contract for canonical-path assertions, file reachability, purpose coverage, and legacy-path regression guards, then run targeted regressions. Done when: the new smoke spec and compose/export regressions pass together and failures pinpoint exact missing/stale paths.

## Steps

1. Create `.tests/smoke/icon-live-wiring.spec.js` to assert canonical icon references in `site/index.html` and `site/manifest.json`.
2. In the same test file, assert each referenced icon path exists on disk and that manifest purpose coverage includes `any`, `maskable`, and `monochrome` at `192` and `512`.
3. Add negative-boundary checks that fail if legacy root-level icon paths are reintroduced for head links or manifest entries.
4. Run the new smoke test with `smoke/compose.spec.js` and `smoke/icon-export-matrix.spec.js` to prove wiring + compose parity + upstream export contract remain intact.

## Must-Haves

- [ ] `.tests/smoke/icon-live-wiring.spec.js` exists with real assertions over `site/index.html`, `site/manifest.json`, and referenced-file existence.
- [ ] The spec fails on legacy paths (e.g. `./favicon-32x32.png`, `/android-chrome-192x192.png`) and passes with canonical `./icons/*` wiring.

## Inputs

- `site/index.html`
- `site/manifest.json`
- `site/icons/matrix.json`
- `.tests/smoke/icon-export-matrix.spec.js`
- `.tests/smoke/compose.spec.js`

## Expected Output

- `.tests/smoke/icon-live-wiring.spec.js`

## Verification

npm --prefix .tests run test -- --reporter=line smoke/icon-live-wiring.spec.js smoke/compose.spec.js smoke/icon-export-matrix.spec.js

## Observability Impact

- Signals added/changed: assertion messages in `icon-live-wiring.spec.js` identify missing canonical path, missing file, or legacy-path regression.
- How a future agent inspects this: run `npm --prefix .tests run test -- --reporter=line smoke/icon-live-wiring.spec.js`.
- Failure state exposed: failing assertion includes exact surface (`index.html` vs `manifest.json`), path token, and missing file location.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Playwright smoke runner (`npm --prefix .tests run test`) | Fail task and report failing spec/assertion path. | Treat as test infra fault; retry once, then surface timeout details. | N/A |
| `site/index.html` / `site/manifest.json` test fixtures | Fail with explicit missing-path assertion. | N/A | Reject malformed JSON/HTML by parse failure and stop verification. |
| `site/icons/*` files | Fail when referenced file is missing; do not allow soft pass. | N/A | Reject inconsistent manifest purpose/size tuples compared with expected matrix set. |

## Load Profile

- **Shared resources**: test worker processes and local filesystem reads across `site/` and `.tests/`.
- **Per-operation cost**: one new smoke spec plus two regression specs in a targeted run.
- **10x breakpoint**: CI runtime increases first; correctness remains bounded by deterministic filesystem assertions.

## Negative Tests

- **Malformed inputs**: invalid manifest icon shape (`src/sizes/purpose` missing) must fail test parsing/validation.
- **Error paths**: missing icon file on disk or unresolved `./icons/*` reference must fail with exact path.
- **Boundary conditions**: detect legacy-path regressions (`./favicon-*.png`, `/android-chrome-*.png`) and incomplete purpose coverage (missing any/maskable/monochrome at either 192 or 512).
