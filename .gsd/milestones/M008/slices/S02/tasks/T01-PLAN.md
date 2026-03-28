---
estimated_steps: 37
estimated_files: 7
skills_used: []
---

# T01: Wire modal fields and cell display for notes, emoji, and tagline

Six coordinated edits that complete the S02 wiring: (1) extend entries.js updateEntry and updateEntryState, (2) redesign entry modal HTML with three fields and updated call sites, (3) update grid cell display, (4) fix marker mode, (5) add CSS styles, (6) add i18n labels. Then rebuild and run E2E.

### Steps

1. **entries.js** — two changes:
   - `updateEntryState`: add `this.entryNotes = this.getEntryNotes(mindex, day);` and `this.entryEmoji = this.getEntryEmoji(mindex, day);` after the existing `this.entryColour` line.
   - `updateEntry` signature: change from `(mindex, day, entry, entryType, entryColour, syncToRemote)` to `(mindex, day, entry, entryType, entryColour, notes = '', emoji = '', syncToRemote = false)`. Update the `storageLocal.updateLocalEntry(...)` call to pass `notes, emoji` after `entryColour`.

2. **entry.html fragment** — replace the single `<textarea>` with three fields:
   - Tagline: `<input type="text" v-model="entry" id="yp-entry-textarea" maxlength="32" class="yp-entry-text" v-bind:class="'yp-cell-c'+getEntryColour(month,day)" v-bind:placeholder="$t('label.taglineplaceholder')">` — **must keep id="yp-entry-textarea"**.
   - Notes: `<textarea v-model="entryNotes" id="yp-notes-textarea" class="yp-entry-notes" rows="3" v-bind:placeholder="$t('label.notesplaceholder')"></textarea>`
   - Emoji: `<input type="text" v-model="entryEmoji" id="yp-emoji-input" maxlength="4" class="yp-entry-emoji" v-bind:placeholder="$t('label.emojiplaceholder')">` 
   - Update all 10 updateEntry call sites: 9 colour dots get `entryNotes, entryEmoji` before the final `true`, save button gets `entryNotes, entryEmoji` before `true`.
   - Current dot pattern: `updateEntry(month,day,entry,entryType,N,true)` → `updateEntry(month,day,entry,entryType,N,entryNotes,entryEmoji,true)`
   - Current save pattern: `updateEntry(month,day,entry,entryType,entryColour,true)` → `updateEntry(month,day,entry,entryType,entryColour,entryNotes,entryEmoji,true)`

3. **grid.html fragment** — update cell display from 3 spans to 2:
   - Keep span 1 (day number) unchanged.
   - Replace spans 2+3 with a single span: `<span class="yp-cell-text" data-toggle="tooltip" data-placement="bottom" :title="(getEntryEmoji(mindex,n) ? getEntryEmoji(mindex,n)+' ' : '')+getEntry(mindex,n).trimStart()">{{(getEntryEmoji(mindex,n) ? getEntryEmoji(mindex,n)+' ' : '')+getEntry(mindex,n).trimStart()}}</span>`
   - E2E constraint: `.yp-cell-text.nth(1)` must contain the tagline text — this span is nth(1) and uses `toContainText` substring match so emoji prefix is fine.

4. **scripts.html fragment** — update applyMarkerToCell to preserve notes/emoji:
   - Before the `vueInstance.updateEntry(...)` call, add:
     ```js
     var notes = vueInstance.getEntryNotes(mindex, day);
     var emoji = vueInstance.getEntryEmoji(mindex, day);
     ```
   - Change the call from `vueInstance.updateEntry(mindex, day, entry, entryType, markerColour, true)` to `vueInstance.updateEntry(mindex, day, entry, entryType, markerColour, notes, emoji, true)`.

5. **css/main.css** — add styles for new fields:
   - `.yp-entry-text` already exists for the tagline input but has `min-height` and `resize` properties meant for textarea — add a rule to remove those for input type: keep existing `.yp-entry-text` class but override/adjust as needed since it's now on an `<input>`.
   - Add `.yp-entry-notes` for the notes textarea (similar to existing `.yp-entry-text` style: same padding/border/radius, add `resize: vertical`, `min-height: 70px`).
   - Add `.yp-entry-emoji` for the emoji input (narrow width ~80px, centered text, larger font ~1.4rem).
   - Add `.yp-entry-field-label` for optional section labels (`font-size: 0.78rem; color: var(--text-light); margin: 8px 20px 2px; display: block;`).
   - Add color class variants for `.yp-entry-notes` matching `.yp-entry-text.yp-cell-cN` pattern.

6. **en.js** — add three keys to the `label` object:
   ```js
   taglineplaceholder: 'Tagline…',
   notesplaceholder: 'Notes…',
   emojiplaceholder: '😊',
   ```

7. Run `.compose/build.sh` to regenerate `index.html`.

8. Run `cd .tests && npx playwright test` — must be 14 passed, 0 failed.

## Inputs

- ``js/vue/methods/entries.js` — current updateEntry/updateEntryState implementation`
- ``.compose/fragments/modals/entry.html` — current modal with single textarea and 10 updateEntry call sites`
- ``.compose/fragments/grid.html` — current cell display with 3 spans`
- ``.compose/fragments/scripts.html` — current applyMarkerToCell calling updateEntry with 6 args`
- ``css/main.css` — existing .yp-entry-text styles`
- ``js/vue/i18n/en.js` — existing label keys`
- ``js/vue/model/planner.js` — entryNotes/entryEmoji reactive fields (from S01)`
- ``js/service/StorageLocal.js` — updateLocalEntry 7-arg signature (from S01)`

## Expected Output

- ``js/vue/methods/entries.js` — updateEntryState populates entryNotes/entryEmoji; updateEntry accepts notes/emoji params and passes them to storage`
- ``.compose/fragments/modals/entry.html` — three-field modal; all 10 updateEntry call sites pass entryNotes, entryEmoji`
- ``.compose/fragments/grid.html` — 2-span cell display with emoji+tagline in nth(1)`
- ``.compose/fragments/scripts.html` — applyMarkerToCell reads current notes/emoji before updating`
- ``css/main.css` — styles for .yp-entry-notes and .yp-entry-emoji`
- ``js/vue/i18n/en.js` — taglineplaceholder, notesplaceholder, emojiplaceholder keys`
- ``index.html` — regenerated by build.sh`

## Verification

cd .tests && npx playwright test 2>&1 | tail -5
