---
id: S01
parent: M008
milestone: M008
provides:
  - entryNotes and entryEmoji reactive state in plannerState
  - getEntryNotes(mindex, day) and getEntryEmoji(mindex, day) getter methods
  - StorageLocal persists notes to key '3' and emoji to key '4' in localStorage
  - importLocalPlanner merges '3' (concat-newline) and '4' (last-write-wins)
requires:
  []
affects:
  - S02
  - S03
key_files:
  - js/vue/model/planner.js
  - js/vue/methods/entries.js
  - js/service/StorageLocal.js
key_decisions:
  - Key '3' (notes) uses concat-with-newline merge in importLocalPlanner — same pattern as key '1' (tagline). Key '4' (emoji) uses last-write-wins — emoji doesn't accumulate across imports.
  - notes and emoji params inserted before syncToRemote in entries.js updateEntry, and there is no syncToRemote param in StorageLocal — preserving all existing 6-arg template call sites unchanged.
patterns_established:
  - Day object uses terse numeric string keys: '0'=entryType, '1'=tagline, '2'=colour, '3'=notes, '4'=emoji. New fields are always appended as optional params with default '' to maintain backward compat with existing callers.
observability_surfaces:
  - none
drill_down_paths:
  - .gsd/milestones/M008/slices/S01/tasks/T01-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-28T09:31:27.188Z
blocker_discovered: false
---

# S01: Data layer — extend day schema

**Extended the day data model with notes (key '3') and emoji (key '4') across model state, getters, write path, and import — all 14 E2E tests pass.**

## What Happened

Single task (T01) covered all four change sites additively. `plannerState` in `js/vue/model/planner.js` gained two new reactive fields: `entryNotes: ''` and `entryEmoji: ''`. `js/vue/methods/entries.js` gained `getEntryNotes` and `getEntryEmoji` getter methods; `updateEntryState` now populates both fields from the stored day object; `updateEntry` signature was extended with optional `notes = ''` and `emoji = ''` params inserted before the existing `syncToRemote` parameter so all 6-arg callers remain valid. `js/service/StorageLocal.js`'s `updateLocalEntry` was extended to accept `notes = ''` and `emoji = ''` (after `entryColour`), write them to keys `'3'` and `'4'` on both the initial object literal and the individual field assignments. `importLocalPlanner` was extended to merge key `'3'` with the same concat-with-newline strategy used for key `'1'` (tagline), and key `'4'` with last-write-wins (emoji doesn't accumulate). No template files, test files, or existing callers were modified.

## Verification

Ran `cd .tests && npx playwright test` twice — at task completion (6.3s) and again at slice close (6.1s). Both: 14 passed, 0 failed. All existing E2E tests (entry CRUD, planner management, sync error, tooltip XSS, compose, harness) remained green with no modifications.

## Requirements Advanced

- MOD-10 — All 14 E2E tests pass after additive schema extension — no regressions introduced.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

None. Implementation matched the plan exactly including parameter ordering, merge semantics, and zero template changes.

## Known Limitations

The `updateEntry` in entries.js still uses the 6-arg signature from the template (entry, entryType, entryColour, syncToRemote) — notes and emoji are not yet wired from any UI call site. That wiring belongs to S02 (cell display + entry modal).

## Follow-ups

S02 must add notes/emoji inputs to the entry modal and wire the updateEntry call to pass them. The `entryNotes`/`entryEmoji` reactive state is ready; getters are available as `getEntryNotes(mindex, day)` and `getEntryEmoji(mindex, day)`.

## Files Created/Modified

- `js/vue/model/planner.js` — Added entryNotes: '' and entryEmoji: '' reactive fields to plannerState
- `js/vue/methods/entries.js` — Added getEntryNotes/getEntryEmoji getters; expanded updateEntryState to read keys '3'/'4'; extended updateEntry with optional notes/emoji params before syncToRemote
- `js/service/StorageLocal.js` — Extended updateLocalEntry to write keys '3' (notes) and '4' (emoji); extended importLocalPlanner to merge '3' with concat-newline and '4' with last-write-wins
