---
phase: 12-auth-client-configuration-live-sync
plan: "01"
subsystem: vue-rail-migration
tags: [vue, rail, jquery-removal, modals, bridge-deletion]
dependency_graph:
  requires: []
  provides: [vue-bound-rail, jquery-free-modals, bridge-deleted]
  affects: [site/index.html, site/js/vue/, .compose/fragments/]
tech_stack:
  added: []
  patterns: [vue-v-show-modal, vue-v-bind-class-show, vue-vnode-component-proxy]
key_files:
  created:
    - site/js/vue/methods/rail.js
  modified:
    - site/js/vue/model/ui.js
    - site/js/vue/app.js
    - site/js/vue/methods/auth.js
    - site/js/vue/methods/lifecycle.js
    - site/js/vue/methods/planner.js
    - site/js/vue/methods/entries.js
    - site/js/Application.js
    - .compose/index.html.m4
    - .compose/fragments/rail.html
    - .compose/fragments/scripts.html
    - .compose/fragments/nav.html
    - .compose/fragments/grid.html
    - .compose/fragments/modals/auth.html
    - .compose/fragments/modals/entry.html
    - .compose/fragments/modals/share.html
    - .compose/fragments/modals/delete.html
    - .tests/e2e/auth-modal.spec.js
    - .tests/e2e/planner-management.spec.js
    - site/index.html
decisions:
  - "Used _vnode.component.proxy pattern (not __vue_app__._instance) to access Vue root instance from E2E tests — _instance is null on the app object but _vnode.component.proxy is the correct Vue 3 path"
  - "Bootstrap dropdown CSS requires both v-show AND v-bind:class={show:navMenuOpen} — v-show alone removes inline style but Bootstrap CSS display:none still applies"
  - "Option B for signInWith: showAuthModal=false as first line matches old data-dismiss UX — modal closes immediately on provider button click"
metrics:
  duration_minutes: 45
  tasks_completed: 3
  files_modified: 19
  completed_date: "2026-04-13"
---

# Phase 12 Plan 01: Rail Vue Migration & jQuery Removal Summary

**One-liner:** Migrated vertical rail from outside #app into Vue template, replaced 520-line bridge script and jQuery/Bootstrap JS CDN with Vue data flags and event handlers.

## What Was Built

The rail was previously outside `#app`, requiring a massive bridge IIFE that accessed Vue internals via `_vnode.component.proxy` and jQuery for modal control. This plan:

- Moved the rail HTML inside `#app` (in `.compose/index.html.m4`)
- Created `site/js/vue/methods/rail.js` with all rail interaction handlers (marker mode, emoji mode, flyouts, dark toggle, theme toggle, nav menu)
- Added rail/flyout/modal Vue data properties to `uiState` (railFlyout, markerActive, emojiActive, showAuthModal, showShareModal, showEntryModal, showDeleteModal, renameVisible, navMenuOpen, styleCrisp)
- Replaced all jQuery modal calls with Vue data flags across auth.js, lifecycle.js, planner.js, entries.js
- Deleted the 520-line bridge IIFE and jQuery/Popper/Bootstrap JS CDN from scripts.html
- Added early theme apply inline script to prevent flash on load
- Converted all modal fragments to use Vue v-bind:class and v-on:click (auth, entry, share, delete)
- Updated nav.html dropdown to use Vue v-show + v-bind:class={show}
- Updated E2E tests to use Vue proxy (`_vnode.component.proxy`) instead of jQuery

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] jQuery `$()` tooltip init in Application.js**
- **Found during:** Task 3 (app boot debugging)
- **Issue:** `$(function() { $('[data-toggle="tooltip"]').tooltip() })` in Application.js threw `$ is not defined` after jQuery removal, preventing app boot
- **Fix:** Removed the call — Bootstrap tooltips are gone with jQuery; `title=` attributes still provide native browser tooltips
- **Files modified:** `site/js/Application.js`
- **Commit:** 9bc4172

