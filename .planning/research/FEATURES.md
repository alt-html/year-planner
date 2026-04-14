# Feature Research: Bootstrap 5 Migration

**Domain:** Bootstrap 4 → Bootstrap 5 migration for a year-planner PWA
**Researched:** 2026-04-14
**Confidence:** HIGH (official BS5 docs, verified against current markup and CSS)

---

## Context

The app runs Bootstrap 4.3.1 CSS from stackpath CDN. jQuery and Bootstrap JS were already removed in v1.3 — all interactive behaviour (modals, flyouts, rail) is Vue-reactive. This means the JS migration is already done; what remains is CSS class renames, removed components, and adoption of BS5 improvements.

Current BS4 usage in index.html and main.css audited below.

---

## Feature Landscape

### Table Stakes (Must Migrate — Breaking Changes)

These are not optional. BS4 classes that changed or were removed will either break layout or produce incorrect output when the CDN URL is switched to BS5.

| Feature | BS4 Class | BS5 Replacement | Complexity | Notes |
|---------|-----------|----------------|------------|-------|
| Data attributes | `data-toggle`, `data-dismiss`, `data-placement` | `data-bs-toggle`, `data-bs-dismiss`, `data-bs-placement` | LOW | Found in featureModal (`data-dismiss="modal"`), tooltip usages on navbar-brand and day cells; simple find-replace |
| No-gutters grid | `.no-gutters` | `.g-0` | LOW | Used heavily in calendar grid (`row no-gutters`); straightforward rename |
| Margin/padding directional utilities | `.ml-*`, `.mr-*`, `.pl-*`, `.pr-*` | `.ms-*`, `.me-*`, `.ps-*`, `.pe-*` | LOW | Found in planner flyout (`.mr-auto`, `.ml-2`, `.ml-1`, `.pl-3`); counts are small |
| Input group append | `.input-group-append` | Removed — wrap buttons directly in `.input-group` | LOW | Used in rename form in navbar; requires one wrapper `div` removal |
| Close button | `.close` with `&times;` | `.btn-close` (empty button, styled by BS5) | LOW | Found in shareModal, deleteModal, authModal, featureModal headers; also alert close buttons |
| Block-level button | `.btn-block` | `.d-grid` wrapper + `.gap-2` | LOW | Found in authModal sign-in buttons (`btn-block`); three occurrences |
| Text muted | `.text-muted` | `.text-body-secondary` | LOW | Found in planner flyout small year text |
| Alert dismiss | `fade` + Vue class toggling + `.show` | Same mechanism works in BS5 | NONE | Vue-controlled show/hide; no change needed |
| Jumbotron | `.jumbotron` | Removed — replicate with padding/background utilities or keep custom CSS | MEDIUM | `.jumbotron` is used as the main calendar wrapper; CSS is already heavily customised so converting to a plain `div` + keeping custom CSS is safest — DO NOT restyle with BS5 utilities, just remove the BS5 class dependency |
| Spinner | `.spinner-border` + `.sr-only` | `.spinner-border` unchanged; `.sr-only` renamed `.visually-hidden` | LOW | Loading spinner uses `.sr-only`; one occurrence |
| `shrink-to-fit=no` viewport | `shrink-to-fit=no` in viewport meta | Removed in HTML5 spec; BS5 drops it from starter template | LOW | Remove from `<meta name="viewport">` |

### Differentiators (BS5 Improvements Worth Adopting)

