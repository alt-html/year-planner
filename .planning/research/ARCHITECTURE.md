# Architecture Research

**Domain:** Bootstrap 5 migration + CSS generalisation for a fragment-assembled vanilla PWA
**Researched:** 2026-04-14
**Confidence:** HIGH — all findings verified against live source files and official Bootstrap 5 migration docs

## System Overview

The build pipeline is a single-step m4 macro expansion. There is no bundler, no npm step, and no intermediate artefact other than `site/index.html`.

```
.compose/index.html.m4
    m4_include(.compose/fragments/head.html)        ← CDN links, BS CSS
    m4_include(.compose/fragments/rail.html)        ← Vue-bound icon rail + flyouts
    m4_include(.compose/fragments/spinner.html)     ← BS spinner
    m4_include(.compose/fragments/nav.html)         ← BS navbar
    m4_include(.compose/fragments/grid.html)        ← jumbotron + yp-* grid
    m4_include(.compose/fragments/modals.html)      ← stub, includes 5 modal fragments
        m4_include(.compose/fragments/modals/entry.html)
        m4_include(.compose/fragments/modals/share.html)
        m4_include(.compose/fragments/modals/delete.html)
        m4_include(.compose/fragments/modals/auth.html)
        m4_include(.compose/fragments/modals/feature.html)
    m4_include(.compose/fragments/footer.html)      ← BS dropdown (language picker)
    m4_include(.compose/fragments/scripts.html)     ← early theme script + main.js
          │
          ▼
    .compose/build.sh (m4 -P)
          │
          ▼
    site/index.html  ← committed output; served directly
```

CSS is loaded from `site/css/` as static files (no build step). The two relevant files are:

- `site/css/main.css` — all custom styles: theme tokens, yp-* grid cells, rail, entry modal, dots, flyouts
- `site/css/yp-dark.css` — dark mode overrides on top of BS component selectors

## Component Responsibilities

| Fragment | BS4 Surface Used | yp-* Classes Used | Vue-bound? |
|----------|------------------|-------------------|------------|
| `head.html` | `<link>` to BS4 CDN | none | no |
| `rail.html` | none (fully custom) | `.yp-rail`, `.yp-rail-*`, `.rail-flyout*`, `.yp-dot-c*`, `.marker-*`, `.emoji-*` | yes — all |
| `spinner.html` | `.spinner-border`, `.sr-only` | none | yes (v-bind:class d-none) |
| `nav.html` | `.navbar`, `.navbar-brand`, `.navbar-expand`, `.sticky-top`, `.form-inline`, `.input-group`, `.input-group-append`, `.collapse.navbar-collapse`, `data-toggle="tooltip"` | `.yp-nav-year`, `.yp-nav-year-btn`, `.yp-anchor` | yes |
| `grid.html` | `.jumbotron`, `.container`, `.row.no-gutters`, `.col-*`, `.d-none/d-block/d-sm-*/d-*` | `.yp-table`, `.yp-weekdays`, `.yp-months`, `.yp-cell*`, `.yp-header-cell*`, `.yp-anchor`, `.yp-cell-text`, `.yp-cell-c*` | yes |
| `modals/entry.html` | `.modal`, `.modal-dialog`, `.modal-content`, `.modal-dialog-centered` | `.yp-entry-modal`, `.yp-entry-date`, `.yp-entry-text`, `.yp-entry-notes`, `.yp-entry-tools`, `.yp-colour-dots`, `.yp-dot*`, `.yp-entry-actions`, `.yp-action-dismiss`, `.yp-action-save`, `.yp-entry-field-label`, `.yp-entry-close` | yes |
| `modals/share.html` | `.modal`, `.modal-header`, `.modal-body`, `.modal-footer`, `.close`, `.form-group`, `.form-control`, `.col-form-label`, `.btn-secondary`, `.btn-primary` | none | yes |
| `modals/delete.html` | same modal structure + `.close`, `.btn-*` | none | yes |
| `modals/auth.html` | `.modal`, `.close`, `.d-grid.gap-2`, `.btn-outline-dark.btn-block`, `.modal-footer` | none | yes |
| `modals/feature.html` | `.modal`, `.close`, `data-dismiss="modal"`, `.form-check`, `.form-check-input`, `.form-check-label`, `.btn-primary` | none | partial |
| `footer.html` | `.footer.fixed-bottom`, `.container`, `.row`, `.col-2/col-10`, `.dropup.show`, `.btn-secondary.btn-sm.dropdown-toggle`, `.dropdown-menu`, `.dropdown-item`, `.text-muted`, `.text-left/.text-right`, `.d-none.d-sm-inline` | none | yes |

