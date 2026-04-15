---
estimated_steps: 10
estimated_files: 6
skills_used:
  - test
  - technical-writing
---

# T02: Add matrix smoke contract and run regression verification

- Why: This slice is only done when the matrix is mechanically provable and upstream candidate contracts remain intact.

## Steps

1. Add `.tests/smoke/icon-export-matrix.spec.js` using Node filesystem assertions (no browser) to enforce the 9-file export matrix, required purpose buckets (`any`, `maskable`, `monochrome`), PNG signature bytes, exact width/height, and `matrix.json` consistency.
2. Include negative-path assertions in the new smoke spec so malformed `matrix.json` (missing purpose, duplicate size-purpose key, or missing output file) is detected by explicit failing checks.
3. Run the canonical exporter and then execute both the new matrix smoke suite and existing candidate smoke suites to ensure S03 does not regress S01/S02 guarantees.
4. Tighten assertion messages so failures name the exact purpose/size/path that broke, minimizing diagnosis time for later slices.

## Must-Haves

- [ ] `smoke/icon-export-matrix.spec.js` exists and asserts on real generated files.
- [ ] New matrix smoke and existing candidate smoke suites pass together.
- [ ] Verification output points directly to failing purpose/size/path on breakage.

## Inputs

- `scripts/export-canonical-icon-matrix.sh`
- `site/icons/matrix.json`
- `mockups/icon-candidates/canonical.json`
- `.tests/smoke/icon-candidates-assets.spec.js`
- `.tests/smoke/icon-candidates-gallery.spec.js`
- `.tests/smoke/icon-candidates-selection.spec.js`

## Expected Output

- `.tests/smoke/icon-export-matrix.spec.js`
- `site/icons/matrix.json`
- `site/icons/pwa-any-512x512.png`
- `site/icons/pwa-maskable-512x512.png`
- `site/icons/pwa-monochrome-512x512.png`

## Verification

bash scripts/export-canonical-icon-matrix.sh && npm --prefix .tests run test -- --reporter=line smoke/icon-export-matrix.spec.js smoke/icon-candidates-assets.spec.js smoke/icon-candidates-gallery.spec.js smoke/icon-candidates-selection.spec.js

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Playwright smoke runner (`@playwright/test`) | Fail task and surface spec + assertion context | Treat as infra issue; retry once then report blocker | N/A |
| `site/icons/matrix.json` | Fail with missing/invalid JSON diagnostics | N/A | Fail missing fields (`purpose`, `size`, `output`) and duplicate purpose-size pairs |
| Exported PNG files | Fail with missing file or header/dimension mismatch path | N/A | Fail bad PNG magic bytes or mismatched dimensions |

## Load Profile

- **Shared resources**: Playwright worker processes, Node filesystem reads, and generated icon files under `site/icons/`.
- **Per-operation cost**: O(9) file inspections + JSON parse + existing candidate smoke suite execution.
- **10x breakpoint**: test runtime grows first; no shared network/rate-limit bottlenecks in current scope.

## Negative Tests

- **Malformed inputs**: corrupted `matrix.json`, invalid purpose token, or duplicate purpose-size tuple must fail.
- **Error paths**: missing exported PNG file or stale path in `matrix.json` must fail with exact path in assertion output.
- **Boundary conditions**: matrix must contain exactly 9 entries and complete purpose coverage (`any`, `maskable`, `monochrome`) at required sizes.
