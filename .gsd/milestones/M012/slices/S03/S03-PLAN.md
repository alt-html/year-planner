# S03: Cross-Platform Export Matrix

**Goal:** Fulfil R003 by exporting a deterministic canonical icon matrix from S02 winner metadata for web/PWA/iOS/Android surfaces, including any/maskable/monochrome purpose variants, under `site/icons/` without production wiring changes.
**Demo:** Exported asset matrix exists for web/PWA, iOS, Android any/maskable/monochrome requirements.

## Must-Haves

- Export matrix is generated from `mockups/icon-candidates/canonical.json` only (no hard-coded candidate folder IDs).
- Produce PNG assets under `site/icons/` for favicon (`16`,`32`), apple-touch (`180`), PWA `any` (`192`,`512`), PWA `maskable` (`192`,`512`), and PWA `monochrome` (`192`,`512`).
- Emit `site/icons/matrix.json` enumerating each output path, platform, purpose, size, and source SVG so S04 can wire references without guessing.
- Add and pass `.tests/smoke/icon-export-matrix.spec.js` with real assertions for existence, PNG magic bytes, exact dimensions, and purpose-bucket coverage.
- Keep S01/S02 candidate contract smoke suites green: `smoke/icon-candidates-assets.spec.js`, `smoke/icon-candidates-gallery.spec.js`, and `smoke/icon-candidates-selection.spec.js`.

## Threat Surface

- **Abuse**: `canonical.json` path tampering (e.g., `../` traversal or absolute path injection) could force export reads outside candidate folders; exporter must reject non-relative safe paths.
- **Data exposure**: None expected — exported artifacts are static PNG/JSON files with no credentials or personal data.
- **Input trust**: Untrusted inputs are repo-local files (`mockups/icon-candidates/canonical.json`, winner SVG sources); treat them as mutable and validate before filesystem reads/writes.

## Requirement Impact

- **Requirements touched**: `R003` (primary owner `M012/S03`).
- **Re-verify after shipping**: matrix export completeness (9 files), per-file dimensions, and no regressions in `smoke/icon-candidates-assets.spec.js`, `smoke/icon-candidates-gallery.spec.js`, `smoke/icon-candidates-selection.spec.js`.
- **Decisions revisited**: `D010` (canonical vector source + generated variants), `D015` (metadata-driven winner lock), `D016` (C2 fixed as winner consumed by exporter).

## Proof Level

- This slice proves: integration
- Real runtime required: yes
- Human/UAT required: no

## Integration Closure

- Upstream surfaces consumed: `mockups/icon-candidates/canonical.json`, `mockups/icon-candidates/C2-nordic-clarity/icon.svg`, and existing candidate-contract smoke tests.
- New wiring introduced in this slice: `scripts/export-canonical-icon-matrix.sh` and the generated `site/icons/matrix.json` export contract for downstream wiring.
- What remains before the milestone is truly usable end-to-end: S04 must update `site/index.html`/`site/manifest.json` to reference exported files, and S05 must generate `.ico`/`.icns` package assets from the canonical set.

## Verification

- `bash scripts/export-canonical-icon-matrix.sh`
- `npm --prefix .tests run test -- --reporter=line smoke/icon-export-matrix.spec.js`
- `node -e "const fs=require('fs');const m=JSON.parse(fs.readFileSync('site/icons/matrix.json','utf8'));if(!Array.isArray(m.entries)||m.entries.length!==9){process.exit(1)}"`
- `npm --prefix .tests run test -- --reporter=line smoke/icon-candidates-assets.spec.js smoke/icon-candidates-gallery.spec.js smoke/icon-candidates-selection.spec.js`
- `find site/icons -maxdepth 1 -type f | sort`

## Observability / Diagnostics

- Runtime signals: exporter emits per-asset lines (`candidateId`, `purpose`, `size`, `output`) and phase-tagged failures.
- Inspection surfaces: `site/icons/matrix.json`, `bash scripts/export-canonical-icon-matrix.sh` output, and `smoke/icon-export-matrix.spec.js` assertion diagnostics.
- Failure visibility: non-zero exit identifies failure phase (`tool-check`, `source-resolve`, `rasterize`, `dimension-check`) and offending file path.
- Redaction constraints: none (static public asset files only).

## Tasks

- [x] **T01: Implement canonical exporter and purpose-specific source inputs** `est:55m`
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
  - Files: `scripts/export-canonical-icon-matrix.sh`, `mockups/icon-candidates/canonical.json`, `mockups/icon-candidates/C2-nordic-clarity/icon-maskable.svg`, `mockups/icon-candidates/C2-nordic-clarity/icon-monochrome.svg`, `site/icons/matrix.json`, `site/icons/pwa-any-192x192.png`
  - Verify: bash scripts/export-canonical-icon-matrix.sh && test -f site/icons/matrix.json && rg -n '"purpose"|"output"|"candidateId"' site/icons/matrix.json

- [ ] **T02: Add matrix smoke contract and run regression verification** `est:45m`
  - Why: This slice is only done when the matrix is mechanically provable and upstream candidate contracts remain intact.

## Steps

1. Add `.tests/smoke/icon-export-matrix.spec.js` using Node filesystem assertions (no browser) to enforce the 9-file export matrix, required purpose buckets (`any`, `maskable`, `monochrome`), PNG signature bytes, exact width/height, and `matrix.json` consistency.
2. Include negative-path assertions in the new smoke spec so malformed `matrix.json` (missing purpose, duplicate size-purpose key, or missing output file) is detected by explicit failing checks.
3. Run the canonical exporter and then execute both the new matrix smoke suite and existing candidate smoke suites to ensure S03 does not regress S01/S02 guarantees.
4. Tighten assertion messages so failures name the exact purpose/size/path that broke, minimizing diagnosis time for later slices.

## Must-Haves

- [ ] `smoke/icon-export-matrix.spec.js` exists and asserts on real generated files.
- [ ] New matrix smoke and existing candidate smoke suites pass together.
- [ ] Verification output points directly to failing purpose/size/path on breakage.
  - Files: `.tests/smoke/icon-export-matrix.spec.js`, `scripts/export-canonical-icon-matrix.sh`, `site/icons/matrix.json`, `site/icons/pwa-any-512x512.png`, `site/icons/pwa-maskable-512x512.png`, `site/icons/pwa-monochrome-512x512.png`
  - Verify: bash scripts/export-canonical-icon-matrix.sh && npm --prefix .tests run test -- --reporter=line smoke/icon-export-matrix.spec.js smoke/icon-candidates-assets.spec.js smoke/icon-candidates-gallery.spec.js smoke/icon-candidates-selection.spec.js

## Files Likely Touched

- scripts/export-canonical-icon-matrix.sh
- mockups/icon-candidates/canonical.json
- mockups/icon-candidates/C2-nordic-clarity/icon-maskable.svg
- mockups/icon-candidates/C2-nordic-clarity/icon-monochrome.svg
- site/icons/matrix.json
- site/icons/pwa-any-192x192.png
- .tests/smoke/icon-export-matrix.spec.js
- site/icons/pwa-any-512x512.png
- site/icons/pwa-maskable-512x512.png
- site/icons/pwa-monochrome-512x512.png
