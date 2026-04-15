---
estimated_steps: 9
estimated_files: 4
skills_used:
  - frontend-design
  - technical-writing
---

# T01: Execute explicit visual winner call and write canonical selection artifacts

Why this task exists
- R002 must be closed with one canonical winner before S03 consumes icon assets.

Steps
1. Perform visual review in `mockups/icon-comparison.html` at `16x16`, `32x32`, `180x180`, `192x192`, and `512x512`; choose one winner (if no human preference is available, use small-size legibility and cross-size coherence as tie-breaker).
2. Write `mockups/icon-candidates/canonical.json` (single winner metadata) and `mockups/icon-candidates/alternatives.json` (exactly two non-winners as `archived-alternative`), then record the supporting selection decision in `.gsd/DECISIONS.md` via `gsd_decision_save`.
3. Update `mockups/icon-comparison.html` with explicit winner/archive markers (`data-selection-state` plus visible badge text) that match metadata IDs exactly.

Must-haves
- Exactly one canonical winner and exactly two archived alternatives are present in machine-readable metadata.
- Gallery markers and the decision log align with the same winner ID.

## Inputs

- `mockups/icon-comparison.html`
- `mockups/icon-candidates/C1-ink-paper/preview-16.png`
- `mockups/icon-candidates/C2-nordic-clarity/preview-16.png`
- `mockups/icon-candidates/C3-verdant-studio/preview-16.png`
- `.gsd/REQUIREMENTS.md`
- `.gsd/DECISIONS.md`

## Expected Output

- `mockups/icon-candidates/canonical.json`
- `mockups/icon-candidates/alternatives.json`
- `mockups/icon-comparison.html`
- `.gsd/DECISIONS.md`

## Verification

test -f mockups/icon-candidates/canonical.json && test -f mockups/icon-candidates/alternatives.json && rg -n '"candidateId"|"archived-alternative"|data-selection-state|winner' mockups/icon-candidates/canonical.json mockups/icon-candidates/alternatives.json mockups/icon-comparison.html

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `mockups/icon-comparison.html` visual matrix | Block winner lock; correct markup and rerun verification token checks | N/A (local static file) | Reject inconsistent candidate markers and keep selection pending |
| Candidate metadata files (`canonical.json`, `alternatives.json`) | Fail verification and do not proceed to contract-test task | N/A | Reject invalid candidate IDs or duplicate winner entries |
| Decision record in `.gsd/DECISIONS.md` | Re-run `gsd_decision_save` with corrected scope/choice details | N/A | Correct malformed decision fields before continuing |

## Load Profile

- **Shared resources**: local filesystem only.
- **Per-operation cost**: trivial JSON/HTML edits plus grep/token checks.
- **10x breakpoint**: N/A for current scope; potential failure is human-review ambiguity, not compute/load saturation.

## Negative Tests

- **Malformed inputs**: reject winner IDs outside `C1|C2|C3` and reject metadata with missing required fields.
- **Error paths**: fail when `canonical.json` and gallery winner marker disagree.
- **Boundary conditions**: enforce exactly one winner and exactly two archived alternatives.
