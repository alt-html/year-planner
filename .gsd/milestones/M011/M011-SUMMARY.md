---
id: M011
title: "jsmdma Sync Protocol & MOD Cleanup"
status: complete
completed_at: 2026-04-09T21:40:54.219Z
key_decisions:
  - SyncClient.js owns all HLC sync state (rev/base/sync localStorage keys) — StorageLocal delegates, does not duplicate sync logic
  - markEdited() ticks HLC from the existing per-field clock (not always from sync:{uuid}) to ensure monotonically increasing stamps offline
  - HLC_ZERO imported from storage-schema.js rather than via HLC.zero() — keeps all storage constants in one place
  - Api.js fetchJSON retained at module level for deleteAccount(); SyncClient has its own internal fetchJSON — intentional separation with different error handling needs
  - deletePlannerByYear sync call removed entirely (not replaced) — no point syncing a deleted planner
  - Fire-and-forget call pattern preserved for all 9 Vue call sites — UI must not block on sync
  - StorageRemote.js deleted with no stub retained — incompatible with M009 plnr:{uuid} schema
  - markEdited fires unconditionally on every edit, not gated on syncToRemote — HLC tracking is always needed regardless of auth state
  - MOD-08 deferred: v-bind:/v-on: → :/@ shorthand conversion is purely cosmetic; Vue 3 supports both forms identically; risk of typos outweighs zero benefit
key_files:
  - site/js/service/SyncClient.js (new — CDI-registered jsmdma HLC sync service)
  - site/js/service/Api.js (rewritten — single sync(plannerId) method)
  - site/js/config/contexts.js (SyncClient registered, StorageRemote removed)
  - site/js/service/StorageLocal.js (getActivePlnrUuid() added, _updateRev() removed)
  - site/js/vue/methods/entries.js (markEdited loop wired for all 5 day fields)
  - site/js/vue/methods/lifecycle.js (sync call updated)
  - site/js/vue/methods/planner.js (3 sync call sites updated)
  - site/js/vue/methods/auth.js (sync call updated)
  - site/js/service/Storage.js (deletePlannerByYear sync call removed)
  - site/js/service/StorageRemote.js (deleted)
  - .tests/e2e/sync-payload.spec.js (new — jsmdma payload shape assertion)
  - .tests/e2e/hlc-write.spec.js (new — rev:{uuid} dot-path HLC write confirmation)
  - .tests/e2e/sync-error.spec.js (route glob updated to /year-planner/sync)
  - .compose/fragments/modals/ (7 orphan files deleted; 5 remain)
lessons_learned:
  - globalSetup storageState dev key prevents initialise() from running — tests needing rev:/base:/sync: writes must call localStorage.clear() in addInitScript, guarded by sessionStorage._seeded
  - api.sync(null) is a completely silent no-op — when debugging missing sync POST requests, verify getActivePlnrUuid() returns non-null before investigating further
  - SyncClient and Api.js should each keep their own fetchJSON — they have different error handling needs and sharing creates coupling that is not worth the DRY benefit
  - markEdited() ticking from the per-field clock rather than always from sync:{uuid} is essential for monotonically increasing stamps during rapid offline edits to the same field
  - Orphan fragment files in compose builds can accumulate silently — any modal not referenced in a .m4 template is dead weight; audit against build.sh output is the reliable verification
  - Fire-and-forget sync calls are a deliberate UX contract, not laziness — adding await to any of the 9 call sites would change UX behavior and should be an intentional decision, not an accident
---

# M011: jsmdma Sync Protocol & MOD Cleanup

**Replaced the obsolete push/pull sync layer with a jsmdma HLC-based bidirectional sync protocol (SyncClient.js, Api.js rewrite, StorageRemote.js deleted, HLC write-path wired end-to-end), and completed MOD cleanup by validating all outstanding MOD requirements and deleting 7 orphan modal fragments; 18/18 Playwright tests pass.**

## What Happened

M011 delivered three sequential slices over two days, completely replacing the client-side sync infrastructure and closing out a backlog of MOD-era cleanup items.

