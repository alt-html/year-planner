---
id: M008
title: "Day Data Model Extension"
status: complete
completed_at: 2026-03-28T09:59:44.047Z
key_decisions:
  - Day object schema uses terse numeric string keys: '0'=entryType, '1'=tagline, '2'=colour, '3'=notes, '4'=emoji. New fields always appended as optional params with default '' to maintain backward compat with existing callers. (D010)
  - Key '3' (notes) uses concat-with-newline merge in importLocalPlanner; key '4' (emoji) uses last-write-wins. Notes are prose that may diverge across copies; emoji is a single stamp that shouldn't accumulate.
  - New params (notes, emoji) inserted before the syncToRemote boolean sentinel in updateEntry — boolean coercion to string produces silent failures. All 11 call sites updated consistently.
  - #yp-entry-textarea id preserved on the tagline input field after the modal restructure — E2E test E2E-02 depends on this selector. Any future modal change must keep this id on the tagline field or update the E2E.
  - Emoji stamp mode architecture mirrors marker mode exactly — same flyout pattern, capture-phase handlers, activate/deactivate pair, mutual exclusion. typeof deactivateEmojiMode guard used in activateMarkerMode to safely reference a forward-declared function within the same IIFE closure.
key_files:
  - js/vue/model/planner.js
  - js/vue/methods/entries.js
  - js/service/StorageLocal.js
  - .compose/fragments/modals/entry.html
  - .compose/fragments/grid.html
  - .compose/fragments/scripts.html
  - .compose/fragments/rail.html
  - css/main.css
  - js/vue/i18n/en.js
  - index.html
