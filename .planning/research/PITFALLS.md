# Pitfalls Research

**Domain:** Bootstrap 4 → 5 migration, CSS generalisation for multi-app reuse
**Researched:** 2026-04-14
**Confidence:** HIGH (verified against official Bootstrap 5.3 migration docs + live codebase audit)

---

## Critical Pitfalls

### Pitfall 1: `no-gutters` Is Silently Ignored — Grid Layout Breaks

**What goes wrong:**
BS5 drops `.no-gutters`. Applying it after upgrading the CDN has zero effect — the class simply does not exist in BS5. Because BS5 adds default gutters to `.row`, every `.row.no-gutters` in the app renders with unwanted horizontal padding/spacing. The year grid (hundreds of `.row.no-gutters` cells in `grid.html`) will visually collapse or misalign.

**Why it happens:**
The class vanishes silently — no console error. Developers see the layout is wrong but may not immediately connect it to a renamed utility. The replacement is `.g-0` (removes both axes) or `.gx-0` (horizontal only).

**How to avoid:**
Global search-replace in all m4 fragments and `site/index.html`:
- `.row.no-gutters` → `.row.g-0`
- Also update `main.css` selectors `#yp-months .row.no-gutters > [class*="col"]` and `#yp-months > .row.no-gutters` to use `.row.g-0`.

**Warning signs:**
Grid cells have visible gaps or the year planner columns misalign. Any flexbox layout that was previously gutter-free suddenly has padding between children.

**Phase to address:** Phase 1 (CDN swap + mechanical renames) — must be done before any visual testing.

---

### Pitfall 2: `data-toggle` / `data-target` / `data-dismiss` Are Silently Ignored

**What goes wrong:**
BS5 namespaces all JavaScript data attributes with `bs-`. The old BS4 attributes (`data-toggle`, `data-target`, `data-dismiss`, `data-placement`, `data-parent`) are not recognised by BS5's JS. Any UI element that relied on them stops working without an error.

**Specific instances in this app:**
- `footer.html` line 8: `data-toggle="dropdown"` on the language picker button
- `footer.html` line 30: `data-toggle="modal" data-target="#featureModal"` (the hidden copyright trigger)
- `nav.html` line 3: `data-toggle="tooltip" data-placement="bottom"` on navbar-brand
- `grid.html` line 58: `data-toggle="tooltip" data-placement="bottom"` on every `.yp-cell-text` span
- `feature.html` lines 6, 23, 24: `data-dismiss="modal"` on close/reset/close buttons (the only modal that uses data-attribute dismiss rather than Vue `v-on:click`)

**Why it happens:**
The HTML is valid and parses without error. The CDN swap from BS4 to BS5 is the only change needed to break these — no typos, no breakage visible in the source. The feature modal close buttons (`data-dismiss="modal"`) will stop working entirely, locking the user in the modal.

**How to avoid:**
Mechanical replacement across all fragments:
- `data-toggle=` → `data-bs-toggle=`
- `data-target=` → `data-bs-target=`
- `data-dismiss=` → `data-bs-dismiss=`
- `data-placement=` → `data-bs-placement=`
- `data-parent=` → `data-bs-parent=`

**Warning signs:**
- Language dropdown does not open
- Feature modal cannot be closed (only escape key works if keyboard is enabled)
- Tooltips never appear

**Phase to address:** Phase 1 (mechanical rename pass) — critical, blocks all BS5 JS functionality.

---

### Pitfall 3: Tooltips Require Manual Initialization in BS5

**What goes wrong:**
Even after fixing `data-toggle` → `data-bs-toggle`, tooltips still do not work. BS5 removed auto-initialization for tooltips (opt-in for performance). You must call `new bootstrap.Tooltip(el)` for every element. Currently the app has tooltip markup on `navbar-brand` and every `.yp-cell-text` span (potentially hundreds of elements in the grid).

**Why it happens:**
BS4 auto-initialized all `[data-toggle="tooltip"]` elements on page load via jQuery. BS5 does not. No error is thrown — tooltips simply never appear.

