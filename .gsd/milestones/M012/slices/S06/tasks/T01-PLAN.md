---
estimated_steps: 8
estimated_files: 4
skills_used:
  - test
  - best-practices
---

# T01: Build the visual sign-off sheet spec for critical icon sizes and desktop surfaces

- Skills expected: `test`, `best-practices`.
- Why: R006 needs explicit visual spot checks; existing smoke suites only prove structural integrity.
- Do: Add a Playwright verification spec that builds one labeled sign-off sheet from matrix contracts, validates required paths, and writes deterministic HTML/PNG evidence under `.tests/test-results/icon-visual-signoff/`.
- Done when: running the new spec creates both artifacts and fails loudly when any required surface/path is missing.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `site/icons/matrix.json` | Fail fast with missing purpose/size diagnostics. | N/A (local read) | Reject missing `entries`, invalid `size`, or unsafe output paths. |
| `site/icons/desktop-matrix.json` | Fail fast with missing desktop format diagnostics. | N/A (local read) | Reject missing `format`/`sizes` fields or malformed output paths. |
| Playwright screenshot step | Exit non-zero and stop sign-off generation. | Treat as verification failure. | Reject zero-byte artifacts and fail task. |

## Load Profile

- **Shared resources**: local filesystem reads for icon assets and writes under `.tests/test-results/icon-visual-signoff/`.
- **Per-operation cost**: one matrix parse + one HTML render + one screenshot.
- **10x breakpoint**: throughput is trivial; stale/missing files are the primary failure mode.

## Negative Tests

- **Malformed inputs**: missing required purpose-size entries or malformed desktop format rows.
- **Error paths**: missing icon file on disk fails with explicit path.
- **Boundary conditions**: required visual surfaces (16, 32, 180, 192, 512 + desktop rows) must exist in sign-off metadata.

## Steps

1. Create `.tests/verification/S06-visual-sign-off.spec.js` to load/validate required entries from both matrix contracts.
2. Generate deterministic sign-off HTML at `.tests/test-results/icon-visual-signoff/S06-visual-sign-off.html` with labeled cards for required web/PWA + desktop rows.
3. Open the generated sheet in Playwright and save `.tests/test-results/icon-visual-signoff/S06-visual-sign-off-sheet.png`.
4. Add negative assertions proving missing entries/files fail with actionable messages.

## Must-Haves

- [ ] New executable spec at `.tests/verification/S06-visual-sign-off.spec.js`.
- [ ] Deterministic sign-off artifacts under `.tests/test-results/icon-visual-signoff/`.
- [ ] Missing surface/path conditions fail with explicit diagnostics.

## Inputs

- `site/icons/matrix.json`
- `site/icons/desktop-matrix.json`
- `site/icons/desktop/year-planner.ico`
- `site/icons/desktop/year-planner.icns`
- `.gsd/REQUIREMENTS.md`
- `.gsd/DECISIONS.md`

## Expected Output

- `.tests/verification/S06-visual-sign-off.spec.js`
- `.tests/test-results/icon-visual-signoff/S06-visual-sign-off.html`
- `.tests/test-results/icon-visual-signoff/S06-visual-sign-off-sheet.png`

## Verification

npm --prefix .tests run test -- --reporter=line verification/S06-visual-sign-off.spec.js && test -s .tests/test-results/icon-visual-signoff/S06-visual-sign-off.html && test -s .tests/test-results/icon-visual-signoff/S06-visual-sign-off-sheet.png

## Observability Impact

- Signals added/changed: deterministic visual artifacts (`.html` + `.png`) and explicit missing-surface diagnostics.
- How a future agent inspects this: run the spec and inspect `.tests/test-results/icon-visual-signoff/`.
- Failure state exposed: failing assertion names missing purpose/size or missing disk path before screenshot.