lessons_learned:
  - When extending a vararg call site, always insert new params before the final boolean sentinel — boolean coercion to string is a silent failure mode that won't surface in tests until the value is actually read.
  - Rail mode is now a reusable pattern: flyout button → flyout div → activate/deactivate pair → capture-phase mousedown/click/mousemove/mouseup → outside-click close guard. Use this template for any future rail mode.
  - applyEmojiToCell mirrors applyMarkerToCell exactly (closest [class*='col'] → parent querySelectorAll → mindex from index → daySpan .yp-cell-text → parseInt day → read existing entry state → call updateEntry). Document this traversal pattern before it diverges.
  - When preserving E2E test compatibility across UI restructures, identify selector-stable anchors early (#yp-entry-textarea, .yp-cell-text.nth(1)) and make structural decisions around them rather than fixing tests after.
  - typeof guards are the correct way to reference functions declared later in the same IIFE closure — the guard doubles as a forward-compat safety net if the dependent mode is not yet loaded.
---

# M008: Day Data Model Extension

**Extended the year planner day data model with notes and emoji fields, redesigned the entry modal with three distinct fields, updated cell display, and added a full emoji stamp rail mode with tabbed picker and drag-paint support — all 14 E2E tests pass.**

## What Happened

M008 delivered the day data model extension across three sequential slices. S01 laid the data foundation: `plannerState` gained `entryNotes` and `entryEmoji` reactive fields; `entries.js` gained `getEntryNotes`/`getEntryEmoji` getter methods and extended `updateEntry` to an 8-arg signature with `notes` and `emoji` inserted before the `syncToRemote` boolean sentinel; `StorageLocal.js` was extended to persist keys `'3'` (notes, concat-merge on import) and `'4'` (emoji, last-write-wins on import). Zero template changes — all 14 E2E tests passed unchanged.

S02 wired the data layer into the UI. The single-textarea entry modal became a three-field layout: tagline input (preserving `#yp-entry-textarea` id for E2E compatibility), notes textarea, and emoji input. All 11 `updateEntry` call sites in entry.html (9 colour dots + 1 save button) and `scripts.html` (`applyMarkerToCell`) were updated to pass the new `notes`/`emoji` params. Grid cells consolidated from three spans to two, with the nth(1) span rendering an optional emoji prefix concatenated with the tagline. CSS updated for the restructured modal fields. All 14 E2E tests passed.

S03 added the emoji stamp rail mode as a parallel track alongside the existing colour marker mode. `rail.html` gained `#railEmojiBtn` and `#railEmojiFlyout` with 5 tabs (faces/nature/food/activity/objects) each holding 12 stamp buttons, plus an eraser row — 60 emoji total. `scripts.html` gained the full mode implementation: state vars, `openEmojiFlyout`/`closeEmojiFlyout`, `activateEmojiMode`/`deactivateEmojiMode`, tab switching, stamp selection, `applyEmojiToCell` (mirrors `applyMarkerToCell`), four capture-phase event handlers for click/drag painting, and mutual exclusion guards against marker mode. CSS gained the `EMOJI STAMP MODE` block with flyout positioning, tab bar, stamp grid, crosshair cursor, and drag user-select:none. All 14 E2E tests passed in 6.2s. The composed `index.html` reached 1013 lines.

## Success Criteria Results

All success criteria drawn from the roadmap vision were met:

- **New data fields persist** — Keys `'3'` (notes) and `'4'` (emoji) are written by `StorageLocal.updateLocalEntry` and read back by `getEntryNotes`/`getEntryEmoji`. Import merge semantics: concat-newline for notes, last-write-wins for emoji.
- **Three-field entry modal** — `entry.html` replaced the single textarea with tagline (input), notes (textarea), and emoji (input) fields. All update call sites pass notes+emoji.
- **Cell display shows emoji + tagline** — Grid nth(1) span renders `(emoji ? emoji+' ' : '') + tagline` conditionally. E2E assertion `toContainText` substring match continues to pass with the prefix.
- **Emoji stamp rail mode** — `#railEmojiBtn` activates a tabbed flyout with 60 emoji across 5 categories plus eraser. Click and drag-paint both work. Mutual exclusion with marker mode confirmed.
- **14 E2E tests pass** — Final run: 14 passed, 0 failed in 7.0s. No test files were modified. MOD-10 satisfied across all three slices.

## Definition of Done Results

- [x] **S01 complete** — Data layer extended; S01-SUMMARY.md exists; verification: 14 passed, 0 failed.
- [x] **S02 complete** — Cell display + entry modal delivered; S02-SUMMARY.md exists; verification: 14 passed, 0 failed.
- [x] **S03 complete** — Emoji stamp rail mode delivered; S03-SUMMARY.md exists; verification: 14 passed, 0 failed.
- [x] **All 3 slices marked ✅ in roadmap** — Slice overview table shows ✅ for S01, S02, S03.
- [x] **10 non-.gsd files changed** — `git diff --stat c284e3b HEAD` shows 705 insertions across `js/`, `css/`, `.compose/`, `index.html`.
- [x] **No test regressions** — All 14 Playwright E2E tests (boot, entry CRUD, planner management, sync error, tooltip XSS, compose, harness) pass without modification.
- [x] **Cross-slice integration** — S03 calls `vueInstance.updateEntry` with the 8-arg signature established in S01/S02. `applyEmojiToCell` reuses the DOM traversal pattern from `applyMarkerToCell` (S02). No mismatch detected.

## Requirement Outcomes

### MOD-10 — All 14 E2E tests pass after additive schema extension

- **Previous status:** active
- **New status:** validated (advanced this milestone)
- **Evidence:** `cd .tests && npx playwright test` returned 14 passed, 0 failed at end of each slice (S01: 6.3s, S02: 6.2s, S03: 6.2s; final run: 7.0s). No test files were modified. The requirement was advanced progressively across all three slices.

All other active requirements (MOD-01 through AUTH-06, STO-01 through STO-05) remain active with unchanged status — they belong to future milestones and were not in scope for M008.

## Deviations

None. All three slices executed to plan without replans or blockers.

## Follow-ups

S03 emoji stamp mode can be round-trip tested against the entry modal emoji field — both write to key '4'. The modal emoji field and the stamp mode are currently independent write paths; a future integration test could verify they round-trip through the same storage key. The concat-merge for notes (key '3') can produce duplicates if the same planner is imported twice — a dedup pass in importLocalPlanner could be added if this causes user confusion.