**How to avoid:**
After the CDN swap, add initialization code. Because the grid cells are rendered by Vue reactively, initialize tooltips in Vue's `mounted()` / `updated()` lifecycle hooks, or use a Vue directive wrapper. Do not use a plain `document.querySelectorAll` at DOMContentLoaded — the grid cells may not exist yet.

For the navbar-brand tooltip (static element): a one-time init in `mounted()` is sufficient.
For the grid cell tooltips: consider whether tooltips on hundreds of grid cells are worth keeping; the app already shows the text inline in the cell. Removing them may be simpler than managing reactive re-init.

**Warning signs:**
Hovering over cell text or navbar-brand shows nothing. No JS errors.

**Phase to address:** Phase 2 (JS component migration) — after Phase 1 renames.

---

### Pitfall 4: `.close` Class Is Removed — Close Buttons Disappear or Misrender

**What goes wrong:**
BS4's `.close` utility class (which styled the `×` dismiss button) is removed in BS5. The replacement is `<button class="btn-close" ...>` with no child `<span>`. Using the old pattern produces an unstyled, oversized button with a visible `×` character.

**Specific instances in this app:**
- `modals/auth.html` lines 7, 14: two `.close` buttons inside auth modal
- `modals/delete.html` line 7: `.close` in delete modal
- `modals/feature.html` line 6: `.close` in feature modal
- `modals/share.html` line 7: `.close` in share modal
- `grid.html` line 6: `.close` button inside the jumbotron error alert
- `yp-dark.css` line 91: `.yp-dark .close { color: ... }` — dead override after migration

**How to avoid:**
Replace `.close` buttons:

Before (BS4):
```html
<button type="button" class="close" aria-label="Close">
  <span aria-hidden="true">&times;</span>
</button>
```

After (BS5):
```html
<button type="button" class="btn-close" aria-label="Close"></button>
```

Update `yp-dark.css` to target `.yp-dark .btn-close` instead of `.yp-dark .close`. Dark mode close button color in BS5 uses `.btn-close-white` class or CSS override of `filter` on the pseudo-element.

**Warning signs:**
Modal close buttons render as large, unstyled text buttons with the literal `×` character visible. Dark mode override in `yp-dark.css` has no effect.

**Phase to address:** Phase 1 (mechanical renames) — straightforward substitution in each modal fragment.

---

### Pitfall 5: `.jumbotron` Is Removed — Layout Breaks for the Entire Grid Wrapper

**What goes wrong:**
The year planner uses `.jumbotron` as the **primary layout wrapper** for the entire grid area (`grid.html` line 2). `main.css` has custom styles for `.jumbotron` (lines 649, 661, 676) including `flex: 1 1 auto`, `display: flex`, and `min-height: 0`. When BS5 is loaded, BS5 does not recognise `.jumbotron` at all — the browser falls back to defaults, which does not include the flex layout the custom CSS expects. The grid still renders because `main.css` applies `.jumbotron` styles, but the BS5 reboot changes box-model defaults enough that spacing and overflow behaviour may shift.

**Why it happens:**
The `.jumbotron` class does nothing in BS5. The custom CSS in `main.css` still applies, so the layout mostly holds — but any interaction between BS5 reboot defaults and the jumbotron element (padding, margin, background) may differ unexpectedly.

**How to avoid:**
Replace the `.jumbotron` element with a plain `<div>` and a new app-specific class (e.g., `yp-grid-wrapper`). Update `main.css` selectors that target `.jumbotron` to target `yp-grid-wrapper`. Also update the `rail-open .jumbotron` margin-left rule.

**Warning signs:**
Grid area has unexpected top/bottom padding. The `rail-open` margin transition does not apply to the grid wrapper.

**Phase to address:** Phase 1 (mechanical renames) — the element rename is low-risk but must not be skipped.

---

### Pitfall 6: Spacing Utilities (`ml-*`, `mr-*`, `pl-*`, `pr-*`) Are Renamed

**What goes wrong:**
BS5 renames all directional spacing utilities to use logical properties (`start`/`end` instead of `left`/`right`) for RTL support. Old classes are silently ignored.

