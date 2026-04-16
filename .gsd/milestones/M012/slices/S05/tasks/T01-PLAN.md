---
estimated_steps: 13
estimated_files: 7
skills_used:
  - best-practices
  - test
---

# T01: Implement deterministic desktop exporter for ICO/ICNS + contract matrix

- Why: R005 is owned by this slice; we need one canonical-driven exporter that produces both desktop packaging binaries and a stable contract without perturbing S03’s web/PWA matrix.
- Do: Add a desktop export script + Python ICO pack helper that resolve canonical sources safely, render required PNG ladders, package `.ico` and `.icns`, and emit `desktop-matrix.json` with candidate/size metadata.
- Done when: running the exporter produces valid `site/icons/desktop/year-planner.ico`, valid `site/icons/desktop/year-planner.icns`, and a `site/icons/desktop-matrix.json` contract aligned to canonical winner metadata.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `mockups/icon-candidates/canonical.json` | Fail fast with `source-resolve` diagnostics and do not write desktop outputs. | N/A (local file read) | Reject missing `candidateId`/`svgSources` or unsafe path values (`..`, absolute paths). |
| `rsvg-convert` / `python3` / `scripts/lib/pack-ico.py` | Exit non-zero with `tool-check` or `package` phase and explicit tool/file hint. | Treat as exporter failure; abort run without writing partial contract. | Reject zero-byte PNGs, invalid ICO frame count/header, or unreadable raster output metadata. |
| `iconutil` | If unavailable and no prebuilt ICNS exists, fail with actionable remediation. | N/A (local command) | Reject invalid iconset structure/chunk generation and block final contract write. |

## Load Profile

- **Shared resources**: local filesystem writes under `site/icons/desktop/` and temporary staging/iconset directories.
- **Per-operation cost**: ~17 SVG rasterizations (ICO ladder + ICNS ladder) plus one ICO pack and one ICNS package operation.
- **10x breakpoint**: CPU/IO on repeated rasterization; deterministic ordering and fail-fast checks must remain enabled to avoid partial/stale outputs.

## Negative Tests

- **Malformed inputs**: invalid JSON, missing `candidateId`, missing `svgSources.icon`, or unsafe source paths should fail before rasterization.
- **Error paths**: missing `rsvg-convert`, packer failure, missing `iconutil` without prebuilt fallback, and zero-byte outputs should all surface phase-tagged errors.
- **Boundary conditions**: enforce exact ICO size ladder (`16,24,32,48,64,128,256`) and ICNS iconset coverage through `1024` before writing `desktop-matrix.json`.

## Steps

1. Create `scripts/export-desktop-packaging-assets.sh` that reads `mockups/icon-candidates/canonical.json`, validates required fields/path safety, and resolves canonical SVG sources without hard-coded candidate folder assumptions.
2. Render deterministic PNG ladders into a temporary staging area: ICO sizes (`16,24,32,48,64,128,256`) and ICNS iconset sizes (`16,32,64,128,256,512,1024` with required `@2x` naming), using `rsvg-convert`.
3. Add `scripts/lib/pack-ico.py` and invoke it from the export script to package a multi-entry ICO file in fixed size order with validation on header and image count.
4. Package ICNS via `iconutil` (macOS) from the generated iconset and write `site/icons/desktop/year-planner.icns`; if `iconutil` is unavailable, fail with actionable diagnostics unless a prebuilt target exists for verification-only environments.
5. Emit `site/icons/desktop-matrix.json` with `schemaVersion`, `candidateId`, `generatedAt`, and desktop entries (platform, format, size inventory, src, output) while leaving `site/icons/matrix.json` untouched.

## Must-Haves

- [ ] Exporter consumes canonical metadata (`canonical.json`) and rejects unsafe paths (`..`, absolute paths).
- [ ] Exporter writes both desktop binaries at canonical paths under `site/icons/desktop/` and writes `site/icons/desktop-matrix.json`.
- [ ] Script diagnostics are phase-tagged (`tool-check`, `source-resolve`, `rasterize`, `package`, `contract`) so failures localize quickly.

## Inputs

- `mockups/icon-candidates/canonical.json`
- `scripts/export-canonical-icon-matrix.sh`
- `site/icons/matrix.json`
- `.gsd/REQUIREMENTS.md`
- `.gsd/DECISIONS.md`

## Expected Output

- `scripts/export-desktop-packaging-assets.sh`
- `scripts/lib/pack-ico.py`
- `site/icons/desktop/year-planner.ico`
- `site/icons/desktop/year-planner.icns`
- `site/icons/desktop-matrix.json`

## Verification

bash scripts/export-canonical-icon-matrix.sh && bash scripts/export-desktop-packaging-assets.sh && node -e "const fs=require('fs');const p='site/icons/desktop';if(!fs.existsSync(p+'/year-planner.ico'))throw new Error('missing ico');if(!fs.existsSync(p+'/year-planner.icns'))throw new Error('missing icns');const m=JSON.parse(fs.readFileSync('site/icons/desktop-matrix.json','utf8'));if(!Array.isArray(m.entries)||m.entries.length<2)throw new Error('desktop matrix entries missing');"

## Observability Impact

- Signals added/changed: exporter logs phase-tagged packaging progress and emits per-output metadata (`platform`, `format`, `output`).
- How a future agent inspects this: run `bash scripts/export-desktop-packaging-assets.sh` and inspect `site/icons/desktop-matrix.json`.
- Failure state exposed: non-zero exit includes phase + artifact path + failing tool (`rsvg-convert`, `iconutil`, or ICO packer).
