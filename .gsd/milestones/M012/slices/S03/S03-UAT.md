# S03: Cross-Platform Export Matrix — UAT

**Milestone:** M012
**Written:** 2026-04-15T23:27:34.657Z

# S03 User Acceptance Test

## Preconditions
- Working directory: `/Users/craig/src/github/alt-html/year-planner`
- No prior exports or manual icon files in `site/icons/` (start clean if needed)
- Test infrastructure: Node.js, npm, bash, imagemagick/identify or equivalent PNG inspection tool
- Canonical winner: C2 (Nordic Clarity) locked in `mockups/icon-candidates/canonical.json`
- Purpose-specific SVG sources in place: `icon.svg`, `icon-maskable.svg`, `icon-monochrome.svg`

## Test Cases

### TC1: Export Script Produces All Required Files
**Goal:** Verify the exporter script generates exactly 9 PNG files in the correct locations.

**Steps:**
1. Run `bash scripts/export-canonical-icon-matrix.sh`
2. Verify exit code is 0 (success)
3. List all files in `site/icons/` with `find site/icons -maxdepth 1 -type f | sort`
4. Count PNG files (expect 9 PNGs + 1 matrix.json = 10 total files)

**Expected Outcome:**
```
site/icons/apple-touch-icon-180x180.png
site/icons/favicon-16x16.png
site/icons/favicon-32x32.png
site/icons/matrix.json
site/icons/pwa-any-192x192.png
site/icons/pwa-any-512x512.png
site/icons/pwa-maskable-192x192.png
site/icons/pwa-maskable-512x512.png
site/icons/pwa-monochrome-192x192.png
site/icons/pwa-monochrome-512x512.png
```

**Failure Mode:** Missing file(s) → indicates source SVG path resolution failure or rasterization failure.

---

### TC2: PNG Files Have Valid Format and Correct Dimensions
**Goal:** Verify every PNG file contains valid PNG headers and has the declared dimensions.

**Steps:**
1. For each PNG file, run `file <path>` and verify it reports "PNG image"
2. Extract PNG dimensions using `identify <path>` (imagemagick) or similar
3. Verify the dimensions match the filename (e.g., `favicon-16x16.png` must be 16×16)
4. Verify every PNG has non-zero file size (e.g., `wc -c <path>` > 0)

**Expected Outcome:**
- All 9 PNGs are valid PNG files (magic bytes: 89 50 4E 47 0D 0A 1A 0A)
- Dimensions match declared sizes: 16×16, 32×32, 180×180, 192×192, 512×512
- Every file size is > 100 bytes

**Failure Mode:** Invalid PNG header, wrong dimensions, or zero-byte file → indicates rasterization or dimension-validation failure.

---

### TC3: matrix.json Has Correct Structure and Content
**Goal:** Verify matrix.json is valid JSON with exactly 9 entries, covering all required purposes and platforms.

**Steps:**
1. Run `node -e "const fs=require('fs');const m=JSON.parse(fs.readFileSync('site/icons/matrix.json','utf8'));console.log('Valid JSON, entries:', m.entries.length)"`
2. Verify the response shows "entries: 9"
3. Manually inspect a few entries with `jq '.entries[] | {platform, purpose, size, output}' site/icons/matrix.json | head -6`
4. Verify matrix.json has top-level `schemaVersion`, `candidateId`, and `generatedAt` fields
5. Verify each entry has: `candidateId`, `platform`, `purpose`, `size`, `src`, `output`

**Expected Outcome:**
- matrix.json parses without errors
- Exactly 9 entries
- Top-level metadata fields present and non-empty
- All required per-entry fields present
- No duplicate platform/purpose/size combinations

**Failure Mode:** Invalid JSON, wrong entry count, or missing fields → indicates export contract violation.

---

### TC4: Purpose Coverage and Platform Distribution
**Goal:** Verify all required purposes (`any`, `maskable`, `monochrome`) are represented across platforms.

**Steps:**
1. Extract unique (platform, purpose) pairs from matrix.json: `jq '.entries[] | {platform, purpose} | @json' site/icons/matrix.json | sort -u`
2. Count entries by purpose:
   - `jq '[.entries[] | select(.purpose=="any")] | length' site/icons/matrix.json` → expect 5 (web 16, 32, 180; pwa 192, 512)
   - `jq '[.entries[] | select(.purpose=="maskable")] | length' site/icons/matrix.json` → expect 2 (pwa 192, 512)
   - `jq '[.entries[] | select(.purpose=="monochrome")] | length' site/icons/matrix.json` → expect 2 (pwa 192, 512)

