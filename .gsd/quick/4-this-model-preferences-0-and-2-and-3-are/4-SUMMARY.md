# Quick Task: this.model.preferences['0'] and '2' and '3' are legacy code smells, lets replace them with named equivalents this.model.preferences.year, lang and theme; the compression is hard to reason about.  Regression test it of course.

**Date:** 2026-04-16
**Branch:** main

## What Changed
- Refactored runtime preference usage from numeric aliases to named keys:
  - `preferences.year`, `preferences.lang`, `preferences.theme`
  - `preferences.names` for planner-name map
  - retained `langMode` / `themeMode`
- Updated bootstrap and lifecycle paths to read/write named preferences only:
  - `site/js/Application.js`
  - `site/js/vue/methods/lifecycle.js`
  - `site/js/vue/methods/planner.js`
- Reworked `StorageLocal` preference adapter to normalize both legacy and modern shapes, then persist canonical named format:
  - accepts legacy numeric aliases for backward compatibility
  - strips legacy aliases (`0/1/2/3`, `dark`) on canonical write
  - preserves non-preference fields already in prefs (e.g. `railOpen`)
  - normalizes invalid language codes back to supported values (`en` fallback)
- Kept migration compatibility: old numeric prefs payloads are still read/migrated, but rewritten as named fields.

## Files Modified
- `site/js/Application.js`
- `site/js/service/StorageLocal.js`
- `site/js/vue/methods/lifecycle.js`
- `site/js/vue/methods/planner.js`
- `.tests/e2e/identity-storage-contract.spec.js`
- `.tests/e2e/system-follow-preferences.spec.js`

## Verification
- `npm --prefix .tests run test -- --reporter=line e2e/identity-storage-contract.spec.js e2e/system-follow-preferences.spec.js e2e/clean-url-navigation.spec.js e2e/migration.spec.js`
- Result: **44 passed**.
- Added/updated assertions confirm prefs are stored in named shape and numeric aliases are absent after normalization/migration.
