# Stack Research

**Domain:** Bootstrap 4 → 5 migration, CSS generalisation (vanilla ES module PWA)
**Researched:** 2026-04-14
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Bootstrap CSS | 5.3.8 | Layout, modal structure, utility classes | Latest stable patch of 5.3.x; LTS-equivalent; jsDelivr CDN; official SRI hash available |
| Bootstrap JS | NOT NEEDED | — | jQuery and Bootstrap JS already removed in v1.3; modals/tooltips are Vue-reactive; no JS bundle needed |
| Popper.js | NOT NEEDED | — | Only needed for Bootstrap JS dropdowns/tooltips; not used here |

### Supporting Libraries

All pre-existing — no new libraries required for the BS4→BS5 migration.

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| Vue 3 | 3.5.30 (current) | Modal state, reactivity | Unchanged |
| vue-i18n | 9.14.5 (current) | i18n | Unchanged |
| Phosphor Icons | 2.1.2 (current) | Icon set | Unchanged |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| m4 build system | Assembles `site/index.html` from `.compose/fragments/` | CDN link change goes in `.compose/fragments/head.html` — index.html is the compiled output |

## Installation

No npm install. This is a CDN-only, no-bundler project.

The only change is swapping one `<link>` tag.

## CDN Tag Replacement

**Remove (in `.compose/fragments/head.html`):**
```html
<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
```

**Replace with:**
```html
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB" crossorigin="anonymous">
```

Note: BS5 uses jsDelivr (`cdn.jsdelivr.net/npm/`) — consistent with Vue and vue-i18n CDN pattern already in the project. The old `stackpath.bootstrapcdn.com` domain is discontinued.

## Viewport Meta Update

**Remove `shrink-to-fit=no`** (BS4-ism, meaningless in BS5):

```html
<!-- v4 -->
<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">

<!-- v5 -->
<meta name="viewport" content="width=device-width, initial-scale=1">
```

## Breaking Changes Inventory (this codebase)

All items verified against `site/index.html` and `.compose/fragments/` grep audit.

### Must Fix (markup will break or render incorrectly in BS5)

| Location | BS4 Pattern | BS5 Replacement | Impact |
|----------|-------------|-----------------|--------|
| `nav.html` / `index.html:371` | `<div class="input-group-append">` | Remove wrapper div; put child directly inside `.input-group` | Rename input save button misaligned |
| `nav.html` / `index.html:369` | `<form class="form-inline">` | `<form class="d-flex gap-2">` or `<form class="row g-2">` | Rename form layout broken |
| `index.html:404,416,434,438,443,453` | `class="row no-gutters"` | `class="row g-0"` | Calendar grid gutter removal broken — CRITICAL, affects entire grid layout |
| `index.html:570,573,576` | `class="btn btn-outline-dark btn-block"` | `class="btn btn-outline-dark w-100"` (or wrap in `<div class="d-grid">`) | Sign-in buttons not full-width |
| Multiple modals (`modals/auth.html` etc.) | `<button class="close">` | `<button class="btn-close">` | Close button invisible (BS5 uses SVG background-image) |
| `index.html:647` | `data-toggle="modal" data-target="#featureModal"` | `data-bs-toggle="modal" data-bs-target="#featureModal"` | Feature modal trigger broken (this is the only remaining `data-toggle` that actually needs BS JS — see note below) |
| `index.html:611,612` | `data-dismiss="modal"` | `data-bs-dismiss="modal"` | Feature modal close buttons broken |
| `css/main.css:701,712` | `#yp-months .row.no-gutters` selectors | Update to `row.g-0` | CSS selectors won't match after class rename |

### Should Fix (deprecated, will produce lint warnings or subtle layout drift)