BS5 features that actively improve the existing UI without requiring architectural changes.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| BS5 CSS custom properties on `--bs-*` variables | BS5 components (modals, navbar) now expose CSS variables; dark-mode overrides in yp-dark.css that currently patch Bootstrap internals (`.yp-dark .modal-content`, `.yp-dark .dropdown-menu` etc.) could be replaced by simply setting the `--bs-*` vars under `.yp-dark` | MEDIUM | This is the single highest-value CSS simplification — reduces the dark-mode override surface from ~30 rules to ~5 variable reassignments; requires checking which `--bs-*` vars correspond to each override |
| `data-bs-theme` colour mode attribute | BS5.3 supports `data-bs-theme="dark"` on any element; the app already does `.yp-dark` on `#app` for dark mode — adding `data-bs-theme` alongside (or replacing) `.yp-dark` lets BS5 components self-theme without custom CSS | MEDIUM | Not a full replacement for the app's custom dark palette, but eliminates manual patching of BS5 component internals; compatible with existing Vue `doDarkToggle()` — just set attribute on `#app` alongside class |
| Gutter utilities `.g-*`, `.gx-*`, `.gy-*` | The calendar grid currently uses `.no-gutters` everywhere; BS5 gutters let per-axis control for future layout tweaks | LOW | Replace `.no-gutters` with `.g-0` during migration; gutter utilities are available if ever needed |
| `.d-grid` + `.gap-2` replaces `.btn-block` | Cleaner than BS4 `.btn-block`; auth modal sign-in buttons become a proper grid stack | LOW | Three sign-in buttons already use `mb-2` spacing; `.d-grid.gap-2` is cleaner |
| `xxl` breakpoint (1400px+) | Calendar uses custom container overrides to push max-width to 2600px; BS5's xxl breakpoint adds a named hook at 1400px that may allow removing some of the custom `@media` container overrides | LOW | The `col-xl-1` column (12-month wide) is the critical breakpoint; `xxl` may enable a more natural class rather than the current custom container max-width rules |
| `.visually-hidden` (replaces `.sr-only`) | Minor rename but aligns with WCAG terminology; already used on the loading spinner label | LOW | One occurrence; trivial |
| `me-*` / `ms-*` logical properties | Enables correct RTL layout if the app ever serves RTL languages (Arabic is among the 10 supported locales) | LOW | The app supports Arabic but does not currently implement RTL — correct logical margins now means no rework later |

### Anti-Features (BS5 Features That Are No-Ops or Actively Wrong for This App)

| Feature | Why Tempting | Why to Skip | Better Approach |
|---------|--------------|-------------|-----------------|
| BS5 Offcanvas component | Looks like a natural fit for the Vue rail flyouts | Rail and flyouts are already Vue-reactive with custom CSS transitions; replacing them with BS5 offcanvas would require Bootstrap JS to be loaded (adding ~40KB), conflict with Vue reactivity, and break the keyboard/animation behaviour already tested | Keep custom rail CSS; it is simpler, tested, and requires zero JS |
| BS5 dark mode via `data-bs-theme` on `<html>` | Cleaner than a class | The app sets dark mode on `#app`, not `<html>`, because the rail's dark background is independent of body dark mode; setting `data-bs-theme="dark"` on `<html>` would theme the whole document including elements outside `#app` | Set `data-bs-theme` on `#app` only, and only for BS5 component theming — not as a wholesale replacement for `.yp-dark` |
| BS5 Accordion component | Emoji flyout tabs look like accordion content | Emoji tab switching is Vue-reactive with `active` class toggling on `.emoji-tab-panel`; replacing with BS5 accordion adds JS dependency and structural changes for no UX gain | Keep current Vue-controlled tab panels |
| BS5 Toast component | Could replace the future sync-status notification | No toast/notification UI exists yet; adopting BS5 Toast before the notification feature is designed adds unnecessary complexity | Evaluate when sync status notifications are designed |
| BS5 Utility API (Sass) | Generates custom utility classes automatically | Project uses no Sass build step — CDN only. Utility API is Sass-only, not available from CDN. | Write custom CSS utilities directly; yp-* namespace already established |
| Floating labels | Cleaner form UX for text inputs | Entry modal uses a custom "writing surface as modal" design with no traditional form labels; floating labels would fight the established UX pattern | Keep custom `yp-entry-text` / `yp-entry-notes` styling |
| BS5 `.btn-close` SVG glyph | Accessible, standardised close button | Entry modal uses a custom `<i class="ph ph-x">` Phosphor icon for the close button that matches the rail icon family; `.btn-close` shows a Bootstrap SVG X that would visually clash | Keep `yp-entry-close` with Phosphor icon for the entry modal; use `.btn-close` only for the remaining standard modal headers |

