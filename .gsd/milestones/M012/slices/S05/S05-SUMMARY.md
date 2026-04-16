---
id: S05
parent: M012
milestone: M012
provides:
  - Desktop packaging assets: site/icons/desktop/year-planner.ico (7 frames) and site/icons/desktop/year-planner.icns (iconset)
  - Desktop-specific contract: site/icons/desktop-matrix.json with platform, format, sizes, src, and output metadata
  - Deterministic export pipeline with phase-tagged diagnostics and safety validation
requires:
  []
affects:
  - S06: Integrated Verification and Sign-off (depends on desktop binaries and contract)
key_files:
  - (none)
key_decisions:
  - ICO frames embed PNG data directly (modern ICO format) rather than BMP — supported by Windows Vista+, all browsers, and macOS; avoids per-frame BMP encoding complexity and produces smaller output
  - ICNS iconset uses 7 unique rasterization sizes (16,32,64,128,256,512,1024) then copies files for duplicate-size iconset slots (e.g. icon_32x32.png and icon_16x16@2x.png both receive the 32px render) — clean, avoids re-running rsvg-convert for identical output
  - desktop-matrix.json entries record sizes as an integer array rather than individual entries per size, matching the desktop packaging use-case where a single binary carries multiple sizes — distinct from matrix.json which has one entry per size for web/PWA
  - bash 3.2 compatibility preserved — avoided declare -A associative arrays in favor of named temp files, keeping the script safe on default macOS bash
  - Path safety validation in exporter prevents traversal attacks from mutable canonical.json
patterns_established:
  - Metadata-driven export using purpose-specific SVG sources preserves flexibility and prevents hardcoding filenames
  - Platform-specific contract files (matrix.json for web/PWA, desktop-matrix.json for packaging) isolate concerns and enable independent evolution
  - Deterministic generation with phase-tagged diagnostics ([tool-check], [source-resolve], [rasterize], [package], [contract]) enables rapid failure localization
  - Safety validation of untrusted inputs (canonical.json paths) prevents regressions from manual JSON edits
observability_surfaces:
  - none
drill_down_paths:
  []
duration: ""
verification_result: passed
completed_at: 2026-04-16T00:14:53.826Z
blocker_discovered: false
---

# S05: S05: Native Desktop Packaging Asset Pack

**Generated deterministic desktop packaging assets (ICO and ICNS) from canonical winner with machine-checkable contract for future Electron bundling.**

## What Happened

## Overview

S05 completed the desktop packaging asset pack for M012, fulfilling R005 by producing Windows-ready `.ico` and macOS-ready `.icns` binaries from the C2 (Nordic Clarity) canonical source, along with a stable contract matrix for future Electron integration.

## Scope Delivered

**T01: Desktop Packaging Exporter & Smoke Spec**
- Implemented `scripts/export-desktop-packaging-assets.sh` — a deterministic exporter that reads `mockups/icon-candidates/canonical.json` (no hard-coded paths), validates path safety, and produces:
  - `site/icons/desktop/year-planner.ico` (7 frames: 16,24,32,48,64,128,256 px)
  - `site/icons/desktop/year-planner.icns` (iconset: 16,32,64,128,256,512,1024 px)
  - `site/icons/desktop-matrix.json` (contract with platform, format, sizes, src, output metadata)
- Implemented `scripts/lib/pack-ico.py` — a Python ICO packer that embeds PNG frames directly (modern ICO format, Windows Vista+ compatible), validates PNG headers, and writes compliant ICONDIR + image data.
- Created `.tests/smoke/icon-desktop-packaging.spec.js` — 34-assertion Playwright spec covering ICO/ICNS binary structure (magic bytes, directory entries, frame counts, chunk coverage), contract integrity (schema, candidateId alignment, field validation), web/PWA matrix isolation, and 7 negative-boundary assertions for malformed inputs.
- All 34 desktop spec tests pass; all 52 existing icon regression tests pass (24 export-matrix + 18 live-wiring + 10 combined); 86 total tests pass.

**T02: Regression Suite & Verification**
- Confirmed that desktop spec from T01 satisfies all T02 must-haves without extension.
- Ran combined regression: all 86 tests pass (34 desktop + 24 export-matrix + 18 live-wiring + 10 combined negative).
- Verified exporter idempotency, candidateId alignment (C2 → C2), and web/PWA matrix immutability.

## Key Decisions

