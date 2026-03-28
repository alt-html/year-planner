# S01: Data layer — extend day schema

**Goal:** Extend the day schema with `'3'` (notes) and `'4'` (emoji) keys, add corresponding reactive state and getters, expand the write path, and update importLocalPlanner — all additively, with no regressions in the existing 14 E2E tests.
**Demo:** After this: After this: new getters work, all fields persist to localStorage, 14 E2E tests green.

## Tasks
- [x] **T01: Extended day schema with keys '3' (notes) and '4' (emoji) across model, getters, write path, and import; all 14 E2E tests pass** — Implement all four additive changes to extend the day schema with keys '3' (notes) and '4' (emoji).

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
  - Estimate: 45m
  - Files: js/vue/model/planner.js, js/vue/methods/entries.js, js/service/StorageLocal.js
  - Verify: cd .tests && npx playwright test 2>&1 | tail -5
