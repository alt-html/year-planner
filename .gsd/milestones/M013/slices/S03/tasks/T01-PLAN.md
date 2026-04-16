---
estimated_steps: 27
estimated_files: 8
skills_used:
  - best-practices
  - test
---

# T01: Remove share URL/LZ runtime contract from bootstrap, services, and Vue planner state

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

## Inputs

- `site/js/Application.js`
- `site/js/service/Storage.js`
- `site/js/vue/model/planner.js`
- `site/js/vue/model/ui.js`
- `site/js/vue/methods/planner.js`
- `site/js/vue/methods/lifecycle.js`
- `site/js/config/contexts.js`
- `site/js/vue/model.js`

## Expected Output

- `site/js/Application.js`
- `site/js/service/Storage.js`
- `site/js/vue/model/planner.js`
- `site/js/vue/model/ui.js`
- `site/js/vue/methods/planner.js`
- `site/js/vue/methods/lifecycle.js`
- `site/js/config/contexts.js`
- `site/js/vue/model.js`

## Verification

bash -lc '! rg -n "urlParam\(\x27share\x27\)|\?share=|getExportString|setModelFromImportString|sharePlanner\(|showShareModal|shareUrl|_pendingImport" site/js/Application.js site/js/service/Storage.js site/js/vue site/js/config/contexts.js'

## Observability Impact

- Signals changed: bootstrap logs no longer mention/consume share payload paths.
- Inspection: grep for `share` bootstrap/plumbing symbols in runtime JS.
- Failure exposure: missing method/runtime wiring errors surface immediately in targeted tests.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|---|---|---|---|
| Application query parsing | Preserve OAuth callback flow and fail tests on lingering share ingestion | N/A | Ignore unknown query params and continue normal boot |
| Storage share parser | Remove parser entrypoint entirely to avoid partial/dead imports | N/A | N/A |
| Planner init path | Keep active planner restore/create behavior stable | N/A | Ignore legacy share payloads completely |

## Load Profile

- **Shared resources**: bootstrap state and planner activation path.
- **Per-operation cost**: O(1) query/state handling.
- **10x breakpoint**: repeated reload behavior consistency, not resource exhaustion.

## Negative Tests

- **Malformed inputs**: `/?share=%%%` does not crash or import data.
- **Error paths**: empty storage still boots and creates/restores active planner.
- **Boundary conditions**: OAuth callback params remain functional while share params are ignored.
