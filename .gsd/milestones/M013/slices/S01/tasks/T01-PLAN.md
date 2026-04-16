---
estimated_steps: 30
estimated_files: 7
skills_used:
  - best-practices
  - test
---

# T01: Refactor storage identity contract to userKey and add contract regression coverage

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

## Inputs

- `site/js/service/StorageLocal.js`
- `site/js/service/storage-schema.js`
- `site/js/service/Storage.js`
- `site/js/vue/model/planner.js`
- `.tests/e2e/migration.spec.js`
- `.tests/globalSetup.js`

## Expected Output

- `site/js/service/StorageLocal.js`
- `site/js/service/storage-schema.js`
- `site/js/service/Storage.js`
- `site/js/vue/model/planner.js`
- `.tests/e2e/identity-storage-contract.spec.js`
- `.tests/e2e/migration.spec.js`

## Verification

npm --prefix .tests run test -- --reporter=line e2e/identity-storage-contract.spec.js e2e/migration.spec.js

## Observability Impact

- Signals added/changed: storage contract assertions report exact missing/mis-keyed localStorage entries.
- How a future agent inspects this: run `npm --prefix .tests run test -- --reporter=line e2e/identity-storage-contract.spec.js` and inspect failed key-path assertions.
- Failure state exposed: mismatched preference keying (`prefs:${userKey}`) and missing `meta.userKey` are surfaced immediately.
