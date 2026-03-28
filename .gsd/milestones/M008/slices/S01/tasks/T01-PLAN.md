---
estimated_steps: 11
estimated_files: 3
skills_used: []
---

# T01: Extend day schema — add notes and emoji fields to model, getters, write path, and import

Implement all four additive changes to extend the day schema with keys '3' (notes) and '4' (emoji).

**Build order:**
1. `js/vue/model/planner.js` — add `entryNotes: ''` and `entryEmoji: ''` to `plannerState`
2. `js/vue/methods/entries.js` — add `getEntryNotes`/`getEntryEmoji` getters; expand `updateEntryState` to set `this.entryNotes`/`this.entryEmoji`; expand `updateEntry` signature with optional `notes = ''` and `emoji = ''` params (keep `syncToRemote` last); thread both to `storageLocal.updateLocalEntry`
3. `js/service/StorageLocal.js` — expand `updateLocalEntry(mindex, day, entry, entryType, entryColour, notes = '', emoji = '')` to write `['' + 3] = notes` and `['' + 4] = emoji`; expand the initial `{0,1,2}` object literal to include `3` and `4`; update `importLocalPlanner` to merge `'3'` (concat with `\n` on conflict, same pattern as `'1'`) and `'4'` (last-write-wins)
4. Run `cd .tests && npx playwright test` — must show 14 passed

**Constraints:**
- Do NOT touch `.compose/fragments/modals/entry.html` — the existing 6-arg template calls must continue working
- Do NOT rename `entry` → `entryTagline` anywhere — that belongs in S02
- New params must be optional with default `''` so all existing callers remain valid
- The `notes` and `emoji` params come after `entryColour` and before `syncToRemote` (entries.js) / no syncToRemote param in StorageLocal

## Inputs

- ``js/vue/model/planner.js` — current plannerState object`
- ``js/vue/methods/entries.js` — current getters and updateEntry/updateEntryState`
- ``js/service/StorageLocal.js` — current updateLocalEntry and importLocalPlanner`

## Expected Output

- ``js/vue/model/planner.js` — plannerState extended with entryNotes and entryEmoji`
- ``js/vue/methods/entries.js` — getEntryNotes, getEntryEmoji added; updateEntry and updateEntryState expanded`
- ``js/service/StorageLocal.js` — updateLocalEntry and importLocalPlanner updated for keys '3' and '4'`

## Verification

cd .tests && npx playwright test 2>&1 | tail -5
