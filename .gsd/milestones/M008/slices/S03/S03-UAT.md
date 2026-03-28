# S03: Emoji stamp rail mode — UAT

**Milestone:** M008
**Written:** 2026-03-28T09:55:57.527Z

## Preconditions
- App served locally (`.docker/bin/run` or `cd .tests && npx playwright test` with http-server)
- Browser at `http://localhost:8080`
- localStorage cleared (`localStorage.clear()` in devtools console, then reload)

---

## Test Cases

### TC-01: Emoji stamp button appears in rail after marker button
1. Load the app.
2. Observe the left rail.
**Expected:** A smiley-sticker icon button (`#railEmojiBtn`) is visible in the rail, positioned immediately below the marker (highlighter) button and above the spacer.

---

### TC-02: Clicking emoji button opens flyout and activates mode
1. Click the `#railEmojiBtn` button.
**Expected:**
- `#railEmojiFlyout` becomes visible (has `open` class).
- `#railEmojiBtn` gains `active` and `flyout-active` classes.
- The flyout shows an eraser row and a tab bar with 5 tabs (😀 🌸 🍕 🎉 ❤️).
- The Faces tab is active by default and shows 12 emoji in a 6-column grid.
- The page cursor remains normal (crosshair not yet on cells).

---

### TC-03: Cells show crosshair cursor in emoji mode
1. Enter emoji mode (click `#railEmojiBtn`).
2. Hover over any day cell in the planner grid.
**Expected:** Cursor changes to crosshair on `.yp-cell` elements.

---

### TC-04: Tab switching shows correct emoji panel
1. Enter emoji mode.
2. Click the 🌸 tab button (`data-tab="nature"`).
**Expected:** Nature panel becomes visible showing nature emoji (🌸🌿🌈⭐🌙☀️🔥💧🌊⚡🍀🌺). Faces panel hides. Nature tab has `active` class; others do not.
3. Click 🍕 (food), 🎉 (activity), ❤️ (objects) tabs.
**Expected:** Each tab switches correctly, showing its 12 emoji.

---

### TC-05: Selecting an emoji highlights it as selected
1. Enter emoji mode.
2. Click any emoji (e.g. 😂 in the Faces tab).
**Expected:** The clicked button gains `selected` class (border + background highlight). Previous selection (eraser button) loses `selected`.
3. Click a different emoji.
**Expected:** New selection highlighted; previous deselected.

---

### TC-06: Eraser button is selected by default
1. Enter emoji mode (do not click any emoji).
**Expected:** The eraser button (`data-emoji=""`) has `selected` class. `emojiSelected` is effectively `''`.

---

### TC-07: Clicking a cell stamps the selected emoji
1. Enter emoji mode.
2. Select 😎 from the Faces tab.
3. Click a day cell that currently has no entry.
**Expected:** The cell updates to show 😎 (via `updateEntry` with emoji=`😎`). The emoji persists — reloading the page shows 😎 on that cell.

---

### TC-08: Dragging across cells paints emoji on each cell
1. Enter emoji mode.
2. Select 🔥 from the Nature tab.
3. Click and hold on one cell, drag across 3 adjacent cells, release.
**Expected:** All 3 cells show 🔥. No accidental text selection occurs (user-select: none active during drag). Drag state resets after mouseup.

---

### TC-09: Eraser removes emoji from a cell
1. Place 🎉 on a cell (from TC-07/TC-08 steps).
2. In emoji mode, ensure the eraser button is selected (click it if not).
3. Click the cell with 🎉.
**Expected:** The emoji is cleared from the cell. Cell shows no emoji. Tagline and other entry data are preserved.

---

### TC-10: Emoji mode and marker mode are mutually exclusive
1. Activate marker mode (click the highlighter rail button).
2. Click the emoji rail button.
**Expected:** Marker mode deactivates (marker button loses `active`, marker flyout closes). Emoji mode activates.
3. Now click the marker button.
**Expected:** Emoji mode deactivates. Marker mode activates.
4. Confirm only one mode is active at any time (inspect `document.body.classList`).

---

### TC-11: Clicking outside the flyout closes it (mode stays active)
1. Enter emoji mode (flyout open).
2. Click anywhere in the page outside the flyout (e.g. the page header or a month label).
**Expected:** Flyout closes (`open` class removed). Emoji mode remains active (`emoji-mode` on body, button still `active`). Cells still show crosshair cursor.

---

### TC-12: Clicking emoji button again toggles mode off
1. Enter emoji mode.
2. Click `#railEmojiBtn` again.
**Expected:** Emoji mode deactivates — button loses `active`, flyout closes, body loses `emoji-mode`, cells return to default cursor.

---

### TC-13: Emoji persists across page reload
1. Stamp 🌺 on a specific cell (e.g. March 15).
2. Reload the page (`localStorage` is NOT cleared).
**Expected:** March 15 cell still shows 🌺 after reload.

---

### TC-14: Emoji coexists with tagline and colour
1. Open the entry modal for a cell (double-click or click the edit icon).
2. Set tagline = "Conference", colour = blue, emoji = 🎤 (via the emoji field in the modal, from S02).
3. Save.
4. Enter emoji stamp mode. Select eraser. Click that cell.
**Expected:** Emoji is cleared but tagline ("Conference") and colour (blue) are preserved on the cell.

---

### TC-15: All 14 E2E tests still pass
1. Run `cd .tests && npx playwright test`.
**Expected:** 14 passed, 0 failed.