**Specific instances in this app:**
- `rail.html` line 51: `mr-auto` → `me-auto`
- `rail.html` line 52: `ml-2` → `ms-2`
- `rail.html` lines 53–54: `ml-1` → `ms-1` (×2)
- `rail.html` line 56: `pl-3` → `ps-3`
- `modals/auth.html`: `me-2` already used in the auth buttons (these are already BS5-ready from a previous edit — verify these are actually `me-2` not `mr-2`)

**Also renamed (verify across codebase):**
- `text-left` → `text-start` (footer `text-left` on line 6, `text-right` on line 30)
- `float-left` / `float-right` → `float-start` / `float-end`

**How to avoid:**
Sed-replaceable in the fragments. Create a checklist:
| BS4 | BS5 |
|-----|-----|
| `ml-{n}` | `ms-{n}` |
| `mr-{n}` | `me-{n}` |
| `pl-{n}` | `ps-{n}` |
| `pr-{n}` | `pe-{n}` |
| `mr-auto` | `me-auto` |
| `ml-auto` | `ms-auto` |
| `text-left` | `text-start` |
| `text-right` | `text-end` |
| `float-left` | `float-start` |
| `float-right` | `float-end` |

**Warning signs:**
Elements intended to be right-aligned (e.g., year in planner item row) are left-aligned. The footer copyright text left-aligns incorrectly.

**Phase to address:** Phase 1 (mechanical renames).

---

### Pitfall 7: `btn-block` Is Removed — Auth Modal Buttons Lose Full-Width Layout

**What goes wrong:**
BS5 removes `.btn-block`. The auth modal (`modals/auth.html` lines 19, 22, 25) uses `btn btn-outline-dark btn-block` on all three sign-in buttons. Without `btn-block`, the buttons shrink to content width and stack awkwardly.

**How to avoid:**
Wrap buttons in `<div class="d-grid gap-2">` and remove `btn-block`:

Before:
```html
<button class="btn btn-outline-dark btn-block mb-2" ...>Sign in with Google</button>
```

After:
```html
<div class="d-grid gap-2">
  <button class="btn btn-outline-dark" ...>Sign in with Google</button>
  <button class="btn btn-outline-dark" ...>Sign in with Apple</button>
  <button class="btn btn-outline-dark" ...>Sign in with Microsoft</button>
</div>
```

Note: `auth.html` already has `<div class="d-grid gap-2">` wrapping the buttons (line 16 in the modal body), so the `d-grid` wrapper may already be present from a partial migration. Verify and remove only `btn-block` and the now-redundant `mb-2` between buttons (gap-2 handles spacing).

**Warning signs:**
Auth sign-in buttons are narrow, left-aligned, and don't fill the modal width.

**Phase to address:** Phase 1 (mechanical renames).

---

### Pitfall 8: `.form-group` and `.form-inline` Are Removed

**What goes wrong:**
BS5 drops `.form-group` (use grid utilities or margins instead) and `.form-inline` (use flexbox utilities instead).

**Specific instances in this app:**
- `modals/share.html` line 13: `<div class="form-group">` wrapping the share URL input
- `nav.html` line 5: `<form id="rename" class="form-inline">` wrapping the rename input

**How to avoid:**
- Replace `<div class="form-group">` with `<div class="mb-3">` or plain `<div>` with appropriate margin.
- Replace `class="form-inline"` with `class="d-flex flex-row flex-wrap align-items-center gap-2"`.

**Warning signs:**
The rename form in the navbar loses its inline layout (inputs stack vertically). The share modal URL input group loses its bottom margin.

**Phase to address:** Phase 1 (mechanical renames).

---

### Pitfall 9: `sr-only` Renamed to `visually-hidden`

**What goes wrong:**
BS5 renames `.sr-only` to `.visually-hidden`. The old class has no effect in BS5 — the spinner loading text (`spinner.html` line 3) becomes visible to sighted users.

**How to avoid:**
- `spinner.html`: `class="sr-only"` → `class="visually-hidden"`

