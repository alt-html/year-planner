---
id: T02
parent: S02
milestone: M012
key_files:
  - mockups/icon-candidates/README.md
  - .tests/smoke/icon-candidates-selection.spec.js
key_decisions:
  - stripStyleBlocks() helper added to selection spec — CSS attribute selectors in <style> blocks share text tokens with HTML data-* attributes; without stripping, [^>]* patterns span the entire style block and produce false-positive mismatches
duration: 
verification_result: passed
completed_at: 2026-04-15T22:29:39.670Z
blocker_discovered: false
---

# T02: Reconciled README contract (preview-{size}.png naming, canonical.json/alternatives.json docs) and added icon-candidates-selection.spec.js with 32 tests enforcing winner-lock invariants; all 80 smoke tests pass

**Reconciled README contract (preview-{size}.png naming, canonical.json/alternatives.json docs) and added icon-candidates-selection.spec.js with 32 tests enforcing winner-lock invariants; all 80 smoke tests pass**

## What Happened

Three changes were made to lock the selection contract.

**1. README reconciliation** (`mockups/icon-candidates/README.md`):
- The "Candidate Folder Contract" table and "Required Preview PNG Sizes" section listed stale `icon-{size}.png` filenames and described a `previews/` subdirectory that doesn't exist. These were replaced with `preview-{size}.png` names and a note that preview PNGs live directly in the candidate folder (no subdirectory).
- A new "Winner Selection Metadata" section was added documenting `canonical.json` and `alternatives.json` as the authoritative selection artifacts and explaining that `icon-comparison.html` `data-selection-state` attributes must stay in sync.
- The "Machine-Checkable Contract" section was extended to add items 6 (preview PNG names) and a separate paragraph documenting the selection smoke spec invariants.
- Verified via `! rg "previews/icon-|icon-16\.png|..."` — exit 1 (no matches): all stale tokens removed.

**2. New smoke spec** (`.tests/smoke/icon-candidates-selection.spec.js`):
- 32 tests across 4 describe blocks: `canonical.json`, `alternatives.json`, coverage invariant, and gallery marker consistency.
- canonical.json checks: exists, valid JSON, exactly one `selectionStatus: "winner"`, valid candidateId (C1/C2/C3), all required fields, all 5 preview sizes present, `preview-{size}.png` naming enforced, svgSources has icon+logo keys.
- alternatives.json checks: exists, valid JSON, `alternatives` array present, exactly 2 entries, every entry has `selectionStatus: "archived-alternative"`, all candidateIds valid, no duplicates, all required fields, preview-{size}.png naming.
- Coverage invariant: winner + alternatives cover exactly C1+C2+C3 with no overlap.
- Gallery marker checks: winner candidate marked `data-selection-state="winner"` on ≥1 element, alternatives marked `archived-alternative`, no cross-contamination (winner not marked as archived, alternatives not marked as winner), exactly 5 winner preview cells, exactly 10 archived-alternative preview cells.
- 6 negative/boundary tests confirm the detection logic is sensitive to malformed inputs.
- A `stripStyleBlocks()` helper was added because CSS attribute selectors like `.rationale-card[data-candidate="C1"]::before` and `[data-selection-state="winner"]` share the same text tokens and can produce false-positive regex matches when `[^>]*` spans across a `<style>` block (no `>` characters in CSS to stop the match). Stripping `<style>...</style>` before running cross-attribute HTML checks eliminates this class of false positive.

**3. Test run**: All 80 tests pass (30 assets + 18 gallery + 32 selection) in 2.7s.

## Verification

1. `npm --prefix .tests run test -- --reporter=line smoke/icon-candidates-assets.spec.js smoke/icon-candidates-gallery.spec.js smoke/icon-candidates-selection.spec.js` — 80 passed, 0 failed, exit 0.
2. `! rg -n "previews/icon-|icon-16\.png|icon-32\.png|icon-180\.png|icon-192\.png|icon-512\.png" mockups/icon-candidates/README.md` — exit 1 (stale tokens absent), STALE_TOKEN_CHECK=PASS.
3. `rg -n "preview-\{size\}|canonical\.json|alternatives\.json|archived-alternative|winner" mockups/icon-candidates/README.md mockups/icon-candidates/canonical.json mockups/icon-candidates/alternatives.json mockups/icon-comparison.html` — exit 0, all contract tokens present in the expected files.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm --prefix .tests run test -- --reporter=line smoke/icon-candidates-assets.spec.js smoke/icon-candidates-gallery.spec.js smoke/icon-candidates-selection.spec.js` | 0 | ✅ pass — 80 passed (30 assets + 18 gallery + 32 selection), 0 failed | 2700ms |
| 2 | `! rg -n "previews/icon-|icon-16\.png|icon-32\.png|icon-180\.png|icon-192\.png|icon-512\.png" mockups/icon-candidates/README.md` | 0 | ✅ pass — no stale path tokens in README | 15ms |
| 3 | `rg -n "preview-\{size\}|canonical\.json|alternatives\.json|archived-alternative|winner" mockups/icon-candidates/README.md mockups/icon-candidates/canonical.json mockups/icon-candidates/alternatives.json mockups/icon-comparison.html` | 0 | ✅ pass — all required contract tokens present | 18ms |

## Deviations

None. All three plan steps were executed in order.

## Known Issues

None.

## Files Created/Modified

- `mockups/icon-candidates/README.md`
- `.tests/smoke/icon-candidates-selection.spec.js`
