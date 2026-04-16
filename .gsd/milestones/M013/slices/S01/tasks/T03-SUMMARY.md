---
id: T03
parent: S01
milestone: M013
key_files:
  - .tests/e2e/cross-profile-sync.spec.js
  - .tests/e2e/sync-payload.spec.js
  - .tests/e2e/hlc-write.spec.js
  - .tests/e2e/tp-col-coercion.spec.js
  - .tests/e2e/signout-wipe.spec.js
  - scripts/verify-no-legacy-uid.sh
  - site/js/vue/model/planner.js
key_decisions:
  - sync-payload.spec.js required adding active-planner to localStorage seed — without it PlannerStore.restoreActive() returns null and the app creates a new empty planner, causing the sync payload to have zero changes and failing the assertion
  - grep gate uses rg patterns \?uid= and [?&]id= rather than the broader \buid\b — migration code legitimately references uid as a variable name and would generate false positives; the targeted URL-param patterns are sufficient to catch navigation regression
  - planner.js uid field comment updated to remove stale ?uid= reference so grep gate finds zero matches — avoiding the need for comment-exclusion logic in the grep script
duration: 
verification_result: passed
completed_at: 2026-04-16T04:54:17.084Z
blocker_discovered: false
---

# T03: Aligned remaining regression suite to userKey/document-UUID contract and added uid navigation grep gate — 7 tests and grep gate all pass

**Aligned remaining regression suite to userKey/document-UUID contract and added uid navigation grep gate — 7 tests and grep gate all pass**

## What Happened

Six uid-era E2E specs still navigated to `/?uid=12345&year=2026` or seeded legacy numeric prefs keys, and one spec had a planner document without `userKey` in meta. This task corrects all of them and adds a reproducible grep gate.

**cross-profile-sync.spec.js** — removed `?uid=12345` from all three `page.goto` calls (changed to `/?year=2026`). Tests already seeded `active-planner` and used `userKey` in planner meta, so the rest of the fixture was correct.

**sync-payload.spec.js** — three changes: (1) added `userKey: 'test-uuid'` to planner meta and removed the legacy `uid: 12345` field; (2) added `localStorage.setItem('active-planner', uuid)` so the app restores the seeded planner rather than creating a new empty one (without this the sync changes array would be empty and the payload-shape assertions would fail); (3) changed `page.goto` from `/?uid=12345&year=2026` to `/?year=2026`.

**hlc-write.spec.js** — changed `page.goto` from `/?uid=12345&year=2026` to `/?year=2026`. The test clears localStorage before loading, so the app creates a fresh planner — no other fixture changes needed.

**tp-col-coercion.spec.js** — changed `page.goto` from `/?uid=12345&year=2026` to `/?year=2026`. Test already seeds `active-planner` and uses `userKey` in planner meta.

**signout-wipe.spec.js** — two fixture changes: (1) `prefs:12345` (numeric uid key) changed to `prefs:test-uuid` (JWT sub UUID — matches what the app actually writes under the new contract); (2) `plnr:abc-123` meta updated from `{ uid: 12345 }` to `{ userKey: 'test-uuid' }`. The assertion confirming prefs survive signout updated to `prefs:test-uuid`.

**site/js/vue/model/planner.js** — updated the `uid` field comment to remove the stale reference to `?uid= param` (which was already eliminated in T02). This ensures the grep gate finds zero `?uid=` matches in runtime source.

**scripts/verify-no-legacy-uid.sh** (new) — bash script using `rg` to scan `site/index.html` and `site/js/**` (excluding `site/js/vendor/**`) for two patterns: `\?uid=` (URL query param) and `[?&]id=` (former language-switch param). Exits non-zero with file:line matches if either pattern is found. Both patterns return zero matches after T01/T02 cleanup.

## Verification

Ran the T03 verification command exactly as specified in the task plan:
`bash scripts/verify-no-legacy-uid.sh && npm --prefix .tests run test -- --reporter=line e2e/cross-profile-sync.spec.js e2e/sync-payload.spec.js e2e/hlc-write.spec.js e2e/tp-col-coercion.spec.js e2e/signout-wipe.spec.js` → grep gate PASS + 7/7 tests passed (5.1s).

Also ran the full 25-test slice regression pack to confirm T01/T02 tests remain clean:
`npm --prefix .tests run test -- --reporter=line e2e/identity-storage-contract.spec.js e2e/clean-url-navigation.spec.js e2e/migration.spec.js e2e/planner-management.spec.js e2e/cross-profile-sync.spec.js e2e/sync-payload.spec.js` → 25/25 passed (8.4s).

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash scripts/verify-no-legacy-uid.sh` | 0 | ✅ pass — PASS: no uid navigation surfaces found in runtime source | 800ms |
| 2 | `npm --prefix .tests run test -- --reporter=line e2e/cross-profile-sync.spec.js e2e/sync-payload.spec.js e2e/hlc-write.spec.js e2e/tp-col-coercion.spec.js e2e/signout-wipe.spec.js` | 0 | ✅ pass — 7/7 tests passed | 5100ms |
| 3 | `npm --prefix .tests run test -- --reporter=line e2e/identity-storage-contract.spec.js e2e/clean-url-navigation.spec.js e2e/migration.spec.js e2e/planner-management.spec.js e2e/cross-profile-sync.spec.js e2e/sync-payload.spec.js` | 0 | ✅ pass — 25/25 tests passed (full slice regression clean) | 8400ms |

## Deviations

Grep gate uses `\?uid=` and `[?&]id=` rather than the task plan's suggested `\buid\b|\?uid|[?&]id=`. The broader `\buid\b` pattern was ruled out because migration code in StorageLocal.js legitimately uses `uid` as a variable name (processing legacy data), generating unavoidable false positives. The two targeted URL-param patterns fully satisfy the gate's purpose: catching reintroduced navigation-based uid usage.

## Known Issues

model.uid is still present in the model (set to constant 0) and referenced in Storage.js getExportString() — the export identity slot is always null/missing. This is cosmetic only and does not affect app function. A dedicated cleanup task should remove model.uid and update the export path after slice S01 is complete.

## Files Created/Modified

- `.tests/e2e/cross-profile-sync.spec.js`
- `.tests/e2e/sync-payload.spec.js`
- `.tests/e2e/hlc-write.spec.js`
- `.tests/e2e/tp-col-coercion.spec.js`
- `.tests/e2e/signout-wipe.spec.js`
- `scripts/verify-no-legacy-uid.sh`
- `site/js/vue/model/planner.js`
