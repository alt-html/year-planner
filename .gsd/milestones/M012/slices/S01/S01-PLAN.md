# S01: Candidate Icon/Logo Set Development

**Goal:** Produce three distinct icon/logo candidate systems as canonical SVG masters with cross-size preview PNGs, and deliver a side-by-side gallery artifact that is ready for visual winner selection in S02.
**Demo:** A side-by-side candidate gallery shows 2–3 complete icon/logo systems usable across small and large surfaces.

## Must-Haves

- Deliver exactly three candidate systems (`C1-ink-paper`, `C2-nordic-clarity`, `C3-verdant-studio`) under `mockups/icon-candidates/`, each with a coherent `icon.svg` + `logo.svg` pair.
- Export preview PNGs for each candidate at `16x16`, `32x32`, `180x180`, `192x192`, and `512x512` from canonical SVG sources.
- Rework `mockups/icon-comparison.html` into a side-by-side candidate gallery that compares all candidates across tiny and large surfaces and includes concise rationale cards.
- Add executable assertions in `.tests/smoke/icon-candidates-assets.spec.js` and `.tests/smoke/icon-candidates-gallery.spec.js` and keep them passing.
- Complete a manual legibility pass in-browser for `16x16` and `32x32` before marking the slice complete.

## Threat Surface

- **Abuse**: Low-risk static artifact slice; primary abuse vector is accidental or malicious path substitution in gallery references. Guard with file-existence assertions and fixed candidate IDs.
- **Data exposure**: None. No tokens, credentials, or user data are introduced or processed.
- **Input trust**: Inputs are repo-local SVG/HTML files only; no runtime user input is accepted in this slice.

## Requirement Impact

- **Requirements touched**: `R001`
- **Re-verify**: Candidate count (3 systems), per-size preview coverage (`16/32/180/192/512`), and gallery completeness across all candidates.
- **Decisions revisited**: `D010` (canonical vector source with generated variants)

## Proof Level

- This slice proves: contract
- Real runtime required: yes
- Human/UAT required: yes

## Verification

- `bash scripts/export-icon-candidates.sh`
- `npm --prefix .tests run test -- --reporter=line smoke/icon-candidates-assets.spec.js smoke/icon-candidates-gallery.spec.js`
- `rg -n "data-candidate=\"C1\"|data-candidate=\"C2\"|data-candidate=\"C3\"|16x16|32x32|180x180|192x192|512x512" mockups/icon-comparison.html`
- Manual review — open `mockups/icon-comparison.html` and confirm all three candidates are distinguishable at `16x16` and `32x32`.

## Observability / Diagnostics

- Runtime signals: smoke assertions emit exact missing candidate/size paths and missing gallery metadata tokens.
- Inspection surfaces: `mockups/icon-candidates/**`, `mockups/icon-comparison.html`, and Playwright smoke output.
- Failure visibility: failing checks identify the specific candidate ID, size, and file path that broke.
- Redaction constraints: none.

## Integration Closure

- Upstream surfaces consumed: `mockups/A-ink-and-paper.html`, `mockups/B-nordic-clarity.html`, `mockups/C-verdant-studio.html`, `mockups/icon-comparison.html`, and baseline files `site/favicon-16x16.png` / `site/favicon-32x32.png`.
- New wiring introduced in this slice: candidate artifact contract under `mockups/icon-candidates/` and automated candidate/gallery smoke checks.
- What remains before the milestone is truly usable end-to-end: S02 visual winner selection, S03 export matrix normalization, S04 live web/PWA wiring, S05 desktop packaging outputs, S06 integrated sign-off.

## Tasks