**Warning signs:**
The word "Loading" is visible next to the spinner indicator.

**Phase to address:** Phase 1 (mechanical renames).

---

### Pitfall 10: CDN URL and `shrink-to-fit` Viewport Meta Tag

**What goes wrong:**
Two issues in `head.html`:
1. The CDN URL points to `stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css` — this must change to the BS5 CDN URL on jsdelivr (consistent with all other CDN dependencies in this app).
2. `shrink-to-fit=no` in the viewport meta tag was a Safari-only workaround that is no longer needed and is not recommended in HTML5.

**How to avoid:**
Replace in `head.html`:
```html
<!-- Remove: -->
<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">

<!-- Add: -->
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" integrity="sha384-[hash]" crossorigin="anonymous">
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-[hash]" crossorigin="anonymous"></script>
```

Note: `bootstrap.bundle.min.js` includes Popper — required for dropdowns and tooltips. Fetch the current SRI hash from the Bootstrap 5.3 docs at install time.

**Warning signs:**
App loads BS4 and BS5 simultaneously (if both link tags are present), causing class conflicts.

**Phase to address:** Phase 1 — the very first change; all others depend on it being correct.

---

### Pitfall 11: BS5 Reboot Makes All Links Underlined by Default

**What goes wrong:**
BS4 only underlines links on hover. BS5 underlines all `<a>` elements by default (text-decoration: underline in the reboot). The app has many links that must not be underlined: navbar-brand, dropdown items, rail flyout items, footer links, planner item links. These are currently styled without underlines but depend on BS4's reboot not setting underline.

**Why it happens:**
BS5 follows WebAIM accessibility guidelines (underlined links are more accessible). Custom CSS does not account for this baseline change.

**How to avoid:**
After the CDN swap, audit all `<a>` elements for unexpected underlines. Add `text-decoration: none` to any link component that should not be underlined. The existing custom CSS for `.rail-flyout-item`, `.navbar-brand`, `.dropdown a` etc. already sets `text-decoration: none` explicitly — verify these are still applied after the reboot changes. Check footer links and planner item links in particular.

**Warning signs:**
Links in the rail flyout, navbar, and footer appear with underlines they didn't have before the migration.

**Phase to address:** Phase 2 (visual audit and CSS adjustments).

---

### Pitfall 12: Custom CSS Selectors Targeting BS Component Classes May Break or Conflict

**What goes wrong:**
`main.css` and `yp-dark.css` contain selectors that target Bootstrap internal classes (`.dropdown-menu`, `.dropdown-item`, `.dropdown-divider`, `.modal-header`, `.modal-content`, `.form-control`, `.navbar`, `.btn-secondary`, `.nav-link`, etc.). BS5 changes the CSS custom property structure and some base styles for these components. The custom overrides may conflict, produce double-applied styles, or lose specificity.

**Specific risk areas:**
- `yp-dark.css` extensively overrides `.dropdown-*`, `.modal-*`, `.btn`, `.close`, `.nav-link`
- `main.css` overrides `.container` max-width at all breakpoints (sets 2600px), `.navbar`, `.dropdown-menu`, `.btn-secondary`
- BS5 components increasingly use CSS custom properties (`--bs-*`). Some overrides may need to be updated to set `--bs-` variables rather than overriding compiled properties

**How to avoid:**
- After CDN swap, visually test every component that has custom overrides (dropdown, modal, navbar, buttons)
- Prefer setting `--bs-*` component variables where available rather than overriding compiled CSS
- The `.container` max-width override is safe (utility breakpoint overrides still work the same way)
- The `.yp-dark .close` rule in `yp-dark.css` must be updated to `.yp-dark .btn-close`; the close button now uses a CSS `filter: invert()` pattern rather than a color property — add `.yp-dark .btn-close { filter: invert(1) grayscale(100%) brightness(200%); }` or use `.btn-close-white` class

**Warning signs:**
Dark mode close buttons appear as dark icons on dark backgrounds (invisible). Dropdown text colour reverts to default in dark mode.

**Phase to address:** Phase 2 (visual audit + dark mode validation).

