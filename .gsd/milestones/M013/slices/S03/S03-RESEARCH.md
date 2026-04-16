
# S03: Legacy Surface Removal (Share + Feature Flags) — Research

**Date:** 2026-04-16

## Summary

This slice is a straightforward removal of two legacy features: the URL-based planner sharing mechanism (`?share=...`) and the hidden feature-flagging system. The work involves deleting logic from the Vue model and service layers, removing the corresponding modals and UI controls from the HTML templates, and then verifying their complete removal with new tests and grep gates.

The analysis confirms these systems are well-encapsulated and can be removed without affecting core planner functionality. The completion of S01, which removed `uid`-based identity, has already de-risked this work by simplifying the surrounding state and persistence logic.

## Recommendation

Proceed with the direct and complete removal of all identified files and code blocks related to the Share and Feature Flag systems. The implementation should first remove the underlying logic from the model and services, then remove the UI components from the `.compose` templates, and finally add verification to prevent regression.

## Implementation Landscape

### Key Files

-   **`site/js/vue/model-features.js`**: Delete this file. It contains the legacy feature flag definitions.
-   **`site/js/vue/model.js`**: Remove the import and composition of `model-features.js` from the main Vue model.
-   **`site/js/service/Storage.js`**: Remove the `getExportString()` and `setModelFromImportString()` methods, which handle the LZ-string compression for the share feature.
-   **`site/js/Application.js`**: Remove the logic block that checks for and processes the `?share` URL parameter during application bootstrap.
-   **`.compose/fragments/modals/share.html`**: Delete this file.
-   **`.compose/fragments/modals/feature.html`**: Delete this file.
-   **`.compose/fragments/modals.html`**: Remove the `m4_include` directives for `share.html` and `feature.html`.
-   **`.compose/fragments/rail.html`**: Remove the "Share" button and its associated `v-on:click` handler from the rail UI.
-   **`site/js/vue/i18n/*.js`**: Remove any now-unused translation strings related to "Share" or "Feature" modals.

### Build Order

1.  **Remove Model & Service Logic**: First, delete `site/js/vue/model-features.js` and remove the related methods from `Storage.js` and `Application.js`. This ensures the runtime foundation of the features is removed before the UI.
2.  **Remove UI Templates**: Second, delete the modal files (`share.html`, `feature.html`) and remove their includes from `modals.html`. Remove the share button from `rail.html`.
3.  **Re-compose HTML**: Run the `.compose/build.sh` script to ensure the static `site/index.html` is regenerated without the removed UI components.
4.  **Verification**: Finally, create and run the new verification tests and grep gates to confirm complete removal.

### Verification Approach

-   **Full Regression**: Run the entire existing E2E and smoke test suites to ensure no core functionality has been broken.
-   **New Test Spec (`legacy-surface-removal.spec.js`)**:
    -   Assert that the share button and feature modal trigger elements are not present in the DOM.
    -   Attempt to navigate to `/?share=...` and verify that the app ignores the parameter and loads a default planner, rather than attempting an import.
-   **New Grep Gate (`scripts/verify-no-legacy-share-features.sh`)**:
    -   Create a script that fails if it finds residue of the removed features, such as `model-features.js`, `getExportString`, `setModelFromImportString`, or `share.html`. This will prevent their accidental reintroduction.
