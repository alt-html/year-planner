
# S01: Identity & Storage Contract Cleanup — Research

**Date:** 2026-04-16

## Summary

This research outlines the plan to remove the legacy numeric `uid` identifier from the application, as required by R104. The `uid` is deeply integrated into application startup, storage, state management, and UI templates, primarily for managing user preferences and constructing stateful URLs. This legacy pattern is now redundant and conflicts with the modern `jsmdma` architecture, which uses a `userKey` (for the owner) and document `uuid`s (for planners).

The core of this slice is a systematic, bottom-up refactoring. We will first change the data storage contract in `StorageLocal.js` to key preferences by `userKey`. Then, we will update the application's core logic in `Application.js` to initialize state from `localStorage` using the `userKey`, decoupling it from URL parameters. Finally, we will convert all URL-based navigation in the UI into in-app state changes. This approach ensures that the foundational data layer is correct before updating the logic and UI that depend on it.

## Recommendation

The recommendation is to proceed with a three-stage refactoring:
1.  **Data Layer:** Modify the storage contract to use `userKey` for preferences.
2.  **Logic Layer:** Update application and state management to use the new storage contract and identity model.
3.  **Presentation Layer:** Replace all stateful `href` links with `@click` handlers that trigger internal state changes.

This ensures a clean and complete removal of the `uid` concept, aligning the application with its intended jsmdma architecture and satisfying the requirements of this slice.

## Implementation Landscape

### Key Files

-   `site/js/service/StorageLocal.js`: This is the heart of the legacy storage contract. The functions `getLocalPreferences`, `setLocalPreferences`, and the `migrate` function are all keyed to the numeric `uid`. These must be refactored to use the string `userKey`. The entire concept of the `identities` map (`getLocalIdentities`, `getLocalIdentity`) should be removed, as it is superseded by the planner document's `meta.userKey` field.
-   `site/js/Application.js`: The application entry point. It currently reads `uid` from the URL to initialize the user's session, preferences, and identity. This logic must be removed. Instead, it should establish the `userKey` via `ClientAuthSession.getUserUuid() || DeviceSession.getDeviceId()`, load preferences using this key, and restore the last active planner document via `plannerStore`.
-   `site/index.html`: The main HTML file contains numerous `<a>` tags that construct URLs with `uid` for changing the year, language, and theme (e.g., `/?uid={{uid}}&year={{year-1}}`). These must all be converted to use `v-on:click` handlers that call Vue methods to update the application state directly, without a full page reload.
-   `site/js/vue/model/planner.js`: The `uid` property is explicitly defined here as a legacy concept. This property should be removed from the model once it's no longer used by the application logic.
-   `site/js/vue/methods/*.js`: Several method files (`planner.js`, `calendar.js`, `lifecycle.js`) contain logic that depends on `this.uid`. These will need to be updated to use `this.userKey` for user-specific actions or `this.activeDocUuid` for document-specific actions.

### Build Order

1.  **Modify Storage Contract (Bottom-up):** The first step is to change the data layer. Edit `site/js/service/StorageLocal.js` to key preferences on `userKey`. Remove the now-obsolete `identities` map logic. This ensures any new code is built on the correct foundation. The schema file `site/js/service/storage-schema.js` will also need updating.
2.  **Update Core App Logic:** Modify `site/js/Application.js` to ignore the `uid` URL parameter and instead initialize the application state from the `userKey` derived from the session. This severs the primary dependency on the old identity model.
3.  **Refactor UI Interactions:** Go through `site/index.html` and the Vue methods in `site/js/vue/methods/` to replace all URL-based state changes with method calls that manipulate the Vue model directly. This is the most extensive part of the change.
4.  **Final Cleanup:** After the application is functional with the new model, perform a final search for `uid` across the project and remove any remaining properties (like in `site/js/vue/model/planner.js`), comments, or dead code.

### Verification Approach

-   **Existing Tests:** Run the full existing Playwright suites (`smoke/` and `e2e/`) to ensure no regressions in core functionality.
-   **Grep Gate:** As per requirement R109, the final step must be a verification that `uid` has been purged from the active codebase. The command `rg "\buid\b"` should return no results in the `site/` directory, with the exception of historical documents in `docs/`.
-   **Manual UAT:**
    1.  Load the application with a clean URL (`http://localhost:8080`). It should create a new planner and function correctly.
    2.  Navigate between years, change themes, and change languages. The URL should remain clean, and the app state should update without page reloads.
    3.  Create a second planner document. Switch between the two planners. The application should correctly show the active planner's state.