---

### Pitfall 13: The Feature Modal Still Uses Legacy BS4 JS (data-dismiss with no BS5 JS)

**What goes wrong:**
The feature modal (`modals/feature.html`) is the **only** modal that uses `data-dismiss="modal"` for its close buttons — it does not use Vue `v-on:click` handlers. All other modals use Vue to control their `v-if`/`v-show` visibility and call close functions directly. The feature modal is shown via a hidden `data-toggle="modal" data-target="#featureModal"` span in the footer (copyright area).

After the CDN swap to BS5, with the data attribute rename to `data-bs-dismiss`, the feature modal will still require BS5 JS to be loaded in order to function — which is now required anyway. This is the one modal whose lifecycle is not Vue-controlled. Decide in Phase 1 whether to:
- Migrate it to Vue-controlled visibility (consistent with all other modals)
- Or leave it as pure BS5 JS (accept the BS5 JS dependency)

**How to avoid:**
Recommended approach: convert the feature modal to Vue-controlled visibility, consistent with the other 5 modals. This removes the last dependency on BS JS for modal management. If kept as-is, ensure `data-bs-toggle`, `data-bs-target`, and `data-bs-dismiss` are updated.

**Warning signs:**
Feature modal opens (the copyright span trigger works) but the close/reset buttons do nothing.

**Phase to address:** Phase 1 — must be decided before the data attribute rename pass.

---

### Pitfall 14: CSS Variable Name Collision Between App and BS5 (`--bs-*` vs `--` app vars)

**What goes wrong:**
The app's custom CSS uses unprefixed custom properties (`--bg`, `--surface`, `--text`, `--accent`, `--border`, `--rail-bg`, `--c2`–`--c8`, etc.). BS5 uses `--bs-*` prefixed properties. There is no name collision in this case — the namespacing is clean. However:

1. If sibling apps introduce additional Bootstrap overrides by setting `--bs-body-color`, `--bs-body-bg`, etc., those will override BS5 defaults but may conflict with the app's own `var(--bg)` / `var(--text)` approach if the two systems are mixed.
2. When generalising `yp-*` CSS for multi-app reuse, the app-level tokens (`--bg`, `--text`, etc.) are too generic — other apps may define the same names with different values.

**How to avoid:**
When generalising CSS for reuse, prefix all custom properties with the app or system namespace (e.g., `--yp-bg`, `--yp-text`, `--yp-accent`). Do not use bare semantic names like `--text` or `--bg` in shared CSS — they are effectively global and will collide in a multi-app context.

**Warning signs:**
Sibling app's `--bg` or `--text` definition bleeds into the year planner when stylesheets are shared or co-loaded.

**Phase to address:** Phase dedicated to CSS generalisation — do not mix with the BS4→5 rename pass.

---

### Pitfall 15: Generalising `yp-*` CSS — Coupling to BS4 Structural Classes

**What goes wrong:**
Many `yp-*` CSS rules are scoped relative to Bootstrap structural classes: `.jumbotron`, `.row.no-gutters`, `.container`, `.col`, `.modal-*`, `.dropdown-*`. If those structural classes are renamed or replaced during the BS5 migration, the generalised CSS will also need updating. Doing generalisation and migration simultaneously compounds the risk.

**How to avoid:**
Run the BS4→BS5 rename pass first and verify visually. Only then start the generalisation pass. This prevents double-debugging "is this a migration bug or a generalisation bug?"

Specifically:
- `main.css` selector `#yp-months .row.no-gutters > [class*="col"]` must be updated to `.row.g-0` before or during migration
- `main.css` selector `.rail-open .jumbotron` depends on the jumbotron rename
- Any generalised component that wraps `modal-*` classes inherits BS5 modal structure

**Warning signs:**
Visual regression is present after the generalisation pass even when it was absent after the migration pass.