**Expected Outcome:**
- 5 entries with purpose "any"
- 2 entries with purpose "maskable"
- 2 entries with purpose "monochrome"
- All platforms: web (2 sizes), ios (1 size), pwa (6 sizes across 3 purposes)

**Failure Mode:** Missing purpose bucket or wrong count → indicates source SVG selection or export loop failure.

---

### TC5: Source SVG Paths Are Valid and Relative
**Goal:** Verify every `src` path in matrix.json points to an existing file and uses safe relative paths (no `../` traversal).

**Steps:**
1. For each entry, extract `src` value: `jq -r '.entries[] | .src' site/icons/matrix.json`
2. For each path, verify the file exists: `test -f <path> && echo "OK: <path>"` or `ls -la <path>`
3. Verify no path contains `../` or absolute paths (starts with `/`)
4. Expected paths:
   - `mockups/icon-candidates/C2-nordic-clarity/icon.svg` (for `any` purpose)
   - `mockups/icon-candidates/C2-nordic-clarity/icon-maskable.svg` (for `maskable` purpose)
   - `mockups/icon-candidates/C2-nordic-clarity/icon-monochrome.svg` (for `monochrome` purpose)

**Expected Outcome:**
- All source files exist
- All paths are relative and safe (no traversal, no absolute paths)
- Paths correctly reference the C2 (Nordic Clarity) winner

**Failure Mode:** Missing source file or unsafe path → indicates path resolution or validation failure.

---

### TC6: Smoke Tests Pass (Matrix Contract)
**Goal:** Verify the dedicated matrix export smoke test suite passes all assertions.

**Steps:**
1. cd `.tests && npm run test -- --reporter=line smoke/icon-export-matrix.spec.js`
2. Expect 24 tests to pass:
   - 9 structural contract tests (JSON validity, entry count, field presence)
   - 3 purpose bucket tests
   - 3 file existence tests (non-zero bytes, PNG magic, IHDR dimensions)
   - 5 matrix ↔ disk consistency tests
   - 4 negative-path boundary tests

**Expected Outcome:**
- All 24 tests pass
- No assertion failures or timeouts
- Output shows "24 passed"

**Failure Mode:** Test failures → detailed diagnostic in test output pointing to exact assertion and data mismatch.

---

### TC7: Regression Tests Pass (S01/S02 Candidate Contracts Intact)
**Goal:** Verify S03 work did not break upstream candidate gallery or selection contracts.

**Steps:**
1. cd `.tests && npm run test -- --reporter=line smoke/icon-candidates-assets.spec.js smoke/icon-candidates-gallery.spec.js smoke/icon-candidates-selection.spec.js`
2. Expect 80 tests to pass across three suites
3. Verify all three contracts remain green:
   - icon-candidates-assets: 35 tests on SVG masters, preview matrix, PNG magic bytes
   - icon-candidates-gallery: 19 tests on gallery HTML structure and candidate count
   - icon-candidates-selection: 26 tests on canonical.json, alternatives.json, metadata consistency

**Expected Outcome:**
- All 80 tests pass
- No new failures introduced by S03 changes
- Gallery and metadata remain in sync (stripStyleBlocks validation passes)

**Failure Mode:** Test failures → indicates S03 accidentally modified S01/S02 assets or metadata.

---

### TC8: Maskable Variant Uses Correct Safe Zone Transform
**Goal:** Verify the maskable SVG uses the W3C-specified 80% safe zone transform (translate 51.2, scale 0.8).

**Steps:**
1. Inspect `mockups/icon-candidates/C2-nordic-clarity/icon-maskable.svg` for `<g>` transform
2. Look for `transform="translate(51.2,51.2) scale(0.8)"` or equivalent
3. Render the maskable variant at 192×192: examine `site/icons/pwa-maskable-192x192.png` visually
4. Verify all icon content fits within the inner circle (20% margin from edges)

**Expected Outcome:**
- maskable.svg contains safe-zone transform
- Exported maskable PNG has 20% margin on all edges
- Core icon remains visible and centered when masked as a circle

**Failure Mode:** Missing transform or content outside safe zone → would be visible as clipping when masked.

---

### TC9: Monochrome Variant Removes Color Differentiation
**Goal:** Verify the monochrome SVG removes blue/coral color, opacity gradients, and single-hue rendering works.