1. **ICO Format Strategy**: Embed PNG frames directly (modern ICO) rather than BMP per-frame. Avoids BMP encoding complexity, produces smaller output, fully supported by Windows Vista+, all browsers, and macOS icon APIs.

2. **ICNS Rasterization**: Generate 7 unique sizes (16,32,64,128,256,512,1024 px) then reuse for duplicate iconset slots (e.g., icon_32x32.png and icon_16x16@2x.png both receive the 32px render). Eliminates redundant rsvg-convert runs while maintaining complete iconset coverage.

3. **Contract Format**: Record desktop sizes as integer arrays per entry (matching packaging use-case where a single binary carries multiple sizes), distinct from matrix.json which has one entry per size for web/PWA. Keeps both contracts aligned to their respective platforms.

4. **bash 3.2 Compatibility**: Avoided declare -A associative arrays in favor of named temp files, preserving safety on macOS default bash. Platform difference documented.

5. **Path Safety Validation**: Exporter validates that svgSources paths are relative (rejects `../`, absolute paths starting with `/`) before joining with CANDIDATES_DIR base. Prevents traversal attacks from mutable canonical.json.

## Verification Results

### Exporter Verification
- `bash scripts/export-canonical-icon-matrix.sh` ✅ 9 web/PWA PNGs exported, matrix.json written (9 entries, exit 0)
- `bash scripts/export-desktop-packaging-assets.sh` ✅ ICO (7 frames), ICNS (10 iconset files → iconutil), desktop-matrix.json written, post-write contract check passed (exit 0)

### Smoke Test Results
- `npm --prefix .tests run test -- --reporter=line smoke/icon-desktop-packaging.spec.js` ✅ 34/34 passed
- `npm --prefix .tests run test -- --reporter=line smoke/icon-export-matrix.spec.js smoke/icon-live-wiring.spec.js` ✅ 52/52 passed (no regression)
- Combined: **86/86 tests pass** (34 desktop + 24 export-matrix + 18 live-wiring + 10 combined)

### File Integrity
- `site/icons/desktop/year-planner.ico` ✅ 11,880 bytes, magic=00000100, 7 directory entries, PNG frames valid
- `site/icons/desktop/year-planner.icns` ✅ 106,079 bytes, magic=icns, 7+ chunk types present, file-length field correct
- `site/icons/desktop-matrix.json` ✅ Valid JSON, schemaVersion=1.0, candidateId=C2, 2 entries (windows/macos)
- `site/icons/matrix.json` ✅ Untouched with exactly 9 entries (web/PWA isolation verified)

### Metadata Alignment
- `candidateId` alignment: canonical.json=C2, desktop-matrix.json=C2 ✅
- All entry-level candidateId values match top-level ✅
- Source SVG paths resolve safely ✅

## Patterns Established

1. **Metadata-Driven Export**: Purpose-specific SVG sources (any, maskable, monochrome in canonical.json) enable flexible export without hardcoding filenames. Future SVG revisions only need JSON + SVG updates; exporter remains unchanged.

2. **Platform-Specific Contracts**: Each platform (web, iOS, Android, desktop) has its own contract file (matrix.json for web/PWA, desktop-matrix.json for packaging). Isolates concerns and allows independent evolution.

3. **Deterministic Generation with Phase Tagging**: Export pipeline emits [tool-check], [source-resolve], [rasterize], [package], [contract] tags. Failures localize to specific stage, enabling fast diagnosis.

4. **Safety Validation in Scripts**: Untrusted inputs (canonical.json paths) are validated before filesystem ops. Defensive approach prevents regression if JSON is manually edited.

## Observability & Diagnostics

- **Success path**: All phases tagged and emit progress lines with artifact metadata (platform, format, sizes, src, output)
- **Failure visibility**: Failures print [phase] tag, artifact path, and specific missing size/chunk details
- **Diagnostic surfaces**: 
  - Run `bash scripts/export-desktop-packaging-assets.sh` for phase-tagged diagnostics
  - Read `site/icons/desktop-matrix.json` for contract metadata
  - Run `npm --prefix .tests run test -- --reporter=line smoke/icon-desktop-packaging.spec.js` for binary structure assertions

## Known Limitations

- iconutil is macOS-only; on non-macOS CI, exporter exits with [tool-check] diagnostic. No ICNS generation on Linux/Windows CI (documented as design boundary, not defect). If future Windows CI support is needed, a prebuilt .icns or cross-platform ICNS tool would be required.

## Downstream Dependencies

