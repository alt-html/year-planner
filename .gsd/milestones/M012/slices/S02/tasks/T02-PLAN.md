---
estimated_steps: 9
estimated_files: 4
skills_used:
  - test
  - technical-writing
---

# T02: Reconcile contract docs and enforce winner-lock invariants with smoke tests

Why this task exists
- Contract drift in `mockups/icon-candidates/README.md` and missing winner-lock assertions would let S03 consume ambiguous inputs.

Steps
1. Update `mockups/icon-candidates/README.md` to match the live `preview-{size}.png` layout and document `canonical.json` + `alternatives.json` as authoritative selection artifacts.
2. Add `.tests/smoke/icon-candidates-selection.spec.js` and adjust existing candidate smoke specs where needed so tests enforce winner uniqueness, candidate-ID validity, archived-alternative completeness, and gallery marker consistency.
3. Run `assets + gallery + selection` smoke checks and fix failures until the selection contract is fully green.

Must-haves
- README contract text matches real file layout and selection metadata artifacts.
- Smoke tests fail on malformed/duplicated winner metadata and pass only when winner markers and metadata agree.

## Inputs

- `mockups/icon-candidates/README.md`
- `mockups/icon-candidates/canonical.json`
- `mockups/icon-candidates/alternatives.json`
- `mockups/icon-comparison.html`
- `.tests/smoke/icon-candidates-assets.spec.js`
- `.tests/smoke/icon-candidates-gallery.spec.js`

## Expected Output

- `mockups/icon-candidates/README.md`
- `.tests/smoke/icon-candidates-selection.spec.js`
- `.tests/smoke/icon-candidates-assets.spec.js`
- `.tests/smoke/icon-candidates-gallery.spec.js`

## Verification

npm --prefix .tests run test -- --reporter=line smoke/icon-candidates-assets.spec.js smoke/icon-candidates-gallery.spec.js smoke/icon-candidates-selection.spec.js && ! rg -n "previews/icon-|icon-16\.png|icon-32\.png|icon-180\.png|icon-192\.png|icon-512\.png" mockups/icon-candidates/README.md

## Observability Impact

Selection-contract smoke assertions must emit candidate IDs, expected set members, and offending file paths so downstream slices can localize lock drift quickly.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Playwright smoke runner (`@playwright/test`) | Fail task and print spec-level diagnostic context | Treat as infra failure; rerun once and surface blocker if persistent | N/A |
| README selection contract text | Fail regex/token checks and patch README before completion | N/A | Fail stale path tokens (`previews/icon-*`) and require correction |
| Selection metadata JSON files | Fail new smoke spec with explicit missing/invalid candidate IDs | N/A | Fail duplicate/missing winner and alternative-set mismatch |

## Load Profile

- **Shared resources**: local filesystem and Playwright worker processes.
- **Per-operation cost**: O(candidates × required-sizes) file checks plus regex scans.
- **10x breakpoint**: test runtime increases first; no external rate limits or network pools are involved.

## Negative Tests

- **Malformed inputs**: invalid `candidateId`, duplicate winner records, or alternatives list not equal to the two non-winners must fail.
- **Error paths**: missing metadata files or gallery winner marker must fail the selection smoke spec.
- **Boundary conditions**: exactly 1 canonical winner, exactly 2 archived alternatives, and exactly 3 valid candidate IDs remain enforced.