**Phase to address:** Keep as a separate phase from the BS4→5 migration.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Keep `.jumbotron` class but add BS5 custom CSS to re-define it | Avoids renaming the element | `.jumbotron` has no semantic meaning in BS5, causes reader confusion in fragments, and requires adding CSS that mimics BS4 behaviour | Never — rename the element |
| Keep `data-toggle` and add a JS polyfill shim | Avoids finding all instances | Shim must be maintained across BS5 updates; two attribute systems coexist | Never in a CDN-only app |
| Use both BS4 and BS5 CDN simultaneously during transition | "Gradual migration" | Class conflicts, doubled CSS weight, unpredictable specificity battles | Never |
| Leave tooltips broken during migration | Ship faster | Tooltips on cell text are the primary content-preview mechanism; broken tooltips degrade UX | Never for release; acceptable in migration branch testing |
| Keep `yp-*` as-is during BS5 migration, generalise later | Reduces scope per phase | Correct approach — this is the recommended strategy | Always |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| BS5 JS + CDN (no bundler) | Loading BS CSS without BS JS bundle; dropdowns and modals silently fail | Load `bootstrap.bundle.min.js` (includes Popper) from jsdelivr; place before `main.js` module |
| BS5 JS + Vue 3 | Initializing BS tooltip/modal instances at DOMContentLoaded before Vue has rendered the grid | Initialize in Vue `mounted()` / `updated()` hooks or use a Vue directive; never at raw `DOMContentLoaded` for dynamically rendered elements |
| BS5 dropdowns + SRI hash | CDN URL copied without verifying the SRI hash for the chosen version | Always fetch the official hash from https://getbootstrap.com/docs/5.3/getting-started/download/ for the exact version being used |
| m4 build + BS5 | Updating `site/index.html` directly without updating the corresponding fragment | All edits must be made in `.compose/fragments/` and rebuilt via `.compose/build.sh`; `site/index.html` is the assembled output |
| Dark mode CSS + BS5 btn-close | `.yp-dark .close { color: ... }` has no effect on BS5 `btn-close` | BS5 close button uses an SVG background-image with CSS `filter`. Use `.btn-close-white` class or override `filter` property |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Tooltip init on all grid cells on every Vue update | Page freezes or lags during year render | Initialize tooltips once after mount; use `dispose()` + reinit on updates selectively, or abandon tooltips for an always-visible approach | Immediately on any year with full content |
| Loading BS5 JS synchronously before Vue | Vue mount delayed; FOUC on grid | Load BS5 JS `defer` or after the `<script type="module">` for Vue | Pages with slow CDN response |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| BS5 link underlines on rail flyout items | Navigation links appear as underlined text links, degrading the visual design | Ensure `.rail-flyout-item { text-decoration: none }` survives the reboot; add to base reset if needed |
| Feature modal stuck open (data-dismiss broken) | User cannot close the feature toggle modal without pressing Escape | Fix data attribute rename in Phase 1 — do not ship without this |
| Tooltip reinit gap after Vue reactivity update | Tooltip shows stale title text after an entry is saved | Reinitialize or update tooltip instance after `nextTick()` in the save handler |

---

## "Looks Done But Isn't" Checklist

