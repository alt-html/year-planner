# S05: S05: Native Desktop Packaging Asset Pack — UAT

**Milestone:** M012
**Written:** 2026-04-16T00:14:53.827Z


# S05 User Acceptance Test (UAT)

## Preconditions

- SVG source file exists: `mockups/icon-candidates/C2-nordic-clarity/icon.svg`
- `canonical.json` exists at `mockups/icon-candidates/canonical.json` with C2 as winner
- `scripts/export-desktop-packaging-assets.sh` is executable
- `scripts/lib/pack-ico.py` is executable
- `rsvg-convert` is available on system PATH (for PNG rasterization)
- `iconutil` is available on macOS (for ICNS packaging)
- Current working directory: project root
- All prior slices (S01–S04) have been completed and exported

## Test Cases

### TC1: Desktop Exporter Reads Canonical Metadata Safely
**Goal:** Verify the exporter validates input paths and rejects path traversal attacks.

1. Run: `bash scripts/export-desktop-packaging-assets.sh`
2. Expected: 
   - Script reads `mockups/icon-candidates/canonical.json` successfully
   - Validates `candidateId`, `folder`, and `svgSources.icon` fields
   - Rejects any path containing `..` or leading `/` with [source-resolve] diagnostic
   - Continues successfully if all paths are relative and safe

### TC2: Desktop Exporter Renders ICO with 7 Frames at Correct Sizes
**Goal:** Verify the ICO ladder is complete and correctly sized.

1. Run: `bash scripts/export-desktop-packaging-assets.sh`
2. Verify output file: `site/icons/desktop/year-planner.ico`
3. Expected:
   - File exists and is > 10 KB
   - File starts with magic bytes: `00 00 01 00`
   - ICONDIR contains exactly 7 directory entries (one per size)
   - Directory entries list sizes: 16, 24, 32, 48, 64, 128, 256
   - Each entry has valid offset and size fields pointing to PNG data
   - Each frame starts with PNG magic: `89 50 4E 47`

### TC3: Desktop Exporter Builds ICNS with 7 Unique Sizes
**Goal:** Verify ICNS iconset covers required macOS sizes with correct naming.

1. Run: `bash scripts/export-desktop-packaging-assets.sh`
2. Verify output file: `site/icons/desktop/year-planner.icns`
3. Expected:
   - File exists and is > 100 KB
   - File starts with ICNS magic: `icns` (hex: `69 63 6E 73`)
   - File-length field in header matches actual file size
   - iconutil generated required chunk types: `icp4`, `icp5`, `icp6`, `ic07`, `ic08`, `ic09`, `ic10` (covering 16–1024 px)
   - Chunk table is non-empty and well-formed
   - At least 5 distinct chunk types present

### TC4: Desktop-Matrix Contract is Well-Formed and Immutable
**Goal:** Verify the contract JSON captures all required metadata without mutating web/PWA matrix.

1. Run: `bash scripts/export-desktop-packaging-assets.sh`
2. Read and validate: `site/icons/desktop-matrix.json`
3. Expected:
   - JSON is valid and parses without error
   - Contains `schemaVersion`, `candidateId`, `candidateName`, `generatedAt`
   - `candidateId` matches `canonical.json` winner (C2)
   - `entries` array has exactly 2 items (windows/ico and macos/icns)
   - Each entry contains platform, format, candidateId, src, output, sizes
   - Windows entry sizes: [16, 24, 32, 48, 64, 128, 256]
   - macOS entry sizes: [16, 32, 64, 128, 256, 512, 1024]
4. Read: `site/icons/matrix.json` (web/PWA matrix from S03)
5. Expected:
   - File is unchanged with exactly 9 entries (no mutation by desktop exporter)
   - All entries reference web/PWA platform purposes (any, maskable, monochrome)

### TC5: Smoke Test Suite Passes All 86 Assertions
**Goal:** Verify complete integration test coverage across desktop + web/PWA icons.

1. Run: `npm --prefix .tests run test -- --reporter=line smoke/icon-desktop-packaging.spec.js smoke/icon-export-matrix.spec.js smoke/icon-live-wiring.spec.js`
2. Expected:
   - All 86 tests pass (34 desktop + 24 export-matrix + 18 live-wiring + 10 combined)
   - No timeouts or flaky failures
   - Failure output (if any) clearly identifies failing assertion and artifact path

### TC6: Negative-Boundary Assertions Catch Malformed Inputs
**Goal:** Verify that smoke tests reject invalid contracts and binaries.

1. Manually corrupt `site/icons/desktop-matrix.json` (remove `format` field)
2. Run: `npm --prefix .tests run test -- --reporter=line smoke/icon-desktop-packaging.spec.js 2>&1 | grep -i "format"`
3. Expected: Test fails with clear diagnostic about missing format
4. Manually corrupt ICO file (overwrite first 4 bytes with `FF FF FF FF`)
5. Run smoke test → Expected: ICO binary structure test fails
6. Run: `bash scripts/export-desktop-packaging-assets.sh` again
7. Expected: Exporter regenerates valid binaries, all smoke tests pass again

### TC7: candidateId Alignment Verification
**Goal:** Verify contract metadata points to correct canonical winner.

1. Read: `mockups/icon-candidates/canonical.json` → extract `candidateId`
2. Read: `site/icons/desktop-matrix.json` → extract top-level and per-entry `candidateId`
3. Expected:
   - All three candidateId values are identical and equal to "C2"
   - Inline node check passes

### TC8: Exporter Emits Phase-Tagged Diagnostics
**Goal:** Verify that failures are clearly tagged to specific pipeline stage.

1. Run: `bash scripts/export-desktop-packaging-assets.sh 2>&1`
2. Expected output contains tags in order: [tool-check], [source-resolve], [rasterize], [package], [contract]

### TC9: Post-Write Contract Consistency Check
**Goal:** Verify output files exist and are non-empty after export.

1. Delete output files: `rm -f site/icons/desktop/year-planner.{ico,icns}`
2. Run: `bash scripts/export-desktop-packaging-assets.sh 2>&1 | tail -10`
3. Expected:
   - Both files exist and are > 1 KB
   - Inline node check at end of script passes

### TC10: Deterministic Export (Idempotency)
**Goal:** Verify that running the exporter twice produces identical binaries.

1. Run: `bash scripts/export-desktop-packaging-assets.sh`
2. Save checksums: `md5sum site/icons/desktop/year-planner.{ico,icns} > /tmp/checksums1.txt`
3. Delete output files: `rm -f site/icons/desktop/year-planner.{ico,icns}`
4. Run exporter again: `bash scripts/export-desktop-packaging-assets.sh`
5. Compare checksums: `md5sum site/icons/desktop/year-planner.{ico,icns} > /tmp/checksums2.txt && diff /tmp/checksums1.txt /tmp/checksums2.txt`
6. Expected: Checksums are identical (deterministic output)

## Success Criteria

- ✅ All 10 test cases pass
- ✅ All 86 smoke tests pass (34 desktop + 52 regression)
- ✅ candidateId alignment verified (C2 → C2)
- ✅ Web/PWA matrix.json remains untouched
- ✅ No regressions in existing icon-export-matrix and icon-live-wiring specs
- ✅ Desktop assets are deterministically generated and verified
- ✅ Failure diagnostics are phase-tagged and actionable
- ✅ Desktop-matrix.json contract is well-formed and immutable after generation

