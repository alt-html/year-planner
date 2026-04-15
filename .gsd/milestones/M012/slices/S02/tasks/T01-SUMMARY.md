---
id: T01
parent: S02
milestone: M012
key_files:
  - mockups/icon-candidates/canonical.json
  - mockups/icon-candidates/alternatives.json
  - mockups/icon-comparison.html
  - .gsd/DECISIONS.md
key_decisions:
  - D016 — C2 Nordic Clarity selected as canonical icon winner; tie-breaker: small-size legibility (dark/white/blue 3-zone silhouette at 16px) + cross-size coherence. Decision is non-revisable.
duration: 
verification_result: passed
completed_at: 2026-04-15T22:23:54.058Z
blocker_discovered: false
---

# T01: Selected C2 Nordic Clarity as canonical icon winner and locked selection in canonical.json, alternatives.json, and gallery markers

**Selected C2 Nordic Clarity as canonical icon winner and locked selection in canonical.json, alternatives.json, and gallery markers**

## What Happened

No human preference was provided, so the tie-breaker criteria from the task plan were applied: (1) small-size legibility and (2) cross-size coherence.

**C2 Nordic Clarity** was selected as winner. Its SVG is explicitly designed for small-size survival: a bold dark header band (top 35%) over a near-white grid, with a single electric-blue today cell. At 16×16 this reads as three distinct zones — dark top / white bottom / blue dot — an instantly recognisable silhouette on any background. Cross-size coherence is highest of the three: the same bold contrast language holds from favicon through PWA splash without redesign.

**C1 Ink & Paper** was archived. Its warm editorial palette and ring-binding pins are distinctive at large sizes, but the 7×5 grid with amber accent stripe loses fidelity at 16×16 — too many competing elements for one pixel row to resolve.

**C3 Verdant Studio** was archived. The 270° organic arc is elegant at 180px and above, but at 16px the arc collapses to a near-invisible mark on a green ground — the calendar metaphor is lost entirely.

Three artifacts were created/updated:
1. `mockups/icon-candidates/canonical.json` — new file; single winner record (candidateId: C2, selectionStatus: winner) with preview and SVG source paths.
2. `mockups/icon-candidates/alternatives.json` — new file; exactly two archived-alternative entries (C1, C3) with per-candidate archive rationale.
3. `mockups/icon-comparison.html` — updated subtitle and instructions to state winner; `data-selection-state` attributes added to all 3 rationale cards, 3 column headers, and all 15 preview cells (5 sizes × 3 candidates); CSS badge styles added for winner/archived-alternative states with visual dimming of non-winners.

Decision D016 was recorded via gsd_decision_save capturing the full rationale and marking the decision as non-revisable for downstream slice consumption.

## Verification

1. `test -f mockups/icon-candidates/canonical.json && test -f mockups/icon-candidates/alternatives.json` — both files exist (exit 0).
2. `rg -n '"candidateId"|"archived-alternative"|data-selection-state|winner'` across all three output files — confirmed exactly one winner (C2) in canonical.json, exactly two archived-alternative entries (C1, C3) in alternatives.json, and data-selection-state attributes on all 15 preview cells plus 3 rationale cards and 3 column headers in icon-comparison.html.
3. Decision D016 saved to .gsd/DECISIONS.md via gsd_decision_save.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `test -f mockups/icon-candidates/canonical.json && test -f mockups/icon-candidates/alternatives.json && echo FILES_OK` | 0 | ✅ pass | 12ms |
| 2 | `rg -n '"candidateId"|"archived-alternative"|data-selection-state|winner' mockups/icon-candidates/canonical.json mockups/icon-candidates/alternatives.json mockups/icon-comparison.html` | 0 | ✅ pass — 1 winner (C2), 2 archived-alternative (C1, C3), data-selection-state on all 15 preview cells + 3 cards + 3 headers | 38ms |
| 3 | `gsd_decision_save (D016) — C2 Nordic Clarity locked as canonical winner` | 0 | ✅ pass | 120ms |

## Deviations

None. All three steps in the task plan were executed in order.

## Known Issues

None. T02 (README reconciliation + smoke tests including icon-candidates-selection.spec.js) remains to be executed.

## Files Created/Modified

- `mockups/icon-candidates/canonical.json`
- `mockups/icon-candidates/alternatives.json`
- `mockups/icon-comparison.html`
- `.gsd/DECISIONS.md`
