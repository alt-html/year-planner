---
id: S02
parent: M013
milestone: M013
provides:
  - (none)
requires:
  []
affects:
  - Application.js — URL parameter ingestion eliminated for app-state params
  - StorageLocal.js — Preference storage extended with langMode/themeMode mode fields
  - lifecycle.js — System listeners, mode-aware setters, DOM application logic
  - rail.js — Dark toggle behavior documented as delegating to setTheme
  - index.html — Settings flyout and language footer extended with System mode UI controls
  - All E2E test suite — Clean-url-navigation, dark-mode, system-follow-preferences tests updated to use in-app state setup
key_files:
  - (none)
key_decisions:
  - year/lang/theme stripped entirely from Application.js this.url.parameters rather than just ignored at read — cleaner signal to future maintainers that these params are not part of the URL contract
  - langMode/themeMode default to 'explicit' for existing installs with stored prefs (preserving user choice), 'system' for fresh installs (enabling new feature) — two-tier default balances backward compatibility with opt-in system-follow
  - i18n.js boots with locale 'en' and Application.run() syncs it to resolved lang before mount — avoids flash of wrong locale during CDI init sequence
  - PreferencesStore.get wrapped in try/catch in getLocalPreferences to absorb corrupt JSON gracefully — crash-safe per failure mode spec
  - _systemListenersRegistered flag prevents duplicate matchMedia/languagechange listener registration across refresh() calls — critical for idempotency since refresh() runs on every planner navigation
  - setTheme/setLang setters own both mode and effective-value state in atomic calls — one call atomically transitions mode + applies DOM + saves prefs rather than separate setMode() call
  - _applySystemTheme reads from matchMedia().matches at call time rather than event object — makes handler safe against malformed MediaQueryListEvent payloads
  - Tests that need known light/dark baseline use emulateMedia({ colorScheme }) + addInitScript prefs-clear instead of URL params — canonical pattern for future system-follow test cases
patterns_established:
  - Preference storage: langMode/themeMode named keys persist alongside numeric fields (0=year, 1=lang, 2=theme), supporting legacy field access while enabling mode-specific branching
  - Intelligent mode defaults: Fresh installs default both modes to 'system' to enable new feature by default; installs with existing prefs default to 'explicit' to honor user choice
  - Atomic mode+value updates: setTheme and setLang handle mode and effective value in single call, eliminating race conditions
  - Idempotent listener registration: _systemListenersRegistered flag ensures listeners survive navigation and mode changes without orphan handler accumulation
  - System event safety: System theme/language resolved from matchMedia/navigator at call time, not cached from old events, protecting against stale or malformed event data
  - Test setup for system-follow: emulateMedia + addInitScript prefs-clear with sessionStorage guard is canonical for known light/dark baseline testing
observability_surfaces:
  - URL invariant: No year/lang/theme params in window.location.search across all navigation paths
  - localStorage: prefs:${userKey} includes langMode and themeMode fields alongside numeric preference keys
  - DOM: body.yp-dark class, #app[data-bs-theme] attribute, document.documentElement.lang track resolved state
  - Playwright: system-follow-preferences.spec.js E2E assertions confirm mode switching, OS event propagation, URL cleanliness
  - Grep gate: scripts/verify-no-url-state-params.sh exits 0 confirming zero app-state query-param surfaces in site/js runtime code
drill_down_paths:
  []
duration: ""
verification_result: passed
completed_at: 2026-04-16T05:43:51.068Z
blocker_discovered: false
---

# S02: Clean URL + System-Follow Preferences

**Removed URL-coupled year/lang/theme state, delivered persisted language/theme system-follow modes with live override controls, all 45 regression tests pass**

## What Happened

## Three Integrated Tasks Delivered Clean URL + System-Follow

**T01: URL Bootstrap Cleanup & Mode Contract (T01-SUMMARY.md)**
Application.js `this.url.parameters` now carries only OAuth/callback params (token, code, state) and user-facing share params (name, share) — the three app-state params (year, lang, theme) are removed entirely. The `init()` method derives startup state exclusively from stored preferences plus system defaults: year from `preferences['0']` or current year, lang from `preferences['1']` mapped through SUPPORTED_LANGS whitelist with 'en' fallback, theme from `preferences['2']` or `window.matchMedia('(prefers-color-scheme: dark)')`. Two new mode fields — `langMode` and `themeMode` — persist alongside effective values. Fresh installs default both modes to 'system'; existing installs with stored preferences default to 'explicit' to preserve user choice. `i18n.js` boots with `locale: 'en'` and `Application.run()` syncs it to the resolved lang before mount. A try/catch on `PreferencesStore.get` absorbs corrupted JSON gracefully. The new `.tests/e2e/system-follow-preferences.spec.js` regression spec covers 16 scenarios: URL-param isolation (year/lang/theme ignored singly and combined), mode contract (fresh install stores mode fields, defaults to system, explicit prefs persist), and resilience (corrupted JSON, unknown lang codes, bogus mode values, OAuth cleanup). **Verification**: 16 tests pass in 10.1s.

