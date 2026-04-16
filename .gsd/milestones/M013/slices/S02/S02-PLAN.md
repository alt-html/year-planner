# S02: Clean URL + System-Follow Preferences

**Goal:** Remove remaining URL-coupled year/lang/theme state behavior and deliver persisted language/theme system-follow modes (with explicit override and return-to-system) that react live in-app without hard navigation.
**Demo:** After this: year/lang/theme are controlled in-app with clean URLs, and language/theme can follow system live unless explicitly overridden.

## Must-Haves

- Normal planner navigation/state changes no longer read or write `year`, `lang`, or `theme` URL params; only OAuth callback params remain query-driven.
- Language preference supports `system` live-follow + explicit override + return-to-system, persisted per `userKey`.
- Theme preference supports `system` live-follow + explicit override + return-to-system, persisted per `userKey`.
- Add and pass `.tests/e2e/system-follow-preferences.spec.js` plus clean URL regressions proving no hard navigation regressions.

## Threat Surface

- **Abuse**: localStorage/query-param tampering should not force unauthorized state transitions; app-state query params are ignored while callback params are validated.
- **Data exposure**: preferences and planner metadata only; no secrets should be emitted in tests/log output.
- **Input trust**: `localStorage` payloads, browser `languagechange`, and `matchMedia` events are untrusted and must be normalized before applying state.

## Requirement Impact

- **Requirements touched**: `R103`, `R107`, `R108`
- **Re-verify**: clean-url navigation suite, theme/language runtime switching, and auth callback query cleanup.
- **Decisions revisited**: `D021`, `D024`

## Proof Level

- This slice proves: integration
- Real runtime required: yes
- Human/UAT required: yes

## Verification

- `npm --prefix .tests run test -- --reporter=line e2e/system-follow-preferences.spec.js e2e/clean-url-navigation.spec.js`
- `npm --prefix .tests run test -- --reporter=line smoke/dark-mode.spec.js e2e/planner-management.spec.js e2e/cross-profile-sync.spec.js e2e/sync-payload.spec.js e2e/tp-col-coercion.spec.js`
- `bash scripts/verify-no-url-state-params.sh`

## Observability / Diagnostics

- Runtime signals: lifecycle methods log/applied state transitions for preference mode (`system` vs explicit) and effective lang/theme.
- Inspection surfaces: localStorage `prefs:${userKey}`, DOM state (`body.yp-dark`, `#app[data-bs-theme]`, `document.documentElement.lang`), and Playwright assertion output.
- Failure visibility: targeted system-follow E2E tests and query-state grep gate identify exact mode/state drift points.
- Redaction constraints: inspect key names and preference values only; never log tokens/auth secrets.

## Integration Closure

- Upstream surfaces consumed: `site/js/Application.js` bootstrap flow, `StorageLocal` preference persistence, Vue lifecycle/rail methods, and existing Playwright CDN fixtures.
- New wiring introduced in this slice: mode-aware preference resolution (`system` vs explicit), live `matchMedia`/`languagechange` listeners, and UI controls to return to system-follow.
- What remains before the milestone is truly usable end-to-end: S03 removes remaining legacy share/feature surfaces; S04 closes full milestone verification gates.

## Tasks

- [x] **T01: Define system-mode preference contract and remove year/lang/theme URL bootstrap inputs** `est:1h20m`
  ## Skills Used

- `best-practices`
- `test`

Why this task exists
- R103 still has active bootstrap coupling (`urlParam('year'|'lang'|'theme')`) that must be removed before UI work can be trusted.
- R107/R108 need a stable persisted contract for `system` mode so later listeners/UI controls do not fight storage defaults.
- This task creates the first dedicated system-follow regression spec so downstream refactors are proof-driven.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `localStorage` preference payload (`prefs:${userKey}`) | Fall back to safe defaults (`year=current`, `lang` from navigator mapping, `theme` from media query) and keep app booting. | N/A (local read/write) | Coerce unknown keys/types to canonical mode+effective fields and persist normalized shape. |
| Bootstrap URL parsing in `Application.init()` | Keep only OAuth/callback params (`token`, `code`, `state`, `code_verifier`) and ignore app-state params entirely. | N/A | Ignore malformed app-state query values without mutating runtime state. |
| Vue i18n startup locale | Default to `'en'` and set runtime locale from resolved preference after init; surface mismatch via test failure if locale does not match model state. | N/A | Map unsupported locale strings to supported app languages (`en` fallback). |

## Load Profile

- **Shared resources**: browser `localStorage` preference keyspace and app bootstrap path executed on every page load.
- **Per-operation cost**: O(1) preference normalization plus bounded language mapping and theme mode resolution.
- **10x breakpoint**: repeated malformed preference writes can cause noisy boot churn; normalization must be idempotent.

## Negative Tests

- **Malformed inputs**: corrupted `prefs:${userKey}` JSON or invalid mode tokens should not crash startup.
- **Error paths**: unknown/unsupported navigator language values should fall back deterministically.
- **Boundary conditions**: URLs containing `?year=...&lang=...&theme=...` must not drive runtime state.

## Steps

1. Refactor `site/js/service/StorageLocal.js` preference read/write normalization to carry explicit mode values (`system` vs explicit) while preserving compatibility with existing numeric preference fields used elsewhere in runtime.
2. Update `site/js/Application.js` to stop ingesting `year/lang/theme` from URL params and derive effective startup state from normalized preferences + system defaults; keep OAuth callback handling untouched.
3. Update `site/js/vue/i18n.js` bootstrap locale behavior so URL language is no longer an input surface and locale is set from resolved runtime state.
4. Add `.tests/e2e/system-follow-preferences.spec.js` with bootstrap/contract assertions for URL-param ignore behavior and persisted mode defaults.
5. Ensure planner model defaults (`site/js/vue/model/planner.js`) include any new mode state needed by lifecycle methods without reintroducing uid-era assumptions.

