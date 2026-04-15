---
id: S03
parent: M012
milestone: M012
provides:
  - site/icons/ — Cross-platform PNG asset matrix (9 files)
  - site/icons/matrix.json — Deterministic export contract for downstream S04/S05 wiring
requires:
  []
affects:
  - S04 production wiring
  - S05 desktop packaging
  - S06 integrated verification
key_files:
  - scripts/export-canonical-icon-matrix.sh
  - mockups/icon-candidates/canonical.json
  - mockups/icon-candidates/C2-nordic-clarity/icon-maskable.svg
  - mockups/icon-candidates/C2-nordic-clarity/icon-monochrome.svg
  - site/icons/matrix.json
  - site/icons/pwa-any-192x192.png
  - site/icons/pwa-maskable-192x192.png
  - site/icons/pwa-monochrome-192x192.png
  - .tests/smoke/icon-export-matrix.spec.js
key_decisions:
  - D010 — canonical vector source with generated variants
  - D015 — metadata-driven selection separate from asset folders
  - D016 — C2 Nordic Clarity locked as canonical winner
  - D017 — export matrix contract published via matrix.json
patterns_established:
  - Purpose-specific SVG sources with svgSources metadata (any/maskable/monochrome)
  - Deterministic export contract via machine-readable matrix.json
  - Exporter validates path safety to prevent traversal attacks
  - Maskable variant uses W3C-standard safe-zone transform (translate 51.2, scale 0.8)
  - Monochrome variant removes color and replaces visual elements for single-hue tinting
observability_surfaces:
  - bash scripts/export-canonical-icon-matrix.sh output (phase-tagged diagnostics)
  - site/icons/matrix.json (export contract inspection)
  - .tests/smoke/icon-export-matrix.spec.js (24 assertions on matrix integrity)
drill_down_paths:
  []
duration: ""
verification_result: passed
completed_at: 2026-04-15T23:27:34.657Z
blocker_discovered: false
---

# S03: Cross-Platform Export Matrix

**S03 exports the C2 (Nordic Clarity) canonical icon set as 9 platform-specific PNG variants with purpose-driven rendering (any, maskable, monochrome) and publishes site/icons/matrix.json as the deterministic export contract for downstream wiring.**

## What Happened

## Overview

S03 fulfills R003 by exporting the canonical icon set (C2 Nordic Clarity, locked in S02) into 9 platform-specific PNG files ready for web/PWA/iOS/Android integration. The slice implements:

1. **Purpose-specific SVG source variants**: The canonical winner now has three SVG sources:
   - `icon.svg` — the standard full-color icon for `any` purpose
   - `icon-maskable.svg` — reframed with W3C safe-zone transform (translate 51.2, scale 0.8) so all content fits in the inner 80% circle for adaptive icon masking
   - `icon-monochrome.svg` — color removed, today-cell replaced with dark header, rendered as single-hue silhouette

2. **Deterministic rasterization**: The bash exporter reads canonical.json (C2 winner metadata), resolves purpose-specific SVG paths, validates for path traversal, and rasterizes to 9 PNGs:
   - Web: favicon-16x16.png, favicon-32x32.png
   - iOS: apple-touch-icon-180x180.png
   - PWA (any): pwa-any-192x192.png, pwa-any-512x512.png
   - PWA (maskable): pwa-maskable-192x192.png, pwa-maskable-512x512.png
   - PWA (monochrome): pwa-monochrome-192x192.png, pwa-monochrome-512x512.png

3. **Export contract**: site/icons/matrix.json provides deterministic metadata for all 9 exports, listing platform, purpose, size, source SVG, and output path for each entry. This machine-readable contract enables S04 production wiring and S05 desktop packaging to reference assets without recomputing export logic.

4. **Quality assurance**: New smoke test suite (icon-export-matrix.spec.js) with 24 assertions covering JSON validity, file existence, PNG integrity (magic bytes and IHDR dimensions), purpose coverage, and negative-path boundary testing. All 24 tests pass. Upstream S01/S02 candidate contracts remain intact (all 80 regression tests pass).

## Key Decisions Applied

- **D010** (canonical source pattern): Used canonical vector source + generated variants rather than per-size hand-crafted PNGs
- **D015** (metadata-driven selection): Winner selection represented as canonical.json metadata, keeping candidate folders stable for downstream S03 asset consumption
- **D016** (C2 as winner): C2 Nordic Clarity chosen for superior small-size legibility and cross-size coherence (16px–512px silhouette remains distinct)
- **D017** (export matrix contract): Exported assets published under site/icons/ with machine-readable matrix.json mapping contract, deferring index.html/manifest.json wiring to S04

## Implementation Details

- **Exporter tool**: bash scripts/export-canonical-icon-matrix.sh (python3 for JSON parsing, sed for bash 3.2 compatibility on macOS)
- **Purpose metadata**: svgSources field in canonical.json explicitly maps purpose → SVG file (prevents hardcoded assumptions)
- **Path safety**: Exporter validates svgSources paths are relative, rejects ../  and absolute paths (prevents traversal attacks)
- **Maskable transform**: translate(51.2,51.2) scale(0.8) ensures all icon content fits within inner 80% square per W3C spec
- **Monochrome design**: Color removed, no opacity gradients, today-cell replaced with dark header for single-hue tinting