**S01 — SyncClient.js + jsmdma sync API (high risk)**
The highest-risk slice created `SyncClient.js` from scratch: a CDI-registered service with `markEdited(plannerId, dotPath)` for per-field HLC tracking, `async sync(plannerId, plannerDoc, authHeaders)` for the jsmdma POST protocol, and `prune(plannerId)` for cleanup. `Api.js` was rewritten to remove `synchroniseToLocal()`/`synchroniseToRemote()` and replace them with a single `sync(plannerId)` method that delegates to `syncClient`. All 9 Vue call sites across 5 files were updated to fire-and-forget `api.sync(plannerId)`. `StorageRemote.js` was deleted entirely — it was incompatible with the M009 plnr:{uuid} schema and had no salvageable parts. `contexts.js` was updated to register `SyncClient` as a singleton and remove `StorageRemote`. A new Playwright test (`sync-payload.spec.js`) asserts the full jsmdma payload shape (clientClock, deviceId, changes[]). The key implementation challenge was discovering that the globalSetup storageState `dev` key causes `initialise()` to be skipped, making `getActivePlnrUuid()` return null — fixed by adding `localStorage.clear()` in test `addInitScript` (guarded by `sessionStorage._seeded`). 17/17 tests passed.

**S02 — HLC write-path wiring (medium risk)**
S01 built `markEdited()` but never called it. S02 wired it into `entries.js` `updateEntry()`: after `storageLocal.updateLocalEntry()`, the ISO date is computed from mindex/day/year, `getActivePlnrUuid` is called once, and a loop over `['tp', 'tl', 'col', 'notes', 'emoji']` calls `syncClient.markEdited(plannerId, 'days.${isoDate}.${field}')` for each field. The `if (plannerId && this.syncClient)` guard protects against null state. markEdited fires unconditionally — not gated on `syncToRemote` — ensuring HLC tracking on every edit regardless of auth state. The same `plannerId` is reused in the downstream `api.sync()` call, eliminating a duplicate `getActivePlnrUuid` call. A new `hlc-write.spec.js` test verifies end-to-end by editing day 1, then reading localStorage to assert `rev:{uuid}` contains dot-path keys matching `days.YYYY-MM-DD.{field}` with non-empty HLC strings. The test needed the same `localStorage.clear()` pattern from S01. 18/18 tests passed.

**S03 — MOD audit + cleanup (low risk)**
Terminal housekeeping with no runtime code changes. All five MOD requirements audited: MOD-05/06/07/09 marked validated with evidence (SquareUp gone since M002/S04; donate flag removed since M002/S04; lodash replaced since M002/S04; CDI fully wired in M011/S01). MOD-08 (v-bind:/v-on: → :/@ shorthand) deferred — purely cosmetic, Vue 3 supports both forms identically, risk of typos outweighs zero functional benefit. Seven orphan modal fragment files in `.compose/fragments/modals/` were confirmed non-referenced (no `.m4` template included them) and deleted: pay.html, signin.html, register.html, reset-password.html, recover-username.html (M004), cookie.html (M003), settings.html (superseded). Directory now contains exactly 5 active files. Compose build produces identical 1135-line index.html. 18/18 tests passed.

## Success Criteria Results

All success criteria were met with direct evidence:

- **SyncClient.js CDI-registered with markEdited/sync/prune** ✅ — `site/js/service/SyncClient.js` exists; registered as `syncClient` singleton in `contexts.js`; all three methods implemented
- **Api.js POSTs to /year-planner/sync with jsmdma payload (clientClock, deviceId, changes[])** ✅ — `sync-payload.spec.js` passes; AUTH-06 and SYNC-05 validated by S01
- **StorageRemote.js deleted; synchroniseToLocal/synchroniseToRemote absent** ✅ — `StorageRemote.js` deleted; grep count = 0 across all 5 call-site files; MOD-03 validated
- **rev:{uuid} written with dot-path HLC stamps after every day entry edit** ✅ — `hlc-write.spec.js` passes; SYNC-04 validated; markEdited fires unconditionally (not gated on sign-in)
- **All Playwright E2E tests pass** ✅ — 18/18 passed on final live run (7.5s); S01 closed at 17/17, S02 added hlc-write.spec.js for 18/18
- **sync-payload.spec.js mock test passes** ✅ — included in 18-test passing suite; payload shape (clientClock, deviceId, changes[]) asserted
- **hlc-write.spec.js test passes** ✅ — included in 18-test passing suite; dot-path HLC entries confirmed in rev:{uuid}

