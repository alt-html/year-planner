---
id: T02
parent: S01
milestone: M013
key_files:
  - site/js/Application.js
  - site/js/service/StorageLocal.js
  - site/js/vue/methods/lifecycle.js
  - site/js/vue/methods/planner.js
  - site/js/vue/methods/rail.js
  - site/js/vue/methods/calendar.js
  - site/index.html
  - .tests/e2e/clean-url-navigation.spec.js
  - .tests/smoke/dark-mode.spec.js
  - .tests/e2e/planner-management.spec.js
key_decisions:
  - StorageLocal.migrate() guard changed from `if (devExists)` to `if (devExists && !legacyRaw)` — Application.js now calls DeviceSession.getDeviceId() earlier (to resolve userKey before reading prefs), which writes the `dev` key before migrate() runs; without this fix the full legacy migration was skipped and old numeric keys were not cleaned up
  - model.uid set to constant 0 rather than reading from getLocalUid() — getLocalUid() crashes on empty ids array (ids[0] is undefined), and uid is deprecated so reading it serves no purpose
  - setTheme/setLang/jumpToYear added to lifecycle.js rather than a new methods file — they are preference-persistence helpers that belong alongside initialise() and refresh()
  - Language switch uses this.$i18n.locale = normalized for in-app locale change — relies on Vue I18n v9 legacy mode reactive locale; no page reload needed
duration: 
verification_result: passed
completed_at: 2026-04-16T04:47:26.170Z
blocker_discovered: false
---

# T02: Rewired Application.js bootstrap and all UI navigation to use userKey and in-app state mutations, eliminating all ?uid=/?id= query-param links from theme, language, year, and planner controls

**Rewired Application.js bootstrap and all UI navigation to use userKey and in-app state mutations, eliminating all ?uid=/?id= query-param links from theme, language, year, and planner controls**

## What Happened

**Application.js bootstrap** — moved `userKey` resolution (`ClientAuthSession.getUserUuid() || DeviceSession.getDeviceId()`) to the top of `init()` before all other state reads. Changed `getLocalPreferences()` call to use `userKey` instead of the legacy numeric `uid`. Removed the canonical `?uid=&year=` `replaceState` block entirely (11 lines gone). Set `model.uid = 0` (deprecated constant, no longer read from URL or storage) to prevent a crash introduced when `getLocalUid()` is called on an empty `ids` array. Fixed `PreferencesStore.get/set` calls in both `init()` and `handleRailToggle()` to use `model.userKey`. Updated the debug log to emit `userKey` instead of `uid`.

**StorageLocal.js migrate()** — changed the early-return guard from `if (devExists)` to `if (devExists && !legacyRaw)` so the full migration still runs when legacy `'0'` data is present even if `dev` was already written (which now happens earlier because Application.js calls `DeviceSession.getDeviceId()` before `getLocalPreferences`).

**lifecycle.js** — fixed `initialise()` to call `setLocalPreferences(this.userKey, ...)` instead of `this.uid`. Added three new methods: `setTheme(theme)` (validates, mutates `this.theme`, persists preference, applies DOM dark-class); `setLang(lang)` (validates against 10 supported codes, mutates `this.lang`, persists, updates `$i18n.locale` and `document.documentElement.lang`); `jumpToYear(yr)` (validates bounds 1-9999, calls `setYear`, persists preference).

**planner.js** — fixed `renamePlanner()` to call `setLocalPreferences(this.userKey, ...)` instead of `this.uid`.

**rail.js** — replaced `doDarkToggle()` body (9 lines using `window.location.search`) with a single `this.setTheme(...)` call. Replaced `navigateToYear()` body (4 lines using `window.location.search`) with `this.jumpToYear(yr) + syncScheduler.markDirty()`.

**calendar.js** — removed the dead `navigateToYear()` method that used `window.location.href` with `?uid=`. That method was overridden by the rail.js version (spread last in app.js) and is no longer needed.

**index.html** — four groups of changes: (1) settings flyout theme items: replaced `v-bind:href="/?uid=..."` + `v-on:click="toggleFlyout"` with `href="#" v-on:click.prevent="setTheme('light/dark'); toggleFlyout(null)"`; (2) navbar year chevrons: replaced `v-bind:href="/?uid=...&year=year±1"` with `href="#" v-on:click.prevent="jumpToYear(year±1)"`; (3) delete modal: replaced stale `deletePlannerByYear(uid,year)` with `deletePlannerByUuid(activeDocUuid)`; (4) language dropdown: replaced all 10 `v-bind:href="/?id=...&lang=XX"` links with `href="#" v-on:click.prevent="setLang('XX')"`.

**clean-url-navigation.spec.js** (new, 9 tests): initial load has no uid/id params; dark URL param works without uid; doDarkToggle keeps URL clean; toggle back to light removes dark styles; year chevron next/prev updates display without URL change; language switch keeps URL clean; malformed year/theme/lang inputs are all ignored without crash.

**dark-mode.spec.js** — added one test: "dark toggle is in-app — URL does not change on click".

**planner-management.spec.js** — removed `?uid=12345` from the ownership-indicators test `goto` URL (changed to `/?year=2026`).

## Verification

Ran the T02 target verification command:
`npm --prefix .tests run test -- --reporter=line e2e/clean-url-navigation.spec.js e2e/planner-management.spec.js smoke/dark-mode.spec.js` → 15 passed (8.0s)

Then ran the full slice-level regression pack to confirm T01 tests still pass:
`npm --prefix .tests run test -- --reporter=line e2e/clean-url-navigation.spec.js e2e/planner-management.spec.js smoke/dark-mode.spec.js e2e/identity-storage-contract.spec.js e2e/migration.spec.js` → 24 passed (9.7s)

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm --prefix .tests run test -- --reporter=line e2e/clean-url-navigation.spec.js e2e/planner-management.spec.js smoke/dark-mode.spec.js` | 0 | ✅ pass — 15/15 tests passed | 8000ms |
| 2 | `npm --prefix .tests run test -- --reporter=line e2e/identity-storage-contract.spec.js e2e/migration.spec.js` | 0 | ✅ pass — 9/9 tests passed (T01 regression clean) | 5000ms |

## Deviations

StorageLocal.js was not listed in T02's input/output files but required a targeted fix to migrate() to prevent regression introduced by Application.js init order change. The fix is a one-line guard change with no effect on M009 users (legacyRaw is null for fresh installs).

## Known Issues

model.uid is still set to 0 and referenced in Storage.js getExportString() (getLocalIdentity(model.uid) returns null). The export still works but the identity slot in the export payload is always null/missing. T03 or a dedicated cleanup task should remove the uid field from the model and update the export path.

## Files Created/Modified

- `site/js/Application.js`
- `site/js/service/StorageLocal.js`
- `site/js/vue/methods/lifecycle.js`
- `site/js/vue/methods/planner.js`
- `site/js/vue/methods/rail.js`
- `site/js/vue/methods/calendar.js`
- `site/index.html`
- `.tests/e2e/clean-url-navigation.spec.js`
- `.tests/smoke/dark-mode.spec.js`
- `.tests/e2e/planner-management.spec.js`
