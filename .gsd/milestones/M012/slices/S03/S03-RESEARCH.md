# M012/S03 — Research

**Date:** 2026-04-16

## Summary

S03 is the primary owner of **R003** (platform-ready export matrix for web/PWA + iOS + Android, including `purpose` variants). The winner lock from S02 is clean and machine-readable: `mockups/icon-candidates/canonical.json` points to C2 (`C2-nordic-clarity`) and alternatives are archived separately. This is a good seam for deterministic exports because the selector is already explicit.

Current export automation is still candidate-preview-only. `scripts/export-icon-candidates.sh` renders `preview-{16,32,180,192,512}.png` for all three candidates in `mockups/`, but there is no canonical-winner export pipeline into `site/` and no matrix contract test for production assets. Current shipped app files (`site/favicon-16x16.png`, `site/favicon-32x32.png`, `site/apple-touch-icon.png`, `site/android-chrome-192x192.png`, `site/android-chrome-512x512.png`) are still legacy, and `site/manifest.json` currently has only two icons with no explicit `purpose` metadata.

Tooling is sufficient without new dependencies: `rsvg-convert`, `sips`, and `iconutil` are available; `magick/convert` are not. Existing smoke-test style in `.tests/smoke/` (Node fs assertions, no browser) is a strong pattern to follow for S03 contract checks. The currently relevant icon smoke suites all pass locally.

## Recommendation

Implement S03 as a **new canonical-export pipeline** (separate from S01 preview generation), driven by `canonical.json` only. Do not modify or repurpose `scripts/export-icon-candidates.sh`; keep candidate-preview contract stable for S01/S02 invariants.

Create a dedicated script (e.g. `scripts/export-canonical-icon-matrix.sh`) that reads winner metadata and exports a production matrix under a stable location (recommended: `site/icons/`), including at minimum:
- favicon sizes (16, 32)
- apple-touch (180)
- Android/PWA `any` (192, 512)
- Android/PWA `maskable` (192, 512)
- Android/PWA `monochrome` (192, 512)

Per the loaded `frontend-design` skill, two rules matter here: **commit to one conceptual direction** and **execute with precision**. Applied to S03: no per-size redesigns, no ad hoc edits—derive all outputs from the canonical winner source path so the selected visual language remains coherent across surfaces.

## Implementation Landscape

### Key Files

- `mockups/icon-candidates/canonical.json` — authoritative winner pointer (`candidateId`, folder, source paths); must be the only selector input for exports.
- `mockups/icon-candidates/C2-nordic-clarity/icon.svg` — canonical raster source for the selected system.
- `scripts/export-icon-candidates.sh` — existing S01 preview exporter; keep unchanged to preserve candidate contract.
- `site/` (current icon files at root) — existing production icon baseline; S03 should add/refresh matrix outputs without wiring references yet.
- `site/manifest.json` — currently minimal icon list; treat as downstream S04 wiring surface, but design S03 output names so manifest mapping is trivial.
- `.tests/smoke/icon-candidates-*.spec.js` — proven contract-test pattern (filesystem/json/regex assertions); reuse approach for S03 matrix verification.
- `.tests/smoke/compose.spec.js` + `.compose/fragments/head.html` — reminder that production head wiring is compose-driven; avoid wiring edits in S03.

### Build Order

1. **Lock export contract first** (filenames, sizes, and purposes) in script constants and test expectations.
   - This retires ambiguity and prevents S04 from re-litigating naming/path decisions.
2. **Implement canonical-only export script** that:
   - parses `canonical.json`
   - resolves winner `icon.svg`
   - exports all required PNG variants
   - validates dimensions/non-zero outputs (fail fast)
3. **Add matrix smoke test** (new `.tests/smoke/icon-export-matrix.spec.js`) asserting file existence, dimensions, and expected purpose buckets.
4. **Run exporter + smoke tests** and capture deterministic evidence.
5. **Defer `index.html`/`manifest.json` rewiring to S04** (keep slice boundaries clean).

### Verification Approach

- Export matrix:
  - `bash scripts/export-canonical-icon-matrix.sh`
- Verify produced files and dimensions:
  - `find site/icons -type f | sort`
  - `for f in site/icons/*.png; do sips --getProperty pixelWidth --getProperty pixelHeight "$f"; done`
- Run slice smoke checks:
  - `cd .tests && npx playwright test smoke/icon-export-matrix.spec.js --reporter=line`
- Regression against existing candidate contract:
  - `cd .tests && npx playwright test smoke/icon-candidates-assets.spec.js smoke/icon-candidates-gallery.spec.js smoke/icon-candidates-selection.spec.js --reporter=line`

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| SVG → PNG raster export | `rsvg-convert` | Already used in-repo; deterministic raster output from canonical SVG sources. |
| PNG resize + dimension verification | `sips` | Built-in on macOS and already used in existing export script flow. |
| Manifest icon-purpose semantics | W3C Manifest spec (`purpose: any/maskable/monochrome`) | Avoids guesswork and keeps output contract aligned with platform expectations. |

## Constraints

- Static deployment model: outputs must be plain files under `site/` with explicit paths.
- `site/index.html` is compose-generated (`.compose/fragments/head.html` source of truth); avoid wiring edits in this slice.
- S03 scope is export matrix (R003); wiring references are owned by S04.
- Local tooling does **not** include ImageMagick (`magick`/`convert` unavailable); exporter should rely on available tools (`rsvg-convert`, `sips`).

## Common Pitfalls

- **Touching S01 preview exporter for S03 outputs** — creates contract drift and risks breaking candidate smoke tests; keep S03 in a separate script.
- **Monochrome outputs derived from fully opaque art** — can collapse to an unreadable solid tile when user agents use alpha-only semantics; ensure exported monochrome assets preserve a meaningful alpha silhouette.
- **Naming drift between script and tests** — if filenames/purpose buckets are not constantized, S04 manifest wiring will become brittle.

## Open Risks

- Maskable safe-zone behavior may clip key details if maskable variants are generated naively from non-mask-safe composition.
- Monochrome legibility at small launcher sizes (especially 192) may require explicit source tuning, not just automated recolor.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| Frontend visual consistency across surfaces | `frontend-design` | installed |
| PWA/web icon matrix automation | `alonw0/web-asset-generator@web-asset-generator` | available (`npx skills add alonw0/web-asset-generator@web-asset-generator`) |

## Sources

- W3C Web App Manifest `icons` `purpose` semantics (`any`, `maskable`, `monochrome`) (source: https://github.com/w3c/manifest/blob/main/index.html)
- `iconutil` `.iconset` filename/size expectations used for downstream desktop packaging seam checks (query: `iconutil .iconset required filenames icon_16x16@2x.png icon_512x512@2x.png`, source surfaced via Google Search)
