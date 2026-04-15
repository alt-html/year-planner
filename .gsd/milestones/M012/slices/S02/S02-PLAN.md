# S02: Winner Selection and Canonical Source Lock

**Goal:** Fulfil R002 by making a single explicit winner selection from S01 candidates and locking that selection in machine-readable canonical metadata so downstream export/wiring slices consume one unambiguous source of truth.
**Demo:** One winning set is explicitly selected and marked canonical; non-selected sets are archived as alternatives.

## Must-Haves

- Select exactly one winner via explicit visual review and persist it in `mockups/icon-candidates/canonical.json`.
- Mark the two non-selected candidates as archived alternatives in `mockups/icon-candidates/alternatives.json` without moving or renaming candidate folders.
- Reconcile `mockups/icon-candidates/README.md` to the live `preview-{size}.png` contract and document canonical/alternative metadata files.
- Add smoke assertions that enforce single-winner integrity, alternative-set completeness, and gallery winner-marker consistency.
- Keep existing candidate asset/gallery smoke suites passing after selection lock changes.

## Threat Surface

- **Abuse**: Primary abuse risk is contract tampering (e.g., changing winner to non-existent `C4`, or mismatching gallery marker vs metadata).
- **Data exposure**: None. Slice handles only static design assets and metadata with no credentials/PII.
- **Input trust**: Inputs are repo-local files (`README`, gallery HTML, candidate metadata JSON). Untrusted/runtime input is not accepted in this slice.

## Requirement Impact

- **Requirements touched**: `R002` (primary owner `M012/S02`).
- **Re-verify**: winner uniqueness, archived-alternative completeness, gallery winner-marker consistency, and continued pass of existing candidate asset/gallery smoke checks.
- **Decisions revisited**: `D011` (visual-only selection method remains), `D014` (candidate folder/preview contract remains stable while selection metadata is added).

## Proof Level

- This slice proves: contract
- Real runtime required: yes
- Human/UAT required: yes

## Integration Closure

- Upstream surfaces consumed: `mockups/icon-candidates/C1-ink-paper/**`, `mockups/icon-candidates/C2-nordic-clarity/**`, `mockups/icon-candidates/C3-verdant-studio/**`, `mockups/icon-comparison.html`, `.tests/smoke/icon-candidates-assets.spec.js`, `.tests/smoke/icon-candidates-gallery.spec.js`.
- New wiring introduced in this slice: canonical winner metadata files consumed by S03 export planning and explicit winner markers in the gallery.
- What remains before the milestone is truly usable end-to-end: S03 export matrix from the locked winner, then S04/S05 production wiring and packaging outputs.

## Verification

- `npm --prefix .tests run test -- --reporter=line smoke/icon-candidates-assets.spec.js smoke/icon-candidates-gallery.spec.js smoke/icon-candidates-selection.spec.js`
- `rg -n "preview-\{size\}|canonical\.json|alternatives\.json|archived-alternative|winner" mockups/icon-candidates/README.md mockups/icon-candidates/canonical.json mockups/icon-candidates/alternatives.json mockups/icon-comparison.html`
- Manual review — open `mockups/icon-comparison.html` and confirm the same winner candidate is visibly marked across 16/32/180/192/512 rows and in metadata.

## Observability / Diagnostics

- Runtime signals: smoke assertion failures identify winner-ID mismatches, missing metadata files, or stale contract tokens.
- Inspection surfaces: `mockups/icon-candidates/canonical.json`, `mockups/icon-candidates/alternatives.json`, `mockups/icon-comparison.html`, and Playwright smoke output.
- Failure visibility: test output names the exact missing/invalid candidate IDs, size rows, and file paths.
- Redaction constraints: none (static design artifacts only).

## Tasks

- [x] **T01: Execute explicit visual winner call and write canonical selection artifacts** `est:45m`
  Why this task exists
- R002 must be closed with one canonical winner before S03 consumes icon assets.

Steps
1. Perform visual review in `mockups/icon-comparison.html` at `16x16`, `32x32`, `180x180`, `192x192`, and `512x512`; choose one winner (if no human preference is available, use small-size legibility and cross-size coherence as tie-breaker).
2. Write `mockups/icon-candidates/canonical.json` (single winner metadata) and `mockups/icon-candidates/alternatives.json` (exactly two non-winners as `archived-alternative`), then record the supporting selection decision in `.gsd/DECISIONS.md` via `gsd_decision_save`.
3. Update `mockups/icon-comparison.html` with explicit winner/archive markers (`data-selection-state` plus visible badge text) that match metadata IDs exactly.

Must-haves
- Exactly one canonical winner and exactly two archived alternatives are present in machine-readable metadata.
- Gallery markers and the decision log align with the same winner ID.
  - Done when: `canonical.json`, `alternatives.json`, gallery markers, and the recorded decision all reference one identical winner candidate ID.
  - Files: `mockups/icon-candidates/canonical.json`, `mockups/icon-candidates/alternatives.json`, `mockups/icon-comparison.html`, `.gsd/DECISIONS.md`
  - Verify: test -f mockups/icon-candidates/canonical.json && test -f mockups/icon-candidates/alternatives.json && rg -n '"candidateId"|"archived-alternative"|data-selection-state|winner' mockups/icon-candidates/canonical.json mockups/icon-candidates/alternatives.json mockups/icon-comparison.html

- [ ] **T02: Reconcile contract docs and enforce winner-lock invariants with smoke tests** `est:40m`
  Why this task exists
- Contract drift in `mockups/icon-candidates/README.md` and missing winner-lock assertions would let S03 consume ambiguous inputs.

Steps
1. Update `mockups/icon-candidates/README.md` to match the live `preview-{size}.png` layout and document `canonical.json` + `alternatives.json` as authoritative selection artifacts.
2. Add `.tests/smoke/icon-candidates-selection.spec.js` and adjust existing candidate smoke specs where needed so tests enforce winner uniqueness, candidate-ID validity, archived-alternative completeness, and gallery marker consistency.
3. Run `assets + gallery + selection` smoke checks and fix failures until the selection contract is fully green.

Must-haves
- README contract text matches real file layout and selection metadata artifacts.
- Smoke tests fail on malformed/duplicated winner metadata and pass only when winner markers and metadata agree.
  - Done when: README contract text is corrected, the new selection smoke spec exists, and the full candidate smoke gate passes.
  - Files: `mockups/icon-candidates/README.md`, `.tests/smoke/icon-candidates-selection.spec.js`, `.tests/smoke/icon-candidates-assets.spec.js`, `.tests/smoke/icon-candidates-gallery.spec.js`
  - Verify: npm --prefix .tests run test -- --reporter=line smoke/icon-candidates-assets.spec.js smoke/icon-candidates-gallery.spec.js smoke/icon-candidates-selection.spec.js && ! rg -n "previews/icon-|icon-16\.png|icon-32\.png|icon-180\.png|icon-192\.png|icon-512\.png" mockups/icon-candidates/README.md

## Files Likely Touched

- mockups/icon-candidates/canonical.json
- mockups/icon-candidates/alternatives.json
- mockups/icon-comparison.html
- .gsd/DECISIONS.md
- mockups/icon-candidates/README.md
- .tests/smoke/icon-candidates-selection.spec.js
- .tests/smoke/icon-candidates-assets.spec.js
- .tests/smoke/icon-candidates-gallery.spec.js
