# S01: Identity & Storage Contract Cleanup

**Goal:** Eliminate legacy `uid` identity/storage mechanics and make runtime state flow rely on `userKey` plus planner document UUIDs, while preserving multi-planner behavior with clean in-app navigation.
**Demo:** After this: app identity/state surfaces operate without uid mechanics and still support multi-planner document flows.

## Must-Haves

- Remove `uid`/identity-map runtime coupling from `site/js/Application.js`, `site/js/service/StorageLocal.js`, `site/js/service/Storage.js`, and `site/js/vue/model/planner.js`; active identity is `userKey` + `activeDocUuid`.
- Preferences are persisted/read via `prefs:${userKey}` and planner docs use `meta.userKey`; no new runtime writes depend on numeric uid keys.
- Year/theme/language interactions run through Vue state methods and do not depend on query-param app state or full-page reloads.
- Multi-planner create/select/delete flows continue to work after cleanup.
- Add targeted regression tests: `.tests/e2e/identity-storage-contract.spec.js` and `.tests/e2e/clean-url-navigation.spec.js`.

## Threat Surface

- **Abuse**: query-param tampering for planner state (`uid`, `year`, `lang`, `theme`) must no longer drive runtime identity/state transitions.
- **Data exposure**: localStorage contains planner/auth keys; tests and logs must avoid token value leakage.
- **Input trust**: year/language/theme UI inputs and legacy localStorage payloads must be coerced/validated.

## Requirement Impact

- **Requirements touched**: `R104`, `R109`
- **Re-verify**: bootstrap on empty storage, planner switching, sync payload integrity, and no-navigation year/theme/lang interactions.
- **Decisions revisited**: `D021`, `D022`, `D024`, `D025`

## Proof Level

- This slice proves: integration
- Real runtime required: yes
- Human/UAT required: yes

## Verification

- `npm --prefix .tests run test -- --reporter=line e2e/identity-storage-contract.spec.js e2e/clean-url-navigation.spec.js`
- `npm --prefix .tests run test -- --reporter=line e2e/migration.spec.js e2e/planner-management.spec.js e2e/cross-profile-sync.spec.js e2e/sync-payload.spec.js`
- `bash scripts/verify-no-legacy-uid.sh`

## Observability / Diagnostics

- Runtime signals: `Application.init` and `lifecycle.refresh` logs report `userKey`/planner activation transitions without uid state.
- Inspection surfaces: browser localStorage keys (`prefs:*`, `plnr:*`, `active-planner`), planner selector UI state, and Playwright assertion output.
- Failure visibility: contract tests and grep gate pinpoint accidental uid reintroduction, key-shape drift, or navigation regressions.
- Redaction constraints: inspect key names/metadata only; do not log auth token values.

## Integration Closure

- Upstream surfaces consumed: `site/js/vendor/jsmdma-auth-client.esm.js` (`ClientAuthSession`, `DeviceSession`, `PreferencesStore`), `site/js/service/PlannerStore.js`, Vue method modules, and existing Playwright fixtures/global setup.
- New wiring introduced in this slice: app bootstrap resolves identity/prefs from `userKey`; navigation/theme/lang mutations happen in-app; contract tests assert storage keys and URL behavior directly.
- What remains before the milestone is truly usable end-to-end: downstream M013 slices complete broader cleanup, but uid-based identity/storage coupling is closed by this slice.

## Tasks

- [x] **T01: Refactor storage identity contract to userKey and add contract regression coverage** `est:1h10m`
  ## Skills Used

- `best-practices`
- `test`

Why this task exists
- R104 is primarily a storage/identity contract change; runtime cleanup is unstable unless the persistence layer is corrected first.
- This task creates the first targeted regression file so subsequent refactors can prove behavior instead of relying on manual inspection.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `localStorage` legacy keyspace (`0`, numeric prefs keys, uid-stamped docs) | Skip corrupt record, keep processing remaining keys, and fail contract tests with actionable key name output. | N/A (local read/write) | Ignore malformed JSON rows and continue migration/normalization without throwing. |
| `PreferencesStore` (`prefs:${userKey}` merge behavior) | Fall back to default in-memory prefs and surface failing test that names missing/incorrect key. | N/A | Coerce unexpected shape to canonical `{ year, lang, theme, dark, names }` before write. |
| `PlannerStore` document metadata expectations | Preserve existing doc load path and stop with explicit test failure if `meta.userKey` is missing. | N/A | Reject invalid `meta` shape and avoid writing partially-normalized docs. |

## Load Profile

- **Shared resources**: browser `localStorage` namespace and planner document metadata for all local docs.
- **Per-operation cost**: O(number of localStorage keys + number of planner docs) during bootstrap normalization.
- **10x breakpoint**: large localStorage keysets can amplify migration/normalization loops; avoid multi-pass scans.