- [x] **T01: Define candidate contract, author three SVG master systems, and add base asset assertions** `est:55m`
  - Why: Lock a stable candidate artifact contract and create canonical masters early so all downstream export/wiring work has one source of truth.
  - Files: `mockups/icon-candidates/README.md`, `mockups/icon-candidates/C1-ink-paper/icon.svg`, `mockups/icon-candidates/C1-ink-paper/logo.svg`, `mockups/icon-candidates/C2-nordic-clarity/icon.svg`, `mockups/icon-candidates/C2-nordic-clarity/logo.svg`, `mockups/icon-candidates/C3-verdant-studio/icon.svg`, `mockups/icon-candidates/C3-verdant-studio/logo.svg`, `.tests/smoke/icon-candidates-assets.spec.js`
  - Do: Define the folder/file contract in README; author 3 clearly differentiated icon+logo SVG systems based on A/B/C mockup language; add smoke assertions for candidate folder and SVG master presence. Keep scope mockups-only (no production head/manifest edits).
  - Verify: `npm --prefix .tests run test -- --reporter=line smoke/icon-candidates-assets.spec.js --grep "candidate SVG masters"`
  - Done when: All three candidate folders contain `icon.svg` and `logo.svg`, the contract README exists, and the master-asset smoke assertion passes.

- [x] **T02: Automate preview PNG exports and harden asset-matrix checks** `est:50m`
  - Why: R001 requires candidates to be evaluable at tiny and large surfaces; deterministic export + assertions prevent manual drift.
  - Files: `scripts/export-icon-candidates.sh`, `mockups/icon-candidates/C1-ink-paper/preview-16.png`, `mockups/icon-candidates/C1-ink-paper/preview-512.png`, `mockups/icon-candidates/C2-nordic-clarity/preview-16.png`, `mockups/icon-candidates/C2-nordic-clarity/preview-512.png`, `mockups/icon-candidates/C3-verdant-studio/preview-16.png`, `mockups/icon-candidates/C3-verdant-studio/preview-512.png`, `.tests/smoke/icon-candidates-assets.spec.js`
  - Do: Implement export script using local tooling (`rsvg-convert`/`sips`) to generate 5 required preview sizes per candidate; extend asset smoke spec with full preview-matrix assertions and explicit failure messages for missing candidate/size outputs.
  - Verify: `bash scripts/export-icon-candidates.sh && npm --prefix .tests run test -- --reporter=line smoke/icon-candidates-assets.spec.js --grep "preview matrix"`
  - Done when: Script regenerates previews idempotently, all required size outputs exist for each candidate, and preview-matrix assertions pass.

- [x] **T03: Rebuild icon-comparison into a candidate gallery and add gallery integrity tests** `est:45m`
  - Why: The slice demo is the review gallery itself; without a complete side-by-side view, S02 cannot make the required visual winner decision.
  - Files: `mockups/icon-comparison.html`, `.tests/smoke/icon-candidates-gallery.spec.js`, `.tests/smoke/icon-candidates-assets.spec.js`, `mockups/icon-candidates/C1-ink-paper/preview-32.png`, `mockups/icon-candidates/C2-nordic-clarity/preview-32.png`, `mockups/icon-candidates/C3-verdant-studio/preview-32.png`, `site/favicon-16x16.png`, `site/favicon-32x32.png`
  - Do: Replace icon-library comparison content with a C1/C2/C3 gallery matrix at `16/32/180/192/512`, include legacy favicon baseline row and rationale cards, add machine-readable `data-candidate` and `data-size` hooks, and add gallery smoke assertions for candidate count, size coverage, and referenced file existence.
  - Verify: `npm --prefix .tests run test -- --reporter=line smoke/icon-candidates-assets.spec.js smoke/icon-candidates-gallery.spec.js && rg -n "data-candidate=\"C1\"|data-candidate=\"C2\"|data-candidate=\"C3\"|16x16|32x32|180x180|192x192|512x512" mockups/icon-comparison.html`
  - Done when: Gallery renders three candidate systems across all five required sizes with rationale, smoke checks pass, and manual tiny-size legibility review is complete.

## Files Likely Touched

- `mockups/icon-candidates/README.md`
- `mockups/icon-candidates/C1-ink-paper/icon.svg`
- `mockups/icon-candidates/C1-ink-paper/logo.svg`
- `mockups/icon-candidates/C2-nordic-clarity/icon.svg`
- `mockups/icon-candidates/C2-nordic-clarity/logo.svg`
- `mockups/icon-candidates/C3-verdant-studio/icon.svg`
- `mockups/icon-candidates/C3-verdant-studio/logo.svg`
- `scripts/export-icon-candidates.sh`
- `.tests/smoke/icon-candidates-assets.spec.js`
- `.tests/smoke/icon-candidates-gallery.spec.js`
- `mockups/icon-comparison.html`
