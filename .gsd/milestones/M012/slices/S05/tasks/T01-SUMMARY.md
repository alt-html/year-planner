---
id: T01
parent: S05
milestone: M012
key_files:
  - scripts/export-desktop-packaging-assets.sh
  - scripts/lib/pack-ico.py
  - site/icons/desktop/year-planner.ico
  - site/icons/desktop/year-planner.icns
  - site/icons/desktop-matrix.json
  - .tests/smoke/icon-desktop-packaging.spec.js
key_decisions:
  - ICO frames embed PNG data directly (modern ICO format) rather than BMP — supported by Windows Vista+, all browsers, and macOS; avoids per-frame BMP encoding complexity and produces smaller output
  - ICNS iconset uses 7 unique rasterization sizes (16,32,64,128,256,512,1024) then copies files for duplicate-size iconset slots (e.g. icon_32x32.png and icon_16x16@2x.png both receive the 32px render) — clean, avoids re-running rsvg-convert for identical output
  - desktop-matrix.json entries record sizes as an integer array rather than individual entries per size, matching the desktop packaging use-case where a single binary carries multiple sizes — distinct from matrix.json which has one entry per size for web/PWA
  - bash 3.2 compatibility preserved — avoided declare -A associative arrays in favor of named temp files, keeping the script safe on default macOS bash
duration: 
verification_result: passed
completed_at: 2026-04-16T00:10:09.059Z
blocker_discovered: false
---

# T01: Add deterministic desktop packaging exporter producing year-planner.ico (7 frames), year-planner.icns, and desktop-matrix.json contract driven by canonical.json winner metadata

**Add deterministic desktop packaging exporter producing year-planner.ico (7 frames), year-planner.icns, and desktop-matrix.json contract driven by canonical.json winner metadata**

## What Happened

Implemented the full desktop packaging pipeline for M012/S05 in three files:

**`scripts/lib/pack-ico.py`** — A standalone Python ICO packer that embeds PNG frames directly into the ICO container (modern ICO format, accepted by Windows Vista+, all browsers, and OS icon APIs). Accepts `--output` and a list of PNG paths; validates PNG magic bytes and dimensions from the IHDR chunk; writes a compliant ICONDIR + ICONDIRENTRY directory followed by image data; post-validates magic (00 00 01 00) and entry count before returning. Phase-tagged errors use `[package]`.

**`scripts/export-desktop-packaging-assets.sh`** — The primary exporter. Reads `mockups/icon-candidates/canonical.json` without any hard-coded candidate folder assumptions, validates required fields (`candidateId`, `folder`, `svgSources.icon`) and rejects unsafe path values (absolute paths, `..` traversal). Renders the ICO ladder (16,24,32,48,64,128,256 px) and ICNS iconset unique sizes (16,32,64,128,256,512,1024 px) via `rsvg-convert`, deduplicating rasterizations for ICNS. Packs ICO via `scripts/lib/pack-ico.py`. Builds a macOS `.iconset` directory with the required naming convention (`icon_NxN.png` / `icon_NxN@2x.png`) and packages it with `iconutil`. Emits `site/icons/desktop-matrix.json` with `schemaVersion`, `candidateId`, `generatedAt`, and two entries (windows/ico, macos/icns) including size inventories and src/output paths. Runs a post-write node consistency check to verify declared output paths exist on disk. All phases are tagged: `[tool-check]`, `[source-resolve]`, `[rasterize]`, `[package]`, `[contract]`. Does not touch `site/icons/matrix.json`.

**`.tests/smoke/icon-desktop-packaging.spec.js`** — A 34-assertion Playwright smoke spec covering: desktop-matrix.json structural contract (schema, required fields, format token validation, entry count, output file existence); candidateId alignment with `canonical.json` including a guard that the spec must not reference `matrix.json` output paths; ICO binary structure (magic bytes `00000100`, directory entry count=7, required size ladder 16/24/32/48/64/128/256, valid frame data offsets, PNG magic in each frame); ICNS binary structure (file magic `icns`, file-length field matches actual file size, non-empty chunk table, known iconutil OSType chunk types present, at least 5 distinct chunk types); web/PWA matrix isolation (matrix.json still exists with exactly 9 entries); and 7 negative-boundary assertions catching malformed inputs.

All 34 desktop spec tests pass. All 52 existing regression tests (icon-export-matrix.spec.js + icon-live-wiring.spec.js) pass. The candidateId alignment node check passes. site/icons/matrix.json is untouched with 9 entries.

## Verification

1. `bash scripts/export-canonical-icon-matrix.sh` — all 9 PNGs exported, matrix.json written (9 entries, exit 0).
2. `bash scripts/export-desktop-packaging-assets.sh` — ICO (7 frames), ICNS (10 iconset files → iconutil), and desktop-matrix.json written, post-write contract consistency check passed (exit 0).
3. Node inline check: ICO magic=00000100, ICO frame count=7, ICNS magic=icns, desktop-matrix entries=2, candidateId=C2 — all correct.
4. `npm --prefix .tests run test -- --reporter=line smoke/icon-desktop-packaging.spec.js` — 34 passed.
5. `npm --prefix .tests run test -- --reporter=line smoke/icon-export-matrix.spec.js smoke/icon-live-wiring.spec.js` — 52 passed (no regression).
6. `node -e "candidateId alignment check"` — candidateId alignment OK: C2.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash scripts/export-canonical-icon-matrix.sh` | 0 | ✅ pass | 1200ms |
| 2 | `bash scripts/export-desktop-packaging-assets.sh` | 0 | ✅ pass | 3800ms |
| 3 | `node -e "ICO/ICNS magic + matrix entries inline check"` | 0 | ✅ pass | 120ms |
| 4 | `npm --prefix .tests run test -- --reporter=line smoke/icon-desktop-packaging.spec.js` | 0 | ✅ pass — 34/34 | 2200ms |
| 5 | `npm --prefix .tests run test -- --reporter=line smoke/icon-export-matrix.spec.js smoke/icon-live-wiring.spec.js` | 0 | ✅ pass — 52/52 | 1900ms |
| 6 | `node -e "candidateId alignment check"` | 0 | ✅ pass | 80ms |

## Deviations

None — all steps executed as planned. The smoke spec was created in T01 (first task of slice) per the auto-mode instruction to create slice-level test files on the first task; T02 may review and extend it.

## Known Issues

iconutil is macOS-only; the exporter exits cleanly with a [tool-check] diagnostic on non-macOS CI. If Linux/Windows CI support is needed later, a prebuilt .icns or a cross-platform ICNS tool would be required. This is noted in the script and is a known design boundary, not a defect.

## Files Created/Modified

- `scripts/export-desktop-packaging-assets.sh`
- `scripts/lib/pack-ico.py`
- `site/icons/desktop/year-planner.ico`
- `site/icons/desktop/year-planner.icns`
- `site/icons/desktop-matrix.json`
- `.tests/smoke/icon-desktop-packaging.spec.js`
