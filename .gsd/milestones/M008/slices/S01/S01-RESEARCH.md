# S01 — Research: Data layer — extend day schema

**Date:** 2026-03-28

## Summary

The day entry schema is a JSON object stored per-month in localStorage (e.g. key `uid-20251`). The current schema is `{'0': entryType, '1': entry, '2': entryColour}` — all numeric string keys. M008 extends this with `'3'` (long-form notes) and `'4'` (single emoji) as purely additive new keys. The existing `'1'` key already IS the tagline; no key migration is needed. `'3'` and `'4'` are absent in all existing stored data and simply resolve to `''` via the new getters.

The Vue reactive state lives in `js/vue/model/planner.js` (`plannerState`). Currently it has `entry`, `entryType`, and `entryColour`. S01 adds `entryNotes` and `entryEmoji` to this object. The rename of `entry` → `entryTagline` in the reactive state (and the modal template) belongs in S02 when the modal is redesigned — S01 keeps `entry` intact to avoid breaking the existing `#yp-entry-textarea` modal binding and the 14 passing E2E tests.

The three files that need to change are `plannerState`, `entries.js` (getters + write path), and `StorageLocal.js` (persistence). All changes are additive. No schema migration code is needed. All 14 existing E2E tests must remain green after S01.

## Recommendation

Extend the schema additively: add `'3'` and `'4'` keys, add `entryNotes`/`entryEmoji` to `plannerState`, add `getEntryNotes`/`getEntryEmoji` getters, expand `updateLocalEntry` and `updateEntry` signatures to thread the new fields, update `updateEntryState` to load them, and update `importLocalPlanner` to merge them. Run the full 14-test suite to confirm no regressions.

Do not rename `entry` → `entryTagline` in S01. That rename belongs in S02 alongside the modal redesign. Doing it here forces a template change that is S02's scope.

## Implementation Landscape

### Key Files

- `js/vue/model/planner.js` — `plannerState` object. Add `entryNotes: ''` and `entryEmoji: ''`. Keep `entry`, `entryType`, `entryColour` unchanged.
- `js/vue/methods/entries.js` — All getters (`getEntry`, `getEntryType`, `getEntryColour`) and write path (`updateEntry`, `updateEntryState`). Add `getEntryNotes(mindex, day)` → reads `planner[mindex][day]['3']`, `getEntryEmoji(mindex, day)` → reads `planner[mindex][day]['4']`. Expand `updateEntry(mindex, day, entry, entryType, entryColour, notes, emoji, syncToRemote)`. Update `updateEntryState` to set `this.entryNotes` and `this.entryEmoji` from planner.
- `js/service/StorageLocal.js` — `updateLocalEntry(mindex, day, entry, entryType, entryColour)`. Expand to `updateLocalEntry(mindex, day, entry, entryType, entryColour, notes, emoji)`. Persist `'3'` and `'4'` alongside existing keys. Also update `importLocalPlanner` to merge `'3'` and `'4'` from imported data.

### Current `updateLocalEntry` (lines to understand):

```js
// StorageLocal.js
updateLocalEntry(mindex, day, entry, entryType, entryColour) {
    if (!this.model.planner[mindex]) { this.model.planner[mindex] = {}; }
    if (!this.model.planner[mindex]['' + day]) {
        this.model.planner[mindex]['' + day] = {0: entryType, 1: entry, 2: entryColour};
    }
    this.model.planner[mindex]['' + day]['' + 0] = entryType;
    this.model.planner[mindex]['' + day]['' + 1] = entry;
    this.model.planner[mindex]['' + day]['' + 2] = entryColour;
    // ... setLocalPlanner + setLocalPlannerLastUpdated
}
```

Add `this.model.planner[mindex]['' + day]['' + 3] = notes` and `['' + 4] = emoji` in the same pattern.

### Current call sites for `updateEntry` in the HTML template

The entry modal (`entry.html`) calls `updateEntry(month, day, entry, entryType, N, true)` for colour-dot clicks, and `updateEntry(month, day, entry, entryType, entryColour, true)` for the save button. These calls need new `notes` and `emoji` params added. In S01 the values can be threaded from `this.entryNotes` / `this.entryEmoji`. The modal template itself is NOT changed in S01 — that's S02.

Note: the colour-dot buttons pass a hardcoded colour but no notes/emoji. For S01 these can default to `this.entryNotes, this.entryEmoji` or `'', ''` — since S02 will redesign the modal, using `this.entryNotes, this.entryEmoji` is cleanest (preserves existing notes/emoji on colour change).

### `importLocalPlanner` in StorageLocal.js

Currently only merges `'0'` (entryType) and `'1'` (entry). Add parallel merge logic for `'3'` (notes) and `'4'` (emoji). The merge strategy for notes follows the same pattern as `'1'` (concatenate with `\n` on conflict). For emoji, last-write wins (no concatenation makes sense for a single emoji).

### Build Order

1. `js/vue/model/planner.js` — add `entryNotes: ''`, `entryEmoji: ''` (zero-risk, no other file depends on this yet)
2. `js/vue/methods/entries.js` — add `getEntryNotes`, `getEntryEmoji` getters; expand `updateEntryState`; expand `updateEntry` signature
3. `js/service/StorageLocal.js` — expand `updateLocalEntry` signature and body; update `importLocalPlanner` for `'3'` and `'4'`
4. Run `cd .tests && npx playwright test` — all 14 must pass

Step 4 is the verification gate. Since all changes are additive (new fields, expanded signatures with existing callers passing compatible values), test breakage risk is low. The one thing to watch: the `entry.html` template calls `updateEntry` with positional args — if the signature changes, the Vue method must accept the old arity gracefully. Either keep the new params at the end (they're already at the end since `syncToRemote` moves to last), or make the template calls pass `this.entryNotes, this.entryEmoji` explicitly in S02.

For S01, the cleanest approach is to keep the `entry.html` template untouched (S02's job) and make the new params optional with default `''` in `updateEntry`. This way the existing 6-arg template calls still work, and S02 updates the template to pass all 8 args.

### Verification

```bash
cd .tests && npx playwright test
# Must show: 14 passed
```

Additionally, a manual smoke check (or new E2E test) can verify that saving an entry with notes+emoji persists both to `model.planner[mindex][day]['3']` and `localStorage`.

### No new technology

This is purely in-codebase extension of existing patterns. No new library or CDN dependency is needed. No schema migration — `'3'` and `'4'` absent in old data resolves to `undefined` → `''` via `|| ''` in getters.
