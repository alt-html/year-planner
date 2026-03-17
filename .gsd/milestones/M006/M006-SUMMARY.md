---
status: complete
started: 2026-03-16
completed: 2026-03-16
---

# M006 Summary: UI/UX Polish & Finalisation

## Outcome

Closed all remaining visual gaps between the design mockups and the live application. The grid now fills the viewport, all columns align precisely, and a new marker/highlighter mode enables interactive cell colouring.

## What was delivered

### Grid layout
- **Flex-fill grid**: full flexbox chain from body → grid, rows expand to fill viewport when taller than natural grid height, maintain minimum size otherwise
- **December column alignment**: fixed cumulative sub-pixel drift caused by CSS rule ordering — `.yp-cell-bottom` now appears after `.yp-cell-right` so `border:0` wins
- **Removed subscript div and spacer**: grid cleanly fills to footer

### Marker/highlighter mode
- Highlighter button in vertical rail with colour-dot flyout (eraser + 8 colours)
- Click-and-drag to paint grid cells with selected colour
- Pen cursor in marker mode, normal modal click when mode inactive
- Uses same `updateEntry`/storage path as modal colour dots
- Rail, flyout, and marker mode persist through all interactions until explicitly toggled

### Modal cleanup
- Removed fill-week and fill-month buttons (broken, out of context)
- Removed `updateWeekColour` and `updateMonthColour` dead code

### Control positioning (from late M005 iteration)
- Dark mode toggle moved above footer
- Rail toggle resized to 36×36 and repositioned to match

## Key decisions

- **Marker mode lives in plain JS** (scripts.html), not Vue, because the rail is outside the Vue app boundary — accesses Vue instance via `appEl._vnode.component.proxy`
- **`.yp-cell-bottom` must follow `.yp-cell-right` in CSS** to ensure the last row of every column has no bottom border, keeping border budgets equal across all 12 months
- **`markerActive` guard** on both rail-close and flyout-close handlers prevents click events from drag operations from dismissing the UI

## Files changed

- `css/main.css` — flex layout chain, cell flex properties, marker mode CSS, rule reordering
- `.compose/fragments/scripts.html` — marker mode JS (~140 lines)
- `.compose/fragments/rail.html` — marker button and colour flyout
- `.compose/fragments/modals/entry.html` — removed fill-week/fill-month
- `.compose/fragments/grid.html` — removed subscript div and spacer
- `js/vue/methods/entries.js` — removed `updateWeekColour`
- `js/service/Storage.js` — removed `updateMonthColour`
- `index.html` — rebuilt from fragments
