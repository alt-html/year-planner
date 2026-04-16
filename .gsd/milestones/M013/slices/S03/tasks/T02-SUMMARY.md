---
id: T02
parent: S03
milestone: M013
key_files:
  - .compose/fragments/modals.html
  - .compose/fragments/rail.html
  - .compose/fragments/footer.html
  - .compose/fragments/grid.html
  - site/js/vue/model.js
  - site/js/config/contexts.js
  - site/js/vue/model/ui.js
  - site/js/vue/methods/rail.js
  - scripts/verify-no-legacy-share-features.sh
  - .tests/e2e/legacy-surface-removal.spec.js
  - .tests/smoke/compose.spec.js
  - .tests/e2e/bs5-migration.spec.js
key_decisions:
  - Replaced feature.signin conditionals with direct signedin checks in rail settings flyout rather than removing the auth UI elements — auth controls are a retained feature, only the feature-flag gate is removed
  - Updated bs5-migration.spec.js MIG-04 to target deleteModal (which has btn-close) instead of the removed shareModal — keeps the BS5 btn-close regression test alive on a real remaining modal
  - Removed MIG-12 featureModal tests from bs5-migration.spec.js in T02 rather than deferring to T03 — the modal is gone so the tests would never pass
duration: 
verification_result: passed
completed_at: 2026-04-16T06:11:52.951Z
blocker_discovered: false
---

# T02: Removed feature-flag and share UI surfaces from compose fragments and Vue bindings; created verify script and legacy-surface-removal e2e tests

**Removed feature-flag and share UI surfaces from compose fragments and Vue bindings; created verify script and legacy-surface-removal e2e tests**

## What Happened

Removed all share and feature-flag visible surfaces across compose fragments, Vue model, and Vue methods:

1. **.compose/fragments/modals.html** — removed `m4_include` directives for `modals/share.html` and `modals/feature.html`.

2. **.compose/fragments/modals/share.html** — deleted.

3. **.compose/fragments/modals/feature.html** — deleted.

4. **.compose/fragments/rail.html** — removed Share button from top rail (`<button title="Share" v-on:click="sharePlanner()">`), removed Share flyout item (`sharePlanner(); toggleFlyout(null)`), and replaced all `feature.signin &&` conditionals in the settings flyout with direct `signedin` checks so auth controls remain fully functional without the feature-flag layer.

5. **.compose/fragments/footer.html** — removed the hidden feature trigger span (`<span v-on:click="showFeatureModal = true">&nbsp;</span>`) from the copyright line; replaced with plain static text.

6. **.compose/fragments/grid.html** — removed the entire `v-if="feature.debug"` responsive breakpoint debug block (11 lines).

7. **site/js/vue/model.js** — removed `import { feature }` from `./model-features.js` and the `feature: feature` property from the model object.

8. **site/js/config/contexts.js** — removed `import { feature }` from `../vue/model-features.js` and the `{ name: 'feature', Reference: feature }` CDI singleton registration.

9. **site/js/vue/model/ui.js** — removed `showFeatureModal: false` from the UI state object.

10. **site/js/vue/methods/rail.js** — removed the `closeFeatureModal()` method.

11. **site/js/vue/model-features.js** — deleted the entire file (exported `feature` object and `ftoggle` helper — now unreferenced everywhere).

12. **scripts/verify-no-legacy-share-features.sh** — created grep-gate script checking compose fragments and Vue runtime for all forbidden share/feature symbols and verifying deleted files are absent.

13. **.tests/e2e/legacy-surface-removal.spec.js** — created 5 Playwright assertions: no Share rail button, no `#shareModal` in DOM, no `#featureModal` in DOM, no `showFeatureModal` in footer HTML, sign-in button still visible via direct `signedin` check.

14. **.tests/smoke/compose.spec.js** — updated fragment existence checks to reflect that `share.html` and `feature.html` are now absent (positive assertions for their removal).

15. **.tests/e2e/bs5-migration.spec.js** — updated MIG-04 to use `deleteModal` (which has a `btn-close`) instead of the removed `shareModal`; removed MIG-12 featureModal tests entirely.

Compose build produced a valid 625-line `site/index.html` (down from 695 lines in T01, reflecting the removed modal markup).

## Verification

T02 verification grep gate: `bash -lc '! rg -n "feature\\.|showFeatureModal|featureModal|showShareModal|shareModal|sharePlanner\\(" .compose/fragments site/js/vue site/js/config/contexts.js'` → exit 0, no output.

Verify script: `bash scripts/verify-no-legacy-share-features.sh` → exit 0, "✅ No forbidden share/feature surfaces found."

Compose build: `bash .compose/build.sh` → exit 0, "site/index.html composed from .compose/ fragments (625 lines)".

All three slice-level test suites: `npx playwright test --reporter=line smoke/compose.spec.js e2e/legacy-surface-removal.spec.js e2e/bs5-migration.spec.js` → 12/12 passed.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash -lc '! rg -n "feature\\.|showFeatureModal|featureModal|showShareModal|shareModal|sharePlanner\\(" .compose/fragments site/js/vue site/js/config/contexts.js'` | 0 | ✅ pass | 50ms |
| 2 | `bash scripts/verify-no-legacy-share-features.sh` | 0 | ✅ pass | 80ms |
| 3 | `bash .compose/build.sh` | 0 | ✅ pass (625 lines) | 600ms |
| 4 | `npm --prefix .tests run test -- --reporter=line smoke/compose.spec.js e2e/legacy-surface-removal.spec.js e2e/bs5-migration.spec.js` | 0 | ✅ pass (12/12) | 4500ms |

## Deviations

Updated .tests/smoke/compose.spec.js and .tests/e2e/bs5-migration.spec.js which were not in T02 Inputs/Outputs — required because those specs had hardcoded references to share.html, feature.html, and the feature/share modals that would have caused the slice verification suite to fail. Also created scripts/verify-no-legacy-share-features.sh which is a slice-level artifact needed by the slice verification commands.

## Known Issues

none

## Files Created/Modified

- `.compose/fragments/modals.html`
- `.compose/fragments/rail.html`
- `.compose/fragments/footer.html`
- `.compose/fragments/grid.html`
- `site/js/vue/model.js`
- `site/js/config/contexts.js`
- `site/js/vue/model/ui.js`
- `site/js/vue/methods/rail.js`
- `scripts/verify-no-legacy-share-features.sh`
- `.tests/e2e/legacy-surface-removal.spec.js`
- `.tests/smoke/compose.spec.js`
- `.tests/e2e/bs5-migration.spec.js`
