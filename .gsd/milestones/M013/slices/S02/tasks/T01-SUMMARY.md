---
id: T01
parent: S02
milestone: M013
key_files:
  - site/js/Application.js
  - site/js/vue/i18n.js
  - site/js/service/StorageLocal.js
  - site/js/vue/model/planner.js
  - .tests/e2e/system-follow-preferences.spec.js
key_decisions:
  - year/lang/theme stripped from this.url.parameters entirely rather than just ignored at read — cleaner signal to future maintainers that these params are not part of the URL contract
  - langMode/themeMode default to 'explicit' for existing installs that already have a stored preference value, 'system' for fresh installs — preserves existing user choices while enabling system-follow for new users
  - i18n.js boots with locale 'en' and Application.run() syncs it to the resolved lang — avoids flash of wrong locale during CDI init sequence
  - PreferencesStore.get wrapped in try/catch in getLocalPreferences to absorb corrupt JSON gracefully — crash-safe per failure mode spec
duration: 
verification_result: passed
completed_at: 2026-04-16T05:26:44.804Z
blocker_discovered: false
---

# T01: Removed year/lang/theme URL bootstrap inputs and introduced persisted langMode/themeMode system-follow preference contract with 16-test regression spec

**Removed year/lang/theme URL bootstrap inputs and introduced persisted langMode/themeMode system-follow preference contract with 16-test regression spec**

## What Happened

Application.js `this.url.parameters` now only carries `name` and `share` — the three app-state URL params (`year`, `lang`, `theme`) are gone. The `init()` method derives startup state exclusively from stored preferences plus system defaults: year from `preferences['0']` or `pageLoadTime.year`; lang from `preferences['1']` or navigator language mapped to the SUPPORTED_LANGS whitelist with `en` fallback; theme from `preferences['2']` or `window.matchMedia('(prefers-color-scheme: dark)')`. Two new mode fields — `langMode` and `themeMode` — are resolved during bootstrap and written back to preferences. Fresh installs default to `'system'` mode; existing installs with already-stored explicit values default to `'explicit'`. `Application.run()` now sets `this.i18n.global.locale = this.model.lang` before `document.title` so the i18n locale tracks the resolved preference, not the old URL-param value. `i18n.js` removes the `urlParam` import entirely and initialises with `locale: 'en'` as the framework default. `StorageLocal.setLocalPreferences` stores `langMode` and `themeMode` in the named-key prefs object; `getLocalPreferences` propagates them in the return value. A try/catch was added around `PreferencesStore.get` to absorb corrupt JSON without crashing the bootstrap chain. `model/planner.js` adds `langMode: null` and `themeMode: null` to plannerState. The new spec `.tests/e2e/system-follow-preferences.spec.js` covers 16 scenarios across three describe blocks: URL-param isolation (year/lang/theme all ignored, combined params, clean boot), mode contract (fresh install stores mode fields, defaults to system, explicit prefs round-trip through reload), and resilience (corrupted JSON, unknown lang code, bogus mode values, OAuth ?token cleanup, no app-state params in URL after boot). All 16 tests pass in 10.1s.

## Verification

Ran `npm --prefix .tests run test -- --reporter=line e2e/system-follow-preferences.spec.js` — 16 passed (10.1s). Tests cover: URL param isolation (year/lang/theme not driving bootstrap state), mode contract persistence (langMode/themeMode stored and restored), and resilience paths (corrupted prefs, unknown lang codes, bogus mode tokens, OAuth cleanup).

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm --prefix .tests run test -- --reporter=line e2e/system-follow-preferences.spec.js` | 0 | ✅ pass | 10100ms |

## Deviations

none

## Known Issues

smoke/dark-mode.spec.js and the ?theme=/?year= tests in clean-url-navigation.spec.js will fail until T03 updates them to use in-app state setup instead of URL params — this is expected and tracked in the S02 slice plan.

## Files Created/Modified

- `site/js/Application.js`
- `site/js/vue/i18n.js`
- `site/js/service/StorageLocal.js`
- `site/js/vue/model/planner.js`
- `.tests/e2e/system-follow-preferences.spec.js`
