---
estimated_steps: 30
estimated_files: 5
skills_used:
  - best-practices
  - test
---

# T02: Wire live system-follow listeners and UI controls for theme/language override + return-to-system

## Skills Used

- `best-practices`
- `test`

Why this task exists
- R107/R108 are user-facing behavior requirements: system-follow must react live and allow explicit override with a path back to system.
- S01 already moved mutations into lifecycle methods; this task extends that seam rather than creating parallel state logic.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `window.matchMedia('(prefers-color-scheme: dark)')` listener | Keep last applied theme and expose failing assertion in system-follow tests. | N/A | Ignore malformed media event payload; recompute from current query `.matches`. |
| `window.languagechange` + navigator language data | Retain current locale and log fallback reason when no supported language can be resolved. | N/A | Normalize malformed language tokens to two-letter lowercase and fall back to `en`. |
| Vue UI controls (`site/index.html` menus and toggles) | Prevent hard navigation and keep controls functional in explicit mode. | N/A | Reject invalid mode/action inputs (`setTheme('invalid')`, `setLang('xx')`) without mutating state. |

## Load Profile

- **Shared resources**: document/body theme classes, i18n locale state, and localStorage preference writes.
- **Per-operation cost**: O(1) per toggle/event with no network dependency.
- **10x breakpoint**: rapid mode flips can produce stale listeners if registration/cleanup is not idempotent.

## Negative Tests

- **Malformed inputs**: invalid mode strings and unsupported language codes are ignored safely.
- **Error paths**: missing `matchMedia` support path degrades gracefully to explicit/default theme handling.
- **Boundary conditions**: returning to `system` after explicit override resumes live follow immediately.

## Steps

1. Extend `site/js/vue/methods/lifecycle.js` with mode-aware setters (theme and language), plus helper methods to compute effective state from `system` mode.
2. Register and manage live listeners for system theme and system language changes in lifecycle flow, ensuring idempotent attachment across refreshes.
3. Update `site/js/vue/methods/rail.js` dark toggle behavior so it works coherently when current mode is `system` (explicit override action stays deterministic).
4. Update `site/index.html` controls to expose `System` options for language and theme and visually indicate active mode/override.
5. Update language label resources (single shared source) as needed so the new system option renders consistently.

## Must-Haves

- [ ] Theme can be `system`, `light`, or `dark`; system mode follows OS changes live.
- [ ] Language can be `system` or explicit supported locale; system mode reacts to `languagechange`.
- [ ] Users can switch to explicit modes and return to system mode without reload.

## Inputs

- `site/js/vue/methods/lifecycle.js`
- `site/js/vue/methods/rail.js`
- `site/index.html`
- `site/js/vue/i18n/lang.js`
- `.tests/e2e/system-follow-preferences.spec.js`
- `site/js/service/StorageLocal.js`
- `site/js/Application.js`

## Expected Output

- `site/js/vue/methods/lifecycle.js`
- `site/js/vue/methods/rail.js`
- `site/index.html`
- `site/js/vue/i18n/lang.js`
- `.tests/e2e/system-follow-preferences.spec.js`

## Verification

npm --prefix .tests run test -- --reporter=line e2e/system-follow-preferences.spec.js smoke/dark-mode.spec.js

## Observability Impact

- Signals added/changed: mode/effective state transition logs for theme and language updates.
- How a future agent inspects this: check `prefs:${userKey}` and DOM/i18n state after dispatching media/language events in Playwright.
- Failure state exposed: stale listener registration and mode/effective mismatches surface in dedicated assertions.