**2. [Rule 1 - Bug] Bootstrap `data-toggle="modal"` on grid cells broken**
- **Found during:** Task 3 (E2E test failures — entry modal never showed)
- **Issue:** Grid cells used `data-toggle="modal" data-target="#entryModal"` which relied on Bootstrap JS (now removed). Entry modal never opened after Bootstrap JS deletion.
- **Fix:** Added `this.showEntryModal = true` to `updateEntryState()` in entries.js; removed `data-toggle` from grid.html; converted entry.html to use Vue v-bind:class/v-on:click
- **Files modified:** `site/js/vue/methods/entries.js`, `.compose/fragments/grid.html`, `.compose/fragments/modals/entry.html`
- **Commit:** 9bc4172

**3. [Rule 1 - Bug] Bootstrap CSS hides `.dropdown-menu` despite Vue v-show**
- **Found during:** Task 3 (planner-management tests — `.nav-settings` stays hidden)
- **Issue:** Bootstrap CSS sets `.dropdown-menu { display: none }` via stylesheet. Vue `v-show` removes inline `display:none` style but the CSS rule still wins. The element remained hidden even when `navMenuOpen = true`.
- **Fix:** Added `v-bind:class="{ show: navMenuOpen }"` alongside `v-show="navMenuOpen"` — the Bootstrap `.dropdown-menu.show` CSS overrides with `display: block`
- **Files modified:** `.compose/fragments/nav.html`
- **Commit:** 9bc4172

**4. [Rule 1 - Bug] Share and delete modals still used `data-dismiss`**
- **Found during:** Task 2 scope review
- **Issue:** share.html and delete.html still had `data-dismiss="modal"` and no Vue class bindings — Bootstrap JS removal broke their close buttons
- **Fix:** Converted share.html and delete.html to use Vue v-bind:class + v-on:click close handlers; added showDeleteModal flag to ui.js
- **Files modified:** `.compose/fragments/modals/share.html`, `.compose/fragments/modals/delete.html`
- **Commit:** 9bc4172

**5. [Rule 2 - Missing] `styleCrisp` flag missing from Vue model**
- **Found during:** Task 3 (app boot debug)
- **Issue:** rail.html uses `v-show="!styleCrisp"` on theme icons but `styleCrisp` was not in the Vue model — Vue would warn and icons would behave incorrectly
- **Fix:** Added `styleCrisp: false` to `uiState` in `site/js/vue/model/ui.js`
- **Files modified:** `site/js/vue/model/ui.js`
- **Commit:** 9bc4172

**6. [Rule 2 - Missing] E2E test `openAuthModal()` used wrong Vue instance path**
- **Found during:** Task 3 (first test run)
- **Issue:** `app.__vue_app__._instance` is `null` in Vue 3 — the correct path is `app._vnode.component.proxy`
- **Fix:** Updated both `auth-modal.spec.js` and `planner-management.spec.js` to use `_vnode.component.proxy`
- **Files modified:** `.tests/e2e/auth-modal.spec.js`, `.tests/e2e/planner-management.spec.js`
- **Commit:** 9bc4172

## Verification Results

```
32 passed (9.4s)
```

All 32 Playwright E2E tests pass including:
- E2E-AUTH-01/02/03: Auth modal (Google/Apple/Microsoft)
- E2E-02: Entry CRUD
- E2E-03: Planner management
- SYNC-04: HLC write path
- SEC-03: Tooltip XSS
- COMP-02: Compose build produces identical index.html

## Known Stubs

None — all functionality is wired to Vue reactive data.

## Threat Flags

No new security surfaces introduced. Bridge IIFE deletion removed `_vnode.component.proxy` external access vector (T-12-01 mitigated). jQuery CDN removed (T-12-02 mitigated).

## Self-Check: PASSED

- FOUND: site/js/vue/methods/rail.js
- FOUND: site/js/vue/model/ui.js
- FOUND: .compose/fragments/scripts.html
- FOUND: site/index.html
- FOUND commit: eb93672 (Task 1)
- FOUND commit: c90695c (Task 2)
- FOUND commit: 9bc4172 (Task 3 + deviation fixes)
