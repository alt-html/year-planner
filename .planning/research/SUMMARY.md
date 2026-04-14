# Project Research Summary

**Project:** Year Planner — Bootstrap 4 → 5 Migration + CSS Generalisation
**Domain:** CDN-only vanilla PWA CSS migration + design system extraction
**Researched:** 2026-04-14
**Confidence:** HIGH

## Executive Summary

CSS-only library migration with a secondary CSS generalisation goal. Bootstrap 4 → 5 is well-documented with a deterministic set of breaking class renames — no logic changes, no new architecture, no new dependencies. The correct approach is an incremental fragment-by-fragment rename pass (Phase 1), followed by a visual audit and dark mode improvement (Phase 2), followed by a separate CSS extraction for multi-app reuse (Phase 3).

The most important constraint is the m4 build system: `site/index.html` is an assembled output, never edited directly. All changes go into `.compose/fragments/` and `site/css/` files, then rebuilt via `.compose/build.sh`. Bootstrap JS was already removed in v1.3; Vue owns all interactive behaviour.

Main risks are silent failures. BS5 drops classes without errors: `.no-gutters`, `.close`, `.btn-block`, `.sr-only`, `.jumbotron`, `.form-group`, `.form-inline`, and all `data-toggle`/`data-dismiss` attributes vanish silently when the CDN is swapped.

## Key Findings

### Recommended Stack

No new libraries. Swap one `<link>` tag in `.compose/fragments/head.html` from `stackpath.bootstrapcdn.com` Bootstrap 4.3.1 to `cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css`. Bootstrap JS bundle NOT required.

### Expected Features

**Must have (Phase 1 — mechanical migration):**
- CDN URL swap with correct SRI hash
- `.no-gutters` → `.g-0` across all calendar grid rows + `main.css` selectors
- `data-toggle`/`data-dismiss`/`data-target` → `data-bs-*`
- `.close` → `.btn-close` (empty button) in all modal headers + grid alert
- `.btn-block` → `d-grid gap-2` wrapper; `.sr-only` → `.visually-hidden`
- `.text-muted` → `.text-body-secondary`; directional utilities renamed
- `.form-inline` → flex utilities; `.form-group` → `div.mb-3`; `.input-group-append` removal
- `.jumbotron` → plain div with custom class; viewport meta cleanup
- Feature modal: convert to Vue-reactive state
- `yp-dark.css`: add `.btn-close` filter override

**Should have (Phase 2 — dark mode improvement):**
- `data-bs-theme="dark"` attribute toggling alongside `.yp-dark`
- Remove ~30 BS-component dark override rules now covered by `data-bs-theme`
- Visual audit for BS5 reboot link underline changes

**Defer (Phase 3 — CSS generalisation):**
- Extract `design-tokens.css`, `rail.css`, `dots.css` from `main.css`
- Rename bare `--bg`, `--text` to `--yp-*` namespace
- Update `head.html` to load extracted CSS files as separate `<link>` tags

### Architecture Approach

Fragment-by-fragment migration: head → spinner → feature modal → share/delete modals → auth modal → nav → grid → footer → yp-dark.css → main.css selectors. Each step independently verifiable with Playwright.

**CSS generalisation output (Phase 3):**
```
site/css/
├── design-tokens.css   NEW — :root and [data-theme] token blocks
├── rail.css            NEW — .yp-rail*, .rail-flyout*, .rail-toggle rules
├── dots.css            NEW — .yp-dot, .yp-dot-c1..c8, .yp-dot-clear
├── main.css            MODIFIED — planner-specific rules only
└── yp-dark.css         MODIFIED — .btn-close rule; reduced overrides
```

### Critical Pitfalls

1. **`.no-gutters` silently ignored** — 20+ calendar grid rows gain unwanted gutters. Both HTML class AND CSS selector updates required together.
2. **`data-toggle`/`data-dismiss` silently ignored** — feature modal locks open (only non-Vue modal).
3. **`.close` removed** — modal close buttons vanish or render as giant × text. Dark mode override becomes dead CSS.
4. **BS5 reboot underlines all `<a>` elements** — rail, navbar, footer links rely on BS4 baseline.
5. **Generalisation before migration embeds BS4 debt** — extract only after Playwright suite is green on BS5.

## Implications for Roadmap

Three phases, strictly ordered:

### Phase 1: Mechanical Migration
All breaking renames atomic with CDN swap. Fragment-by-fragment with Playwright checkpoints. Feature modal converted to Vue state. Zero BS JS bundle.

### Phase 2: Visual Audit & Dark Mode
BS5 reboot link underline sweep. `data-bs-theme` adoption reduces `yp-dark.css` from ~30 patch rules to ~5 variable assignments. Tooltip decision.

### Phase 3: CSS Generalisation
Extract shared CSS files for sibling app reuse. Rename custom properties to `--yp-*` namespace. Separate `<link>` tags (no `@import`).

**Phase ordering:** 1→2→3 strictly. Mechanical renames before visual audit; migration before extraction.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official BS5 docs; CDN links verified |
| Features | HIGH | Breaking changes verified by grepping live codebase |
| Architecture | HIGH | All 13 fragment files read; m4 build system understood |
| Pitfalls | HIGH | 15 pitfalls verified against live markup with line numbers |

**Research flags:** No additional research needed for Phase 1 or 3. Phase 2 needs a brief `--bs-*` variable audit during planning (30 min, not a spike).

---
*Research completed: 2026-04-14*
*Ready for roadmap: yes*