**Steps:**
1. Inspect `mockups/icon-candidates/C2-nordic-clarity/icon-monochrome.svg`
2. Verify no `fill`, `stroke`, or `color` attributes use non-black/non-white values
3. Render monochrome PNG at 192×192: `site/icons/pwa-monochrome-192x192.png`
4. Verify the rendered silhouette survives tinting to a single hue (mentally apply blue or gray tint)

**Expected Outcome:**
- Monochrome SVG uses only black/white, no color fills
- Exported PNG is a clean silhouette without color gradients
- Today cell is replaced with dark header bar so it survives single-hue tint

**Failure Mode:** Color in SVG or exported PNG → would not survive tinting for monochrome platform requirements.

---

### TC10: No Production Wiring Changes in S03
**Goal:** Verify S03 did NOT modify `index.html` or `manifest.json` (those are S04).

**Steps:**
1. Check git diff or file modification timestamps
2. Verify `site/index.html` was not edited in this slice
3. Verify `site/manifest.json` was not edited in this slice
4. Confirm only files modified in S03 are:
   - `scripts/export-canonical-icon-matrix.sh` (new or edited)
   - `mockups/icon-candidates/canonical.json` (modified with svgSources field)
   - `mockups/icon-candidates/C2-nordic-clarity/icon-maskable.svg` (new)
   - `mockups/icon-candidates/C2-nordic-clarity/icon-monochrome.svg` (new)
   - `site/icons/matrix.json` (generated)
   - `site/icons/*.png` (9 generated files)
   - `.tests/smoke/icon-export-matrix.spec.js` (new test)

**Expected Outcome:**
- `index.html` and `manifest.json` are unchanged
- All S03 changes are confined to export and test infrastructure
- S04 will handle production wiring independently

**Failure Mode:** Production files modified → would interfere with S04 wiring work.

---

### TC11: Export Script Output Messages Provide Clear Diagnostics
**Goal:** Verify export script emits actionable error messages for failure scenarios.

**Steps:**
1. Run exporter successfully: `bash scripts/export-canonical-icon-matrix.sh` → verify clear success message
2. Temporarily rename a purpose-specific SVG (e.g., `icon-maskable.svg`) and re-run
3. Verify error message identifies which phase failed (`tool-check`, `source-resolve`, `rasterize`, `dimension-check`) and the missing file
4. Restore the file

**Expected Outcome:**
- Success: "OK: 9 canonical PNGs exported and site/icons/matrix.json written."
- Failure: Message names the failed phase and offending file path
- Exit code 0 on success, non-zero on failure

**Failure Mode:** Silent failure or unclear error message → would delay diagnosis of real issues.

---

## Summary

S03 successfully delivers the cross-platform icon export matrix for the Year Planner. All 9 platform-specific PNG variants are generated deterministically from the C2 (Nordic Clarity) canonical source set, purpose-specific SVG variants (any, maskable, monochrome) are correctly transformed and rasterized, and matrix.json provides the machine-readable export contract for downstream S04 production wiring. The slice maintains full backward compatibility with S01/S02 candidate gallery and selection metadata contracts, and introduces robust smoke testing to ensure export quality and consistency.

## Operational Readiness

**Health Signals:**
- All 9 PNG files present in `site/icons/` with correct filenames and sizes
- matrix.json exists and is valid JSON with exactly 9 entries
- PNG magic bytes and IHDR dimensions verified by smoke tests
- All 24 matrix export tests pass on every export run

**Failure Signals:**
- Missing PNG files (indicates exporter crashed or skipped rasterization)
- Invalid PNG headers or mismatched dimensions (indicates rasterization or validation failure)
- matrix.json parse errors or wrong entry count (indicates export contract violation)
- Smoke test failures (caught by CI/CD before any asset ships)

**Recovery Procedure:**
- Re-run `bash scripts/export-canonical-icon-matrix.sh` to regenerate all 9 PNGs and matrix.json
- Verify exporter output messages for phase-tagged diagnostics (`tool-check`, `source-resolve`, `rasterize`, `dimension-check`)
- If SVG source missing: verify C2 candidate folder has all three SVG variants (icon.svg, icon-maskable.svg, icon-monochrome.svg)
- If exporter fails: check canonical.json svgSources paths are correct and relative (no ../ or absolute paths)

**Monitoring Gaps:**
- No runtime errors possible — this slice is build-time only (produces static PNG assets)
- No deployment-time health checks needed — assets are verified by smoke tests before any code lands
- Future S04 wiring must verify that exported files are actually referenced in production (that's S04's verification concern)