- [ ] **CDN swap:** Both CSS and JS (bundle) links updated in `head.html` — not just CSS. Verify SRI hash.
- [ ] **No-gutters rename:** Check `main.css` CSS selectors (lines 701, 712) updated to `.g-0` — not just HTML classes.
- [ ] **Tooltip init:** Grid cell tooltips actually appear on hover after BS5 JS is loaded — not just that the attribute was renamed.
- [ ] **Dark mode close buttons:** `.btn-close` is visible on dark backgrounds in dark mode — not just that the class was renamed.
- [ ] **Feature modal:** All three buttons (×, Reset, Close) dismiss the modal — not just that `data-bs-dismiss` was added.
- [ ] **Language dropdown:** Clicking the language button opens the dropdown — confirming `data-bs-toggle="dropdown"` is wired and JS is loaded.
- [ ] **Form-inline rename:** The rename form in the navbar lays out horizontally — not just that `form-inline` was replaced with flexbox utilities.
- [ ] **Rail flyout item underlines:** None of the flyout navigation links are underlined.
- [ ] **m4 rebuild:** `site/index.html` was regenerated via `.compose/build.sh` after fragment edits — not just the fragments edited in isolation.
- [ ] **`site/index.html` in sync with fragments:** The built output matches fragment content (especially for the Playwright E2E tests which run against `site/index.html`).

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Both BS4 + BS5 loaded simultaneously | HIGH | Remove one CDN link; verify no double class definitions; re-run E2E tests |
| data-dismiss not updated, feature modal stuck | LOW | Update `feature.html`, rebuild, deploy |
| Tooltip init missing, no tooltips | LOW | Add init in Vue `mounted()`, rebuild |
| Grid layout broken (no-gutters) | MEDIUM | Update all `.row.no-gutters` in `grid.html` (many occurrences), update `main.css` selectors, rebuild |
| CSS variable collision in multi-app reuse | HIGH | Rename all bare `--text`, `--bg` etc. to `--yp-*` in all three CSS files and all Vue bindings that reference them |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| CDN URL + BS5 JS bundle (P10) | Phase 1: CDN Swap | Page loads, no 404 in network tab, `bootstrap` global exists in console |
| `no-gutters` → `g-0` (P1) | Phase 1: Mechanical Renames | Year grid renders without gaps between columns |
| `data-toggle/target/dismiss` → `data-bs-*` (P2) | Phase 1: Mechanical Renames | Language dropdown opens; feature modal closes |
| `.close` → `.btn-close` (P4) | Phase 1: Mechanical Renames | Modal close buttons render correctly in light and dark mode |
| `.jumbotron` rename (P5) | Phase 1: Mechanical Renames | Grid wrapper fills viewport; rail-open margin transition works |
| Spacing utilities `ml/mr/pl/pr` (P6) | Phase 1: Mechanical Renames | Planner items in flyout have correct spacing layout |
| `btn-block` removal (P7) | Phase 1: Mechanical Renames | Auth modal sign-in buttons are full-width |
| `form-group` / `form-inline` (P8) | Phase 1: Mechanical Renames | Rename form is inline; share URL input has bottom spacing |
| `sr-only` → `visually-hidden` (P9) | Phase 1: Mechanical Renames | "Loading" text invisible to sighted users in spinner |
| Tooltip manual init (P3) | Phase 2: JS Components | Hovering `.yp-cell-text` shows tooltip with entry preview |
| Link underlines from BS5 reboot (P11) | Phase 2: Visual Audit | No unexpected underlines on rail, navbar, or footer links |
| Dark mode CSS conflicts (P12) | Phase 2: Visual Audit | Dropdown, modal, buttons correct in dark mode (both themes) |
| Feature modal Vue migration (P13) | Phase 1 or 2 | Feature modal open/close works correctly |
| CSS variable naming for reuse (P14) | CSS Generalisation phase | Sibling app test: co-loading CSS does not bleed `--bg`/`--text` |
| CSS generalisation sequencing (P15) | Roadmap structure | Migration E2E tests pass before generalisation begins |

---

## Sources

- [Migrating to v5 — Bootstrap v5.3 official docs](https://getbootstrap.com/docs/5.3/migration/) — HIGH confidence
- [Tooltips — Bootstrap v5.3](https://getbootstrap.com/docs/5.3/components/tooltips/) — HIGH confidence
- [JavaScript — Bootstrap v5.3](https://getbootstrap.com/docs/5.3/getting-started/javascript/) — HIGH confidence
- [CSS Variables — Bootstrap v5.3](https://getbootstrap.com/docs/5.3/customize/css-variables/) — HIGH confidence
- [Bootstrap 5 migrate tool (coliff)](https://github.com/coliff/bootstrap-5-migrate-tool) — MEDIUM confidence (community tool, useful for mechanical rename validation)
- Live codebase audit of `site/index.html`, `.compose/fragments/`, `site/css/main.css`, `site/css/yp-dark.css` — HIGH confidence

---
*Pitfalls research for: Bootstrap 4 → 5 migration + CSS generalisation, Year Planner v1.4*
*Researched: 2026-04-14*
