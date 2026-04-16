# Quick Task: Ok it's visible again, but doesn't feel "in tune" with the theme (both); it's very Bootstrap OOTB, can we us a ui design skill to try a more contemporary UX for error display?

**Date:** 2026-04-16
**Branch:** main

## What Changed
- Applied UI polish guidance (make-interfaces-feel-better skill) to redesign error alerts as theme-native status cards instead of Bootstrap-default danger boxes.
- Kept the same behavior contract (`v-if="error"` / `v-if="modalError"`) and improved a11y by adding `aria-atomic="true"` to both live regions.
- Added dedicated error design tokens for both light themes (`ink`, `crisp`) and both dark variants, so alert colors/hierarchy match each visual system.
- Reworked `.yp-error-alert` styling in `site/css/main.css`:
  - token-driven background/border/text/icon colors
  - icon badge surface
  - softer layered depth
  - improved close control hit target + hover/focus/active feedback
  - subtle entry animation with reduced-motion fallback
- Re-composed `site/index.html` from compose fragments.

## Files Modified
- `.compose/fragments/grid.html`
- `.compose/fragments/modals/auth.html`
- `site/css/design-tokens.css`
- `site/css/main.css`
- `site/css/yp-dark.css`
- `site/index.html`

## Verification
- `bash .compose/build.sh`
- `npm --prefix .tests run test -- --reporter=line e2e/sync-error.spec.js smoke/compose.spec.js`
- Result: all executed tests passed (7/7).
