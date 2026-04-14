---
phase: 15-css-generalisation
plan: "01"
subsystem: css
tags: [css, refactor, extraction, design-tokens, rail, dots]
dependency_graph:
  requires: []
  provides: [design-tokens.css, rail.css, dots.css, css-generalisation-smoke-test]
  affects: [site/css/main.css]
tech_stack:
  added: []
  patterns: [css-file-extraction, design-tokens, css-custom-properties]
key_files:
  created:
    - site/css/design-tokens.css
    - site/css/rail.css
    - site/css/dots.css
    - .tests/smoke/css-generalisation.spec.js
  modified:
    - site/css/main.css
decisions:
  - "Included both dot declaration sites (entry modal + marker flyout overrides) in dots.css per CSS-03 requirement"
  - "Rail toggle section (lines 608-649) included in rail.css as it is a side-effect of rail open state"
  - "marker-flyout content flyout (lines 484-607) kept in main.css — content flyout, not rail structure"
metrics:
  duration: "~10 minutes"
  completed: "2026-04-14"
  tasks_completed: 2
  tasks_total: 2
  files_created: 4
  files_modified: 1
---

# Phase 15 Plan 01: CSS Generalisation — Extraction Summary

## One-liner

Extracted theme design tokens, rail styles, and dot swatches from 1380-line main.css into three focused CSS files with Playwright smoke test validation.

## What Was Built

Three new CSS files extracted from `site/css/main.css`, plus a Playwright smoke test:

| File | Content | Lines extracted |
|------|---------|-----------------|
| `site/css/design-tokens.css` | `:root` and `[data-theme]` custom property blocks for ink and crisp themes | ~100 |
| `site/css/rail.css` | `.yp-rail*`, `.rail-flyout*`, `.rail-toggle` rules | ~183 |
| `site/css/dots.css` | `.yp-dot`, `.yp-dot-c1..c8`, `.yp-dot-clear`, marker flyout overrides | ~50 |
| `.tests/smoke/css-generalisation.spec.js` | File existence, content, and non-duplication checks | new |

`site/css/main.css` trimmed of all extracted blocks. `@media print`, `.marker-flyout` (content flyout), `.emoji-flyout`, `.yp-jumbotron`, and all other non-extracted rules remain.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | a3c1cb2 | test(15-01): add CSS generalisation smoke test |
| 2 | 3ddfbef | feat(15-01): extract design-tokens.css, rail.css, dots.css from main.css |

## Verification

All 7 non-skipped smoke tests pass:
- design-tokens.css, rail.css, dots.css exist
- Each extracted file contains the correct selectors
- main.css no longer contains `:root,`, `.yp-rail {`, `.yp-dot {`
- main.css still contains `@media print` and `.yp-jumbotron`

2 tests marked `test.skip` for Plan 02 enablement:
- CSS-04: bare custom property rename check
- CSS-05: head.html link tag check

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. This is a pure extraction — no data wiring or UI rendering involved.

## Threat Flags

None. Pure CSS file extraction — no new network endpoints, auth paths, or schema changes.

## Self-Check

- [x] `site/css/design-tokens.css` exists
- [x] `site/css/rail.css` exists
- [x] `site/css/dots.css` exists
- [x] `.tests/smoke/css-generalisation.spec.js` exists
- [x] Commit a3c1cb2 exists (Task 1)
- [x] Commit 3ddfbef exists (Task 2)
- [x] All non-skipped smoke tests pass (7/7)