| Location | BS4 Pattern | BS5 Replacement |
|----------|-------------|-----------------|
| `index.html:94` | `class="mr-auto"` | `class="me-auto"` |
| `index.html:95` | `class="ml-2"` | `class="ms-2"` |
| `index.html:96,97` | `class="ml-1"` | `class="ms-1"` |
| `index.html:99` | `class="pl-3"` | `class="ps-3"` |
| `index.html:623` | `class="text-left"` | `class="text-start"` |
| `index.html:647` | `class="text-right"` | `class="text-end"` |
| `head.html` | `shrink-to-fit=no` viewport | Remove the attribute |

### Note on `data-toggle="modal"` in featureModal

The featureModal (`index.html:647` footer trigger, `index.html:594,611,612`) still uses `data-toggle`/`data-dismiss` — this is the **only** modal not controlled by Vue state flags. Two options:
1. Convert to `data-bs-toggle`/`data-bs-dismiss` and load the BS5 JS bundle (adds ~78KB gzipped)
2. Convert featureModal to Vue-reactive state (consistent with all other modals, zero new deps)

**Recommendation: Option 2.** Add `showFeatureModal` flag to Vue model, match the pattern of `showEntryModal` etc. Keeps zero Bootstrap JS dependency. The `data-bs-dismiss` approach would require loading bootstrap.bundle.min.js which the project explicitly removed.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| CSS-only BS5 (no JS bundle) | bootstrap.bundle.min.js | Only if native BS JS tooltips/dropdowns/accordions are added in future phases |
| `w-100` for block buttons | `d-grid` wrapper | `d-grid` is more semantically correct for stacked button groups; `w-100` is fine for single buttons |
| Inline `g-0` class | Override in CSS | CSS override already exists in main.css; keep CSS selector fix alongside class rename for clarity |

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `bootstrap.bundle.min.js` | jQuery and BS JS already removed in v1.3; adding JS bundle reintroduces 78KB and Popper.js for no benefit | Vue-reactive state for all interactive components |
| `@popperjs/core` | Same reason — not needed without BS JS | — |
| Bootstrap Icons | Phosphor Icons already covers the icon set; mixing icon sets is visual noise | Phosphor Icons (already in use) |
| `bootstrap@5.0` or `5.1` | Only 5.3.x receives active bug/security fixes | `bootstrap@5.3.8` |

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Bootstrap CSS 5.3.8 | Vue 3.5.30 | No conflicts — BS CSS is styling only, no JS interop needed |
| Bootstrap CSS 5.3.8 | Phosphor Icons 2.1.2 | No conflicts |
| Bootstrap CSS 5.3.8 | main.css / yp-dark.css | `.row.no-gutters` CSS selectors in main.css must be updated to `.row.g-0` |

## m4 Build System Consideration

The CDN link lives in `.compose/fragments/head.html`, NOT directly in `site/index.html`. Editing `index.html` directly will be overwritten on next `build.sh` run. All markup changes must go to the appropriate fragment file:

| Fragment | Contains |
|----------|----------|
| `.compose/fragments/head.html` | Bootstrap CDN link, viewport meta |
| `.compose/fragments/nav.html` | `form-inline`, `input-group-append` |
| `.compose/fragments/modals/auth.html` | Auth modal `.close` button |
| `.compose/fragments/modals/share.html` | Share modal `.close` button |
| `.compose/fragments/modals/delete.html` | Delete modal `.close` button |
| `.compose/fragments/modals/feature.html` | `data-toggle`/`data-dismiss` (convert to Vue state) |
| `site/css/main.css` | `.row.no-gutters` CSS selectors |

## Sources

- https://getbootstrap.com/docs/5.3/getting-started/download/ — BS5.3.8 CDN links and SRI hashes (HIGH confidence, official docs)
- https://getbootstrap.com/docs/5.3/migration/ — Breaking changes v4→v5 (HIGH confidence, official migration guide)
- `site/index.html` grep audit — All affected class names and data attributes verified against actual codebase
- `.compose/fragments/` file inventory — Source-of-truth for build system edit locations

---
*Stack research for: Bootstrap 4→5 migration, year-planner*
*Researched: 2026-04-14*
