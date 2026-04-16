---
estimated_steps: 28
estimated_files: 6
skills_used:
  - test
  - best-practices
---

# T03: Re-compose HTML and add regression + grep gates proving legacy surface removal

Why: R109-supporting proof for S03 requires objective evidence that removed share/feature surfaces do not regress back into runtime or UI.

## Skills Used
- `test`
- `best-practices`

## Steps
1. Re-compose static output (`.compose/build.sh`) so `site/index.html` matches fragment changes and no removed includes leak through stale generated HTML.
2. Add `.tests/e2e/legacy-surface-removal.spec.js` with assertions that share/feature controls are absent and `/?share=...` does not import or alter planner state.
3. Update `.tests/e2e/bs5-migration.spec.js` to stop asserting deleted share/feature modals; retain BS5 close-button coverage by targeting remaining modals.
4. Update `.tests/smoke/compose.spec.js` to assert revised modal fragment set and compose includes after share/feature deletion.
5. Add `scripts/verify-no-legacy-share-features.sh` grep gate that fails on reintroduced legacy symbols (`?share=`, `shareModal`, `featureModal`, `model-features`, share import/export helpers).

## Must-Haves
- [ ] New E2E spec proves share/feature absence and ignored `?share` path.
- [ ] Compose smoke and BS5 migration tests are aligned with removed surfaces.
- [ ] Grep gate script exists and fails on reintroduction.

## Failure Modes
| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Playwright E2E runner | Report failing selector/assertion with file:test context | Mark suite failed with timed-out test names | Treat malformed query payload test as pass only when app remains unaffected |
| m4 compose build | Fail fast if generated `site/index.html` cannot be regenerated | N/A | N/A |
| grep gate script | Exit non-zero with file:line matches for forbidden symbols | N/A | Use targeted patterns to reduce false positives |

## Load Profile
- Shared resources: Playwright browser context and generated static HTML.
- Per-operation cost: targeted E2E + smoke runs plus linear grep scan.
- 10x breakpoint: test runtime/flakiness before resource saturation.

## Negative Tests
- Malformed inputs: invalid/malformed `?share` payload should not crash or import data.
- Error paths: absent modal selectors should be asserted explicitly (not silently skipped).
- Boundary conditions: no share/feature symbols in `site/index.html`, `.compose`, or runtime JS.

## Inputs

- `.compose/build.sh`
- `.compose/index.html.m4`
- `.compose/fragments/modals.html`
- `.compose/fragments/rail.html`
- `.compose/fragments/footer.html`
- `.compose/fragments/grid.html`
- `site/index.html`
- `.tests/e2e/bs5-migration.spec.js`
- `.tests/smoke/compose.spec.js`

## Expected Output

- `site/index.html`
- `.tests/e2e/legacy-surface-removal.spec.js`
- `.tests/e2e/bs5-migration.spec.js`
- `.tests/smoke/compose.spec.js`
- `scripts/verify-no-legacy-share-features.sh`

## Verification

bash .compose/build.sh && bash scripts/verify-no-legacy-share-features.sh && npm --prefix .tests run test -- --reporter=line e2e/legacy-surface-removal.spec.js e2e/bs5-migration.spec.js smoke/compose.spec.js

## Observability Impact

- Signals added: deterministic grep-gate output and focused e2e/smoke assertions for removed surfaces.
- Inspection: run `bash scripts/verify-no-legacy-share-features.sh` and targeted Playwright command.
- Failure visibility: reintroduced symbol reports include exact file:line; UI regressions include selector-specific assertion failures.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|---|---|---|---|
| m4 compose build | Non-zero exit halts verification | N/A | N/A |
| grep gate script | Non-zero exit with file:line violations | N/A | Targeted patterns avoid false positives |
| Playwright runner | Test failure includes file:test selector context | Timeout marks suite failed with test names | Malformed `?share` payload test passes only when app remains unaffected |

## Load Profile

- **Shared resources**: browser contexts, generated `site/index.html`, filesystem scan.
- **Per-operation cost**: targeted e2e/smoke tests + grep over runtime/template files.
- **10x breakpoint**: CI/test runtime stability before compute saturation.

## Negative Tests

- **Malformed inputs**: invalid `?share` payload stays inert.
- **Error paths**: absent modal/share selectors are asserted as non-existent.
- **Boundary conditions**: no share/feature symbols remain in runtime/template/index after compose.
