---
phase: 15-css-generalisation
plan: "02"
subsystem: css
tags: [css, refactor, namespacing, design-tokens, custom-properties, build]
dependency_graph:
  requires: [15-01]
  provides: [yp-namespace-css-properties, updated-head-html, rebuilt-index-html]
  affects: [site/css/design-tokens.css, site/css/rail.css, site/css/dots.css, site/css/main.css, site/css/yp-dark.css, .compose/fragments/head.html, site/index.html]
tech_stack:
  added: []
  patterns: [css-custom-property-namespacing, css-load-order, m4-build]
key_files:
  created: []
  modified:
    - site/css/design-tokens.css
    - site/css/rail.css
    - site/css/dots.css
    - site/css/main.css
    - site/css/yp-dark.css
    - .compose/fragments/head.html
    - site/index.html
    - .tests/smoke/css-generalisation.spec.js
decisions:
  - "Used perl -pe with negative lookahead (?=[^-\\w]) instead of sed \\b for word-boundary matching (BSD sed on macOS does not support \\b)"
  - "Processed longest-match names first within collision groups (text-light before text-mid before text; today-bg before today; rail-text-hover before rail-text; etc.) to avoid double-prefix"
  - "Renamed --bg after all *-bg variants (rail-bg, today-bg, th-bg, btn-save-bg) were already renamed to --yp-*"
metrics:
  duration: "~15 minutes"
  completed: "2026-04-14"
  tasks_completed: 2
  tasks_total: 2
  files_created: 0
  files_modified: 8
---

# Phase 15 Plan 02: CSS Generalisation — Namespace Rename & Head Update Summary

## One-liner

Renamed all 31 bare CSS custom properties to `--yp-*` namespace across 5 CSS files, updated head.html to load extracted files, and rebuilt index.html — all 9 CSS smoke tests now passing.

## What Was Built

### Task 1: CSS Custom Property Rename

All 31 bare custom property names renamed to `--yp-*` namespace across 5 CSS files:

| File | Changes |
|------|---------|
| `site/css/design-tokens.css` | All declarations: `--bg` → `--yp-bg`, `--text` → `--yp-text`, etc. (31 properties) |
| `site/css/rail.css` | All `var()` references updated to `--yp-*` |
| `site/css/dots.css` | All `var()` references updated to `--yp-*` |
| `site/css/main.css` | All `var()` references updated to `--yp-*` (~190 call sites) |
| `site/css/yp-dark.css` | All declarations and `var()` references updated |

Rename applied with collision-safe ordering (longest names within each group first).

### Task 2: Head.html + Index.html + Smoke Tests

- `head.html` updated: added `design-tokens.css`, `rail.css`, `dots.css` link tags before `main.css`
- `site/index.html` rebuilt via `bash .compose/build.sh` (671 lines)
- CSS-04 and CSS-05 smoke tests un-skipped — all 9 CSS tests now active and passing

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 8990633 | feat(15-02): rename bare CSS custom properties to --yp-* namespace |
| 2 | 6b9db98 | feat(15-02): update head.html with extracted CSS links, rebuild index.html, enable smoke tests |

## Verification

- `grep -rn 'var(--' site/css/` — all 0 bare (non-yp/bs) references; all `var()` calls use `--yp-*`
- `grep -rn '--yp-yp-' site/css/` — 0 double-prefix occurrences
- 9/9 CSS generalisation smoke tests pass (CSS-01 through CSS-05)
- 5/5 compose spec tests pass (idempotent build check)
- Full suite: 47 passed, 4 skipped (pre-existing skips unrelated to this plan)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Used perl instead of sed for word-boundary matching**
- **Found during:** Task 1
- **Issue:** macOS uses BSD sed which does not support `\b` word boundaries. The research noted this risk (Assumption A1). Testing confirmed `sed -E 's/--text\b/--yp-text/g'` on macOS does not match correctly.
- **Fix:** Used `perl -pe` with negative lookahead `(?=[^-\w])` to correctly match word boundaries, ensuring `--text` is not matched inside `--text-mid` or `--text-light`.
- **Files modified:** All 5 CSS files (via perl -i in-place)
- **Commit:** 8990633

## Known Stubs

None. Pure CSS rename — no data wiring or UI rendering involved.

## Threat Flags

None. Custom property namespace rename is a pure CSS concern with no new network endpoints, auth paths, file access patterns, or schema changes.

## Self-Check

- [x] `site/css/design-tokens.css` modified with `--yp-*` declarations
- [x] `site/css/rail.css` modified with `--yp-*` references
- [x] `site/css/dots.css` modified with `--yp-*` references
- [x] `site/css/main.css` modified with `--yp-*` references
- [x] `site/css/yp-dark.css` modified with `--yp-*` declarations and references
- [x] `.compose/fragments/head.html` contains `design-tokens.css`, `rail.css`, `dots.css` links
- [x] `site/index.html` rebuilt and contains all 6 CSS link tags
- [x] `.tests/smoke/css-generalisation.spec.js` has no `test.skip` remaining
- [x] Commit 8990633 exists (Task 1)
- [x] Commit 6b9db98 exists (Task 2)
- [x] All 9 CSS smoke tests pass
- [x] Full test suite: 47 passed, 4 skipped
