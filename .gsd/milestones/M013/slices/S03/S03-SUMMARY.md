---
id: S03
parent: M013
milestone: M013
provides:
  - Complete share/feature-flag removal
  - Compose output reduced by 70 lines
  - Grep-gate regression script
  - legacy-surface-removal.spec.js E2E coverage
  - Clean URL navigation (no share artifacts)
  - Auth controls preserved and functional
requires:
  []
affects:
  - Application bootstrap flow
  - Vue reactive model (planner/ui state)
  - Compose fragment system
  - CDI context wiring
  - Storage service interface
  - E2E/smoke test contracts
key_files:
  - (none)
key_decisions:
  - Removed dead code (exportPlannerToJSON, exportPlannerToBase64) during LZString import removal to keep Storage.js lean
  - Replaced feature.signin conditionals with direct signedin() checks to preserve auth functionality after feature-flag removal
  - T02 completed all five planned steps for T03; T03 served as verification gate runner rather than implementation
  - Grep gate + E2E assertions layered for dual coverage: static pattern checks (code presence/absence) + runtime DOM assertions (behavior validation)
patterns_established:
  - When removing legacy feature scaffolding, distinguish between removing the gate mechanism vs. removing the underlying functionality
  - Periodic audits of .compose/fragments/ against .m4 inclusions prevent orphan-file accumulation across milestones
  - Compose artifact drift is prevented by comparing output line count before/after removal — a reliable indicator of completeness
observability_surfaces:
  - grep-gate script output (verify-no-legacy-share-features.sh) — exits 0 when clean, non-zero with file:line matches if any share/feature symbols reintroduced
  - Compose build output line count — 625 lines expected (70 lines removed from prior 695)
  - Playwright test output — legacy-surface-removal.spec.js (5 assertions), bs5-migration MIG-01/MIG-04 (2 tests), compose smoke COMP-02 (5 tests); all expected to pass with no failures
drill_down_paths:
  []
duration: ""
verification_result: passed
completed_at: 2026-04-16T06:14:50.543Z
blocker_discovered: false
---

# S03: Legacy Surface Removal (Share + Feature Flags)

**Removed all legacy share and feature-flag surfaces from runtime and UI; no dead share/feature code or visible controls remain.**

## What Happened

## Summary

S03 completed the removal of all legacy share and feature-flag surfaces across the year-planner codebase. Three tasks worked in sequence:

**T01: Remove share URL/LZ runtime contract** (7 files, 3 verification checks)
- Removed `?share=` URL parameter ingestion from Application.js bootstrap (while preserving OAuth callback params)
- Deleted LZString CDN import, `getExportString()`, `setModelFromImportString()`, and dead export helpers from Storage.js
- Removed share-specific Vue state fields (`shareUrl`, `_pendingImport`, `share`) and methods (`sharePlanner()`, `copyUrl()`)
- Removed `_pendingImport` consumption from lifecycle.js refresh()
- Removed `closeShareModal()` dependent close handler from rail.js
- Verification: grep gate found zero forbidden symbols (exit 0); compose build succeeded (695 lines); smoke tests 5/5 passed

**T02: Remove feature-flag and share UI surfaces** (11 files, 4 verification checks)
- Deleted `.compose/fragments/modals/share.html` and `feature.html` modal files
- Removed share button and flyout items from rail.html; replaced `feature.signin` conditionals with direct `signedin()` checks to keep auth UI functional
- Removed hidden feature trigger span from footer.html (replaced with static text)
- Removed feature-flag debug block from grid.html
- Deleted entire `site/js/vue/model-features.js` file; removed `feature` object from model.js and contexts.js
- Removed `showFeatureModal` state from ui.js and `closeFeatureModal()` method from rail.js
- Created `scripts/verify-no-legacy-share-features.sh` grep-gate script with 12 forbidden-symbol checks
- Created `.tests/e2e/legacy-surface-removal.spec.js` with 5 Playwright assertions validating removal
- Updated `.tests/e2e/bs5-migration.spec.js` to use deleteModal instead of removed shareModal for btn-close test; removed MIG-12 featureModal tests
- Updated `.tests/smoke/compose.spec.js` to assert share.html and feature.html are absent
- Verification: grep gate exit 0; verify script exit 0; all 12 Playwright tests passed; compose build succeeded (625 lines, down from 695)

**T03: Re-composition and final verification** (3 verification commands, all green)
- T02 had already completed all five planned implementation steps; T03 ran final verification suite
- Compose build: 625-line clean `site/index.html` with no orphaned share/feature includes
- Grep gate: 12 forbidden-symbol checks all pass
- Playwright suite: 12 tests across 3 specs (legacy-surface-removal, bs5-migration MIG-01/MIG-04, compose smoke COMP-02×5) all pass

## Integration Impact

After S03:
- **No legacy share surface remains** — zero `?share=` ingestion, zero LZ import/export paths, zero share modal/button UI
- **No feature-flag system remains** — model-features.js deleted, feature object purged from Vue model/CDI, all `feature.*` conditionals replaced with direct logic, feature modal/trigger removed
- **Auth controls preserved** — sign-in button remains functional via direct `signedin()` check instead of `feature.signin` gate
- **Clean URL navigation maintained** — S02's clean-URL contract unaffected; share/feature removal added no URL artifacts
- **Regression proof complete** — grep gate script + 5 targeted E2E assertions + updated smoke suite provide objective evidence that legacy surfaces cannot be silently reintroduced