## BS4 → BS5 Breaking Changes That Touch These Files

This is the full surface that needs migration. Organised by file.

### head.html

- Replace `https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css` with the BS5 CDN link (current latest: `https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css`). No JS bundle needed — BS5 JS is Popper-only and not imported here; all interactivity is Vue-driven.
- Remove the `shrink-to-fit=no` viewport hint (no effect in modern browsers, but BS5 docs omit it).

### nav.html

| BS4 | BS5 replacement | Fragment location |
|-----|-----------------|-------------------|
| `data-toggle="tooltip"` | `data-bs-toggle="tooltip"` | `.navbar-brand` title attribute |
| `.form-inline` | removed — use flex/grid utilities | `#rename` form |
| `.input-group-append` | removed — put children directly inside `.input-group` | save button wrapper |
| `data-toggle="dropdown"` (if present) | `data-bs-toggle="dropdown"` | footer dropdown (not nav) |

Note: navbar tooltip on `.navbar-brand` uses BS JS to initialise — currently this is a passive attribute with no initialiser call in the codebase. Tooltips are non-functional in the live app. Migration can leave them as-is or wire BS5 tooltip init; either choice is safe.

### grid.html

| BS4 | BS5 replacement |
|-----|-----------------|
| `.jumbotron` | removed in BS5; replace wrapper `div.jumbotron` with plain `div` or `section`; all custom styles for `.jumbotron` in `main.css` survive as-is because they are project-owned |
| `.row.no-gutters` | `.row.g-0` |
| `.d-sm-none`, `.d-md-none` etc | unchanged — BS5 keeps all responsive display utilities |
| `.col-xs-12` | `.col-12` (xs tier dropped; `col-` without breakpoint is the mobile-first default) |

The grid in `grid.html` has extremely dense repeated markup (one responsive `#yp-weekdays` block repeated ~12 times for each breakpoint). This is not a BS migration concern but is a strong candidate for refactoring with a single block and CSS-only responsive rules. That is a separate task and should not block the migration.

### spinner.html

| BS4 | BS5 replacement |
|-----|-----------------|
| `.sr-only` | `.visually-hidden` |

### modals/share.html, delete.html

| BS4 | BS5 replacement |
|-----|-----------------|
| `.close` button | `.btn-close` element (BS5 provides a CSS-only × glyph; no `<span aria-hidden="true">&times;</span>` needed) |
| `data-dismiss="modal"` | remove (modals are Vue-controlled; close triggers call Vue methods) |
| `.form-group` | removed; wrap label+input in `.mb-3` or a plain `div` |

### modals/auth.html

| BS4 | BS5 replacement |
|-----|-----------------|
| `.close` | `.btn-close` |
| `.btn-outline-dark.btn-block` | `.btn-block` removed; use `.d-grid` wrapper already present via `.d-grid.gap-2` (this auth modal already has the BS5 idiom — just remove `.btn-block`) |

### modals/feature.html

| BS4 | BS5 replacement |
|-----|-----------------|
| `.close` | `.btn-close` |
| `data-dismiss="modal"` | `data-bs-dismiss="modal"` OR remove if modal is wired to Vue (feature modal currently uses `data-dismiss` directly — the one fragment still using BS JS dismiss) |

### footer.html

