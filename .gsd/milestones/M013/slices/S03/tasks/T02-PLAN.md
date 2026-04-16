---
estimated_steps: 28
estimated_files: 12
skills_used:
  - frontend-design
  - best-practices
---

# T02: Remove feature-flag and share UI surfaces from compose fragments and Vue bindings

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

## Inputs

- `.compose/fragments/modals.html`
- `.compose/fragments/modals/share.html`
- `.compose/fragments/modals/feature.html`
- `.compose/fragments/rail.html`
- `.compose/fragments/footer.html`
- `.compose/fragments/grid.html`
- `site/js/vue/model-features.js`
- `site/js/vue/model.js`
- `site/js/config/contexts.js`
- `site/js/vue/model/ui.js`
- `site/js/vue/methods/rail.js`
- `site/js/vue/methods/planner.js`

## Expected Output

- `.compose/fragments/modals.html`
- `.compose/fragments/rail.html`
- `.compose/fragments/footer.html`
- `.compose/fragments/grid.html`
- `site/js/vue/model.js`
- `site/js/config/contexts.js`
- `site/js/vue/model/ui.js`
- `site/js/vue/methods/rail.js`
- `site/js/vue/methods/planner.js`

## Verification

bash -lc '! rg -n "feature\\.|showFeatureModal|featureModal|showShareModal|shareModal|sharePlanner\\(" .compose/fragments site/js/vue site/js/config/contexts.js'

## Observability Impact

- Signals changed: no share/feature modal state transitions remain in Vue runtime.
- Inspection: grep for feature/share symbols in compose + Vue sources.
- Failure exposure: stale selector/binding regressions fail in smoke/e2e checks.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|---|---|---|---|
| Compose include graph | Fail compose smoke checks on missing/invalid includes | N/A | N/A |
| Vue bindings | Remove dead bindings with model cleanup to avoid runtime undefined refs | N/A | N/A |
| i18n label cleanup | Keep unrelated labels intact while removing unreferenced share labels | N/A | N/A |

## Load Profile

- **Shared resources**: static fragment composition and Vue render bindings.
- **Per-operation cost**: build-time edits + normal render path.
- **10x breakpoint**: stale generated index risk if compose is not rerun.

## Negative Tests

- **Malformed inputs**: N/A (static removal task).
- **Error paths**: stale `feature.*` bindings fail smoke/e2e selectors quickly.
- **Boundary conditions**: auth/signed-in controls remain available after feature-flag removal.
