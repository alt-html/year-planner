# S05: Native Desktop Packaging Asset Pack

**Goal:** Fulfil R005 by generating deterministic desktop packaging artifacts (`.ico` and `.icns`) from the canonical winner source set, with a machine-checkable desktop contract for future Windows/macOS Electron bundling.
**Demo:** `.ico` and `.icns` files are produced and validated for future Windows/macOS Electron bundling.

## Must-Haves

- `scripts/export-desktop-packaging-assets.sh` consumes `mockups/icon-candidates/canonical.json` (no hard-coded candidate paths) and produces `site/icons/desktop/year-planner.ico`, `site/icons/desktop/year-planner.icns`, and `site/icons/desktop-matrix.json`.
- Desktop outputs include multi-resolution coverage suitable for packaging (ICO: `16,24,32,48,64,128,256`; ICNS iconset coverage through `1024`) with deterministic generation order.
- `site/icons/desktop-matrix.json` is the desktop-specific contract and does not mutate the existing `site/icons/matrix.json` 9-entry web/PWA export contract from S03.
- Add and pass `.tests/smoke/icon-desktop-packaging.spec.js` with real assertions for `.ico` header/directory integrity, `.icns` signature/chunk coverage, and matrix/file consistency.
- Regression checks stay green for existing canonical export and live wiring contracts (`smoke/icon-export-matrix.spec.js`, `smoke/icon-live-wiring.spec.js`).

## Threat Surface

- **Abuse**: Path tampering in `canonical.json` or desktop matrix fields could redirect exporter reads/writes outside expected icon directories; exporter and smoke checks must reject unsafe/unexpected paths.
- **Data exposure**: None; outputs are public static assets and metadata only (no credentials, tokens, or PII).
- **Input trust**: Treat `mockups/icon-candidates/canonical.json` and any filesystem artifact references as mutable/untrusted repo inputs that must be validated before packaging.

## Requirement Impact

- **Requirements touched**: `R005` (direct owner) and supporting evidence surface for `R006`.
- **Re-verify**: `smoke/icon-desktop-packaging.spec.js`, `smoke/icon-export-matrix.spec.js`, and `smoke/icon-live-wiring.spec.js` must pass together after desktop packaging changes.
- **Decisions revisited**: `D012` (desktop packaging included in M012) and `D017` (web/PWA matrix contract must remain stable and unmodified).

## Proof Level

- This slice proves: integration
- Real runtime required: yes
- Human/UAT required: no

## Integration Closure

- Upstream surfaces consumed: `mockups/icon-candidates/canonical.json`, `scripts/export-canonical-icon-matrix.sh`, and the S03 contract file `site/icons/matrix.json`.
- New wiring introduced in this slice: desktop packaging export path `site/icons/desktop/*` plus `site/icons/desktop-matrix.json` as the machine-readable contract for future Electron bundling.
- What remains before milestone end-to-end closure: S06 must run integrated verification and visual spot checks across web/PWA + desktop packaging outputs.

## Verification

- `bash scripts/export-canonical-icon-matrix.sh`
- `bash scripts/export-desktop-packaging-assets.sh`
- `npm --prefix .tests run test -- --reporter=line smoke/icon-desktop-packaging.spec.js`
- `npm --prefix .tests run test -- --reporter=line smoke/icon-export-matrix.spec.js smoke/icon-live-wiring.spec.js`
- `node -e "const fs=require('fs');const canon=JSON.parse(fs.readFileSync('mockups/icon-candidates/canonical.json','utf8'));const desk=JSON.parse(fs.readFileSync('site/icons/desktop-matrix.json','utf8'));if(desk.candidateId!==canon.candidateId)process.exit(1);"`

## Observability / Diagnostics

- Runtime signals: exporter emits phase-tagged progress/failure lines and per-artifact metadata (`platform`, `format`, `output`).
- Inspection surfaces: `bash scripts/export-desktop-packaging-assets.sh`, `site/icons/desktop-matrix.json`, and `.tests/smoke/icon-desktop-packaging.spec.js` output.
- Failure visibility: failing phase (`tool-check`, `source-resolve`, `rasterize`, `package`, `contract`) plus artifact path and missing size/chunk details from smoke assertions.
- Redaction constraints: none (public static asset artifacts only).

## Tasks

- [x] **T01: Implement deterministic desktop exporter for ICO/ICNS + contract matrix** `est:1h10m`
  - Why: R005 is owned by this slice; we need one canonical-driven exporter that produces both desktop packaging binaries and a stable contract without perturbing S03’s web/PWA matrix.