| BS4 | BS5 replacement |
|-----|-----------------|
| `.dropup.show` | `.dropup` (show class is managed by BS JS; since we have no BS JS bundle, remove `.show` or drive via Vue) |
| `.text-left` / `.text-right` | `.text-start` / `.text-end` |
| `aria-labelledby="dropdownMenuLink"` | update to match actual toggle id |
| `data-toggle="dropdown"` | `data-bs-toggle="dropdown"` |

The footer language dropdown currently uses `data-toggle="dropdown"` and `.dropup.show`. Without Bootstrap JS this is a static element. After BS5 migration it remains inert unless BS JS is added or the dropdown is converted to Vue-driven (recommended — consistent with rail pattern).

### yp-dark.css

The dark mode file overrides BS component selectors that exist in both BS4 and BS5 with identical class names (`.dropdown-menu`, `.form-control`, `.modal-content`, `.btn-secondary`, etc.). No class name changes are needed here. The file survives the migration unchanged.

However: `.close` in `yp-dark.css` (line 92) overrides the BS4 close button. After migration to `.btn-close` this rule becomes inoperative. Add a parallel `.btn-close` rule or consolidate.

## CSS Generalisation Architecture

### What "generalisation" means here

The goal is: extract `yp-*` classes and patterns that are app-agnostic enough to be reused in sibling apps, while keeping year-planner-specific classes scoped to year-planner.

The classification is:

**Extractable (app-agnostic):**
- Icon rail chrome: `.yp-rail`, `.yp-rail-logo`, `.yp-rail-bottom`, `.yp-rail-spacer`, `.yp-rail-divider`, `.yp-rail button` variants — these are a UI shell pattern, not planner-specific
- Rail flyout shell: `.rail-flyout`, `.rail-flyout-item`, `.rail-flyout-divider`, `.rail-flyout-input`, `.rail-flyout-header`, `.rail-flyout-item-active`, `.rail-planner-section`
- Rail toggle circle: `.rail-toggle` and `.rail-open` body-class shift rules
- Theme token system: `:root`/`[data-theme]` CSS custom property blocks (the variable names are semantic and reusable)
- Dot colour swatches: `.yp-dot`, `.yp-dot-c1` through `.yp-dot-c8`, `.yp-dot-clear` — these map to `--c1`..`--c8` variables
- Dark mode token overrides: the custom property blocks in `yp-dark.css`

**Year-planner-specific (do not extract):**
- `.yp-cell*` family — the grid layout is entirely planner-specific
- `.yp-header-cell*` — ditto
- `.yp-entry-*` — the entry modal is planner data-specific
- `.yp-anchor`, `.yp-nav-year*` — planner navigation concepts
- `#yp-table`, `#yp-weekdays`, `#yp-months` — planner DOM IDs

**Boundary rule:** Extract a class when its implementation references only CSS custom properties (the token system) and no planner-domain knowledge. Keep it when it encodes calendar, entry, or planner layout.

### Recommended file structure after generalisation

```
site/css/
├── design-tokens.css      NEW — all :root and [data-theme] token blocks
├── rail.css               NEW — .yp-rail*, .rail-flyout*, .rail-toggle, .rail-open shifts
├── dots.css               NEW — .yp-dot, .yp-dot-c1..c8, .yp-dot-clear
├── main.css               MODIFIED — imports tokens; keeps planner-specific rules only
│                                   (yp-cell*, yp-entry*, jumbotron overrides, grid, footer, navbar)
├── yp-dark.css            MODIFIED — add .btn-close rule; token overrides survive as-is
├── typeaheadjs.css        UNCHANGED
└── sqpaymentform.css      UNCHANGED (dead, but leave it)
```

Sibling apps then link `design-tokens.css` + `rail.css` + their own app stylesheet. They do not link `main.css`.

### Why not a single shared CSS file?

A monolithic shared file couples sibling apps to planner-specific grid rules via specificity conflicts. Three small files (tokens, rail, dots) are independently linkable with zero bleed.