## Definition of Done Results

All definition-of-done items met:

- **All slices ✅**: S01 complete (3/3 tasks), S02 complete (2/2 tasks), S03 complete (1/1 task)
- **All slice summaries exist**: S01-SUMMARY.md, S02-SUMMARY.md, S03-SUMMARY.md all rendered
- **VALIDATION.md rendered**: verdict = pass, remediationRound = 0
- **Cross-slice integration verified**: S01 provided SyncClient.markEdited() and getActivePlnrUuid() consumed by S02; localStorage.clear() guard pattern established in S01 reused by S02; rev:{uuid} write confirmed by hlc-write.spec.js; MOD audit in S03 confirmed complete sync write-path chain
- **18/18 Playwright tests pass**: live run confirmed 7.5s (including 2 new sync-related tests from M011)

## Requirement Outcomes

All 10 requirements that changed status during M011 are supported by evidence:

| Requirement | Transition | Evidence |
|-------------|-----------|---------|
| AUTH-06 | active → validated | SyncClient.js POSTs to /year-planner/sync with jsmdma shape; StorageRemote.js deleted; sync-payload.spec.js passes; 17/17 tests. S01 2026-04-09 |
| SYNC-04 | active → validated | markEdited() wired in entries.js for all 5 fields; hlc-write.spec.js confirms rev:{uuid} dot-path HLC entries; 18/18 tests. S02 2026-04-10 |
| SYNC-05 | active → validated | POST /year-planner/sync end-to-end; all 9 call sites updated; sync-payload.spec.js verifies payload shape. S01 2026-04-09 |
| SYNC-06 | active → validated | SyncClient.js with markEdited/sync/prune; HLC and merge from data-api-core; CDI-registered as syncClient. S01 2026-04-09 |
| MOD-03 | active → validated | StorageRemote.js deleted from codebase and contexts.js; all synchroniseToLocal/Remote references removed from 5 files. S01 2026-04-09 |
| MOD-05 | active → validated | SquareUp.js deleted in M002/S04; pay.html modal fragment deleted in M011/S03; zero squareup references in site/js/ or index.html |
| MOD-06 | active → validated | model-features.js has no donate flag or window.ftoggle global; only debug/signin flags remain; cleaned in M002/S04 |
| MOD-07 | active → validated | Zero lodash/_. references in site/js/ or index.html; all 8 lodash calls replaced with native Array methods in M002/S04 |
| MOD-08 | active → deferred | v-bind:/v-on: → :/@ is purely cosmetic; Vue 3 supports both forms identically; risk of typos in 6 fragment files outweighs zero functional benefit |
| MOD-09 | active → validated | contexts.js registers Api, Application, AuthProvider, Storage, StorageLocal, SyncClient; StorageRemote removed in M011/S01 |

## Deviations

S01/T03: Test addInitScript did not originally include localStorage.clear(). Added after discovering globalSetup storageState dev key prevents initialise() from running. Pattern documented in KNOWLEDGE.md. S02/T01: model.js and StorageLocal.js were already in the required state from S01 — only entries.js required editing. S02/T02: hlc-write.spec.js required the same localStorage.clear() pattern as sync-payload.spec.js — not in original plan but necessary for the same reason.

## Follow-ups

Wire live server sync: configure client IDs in AuthProvider.js for Google/Apple/Microsoft federated auth; point Api.js sync endpoint at production jsmdma server URL. MOD-08 cosmetic pass (deferred): convert v-bind:/v-on: to :/@ shorthand across 6 fragment files when touching them for other reasons.
