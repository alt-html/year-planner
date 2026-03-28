# S02: Cell display + entry modal — UAT

**Milestone:** M008
**Written:** 2026-03-28T09:47:35.125Z

## UAT: S02 — Cell display + entry modal

### Preconditions
- App served at http://localhost:8080 (or via `cd .tests && npx playwright test` test server)
- localStorage cleared before each test session
- No previous planner data

---

### TC-01: Entry modal opens with three distinct fields

**Steps:**
1. Open the app.
2. Click any day cell in the calendar grid.
3. Observe the entry modal.

**Expected:**
- The modal shows a short tagline input (single-line, maxlength 32, placeholder "Tagline…")
- Below that: a multi-line notes textarea (placeholder "Notes…", resizable vertically)
- Below that: a narrow emoji input (placeholder "😊")
- No legacy single textarea visible

---

### TC-02: Tagline saves and displays as cell text

**Steps:**
1. Click a day cell.
2. Type "Team lunch" in the tagline input.
3. Click a colour marker (e.g., green dot) to save.
4. Observe the cell in the grid.

**Expected:**
- Cell `nth(1)` span shows "Team lunch"
- No emoji prefix visible (emoji field was empty)

---

### TC-03: Emoji saves and displays as cell prefix

**Steps:**
1. Click a day cell.
2. Type "Sprint kick-off" in the tagline input.
3. Type "🚀" in the emoji input.
4. Click Save (or a colour dot) to save.
5. Observe the cell.

**Expected:**
- Cell shows "🚀 Sprint kick-off" (emoji + space + tagline)
- Tooltip on the cell shows the same combined string

---

### TC-04: Notes field saves and restores on re-open

**Steps:**
1. Click a day cell.
2. Type "Quick tagline" in the tagline input.
3. Type "These are my detailed notes for the day." in the notes textarea.
4. Save via a colour dot.
5. Click the same cell again.

**Expected:**
- Tagline input shows "Quick tagline"
- Notes textarea shows "These are my detailed notes for the day."
- Emoji input is empty (none was entered)

---

### TC-05: Colour painting preserves existing notes and emoji

**Steps:**
1. Click a day cell.
2. Enter tagline "Planning", notes "Detailed plan notes", emoji "📅".
3. Save.
4. Close modal.
5. Click a different colour marker directly on the cell (rail marker mode, not from the modal).

**Expected:**
- Cell colour changes to the new marker colour
- Cell still displays "📅 Planning"
- On re-opening the modal, notes "Detailed plan notes" and emoji "📅" are still present

---

### TC-06: Tagline maxlength enforced at 32 characters

**Steps:**
1. Click a day cell.
2. Attempt to type more than 32 characters in the tagline input.

**Expected:**
- Input stops accepting characters at 32
- No truncation of existing typed content — browser enforces maxlength natively

---

### TC-07: Empty tagline, notes only — modal saves cleanly

**Steps:**
1. Click a day cell.
2. Leave tagline empty.
3. Type notes "Background context only."
4. Save.

**Expected:**
- Cell shows no text (tagline empty, emoji empty)
- Re-opening the modal shows notes textarea populated with "Background context only."

---

### TC-08: E2E regression — all 14 Playwright tests pass

**Command:**
```
cd .tests && npx playwright test
```

**Expected:**
- 14 passed, 0 failed
- E2E-02 (entry CRUD) exercises `#yp-entry-textarea` fill (tagline input) and `.yp-cell-text.nth(1)` assertion — both pass

---

### Edge Cases

- **Emoji input with multi-byte emoji (e.g., 🏄‍♂️):** maxlength=4 may truncate complex sequences; acceptable behaviour — emoji picker (S03) will provide valid single emoji.
- **Tagline with leading spaces:** cell display uses `.trimStart()` so leading whitespace is stripped in the rendered cell text (but preserved in the modal input).
- **Tooltip shows combined emoji+tagline:** the `:title` binding matches the cell text binding — both use the same concat expression.
