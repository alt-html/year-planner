# M011: jsmdma Sync Protocol & MOD Cleanup

**Gathered:** 2026-04-09
**Status:** Ready for planning

## Project Description

A multi-lingual offline-first PWA year planner. As of M010, the localStorage schema is fully HLC-ready (`plnr:{uuid}`, `rev:{uuid}`, `base:{uuid}`, `sync:{uuid}`), but the sync layer still uses the old push/pull dump protocol (`POST /api/planner` / `GET /api/planner`) via the now-obsolete `StorageRemote.js`. This milestone replaces the sync layer entirely, wires HLC field tracking into every local write, and resolves outstanding MOD-02 era cleanup items.

## Why This Milestone

The localStorage schema has been ready for jsmdma sync since M009. The blocking gap is `SyncClient.js` (doesn't exist), the wrong sync protocol in `Api.js`, and `StorageRemote.js` (dead code from the old uid-year schema era). Additionally MOD-05–09 housekeeping from M002 remains unresolved. M011 closes both gaps.

## Codebase Brief

### Technology Stack

- Vanilla ES modules, no bundler, CDN dependencies via `jsdelivr.net`
- Vue 3 Options API; CDI wiring via `@alt-javascript/boot-vue`
- `site/js/vendor/data-api-core.esm.js` — local jsmdma bundle; exports `HLC`, `flatten`, `merge`, `unflatten`, `diff`, `textMerge`
- Playwright E2E tests in `.tests/`; CDN intercepted via `fixtures/cdn-routes.js`

### Key Modules

- `site/js/service/StorageLocal.js` (633 lines) — ground truth for local schema; manages `plnr:`, `rev:`, `base:`, `sync:`, `dev`, `tok` keys
- `site/js/service/Api.js` (111 lines) — currently calls old `POST /api/planner` / `GET /api/planner` dump endpoints; **must be rewritten**
- `site/js/service/StorageRemote.js` (84 lines) — references obsolete `uid-year` schema keys; **dead code; delete entirely**
- `site/js/service/AuthProvider.js` (167 lines) — federated auth skeleton (Google/Apple/Microsoft); `getToken()` returns `localStorage.getItem('auth_token')`
- `site/js/config/auth-config.js` — provider client IDs (all empty; configuring them is out of scope for M011)
- `site/js/config/contexts.js` — CDI registration; must add `syncClient`, remove `storageRemote`

### Patterns in Use

- CDI constructor injection — parameter names must match CDI-registered singleton names exactly
- `model.error` Vue-reactive string — the error surface for all service failures
- `storageLocal.signedin()` — checked before any sync attempt; reads `tok` key
- `storageLocal.setDayEntry()` (and similar write methods) — entry point for HLC tracking

## User-Visible Outcome

### When this milestone is complete, the user can:

- Edit a planner entry while signed in → the change is synced to the server on next `api.sync()` call using HLC clocks
- Two-device scenario: edits made offline on Device A and Device B both survive sync and merge correctly (HLC LWW for most fields; 3-way text merge for `notes`)
- MOD cleanup items are resolved or explicitly deferred with rationale

### Entry point / environment

- Entry point: `https://d1uamxeylh4qir.cloudfront.net/` (browser PWA)
- Environment: browser (local dev served from `site/` via http-server on port 8080)
- Live dependencies involved: `POST /year-planner/sync` backend endpoint (mocked in E2E tests)

## Completion Class

- Contract complete means: `SyncClient.js` exists with correct method signatures; `Api.js` posts correct jsmdma payload shape; payload shape verified by Playwright mock test
- Integration complete means: `rev:{uuid}` updated on field write; `base:{uuid}` and `sync:{uuid}` updated after sync; merge applied correctly to local doc
- Operational complete means: all 14 existing E2E tests pass; new sync integration test passes

## Architectural Decisions

### SyncClient.js — new service, CDI-registered

**Decision:** Create `site/js/service/SyncClient.js` as a new CDI-registered service. Constructor: `constructor(model, storageLocal)`. Injected into `Api` and referenced by `StorageLocal`.

**Rationale:** SYNC-06 (D005) specifies this pattern. Keeps sync state management separate from storage CRUD and from the HTTP layer.

**Evidence:** D005 in DECISIONS.md explicitly states: "SyncClient.js in js/service/. Uses data-api-core.esm.js bundle. Manages baseClock/fieldRevs/baseSnapshot per planner. StorageLocal delegates sync state to SyncClient."

**Alternatives Considered:**
- Merge sync logic into `StorageLocal.js` directly — rejected; already 633 lines; mixing storage and protocol concerns
- Merge into `Api.js` — rejected; Api is the HTTP layer; sync state is not an HTTP concern

---

### Read baseClock fresh from localStorage each sync call

**Decision:** `SyncClient.sync()` reads `sync:{uuid}` from localStorage at the start of each call as `clientClock`. After a successful sync, writes `serverClock` back to `sync:{uuid}`. No in-memory cache of clocks.

**Rationale:** Simpler. Crash-safe — if the page is closed mid-sync, the last committed `sync:{uuid}` remains correct. No state divergence between in-memory and on-disk.

**Evidence:** Confirmed in Layer 2 discussion (2026-04-09).

**Alternatives Considered:**
- Cache clocks in-memory map in SyncClient — rejected; adds complexity; saves negligible time for a low-frequency sync operation

---

### Delete StorageRemote.js entirely

**Decision:** Delete `site/js/service/StorageRemote.js` and remove it from `contexts.js`.

**Rationale:** The file references the old `uid-year` schema which M009 replaced. No method in it is compatible with the new `plnr:{uuid}` schema. It is dead code.

**Evidence:** Confirmed in Layer 2 discussion. StorageRemote.js line 14 calls `storageLocal.getLocalIdentities()` and references `uid + '-' + year` keys — the old M003-era schema.

**Alternatives Considered:**
- Keep a hollow stub with deprecation comment — rejected; dead files create confusion

---

### jsmdma sync payload shape

**Decision:** `POST /year-planner/sync` payload: `{ clientClock: string, deviceId: string, changes: [{ id: string, doc: object, fieldRevs: object }] }`. Response: `{ serverClock: string, serverChanges: [{ id: string, doc: object, fieldRevs: object }] }`.

**Rationale:** Per D004 (arch decision from prior discussion): "data-api IS the sync API. year-planner uses POST /year-planner/sync directly." The `data-api-core.esm.js` bundle's `merge()` function expects `{ doc, fieldRevs }` shape on both local and remote sides.

**Evidence:** D004 in DECISIONS.md. Confirmed unchanged in Layer 1 Round 3.

---

### MOD cleanup: audit first, then fix only what's pending

**Decision:** S03 starts with an explicit audit of MOD-05 through MOD-09 to determine what is actually pending vs already done, before writing any fix tasks.

**Rationale:** Several MOD items may have been partially or fully resolved during M002–M010 without their requirements being marked validated. Auditing first prevents wasted work on already-done items.

**Evidence:** Confirmed in Layer 1 Round 2 discussion (2026-04-09).

## Interface Contracts

### SyncClient public API

```js
class SyncClient {
  constructor(model, storageLocal)

  // Advance per-planner HLC and record in rev:{plannerId}
  markEdited(plannerId, dotPath)  // dotPath e.g. 'days.2026-04-09.tl'

  // Build jsmdma payload, POST /year-planner/sync, apply server delta
  async sync(plannerId, plannerDoc, authHeaders)

  // Reset sync state for a planner (SYNC-08 prune readiness)
  prune(plannerId)
}
```

### Updated Api.js sync method

```js
// POST /year-planner/sync — replaces synchroniseToRemote() + synchroniseToLocal()
async sync(plannerId) {
  // reads plannerDoc from storageLocal
  // calls syncClient.sync(plannerId, plannerDoc, this._authHeaders())
}
```

### StorageLocal addition

```js
// Called after every field write to a planner document
markEdited(plannerId, dotPath)  // delegates to syncClient.markEdited()
```

## Error Handling Strategy

- **Network failure** (`POST /year-planner/sync` fails): set `model.error = 'error.syncfailed'`. Do NOT update `sync:{uuid}`. Local data preserved.
- **401 Unauthorized**: call `authProvider.signOut()`, set `model.signedin = false`, set `model.error = 'error.unauthorized'`.
- **Malformed server response** (missing `serverChanges`): log error, set `model.error = 'error.syncfailed'`, do not apply partial data.
- **`markEdited` on unknown planner**: guard with existence check; log warning if `rev:{uuid}` key missing.
- **Sync when not signed in**: silently skip — `storageLocal.signedin()` gate retained.
- **First sync with empty `sync:{uuid}`**: use `HLC.zero()` as `clientClock` — triggers full pull from server (correct bootstrap path).
- **No retry logic** in M011 — retry is a future concern.

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- A Playwright test with mocked `POST /year-planner/sync` endpoint verifies: (a) correct payload shape sent, (b) `rev:{uuid}` contains HLC entry for the edited field, (c) `base:{uuid}` and `sync:{uuid}` updated after sync response applied
- All 14 existing E2E tests pass without modification
- `StorageRemote.js` file is absent from the repository
- MOD audit result is documented; all actionable items are resolved or explicitly deferred with rationale

## Testing Requirements

- **S01:** Playwright integration test with mocked sync endpoint. Verify payload shape (`clientClock`, `deviceId`, `changes` array with correct `id`/`doc`/`fieldRevs`). No unit tests.
- **S02:** Playwright test: edit a day entry, read `localStorage.getItem('rev:' + plannerId)`, assert dot-path entry exists with valid HLC-format string. All 14 existing tests pass.
- **S03:** No new tests. All 14 existing tests serve as regression guard. Audit output documented in slice summary.

## Acceptance Criteria

### S01 — SyncClient.js + jsmdma sync API
1. `site/js/service/SyncClient.js` exists with `markEdited(plannerId, dotPath)`, `async sync(plannerId, plannerDoc, authHeaders)`, `prune(plannerId)` methods
2. `Api.js` posts to `/year-planner/sync` — not `/api/planner`
3. `StorageRemote.js` is deleted; `contexts.js` does not reference it
4. Playwright sync test: mocked endpoint receives `{ clientClock, deviceId, changes: [{id, doc, fieldRevs}] }` shape
5. Existing `sync-error.spec.js` test passes

### S02 — StorageLocal HLC write wiring
1. After `storageLocal.setDayEntry()` call, `localStorage.getItem('rev:' + plannerId)` contains a dot-path entry (e.g. `days.2026-04-09.tl`) with a valid HLC string
2. All 14 existing E2E tests pass

### S03 — MOD audit + cleanup
1. Audit documents status of MOD-05 through MOD-09 with per-item verdict (done/pending/deferred)
2. Each "pending" item is resolved in a task; each "deferred" item has an explicit rationale written to the slice summary
3. All 14 E2E tests pass after each fix

## Risks and Unknowns

- `StorageLocal` write paths — need to confirm which methods (setDayEntry, setMeta, setLocalPreferences?) should call `markEdited`; enumerate in S01-PLAN before S02 tasks are written
- MOD-05 (SquareUp removal) may already be done — M002 decisions note it was decided; REQUIREMENTS shows "unmapped" not "validated"; audit in S03 will resolve
- `sync:{uuid}` key may not be initialized for all existing planners after M009 migration — `HLC.zero()` fallback in `SyncClient.sync()` handles this correctly

## Existing Codebase / Prior Art

- `site/js/service/StorageLocal.js` — full schema impl; `setDayEntry()`, `keyPlnr()`, `keyRev()`, `keySync()`, `keyBase()` are the key entry points
- `site/js/service/AuthProvider.js` — `getToken()` is the auth token source
- `site/js/vendor/data-api-core.esm.js` — jsmdma bundle; `HLC.tick()`, `HLC.zero()`, `HLC.create()`, `flatten()`, `merge(base, local, remote)` are the core primitives
- `site/js/config/contexts.js` — CDI registration; must be updated for SyncClient, updated Api, removed StorageRemote
- `.tests/e2e/sync-error.spec.js` — existing sync E2E test; reference for sync mocking pattern
- `.tests/fixtures/cdn-routes.js` — CDN route interception pattern for Playwright

## Relevant Requirements

- SYNC-04 — HLC fieldRevs per planner → M011/S02
- SYNC-05 — Base snapshot per planner → M011/S01
- SYNC-06 — SyncClient wraps jsmdma protocol → M011/S01
- AUTH-06 — Sync layer aligned to jsmdma → M011/S01 + S02
- MOD-03 — Split Api.js → M011/S01 (jsmdma rewrite covers this)
- MOD-05 — Remove SquareUp → M011/S03
- MOD-06 — Clean feature flags → M011/S03
- MOD-07 — Replace lodash → M011/S03
- MOD-08 — Update template bindings → M011/S03
- MOD-09 — Wire modules through CDI → M011/S03

## Scope

### In Scope

- `SyncClient.js` — new service implementing jsmdma sync protocol
- `Api.js` rewrite — `POST /year-planner/sync` replaces old push/pull methods
- `StorageRemote.js` deletion
- `StorageLocal` wired to call `SyncClient.markEdited()` on field writes
- `contexts.js` updated — add `syncClient`, remove `storageRemote`
- Playwright integration test with mocked sync endpoint
- MOD-05–09 audit and resolution of pending items

### Out of Scope / Non-Goals

- OAuth client ID configuration (Google/Apple/Microsoft) — requires external app registrations
- Backend API implementation — separate project
- SYNC-08 (local pruning) — deferred to a future milestone
- New UI for sync status, conflict display, or progress indicators
- AUTH-01–04 (federated auth flow completion) — separate milestone

## Technical Constraints

- No bundler — all modules must be importable as native ES modules from CDN or local paths
- CDI constructor parameter names must exactly match registered singleton names in `contexts.js`
- `data-api-core.esm.js` must not be replaced — use the existing local bundle from the jsmdma project at `site/js/vendor/data-api-core.esm.js`

## Integration Points

- jsmdma backend (`POST /year-planner/sync`) — year-planner sends HLC payload, receives server delta; mocked in E2E tests
- `contexts.js` CDI container — updated to register `syncClient`, inject into `storageLocal` and `api`
- Playwright test harness (`.tests/`) — CDN route interception pattern extended for sync endpoint mock

## Ecosystem Notes

The jsmdma sync protocol (`POST /year-planner/sync`) follows the HLC-based last-write-wins + 3-way text merge pattern. The local `data-api-core.esm.js` bundle (from `../jsmdma`) provides all required primitives: `HLC.tick()`, `HLC.zero()`, `HLC.create()`, `flatten()`, `merge(base, local, remote)`. No additional libraries are needed. The `merge()` function handles both LWW field resolution (via `HLC.compare()`) and 3-way text merge for string fields (`notes`) using a line-level diff algorithm. The `clientClock: HLC.zero()` bootstrap path correctly triggers a full pull on first sync or after pruning.

## Open Questions

- Which StorageLocal write methods need `markEdited` wiring? — Enumerate in S01-PLAN before S02 tasks are written: candidates are `setDayEntry`, `setMeta`, possibly `setLocalPreferences`.
