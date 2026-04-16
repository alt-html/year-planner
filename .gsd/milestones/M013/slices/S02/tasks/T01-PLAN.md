---
estimated_steps: 31
estimated_files: 6
skills_used:
  - best-practices
  - test
---

# T01: Define system-mode preference contract and remove year/lang/theme URL bootstrap inputs

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

## Inputs

- `site/js/service/StorageLocal.js`
- `site/js/Application.js`
- `site/js/vue/i18n.js`
- `site/js/vue/model/planner.js`
- `.tests/e2e/clean-url-navigation.spec.js`

## Expected Output

- `site/js/service/StorageLocal.js`
- `site/js/Application.js`
- `site/js/vue/i18n.js`
- `site/js/vue/model/planner.js`
- `.tests/e2e/system-follow-preferences.spec.js`

## Verification

npm --prefix .tests run test -- --reporter=line e2e/system-follow-preferences.spec.js
