---
id: S02
parent: M002
milestone: M002
provides:
  - 4 domain-grouped model sub-files under js/vue/model/
  - All dynamic fields declared with initial values (no more ghost fields)
  - Flat spread merge in model.js preserving runtime model shape
requires:
  - slice: S01
    provides: Method modules (no changes needed — flat model preserved)
affects:
  - S05
key_files:
  - js/vue/model/calendar.js
  - js/vue/model/planner.js
  - js/vue/model/auth.js
  - js/vue/model/ui.js
  - js/vue/model.js
key_decisions:
  - Flat spread merge instead of nested sub-objects — eliminates template cascade risk entirely
  - CDI fields stay in model.js — keeps autowiring pattern clear
  - Dynamic fields from Application.js declared in sub-files with initial values
patterns_established:
  - Model sub-files export named const objects (calendarState, plannerState, authState, uiState)
  - model.js spread-merges all sub-files flat alongside CDI and feature fields
observability_surfaces:
  - none (flat merge produces identical runtime model)
drill_down_paths:
  - .gsd/milestones/M002/slices/S02/tasks/T01-SUMMARY.md
duration: 10m
verification_result: passed
completed_at: 2026-03-14
---

# S02: Model restructuring

**Split monolithic model.js into 4 domain-grouped source files with flat spread merge — all 14 E2E tests pass**

## What Happened

Extracted all model fields from the monolithic `model.js` into 4 domain sub-files under `js/vue/model/`:
- `calendar.js` — 10 fields (DateTime, year, daysOfWeek, monthsOfYear, etc.)
- `planner.js` — 12 fields (uid, planner, identities, preferences, lang, theme, etc.)
- `auth.js` — 17 fields (username, password, email, signedin, registered, etc.)
- `ui.js` — 9 fields (error, warning, modalError, loaded, rename, etc.)

Key improvement: all 17 dynamic fields (previously ghost fields only set by Application.js at runtime) are now declared with initial values in sub-files, making the full model shape visible at source level.

The model.js imports all 4 sub-files and spreads them flat, preserving the existing runtime model object shape. No template or method module changes were needed.

## Verification

- All 14 Playwright E2E tests pass (15.8s)
- No field duplicates across sub-files (verified by sort/uniq check)

## Requirements Advanced

- MOD-02 — Model split into domain-grouped source files

## Requirements Validated

- MOD-02 — All 14 E2E tests pass with restructured model source, proving flat merge preserves runtime behaviour

## New Requirements Surfaced

- None

## Requirements Invalidated or Re-scoped

- MOD-02 re-scoped: original requirement said "Update all template bindings" but flat spread merge means no template changes needed. The organizational benefit is achieved without the template cascade risk.

## Deviations

- Roadmap anticipated template binding changes across 18 .compose fragments. Research showed the boundary map specified "compose sub-objects into flat model for Vue data()" — so templates were never intended to change. Risk was lower than the roadmap's `risk:high` rating suggested.

## Known Limitations

- Model fields are flat at runtime — templates and methods still use `this.fieldName` not `this.group.fieldName`. The grouping is source-level only.
- Some field placements are judgment calls (e.g., `lang` and `theme` in planner.js because they're part of planner preferences context)

## Follow-ups

None — S03 (API layer modularisation) is the planned next step.

## Files Created/Modified

- `js/vue/model/calendar.js` — new, 10 calendar/date fields
- `js/vue/model/planner.js` — new, 12 planner/identity fields (+ lang, theme)
- `js/vue/model/auth.js` — new, 17 auth/profile fields
- `js/vue/model/ui.js` — new, 9 UI state fields
- `js/vue/model.js` — rewritten: imports sub-files, spreads flat alongside CDI fields

## Forward Intelligence

### What the next slice should know
- Model is still flat at runtime. Methods access `this.fieldName` directly. No path changes for S03.
- Application.js `this.model.fieldName = ...` assignments work unchanged because fields exist flat on the spread model.
- CDI autowiring unaffected — qualifier, null service fields stay on model.js.

### What's fragile
- Nothing — flat merge is mechanically safe. Sub-file organization is purely additive.

### Authoritative diagnostics
- `cd .tests && npx playwright test` — 14 tests, ~16s. Authoritative verification for behaviour preservation.

### What assumptions changed
- Roadmap rated this `risk:high` anticipating template cascade. Actual risk was negligible due to flat merge approach.
