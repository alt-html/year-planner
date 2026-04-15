---
id: S03
parent: M011
milestone: M011
provides:
  - MOD requirement audit complete — MOD-05/06/07/09 validated, MOD-08 deferred with rationale recorded in REQUIREMENTS.md and DB
  - .compose/fragments/modals/ cleaned to exactly 5 active files: auth.html, delete.html, entry.html, feature.html, share.html
requires:
  []
affects:
  []
key_files:
  - .gsd/REQUIREMENTS.md
  - .compose/fragments/modals/
key_decisions:
  - MOD-08 deferred: v-bind:/v-on: → :/@ shorthand conversion is purely cosmetic; Vue 3 supports both forms identically; 41× v-bind: and 27× v-on: in index.html are harmless; risk of typos in 6 fragment files outweighs zero functional benefit; defer to a future cosmetic pass.
patterns_established:
  - Orphan modal fragment audit pattern: confirm non-inclusion in .m4 templates and build.sh before deletion; run compose build to verify output is unchanged
observability_surfaces:
  - None — no runtime changes; all verification via ls, compose build, and Playwright test run
drill_down_paths:
  []
duration: ""
verification_result: passed
completed_at: 2026-04-09T21:28:19.660Z
blocker_discovered: false
---

# S03: MOD audit + cleanup

**MOD-05/06/07/09 marked validated; MOD-08 deferred with rationale; 7 orphan modal fragment files deleted; 18/18 Playwright tests pass**

## What Happened

S03 was terminal housekeeping for M011 with a single execution task (T01). No runtime code changes were made.

**Requirement status updates:** All five MOD requirements were updated in the GSD database and REQUIREMENTS.md rendered:
- MOD-05 (Remove SquareUp) → validated: SquareUp.js deleted in M002/S04; pay.html modal fragment deleted in S03; grep of site/js/ and index.html confirms zero squareup references.
- MOD-06 (Clean feature flags) → validated: model-features.js has no donate flag or window.ftoggle global; only debug/signin flags remain; cleaned in M002/S04.
- MOD-07 (Replace lodash) → validated: zero lodash/_. references in site/js/ or index.html; all 8 calls replaced with native Array methods in M002/S04.
- MOD-08 (Update template bindings) → deferred: v-bind:/v-on: → :/@ shorthand is purely cosmetic; Vue 3 supports both forms identically; changing 6 fragment files risks typos with zero functional benefit; defer to a future cosmetic pass.
- MOD-09 (Wire CDI modules) → validated: contexts.js registers Api, Application, AuthProvider, Storage, StorageLocal, SyncClient as singletons; StorageRemote removed in M011/S01.

**Orphan file deletion:** Seven modal fragment files in .compose/fragments/modals/ were confirmed as non-referenced (no .m4 template included them, build.sh produced identical output before and after) and deleted: pay.html (SquareUp), signin.html, register.html, reset-password.html, recover-username.html (all replaced in M004), cookie.html (removed in M003), settings.html (superseded). The directory now contains exactly the 5 required files: auth.html, delete.html, entry.html, feature.html, share.html.

All verification checks passed: ls confirms 5 files, bash .compose/build.sh exits 0 with 1135-line site/index.html unchanged, all 18 Playwright tests pass in 7.9s.

## Verification

1. `ls .compose/fragments/modals/ | sort` → auth.html delete.html entry.html feature.html share.html (exactly 5 files, exit 0)
2. `bash .compose/build.sh` → exits 0, produces 1135-line site/index.html; build is unchanged from before deletions
3. `cd .tests && npx playwright test --reporter=line` → 18/18 passed in 7.9s (exit 0)
4. `sqlite3 .gsd/gsd.db "SELECT id,status FROM requirements WHERE id LIKE 'MOD-%'"` → MOD-05/06/07/09 = validated, MOD-08 = deferred

## Requirements Advanced

None.

## Requirements Validated

- MOD-05 — SquareUp.js deleted in M002/S04; pay.html modal fragment deleted in M011/S03; grep of site/js/ and index.html confirms zero squareup references
- MOD-06 — model-features.js has no donate flag or window.ftoggle global; only debug/signin flags remain; cleaned in M002/S04
- MOD-07 — Zero lodash/_. references in site/js/ or index.html; all 8 lodash calls replaced with native Array methods in M002/S04
- MOD-09 — contexts.js registers Api, Application, AuthProvider, Storage, StorageLocal, SyncClient as singletons; StorageRemote removed in M011/S01; all modules correctly wired through CDI

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

None.

## Known Limitations

MOD-08 (v-bind:/v-on: → :/@ shorthand) is explicitly deferred. The 41× v-bind: and 27× v-on: occurrences in index.html remain; they are harmless under Vue 3 but may be addressed in a future cosmetic pass.

## Follow-ups

None. S03 is terminal housekeeping — no downstream slices depend on it.

## Files Created/Modified

- `.gsd/REQUIREMENTS.md` — MOD-05/06/07/09 status updated to validated; MOD-08 status updated to deferred with rationale
- `.compose/fragments/modals/pay.html` — Deleted — SquareUp payment modal, orphaned since M002/S04
- `.compose/fragments/modals/signin.html` — Deleted — old username/password auth modal, replaced by auth.html in M004
- `.compose/fragments/modals/register.html` — Deleted — bespoke registration modal, removed in M004
- `.compose/fragments/modals/reset-password.html` — Deleted — bespoke password reset modal, removed in M004
- `.compose/fragments/modals/recover-username.html` — Deleted — bespoke username recovery modal, removed in M004
- `.compose/fragments/modals/cookie.html` — Deleted — cookie consent modal, removed in M003
- `.compose/fragments/modals/settings.html` — Deleted — settings modal, superseded
