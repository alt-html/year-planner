---
estimated_steps: 13
estimated_files: 7
skills_used:
  - test
  - best-practices
---

# T02: Add desktop packaging smoke contract and run icon regression suite

- Why: Desktop packaging is only complete when binary integrity and contract consistency are mechanically verified, and existing web/PWA icon guarantees remain intact.
- Do: Add a focused smoke spec for `.ico`/`.icns` and desktop matrix integrity, including negative boundary checks and targeted regressions against S03/S04 icon specs.
- Done when: the new smoke suite passes with clear diagnostics and the existing icon matrix/live wiring smoke suites still pass in the same run.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `site/icons/desktop-matrix.json` | Fail tests immediately with matrix contract assertion output. | N/A (local file read) | Reject missing fields (`candidateId`, `entries`, `format`, `output`) and invalid format tokens. |
| Desktop binaries (`year-planner.ico`, `year-planner.icns`) | Fail with file-specific assertion and required regeneration command. | N/A | Reject invalid magic bytes, malformed directory/chunk parsing, or missing required size/chunk coverage. |
| Playwright smoke runner (`npm --prefix .tests run test`) | Stop task and surface command output; do not mark slice ready. | Treat timeout as failed verification; rerun only after reducing flakiness/root-cause fix. | N/A |

## Load Profile

- **Shared resources**: filesystem reads of desktop binaries and shared smoke-test execution with S03/S04 icon suites.
- **Per-operation cost**: one exporter run plus three smoke specs (`icon-desktop-packaging`, `icon-export-matrix`, `icon-live-wiring`).
- **10x breakpoint**: test runtime/CI wall-clock first; binary parsing remains O(file-size) and should stay lightweight.

## Negative Tests

- **Malformed inputs**: synthetic malformed desktop-matrix entries (missing output, invalid format token, candidate mismatch) must fail explicit assertions.
- **Error paths**: missing desktop files, bad ICO/ICNS magic, and missing required size/chunk coverage must produce actionable assertion messages.
- **Boundary conditions**: enforce exact required ICO size set and required ICNS chunk family presence, not just file existence.

## Steps

1. Create `.tests/smoke/icon-desktop-packaging.spec.js` to validate `site/icons/desktop-matrix.json` structure, candidate alignment with `mockups/icon-candidates/canonical.json`, and required output file existence.
2. Add ICO binary checks in the spec: verify magic bytes (`00 00 01 00`), parse directory entries, and assert required size coverage (`16,24,32,48,64,128,256`) with no missing declared sizes.
3. Add ICNS binary checks in the spec: verify file magic (`icns`), parse chunk table, and assert required chunk coverage derived from iconset exports.
4. Add negative-boundary assertions for malformed desktop matrix entries (missing output, invalid format token, candidate mismatch) so failures are explicit.
5. Run exporter + new smoke spec + existing `smoke/icon-export-matrix.spec.js` and `smoke/icon-live-wiring.spec.js` to prove desktop additions do not regress existing contracts.

## Must-Haves

- [ ] `.tests/smoke/icon-desktop-packaging.spec.js` exists with real binary-structure assertions for both `.ico` and `.icns`.
- [ ] Desktop smoke spec validates contract-to-disk consistency for `site/icons/desktop-matrix.json` and canonical candidate ID alignment.
- [ ] Combined regression run passes and failure messages identify exact missing size/chunk/path on breakage.

## Inputs

- `scripts/export-desktop-packaging-assets.sh`
- `site/icons/desktop-matrix.json`
- `site/icons/desktop/year-planner.ico`
- `site/icons/desktop/year-planner.icns`
- `mockups/icon-candidates/canonical.json`
- `.tests/smoke/icon-export-matrix.spec.js`
- `.tests/smoke/icon-live-wiring.spec.js`

## Expected Output

- `.tests/smoke/icon-desktop-packaging.spec.js`
- `site/icons/desktop-matrix.json`

## Verification

bash scripts/export-desktop-packaging-assets.sh && npm --prefix .tests run test -- --reporter=line smoke/icon-desktop-packaging.spec.js smoke/icon-export-matrix.spec.js smoke/icon-live-wiring.spec.js

## Observability Impact

- Signals added/changed: desktop smoke assertions report failing artifact type (`ico`/`icns`), missing size/chunk, and contract path drift.
- How a future agent inspects this: run `npm --prefix .tests run test -- --reporter=line smoke/icon-desktop-packaging.spec.js` and inspect failing assertion messages.
- Failure state exposed: test output identifies exact binary/contract field mismatch plus remediation command (`bash scripts/export-desktop-packaging-assets.sh`).