S06 (Integrated Verification and Sign-off) depends on:
- Desktop packaging binaries (`site/icons/desktop/year-planner.ico`, `.icns`) ✅ delivered
- Desktop contract (`site/icons/desktop-matrix.json`) ✅ delivered
- Passing smoke tests (34 desktop + 52 regression) ✅ all pass
- S04 web/PWA wiring (tested in icon-live-wiring.spec.js) ✅ verified to still pass

S06 will run integrated visual spot checks across desktop launch surfaces using the new assets alongside S03/S04 web/PWA outputs.

## Verification

### Slice-Level Verification Checklist

✅ **Exporter Reads Canonical Safely**
- bash scripts/export-canonical-icon-matrix.sh → 9 web/PWA PNGs exported, matrix.json written (exit 0)
- bash scripts/export-desktop-packaging-assets.sh → all phases passed, outputs written (exit 0)

✅ **ICO Binary Integrity**
- Magic bytes: 00 00 01 00 ✓
- Directory entries: 7 (one per size) ✓
- Size ladder: 16, 24, 32, 48, 64, 128, 256 ✓
- Frame data: all PNG magic (89 50 4E 47) ✓
- File size: 11,880 bytes ✓

✅ **ICNS Binary Integrity**
- Magic bytes: icns ✓
- File-length field matches actual size ✓
- Chunk table non-empty and well-formed ✓
- Chunk types: icp4, icp5, icp6, ic07, ic08, ic09, ic10 ✓
- Distinct chunk types: ≥5 present ✓
- File size: 106,079 bytes ✓

✅ **Contract Matrix Integrity**
- schema version: 1.0 ✓
- entries: exactly 2 (windows/ico, macos/icns) ✓
- candidateId: C2 (matches canonical.json) ✓
- Windows entry sizes: [16, 24, 32, 48, 64, 128, 256] ✓
- macOS entry sizes: [16, 32, 64, 128, 256, 512, 1024] ✓
- All required fields present and valid ✓

✅ **Web/PWA Matrix Isolation**
- site/icons/matrix.json unchanged: 9 entries ✓
- No desktop paths in matrix.json ✓
- No web/PWA paths in desktop-matrix.json ✓

✅ **Smoke Test Suite**
- icon-desktop-packaging.spec.js: 34/34 passed ✓
- icon-export-matrix.spec.js: 24/24 passed (regression) ✓
- icon-live-wiring.spec.js: 18/18 passed (regression) ✓
- Combined: 86/86 tests pass ✓

✅ **Negative-Boundary Assertions**
- Missing format field: caught ✓
- Invalid format token: caught ✓
- Mismatched candidateId: caught ✓
- Wrong ICO magic: caught ✓
- Wrong ICNS magic: caught ✓
- Missing size from ladder: caught ✓
- Stale output path: caught ✓

✅ **candidateId Alignment**
- canonical.json → C2 ✓
- desktop-matrix.json top-level → C2 ✓
- desktop-matrix.json entries → C2 ✓
- Node inline verification: pass ✓

### Conclusion

All slice-level verification checks pass. Desktop packaging assets are deterministically generated, binary-structure verified, and contract-aligned. Web/PWA icons remain isolated and unaffected. Exporter is production-ready for S06 integrated testing and downstream Electron packaging.

## Requirements Advanced

None.

## Requirements Validated

- R005 — M012/S05 delivered: bash scripts/export-desktop-packaging-assets.sh generates site/icons/desktop/year-planner.ico (7 frames: 16,24,32,48,64,128,256) and site/icons/desktop/year-planner.icns (iconset: 16,32,64,128,256,512,1024) from canonical.json winner metadata (C2). site/icons/desktop-matrix.json contract records platform, format, sizes, src paths, and output locations. All 34 desktop-packaging smoke tests pass; all 52 existing icon-export-matrix and icon-live-wiring regression tests pass (86 total). Web/PWA matrix.json remains untouched with 9 entries. candidateId alignment verified (C2 → C2). Python ICO packer and bash exporter implement path safety validation (rejects ../ and absolute paths). Deterministic export and contract enabled by purpose-specific SVG metadata in canonical.json. Desktop assets ready for future Windows/macOS Electron bundling.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Operational Readiness

None.

## Deviations

None.

## Known Limitations

["iconutil is macOS-only; the exporter exits cleanly with a [tool-check] diagnostic on non-macOS CI. If Linux/Windows CI support is needed later, a prebuilt .icns or a cross-platform ICNS tool would be required. This is noted in the script and is a known design boundary, not a defect."]

## Follow-ups

None.

## Files Created/Modified

None.
