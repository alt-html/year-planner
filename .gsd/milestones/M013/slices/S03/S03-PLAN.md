# S03: Legacy Surface Removal (Share + Feature Flags)

**Goal:** Remove all legacy share and feature-flag runtime/UI surfaces so planner behavior is fully in-app without `?share` import/export plumbing or hidden feature controls.
**Demo:** After this: no legacy share or feature-flag surfaces remain in UI/runtime; no dead share or hidden feature controls are visible.

## Must-Haves

- R105: No runtime code ingests `?share=` or uses LZ-based share import/export helpers; no share modal/button remains in composed UI.
- R106: Feature-flag model, modal, hidden trigger, and `feature.*` conditional plumbing are removed from runtime/templates.
- Regression proof exists: targeted E2E + smoke updates and a grep gate fail on any reintroduction of share/feature legacy surfaces.

## Threat Surface

- **Abuse**: `?share=` payload tampering path is removed; no runtime import parser should remain.
- **Data exposure**: share URL copy/export path is removed, reducing accidental planner-data leakage via URLs.
- **Input trust**: untrusted query input from `share` is ignored/unsupported after cleanup.

## Requirement Impact

- **Requirements touched**: `R105`, `R106` (primary); `R109` (supporting proof expectations).
- **Re-verify after shipping**: bootstrap behavior, modal/rail UI surfaces, compose output parity, and regression specs for removed selectors.
- **Decisions revisited**: `D023` (remove legacy share now), `D025` (direct cleanup without back-compat scaffolding).

## Proof Level

- This slice proves: integration
- Real runtime required: yes
- Human/UAT required: no

## Integration Closure

This slice removes legacy surfaces across Application bootstrap, Vue state/methods, and compose templates, then re-composes `site/index.html` and updates tests/gates. Milestone-level closure remains in S04 for full-pack validation and requirement close-out.

## Verification

- `bash .compose/build.sh`
- `bash scripts/verify-no-legacy-share-features.sh`
- `npm --prefix .tests run test -- --reporter=line e2e/legacy-surface-removal.spec.js e2e/bs5-migration.spec.js smoke/compose.spec.js`

## Observability / Diagnostics

- Runtime signals: app boot ignores `?share=` and continues normal planner activation.
- Inspection surfaces: grep gate output, composed `site/index.html`, and focused Playwright assertions.
- Failure visibility: grep gate returns exact file:line matches; tests fail on specific missing/remaining selectors.
- Redaction constraints: inspect symbols and selectors only; do not log auth/token values.

## Tasks

- [x] **T01: Remove share URL/LZ runtime contract from bootstrap, services, and Vue planner state** `est:1h15m`
  Why: R105 is primarily a runtime-contract cleanup; legacy `?share=` ingestion and LZ import/export paths must be removed before UI deletion to avoid dead bootstrap paths.

## Skills Used
- `best-practices`
- `test`

## Steps
1. Remove `share` URL bootstrap handling from `site/js/Application.js` while preserving OAuth callback query handling.
2. Delete share import/export plumbing from `site/js/service/Storage.js` (`getExportString`, `setModelFromImportString`, and related LZ usage), and remove now-dead model/service coupling.
3. Remove share-specific Vue state/methods from planner/runtime surfaces (`shareUrl`, `_pendingImport`, `share`, `sharePlanner`, `copyUrl`) and dependent close handlers.
4. Remove unused runtime wiring introduced only for share plumbing from CDI/model surfaces if no callers remain.

## Must-Haves
- [ ] No runtime read path for `urlParam('share')` remains.
- [ ] No LZ share import/export helper remains in `Storage.js`.
- [ ] Vue planner state has no share-specific fields/methods.