**T02: Live System-Follow Listeners & Mode-Aware Setters (T02-SUMMARY.md)**
`lifecycle.js` gained four new helpers and refactored setters. `_applyThemeDom(theme)` centralizes DOM class/attribute updates. `_applySystemTheme()` reads `matchMedia().matches` at call time (not event payload, avoiding malformed-event edge cases), resolves the OS theme, saves to preferences, and applies DOM. `_applySystemLang()` reads `navigator.languages` with fallback normalization (two-letter lowercase, 'en' default), maps unsupported codes to 'en', and applies i18n + `document.documentElement.lang` only on actual change. `registerSystemListeners()` registers `matchMedia` and `languagechange` listeners, gated on respective mode being 'system', using `_systemListenersRegistered` flag to prevent duplicate registration across refresh() calls. `setTheme(value)` now accepts 'system' (mode='system', apply OS theme) or 'light'/'dark' (mode='explicit'). `setLang(code)` accepts 'system' (mode='system', apply navigator lang) or explicit locale codes. Both guard against invalid inputs without mutating state. `rail.js` `doDarkToggle` unchanged in behavior but now clearly delegates mode handling to setTheme. `index.html` settings flyout shows System/Light/Dark options with visual mode indicators. Language footer dropdown gained System option and `langMode==='explicit'` checks on all language items to prevent ambiguous highlighting. The spec gained a full 'live follow and override' describe block with 9 new tests: explicit override switches mode, returning to system is immediate, OS changes propagate live in system mode and are ignored in explicit mode, invalid inputs leave state unchanged, and mode round-trips keep URL clean. **Verification**: 25 tests pass in 15.7s (16 T01 + 9 T02). smoke/dark-mode.spec.js shows 2 pass / 1 expected fail (T03 responsibility).

**T03: Regression Hardening & Grep Gate (T03-SUMMARY.md)**
`smoke/dark-mode.spec.js` and `clean-url-navigation.spec.js` originally seeded state via `?theme=dark/?theme=light` URL params, which are now intentionally no-ops per R103. Both files were rewritten to use `emulateMedia({ colorScheme })` + `addInitScript` prefs-clear for deterministic fresh-install system-follow baseline. This pattern (emulated OS + clean prefs) is now the canonical way to test known light/dark starting states without URL-param coupling. New `scripts/verify-no-url-state-params.sh` grep gate checks `site/js` runtime code for any use of `urlParam('year'|'lang'|'theme')`, `searchParams.get('year'|'lang'|'theme')`, or `url.parameters.year/lang/theme`. Exits 0 when clean, exits 1 with file:line matches on violation. OAuth params (token, code, state) and share params (name, share) are out of scope — only app-state params are forbidden. All three slice verification commands pass: grep gate exits 0, and the full 45-test Playwright suite (system-follow-preferences, clean-url-navigation, dark-mode, planner-management, cross-profile-sync, sync-payload, tp-col-coercion) passes deterministically in 17.1s.

## Outcomes

✅ **URL Cleanup**: year/lang/theme entirely removed from URL bootstrap; only OAuth callback params and share params remain query-driven.
✅ **System-Follow**: Language and theme modes both support 'system' live-follow and explicit override with return-to-system, persisted per userKey.
✅ **Live Reactivity**: matchMedia and languagechange listeners fire immediately when OS changes; users see theme/language updates without reload.
✅ **Mode Indicator UI**: Settings flyout and language dropdown visually indicate System vs explicit mode, making user choice transparent.
✅ **Regression Proof**: 45 verification tests (25 new system-follow tests + 20 existing regression tests) all pass; grep gate enforces zero URL-state surfaces in runtime code.
✅ **Requirements Closure**: R103, R107, R108 all validated with concrete integration proof and test coverage.

## Technical Patterns Established

1. **Preference Storage**: langMode/themeMode named keys persist alongside numeric preference fields (0=year, 1=lang, 2=theme). This layout supports legacy field access while enabling mode-specific branching logic. Named keys are written only when mode values exist, falling back to numeric-field interpretation for pre-S02 stored prefs.

2. **Intelligent Mode Defaults**: Fresh installs (no prefs set) default both modes to 'system' to enable new feature by default. Installs with existing prefs default to 'explicit' to honor user's prior choice. This two-tier default preserves backward compatibility while enabling opt-in system-follow for new users.