### CSS custom property token naming

The current tokens (`--bg`, `--surface`, `--text`, `--accent`, `--rail-bg`, `--c2`..`--c8`) are already abstract enough for sibling apps. No renaming needed. The only change is moving the block from `main.css` into `design-tokens.css`.

## Migration Strategy: Incremental by Fragment, Not Big-Bang

Big-bang is wrong here because `site/index.html` is a single committed file assembled from 13 fragment sources. A single bad attribute rename can silently break modal dismiss or tooltip behaviour with no build-time error. Incremental by fragment means each fragment change is independently testable.

Recommended order:

```
Step 1: head.html
    Update CDN URL from BS4 to BS5.
    Verify: all existing styles still render (no class renames yet — BS5 ships a
    compatibility shim for common renames in v5.0-5.2; v5.3 dropped it).
    Test: visual smoke test, Playwright suite.

Step 2: spinner.html
    .sr-only → .visually-hidden
    One word change; lowest risk.
    Test: spinner visible during load, Playwright.

Step 3: modals/feature.html
    .close → .btn-close, data-dismiss → data-bs-dismiss.
    Isolated fragment; feature modal has no Playwright coverage.
    Test: manual — open via footer CC icon.

Step 4: modals/share.html + modals/delete.html
    .close → .btn-close (remove inner <span>).
    .form-group → plain div.mb-3.
    data-dismiss removed (Vue-controlled already).
    Test: Playwright share + delete flows.

Step 5: modals/auth.html
    .close → .btn-close.
    .btn-block removed (d-grid.gap-2 already present — just drop btn-block).
    Test: Playwright auth flow.

Step 6: nav.html
    .form-inline → plain div with flex utilities.
    .input-group-append removed — put save button as direct .input-group child.
    data-toggle tooltip → data-bs-toggle (or remove — tooltips non-functional).
    Test: rename planner flow, Playwright.

Step 7: grid.html
    .jumbotron → plain div (add id="jumbotron" to preserve main.css targeting, OR
    rename .jumbotron selector in main.css to #grid-wrapper — latter is cleaner).
    .row.no-gutters → .row.g-0 (global search-replace in this file only).
    .col-xs-12 → .col-12.
    Test: full Playwright suite — grid rendering is the core feature.

Step 8: footer.html
    .text-left/.text-right → .text-start/.text-end.
    .dropup.show → .dropup (convert to Vue-driven open state or add BS5 JS bundle
    for dropdown only — Vue-driven is consistent with v1.3 architecture).
    data-toggle → data-bs-toggle.
    Test: language picker works, Playwright.

Step 9: yp-dark.css
    Add .btn-close rule alongside .close rule.
    No other changes needed.
    Test: dark mode visual check.

Step 10: CSS extraction (generalisation)
    Split main.css into design-tokens.css + rail.css + dots.css.
    main.css becomes an @import-free file that references the extracted files via
    separate <link> tags in head.html (no @import — avoids fetch waterfall in
    CDN-served no-bundler context).
    Update head.html to add the two new <link> tags.
    Test: full Playwright suite.
```

## Integration Points

### m4 Build System Integration

The m4 build is entirely transparent to this migration. `build.sh` runs `m4 -P .compose/index.html.m4 > site/index.html` with no awareness of what's inside the fragments. Every fragment change is automatically assembled. The only build impact is:

- **head.html changes** (CDN URL, new `<link>` tags for extracted CSS) — must be correct before any markup changes take effect, because the BS5 CSS file defines the new utility classes
- **New CSS files** — must exist in `site/css/` before `head.html` references them (commit order: CSS files first, then head.html update, then run build)

There is no m4 macro work required. The fragments contain no m4 directives beyond `m4_include` at the stub level.

### CSS File Dependencies