---

## Feature Dependencies

```
CDN URL swap (BS4→BS5)
    └──breaks──> data-toggle / data-dismiss attributes (featureModal)
    └──breaks──> .no-gutters (calendar grid — many rows)
    └──breaks──> .input-group-append (rename form)
    └──breaks──> .close button markup (share/delete/auth/feature modals)
    └──breaks──> .btn-block (auth modal)
    └──breaks──> .sr-only (spinner)
    └──removes──> .jumbotron styles (main content wrapper)

data-bs-theme on #app
    └──requires──> BS5 CSS custom property audit (--bs-* vars)
    └──enables──> removal of .yp-dark BS-component overrides in yp-dark.css

Logical margin classes (ms-*/me-*)
    └──enables──> RTL correctness (Arabic locale support)
```

### Dependency Notes

- **CDN swap must come first:** All breaking class renames are mechanical and must be done atomically with the CDN URL change. Switching the URL without updating classes will break layout immediately.
- **`data-bs-theme` requires CSS audit:** Before adopting `data-bs-theme` on `#app`, each `--bs-*` custom property that corresponds to a current `.yp-dark` override must be identified and mapped. This is an audit task, not a code change.
- **Jumbotron removal is safe:** The `.jumbotron` custom CSS in main.css is already written against `#app > main.d-block > .jumbotron` selectors. Replacing `<div class="jumbotron">` with `<div class="yp-main">` and updating the CSS selector costs one line change.

---

## MVP Definition

This is a migration milestone, not a new feature. "MVP" here means: the app works correctly on BS5 with no regressions, then opportunistic improvements.

### Phase A — Mechanical Migration (Must Be Atomic)

Everything here breaks if the CDN URL is changed without it being done.

- [ ] Switch CDN from stackpath BS4.3.1 to jsdelivr BS5.3.x CSS-only (no BS5 JS needed)
- [ ] Rename `data-toggle`/`data-dismiss`/`data-target` → `data-bs-*` (featureModal, tooltip attributes)
- [ ] Rename `.no-gutters` → `.g-0` across calendar grid (many rows)
- [ ] Rename `.ml-*`/`.mr-*`/`.pl-*`/`.pr-*` → `.ms-*`/`.me-*`/`.ps-*`/`.pe-*` (planner flyout)
- [ ] Remove `.input-group-append` wrapper from rename form
- [ ] Replace `.close` + `&times;` with `.btn-close` (share/delete/auth modal headers)
- [ ] Replace `.btn-block` with `.d-grid`+`.gap-2` in authModal
- [ ] Replace `.sr-only` → `.visually-hidden` on spinner
- [ ] Replace `.text-muted` → `.text-body-secondary` in planner flyout
- [ ] Remove jumbotron class dependency (rename element, update CSS selector to custom class)
- [ ] Remove `shrink-to-fit=no` from viewport meta

### Phase B — Dark Mode Improvement (High Value, Moderate Effort)

- [ ] Audit `--bs-*` CSS variables in BS5 that correspond to current `.yp-dark` BS-component patches in yp-dark.css
- [ ] Add `data-bs-theme` attribute toggling to `#app` alongside `.yp-dark` class in `doDarkToggle()`
- [ ] Remove the ~30 BS-component dark override rules from yp-dark.css that are now covered by `data-bs-theme`

### Phase C — CSS Generalisation (Out of Scope for Mechanical Migration)

- [ ] Extract `yp-rail`, `rail-flyout`, `yp-cell-*`, `yp-dot-*`, `yp-entry-*` into a documented design token set reusable by sibling apps
- [ ] Replace the 4 near-identical `yp-cell-*` rules (`.yp-cell`, `.yp-cell-right`, `.yp-cell-bottom`, `.yp-cell-bottom-right`) with a single rule + modifier classes

