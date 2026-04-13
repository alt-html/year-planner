---
phase: 13-mechanical-migration
plan: "02"
subsystem: site/index.html, site/css/main.css, site/css/yp-dark.css, .compose/fragments/
tags: [bs5-migration, css, html, vue]
dependency_graph:
  requires: ["13-01"]
  provides: ["bs5-class-renames", "feature-modal-vue-reactive"]
  affects: ["site/index.html", "site/css/main.css", "site/css/yp-dark.css"]
tech_stack:
  added: []
  patterns:
    - "BS5 btn-close empty button (no inner span)"
    - "Vue-reactive modal pattern for featureModal"
    - "CSS filter invert for SVG-based btn-close in dark mode"
key_files:
  created: []
  modified:
    - site/index.html
    - site/css/main.css
    - site/css/yp-dark.css
    - site/js/vue/model/ui.js
    - site/js/vue/methods/planner.js
    - .compose/fragments/head.html
    - .compose/fragments/spinner.html
    - .compose/fragments/nav.html
    - .compose/fragments/rail.html
    - .compose/fragments/grid.html
    - .compose/fragments/footer.html
    - .compose/fragments/modals/auth.html
    - .compose/fragments/modals/share.html
    - .compose/fragments/modals/delete.html
    - .compose/fragments/modals/feature.html
decisions:
  - "Deleted empty dead-code CSS rule with data-toggle='modal' selector (rule body was comment-only)"
  - "featureModal converted to Vue-reactive pattern with showFeatureModal state and closeFeatureModal() method in planner.js"
  - "closeFeatureModal() placed in planner.js (not a new file) — consistent with other modal close methods"
metrics:
  duration: "~25 minutes"
  completed: "2026-04-14"
  tasks: 2
  files: 15
requirements:
  - MIG-02
  - MIG-03
  - MIG-04
  - MIG-05
  - MIG-06
  - MIG-07
  - MIG-08
  - MIG-09
  - MIG-10
  - MIG-11
---

# Phase 13 Plan 02: BS4 Class Renames Summary

**One-liner:** Renamed all BS4-deprecated HTML classes and attributes to BS5 equivalents across index.html, main.css, yp-dark.css, and all compose fragments; converted featureModal to Vue-reactive state.

## What Was Built

All mechanical Bootstrap 4 → 5 text substitutions (MIG-02 through MIG-11) applied to `site/index.html`, `site/css/main.css`, and `site/css/yp-dark.css`. The `featureModal` was also converted from BS4 `data-toggle/data-dismiss` to Vue-reactive state (MIG-12 partial — HTML/JS side; Plan 03 handles entry modal).

### Changes by requirement

| Req | Change | Location |
|-----|--------|----------|
| MIG-11 | Removed `shrink-to-fit=no` from viewport meta | index.html line 6 |
| MIG-07 | `mr-auto`→`me-auto`, `ml-*`→`ms-*`, `pl-3`→`ps-3`, `text-left`→`text-start`, `text-right`→`text-end` | index.html (5 locations) |
| MIG-10 | `text-muted`→`text-body-secondary` | index.html (3 locations) |
| MIG-05 | `sr-only`→`visually-hidden` | index.html spinner |
| MIG-02 | Remove `data-toggle="tooltip"`, `data-toggle="dropdown"`→`data-bs-toggle="dropdown"`, remove featureModal BS4 data attrs | index.html |
| MIG-08 | `form-inline`→`d-flex align-items-center gap-2`, `form-group`→`mb-3`, remove `input-group-append` wrapper | index.html |
| MIG-03 | `no-gutters`→`g-0` (19 in HTML, 2 in CSS) | index.html + main.css |
| MIG-04 | All `.close` buttons→`.btn-close` empty button pattern (5 locations) | index.html + yp-dark.css |
| MIG-09 | `jumbotron`→`yp-jumbotron` (1 in HTML, 4 in CSS) | index.html + main.css |
| MIG-06 | Remove `btn-block` from 3 auth modal sign-in buttons | index.html |
| MIG-12 | featureModal: Vue-reactive `showFeatureModal` state + `closeFeatureModal()` method, footer trigger→`v-on:click` | index.html + ui.js + planner.js |

## Commits

| Hash | Description |
|------|-------------|
| 4eb2cea | feat(13-02): rename all BS4 classes and attributes in index.html to BS5 |
| 05d819e | fix(13-02): update CSS selectors in main.css and yp-dark.css for BS5 |
| e1af430 | fix(13-02): update compose fragments with BS5 class renames and rebuild index.html |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated compose fragments to match BS5 changes**
- **Found during:** Post-task smoke test run — `smoke/compose.spec.js` verifies `site/index.html` is byte-identical to a fresh build from `.compose/fragments/`
- **Issue:** The plan scoped changes to `site/index.html`, `site/css/main.css`, and `site/css/yp-dark.css` only. But `site/index.html` is generated from `.compose/fragments/` via `build.sh`. The compose test rebuilds and diffs — all 10 fragment files still had BS4 patterns, causing the test to fail.
- **Fix:** Applied all same BS5 class renames to the 10 affected fragment files, then rebuilt `site/index.html` (now 666 lines). The compose test passes.
- **Files modified:** `.compose/fragments/head.html`, `spinner.html`, `nav.html`, `rail.html`, `grid.html`, `footer.html`, `modals/auth.html`, `modals/share.html`, `modals/delete.html`, `modals/feature.html`, rebuilt `site/index.html`
- **Commit:** e1af430

## Verification Results

```
smoke/ — 9 passed (4.3s)

grep results:
- no-gutters in index.html: 0 matches
- sr-only in index.html: 0 matches
- form-inline in index.html: 0 matches
- btn-block in index.html: 0 matches
- text-muted in index.html: 0 matches
- shrink-to-fit in index.html: 0 matches
- data-dismiss= in index.html: 0 matches
- class="close" in index.html: 0 matches
- class="form-group" in index.html: 0 matches
- g-0 count in index.html: 19
- yp-jumbotron count in main.css: 4
- g-0 count in main.css: 2
- .close in yp-dark.css: 0 matches
- .btn-close in yp-dark.css: 1 match (with filter rule)
```

## Known Stubs

None — all class renames are complete. The featureModal Vue wiring is complete (showFeatureModal state + closeFeatureModal method + footer trigger). No placeholder data or hardcoded empty values introduced.

## Threat Flags

None — this plan is pure CSS/HTML class renaming with no data flow changes. The `visually-hidden` class correctly preserves screen-reader accessibility for the spinner text (T-13-03 mitigated).

## Self-Check: PASSED

- site/index.html: exists, 666 lines, zero BS4 class names
- site/css/main.css: exists, yp-jumbotron selectors present, g-0 selectors present
- site/css/yp-dark.css: exists, .btn-close filter rule present
- site/js/vue/model/ui.js: showFeatureModal: false added
- site/js/vue/methods/planner.js: closeFeatureModal() method added
- Commits 4eb2cea, 05d819e, e1af430: all present in git log
- Smoke tests: 9/9 passed
