# Quick Task: remove the language (world) icon from the rail, as its in the footer;  add System to the Light | Dark options in the Settings menu.

**Date:** 2026-04-16
**Branch:** main

## What Changed
- Removed the duplicate language globe button from the bottom of the left rail (`ph-globe-simple`) so language control lives only in the footer dropdown.
- Updated the rail Settings flyout theme section to include a **System** option alongside Light and Dark.
- Adjusted active-state logic for theme options:
  - `System` is active when `themeMode === 'system'`
  - `Light`/`Dark` are active only when `themeMode !== 'system'` and match current theme
- Used existing translation key for system label (`$t('lang.system')`) to avoid introducing new i18n keys.
- Added smoke assertions to prevent regression: no rail globe icon and System theme option present in fragment and composed output.

## Files Modified
- `.compose/fragments/rail.html`
- `site/index.html` (re-composed output)
- `.tests/smoke/compose.spec.js`

## Verification
- `bash .compose/build.sh`
- `npm --prefix .tests run test -- --reporter=line smoke/compose.spec.js e2e/system-follow-preferences.spec.js`
- Result: **31/31 tests passed**.
