---
estimated_steps: 85
estimated_files: 4
skills_used: []
---

# T01: Implement emoji stamp rail mode — HTML, JS, CSS, rebuild

Add the emoji stamp button and flyout to `rail.html`, implement the full emoji stamp mode JS block in `scripts.html`, add CSS rules to `css/main.css`, then rebuild `index.html` via `.compose/build.sh` and verify all 14 E2E tests pass.

### rail.html changes

After the closing `</div>` of `#railMarkerFlyout`, before `</nav>`, add:
1. A button: `<button title="Emoji stamp" id="railEmojiBtn"><i class="ph ph-smiley-sticker"></i></button>` — insert it in the rail button list immediately after `#railMarkerBtn` (before `<div class="yp-rail-spacer">`)
2. A flyout div `#railEmojiFlyout` with class `rail-flyout emoji-flyout` immediately after `#railMarkerFlyout`. Structure:
   - Eraser row: `<div class="emoji-eraser-row"><button class="emoji-stamp-btn selected" data-emoji="" title="Eraser"><i class="ph ph-eraser"></i></button></div>`
   - Tab bar: `<div class="emoji-tab-bar">` with 5 `<button class="emoji-tab-btn active/inactive" data-tab="faces|nature|food|activity|objects">` (use emoji icons as tab labels: 😀 🌸 🍕 🎉 ❤️). First tab `faces` has class `active`.
   - 5 tab panels: `<div class="emoji-tab-panel [active]" data-panel="faces|...">` each containing 12 `<button class="emoji-stamp-btn" data-emoji="EMOJI">EMOJI</button>` buttons.
   - Emoji sets: faces=😀😂😍🥰😎😢😡🤔😴🤗🙈💀, nature=🌸🌿🌈⭐🌙☀️🔥💧🌊⚡🍀🌺, food=🍕🍔🍣🍰🍦🍺🎂🥗🍎🌮☕🍩, activity=🎉🎸⚽🏋️🎨📚🎮🚴🎯🏆🎭🧩, objects=❤️💡🔑📱💻✈️🏠💼🎁🔔📸⏰

### scripts.html changes

Immediately after the closing comment of the marker mode block (after the `closeMarkerFlyout` outside-click handler), add a new `// ---- Emoji stamp mode ----` section:

1. State vars: `railEmojiBtn`, `emojiFlyout`, `emojiActive=false`, `emojiSelected=''`, `emojiDragging=false`, `emojiLastCell=null`
2. `openEmojiFlyout()` — calls `closeFlyout()` (close calendar flyout), adds `open` class to `emojiFlyout`, adds `flyout-active` to `railEmojiBtn`
3. `closeEmojiFlyout()` — removes `open` and `flyout-active`
4. `activateEmojiMode()` — if `markerActive` call `deactivateMarkerMode()`, set `emojiActive=true`, add `emoji-mode` to body, add `active` to `railEmojiBtn`, call `openEmojiFlyout()`
5. `deactivateEmojiMode()` — reverse: `emojiActive=false`, remove `emoji-mode`/`emoji-dragging` from body, remove `active` from button, call `closeEmojiFlyout()`, reset `emojiDragging=false`, `emojiLastCell=null`
6. Rail button click listener: toggle `activateEmojiMode()`/`deactivateEmojiMode()`
7. Tab switching: for each `.emoji-tab-btn` in `emojiFlyout`, on click remove `active` from all tabs + panels, add `active` to clicked tab and matching `[data-panel="..."]` panel
8. Emoji selection: for each `.emoji-stamp-btn` in `emojiFlyout`, on click set `emojiSelected=btn.getAttribute('data-emoji')`, toggle `.selected` class
9. `applyEmojiToCell(cellEl)` — identical DOM traversal to `applyMarkerToCell` (closest `[class*="col"]`, parent querySelectorAll, mindex from index, daySpan `.yp-cell-text`, parseInt day). Then: read `entry=getEntry`, `entryType=getEntryType`, `colour=getEntryColour`, `notes=getEntryNotes`. Call `vueInstance.updateEntry(mindex, day, entry, entryType, colour, notes, emojiSelected, true)`.
10. `mousedown` capture listener: if `!emojiActive` return; find `.yp-cell`, prevent default/stop propagation, set `emojiDragging=true`, `emojiLastCell=null`, add `emoji-dragging` to body, call `applyEmojiToCell`
11. `mousemove` listener: if `!emojiDragging` return; `elementFromPoint` → `.closest('#yp-months .yp-cell')` → `applyEmojiToCell`
12. `mouseup` listener: if emojiDragging, reset dragging state
13. `click` capture listener: if `!emojiActive` return; find `.yp-cell`, prevent/stop
14. Outside-click handler for flyout close (not active): mirrors marker pattern

**Mutual exclusion additions to existing marker code:**
- Inside `activateMarkerMode()`, after `markerActive = true` line, add: `if (emojiActive) deactivateEmojiMode();` — NOTE: this reference is forward, but it's in the same IIFE closure so it's fine as long as `deactivateEmojiMode` is declared (var-hoisted). Use `if (typeof deactivateEmojiMode === 'function' && emojiActive) deactivateEmojiMode();` to be safe.
- **Update the rail outside-click block** (around line 78): change `!markerActive` to `!markerActive && !emojiActive` — also add `!(emojiFlyout && emojiFlyout.contains(e.target))` to the guard condition

### css/main.css changes

After the `body.marker-dragging` block, add:
```css
/* ---- EMOJI STAMP MODE ---- */
.emoji-flyout {
    top: 120px;
    width: 200px;
    padding: 6px 8px 8px;
}
.emoji-tab-bar {
    display: flex;
    gap: 2px;
    margin-bottom: 6px;
    border-bottom: 1px solid rgba(255,255,255,0.12);
    padding-bottom: 4px;
}
.emoji-tab-btn {
    flex: 1;
    font-size: 1rem;
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px;
    border-radius: 4px;
    opacity: 0.5;
    transition: opacity 0.1s;
}
.emoji-tab-btn.active { opacity: 1; background: var(--rail-active-bg); }
.emoji-tab-panel { display: none; }
.emoji-tab-panel.active { display: grid; grid-template-columns: repeat(6, 1fr); gap: 2px; }
.emoji-stamp-btn {
    font-size: 1.1rem;
    background: none;
    border: 1px solid transparent;
    border-radius: 4px;
    cursor: pointer;
    padding: 2px;
    text-align: center;
    transition: background 0.1s;
}
.emoji-stamp-btn:hover { background: var(--rail-active-bg); }
.emoji-stamp-btn.selected { border-color: var(--accent); background: var(--rail-active-bg); }
.emoji-eraser-row {
    margin-bottom: 6px;
    display: flex;
    justify-content: flex-end;
}
body.emoji-mode #yp-table .yp-cell {
    cursor: crosshair;
}
body.emoji-dragging {
    user-select: none;
    -webkit-user-select: none;
}
```

### Build and verify

Run `.compose/build.sh` to regenerate `index.html`. Then run `cd .tests && npx playwright test` — must be 14 passed, 0 failed.

## Inputs

- `.compose/fragments/rail.html`
- `.compose/fragments/scripts.html`
- `css/main.css`
- `.compose/build.sh`

## Expected Output

- `.compose/fragments/rail.html`
- `.compose/fragments/scripts.html`
- `css/main.css`
- `index.html`

## Verification

cd .tests && npx playwright test 2>&1 | tail -5
