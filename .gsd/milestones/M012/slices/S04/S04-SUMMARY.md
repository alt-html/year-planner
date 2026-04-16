---
id: S04
parent: M012
milestone: M012
provides:
  - (none)
requires:
  []
affects:
  - index.html
  - manifest.json
  - smoke test suite
key_files:
  - (none)
key_decisions:
  - Edit source fragment .compose/fragments/head.html (not generated site/index.html) for head icon wiring, as required by compose contract
  - Use relative ./icons/ prefix matching manifest.json serving context (same directory as manifest)
  - Replace entire manifest icons[] block rather than patching — old android-chrome entries have no canonical path and no purpose field
  - Fix compose.spec.js race condition by running m4 to stdout instead of calling build.sh — eliminates the parallel read/write conflict on site/index.html without changing the test's assertion semantics
patterns_established:
  - stripStyleBlocks() prevents false positives in HTML validation
  - Test fixtures must capture process state before mutations
  - Canonical path naming: ./icons/{purpose}-{size}.png
observability_surfaces:
  - none
drill_down_paths:
  []
duration: ""
verification_result: passed
completed_at: 2026-04-15T23:54:38.827Z
blocker_discovered: false
---

# S04: Live Web/PWA Wiring

**Year Planner's index.html and manifest.json now reference canonical ./icons/* assets from S03 export, with 57 smoke tests confirming wiring integrity and backward-compatibility guards.**

## What Happened

## What Delivered

S04 completed the integration pathway from S03's canonical icon exports into live production wiring. Two tasks:

**T01: Wire canonical icon matrix to compose fragments and manifest**
- Updated `.compose/fragments/head.html` to replace legacy root-level hrefs (`./favicon-32x32.png`, `./favicon-16x16.png`, `./apple-touch-icon.png`) with canonical `./icons/` paths (`./icons/favicon-32x32.png`, `./icons/favicon-16x16.png`, `./icons/apple-touch-icon-180x180.png`)
- Rewrote `site/manifest.json` `icons[]` from 2 stale `android-chrome-*` entries to full 6-entry PWA set covering `any`/`maskable`/`monochrome` at `192x192` and `512x512` with explicit `purpose` and `sizes` fields
- Regenerated `site/index.html` via `bash .compose/build.sh` (695 lines) to confirm compose contract integrity
- Created `.tests/smoke/icon-live-wiring.spec.js` with 28 assertions covering: head ref presence, stale-ref guards, manifest structural contract (6 entries, required fields, valid purposes, all 3 purpose buckets, all 6 canonical srcs), PWA purpose×size matrix, disk file existence, and negative-boundary checks

**T02: Fix parallel test race and confirm all 57 smoke assertions pass**
- Discovered and fixed a read/write race condition in `compose.spec.js`: test was calling `bash .compose/build.sh` which overwrites `site/index.html` while parallel workers read it
- Fixed by changing `compose.spec.js` to run `m4 -P .compose/index.html.m4` to stdout (captured as string) instead of invoking `build.sh`, eliminating file writes during testing
- All 57 smoke tests now pass reliably under 3 parallel workers (28 icon-live-wiring + 5 compose + 24 export-matrix)

## Patterns Established

### stripStyleBlocks() prevents false positives in HTML attribute validation
When validating HTML with embedded `<style>` blocks containing CSS attribute selectors (e.g. `[data-candidate="C1"]::before`), grep patterns searching for HTML attributes can produce false positives. Solution: strip `<style>...</style>` blocks before attribute inspection using `html.replace(/<style[\s\S]*?<\/style>/gi, '')`. This pattern, established in M012/S02 and reused in S04's validation, eliminates CSS noise and ensures grep patterns match only actual HTML.

### Test fixtures must capture process state before mutations
When testing build outputs that mutate production files, run the build to **stdout** (captured as a string) rather than to disk in test contexts. This avoids read/write races when parallel workers access the same files. The comparison logic remains identical — m4 output vs. current file — but the test no longer modifies production state.