## Negative Tests

- **Malformed inputs**: invalid JSON in legacy storage keys, missing `meta`, and non-object preferences payloads.
- **Error paths**: missing `prefs:${userKey}` after bootstrap should fail deterministic assertions.
- **Boundary conditions**: multiple planners across years with mixed old/new metadata should normalize without losing docs.

## Steps

1. Update `site/js/service/storage-schema.js` and `site/js/service/StorageLocal.js` to remove uid-based preference/identity APIs, key preferences by `userKey`, and align bootstrap persistence helpers to the new contract.
2. Refactor `site/js/service/Storage.js` import/export identity handling to remove numeric uid dependencies from runtime state mutation paths.
3. Remove legacy planner-model fields that no longer belong to runtime (`uid`, identity-map coupling) in `site/js/vue/model/planner.js` and any direct callers touched by this contract layer.
4. Add `.tests/e2e/identity-storage-contract.spec.js` to assert bootstrap writes `prefs:${userKey}`, planner metadata retains `meta.userKey`, and no uid key is required for app start.
5. Update `.tests/e2e/migration.spec.js` to validate current contract invariants after cleanup (key shape and metadata), not uid-era assumptions.

## Must-Haves

- [ ] No storage-layer writes require numeric uid values.
- [ ] Contract tests explicitly assert `prefs:${userKey}` and `meta.userKey` behavior.
- [ ] Storage refactor preserves multi-planner document persistence semantics.
  - Files: `site/js/service/StorageLocal.js`, `site/js/service/storage-schema.js`, `site/js/service/Storage.js`, `site/js/vue/model/planner.js`, `.tests/e2e/identity-storage-contract.spec.js`, `.tests/e2e/migration.spec.js`, `site/js/Application.js`
  - Verify: npm --prefix .tests run test -- --reporter=line e2e/identity-storage-contract.spec.js e2e/migration.spec.js

- [ ] **T02: Rewire application/bootstrap and UI navigation away from uid query state** `est:1h20m`
  ## Skills Used

- `best-practices`
- `test`

Why this task exists
- The slice demo requires user-facing behavior: identity/state must work without uid query mechanics while preserving planner workflows.
- This task closes the integration seam between storage contract changes and Vue/UI behavior.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `site/js/Application.js` bootstrap sequence | Fail fast with explicit app-ready test failure; do not silently fallback to uid state. | N/A | Guard URL/session param parsing and ignore unknown planner-state params. |
| Vue method wiring in `site/js/vue/methods/*.js` | Keep previous active planner/year in memory and surface failed interaction test instead of hard navigation. | N/A | Coerce invalid year/theme/lang inputs to safe defaults before persist/update. |
| Template bindings in `site/index.html` | Prevent default link navigation and keep state mutation in Vue methods; fail clean-url test on accidental reload. | N/A | Ignore malformed dropdown/event payload and keep current state. |

## Load Profile

- **Shared resources**: Vue reactive model state, browser history API, and planner list rendering.
- **Per-operation cost**: constant-time state mutation per interaction (year/theme/lang toggle) plus preference write.
- **10x breakpoint**: repeated rapid navigation/toggles can thrash render/update cycle if handlers trigger full reloads.

## Negative Tests

- **Malformed inputs**: non-numeric year entry, unsupported language token, invalid theme value.
- **Error paths**: missing active planner on delete/switch path must not crash modal actions.
- **Boundary conditions**: first-run empty storage and multi-planner state transitions across different years.

## Steps

1. Refactor `site/js/Application.js` init flow to stop reading/writing uid query parameters for app state and initialize from `userKey` + stored preferences.
2. Update `site/js/vue/methods/lifecycle.js`, `site/js/vue/methods/planner.js`, `site/js/vue/methods/rail.js`, and `site/js/vue/methods/calendar.js` so year/theme/lang/planner actions mutate reactive state and persist preferences without `window.location.search` reload semantics.
3. Replace uid/id query-string `href` bindings in `site/index.html` with explicit `v-on:click.prevent` handlers that call the new state mutation methods; remove stale `deletePlannerByYear(uid,year)` wiring.
4. Add `.tests/e2e/clean-url-navigation.spec.js` to assert year/theme/lang interactions keep URL clean and do not trigger hard navigation.
5. Update `.tests/smoke/dark-mode.spec.js` and `.tests/e2e/planner-management.spec.js` expectations for non-query navigation behavior.

## Must-Haves

