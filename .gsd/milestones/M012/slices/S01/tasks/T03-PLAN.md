---
estimated_steps: 22
estimated_files: 8
skills_used:
  - frontend-design
  - test
---

# T03: Rebuild icon-comparison into a candidate gallery and add gallery integrity tests

Why this task exists
- The slice demo is a side-by-side gallery artifact; without it, S02 cannot perform an explicit visual winner selection.
- Gallery structure must expose both tiny-size and large-size surfaces in a single review view.

Failure Modes (Q5)
| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Candidate preview files from T02 | Render explicit broken-state marker + fail smoke test | N/A (static files) | Flag mismatched candidate/size references in test output |
| HTML candidate metadata (`data-candidate`, `data-size`) | Fail gallery integrity assertions and block completion | N/A | Fail when tokens are missing/duplicated |

Negative Tests (Q7)
- Malformed inputs: wrong candidate IDs in HTML (`C4`, typo slugs) must fail assertions.
- Error paths: missing one referenced preview file must fail the gallery smoke test.
- Boundary conditions: gallery must include exactly 3 candidates and exactly 5 required surface sizes per candidate.

Steps
1. Replace `mockups/icon-comparison.html` content with a candidate-focused gallery: rows for `16x16`, `32x32`, `180x180`, `192x192`, `512x512`; columns for C1/C2/C3; include current shipped icon as baseline row.
2. Add concise rationale cards tied to each candidate direction so reviewers can compare system intent, not just single glyphs.
3. Add machine-readable hooks (`data-candidate`, `data-size`, candidate slugs) to support deterministic checks.
4. Add `.tests/smoke/icon-candidates-gallery.spec.js` with assertions for candidate count, size-row coverage, and referenced file existence.
5. Run the new gallery test plus the asset test together as the slice gate.

Must-haves
- `mockups/icon-comparison.html` is now a candidate gallery (not icon-library comparison).
- Gallery references all 3 candidates at all 5 required sizes.
- Smoke tests enforce gallery integrity and prevent silent regressions.

## Inputs

- `mockups/icon-comparison.html`
- `mockups/icon-candidates/C1-ink-paper/preview-16.png`
- `mockups/icon-candidates/C1-ink-paper/preview-32.png`
- `mockups/icon-candidates/C1-ink-paper/preview-180.png`
- `mockups/icon-candidates/C1-ink-paper/preview-192.png`
- `mockups/icon-candidates/C1-ink-paper/preview-512.png`
- `mockups/icon-candidates/C2-nordic-clarity/preview-16.png`
- `mockups/icon-candidates/C3-verdant-studio/preview-512.png`
- `site/favicon-16x16.png`
- `site/favicon-32x32.png`

## Expected Output

- `mockups/icon-comparison.html`
- `.tests/smoke/icon-candidates-gallery.spec.js`
- `.tests/smoke/icon-candidates-assets.spec.js`

## Verification

npm --prefix .tests run test -- --reporter=line smoke/icon-candidates-assets.spec.js smoke/icon-candidates-gallery.spec.js && rg -n "data-candidate=\"C1\"|data-candidate=\"C2\"|data-candidate=\"C3\"|16x16|32x32|180x180|192x192|512x512" mockups/icon-comparison.html

## Observability Impact

Introduces explicit candidate/size data attributes and gallery smoke diagnostics so future failures show exactly which card/size reference is broken.