## Patterns & Lessons Learned

1. **Dead code cleanup during removal**: When removing LZString import (for share), also deleted dead export helpers (`exportPlannerToJSON`, `exportPlannerToBase64`) that had no callers. This kept Storage.js lean rather than leaving orphaned code.

2. **Composed artifact drift prevention**: `.compose/fragments/share.html` and `.feature.html` files existed but were deleted. Periodic audits of `.compose/fragments/` against `.m4` inclusions are critical — 7 orphan modal fragments accumulated silently across M002–M004 until M011 cleanup. The lesson: verify every `.compose/fragments/*.html` file is actively included before assuming it's used.

3. **Conditional logic preservation during feature-flag removal**: When removing `feature.signin` gates from rail settings flyout, replaced with direct `signedin()` checks rather than removing auth UI entirely. This illustrates the distinction between removing feature-flag scaffolding vs. removing the functionality itself — the feature (sign-in button) was retained, only the gating mechanism was removed.

4. **Grep gate + E2E assertion layering**: T02/T03 achieved dual coverage via `scripts/verify-no-legacy-share-features.sh` (static pattern check) + `legacy-surface-removal.spec.js` (runtime DOM assertion). Static grep gates catch code presence/absence; E2E tests validate runtime behavior (e.g., modal element doesn't exist in DOM). Neither alone is sufficient.

## Files Modified

T01 (7 files):
- site/js/Application.js
- site/js/service/Storage.js
- site/js/vue/model/planner.js
- site/js/vue/model/ui.js
- site/js/vue/methods/planner.js
- site/js/vue/methods/lifecycle.js
- site/js/vue/methods/rail.js

T02 (11 files):
- .compose/fragments/modals.html
- .compose/fragments/rail.html
- .compose/fragments/footer.html
- .compose/fragments/grid.html
- site/js/vue/model.js
- site/js/config/contexts.js
- site/js/vue/model/ui.js (already listed in T01)
- site/js/vue/methods/rail.js (already listed in T01)
- scripts/verify-no-legacy-share-features.sh (created)
- .tests/e2e/legacy-surface-removal.spec.js (created)
- .tests/smoke/compose.spec.js (updated)
- .tests/e2e/bs5-migration.spec.js (updated)

T03 (verification):
- site/index.html (re-composed, no manual changes)
- All artifacts from T01/T02 re-verified

## Requirements Covered

- **R105** (Remove legacy share surface) → Validated: all share URL/LZ runtime contract removed
- **R106** (Remove feature-flag system) → Validated: complete feature-flag removal with auth controls preserved
- **R109** (Strict regression proof) → Supporting evidence: grep gate + legacy-surface-removal.spec.js + updated smoke suite provide objective coverage of removed surfaces

## Verification

All verification checks passed:

1. **Compose build** (`bash .compose/build.sh`): ✅ exit 0, 625 lines (down from 695 after modal removals)

2. **Grep gate** (`bash scripts/verify-no-legacy-share-features.sh`): ✅ exit 0 with message "✅ No forbidden share/feature surfaces found." Checks: no ?share=, no shareModal/featureModal, no sharePlanner(, no showFeatureModal, no feature.*, no model-features import, no share.html/feature.html includes, no deleted files present.

3. **Playwright verification suite** (`npm --prefix .tests run test -- --reporter=line e2e/legacy-surface-removal.spec.js e2e/bs5-migration.spec.js smoke/compose.spec.js`): ✅ 12/12 passed in 4.6s
   - LSR-01: share button is absent from rail ✅
   - LSR-02: shareModal is absent from DOM ✅
   - LSR-03: featureModal is absent from DOM ✅
   - LSR-04: footer contains no hidden feature trigger ✅
   - LSR-05: sign-in button is present in rail when not signed in ✅
   - MIG-01: BS5 CSS loads without SRI integrity error ✅
   - MIG-04: .btn-close renders visibly in delete modal header (uses deleteModal instead of removed shareModal) ✅
   - COMP-02 (×5): compose build identity, fragment directory structure, share.html/feature.html absent, build.sh executable, m4 available ✅

**Evidence Summary**: Three independent verification paths confirm complete removal: (1) static grep-gate ensures no share/feature symbols leak into codebase; (2) composed HTML is valid and 70 lines smaller; (3) all 12 Playwright assertions pass validating runtime behavior (no share/feature modals in DOM, no hidden triggers, auth still works).

## Requirements Advanced

None.

## Requirements Validated

- R105 — S03 T01/T02/T03 removed all share URL/LZ runtime contract from 7 files (Application.js, Storage.js, Vue model/methods) and share UI surfaces from 11 files (compose fragments, Vue bindings). Grep gate exit 0; verify script exit 0; legacy-surface-removal.spec.js assertions pass. No share import/export path remains.
- R106 — S03 T02/T03 deleted model-features.js, removed feature object from Vue model and CDI, replaced all feature.* conditionals with direct logic, removed feature modal/trigger from UI. Grep gate exit 0; legacy-surface-removal.spec.js assertions pass. Auth controls preserved via direct signedin() checks.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Operational Readiness

None.

## Deviations

None.

## Known Limitations

none

## Follow-ups

None.

## Files Created/Modified

None.