## Must-Haves

- [ ] No bootstrap path reads `year`, `lang`, or `theme` from query params.
- [ ] Preferences persist and restore `system` mode alongside explicit overrides.
- [ ] New regression spec exists and fails on query-state coupling regressions.
  - Files: `site/js/service/StorageLocal.js`, `site/js/Application.js`, `site/js/vue/i18n.js`, `site/js/vue/model/planner.js`, `.tests/e2e/system-follow-preferences.spec.js`, `.tests/e2e/clean-url-navigation.spec.js`
  - Verify: npm --prefix .tests run test -- --reporter=line e2e/system-follow-preferences.spec.js

- [ ] **T02: Wire live system-follow listeners and UI controls for theme/language override + return-to-system** `est:1h25m`
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
  - Files: `site/js/vue/methods/lifecycle.js`, `site/js/vue/methods/rail.js`, `site/index.html`, `site/js/vue/i18n/lang.js`, `.tests/e2e/system-follow-preferences.spec.js`
  - Verify: npm --prefix .tests run test -- --reporter=line e2e/system-follow-preferences.spec.js smoke/dark-mode.spec.js

- [ ] **T03: Harden clean-URL regression coverage and add query-state grep gate** `est:1h15m`
  ## Skills Used

- `test`
- `lint`

Why this task exists
- R103 requires durable proof that app-state query params do not return through future edits.
- S01 test pack still contains `?year`/`?theme` assumptions; this task aligns all affected suites to in-app state setup.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Playwright specs that still seed via query params | Fail fast with explicit file/test names and update fixtures to localStorage/setup APIs. | Surface timed-out spec names; keep suite deterministic via focused commands. | Normalize seed setup using init scripts and guard flags; reject malformed seed payloads in assertions. |
| New grep gate script for query-state surfaces | Exit non-zero with matching file:line output. | N/A | Use targeted patterns to avoid false positives from unrelated strings. |
| System-follow event simulation hooks in tests | Keep current state and fail assertions with mode/effective diagnostic output. | Mark test failed with clear wait condition rather than hanging event waits. | Validate test hook payloads before dispatching synthetic events. |

## Load Profile

- **Shared resources**: Playwright browser context, seeded localStorage state, and deterministic CDN fixture routes.
- **Per-operation cost**: multiple short browser boot cycles and event dispatch assertions.
- **10x breakpoint**: suite runtime/flakiness before compute limits; keep selectors and waits deterministic.

## Negative Tests

- **Malformed inputs**: invalid query params and invalid mode values should be ignored safely.
- **Error paths**: simulated missing system APIs/listener failures should preserve current explicit state.
- **Boundary conditions**: switching system→explicit→system repeatedly should keep URL unchanged and state coherent.

## Steps

1. Update `.tests/e2e/clean-url-navigation.spec.js` and `.tests/smoke/dark-mode.spec.js` to remove query-param-driven setup and assert clean URL invariants under in-app interactions.
2. Align affected regression specs (`planner-management`, `cross-profile-sync`, `sync-payload`, `tp-col-coercion`) to in-app year/theme/lang state setup instead of `?year`/`?theme` navigation.
3. Add `scripts/verify-no-url-state-params.sh` to enforce absence of runtime `year/lang/theme` query-state surfaces (while permitting OAuth callback params).
4. Expand `.tests/e2e/system-follow-preferences.spec.js` with explicit negative and boundary scenarios for mode switching/event handling.
5. Run the focused regression pack and stabilize selectors/waits so failures are actionable and non-flaky.

## Must-Haves

- [ ] Clean-url tests no longer depend on `?theme`/`?year` setup.
- [ ] Grep gate fails if app-state query-surface patterns return in runtime code.
- [ ] Focused regression command passes with deterministic diagnostics.
  - Files: `.tests/e2e/clean-url-navigation.spec.js`, `.tests/smoke/dark-mode.spec.js`, `.tests/e2e/planner-management.spec.js`, `.tests/e2e/cross-profile-sync.spec.js`, `.tests/e2e/sync-payload.spec.js`, `.tests/e2e/tp-col-coercion.spec.js`, `.tests/e2e/system-follow-preferences.spec.js`, `scripts/verify-no-url-state-params.sh`
  - Verify: bash scripts/verify-no-url-state-params.sh && npm --prefix .tests run test -- --reporter=line e2e/system-follow-preferences.spec.js e2e/clean-url-navigation.spec.js smoke/dark-mode.spec.js e2e/planner-management.spec.js e2e/cross-profile-sync.spec.js e2e/sync-payload.spec.js e2e/tp-col-coercion.spec.js

## Files Likely Touched

- site/js/service/StorageLocal.js
- site/js/Application.js
- site/js/vue/i18n.js
- site/js/vue/model/planner.js
- .tests/e2e/system-follow-preferences.spec.js
- .tests/e2e/clean-url-navigation.spec.js
- site/js/vue/methods/lifecycle.js
- site/js/vue/methods/rail.js
- site/index.html
- site/js/vue/i18n/lang.js
- .tests/smoke/dark-mode.spec.js
- .tests/e2e/planner-management.spec.js
- .tests/e2e/cross-profile-sync.spec.js
- .tests/e2e/sync-payload.spec.js
- .tests/e2e/tp-col-coercion.spec.js
- scripts/verify-no-url-state-params.sh
