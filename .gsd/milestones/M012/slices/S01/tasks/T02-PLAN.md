---
estimated_steps: 25
estimated_files: 8
skills_used:
  - test
---

# T02: Automate preview PNG exports and harden asset-matrix checks

Why this task exists
- R001 requires candidates to be reviewable at tiny and large install surfaces, not just as vector masters.
- Automating exports removes manual drift and creates deterministic proof for downstream slices.

Failure Modes (Q5)
| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `rsvg-convert` CLI | Exit non-zero with explicit missing-tool message and stop export | N/A (local CLI) | Reject invalid SVG and fail the run |
| `sips` CLI (dimension spot-checks) | Skip dimension check with warning + non-zero final status | N/A (local CLI) | Treat unreadable PNG metadata as failure |

Load Profile (Q6)
- Shared resources: local filesystem writes under `mockups/icon-candidates/**`.
- Per-operation cost: 15 raster exports (3 candidates x 5 sizes) plus metadata checks.
- 10x breakpoint: repeated bulk exports mainly increase local I/O time; no network or shared service bottleneck.

Negative Tests (Q7)
- Malformed inputs: invalid candidate folder name or missing `icon.svg` must fail fast.
- Error paths: simulate missing `rsvg-convert`/`sips` command and assert non-zero exit.
- Boundary conditions: zero-byte output and missing one required size must fail assertions.

Steps
1. Add `scripts/export-icon-candidates.sh` to generate `preview-16.png`, `preview-32.png`, `preview-180.png`, `preview-192.png`, and `preview-512.png` for each candidate from `icon.svg`.
2. Ensure the script is deterministic and idempotent (reruns overwrite in-place, no random filenames).
3. Extend `.tests/smoke/icon-candidates-assets.spec.js` to assert full preview matrix presence and non-zero file sizes for all candidates/sizes.
4. Include clear stderr diagnostics in the script/test so failures pinpoint missing candidate/size combinations immediately.

Must-haves
- Export script can regenerate all preview PNGs in one command.
- All 15 preview outputs exist and are non-empty.
- Asset smoke test fails loudly when any candidate/size file is absent.

## Inputs

- `mockups/icon-candidates/README.md`
- `mockups/icon-candidates/C1-ink-paper/icon.svg`
- `mockups/icon-candidates/C2-nordic-clarity/icon.svg`
- `mockups/icon-candidates/C3-verdant-studio/icon.svg`
- `.tests/smoke/icon-candidates-assets.spec.js`

## Expected Output

- `scripts/export-icon-candidates.sh`
- `mockups/icon-candidates/C1-ink-paper/preview-16.png`
- `mockups/icon-candidates/C1-ink-paper/preview-32.png`
- `mockups/icon-candidates/C1-ink-paper/preview-180.png`
- `mockups/icon-candidates/C1-ink-paper/preview-192.png`
- `mockups/icon-candidates/C1-ink-paper/preview-512.png`
- `mockups/icon-candidates/C2-nordic-clarity/preview-16.png`
- `mockups/icon-candidates/C3-verdant-studio/preview-512.png`

## Verification

bash scripts/export-icon-candidates.sh && npm --prefix .tests run test -- --reporter=line smoke/icon-candidates-assets.spec.js --grep "preview matrix"

## Observability Impact

Adds deterministic export diagnostics (missing tool, missing source SVG, missing output size) and smoke assertions that report exact missing candidate/size file paths.