### Canonical path naming convention: ./icons/{purpose}-{size}.png
All icon references now follow the `./icons/{purpose}-{size}.png` pattern:
- Favicon links: `./icons/favicon-16x16.png`, `./icons/favicon-32x32.png`
- Apple touch: `./icons/apple-touch-icon-180x180.png`
- PWA entries: `./icons/pwa-any-192x192.png`, `./icons/pwa-any-512x512.png`, etc.

This naming is deterministic (derived from matrix.json) and serves as the production reference contract for downstream operations.

## Decisions Documented

No new architectural decisions in S04. S04 consumed D017 (canonical icon matrix export contract from S03) and applied it directly — the naming, structure, and matrix format were already locked down.

## What Remains

S05 produces desktop packaging assets (`.ico` and `.icns`) using the canonical SVG sources from canonical.json, which S04 did not touch.

S06 performs integrated verification and visual spot checks across the full asset suite.

## Integration Closure

- **Upstream consumed**: `site/icons/matrix.json` (S03 export), `.compose/fragments/head.html` (compose system), `site/manifest.json` (PWA config)
- **Downstream provided**: Production icon wiring in `site/index.html` (via compose) and `site/manifest.json`, plus 28-assertion smoke test ensuring wiring never regresses
- **Surfaces wired**: User-facing favicon link tags, PWA manifest icon registry, both with disk-file existence and purpose-coverage guarantees

## Quality Gates

**Q8 — Operational Readiness:**
- **Health signal**: `npm --prefix .tests run test -- smoke/icon-live-wiring.spec.js smoke/compose.spec.js smoke/icon-export-matrix.spec.js` exits 0 with 57 tests passing. If any icon reference breaks, the corresponding test suite fails with pinpointed assertion (e.g. "manifest entry missing purpose field").
- **Failure signal**: Broken icon reference causes smoke test failure during deployment. The 28-assertion suite in `icon-live-wiring.spec.js` detects: missing head refs, stale legacy paths, malformed manifest entries, missing canonical srcs, disk-unreachable files, missing purpose buckets, and duplicate entries.
- **Recovery procedure**: (1) Identify failing assertion in test output, (2) fix corresponding source (compose fragment or manifest.json), (3) run `bash .compose/build.sh` to regenerate index.html, (4) rerun smoke suite to confirm fix.
- **Monitoring gaps**: None. The smoke test suite is part of the standard test flow run before deployment. CI/CD integration ensures no broken icon wiring is shipped.

## Verification

All slice-level verification commands pass:
- `bash .compose/build.sh` — exit 0, 695-line composed index.html
- `node -e "...manifest icon count check..."` — 6 entries confirmed
- `grep -E '(apple-touch-icon|favicon)' site/index.html` — all 3 head refs canonical
- `npm --prefix .tests run test -- --reporter=line smoke/icon-live-wiring.spec.js smoke/compose.spec.js smoke/icon-export-matrix.spec.js` — 57/57 passed, no regressions

## Requirements Advanced

None.

## Requirements Validated

- R004 — All 57 smoke tests pass (icon-live-wiring.spec.js: 28 tests, compose.spec.js: 5 tests, icon-export-matrix.spec.js: 24 tests). Manifest contains exactly 6 canonical icon entries. Head links reference canonical ./icons/* paths. No legacy paths present. All referenced files exist on disk.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Operational Readiness

None.

## Deviations

None.

## Known Limitations

None.

## Follow-ups

None.

## Files Created/Modified

- `.compose/fragments/head.html` — Updated icon link hrefs to canonical ./icons/* paths
- `site/manifest.json` — Rewired icons[] from legacy android-chrome to 6-entry canonical PWA structure
- `site/index.html` — Regenerated via compose with canonical icon references
- `.tests/smoke/icon-live-wiring.spec.js` — Created with 28 assertions for wiring integrity and regression guards
- `.tests/smoke/compose.spec.js` — Fixed parallel test race by capturing m4 output to string
