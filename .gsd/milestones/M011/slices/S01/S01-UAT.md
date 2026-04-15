# S01: SyncClient.js + jsmdma sync API — UAT

**Milestone:** M011
**Written:** 2026-04-09T17:20:31.365Z

# S01 UAT — SyncClient.js + jsmdma sync API

## Preconditions

- Local dev server running: `cd .tests && npx http-server ../site -p 8080 -c-1`
- Browser devtools open to Application → Local Storage (for localStorage inspection)
- User is NOT signed in (default state for a fresh planner)

---

## TC-01: SyncClient.js exists and is CDI-registered

**Purpose:** Confirm SyncClient is wired into the CDI context as a singleton.

**Steps:**
1. Open browser devtools Console on `http://localhost:8080`
2. After `[data-app-ready]` is set, run: `window.__cdi?.get('syncClient')`

**Expected:** Returns a SyncClient instance (not undefined/null). The object has `markEdited`, `sync`, and `prune` methods.

---

## TC-02: StorageRemote.js is gone from the codebase

**Purpose:** Confirm the obsolete push/pull sync layer is fully removed.

**Steps:**
1. `test -f site/js/service/StorageRemote.js && echo EXISTS || echo GONE`
2. `grep -r 'StorageRemote\|synchroniseToLocal\|synchroniseToRemote' site/js/`

**Expected:** `GONE`. Grep returns no output (exit code 1). Both old sync method names are absent from all source files.

---

## TC-03: Api.js exposes sync(plannerId) and not the old methods

**Purpose:** Confirm the API surface is correct.

**Steps:**
1. Open browser devtools Console on `http://localhost:8080`
2. After `[data-app-ready]`, run: `const api = window.__cdi?.get('api'); typeof api.sync`
3. Run: `typeof api.synchroniseToLocal`
4. Run: `typeof api.synchroniseToRemote`

**Expected:**
- TC-03a: `typeof api.sync` → `"function"`
- TC-03b: `typeof api.synchroniseToLocal` → `"undefined"`
- TC-03c: `typeof api.synchroniseToRemote` → `"undefined"`

---

## TC-04: sync-payload Playwright test — POST /year-planner/sync carries jsmdma payload shape

**Purpose:** Automated contract test verifying the POST body shape matches D007.

**Steps:**
1. `cd .tests && npx playwright test e2e/sync-payload.spec.js --reporter=line`

**Expected:** 1 test passes. The captured POST body has:
- `capturedBody.clientClock`: string (HLC clock value, e.g. `"0000000000000-000000-00000000"`)
- `capturedBody.deviceId`: string (UUID from localStorage `dev` key)
- `capturedBody.changes`: array (may be `[]` or `[{id, doc, fieldRevs}]` for a fresh planner)

---

## TC-05: sync-error Playwright test — error alert shown when /year-planner/sync returns 500

**Purpose:** Verify error surface behavior after endpoint change.

**Steps:**
1. `cd .tests && npx playwright test e2e/sync-error.spec.js --reporter=line`

**Expected:** 1 test passes. A visible `.alert-danger` element appears in the UI when the intercepted `/year-planner/sync` route returns HTTP 500.

---

## TC-06: Full Playwright test suite — all 17 tests pass

**Purpose:** Regression check — S01 changes break nothing.

**Steps:**
1. `cd .tests && npx playwright test --reporter=line`

**Expected:** `17 passed`, 0 failed, 0 skipped.

---

## TC-07: localStorage keys written after sync (manual browser test with signed-in session)

**Purpose:** Verify SyncClient writes sync:{uuid}, base:{uuid}, rev:{uuid} after a successful sync.

**Preconditions:** Signed-in session (or mock a sync response manually in devtools Network intercept).

**Steps:**
1. Open `http://localhost:8080` with a signed-in session
2. Open devtools Application → Local Storage
3. Observe keys after the app initialises and sync fires

**Expected:**
- `sync:{planner-uuid}` key exists with a string value (HLC clock from server)
- `base:{planner-uuid}` key exists with a JSON object (merged planner days snapshot)
- No `rev:{planner-uuid}` key until a day entry is edited (markEdited is wired in S02)

---

## TC-08: api.sync() guard — no-op when not signed in

**Purpose:** Confirm sync is silently skipped when the user is not authenticated.

**Steps:**
1. Open `http://localhost:8080` without signing in
2. Open devtools Network tab filtered to `year-planner/sync`
3. Load the page and wait 3 seconds

**Expected:** No network request to `/year-planner/sync` is made. No error appears in the UI. The guard `!this.storageLocal.signedin() || !plannerId` returns early silently.

---

## Edge Cases

**EC-01 — sync when plannerId is null:** `api.sync(null)` returns undefined silently. No exception, no model.error.

**EC-02 — HTTP 404 from server:** model.error becomes `'error.apinotavailable'`. Alert shown in UI.

**EC-03 — HTTP 401 from server:** model.error becomes `'error.unauthorized'`. Alert shown in UI.

**EC-04 — HTTP 500 from server:** model.error becomes `'error.syncfailed'`. Alert shown in UI. (Covered by TC-05.)

**EC-05 — serverChanges empty:** SyncClient still writes `sync:{uuid}` = serverClock. No merge loop runs. plannerDoc written as new base snapshot.

