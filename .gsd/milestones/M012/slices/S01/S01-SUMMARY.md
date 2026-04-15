---
id: S01
parent: M012
milestone: M012
provides:
  - 
- Three complete, coherent icon/logo systems ready for visual evaluation
- Deterministic export infrastructure for candidate to PNG pipeline
- Side-by-side gallery artifact for winner selection
- Contract-enforcing smoke tests preventing asset matrix corruption

requires:
  []
affects:
  []
key_files:
  - 
- mockups/icon-candidates/C1-ink-paper/icon.svg
- mockups/icon-candidates/C2-nordic-clarity/icon.svg
- mockups/icon-candidates/C3-verdant-studio/icon.svg
- scripts/export-icon-candidates.sh
- mockups/icon-comparison.html
- .tests/smoke/icon-candidates-assets.spec.js
- .tests/smoke/icon-candidates-gallery.spec.js

key_decisions:
  - 
- C3 arc-path motif is structurally distinct from C1/C2 grid-based systems for maximum differentiation
- SVG masters use viewBox only (no root width/height) for unconstrained scaling
- rsvg-convert primary exporter with sips dimension checks and graceful Linux fallback
- Tiny-size cells show dual rendering: 1× native + 3×/2× pixelated zoom
- onerror handlers implement Q5 broken-state markers
- Smoke tests use meta-negative tests to verify assertion sensitivity

patterns_established:
  - 
- Idempotent export pipeline: scripts/export-icon-candidates.sh safely reruns and overwrites
- Machine-readable gallery contracts: HTML data-* attributes enable regex-based verification
- Broken-state UI markers: onerror handlers trigger visual failure indication
- Pure filesystem smoke tests: No runtime dependencies, works offline
- Dual-size rendering for tiny surfaces: Show native + zoomed for accuracy and structure

observability_surfaces:
  - none
drill_down_paths:
  []
duration: ""
verification_result: passed
completed_at: 2026-04-15T21:30:16.129Z
blocker_discovered: false
---

# S01: Candidate Icon/Logo Set Development

**Delivered three distinct icon/logo candidate systems as canonical SVG masters with preview PNGs and a side-by-side candidate gallery ready for S02 winner selection.**

## What Happened

S01 delivered a complete candidate system contract and three fully realized icon/logo designs:

**Candidates Produced:**
- **C1 (Ink & Paper)**: Warm parchment square with terracotta header band, amber accents, ring-binding pins, and paper-grid cells. Reads warm and scholarly.
- **C2 (Nordic Clarity)**: Minimalist dark-header design with electric-blue accent line and dot markers. Reads clean and contemporary.
- **C3 (Verdant Studio)**: Forest-green circle with cream arc tracing an annual-cycle motif. Reads organic and intentional.

Each candidate is structurally distinct at every scale — C1 uses rectangular grid logic, C2 uses header-dominated composition, C3 uses a rotational arc path.

**Deliverables:**
1. **SVG Masters**: Six files (3 candidates × icon.svg + logo.svg) with canonical viewBox values (512×512 for icons, 480×120 for logos), clean geometry, and title elements. All stored in `mockups/icon-candidates/C{1-3}-{slug}/`.

2. **Preview PNGs**: 15 rasterised previews (3 candidates × 5 sizes: 16, 32, 180, 192, 512) generated deterministically from SVG masters via `scripts/export-icon-candidates.sh` using rsvg-convert. Each PNG dimension verified via sips.

3. **Export Infrastructure**: Executable `scripts/export-icon-candidates.sh` with fail-fast semantics, rsvg-convert presence check, and portable sips fallback (graceful degradation on Linux CI).

4. **Candidate Gallery** (`mockups/icon-comparison.html`): Six-row CSS grid with baseline row (current shipped favicons) and five size rows. Tiny sizes (16, 32) display native + zoomed with pixelated rendering. Large sizes shown at proportional scales. Rationale cards with design intent and rendered logos. All cells carry `data-candidate` and `data-size` attributes.

5. **Broken-State Markers**: onerror handlers add `.img-broken` class with hatched red background and "⚠ preview missing" label per Q5 failure-mode requirements.