---

## Feature Prioritization Matrix

| Feature | User Value | Migration Cost | Priority |
|---------|------------|----------------|----------|
| Phase A mechanical migration | HIGH (unblocks BS5) | LOW (find-replace) | P1 |
| `data-bs-theme` dark mode simplification | MEDIUM (CSS maintainability) | MEDIUM (CSS audit needed first) | P1 |
| Jumbotron class removal | LOW (invisible to user) | LOW | P1 (part of Phase A) |
| xxl breakpoint exploration | LOW | LOW | P3 |
| `.me-*`/`.ms-*` RTL correctness | LOW (Arabic locale exists but RTL not implemented) | LOW | P2 (do during Phase A rename anyway) |
| BS5 Offcanvas for rail | NONE | HIGH (architectural change, adds JS) | Anti-feature — skip |
| Sass Utility API | NONE (no build step) | N/A | Anti-feature — skip |

---

## Audit: Current BS4 Classes in index.html

Confirmed by reading the markup (lines 1–600 of index.html):

**Breaking renames needed:**
- `data-toggle="tooltip"` (2 locations: navbar-brand, day cell title attributes)
- `data-dismiss="modal"` (1 location: featureModal close button)
- `.no-gutters` (>20 occurrences in the calendar grid rows)
- `.input-group-append` (1 occurrence: rename form)
- `.close` (4 modal headers: share, delete, auth, feature)
- `.btn-block` (3 occurrences: authModal sign-in buttons)
- `.sr-only` (1 occurrence: spinner label)
- `.text-muted` (1 occurrence: planner year label in flyout)
- `.ml-auto`/`.mr-auto`/`.ml-2`/`.ml-1`/`.pl-3` (planner flyout items)
- `class="jumbotron"` (1 occurrence: main content wrapper)
- `shrink-to-fit=no` (1 occurrence: viewport meta)

**Already correct / no change needed:**
- Modals: `.modal`, `.modal-dialog`, `.modal-content`, `.modal-header`, `.modal-body`, `.modal-footer` — unchanged in BS5
- Grid: `.row`, `.col-*`, `.container` — unchanged
- Utilities: `.d-none`, `.d-block`, `.d-flex`, `.align-items-center`, `.sticky-top`, `.fade`, `.show`, `.text-center` — unchanged
- Buttons: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-outline-dark` — unchanged
- Form: `.form-control`, `.form-control-sm`, `.form-inline` (`.form-inline` was removed in BS5 but the rename form already lays out correctly with flex)
- Navbar: `.navbar`, `.navbar-brand`, `.navbar-expand`, `.collapse`, `.navbar-collapse` — unchanged
- Spinner: `.spinner-border` — unchanged

**Ambiguous / check needed:**
- `.form-inline` (rename form) — removed in BS5; however the form is `display:none` by default (shown only when renaming) and the layout is controlled by flex on `.input-group`; removing `.form-inline` from the class list is safe
- `.badge` (if used) — not found in visible markup but may be in remaining fragment files

---

## Sources

- Bootstrap 5.3 Migration Guide: https://getbootstrap.com/docs/5.3/migration/
- Bootstrap 5.3 Color Modes: https://getbootstrap.com/docs/5.3/customize/color-modes/
- Bootstrap 5.3 Offcanvas: https://getbootstrap.com/docs/5.3/components/offcanvas/
- Bootstrap 5.3 Utility API: https://getbootstrap.com/docs/5.3/utilities/api/
- jsDelivr Bootstrap 5.3: https://www.jsdelivr.com/package/npm/bootstrap
- Source files audited: `site/index.html` (lines 1–600), `site/css/main.css`, `site/css/yp-dark.css`

---
*Feature research for: Bootstrap 5 migration — year-planner PWA*
*Researched: 2026-04-14*
