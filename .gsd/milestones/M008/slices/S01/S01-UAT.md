# S01: Data layer — extend day schema — UAT

**Milestone:** M008
**Written:** 2026-03-28T09:31:27.188Z

## UAT: S01 — Data layer — extend day schema

### Preconditions
- App served from project root (or via `.tests` harness on port 8080)
- localStorage cleared before each test case
- Browser devtools open to Application > localStorage for inspection

---

### TC-01: New reactive fields exist in plannerState

**Steps:**
1. Open the app in a browser
2. Open browser console
3. Run: `document.querySelector('[data-app-ready]') !== null` — should return `true`
4. Confirm the Vue app has mounted

**Expected:** App boots without JS errors. The `data-app-ready` attribute is present on the mount element.

---

### TC-02: updateEntry persists notes and emoji to localStorage

**Steps:**
1. Open app, clear localStorage
2. In console, call the Vue instance's updateEntry with notes and emoji:
   - Identify a mounted day cell (e.g. month 0, day 1)
   - Call `app.updateEntry(0, 1, 'Test entry', 1, '#ff0000', false)` (existing 6-arg form — notes/emoji default to '')
3. Inspect localStorage key for the planner
4. Parse the stored JSON and examine `planner[0]["1"]`

**Expected:** Entry stored with shape `{0: 1, 1: 'Test entry', 2: '#ff0000', 3: '', 4: ''}` — keys '3' and '4' present with empty string values.

---

### TC-03: notes (key '3') and emoji (key '4') round-trip through localStorage

**Steps:**
1. Directly set a day entry in the planner model via `updateLocalEntry(0, 5, 'Birthday', 1, '#00ff00', 'Planning notes here', '🎂')`
2. Inspect localStorage
3. Parse the stored planner and examine `planner[0]["5"]`

**Expected:** `{0: 1, 1: 'Birthday', 2: '#00ff00', 3: 'Planning notes here', 4: '🎂'}` — notes stored at key '3', emoji stored at key '4'.

---

### TC-04: getEntryNotes returns stored notes value

**Steps:**
1. Store an entry with notes at month 0, day 3 via updateLocalEntry
2. Call `getEntryNotes(0, 3)` via the Vue app methods

**Expected:** Returns the notes string that was stored. Returns `''` (empty string) when no entry or no notes exist for that day.

---

### TC-05: getEntryEmoji returns stored emoji value

**Steps:**
1. Store an entry with emoji '🎉' at month 1, day 10
2. Call `getEntryEmoji(1, 10)` via the Vue app methods

**Expected:** Returns `'🎉'`. Returns `''` when no entry exists.

---

### TC-06: Existing 6-arg updateEntry callers are unaffected

**Steps:**
1. Open `.compose/fragments/modals/entry.html`
2. Confirm all `updateEntry` calls use the existing 6-arg form (entry, entryType, entryColour, syncToRemote)
3. Run the full E2E suite: `cd .tests && npx playwright test`

**Expected:** No template changes required. All 14 E2E tests pass. The entry CRUD test (E2E-02) creates, edits, and deletes entries without errors — notes/emoji default to ''.

---

### TC-07: importLocalPlanner merges key '3' with concat-newline

**Steps:**
1. Manually set `planner[0]["1"][3] = 'Existing notes'` in the in-memory model
2. Call `importLocalPlanner` with a planner object where `[0]["1"][3] = 'Imported notes'`
3. Inspect `planner[0]["1"][3]` after import

**Expected:** Value is `'Existing notes\nImported notes'` — same concat-with-newline behaviour as key '1' (tagline).

---

### TC-08: importLocalPlanner applies last-write-wins for key '4'

**Steps:**
1. Set `planner[0]["1"][4] = '🎈'` in the in-memory model
2. Call `importLocalPlanner` with `[0]["1"][4] = '🎂'`
3. Inspect `planner[0]["1"][4]` after import

**Expected:** Value is `'🎂'` — imported emoji overwrites existing, no concatenation.

---

### TC-09: All 14 Playwright E2E tests pass

**Steps:**
1. `cd .tests && npx playwright test`

**Expected:** Output shows `14 passed` with 0 failed. Tests cover: entry CRUD (E2E-02), planner management (E2E-03), sync error (SEC-04), tooltip XSS (SEC-03), compose (COMP-02), harness smoke tests (TEST-01 through TEST-04, E2E-01).

---

### Edge Cases

**EC-01: Empty string defaults**
- Call `updateLocalEntry(0, 1, 'Entry', 1, '#fff')` without notes/emoji args
- Confirm stored object has `3: ''` and `4: ''` — no undefined values

**EC-02: importLocalPlanner with missing key '3' or '4'**
- Import a planner where some days have no '3' or '4' key
- Confirm no JS errors and existing values for those keys are preserved

**EC-03: Day with no prior entry receives notes+emoji on first write**
- Call updateLocalEntry on a previously empty day with notes and emoji
- Confirm the new `{0,1,2,3,4}` object is created with all five keys present

