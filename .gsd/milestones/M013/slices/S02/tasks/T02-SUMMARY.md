---
id: T02
parent: S02
milestone: M013
key_files:
  - site/js/vue/methods/lifecycle.js
  - site/js/vue/methods/rail.js
  - site/js/vue/i18n/lang.js
  - site/index.html
  - .tests/e2e/system-follow-preferences.spec.js
key_decisions:
  - _systemListenersRegistered flag on the Vue instance prevents duplicate matchMedia/languagechange listener registration across multiple refresh() calls — critical for idempotency since refresh() runs on every planner navigation
  - setTheme/setLang setters now own both mode and effective-value state in a single write: one call atomically transitions mode + applies DOM + saves prefs rather than requiring a separate setMode() call
  - doDarkToggle leaves themeMode handling entirely to setTheme — no special-case needed for system mode since calling setTheme('light'|'dark') always switches to explicit
  - _applySystemTheme reads from matchMedia().matches at call time rather than from the event object — makes the system-follow handler safe against malformed MediaQueryListEvent payloads
duration: 
verification_result: passed
completed_at: 2026-04-16T05:34:14.184Z
blocker_discovered: false
---

# T02: Wired live system-follow matchMedia/languagechange listeners and mode-aware setTheme/setLang setters with System option UI controls and 9 new E2E tests (25 total passing)

**Wired live system-follow matchMedia/languagechange listeners and mode-aware setTheme/setLang setters with System option UI controls and 9 new E2E tests (25 total passing)**

## What Happened

lifecycle.js was extended with four new helpers and refactored setters. `_applyThemeDom(theme)` extracts the DOM class/attribute update from `refresh()` and `setTheme()` so both use the same path. `_applySystemTheme()` reads from the current matchMedia query (not the event payload, avoiding malformed-event edge cases), saves the resolved theme to preferences, and calls `_applyThemeDom`. `_applySystemLang()` reads `navigator.languages` with fallbacks, normalizes to two-letter lowercase, maps unsupported codes to 'en', and applies i18n locale + `document.documentElement.lang` only when the resolved value differs from the current lang. `registerSystemListeners()` registers a `matchMedia('(prefers-color-scheme: dark)') change` listener and a `window languagechange` listener, both gated on the respective mode being 'system'; a `_systemListenersRegistered` flag prevents duplicate registration across re-renders or multiple `refresh()` calls. `refresh()` now calls `_applyThemeDom(this.theme)` and `registerSystemListeners()` at mount. `initialise()` now passes `langMode`/`themeMode` to `setLocalPreferences` so they are persisted from the first write. `setTheme(theme)` now accepts 'system' (sets themeMode='system', applies OS theme immediately) in addition to 'light'/'dark' (sets themeMode='explicit'). `setLang(lang)` now accepts 'system' (sets langMode='system', applies navigator language immediately) in addition to explicit codes. Both setters guard against invalid inputs (unknown codes, invalid modes) without mutating state. rail.js `doDarkToggle` is unchanged in behavior but gains a comment documenting that calling setTheme with a concrete value always sets themeMode to 'explicit' — deterministic even when currently in system mode. lang.js gains `system: 'System'` so `$t('lang.system')` is available for future i18n use. index.html settings flyout theme section now has three items: System (active when themeMode==='system'), Light (active when theme==='light' && themeMode==='explicit'), Dark (active when theme==='dark' && themeMode==='explicit'). The footer language dropdown gained a System item at the top (checked when langMode==='system') and all other language items now gate their checked state on `langMode==='explicit'` to avoid ambiguous simultaneous highlighting. The system-follow-preferences spec gained a full 'live follow and override' describe block with 9 new tests: explicit dark override switches themeMode to explicit; setTheme('system') returns to OS immediately; OS color scheme change propagates live in system mode; OS change is ignored in explicit mode; setLang('fr') persists langMode=explicit; setLang('system') returns to navigator language; setTheme with invalid string leaves state unchanged; setLang with unsupported code leaves state unchanged; full system→explicit→system round-trip keeps URL clean.

## Verification

Ran `npm --prefix .tests run test -- --reporter=line e2e/system-follow-preferences.spec.js` — 25 passed (15.7s), covering all T01 regression tests plus 9 new T02 live-follow/override tests. Ran `npm --prefix .tests run test -- --reporter=line smoke/dark-mode.spec.js` — 2 passed, 1 expected failure: the `?theme=dark` URL-param setup test fails as documented in T01 because URL params no longer drive app state; T03 will update the smoke suite to use in-app state setup.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm --prefix .tests run test -- --reporter=line e2e/system-follow-preferences.spec.js` | 0 | ✅ pass | 15700ms |
| 2 | `npm --prefix .tests run test -- --reporter=line smoke/dark-mode.spec.js` | 1 | ❌ 1 expected fail (T03 responsibility) / 2 pass | 10400ms |

## Deviations

none

## Known Issues

smoke/dark-mode.spec.js test 1 ('data-bs-theme attribute is set in dark mode') fails because it navigates to /?theme=dark but the early-apply script in index.html still reacts to that param before Vue mounts, then Vue overrides it to the system-preference-based theme. T03 will update the smoke suite to seed state via localStorage instead of URL params.

## Files Created/Modified

- `site/js/vue/methods/lifecycle.js`
- `site/js/vue/methods/rail.js`
- `site/js/vue/i18n/lang.js`
- `site/index.html`
- `.tests/e2e/system-follow-preferences.spec.js`
