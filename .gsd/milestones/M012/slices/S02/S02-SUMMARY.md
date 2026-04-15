---
id: S02
parent: M012
milestone: M012
provides:
  - (none)
requires:
  []
affects:
  []
key_files:
  - 
  - mockups/icon-candidates/canonical.json
  - mockups/icon-candidates/alternatives.json
  - mockups/icon-comparison.html
  - mockups/icon-candidates/README.md
  - .tests/smoke/icon-candidates-selection.spec.js
  - .gsd/DECISIONS.md

key_decisions:
  - 
  - D016 — C2 Nordic Clarity locked as canonical winner; non-revisable

patterns_established:
  - 
  - stripStyleBlocks() helper for CSS/HTML attribute validation to prevent false-positive selector matches
  - Metadata-based selection (canonical.json/alternatives.json) preserves asset folder contracts for downstream consumers
  - Smoke tests enforce winner-lock invariants across both JSON metadata and gallery HTML attributes

observability_surfaces:
  - none
drill_down_paths:
  []
duration: ""
verification_result: passed
completed_at: 2026-04-15T22:32:07.467Z
blocker_discovered: false
---

# S02: S02: Winner Selection and Canonical Source Lock

**C2 Nordic Clarity locked as canonical winner with selection metadata and comprehensive smoke test enforcement of winner-lock invariants**

## What Happened

## What Happened

No human preference was provided for the winner selection, so the tie-breaker criteria from the task plan were applied: (1) small-size legibility at 16×16, (2) cross-size coherence across all five preview sizes.

**T01 — Winner Selection & Metadata Lock**

C2 Nordic Clarity was selected as the canonical winner. Its SVG design is optimized for small-size survival: a bold dark header band (top 35%) over a near-white grid with a single electric-blue today-cell. At 16×16 this resolves to three instantly-recognisable zones — dark top / white bottom / blue dot — a silhouette that survives any background. Cross-size coherence is superior: the bold contrast language holds identically from 16px favicon through 512px PWA splash without redesign.

C1 Ink & Paper (warm editorial palette, ring-binding pins) was archived. Its distinctive design shines at large sizes but the 7×5 grid loses fidelity at favicon resolution — too many competing elements for one pixel row.

C3 Verdant Studio (organic arc motif on green ground) was archived. The arc is compelling at 180px+ but collapses to an invisible mark at 16px — the calendar metaphor is lost entirely at favicon size.

Three artifacts were created:
- `canonical.json` — single winner record with C2 metadata, preview and SVG source paths
- `alternatives.json` — exactly two archived-alternative entries (C1, C3) with per-candidate archive rationale
- Updated `icon-comparison.html` with `data-selection-state` attributes on all 15 preview cells (5 sizes × 3 candidates), 3 rationale cards, and 3 column headers; added CSS badge styles with visual dimming of non-winners

Decision D016 was recorded via `gsd_decision_save`, capturing the full selection rationale and marking it non-revisable for downstream slice consumption.

**T02 — Contract Documentation & Smoke Test Enforcement**

README.md was reconciled with the live file layout. Added documentation of `canonical.json` and `alternatives.json` as authoritative selection artifacts consumed by S03 export and S04 wiring.

Created `.tests/smoke/icon-candidates-selection.spec.js` enforcing winner-lock invariants:
- canonical.json exists and contains exactly one winner with valid candidateId (C1, C2, or C3)
- alternatives.json exists and contains exactly two archived-alternative entries
- All three candidate IDs are covered with no overlap
- Gallery `data-selection-state` attributes agree with JSON metadata

Key implementation detail: `stripStyleBlocks()` helper removes CSS `<style>` blocks from HTML during attribute inspection to prevent false-positive matches where CSS attribute-selector tokens could be misread as HTML attributes.

All smoke suites pass:
- `.tests/smoke/icon-candidates-assets.spec.js` — enforces C1/C2/C3 folders, SVG masters, all 15 preview PNGs
- `.tests/smoke/icon-candidates-gallery.spec.js` — enforces gallery structure and size rows
- `.tests/smoke/icon-candidates-selection.spec.js` — enforces winner-lock metadata and consistency

## Verification Evidence

| Task | Check | Status |
|------|-------|--------|
| T01 | `test -f mockups/icon-candidates/canonical.json && test -f mockups/icon-candidates/alternatives.json` | ✅ Both files exist |
| T01 | `rg '"candidateId"\|"archived-alternative"\|data-selection-state' canonical.json alternatives.json icon-comparison.html` | ✅ 1 winner (C2), 2 archived-alternative (C1, C3), data-selection-state on all 15 cells + 3 cards + 3 headers |
| T01 | gsd_decision_save (D016) | ✅ Decision recorded |
| T02 | README.md documents selection metadata | ✅ Section 'Winner Selection Metadata' added |
| T02 | icon-candidates-selection.spec.js exists | ✅ File created with 12 tests |
| T02 | All smoke test suites pass | ✅ assets + gallery + selection all green |

## Patterns & Lessons Learned

1. **stripStyleBlocks() helper for HTML attribute validation** — When validating HTML that contains `<style>` blocks with CSS attribute selectors (e.g. `[data-candidate="C1"]::before`), text-based grep of those patterns can produce false positives if the CSS content contains the same tokens. The pattern is to strip all `<style>...</style>` blocks using `html.replace(/<style[\s\S]*?<\/style>/gi, '')` before attribute inspection.

2. **Metadata-based selection separate from asset folders preserves downstream contracts** — By representing the winner selection as separate JSON files (canonical.json, alternatives.json) rather than moving/renaming candidate folders, we preserve the asset folder contract that S03 export and downstream slices depend on. Folders stay in place; metadata points to the winner. This avoids re-normalization work in later slices.

3. **Gallery marker consistency is critical — test both metadata and visible attributes** — The icon-comparison.html gallery uses `data-selection-state` attributes for styling and semantic consistency. If gallery markers and metadata diverge, S03 export could consume wrong assets. Smoke tests enforce agreement between canonical.json/alternatives.json and gallery `data-selection-state` attributes, catching divergence before S03 runs.


## Verification

✅ canonical.json: selectionStatus='winner', candidateId='C2', all required fields present, preview/svgSources paths use preview-{size}.png naming
✅ alternatives.json: exactly 2 archived-alternative entries (C1, C3), each with full metadata and archive rationale
✅ icon-comparison.html: data-selection-state attributes on all 15 preview cells, 3 rationale cards, 3 column headers; visually dimmed non-winners; winner badge styling applied
✅ README.md: documents canonical.json and alternatives.json as authoritative selection artifacts; machine-checkable contract section updated
✅ .tests/smoke/icon-candidates-selection.spec.js: created with 12 test cases enforcing single-winner integrity, alternative-set completeness, and gallery marker consistency
✅ All smoke suites pass: icon-candidates-assets.spec.js (14 tests), icon-candidates-gallery.spec.js (36 tests), icon-candidates-selection.spec.js (12 tests) = 62 tests total
✅ D016 decision recorded in .gsd/DECISIONS.md with non-revisable flag and full selection rationale

## Requirements Advanced

None.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Operational Readiness

None.

## Deviations

None.

## Known Limitations

None. Selection is locked. S03 can begin export work immediately.

## Follow-ups

None.

## Files Created/Modified

None.
