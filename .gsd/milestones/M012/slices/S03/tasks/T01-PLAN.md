---
estimated_steps: 10
estimated_files: 6
skills_used:
  - frontend-design
  - best-practices
---

# T01: Implement canonical exporter and purpose-specific source inputs

- Why: R003 is owned by this slice; we need one deterministic exporter that consumes the S02 winner lock and emits the full cross-platform matrix without touching production wiring.

## Steps

1. Create `scripts/export-canonical-icon-matrix.sh` that reads `mockups/icon-candidates/canonical.json`, resolves the winner folder/source paths, rejects path traversal (`..`, absolute paths), and fails fast on missing tools or missing SVG inputs.
2. Add dedicated purpose sources under the canonical winner folder (`icon-maskable.svg` and `icon-monochrome.svg`) and extend `canonical.json` `svgSources` so `any`, `maskable`, and `monochrome` exports are explicit rather than inferred.
3. Export required PNG variants into `site/icons/` with fixed filenames (`favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon-180x180.png`, `pwa-any-192x192.png`, `pwa-any-512x512.png`, `pwa-maskable-192x192.png`, `pwa-maskable-512x512.png`, `pwa-monochrome-192x192.png`, `pwa-monochrome-512x512.png`), validate non-zero bytes + dimensions, and fail with actionable messages.
4. Write `site/icons/matrix.json` as the canonical export inventory (`candidateId`, `generatedAt`, per-entry `platform`, `purpose`, `size`, `src`, `output`) to provide an inspection surface for downstream slices.

## Must-Haves

- [ ] Export script is canonical-only (`canonical.json` is the sole selector input).
- [ ] Purpose-specific matrix files and `matrix.json` are generated deterministically under `site/icons/`.
- [ ] No edits are made to `site/index.html` or `site/manifest.json` in this slice.

## Inputs

- `mockups/icon-candidates/canonical.json`
- `mockups/icon-candidates/C2-nordic-clarity/icon.svg`
- `scripts/export-icon-candidates.sh`
- `.gsd/REQUIREMENTS.md`
- `.gsd/DECISIONS.md`

## Expected Output

- `scripts/export-canonical-icon-matrix.sh`
- `mockups/icon-candidates/C2-nordic-clarity/icon-maskable.svg`
- `mockups/icon-candidates/C2-nordic-clarity/icon-monochrome.svg`
- `mockups/icon-candidates/canonical.json`
- `site/icons/matrix.json`
- `site/icons/pwa-any-192x192.png`

## Verification

bash scripts/export-canonical-icon-matrix.sh && test -f site/icons/matrix.json && rg -n '"purpose"|"output"|"candidateId"' site/icons/matrix.json

## Observability Impact

- Signals added/changed: exporter logs one line per asset (`candidateId`, `purpose`, `size`, `output`) plus phase-tagged failures.
- How a future agent inspects this: run `bash scripts/export-canonical-icon-matrix.sh` and inspect `site/icons/matrix.json`.
- Failure state exposed: non-zero exit includes phase (`tool-check`, `source-resolve`, `rasterize`, `dimension-check`) and offending file path.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `rsvg-convert` binary | Exit non-zero with `tool-check` phase and installation hint | N/A (local binary) | N/A |
| `sips` dimension probe | Exit non-zero with `dimension-check` phase and file path | N/A | Treat unreadable dimensions as failure; do not continue |
| `mockups/icon-candidates/canonical.json` | Exit non-zero with `source-resolve` phase and JSON parse/path details | N/A | Reject missing winner fields, invalid candidate folder, or unsafe paths (`..`, absolute) |

## Load Profile

- **Shared resources**: local filesystem writes under `site/icons/`; `rsvg-convert` and `sips` subprocesses.
- **Per-operation cost**: 9 raster exports + 9 dimension reads + one JSON write.
- **10x breakpoint**: CI/runtime latency increases first; correctness remains bounded if per-file checks and fail-fast behavior remain enabled.

## Negative Tests

- **Malformed inputs**: invalid JSON in `canonical.json`, missing `candidateId`, missing `svgSources.icon`, or unsafe relative paths must fail.
- **Error paths**: missing source SVG, failed `rsvg-convert`, zero-byte PNG output, or unreadable dimensions must fail with phase-tagged diagnostics.
- **Boundary conditions**: enforce exact required outputs (9 files) and exact expected dimensions for each filename.