## Failure Modes
| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Application bootstrap query parsing | Keep OAuth callback handling intact and fail tests if any app-state share ingestion remains | N/A | Ignore unknown query params and continue normal planner boot |
| Planner runtime state initialization | Preserve normal planner activation path and fail fast on missing active planner behavior | N/A | Treat missing legacy share payload as irrelevant; do not mutate state |
| Storage service wiring | Remove dead calls atomically so no runtime method-not-found errors occur | N/A | Reject malformed legacy payload paths by deleting parser entrypoint entirely |

## Load Profile
- Shared resources: app bootstrap path and planner activation flow.
- Per-operation cost: constant-time bootstrap parse and state init.
- 10x breakpoint: repeated reloads should not reintroduce divergent bootstrap behavior.

## Negative Tests
- Malformed inputs: `/?share=%%%` must not crash or alter planner state.
- Error paths: app must still boot with empty storage and no active planner.
- Boundary conditions: existing non-share query params for OAuth callbacks still work.
  - Files: `site/js/Application.js`, `site/js/service/Storage.js`, `site/js/vue/model/planner.js`, `site/js/vue/model/ui.js`, `site/js/vue/methods/planner.js`, `site/js/vue/methods/lifecycle.js`, `site/js/config/contexts.js`, `site/js/vue/model.js`
  - Verify: bash -lc '! rg -n "urlParam\(\x27share\x27\)|\?share=|getExportString|setModelFromImportString|sharePlanner\(|showShareModal|shareUrl|_pendingImport" site/js/Application.js site/js/service/Storage.js site/js/vue site/js/config/contexts.js'

- [ ] **T02: Remove feature-flag and share UI surfaces from compose fragments and Vue bindings** `est:1h20m`
  Why: R105/R106 require visible surface removal, not just hidden runtime plumbing; compose fragments and Vue bindings must no longer expose share/feature controls.

## Skills Used
- `frontend-design`
- `best-practices`

## Steps
1. Remove share and feature modal includes from `.compose/fragments/modals.html` and delete `.compose/fragments/modals/share.html` and `.compose/fragments/modals/feature.html`.
2. Remove share entry points from `.compose/fragments/rail.html` (top rail icon and flyout item), and replace feature-flag conditionals with direct signed-in checks where behavior remains.
3. Remove hidden feature trigger and feature-gated debug block from `.compose/fragments/footer.html` and `.compose/fragments/grid.html`.
4. Remove feature-flag data source (`site/js/vue/model-features.js`) plus imports/usages in `site/js/vue/model.js` and `site/js/config/contexts.js`.
5. Remove stale modal flags/close handlers tied only to deleted share/feature modals.

## Must-Haves
- [ ] No `feature.*` conditionals remain in compose/runtime code.
- [ ] No share/feature modal fragments are included or present.
- [ ] Generated UI no longer exposes share button/link or hidden feature trigger.

## Failure Modes
| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Compose fragment graph | Fail compose smoke test on missing/invalid include graph | N/A | N/A |
| Vue template bindings | Remove dead bindings in lockstep with model changes to avoid runtime undefined access | N/A | N/A |
| UI modal state | Remove deleted-modal state flags and close handlers to avoid no-op dead controls | N/A | N/A |

## Load Profile
- Shared resources: static template composition and Vue render path.
- Per-operation cost: static build + normal DOM render.
- 10x breakpoint: build-time drift between fragments and generated index if compose is not rerun.

## Negative Tests
- Malformed inputs: N/A (static template removal task).
- Error paths: stale `feature.*` binding should fail smoke/e2e selectors immediately.
- Boundary conditions: auth controls remain visible by signed-in state after feature-flag removal.
  - Files: `.compose/fragments/modals.html`, `.compose/fragments/modals/share.html`, `.compose/fragments/modals/feature.html`, `.compose/fragments/rail.html`, `.compose/fragments/footer.html`, `.compose/fragments/grid.html`, `site/js/vue/model-features.js`, `site/js/vue/model.js`, `site/js/config/contexts.js`, `site/js/vue/model/ui.js`, `site/js/vue/methods/rail.js`, `site/js/vue/methods/planner.js`
  - Verify: bash -lc '! rg -n "feature\\.|showFeatureModal|featureModal|showShareModal|shareModal|sharePlanner\\(" .compose/fragments site/js/vue site/js/config/contexts.js'