- [ ] No UI control depends on `/?uid=...` or `/?id=...` links.
- [ ] Year/theme/lang changes are in-app state transitions with preference persistence.
- [ ] Planner create/select/delete remains functional without uid references.
  - Files: `site/js/Application.js`, `site/js/vue/methods/lifecycle.js`, `site/js/vue/methods/planner.js`, `site/js/vue/methods/rail.js`, `site/js/vue/methods/calendar.js`, `site/index.html`, `.tests/e2e/clean-url-navigation.spec.js`, `.tests/smoke/dark-mode.spec.js`
  - Verify: npm --prefix .tests run test -- --reporter=line e2e/clean-url-navigation.spec.js e2e/planner-management.spec.js smoke/dark-mode.spec.js

- [ ] **T03: Align remaining regression suite and add uid-removal grep gate** `est:1h`
  ## Skills Used

- `test`
- `lint`

Why this task exists
- R109 demands strict proof that cleanup did not regress existing behavior and that uid surfaces are fully purged.
- Existing E2E specs still seed/query uid-era contracts; they must be rewritten to validate the new runtime contract.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Existing Playwright E2E specs with uid-era setup | Fail suite with explicit file-level assertion; do not silently skip cases. | Mark verification failed and report timed-out spec names for follow-up. | Normalize fixture payloads to new contract (`userKey`, clean URL) before assertions. |
| Sync route mocks (`**/year-planner/sync`) | Fail affected sync tests with captured request/response diagnostics. | Treat as test failure; keep timeout thresholds explicit in spec loops. | Reject malformed sync payloads and assert contract fields directly. |
| `rg`-based uid grep gate script | Exit non-zero with matching file:line list. | N/A | Use strict pattern set (`\buid\b|\?uid|[?&]id=`) and exclude vendor fixtures intentionally. |

## Load Profile

- **Shared resources**: Playwright web server/context, test storageState seed, and mocked sync endpoint.
- **Per-operation cost**: multiple browser boots and sync mock assertions across targeted e2e files.
- **10x breakpoint**: CI runtime and test flake sensitivity before CPU/memory constraints.

## Negative Tests

- **Malformed inputs**: broken seeded docs (missing `meta.userKey`), invalid clocks, and corrupt localStorage JSON in test setup.
- **Error paths**: sync endpoint 5xx/timeout handling remains observable in existing sync-error suites after refactor.
- **Boundary conditions**: empty planner set, foreign-doc sync merge, and signout preserving planner keys.

## Steps

1. Update uid-era E2E files (`cross-profile-sync`, `sync-payload`, `hlc-write`, `tp-col-coercion`, `signout-wipe`) to seed and assert the userKey/document-UUID contract without `/?uid=` navigation assumptions.
2. Ensure planner-management and related tests assert behavior via active planner UUID/state, not uid-derived selectors or keys.
3. Add `scripts/verify-no-legacy-uid.sh` as a reproducible grep gate over runtime code (`site/index.html`, `site/js/**`) excluding vendor artifacts.
4. Run the targeted regression pack and fix remaining assertions to produce deterministic failure diagnostics.

## Must-Haves

- [ ] Updated targeted E2E specs no longer depend on uid query parameters or uid-seeded preference keys.
- [ ] Grep gate script fails on any reintroduced uid runtime surface.
- [ ] Regression pack passes with actionable output on failure.
  - Files: `.tests/e2e/cross-profile-sync.spec.js`, `.tests/e2e/sync-payload.spec.js`, `.tests/e2e/hlc-write.spec.js`, `.tests/e2e/tp-col-coercion.spec.js`, `.tests/e2e/signout-wipe.spec.js`, `.tests/e2e/planner-management.spec.js`, `scripts/verify-no-legacy-uid.sh`, `.tests/e2e/boot.spec.js`
  - Verify: bash scripts/verify-no-legacy-uid.sh && npm --prefix .tests run test -- --reporter=line e2e/cross-profile-sync.spec.js e2e/sync-payload.spec.js e2e/hlc-write.spec.js e2e/tp-col-coercion.spec.js e2e/signout-wipe.spec.js

## Files Likely Touched

- site/js/service/StorageLocal.js
- site/js/service/storage-schema.js
- site/js/service/Storage.js
- site/js/vue/model/planner.js
- .tests/e2e/identity-storage-contract.spec.js
- .tests/e2e/migration.spec.js
- site/js/Application.js
- site/js/vue/methods/lifecycle.js
- site/js/vue/methods/planner.js
- site/js/vue/methods/rail.js
- site/js/vue/methods/calendar.js
- site/index.html
- .tests/e2e/clean-url-navigation.spec.js
- .tests/smoke/dark-mode.spec.js
- .tests/e2e/cross-profile-sync.spec.js
- .tests/e2e/sync-payload.spec.js
- .tests/e2e/hlc-write.spec.js
- .tests/e2e/tp-col-coercion.spec.js
- .tests/e2e/signout-wipe.spec.js
- .tests/e2e/planner-management.spec.js
- scripts/verify-no-legacy-uid.sh
- .tests/e2e/boot.spec.js