```
design-tokens.css   (no dependencies)
        ↓
rail.css            (depends on: --rail-bg, --rail-text, --rail-text-hover,
                     --rail-active-bg, --accent, --font-body, --font-display)
dots.css            (depends on: --weekend, --c2..--c8, --border, --surface)
main.css            (depends on all tokens; references rail and dot classes
                     in context-specific overrides like .marker-flyout button.yp-dot-c*)
yp-dark.css         (depends on all tokens; overrides BS component selectors)
```

Load order in head.html must be:
1. Bootstrap 5 CSS (CDN)
2. Google Fonts (unchanged)
3. `design-tokens.css`
4. `rail.css`
5. `dots.css`
6. `main.css`
7. `yp-dark.css`
8. `typeaheadjs.css`

### Vue Reactivity — No Changes Required

All modal open/close is Vue-controlled (`showEntryModal`, `showShareModal`, etc. — `v-bind:class="{ show: showEntryModal, 'd-block': showEntryModal }"`). There is no dependence on BS JS for modal behaviour. The migration to BS5 does not change this pattern. The `data-dismiss` removal in fragments is safe because Vue already owns the dismiss path.

The one exception is `feature.html` which uses `data-dismiss="modal"` directly (not Vue-wired). Migrate to `data-bs-dismiss="modal"` only if Bootstrap JS bundle is added, OR convert the dismiss button to a `v-on:click` that sets `showFeatureModal = false`.

### Playwright Test Coverage

The Playwright suite covers: grid rendering, entry modal, share modal, delete modal, auth modal, rail flyouts, planner CRUD. This gives regression coverage for Steps 4–8. Steps 1–3 and 9–10 have no automated coverage; manual smoke test is sufficient given their low surface area.

## Anti-Patterns

### Anti-Pattern 1: Migrating all fragments simultaneously

**What people do:** Global search-replace `data-toggle` → `data-bs-toggle` across all files, then run build.
**Why it's wrong:** A single bad replace (e.g. a tooltip attribute in a Vue expression) silently misbehaves. No build error. Hard to bisect.
**Do this instead:** Change one fragment, rebuild, test. Commit per fragment.

### Anti-Pattern 2: Using `@import` in CSS for the extracted files

**What people do:** Add `@import url('rail.css')` at the top of `main.css`.
**Why it's wrong:** `@import` inside a `<link>`-loaded CSS file creates a serial fetch waterfall. In a no-bundler CDN app this adds a render-blocking round trip.
**Do this instead:** Add separate `<link rel="stylesheet">` tags in `head.html` for each extracted CSS file.

### Anti-Pattern 3: Renaming `.jumbotron` selector to a utility chain in main.css

**What people do:** Replace `.jumbotron { ... }` with `.py-2.bg-surface.flex-fill { ... }` (utility approach).
**Why it's wrong:** The jumbotron block in `main.css` has 12 properties including flex layout critical to the full-height grid. Splitting across utilities breaks the intent and loses the source-of-truth comment.
**Do this instead:** Replace the HTML element class `jumbotron` in `grid.html` with an id (`id="main-grid"`) and update the one selector in `main.css` from `.jumbotron` to `#main-grid`. Single rename, zero ambiguity.

### Anti-Pattern 4: Extracting yp-cell* into shared CSS

**What people do:** Move `yp-cell`, `yp-header-cell`, `yp-cell-c*` into a shared file alongside rail.css.
**Why it's wrong:** These classes encode calendar-grid semantics (border budget, min-width 95px, flex column fill). No sibling app will use a 37-row calendar layout. Shared files should contain only app-agnostic patterns.
**Do this instead:** Leave all `yp-cell*` and `yp-header-cell*` in `main.css`.

## Sources

- Bootstrap 5.3 official migration guide: https://getbootstrap.com/docs/5.3/migration/
- Live source: `.compose/fragments/` (all 13 files read 2026-04-14)
- Live source: `site/css/main.css`, `site/css/yp-dark.css` (read 2026-04-14)
- Bootstrap 5 CDN: https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css

---
*Architecture research for: Bootstrap 5 migration + CSS generalisation, Year Planner v1.4*
*Researched: 2026-04-14*