- Do: Add a desktop export script + Python ICO pack helper that resolve canonical sources safely, render required PNG ladders, package `.ico` and `.icns`, and emit `desktop-matrix.json` with candidate/size metadata.
- Done when: running the exporter produces valid `site/icons/desktop/year-planner.ico`, valid `site/icons/desktop/year-planner.icns`, and a `site/icons/desktop-matrix.json` contract aligned to canonical winner metadata.

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
  - Files: `scripts/export-desktop-packaging-assets.sh`, `scripts/lib/pack-ico.py`, `mockups/icon-candidates/canonical.json`, `site/icons/desktop/year-planner.ico`, `site/icons/desktop/year-planner.icns`, `site/icons/desktop-matrix.json`, `site/icons/matrix.json`
  - Verify: bash scripts/export-canonical-icon-matrix.sh && bash scripts/export-desktop-packaging-assets.sh && node -e "const fs=require('fs');const p='site/icons/desktop';if(!fs.existsSync(p+'/year-planner.ico'))throw new Error('missing ico');if(!fs.existsSync(p+'/year-planner.icns'))throw new Error('missing icns');const m=JSON.parse(fs.readFileSync('site/icons/desktop-matrix.json','utf8'));if(!Array.isArray(m.entries)||m.entries.length<2)throw new Error('desktop matrix entries missing');"

- [x] **T02: Add desktop packaging smoke contract and run icon regression suite** `est:55m`
  - Why: Desktop packaging is only complete when binary integrity and contract consistency are mechanically verified, and existing web/PWA icon guarantees remain intact.
- Do: Add a focused smoke spec for `.ico`/`.icns` and desktop matrix integrity, including negative boundary checks and targeted regressions against S03/S04 icon specs.
- Done when: the new smoke suite passes with clear diagnostics and the existing icon matrix/live wiring smoke suites still pass in the same run.

## Steps

1. Create `.tests/smoke/icon-desktop-packaging.spec.js` to validate `site/icons/desktop-matrix.json` structure, candidate alignment with `mockups/icon-candidates/canonical.json`, and required output file existence.
2. Add ICO binary checks in the spec: verify magic bytes (`00 00 01 00`), parse directory entries, and assert required size coverage (`16,24,32,48,64,128,256`) with no missing declared sizes.
3. Add ICNS binary checks in the spec: verify file magic (`icns`), parse chunk table, and assert required chunk coverage derived from iconset exports.
4. Add negative-boundary assertions for malformed desktop matrix entries (missing output, invalid format token, candidate mismatch) so failures are explicit.
5. Run exporter + new smoke spec + existing `smoke/icon-export-matrix.spec.js` and `smoke/icon-live-wiring.spec.js` to prove desktop additions do not regress existing contracts.

## Must-Haves

- [ ] `.tests/smoke/icon-desktop-packaging.spec.js` exists with real binary-structure assertions for both `.ico` and `.icns`.
- [ ] Desktop smoke spec validates contract-to-disk consistency for `site/icons/desktop-matrix.json` and canonical candidate ID alignment.
- [ ] Combined regression run passes and failure messages identify exact missing size/chunk/path on breakage.
  - Files: `.tests/smoke/icon-desktop-packaging.spec.js`, `site/icons/desktop-matrix.json`, `site/icons/desktop/year-planner.ico`, `site/icons/desktop/year-planner.icns`, `scripts/export-desktop-packaging-assets.sh`, `.tests/smoke/icon-export-matrix.spec.js`, `.tests/smoke/icon-live-wiring.spec.js`
  - Verify: bash scripts/export-desktop-packaging-assets.sh && npm --prefix .tests run test -- --reporter=line smoke/icon-desktop-packaging.spec.js smoke/icon-export-matrix.spec.js smoke/icon-live-wiring.spec.js

## Files Likely Touched

- scripts/export-desktop-packaging-assets.sh
- scripts/lib/pack-ico.py
- mockups/icon-candidates/canonical.json
- site/icons/desktop/year-planner.ico
- site/icons/desktop/year-planner.icns
- site/icons/desktop-matrix.json
- site/icons/matrix.json
- .tests/smoke/icon-desktop-packaging.spec.js
- .tests/smoke/icon-export-matrix.spec.js
- .tests/smoke/icon-live-wiring.spec.js