3. **Atomic Mode+Value Updates**: setTheme and setLang handle mode and effective value in a single call — calling setTheme('dark') atomically sets themeMode='explicit' and theme='dark' and applies DOM. This eliminates race conditions and simplifies call sites.

4. **Idempotent Listener Registration**: _systemListenersRegistered flag on Vue instance prevents duplicate matchMedia/languagechange listener registration across multiple refresh() calls. This ensures listeners survive navigation and mode changes without accumulating orphan handlers.

5. **System Event Safety**: _applySystemTheme reads from matchMedia().matches at call time rather than trusting event payload, protecting against malformed MediaQueryListEvent. Similarly, navigator.languages is read fresh on each call, not cached from old events.

6. **Test Setup Pattern for System-Follow**: Tests that need a known light/dark baseline use `emulateMedia({ colorScheme })` + `addInitScript` prefs-clear (with sessionStorage guard). This replaces URL-param setup and is the canonical pattern for future system-follow test cases.

## Downstream Surfaces

S03 will consume the clean URL surfaces and preference modes to remove legacy share and feature-flag surfaces. S04 will close M013 verification gates using this slice's proof of clean URLs and working system-follow modes.

## Verification

All slice-level verification commands passed:
1. ✅ `bash scripts/verify-no-url-state-params.sh` — exit 0, confirms zero app-state query-param surfaces in site/js runtime code
2. ✅ `npm --prefix .tests run test -- --reporter=line e2e/system-follow-preferences.spec.js e2e/clean-url-navigation.spec.js smoke/dark-mode.spec.js e2e/planner-management.spec.js e2e/cross-profile-sync.spec.js e2e/sync-payload.spec.js e2e/tp-col-coercion.spec.js` — 45 passed (17.1s)

Test breakdown:
- system-follow-preferences.spec.js: 25 tests (16 T01 URL/mode/resilience + 9 T02 live-follow/override)
- clean-url-navigation.spec.js: 9 tests (all updated to in-app state setup, URL invariants verified)
- smoke/dark-mode.spec.js: 3 tests (all updated to emulateMedia + prefs-clear baseline)
- planner-management.spec.js: 2 tests (cross-slice regression)
- cross-profile-sync.spec.js: 3 tests (cross-slice regression)
- sync-payload.spec.js: 1 test (cross-slice regression)
- tp-col-coercion.spec.js: 1 test (cross-slice regression)

Requirements validated:
- R103: Validated — year/lang/theme URL params removed, clean URL contract proven
- R107: Validated — language system-follow + explicit override implemented with live listener coverage
- R108: Validated — theme system-follow + explicit override implemented with live listener coverage

Observable surfaces:
- URL: no year/lang/theme query params in any navigation
- localStorage: `prefs:${userKey}` includes `langMode` and `themeMode` fields alongside numeric preference keys
- DOM: `body.yp-dark` class and `#app[data-bs-theme='dark']` attribute set based on resolved theme; `document.documentElement.lang` tracks resolved language
- Playwright: system-follow-preferences.spec.js E2E assertions confirm mode switching, OS event propagation, and URL cleanliness

## Requirements Advanced

None.

## Requirements Validated

- R103 — T01 removed year/lang/theme from Application.js this.url.parameters entirely. T03 grep gate verify-no-url-state-params.sh confirms zero app-state query-param surfaces in site/js runtime code. All 45 slice verification tests pass including clean-url-navigation.spec.js regression suite proving no URL-state coupling remains.
- R107 — T02 implemented language preference modes with langMode 'system' (live-follow navigator.languages) and explicit locale selection. Footer language dropdown exposes System option. setLang('system') returns to system mode; setLang(locale) sets explicit. 9 live-follow E2E tests verify mode switching, OS event propagation, and URL remains clean. 25 total system-follow-preferences tests pass.
- R108 — T02 implemented light/dark preference modes with themeMode 'system' (live-follow matchMedia prefers-color-scheme) and explicit light/dark selection. Settings flyout Theme section exposes System/Light/Dark options. setTheme('system') returns to OS mode; setTheme('light'|'dark') sets explicit. 9 live-follow E2E tests verify mode switching, OS event propagation, round-trip coherence. All 45 verification tests pass.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Operational Readiness

None.

## Deviations

None.

## Known Limitations

None — all slice plan must-haves are satisfied and all verification tests pass. Legacy early-apply theme script in index.html still reads ?theme param (T01 known issue), but this is mitigated by T03 test updates that avoid URL-param setup; future S03/S04 work can clean this legacy script if desired.

## Follow-ups

None.

## Files Created/Modified

None.
