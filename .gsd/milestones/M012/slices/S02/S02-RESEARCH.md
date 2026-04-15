# M012/S02 — Research

**Date:** 2026-04-16

## Summary

S02 is the primary owner of **R002**: explicitly choose one candidate and lock it as canonical so downstream export/wiring slices stop branching. The candidate system from S01 is complete and stable (`C1/C2/C3`, SVG masters + `preview-{16,32,180,192,512}.png`, gallery, passing smoke tests).

The main implementation risk is not design complexity; it is **contract ambiguity**. `mockups/icon-candidates/README.md` still documents an older path scheme (`previews/icon-{size}.png`) while live code/tests/gallery all use `preview-{size}.png` at candidate root. If S02 “locks canonical” without reconciling that drift, S03 will inherit a split contract.

From loaded `test` skill rules, two are directly relevant here: **match existing test patterns** and **verify generated tests immediately**. In this repo that means Playwright smoke tests with pure filesystem/regex assertions (no browser runtime dependency for contract checks), then re-running them after metadata changes.

## Recommendation

Use a **metadata lock, not filesystem relocation** for winner selection:

1. Create one machine-readable canonical pointer artifact (single source of truth for winner).
2. Mark the two non-selected candidates as archived alternatives in a companion artifact.
3. Keep existing candidate folders in place for S02 (do not move/rename directories yet).
4. Update README contract text to match the real filename/path convention already enforced by tests.
5. Add/extend smoke assertions so “exactly one winner” and “alternatives set is complete” are executable invariants.

Why: existing smoke/gallery checks currently assume candidate folders stay at `mockups/icon-candidates/C{1..3}-*` and preview filenames remain `preview-{size}.png`. Moving folders in S02 would cause avoidable breakage and force broad test rewrites before S03/S04.

## Implementation Landscape

### Key Files

- `mockups/icon-candidates/README.md` — Contract doc currently out of sync with implementation (`previews/icon-*.png` documented vs `preview-*.png` actual). Needs correction and canonical-selection section.
- `mockups/icon-comparison.html` — Visual comparison surface for explicit winner call; optional place to add a winner marker/badge.
- `.tests/smoke/icon-candidates-assets.spec.js` — Enforces candidate folder contract and preview matrix. Must remain compatible with S02 archival strategy.
- `.tests/smoke/icon-candidates-gallery.spec.js` — Enforces 3 candidates × 5 sizes and valid candidate IDs; can be extended for winner marker assertions if marker is added.
- `scripts/export-icon-candidates.sh` — Confirms real preview naming convention (`preview-{size}.png` at candidate root); reference for canonical contract wording.
- `mockups/icon-candidates/` (new file expected in S02) — add machine-readable canonical lock artifact (for downstream S03+ consumers).

### Build Order

1. **Pick winner + rationale first** (explicit visual call over `16/32/180/192/512` surfaces).
   - Unblocks every remaining step in the slice.
2. **Write canonical lock artifacts** (winner + archived alternatives) in `mockups/icon-candidates/`.
   - Establishes deterministic input for S03 export tasks.
3. **Reconcile README contract drift** to the live naming/path scheme and canonical lock artifacts.
   - Prevents downstream interpretation drift.
4. **Add/adjust smoke assertions** for canonical-selection invariants.
   - Makes R002 executable and regression-safe.

### Verification Approach

- Contract checks:
  - `npm --prefix .tests run test -- --reporter=line smoke/icon-candidates-assets.spec.js smoke/icon-candidates-gallery.spec.js`
  - plus new/updated S02 selection smoke spec (canonical lock + alternatives completeness).
- Token checks for lock markers/docs:
  - `rg -n "canonical|winner|selected|alternatives|preview-" mockups/icon-candidates mockups/icon-comparison.html`
- Visual confirmation of selected winner context:
  - open `mockups/icon-comparison.html` and confirm the selected system is explicitly identifiable if UI marker is added.

## Constraints

- Existing S01 tests enforce exactly three `C*` folders under `mockups/icon-candidates/`; relocating candidates in S02 will break this contract unless tests are deliberately refactored.
- `scripts/export-icon-candidates.sh` and both smoke specs are already anchored to `preview-{size}.png` root files, not `previews/icon-{size}.png`.
- Smoke run output currently prints a non-blocking globalSetup warning about missing `GITHUB_CLIENT_ID/GITHUB_CLIENT_SECRET`; selection-contract tests still run and pass. Treat as noise unless scope expands into auth/contract API tests.

## Common Pitfalls

- **Archiving by moving folders too early** — breaks gallery/src and S01 smoke assumptions. Prefer metadata archival in S02.
- **Locking canonical without machine-readable artifact** — leaves S03 to parse prose/docs and reintroduces ambiguity.
- **Leaving README path drift unresolved** — creates dual “truths” and future false failures.

## Open Risks

- If no human visual preference is available during execution, the executor must make an explicit assumption-based winner call (with rationale) and record it clearly so it can be revised later.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| Playwright smoke testing | `test` (installed skill) | installed |
| Playwright specialized guidance | `currents-dev/playwright-best-practices-skill@playwright-best-practices` | available |
| Playwright CLI automation | `microsoft/playwright-cli@playwright-cli` | available |
| librsvg export tooling | none found via `npx skills find "librsvg"` | none found |
