---
estimated_steps: 18
estimated_files: 8
skills_used:
  - frontend-design
  - test
---

# T01: Define candidate contract, author three SVG master systems, and add base asset assertions

Why this task exists
- Retire ambiguity around what counts as a “complete candidate system” for R001 before any PNG export work starts.
- Establish canonical vector masters in line with D010 so downstream export/wiring slices do not re-interpret shapes.

Steps
1. Create `mockups/icon-candidates/README.md` that defines the per-candidate folder contract (`icon.svg`, `logo.svg`, previews), naming convention, and required sizes.
2. Author three distinct candidate master systems:
   - `C1-ink-paper`: editorial/serif warmth derived from `mockups/A-ink-and-paper.html`
   - `C2-nordic-clarity`: geometric/high-contrast direction derived from `mockups/B-nordic-clarity.html`
   - `C3-verdant-studio`: organic/rail-friendly direction derived from `mockups/C-verdant-studio.html`
3. For each candidate, create both `icon.svg` (square app-icon master) and `logo.svg` (horizontal lockup) with clean viewBox geometry and padding that survives tiny-size rasterisation.
4. Add `.tests/smoke/icon-candidates-assets.spec.js` with real filesystem assertions for candidate folder presence plus required SVG masters.

Must-haves
- Exactly 3 candidate folders exist with stable IDs (`C1`, `C2`, `C3` slugs).
- Each candidate has both `icon.svg` and `logo.svg`.
- Asset contract is documented and machine-checkable by a smoke spec.

Notes for executor
- Keep this task mockups-only; do not modify `.compose/` or `site/` production wiring.
- Preserve strong visual differentiation; avoid minor color-only variants.

## Inputs

- `mockups/A-ink-and-paper.html`
- `mockups/B-nordic-clarity.html`
- `mockups/C-verdant-studio.html`
- `mockups/icon-comparison.html`
- `.gsd/REQUIREMENTS.md`
- `.gsd/DECISIONS.md`

## Expected Output

- `mockups/icon-candidates/README.md`
- `mockups/icon-candidates/C1-ink-paper/icon.svg`
- `mockups/icon-candidates/C1-ink-paper/logo.svg`
- `mockups/icon-candidates/C2-nordic-clarity/icon.svg`
- `mockups/icon-candidates/C2-nordic-clarity/logo.svg`
- `mockups/icon-candidates/C3-verdant-studio/icon.svg`
- `mockups/icon-candidates/C3-verdant-studio/logo.svg`
- `.tests/smoke/icon-candidates-assets.spec.js`

## Verification

npm --prefix .tests run test -- --reporter=line smoke/icon-candidates-assets.spec.js --grep "candidate SVG masters"
