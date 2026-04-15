# M012/S01 — Research

**Date:** 2026-04-15

## Summary

S01 is the primary owner of **R001** (produce 2–3 complete brand/icon candidate sets). The codebase already has strong mockup prior art for this kind of work: `mockups/icon-comparison.html` is a side-by-side comparison scaffold, and `mockups/A-ink-and-paper.html`, `mockups/B-nordic-clarity.html`, `mockups/C-verdant-studio.html`, plus `mockups/combined-themes.html`, already capture three distinct visual tones and typography/color systems.

Current shipped icons are minimal and consistent with milestone context concerns: `site/favicon-16x16.png`, `site/favicon-32x32.png`, `site/apple-touch-icon.png`, and `site/android-chrome-*.png` all represent the same rudimentary maroon-square mark. Manifest coverage is also minimal (`192`, `512` only, no `purpose`). That confirms S01 should focus on generating stronger candidate systems and a review gallery, not production wiring.

From the loaded `frontend-design` skill, the most relevant rules for S01 are: **commit to distinct conceptual directions**, **avoid generic aesthetics**, and **keep each direction cohesive via deliberate typography/palette/detail choices**. That aligns with producing 2–3 sharply differentiated candidate systems rather than minor variants.

## Recommendation

Use a **mockups-first candidate package** for S01: build three complete candidate systems as SVG-first assets under a dedicated mockup asset directory, and adapt `mockups/icon-comparison.html` into a candidate gallery that compares all candidates at key surface sizes (tiny + large) side-by-side.

Keep S01 isolated from production wiring (`site/index.html`, `site/manifest.json`) so selection work stays reversible and fast. Defer live references to S04/S03 as planned. This keeps scope tight to R001 while producing planner-ready artifacts for S02 visual selection.

## Implementation Landscape

### Key Files

- `mockups/icon-comparison.html` — Existing comparison layout (grid + cards + notes) that can be repurposed for candidate logo/icon gallery.
- `mockups/combined-themes.html` — Existing dual-theme language (`ink` vs `nordic`) and `yp-rail-logo` usage; useful as style anchor for candidate naming and previews.
- `mockups/A-ink-and-paper.html` — Established warm editorial direction to mine for one candidate system.
- `mockups/B-nordic-clarity.html` — Established crisp geometric direction for a second candidate system.
- `mockups/C-verdant-studio.html` — Established organic/green direction for a third candidate system.
- `site/android-chrome-512x512.png` (+ other current icon files) — Baseline legacy mark to replace later; use as before/after reference in S01 gallery.
- `.compose/fragments/head.html` — Production icon links source-of-truth for later slices; **do not change in S01**.
- `.compose/build.sh` + `.compose/index.html.m4` — Confirms `site/index.html` is generated, which constrains downstream wiring strategy.

Suggested new structure for S01 deliverables:

- `mockups/icon-candidates/`
- `mockups/icon-candidates/C1-*/master.svg`
- `mockups/icon-candidates/C1-*/preview-16.png`, `preview-32.png`, `preview-180.png`, `preview-192.png`, `preview-512.png`
- same for C2/C3

(Exact names can vary; keep a stable per-candidate folder contract so S03 export tasks can consume it.)

### Build Order

1. **Lock candidate contract first** (2–3 systems, each with master + preview sizes + short rationale).
   - This retires ambiguity and prevents partial/sketch-only outputs.
2. **Create candidate master assets (SVG) and preview exports** for each candidate.
   - Proves each direction survives tiny and large surfaces.
3. **Repurpose `mockups/icon-comparison.html` into candidate gallery** with side-by-side preview matrix and rationale cards.
   - Produces the explicit review artifact needed by S02.
4. **Run tiny-size legibility pass (16/32)** before declaring S01 done.
   - This is the highest-risk failure mode for icon systems.

### Verification Approach

- Asset presence/coverage check:
  - `find mockups/icon-candidates -type f | sort`
- Candidate count + gallery structure check (after implementation):
  - `rg -n "C1|C2|C3|16x16|32x32|180x180|192x192|512x512" mockups/icon-comparison.html`
- Manual visual validation:
  - Open `mockups/icon-comparison.html` in browser and confirm all candidate systems are legible and differentiated at 16/32/180/192/512 surfaces.
- Regression guard (if any production files are touched accidentally):
  - `cd .tests && npx playwright test smoke/ --reporter=line`

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Candidate side-by-side presentation | `mockups/icon-comparison.html` scaffold | Already matches comparison use-case; faster and consistent with existing mockup artifacts. |
| Directional visual language | `mockups/A-*`, `B-*`, `C-*`, `combined-themes.html` | Provides project-native style anchors; avoids inventing disconnected candidate aesthetics. |

## Constraints

- `site/index.html` is generated from `.compose` (`.compose/build.sh`), so direct edits to production head links are not source-of-truth.
- Static deployment model (no bundler): candidate artifacts should remain simple static files.
- Local tool availability observed: `rsvg-convert`, `sips`, `iconutil` are present; ImageMagick (`magick`) is not currently available.

## Common Pitfalls

- **Editing `site/index.html` directly for icon wiring** — update `.compose/fragments/head.html` in wiring slices, then recompose, or compose drift will fail smoke checks.
- **Designing only at large size** — icons that look strong at 512 can collapse at 16/32; force tiny-size review before finalizing candidate sets.
- **Producing one-off sketches instead of systems** — R001 requires coherent candidate systems (master + cross-size previews), not single hero icons.

## Open Risks

- Tiny-size legibility may force redraws late in S01 if stroke/negative-space choices are too delicate.
- Without a stable folder/file contract now, S03 export automation may require rework to normalize asset names.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| Frontend visual system / mockup implementation | `frontend-design` (installed skill) | installed |
| Icon design (specialized external) | `jezweb/claude-skills@icon-design` | available |
| Icon/PWA asset generation (specialized external) | `alonw0/web-asset-generator@web-asset-generator` | available |