## Files Created/Modified

- **scripts/export-canonical-icon-matrix.sh** — new deterministic exporter (phase-tagged diagnostics, path validation)
- **mockups/icon-candidates/canonical.json** — extended with svgSources field (any/maskable/monochrome paths)
- **mockups/icon-candidates/C2-nordic-clarity/icon-maskable.svg** — new safe-zone variant
- **mockups/icon-candidates/C2-nordic-clarity/icon-monochrome.svg** — new silhouette variant
- **site/icons/matrix.json** — generated export contract (9 entries, all platforms/purposes/sizes)
- **site/icons/*.png** — 9 generated PNG variants (all valid, correct dimensions, PNG magic bytes verified)
- **.tests/smoke/icon-export-matrix.spec.js** — new 24-test matrix contract suite

## Verification Summary

All slice-level verification checks passed:
1. ✓ Exporter produces all 9 PNG files with correct filenames
2. ✓ Every PNG has valid format (magic bytes), non-zero size, and correct dimensions
3. ✓ matrix.json parses as valid JSON with exactly 9 entries
4. ✓ All required purposes (any, maskable, monochrome) present
5. ✓ Source SVG paths are safe (relative, no traversal)
6. ✓ New matrix smoke suite: 24/24 tests pass
7. ✓ Regression tests: 80/80 upstream tests pass (S01/S02 contracts intact)
8. ✓ Maskable variant uses correct safe-zone transform
9. ✓ Monochrome variant is color-free silhouette
10. ✓ No production wiring changes (index.html, manifest.json untouched)
11. ✓ Export script provides clear diagnostics (phase tagging, file paths on error)

## What Comes Next

**S04 (Live Web/PWA Wiring)** depends on this matrix and must:
- Reference exported PNGs in index.html `<link rel="icon">`, `<link rel="apple-touch-icon">` tags
- Update manifest.json with exported icon entries (size, purpose, src)
- Verify visual spot checks at key sizes (16, 32, 180, 192, 512px)

**S05 (Native Desktop Packaging Assets)** depends on this matrix and must:
- Generate .ico (Windows) and .icns (macOS) from the canonical SVG sources
- Follow same export contract pattern (produce deterministic asset matrix)

**S06 (Integrated Verification)** depends on S04/S05 and must:
- Run existing project test flow to verify icon integration
- Perform visual verification at key surfaces and sizes

## Verification

**All verification checks passed:**

1. Export script execution: `bash scripts/export-canonical-icon-matrix.sh` → "OK: 9 canonical PNGs exported and site/icons/matrix.json written."
2. PNG file count: `find site/icons -maxdepth 1 -type f | wc -l` → 10 (9 PNGs + 1 matrix.json)
3. PNG file list verified: favicon-{16x16,32x32}, apple-touch-icon-180x180, pwa-{any,maskable,monochrome}-{192x192,512x512}, matrix.json
4. matrix.json entry count: `node -e "const fs=require('fs');const m=JSON.parse(fs.readFileSync('site/icons/matrix.json','utf8'));if(!Array.isArray(m.entries)||m.entries.length!==9){process.exit(1)}console.log('✓ Matrix has exactly 9 entries')"` → Success
5. PNG integrity and dimensions: All 9 PNGs start with valid PNG magic bytes (89 50 4E 47 0D 0A 1A 0A), IHDR dimensions match declared sizes
6. New matrix smoke test suite: `npm --prefix .tests run test -- --reporter=line smoke/icon-export-matrix.spec.js` → 24/24 tests pass
7. Regression tests: `npm --prefix .tests run test -- --reporter=line smoke/icon-candidates-assets.spec.js smoke/icon-candidates-gallery.spec.js smoke/icon-candidates-selection.spec.js` → 80/80 tests pass (S01/S02 contracts intact)
8. Source SVG paths: All references in matrix.json point to existing files; all paths are relative (no traversal)
9. Purpose coverage: 5 entries with purpose "any", 2 with "maskable", 2 with "monochrome"
10. No production wiring changes: index.html and manifest.json remain unmodified; S04 will handle wiring

**Requirement Status Update:**
- R003 updated from active → validated with proof of export matrix delivery

## Requirements Advanced

None.

## Requirements Validated

- R003 — bash scripts/export-canonical-icon-matrix.sh produces 9 platform-ready PNGs (favicon-16/32, apple-touch-180, pwa-any-192/512, pwa-maskable-192/512, pwa-monochrome-192/512) in site/icons/; matrix.json enumerates all with platform/purpose/size/src/output; all 24 matrix tests + 80 regression tests pass

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Operational Readiness

None.

## Deviations

None.

## Known Limitations

["S04 and S05 must independently verify that exported assets are actually referenced and used in production (S03 only verifies export mechanics, not integration)", "Future icon revisions must update all three purpose-specific SVG files to maintain coherence across any/maskable/monochrome variants"]

## Follow-ups

None.

## Files Created/Modified

None.
