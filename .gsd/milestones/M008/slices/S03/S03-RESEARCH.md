# S03 Research: Emoji Stamp Rail Mode

## Summary

Straightforward additive work following the existing colour marker mode pattern exactly. No Vue code changes required. All changes land in three compose fragments (`rail.html`, `scripts.html`, `css/main.css`) plus an `index.html` rebuild. The stamp mode is a plain-JS parallel to the existing marker mode — pick an emoji in a tabbed flyout, click/drag to paint emoji onto cells via the existing `updateEntry` 8-arg call.

## Recommendation

Single task. Implement the emoji stamp button, tabbed flyout HTML, stamp mode JS block, and CSS rules. Rebuild `index.html`. Run all 14 E2E tests.

---

## Implementation Landscape

### What already exists

**Marker mode (colour) — complete reference implementation** in `.compose/fragments/scripts.html`:
- `markerActive`, `markerColour`, `markerDragging`, `markerLastCell` state vars
- `activateMarkerMode()` / `deactivateMarkerMode()` toggle `body.marker-mode` and rail button `.active` class
- `openMarkerFlyout()` / `closeMarkerFlyout()` toggle `.open` on `#railMarkerFlyout`
- `applyMarkerToCell(cellEl)` — DOM walks from cell → parent col → sibling index (mindex); reads day from `.yp-cell-text` `textContent`; calls `vueInstance.updateEntry(mindex, day, entry, entryType, markerColour, notes, emoji, true)` — **already reads and preserves existing notes and emoji**
- Mouse event handlers on `document` (capture phase for mousedown/click, bubbling for mousemove/mouseup)
- Flyout close-on-outside-click handler

**Vue methods available to the IIFE** (via `appEl._vnode.component.proxy`):
- `getEntry(mindex, day)` — tagline
- `getEntryType(mindex, day)` — entry type
- `getEntryColour(mindex, day)` — colour index
- `getEntryNotes(mindex, day)` — key '3' (added S01)
- `getEntryEmoji(mindex, day)` — key '4' (added S01)
- `updateEntry(mindex, day, entry, entryType, entryColour, notes, emoji, syncToRemote)` — 8-arg signature (added S02)

**Rail HTML** in `.compose/fragments/rail.html`:
- `#railMarkerBtn` button (line ~6) — emoji stamp button goes after it
- `#railMarkerFlyout` `.rail-flyout.marker-flyout` div — emoji flyout goes after it
- The existing `closeFlyout()` function in scripts closes only the calendar flyout; the marker flyout has its own `closeMarkerFlyout()` — emoji stamp follows the same private-close pattern

**CSS patterns** in `css/main.css`:
- `.rail-flyout` base: `position:absolute; left:48px; top:40px; width:140px` — emoji flyout overrides top/width
- `.marker-flyout` already overrides `top:82px; width:auto; padding:8px 10px`
- `.marker-flyout-dots` uses `flex-direction:column` for vertical dot stack
- The pen cursor is a data-URI SVG applied to `body.marker-mode #yp-table .yp-cell`
- `body.marker-dragging { user-select:none }` pattern for drag suppression

### What to build

#### 1. `rail.html` — add button + flyout

After `#railMarkerBtn`:
```html
<button title="Emoji stamp" id="railEmojiBtn"><i class="ph ph-smiley-sticker"></i></button>
```

After `#railMarkerFlyout`, add `#railEmojiFlyout` with:
- A tab bar (`.emoji-tab-bar`) with category tab buttons (`data-tab="faces"`, `data-tab="nature"`, `data-tab="food"`, `data-tab="activity"`, `data-tab="objects"`)
- Tab panels (`.emoji-tab-panel`) each containing a grid of `<button class="emoji-stamp-btn" data-emoji="...">` elements
- An eraser button at the top of the flyout: `data-emoji=""` with `ph ph-eraser` icon

Suggested emoji sets (~12 per category):
- **faces**: 😀 😂 😍 🥰 😎 😢 😡 🤔 😴 🤗 🙈 💀
- **nature**: 🌸 🌿 🌈 ⭐ 🌙 ☀️ 🔥 💧 🌊 ⚡ 🍀 🌺
- **food**: 🍕 🍔 🍣 🍰 🍦 🍺 🎂 🥗 🍎 🌮 ☕ 🍩
- **activity**: 🎉 🎸 ⚽ 🏋️ 🎨 📚 🎮 🚴 🎯 🏆 🎭 🧩
- **objects**: ❤️ 💡 🔑 📱 💻 ✈️ 🏠 💼 🎁 🔔 📸 ⏰

#### 2. `scripts.html` — add emoji stamp mode block

Immediately after the existing marker mode section, add a new section:

```js
// ---- Emoji stamp mode ----
var railEmojiBtn  = document.getElementById('railEmojiBtn');
var emojiFlyout   = document.getElementById('railEmojiFlyout');
var emojiActive   = false;
var emojiSelected = '';          // current selected emoji ('' = eraser)
var emojiDragging = false;
var emojiLastCell = null;

function openEmojiFlyout() { ... }
function closeEmojiFlyout() { ... }
function activateEmojiMode() {
    // deactivate marker mode if active
    if (markerActive) deactivateMarkerMode();
    emojiActive = true;
    body.classList.add('emoji-mode');
    railEmojiBtn.classList.add('active');
    openEmojiFlyout();
}
function deactivateEmojiMode() { ... }
```

