
# M013/S02 — Research

**Date:** 2026-04-16

## Summary

This research outlines the plan for implementing Slice S02, which focuses on removing the last remnants of URL-driven state and introducing "system-follow" modes for language and theme. S01 has already provided the necessary `userKey`-based persistence layer and basic in-app state mutation methods for theme and language. This slice will build on that foundation to make the app's behavior more aligned with modern web application standards, where the app state is not reflected in the URL for every change, and the UI can dynamically adapt to the user's operating system preferences.

The primary implementation path involves using standard browser APIs: `window.matchMedia('(prefers-color-scheme: dark)')` for live theme detection and the `window.languagechange` event for language. The user's preference for each will be stored in `localStorage` and can be one of three states: `'system'` (the default), or an explicit override (e.g., `'light'`/`'dark'` for theme, `'en'`/`'es'` for language).

## Recommendation

The implementation should be broken down by feature to manage complexity. First, update the storage layer in `StorageLocal.js` to model the new three-state preferences. This is the foundational step. Second, implement the theme system-follow logic, including the `matchMedia` listener and UI updates to allow the user to select 'System', 'Light', or 'Dark'. Third, implement the language system-follow logic, which involves handling the `languagechange` event, mapping browser languages to supported app languages, and updating the language selection UI. Finally, add comprehensive E2E tests to verify both the clean URL behavior and the new dynamic system-following capabilities.

## Implementation Landscape

### Key Files

-   `site/js/service/StorageLocal.js` — The preference schema in `getDefaultLocalPreferences` must be extended to support `'system'` as a default value for `theme` and `lang`. `setLocalPreferences` will persist the user's choice.
-   `site/js/Application.js` — This will orchestrate the initial setup. On boot, it will read the user's preferences and either apply the explicit value or set up the system-follow listeners.
-   `site/js/vue/methods/lifecycle.js` — The existing `setTheme` and `setLang` methods from S01 need to be enhanced to handle the `'system'` value and user overrides. New private methods will contain the listener logic (e.g., `handleSystemThemeChange`, `handleSystemLanguageChange`) and their registration.
-   `site/index.html` (from `.compose/fragments/nav.html`) — The UI controls for theme and language must be updated to present the "System" option and allow switching between system-follow and explicit overrides.
-   `.tests/e2e/` — A new spec file, `system-prefs.spec.js`, should be created to test the dynamic behavior of theme and language switching in response to system changes.

### Build Order

1.  **Persistence Layer:** Update `StorageLocal.js` first to establish the data contract. This is a dependency for all other logic.
2.  **Theme Logic:** Implement theme system-follow. It is self-contained and uses a well-supported browser API, making it a good second step to prove the overall pattern.
3.  **Language Logic:** Implement language system-follow. This is slightly more complex due to the need for language code mapping, so it should follow the theme implementation.
4.  **Verification:** Write E2E tests last, once the features are implemented, to cover all new behaviors and prevent regressions.

### Verification Approach

-   Manual verification by changing OS-level theme and language settings and observing the app's live response.
-   Automated E2E tests using Playwright:
    -   For theme: `page.emulateMedia({ colorScheme: 'dark' })` can reliably simulate system changes.
    -   For language: Automating this is trickier. It will likely require mocking `navigator.language` using `context.addInitScript()` and then manually dispatching a `languagechange` event on the `window` object.
    -   For clean URLs: The existing `clean-url-navigation.spec.js` from S01 will be run, and potentially extended to cover more year-switching scenarios to ensure no regressions.

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---|---|---|
| Detecting system theme changes | `window.matchMedia('(prefers-color-scheme: dark)')` | This is the standard, event-driven browser API for this purpose. It's efficient and requires no polling. |
| Detecting system language changes | `window.addEventListener('languagechange', ...)` | This is the standard, event-driven browser API. It's better than polling `navigator.language`. |