6. **Smoke Tests**: 52 tests total — 40 asset tests (SVG validity, viewBox, title elements, 15-file preview matrix, PNG magic bytes) and 12 gallery tests (candidate uniqueness, size coverage, 15-cell grid structure, file existence, meta-negative tests).

All 52 tests pass (2.4s). Export script succeeds idempotently (all 15 PNGs dimension-verified in 4.2s). Regex checks confirm all 8 required data tokens present across 30+ lines in the gallery.

**Verification Approach:**
- Pure filesystem assertions (no browser runtime required).
- Deterministic file-presence and PNG magic-byte validation.
- Machine-readable data attributes enable downstream regex/format verification.
- Broken-state UI markers implement observable Q5 failure mode.

**Patterns Established for Downstream Work:**
1. SVG masters use viewBox-only scaling for unconstrained browser rendering.
2. Export script is fully idempotent — safe to re-run without manual cleanup.
3. Smoke tests validate contract invariants before visual review.
4. Data attributes decouple HTML structure from assertion logic.
5. Tiny-size zoom rendering reveals scaling behavior at boundaries.

**What S02 Receives:**
- Three coherent, distinguishable icon systems ready for visual winner selection.
- Gallery artifact with all candidates side-by-side at five critical sizes.
- Deterministic test layer preventing asset matrix corruption.
- Clear design intent cards alongside pixel evidence.

## Verification

✅ **Slice-level verification (all checks passed):**

1. Export script execution: `bash scripts/export-icon-candidates.sh` — exit 0, all 15 PNGs dimension-verified in 4.2s.
2. Smoke test suite: 52/52 tests passed in 2.4s across asset and gallery integrity specs.
3. Data attribute coverage: All 8 required tokens found across 35 lines in `mockups/icon-comparison.html`.
4. SVG master coverage: 6 files with canonical viewBox, non-empty content, title elements.
5. PNG preview matrix: All 15 files present and non-zero-byte, dimensions match target.
6. Gallery HTML structure: Valid CSS grid layout, rationale cards, onerror broken-state markers implemented.

**Manual legibility review** (completed):
- 16×16: All three candidates visually distinguishable (C1 warm grid vs C2 dark-top vs C3 arc).
- 32×32: All three candidates remain legible and distinct (color blocking visible).

## Requirements Advanced

None.

## Requirements Validated

- R001 — Three structurally distinct SVG systems delivered with complete preview PNG matrix (16/32/180/192/512) and side-by-side gallery. All 52 smoke tests pass. Manual legibility review confirms visual distinction at 16×16 and 32×32.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Operational Readiness

None.

## Deviations

None.

## Known Limitations


- SVG masters use system fonts only (no embedded web fonts); fallback to Georgia/Arial/Helvetica in SVG contexts
- No visual regression baseline (R020 deferred); S06 uses manual spot checks plus existing test flow


## Follow-ups

None.

## Files Created/Modified

- `mockups/icon-candidates/README.md` — Contract definition for candidate folder structure and SVG/PNG requirements
- `mockups/icon-candidates/C1-ink-paper/icon.svg` — C1 Ink & Paper icon master (512×512 viewBox)
- `mockups/icon-candidates/C1-ink-paper/logo.svg` — C1 Ink & Paper logo master (480×120 viewBox)
- `mockups/icon-candidates/C2-nordic-clarity/icon.svg` — C2 Nordic Clarity icon master (512×512 viewBox)
- `mockups/icon-candidates/C2-nordic-clarity/logo.svg` — C2 Nordic Clarity logo master (480×120 viewBox)
- `mockups/icon-candidates/C3-verdant-studio/icon.svg` — C3 Verdant Studio icon master (512×512 viewBox)
- `mockups/icon-candidates/C3-verdant-studio/logo.svg` — C3 Verdant Studio logo master (480×120 viewBox)
- `scripts/export-icon-candidates.sh` — Idempotent PNG export script using rsvg-convert with dimension verification
- `.tests/smoke/icon-candidates-assets.spec.js` — 40 smoke tests for SVG masters, preview PNGs, and asset matrix validation
- `.tests/smoke/icon-candidates-gallery.spec.js` — 12 smoke tests for gallery HTML integrity, data attributes, and file references
- `mockups/icon-comparison.html` — Side-by-side candidate gallery with rationale cards and zoomed previews (replaced existing file)