`applyEmojiToCell(cellEl)` — identical DOM traversal as `applyMarkerToCell`:
```js
function applyEmojiToCell(cellEl) {
    if (cellEl === emojiLastCell) return;
    emojiLastCell = cellEl;
    // ... same mindex + day extraction as applyMarkerToCell ...
    var entry      = vueInstance.getEntry(mindex, day);
    var entryType  = vueInstance.getEntryType(mindex, day);
    var colour     = vueInstance.getEntryColour(mindex, day);
    var notes      = vueInstance.getEntryNotes(mindex, day);
    // Write new emoji (or '' to clear), preserve everything else
    vueInstance.updateEntry(mindex, day, entry, entryType, colour, notes, emojiSelected, true);
}
```

Tab switching:
```js
emojiFlyout.querySelectorAll('.emoji-tab-btn').forEach(function(tab) {
    tab.addEventListener('click', function(e) {
        e.stopPropagation();
        emojiFlyout.querySelectorAll('.emoji-tab-btn').forEach(t => t.classList.remove('active'));
        emojiFlyout.querySelectorAll('.emoji-tab-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        emojiFlyout.querySelector('[data-panel="' + tab.dataset.tab + '"]').classList.add('active');
    });
});
```

Emoji selection:
```js
emojiFlyout.querySelectorAll('.emoji-stamp-btn').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        emojiSelected = btn.getAttribute('data-emoji');
        emojiFlyout.querySelectorAll('.emoji-stamp-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
    });
});
```

Mouse event handlers mirror marker mode exactly (capture-phase `mousedown`, `mousemove`, `mouseup`).

**Mutual exclusion**: `activateEmojiMode()` must call `deactivateMarkerMode()` if `markerActive`. Conversely, `activateMarkerMode()` must call `deactivateEmojiMode()` if `emojiActive`. The `markerActive` and `emojiActive` vars are both in the same IIFE closure — mutual deactivation is just direct function calls.

**Outside-click dismissal**: The existing document click listener already references `markerFlyout` — needs a corresponding check for `emojiFlyout`. The rail-close-on-outside-click block also needs `&& !emojiActive` (parallel to `&& !markerActive`).

#### 3. `css/main.css` — add emoji flyout styles

```css
/* ---- EMOJI STAMP MODE ---- */
.emoji-flyout {
    top: 120px;          /* below emoji button (marker is at 82px, add one button height ~38px) */
    width: 200px;
    padding: 6px 8px 8px;
}

.emoji-tab-bar {
    display: flex;
    gap: 2px;
    margin-bottom: 6px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
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

/* Stamp cursor in emoji mode */
body.emoji-mode #yp-table .yp-cell {
    cursor: url("data:image/svg+xml,...") 2 18, crosshair;
}

body.emoji-dragging { user-select: none; -webkit-user-select: none; }
```

Use a simple stamp SVG cursor (or just `crosshair` for the MVP if a good data-URI isn't available).

### File change summary

| File | Change |
|------|--------|
| `.compose/fragments/rail.html` | Add `#railEmojiBtn` button; add `#railEmojiFlyout` with tab bar + emoji grids |
| `.compose/fragments/scripts.html` | Add emoji stamp mode block (vars, activate/deactivate, applyEmojiToCell, tab/emoji click handlers, mouse event listeners); add mutual-exclusion calls to existing `activateMarkerMode`/`deactivateMarkerMode`; update outside-click and rail-close guards |
| `css/main.css` | Add `.emoji-flyout`, `.emoji-tab-bar`, `.emoji-tab-btn`, `.emoji-tab-panel`, `.emoji-stamp-btn`, `.emoji-eraser-row`, `body.emoji-mode .yp-cell`, `body.emoji-dragging` |
| `index.html` | Rebuild via `.compose/build.sh` |

### Risks and constraints

- **Rail button position** — The emoji button is added after `#railMarkerBtn`. The `top` offset in `.emoji-flyout` must account for the extra button. Buttons are ~38px each; marker flyout is at 82px (2nd button), so emoji flyout at ~120px (3rd button). Exact offset depends on spacing — verify visually.
- **Mutual exclusion** — The two active-mode vars are in the same IIFE closure. Mutual deactivation calls are straightforward. The existing outside-click and rail-close guards reference `markerActive` — must add `&& !emojiActive` to the rail-close condition.
- **No new E2E tests required** — MOD-10 requires the 14 existing tests to pass without modification; no new stamp-mode E2E tests are in scope. Manual verification of the feature is sufficient.
- **`getEntry` returns tagline (key '1') not the raw day object** — `applyEmojiToCell` should preserve tagline/colour/notes by reading each via their respective getters, exactly as `applyMarkerToCell` does.
- **Build step required** — After editing compose fragments, must run `.compose/build.sh` to regenerate `index.html`.
