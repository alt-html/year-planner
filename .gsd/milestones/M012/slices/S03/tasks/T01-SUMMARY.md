---
id: T01
parent: S03
milestone: M012
key_files:
  - scripts/export-canonical-icon-matrix.sh
  - mockups/icon-candidates/C2-nordic-clarity/icon-maskable.svg
  - mockups/icon-candidates/C2-nordic-clarity/icon-monochrome.svg
  - mockups/icon-candidates/canonical.json
  - site/icons/matrix.json
  - site/icons/pwa-any-192x192.png
  - site/icons/pwa-maskable-192x192.png
  - site/icons/pwa-monochrome-192x192.png
key_decisions:
  - Used python3 (macOS built-in) for JSON parsing instead of jq to avoid external dependency on CI/developer machines
  - Replaced bash 4 mapfile with sed -n 'Np' for bash 3.2 compatibility (macOS default shell)
  - Maskable variant uses translate(51.2,51.2) scale(0.8) to fit all content within the inner-80% safe zone square per W3C maskable spec
  - Monochrome variant removes colour differentiation (blue/coral/opacity) and replaces today-cell with header dark so the silhouette survives single-hue tinting
  - svgSources paths in canonical.json remain relative to mockups/icon-candidates/ — exporter joins with CANDIDATES_DIR for safe resolution
duration: 
verification_result: passed
completed_at: 2026-04-15T23:20:16.466Z
blocker_discovered: false
---

# T01: Implemented canonical icon exporter with maskable/monochrome SVG sources, exporting 9-entry cross-platform matrix to site/icons/ with phase-tagged validation and matrix.json inventory

**Implemented canonical icon exporter with maskable/monochrome SVG sources, exporting 9-entry cross-platform matrix to site/icons/ with phase-tagged validation and matrix.json inventory**

## What Happened

Created three artifacts in sequence:

1. **`icon-maskable.svg`** — derives from `icon.svg` but with a full-bleed background (no `rx` on the outer rect) and all visible content wrapped in `<g transform="translate(51.2,51.2) scale(0.8)">` so the design fits within the inner-80% safe zone. The safe zone square (409.6×409.6 centred at 256,256) satisfies the W3C maskable spec: important content survives any circle, rounded-square, or squircle mask the OS applies.

2. **`icon-monochrome.svg`** — same structural layout as `icon.svg` but with colour differentiation stripped: blue today-cell replaced with the same dark (#1A1D23) as the header, coral and blue tints removed, weekday dots rendered at full opacity, and all cells in two neutral tones (#E8EAF0 weekday / #D0D3DC weekend). This design resolves to a legible calendar silhouette under any single-hue tint applied by the host OS.

3. **`canonical.json`** — extended `svgSources` with `"maskable"` and `"monochrome"` keys pointing at the new SVG files. All paths remain relative to `mockups/icon-candidates/` (no absolute paths, no `..`).

4. **`scripts/export-canonical-icon-matrix.sh`** — reads `canonical.json` via python3 (no `jq` dependency), validates all four `svgSources` paths against absolute-path and path-traversal guards, then runs `rsvg-convert` for each of the 9 matrix entries. Each output is verified non-zero-byte and dimension-checked with `sips`. Phase-tagged error prefixes (`[tool-check]`, `[source-resolve]`, `[rasterize]`, `[dimension-check]`) identify failure stage. On full success, writes `site/icons/matrix.json` via python3 for correct JSON serialisation.

One implementation adaptation: `mapfile` (bash 4+) was replaced with `sed -n 'Np'` for reading python3 output lines, because macOS ships bash 3.2.

## Verification

Ran `bash scripts/export-canonical-icon-matrix.sh` — all 9 exports completed, sips confirmed exact dimensions for each PNG, matrix.json written. Validated `matrix.json` contains exactly 9 entries with `candidateId`, `purpose`, and `output` keys. Verified `find site/icons -maxdepth 1 -type f` lists all 9 PNGs plus matrix.json. Ran S01/S02 regression suite (80 tests): 80 passed, 0 failed.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash scripts/export-canonical-icon-matrix.sh` | 0 | ✅ pass | 4200ms |
| 2 | `node -e "const fs=require('fs');const m=JSON.parse(fs.readFileSync('site/icons/matrix.json','utf8'));if(!Array.isArray(m.entries)||m.entries.length!==9){process.exit(1)}"` | 0 | ✅ pass | 80ms |
| 3 | `find site/icons -maxdepth 1 -type f | sort` | 0 | ✅ pass — 10 files (9 PNGs + matrix.json) | 30ms |
| 4 | `npm --prefix .tests run test -- --reporter=line smoke/icon-candidates-assets.spec.js smoke/icon-candidates-gallery.spec.js smoke/icon-candidates-selection.spec.js` | 0 | ✅ pass — 80/80 | 2700ms |

## Deviations

mapfile (bash 4+) replaced with `sed -n 'Np'` — macOS ships bash 3.2 where mapfile is not available. Functionally equivalent for reading fixed-count lines from a variable.

## Known Issues

none

## Files Created/Modified

- `scripts/export-canonical-icon-matrix.sh`
- `mockups/icon-candidates/C2-nordic-clarity/icon-maskable.svg`
- `mockups/icon-candidates/C2-nordic-clarity/icon-monochrome.svg`
- `mockups/icon-candidates/canonical.json`
- `site/icons/matrix.json`
- `site/icons/pwa-any-192x192.png`
- `site/icons/pwa-maskable-192x192.png`
- `site/icons/pwa-monochrome-192x192.png`
