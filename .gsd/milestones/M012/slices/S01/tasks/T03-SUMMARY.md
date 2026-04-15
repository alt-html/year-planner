---
id: T03
parent: S01
milestone: M012
key_files:
  - mockups/icon-comparison.html
  - .tests/smoke/icon-candidates-gallery.spec.js
key_decisions:
  - Gallery uses display:contents on row wrappers so size-row div carries data-size while its children become direct CSS grid items — keeps semantic grouping without breaking grid layout
  - Each tiny-size cell (16px, 32px) renders the PNG twice: once at native size (for accuracy) and once upscaled with image-rendering:pixelated (for readability) — both use the same src so unique-src count stays at exactly 15
  - onerror on every preview img adds .img-broken to the cell, applying a hatched red background and a text warning — implements the Q5 broken-state marker without JavaScript frameworks
  - Smoke spec uses two meta-negative tests (strip one size / inject C4) to verify the assertion logic is sensitive — these run against an in-memory modified copy of the HTML, not against live files
duration: 
verification_result: passed
completed_at: 2026-04-15T21:26:38.239Z
blocker_discovered: false
---

# T03: Replace icon-comparison.html with a candidate gallery (C1/C2/C3 × 5 sizes, data attributes, rationale cards) and add icon-candidates-gallery.spec.js with 12 integrity assertions including negative and boundary tests

**Replace icon-comparison.html with a candidate gallery (C1/C2/C3 × 5 sizes, data attributes, rationale cards) and add icon-candidates-gallery.spec.js with 12 integrity assertions including negative and boundary tests**

## What Happened

The existing mockups/icon-comparison.html was an icon-library comparison (Lucide vs Phosphor vs Tabler) with no connection to the candidate work from T01/T02. It was replaced wholesale with a candidate-focused gallery.

**Gallery structure:** CSS grid (160px label column + 3 equal candidate columns). Six rows: one baseline bar spanning all columns (current shipped favicon-16x16.png and favicon-32x32.png shown on a checker background for transparency reference) plus five size rows (16×16, 32×32, 180×180, 192×192, 512×512). Every preview cell carries both `data-candidate="C1|C2|C3"` and `data-size="16x16|..."` attributes in consistent order so regex-based smoke checks work without a DOM parser.

**Tiny sizes (16×16 and 32×32):** Each cell shows the native-size image on a checker background alongside a CSS-scaled zoom copy (3× for 16px, 2× for 32px) with `image-rendering: pixelated` so the pixel structure is visible. A `onerror` handler on each `<img>` adds `.img-broken` to the cell, which applies a hatched red background and a "⚠ preview missing" label — implementing the Failure Modes (Q5) broken-state marker.

**Large sizes (180×180, 192×192, 512×512):** Displayed at 120px, 128px, and 192px respectively with a subtle box-shadow for separation.

**Rationale cards:** Three `<article data-candidate="Cn">` cards above the grid give reviewers the design intent alongside the pixel evidence — terracotta/parchment for C1, dark-header/electric-blue for C2, arc-path/forest-green for C3. Each card includes the SVG logo as a rendered `<img>` so the wordmark can be compared at the same time.

**Gallery smoke spec:** `icon-candidates-gallery.spec.js` adds 12 tests across all required invariants:
- File exists and is non-empty (>1000 chars)
- Exactly 3 candidate IDs (C1, C2, C3) in `data-candidate` attributes
- No invalid candidate IDs (C4, typos) — explicit `not.toContain('data-candidate="C4"')` plus a set-diff check
- All 5 required size tokens present in the file
- Exactly 15 preview cells carrying both `data-candidate` + `data-size`
- Each candidate has exactly 5 size entries; each size has exactly 3 candidate entries
- Exactly 15 unique `icon-candidates/*.png` src paths referenced
- All 15 referenced PNG files exist on disk
- Two meta-negative tests: stripping all 512x512 entries reduces count to 12 (verifies the count assertion is sensitive), and injecting a C4 entry pushes candidate-set size to 4 (verifies the candidate-ID check works)

Combined run with the existing 40-test asset suite: 52/52 passed in 2.4 s.

## Verification

1. `bash scripts/export-icon-candidates.sh` — exit 0, 15 PNGs confirmed present and dimension-verified.
2. `npm --prefix .tests run test -- --reporter=line smoke/icon-candidates-assets.spec.js smoke/icon-candidates-gallery.spec.js` — 52/52 passed in 2.4 s (12 gallery + 40 asset tests).
3. `rg -n 'data-candidate="C1"|...|512x512' mockups/icon-comparison.html` — all 8 required tokens found across 30 matching lines covering CSS rules, rationale cards, column headers, and all 15 preview cells.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash scripts/export-icon-candidates.sh` | 0 | ✅ pass — 15/15 PNGs present and dimension-verified | 800ms |
| 2 | `npm --prefix .tests run test -- --reporter=line smoke/icon-candidates-assets.spec.js smoke/icon-candidates-gallery.spec.js` | 0 | ✅ pass — 52/52 tests passed (12 gallery + 40 asset) | 2400ms |
| 3 | `rg -n 'data-candidate="C1"|data-candidate="C2"|data-candidate="C3"|16x16|32x32|180x180|192x192|512x512' mockups/icon-comparison.html` | 0 | ✅ pass — all 8 required tokens found on 30 matching lines | 80ms |

## Deviations

None — all outputs match the expected file list in the task plan exactly.

## Known Issues

None.

## Files Created/Modified

- `mockups/icon-comparison.html`
- `.tests/smoke/icon-candidates-gallery.spec.js`