- [ ] **T03: Re-compose HTML and add regression + grep gates proving legacy surface removal** `est:1h10m`
  Why: R109-supporting proof for S03 requires objective evidence that removed share/feature surfaces do not regress back into runtime or UI.

## Skills Used
- `test`
- `best-practices`

## Steps
1. Re-compose static output (`.compose/build.sh`) so `site/index.html` matches fragment changes and no removed includes leak through stale generated HTML.
2. Add `.tests/e2e/legacy-surface-removal.spec.js` with assertions that share/feature controls are absent and `/?share=...` does not import or alter planner state.
3. Update `.tests/e2e/bs5-migration.spec.js` to stop asserting deleted share/feature modals; retain BS5 close-button coverage by targeting remaining modals.
4. Update `.tests/smoke/compose.spec.js` to assert revised modal fragment set and compose includes after share/feature deletion.
5. Add `scripts/verify-no-legacy-share-features.sh` grep gate that fails on reintroduced legacy symbols (`?share=`, `shareModal`, `featureModal`, `model-features`, share import/export helpers).

## Must-Haves
- [ ] New E2E spec proves share/feature absence and ignored `?share` path.
- [ ] Compose smoke and BS5 migration tests are aligned with removed surfaces.
- [ ] Grep gate script exists and fails on reintroduction.

## Failure Modes
| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Playwright E2E runner | Report failing selector/assertion with file:test context | Mark suite failed with timed-out test names | Treat malformed query payload test as pass only when app remains unaffected |
| m4 compose build | Fail fast if generated `site/index.html` cannot be regenerated | N/A | N/A |
| grep gate script | Exit non-zero with file:line matches for forbidden symbols | N/A | Use targeted patterns to reduce false positives |

## Load Profile
- Shared resources: Playwright browser context and generated static HTML.
- Per-operation cost: targeted E2E + smoke runs plus linear grep scan.
- 10x breakpoint: test runtime/flakiness before resource saturation.

## Negative Tests
- Malformed inputs: invalid/malformed `?share` payload should not crash or import data.
- Error paths: absent modal selectors should be asserted explicitly (not silently skipped).
- Boundary conditions: no share/feature symbols in `site/index.html`, `.compose`, or runtime JS.
  - Files: `.compose/build.sh`, `site/index.html`, `.tests/e2e/legacy-surface-removal.spec.js`, `.tests/e2e/bs5-migration.spec.js`, `.tests/smoke/compose.spec.js`, `scripts/verify-no-legacy-share-features.sh`
  - Verify: bash .compose/build.sh && bash scripts/verify-no-legacy-share-features.sh && npm --prefix .tests run test -- --reporter=line e2e/legacy-surface-removal.spec.js e2e/bs5-migration.spec.js smoke/compose.spec.js

## Files Likely Touched

- site/js/Application.js
- site/js/service/Storage.js
- site/js/vue/model/planner.js
- site/js/vue/model/ui.js
- site/js/vue/methods/planner.js
- site/js/vue/methods/lifecycle.js
- site/js/config/contexts.js
- site/js/vue/model.js
- .compose/fragments/modals.html
- .compose/fragments/modals/share.html
- .compose/fragments/modals/feature.html
- .compose/fragments/rail.html
- .compose/fragments/footer.html
- .compose/fragments/grid.html
- site/js/vue/model-features.js
- site/js/vue/methods/rail.js
- .compose/build.sh
- site/index.html
- .tests/e2e/legacy-surface-removal.spec.js
- .tests/e2e/bs5-migration.spec.js
- .tests/smoke/compose.spec.js
- scripts/verify-no-legacy-share-features.sh
