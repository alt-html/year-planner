# Year-Planner Auth & Identity Lifecycle Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace year-planner's bespoke SyncClient.js, AuthProvider.js token storage, and StorageLocal.js session/prefs with the jsmdma-client and jsmdma-auth-client SDK packages already vendored in `site/js/vendor/`.

**Architecture:** SyncClient.js wraps SyncClientAdapter (DocumentStore namespace=`plnr`, collection=`planners`). AuthProvider.js delegates token storage to ClientAuthSession. StorageLocal.js delegates session, preferences, and device-id to SDK static classes. Sign-out becomes a comprehensive localStorage wipe. Sign-in pester shows the modal every 30 days to unsigned users.

**Tech Stack:** `site/js/vendor/jsmdma-client.esm.js`, `site/js/vendor/jsmdma-auth-client.esm.js`, Playwright E2E (`.tests/`), Node 20+.

---

## File Map

| File | Action | Reason |
|------|--------|--------|
| `site/js/service/SyncClient.js` | Full rewrite (~65 lines) | Replace bespoke HLC code with SyncClientAdapter wrapper |
| `site/js/service/StorageLocal.js` | Significant trim (~630→~450 lines) | Remove session methods; delegate device/prefs to SDK |
| `site/js/service/AuthProvider.js` | Targeted edits | Replace direct localStorage token writes with ClientAuthSession |
| `site/js/service/Api.js` | Minor edits | _authHeaders reads token via getToken(); 401 clears session |
| `site/js/Application.js` | Minor edits | OAuth callback stores via ClientAuthSession; sign-in pester |
| `site/js/vue/methods/auth.js` | Minor edits | signout() calls comprehensive wipe |
| `.tests/e2e/sync-payload.spec.js` | Seed auth_token not '1' | signedin() now reads JWT not old session |
| `.tests/e2e/sync-error.spec.js` | Seed auth_token not '1' | Same reason |
| `.tests/e2e/signout-wipe.spec.js` | Create | Verify comprehensive localStorage clear |
| `.tests/e2e/signin-pester.spec.js` | Create | Verify 30-day sign-in prompt |

**SDK classes (static, no CDI wiring needed):**
- `DeviceSession` — `getDeviceId()`, `getOrCreateAnonUid()`, `clear()`
- `ClientAuthSession` — `store(token)`, `getToken()`, `isSignedIn()`, `getUserUuid()`, `clear()`
- `IdentityStore` — `getAll()`, `upsert({uuid,name,provider,email})`, `clear()`
- `PreferencesStore` — `get(userUuid)`, `set(userUuid, prefs)`, `clear(userUuid)`
- `DocumentStore` — `new DocumentStore({ namespace })`, `get/set/list/delete`
- `SyncClientAdapter` — `new SyncClientAdapter(store, { collection })`, `markEdited/sync/prune/pruneAll`

**Note on IdentityStore:** year-planner's device-session identities (`{0:uid,1:agent,2:remote}`) use the same `ids` key as IdentityStore but a different JSON shape (map vs array). StorageLocal retains its own identity read/write code. IdentityStore is only used in `wipe()` to clear the `ids` key.

---

## Task 1 — Update E2E tests to seed auth_token

**Why first:** The tests currently call `localStorage.setItem('1', SESSION_JSON)` which makes `storageLocal.signedin()` return true. After Spec C, `signedin()` reads a JWT via `ClientAuthSession.isSignedIn()`. Write the failing tests now (TDD), then fix the implementation in Task 2.

**Files:**
- Modify: `.tests/e2e/sync-payload.spec.js`
- Modify: `.tests/e2e/sync-error.spec.js`

- [ ] **Step 1: Update sync-payload.spec.js to seed auth_token**

Replace the top of the file from:
```js
const SESSION_JSON = JSON.stringify({"0":"test-uuid","1":0});
```
to (delete that line entirely), and replace the `addInitScript` block:

```js
// .tests/e2e/sync-payload.spec.js
// Verifies: POST /year-planner/sync carries the correct jsmdma payload shape (D007).
const { test, expect } = require('../fixtures/cdn');

/** Build a fake but structurally valid JWT (client-side decodeJwt doesn't verify signature) */
function makeFakeJwt(sub = 'test-uuid') {
  function b64u(obj) {
    return Buffer.from(JSON.stringify(obj)).toString('base64url');
  }
  const now = Math.floor(Date.now() / 1000);
  return b64u({ alg: 'HS256', typ: 'JWT' }) + '.' +
         b64u({ sub, iat: now, iat_session: now }) + '.fakesig';
}

test('sync POST carries jsmdma payload shape (D007)', async ({ page }) => {
  let capturedBody = null;

  await page.addInitScript((token) => {
    if (sessionStorage.getItem('_seeded')) return;
    sessionStorage.setItem('_seeded', '1');
    localStorage.clear();
    localStorage.setItem('auth_token', token);
  }, makeFakeJwt());

  await page.route('**/year-planner/sync', async (route) => {
    const req = route.request();
    capturedBody = JSON.parse(req.postData() || 'null');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ serverClock: '0000000000001-000000-00000000', serverChanges: [] }),
    });
  });

  await page.goto('/?uid=12345&year=2026');
  await page.waitForSelector('[data-app-ready]');
  const deadline = Date.now() + 5000;
  while (capturedBody === null && Date.now() < deadline) {
    await page.waitForTimeout(100);
  }
  expect(capturedBody).not.toBeNull();
  expect(capturedBody.collection).toBe('planners');
  expect(typeof capturedBody.clientClock).toBe('string');
  expect(Array.isArray(capturedBody.changes)).toBe(true);
  expect(capturedBody.changes.length).toBeGreaterThan(0);
  const change = capturedBody.changes[0];
  expect(typeof change.key).toBe('string');
  expect(change.id).toBeUndefined();
  expect(change.doc !== undefined).toBe(true);
  expect(change.fieldRevs !== undefined).toBe(true);
  expect(typeof change.baseClock).toBe('string');
});
```

- [ ] **Step 2: Update sync-error.spec.js to seed auth_token**

Replace entire file content:
```js
// .tests/e2e/sync-error.spec.js
// Verifies: sync failures are surfaced as visible error messages (SEC-04).
const { test, expect } = require('../fixtures/cdn');

function makeFakeJwt(sub = 'test-uuid') {
  function b64u(obj) {
    return Buffer.from(JSON.stringify(obj)).toString('base64url');
  }
  const now = Math.floor(Date.now() / 1000);
  return b64u({ alg: 'HS256', typ: 'JWT' }) + '.' +
         b64u({ sub, iat: now, iat_session: now }) + '.fakesig';
}

test('sync failure shows visible error alert (SEC-04)', async ({ page }) => {
  await page.addInitScript((token) => {
    localStorage.setItem('auth_token', token);
  }, makeFakeJwt());

  await page.route('**/year-planner/sync', (route) => route.fulfill({
    status: 500,
    body: JSON.stringify({ error: 'Internal Server Error' }),
    contentType: 'application/json',
  }));

  await page.goto('/');
  await page.waitForSelector('[data-app-ready]');
  await page.waitForTimeout(1000);

  const alert = page.locator('.alert-danger');
  await expect(alert).toBeVisible({ timeout: 3000 });
});
```

- [ ] **Step 3: Run both tests — confirm they FAIL**

```bash
cd /Users/craig/src/github/alt-html/year-planner/.tests
npx playwright test e2e/sync-payload.spec.js e2e/sync-error.spec.js --reporter=line
```

Expected: FAIL — sync does not fire because `signedin()` still reads the old `'1'` key (auth_token not yet recognised).

- [ ] **Step 4: Commit the failing tests**

```bash
cd /Users/craig/src/github/alt-html/year-planner
git add .tests/e2e/sync-payload.spec.js .tests/e2e/sync-error.spec.js
git commit -m "test: seed auth_token JWT for sync E2E tests (pre-ClientAuthSession wiring)"
```

---

## Task 2 — Wire ClientAuthSession: signedin, token storage, init

**Why:** StorageLocal.signedin() reads the old `'1'` session key. AuthProvider writes directly to localStorage. Application.js OAuth handler writes directly. All three need to use ClientAuthSession.

**Files:**
- Modify: `site/js/service/StorageLocal.js`
- Modify: `site/js/service/AuthProvider.js`
- Modify: `site/js/Application.js`
- Modify: `site/js/service/Api.js`

- [ ] **Step 1: Add ClientAuthSession import to StorageLocal.js and update signedin/registered**

At the top of `StorageLocal.js`, after the existing imports, add:
```js
import { ClientAuthSession, DeviceSession } from '../vendor/jsmdma-auth-client.esm.js';
```

Replace the `signedin()` method body (currently reads localStorage key `'1'`):
```js
signedin() {
    return ClientAuthSession.isSignedIn();
}
```

Replace the `registered()` method body:
```js
registered() {
    return !!ClientAuthSession.getToken();
}
```

Replace the `getDevId()` method body:
```js
getDevId() {
    return DeviceSession.getDeviceId();
}
```

- [ ] **Step 2: Update AuthProvider.js to use ClientAuthSession for token storage**

Add import at the top of `AuthProvider.js`:
```js
import { ClientAuthSession } from '../vendor/jsmdma-auth-client.esm.js';
```

Replace the `_storeAuth(provider, token)` method body:
```js
_storeAuth(provider, token) {
    ClientAuthSession.store(token);
    localStorage.setItem('auth_provider', provider);
    this.model.signedin = true;
    this.storageLocal.setLocalSession(token, 0); // kept for compat — will be removed in Task 4
}
```

Replace the `signOut()` method body:
```js
signOut() {
    ClientAuthSession.clear();
    localStorage.removeItem('auth_provider');
    this.model.signedin = false;
    this.storageLocal.deleteLocalSession();
}
```

Replace the `getToken()` method body:
```js
getToken() {
    return ClientAuthSession.getToken();
}
```

- [ ] **Step 3: Update Application.js OAuth callback to use ClientAuthSession**

In `Application.js`, in `init()`, replace the urlToken handling block:
```js
// Handle OAuth callback: server sends JWT as ?token= after /auth/:provider/callback
const urlToken = urlParam('token');
if (urlToken) {
    ClientAuthSession.store(urlToken);
    localStorage.setItem('auth_provider', localStorage.getItem('auth_provider') || 'google');
    // Remove ?token= from URL without triggering a reload
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete('token');
    window.history.replaceState({}, '', cleanUrl.toString());
}
```

Add import at top of `Application.js`:
```js
import { ClientAuthSession } from './vendor/jsmdma-auth-client.esm.js';
```

In `Application.js._handleOAuthCallback()`, replace the `localStorage.setItem('auth_token', ...)` block:
```js
if (body.token) {
    ClientAuthSession.store(body.token);
    localStorage.setItem('auth_provider', 'google');
}
```

- [ ] **Step 4: Update Api.js to use getToken() from authProvider and clear on 401**

In `Api.js`, the `_authHeaders()` method already reads `this.authProvider?.getToken()`, so it will work once AuthProvider.getToken() delegates to ClientAuthSession. No change needed in the method itself.

Update the 401 handler in `Api.sync()` — replace the stale `auth_time` check:
```js
else if (err.status == 401) {
    this.authProvider?.signOut?.();
    this.model.signedin = false;
    this.model.error = 'error.unauthorized';
}
```

- [ ] **Step 5: Run the failing tests — they should now PASS**

```bash
cd /Users/craig/src/github/alt-html/year-planner/.tests
npx playwright test e2e/sync-payload.spec.js e2e/sync-error.spec.js --reporter=line
```

Expected: PASS

- [ ] **Step 6: Run full regression to check nothing broke**

```bash
cd /Users/craig/src/github/alt-html/year-planner/.tests
npx playwright test --reporter=line
```

Expected: All previously passing tests still pass.

- [ ] **Step 7: Commit**

```bash
cd /Users/craig/src/github/alt-html/year-planner
git add site/js/service/StorageLocal.js site/js/service/AuthProvider.js \
        site/js/Application.js site/js/service/Api.js
git commit -m "feat: wire ClientAuthSession for signedin, token storage, OAuth callback"
```

---

## Task 3 — Rewrite SyncClient.js as SDK wrapper

**Why:** Replace the 189-line bespoke HLC implementation with a thin wrapper over SyncClientAdapter. The wrapper adds the year-planner-specific "new-device adoption" logic.

**Files:**
- Modify: `site/js/service/SyncClient.js`

- [ ] **Step 1: Run sync-payload spec to confirm it passes before touching SyncClient**

```bash
cd /Users/craig/src/github/alt-html/year-planner/.tests
npx playwright test e2e/sync-payload.spec.js --reporter=line
```

Expected: PASS (from Task 2).

- [ ] **Step 2: Write the new SyncClient.js**

Replace the entire file content:

```js
/**
 * SyncClient.js — thin wrapper over jsmdma-client SyncClientAdapter.
 *
 * DocumentStore (namespace='plnr') shares the plnr:{uuid} key space with
 * StorageLocal, so foreign documents written by the adapter are immediately
 * visible to StorageLocal.getLocalPlanners().
 *
 * The only year-planner-specific logic kept here is "new-device adoption":
 * if the own planner is empty after sync, and a foreign planner arrived with
 * the same uid+year, adopt the foreign planner's data.
 */
import { DocumentStore, SyncClientAdapter } from '../vendor/jsmdma-client.esm.js';

export default class SyncClient {
    constructor(model, storageLocal) {
        this.qualifier = '@alt-html/year-planner/SyncClient';
        this.logger = null;
        this.url = '${api.url}';
        this.model = model;
        this.storageLocal = storageLocal;
        this._docStore = new DocumentStore({ namespace: 'plnr' });
        this._adapter  = new SyncClientAdapter(this._docStore, { collection: 'planners' });
    }

    // ── markEdited ───────────────────────────────────────────────────────────

    markEdited(plannerId, dotPath) {
        this._adapter.markEdited(plannerId, dotPath);
    }

    // ── sync ─────────────────────────────────────────────────────────────────

    async sync(plannerId, plannerDoc, authHeaders) {
        const syncUrl  = this._getApiUrl() + 'year-planner/sync';
        const myUid    = plannerDoc.meta?.uid;
        const myYear   = plannerDoc.meta?.year;
        const ownIsEmpty = !plannerDoc.days || Object.keys(plannerDoc.days).length === 0;

        // Delegate to adapter: 3-way merge, foreign doc storage, clock persistence.
        const merged = await this._adapter.sync(plannerId, plannerDoc, authHeaders, syncUrl);

        // New-device adoption: if our planner was empty and a foreign device had
        // data for the same uid+year, adopt the richest foreign planner.
        if (ownIsEmpty) {
            let best = null;
            for (const { uuid, doc } of this._docStore.list()) {
                if (uuid === plannerId) continue;
                if (doc.meta?.uid == myUid && doc.meta?.year == myYear) {
                    const days     = Object.keys(doc.days || {}).length;
                    const bestDays = Object.keys(best?.days || {}).length;
                    if (days > bestDays) best = doc;
                }
            }
            if (best) return best;
        }

        return merged;
    }

    // ── prune ────────────────────────────────────────────────────────────────

    prune(plannerId) {
        this._adapter.prune(plannerId);
    }

    pruneAll() {
        this._adapter.pruneAll();
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    _getApiUrl() {
        const raw = this.url;
        if (!raw || raw.startsWith('${')) return 'http://127.0.0.1:8081/';
        return raw.endsWith('/') ? raw : raw + '/';
    }
}
```

- [ ] **Step 3: Run sync-payload and HLC tests**

```bash
cd /Users/craig/src/github/alt-html/year-planner/.tests
npx playwright test e2e/sync-payload.spec.js e2e/hlc-write.spec.js --reporter=line
```

Expected: Both PASS.

- [ ] **Step 4: Run full regression**

```bash
cd /Users/craig/src/github/alt-html/year-planner/.tests
npx playwright test --reporter=line
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/craig/src/github/alt-html/year-planner
git add site/js/service/SyncClient.js
git commit -m "feat: replace SyncClient.js with jsmdma-client SyncClientAdapter wrapper"
```

---

## Task 4 — Trim StorageLocal.js

**Why:** Remove session management and simplify prefs to delegate to SDK. Also delegate device id. The app-specific planner CRUD, migration, and identity map code stays.

**Files:**
- Modify: `site/js/service/StorageLocal.js`

- [ ] **Step 1: Add SDK imports to StorageLocal.js**

Replace the existing import block at the top of `StorageLocal.js`. Add after all existing imports:
```js
import { ClientAuthSession, DeviceSession, PreferencesStore } from '../vendor/jsmdma-auth-client.esm.js';
```

(ClientAuthSession and DeviceSession were already added in Task 2. Add PreferencesStore here if not yet present.)

- [ ] **Step 2: Remove the 6 session management methods**

Delete the following methods entirely (they're no longer needed — ClientAuthSession owns the JWT):

- `setLocalSession(uuid, expires)` — lines ~323–325
- `getLocalSession()` — lines ~327–329
- `expireLocalSession()` — lines ~331–333
- `deleteLocalSession()` — lines ~335–337
- `extendLocalSession()` — lines ~339–344
- `signedin()` and `registered()` are kept but now 1-liners (already updated in Task 2)

- [ ] **Step 3: Delegate setLocalPreferences to PreferencesStore**

Replace the `localStorage.setItem(keyPrefs(uid), ...)` line in `setLocalPreferences()`:

Old (in setLocalPreferences, after building the `prefs` object):
```js
        localStorage.setItem(keyPrefs(uid), JSON.stringify(prefs));
```

New:
```js
        PreferencesStore.set(String(uid), prefs);
```

- [ ] **Step 4: Delegate getLocalPreferences to PreferencesStore**

Replace the `localStorage.getItem(keyPrefs(uid))` call in `getLocalPreferences()`:

Old:
```js
        const raw = localStorage.getItem(keyPrefs(uid));
        if (!raw) return null;
        const prefs = JSON.parse(raw);
```

New:
```js
        const prefs = PreferencesStore.get(String(uid));
        if (!prefs) return null;
```

(Remove the `JSON.parse(raw)` line and adjust the `raw` variable references.)

- [ ] **Step 5: Run migration + entry-crud tests**

```bash
cd /Users/craig/src/github/alt-html/year-planner/.tests
npx playwright test e2e/migration.spec.js e2e/entry-crud.spec.js --reporter=line
```

Expected: PASS.

- [ ] **Step 6: Run full regression**

```bash
cd /Users/craig/src/github/alt-html/year-planner/.tests
npx playwright test --reporter=line
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
cd /Users/craig/src/github/alt-html/year-planner
git add site/js/service/StorageLocal.js
git commit -m "refactor: trim StorageLocal — delegate session/prefs/device to jsmdma-auth-client SDK"
```

---

## Task 5 — Fix tp/col data bug

**Why:** `_getPlnrDoc()` returns raw parsed JSON. If Vue stored `tp: ''` or `col: ''`, the sync payload sends strings instead of integers. Fix at the read boundary so ALL callers get clean data.

**Files:**
- Modify: `site/js/service/StorageLocal.js`
- Create: `.tests/e2e/tp-col-coercion.spec.js`

- [ ] **Step 1: Write failing E2E test**

Create `.tests/e2e/tp-col-coercion.spec.js`:

```js
// .tests/e2e/tp-col-coercion.spec.js
// Verifies that sync payload sends tp/col as integers even when stored as '' in localStorage.
const { test, expect } = require('../fixtures/cdn');

function makeFakeJwt(sub = 'test-uuid') {
  function b64u(obj) {
    return Buffer.from(JSON.stringify(obj)).toString('base64url');
  }
  const now = Math.floor(Date.now() / 1000);
  return b64u({ alg: 'HS256', typ: 'JWT' }) + '.' +
         b64u({ sub, iat: now, iat_session: now }) + '.fakesig';
}

test('sync payload sends tp/col as integers not empty strings', async ({ page }) => {
  let capturedBody = null;

  await page.addInitScript((token) => {
    if (sessionStorage.getItem('_seeded')) return;
    sessionStorage.setItem('_seeded', '1');
    localStorage.clear();
    localStorage.setItem('auth_token', token);

    // Seed a planner with tp/col stored as empty strings (legacy Vue bug)
    const uuid = 'test-planner-tp-col';
    const doc = {
      meta: { uid: 12345, year: 2026, name: '2026', lang: 'en', theme: 'light', dark: false },
      days: {
        '2026-03-01': { tp: '', tl: 'work day', col: '', notes: '', emoji: '' },
        '2026-03-02': { tp: 1,  tl: 'event',    col: 2,  notes: '', emoji: '' },
      },
    };
    localStorage.setItem(`plnr:${uuid}`, JSON.stringify(doc));
    localStorage.setItem(`sync:${uuid}`, '0000000000000-000000-00000000');
    localStorage.setItem(`rev:${uuid}`,  '{}');
    localStorage.setItem(`base:${uuid}`, '{}');
  }, makeFakeJwt());

  await page.route('**/year-planner/sync', async (route) => {
    capturedBody = JSON.parse(route.request().postData() || 'null');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ serverClock: '0000000000001-000000-00000000', serverChanges: [] }),
    });
  });

  await page.goto('/?uid=12345&year=2026');
  await page.waitForSelector('[data-app-ready]');
  const deadline = Date.now() + 5000;
  while (capturedBody === null && Date.now() < deadline) {
    await page.waitForTimeout(100);
  }

  expect(capturedBody).not.toBeNull();
  const days = capturedBody.changes[0]?.doc?.days || {};
  const day = days['2026-03-01'];
  expect(day).toBeDefined();
  expect(typeof day.tp).toBe('number');
  expect(day.tp).toBe(0);
  expect(typeof day.col).toBe('number');
  expect(day.col).toBe(0);

  // Verify a real integer value also passes through correctly
  const day2 = days['2026-03-02'];
  expect(day2.tp).toBe(1);
  expect(day2.col).toBe(2);
});
```

- [ ] **Step 2: Run test — confirm it FAILS**

```bash
cd /Users/craig/src/github/alt-html/year-planner/.tests
npx playwright test e2e/tp-col-coercion.spec.js --reporter=line
```

Expected: FAIL — `tp` is `''` (string), not `0` (number).

- [ ] **Step 3: Fix _getPlnrDoc in StorageLocal.js**

In `StorageLocal._getPlnrDoc()`, after parsing:

```js
_getPlnrDoc(uuid) {
    const raw = localStorage.getItem(keyPlnr(uuid));
    if (!raw) return { meta: {}, days: {} };
    const doc = JSON.parse(raw);
    // Coerce tp/col to integers — guards against '' stored by Vue when field is cleared
    for (const dayObj of Object.values(doc.days || {})) {
        const tp  = parseInt(dayObj[F_TYPE], 10);
        const col = parseInt(dayObj[F_COL],  10);
        if (!Number.isFinite(tp))  dayObj[F_TYPE] = 0;
        if (!Number.isFinite(col)) dayObj[F_COL]  = 0;
    }
    return doc;
}
```

- [ ] **Step 4: Run test — confirm it PASSES**

```bash
cd /Users/craig/src/github/alt-html/year-planner/.tests
npx playwright test e2e/tp-col-coercion.spec.js --reporter=line
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/craig/src/github/alt-html/year-planner
git add site/js/service/StorageLocal.js .tests/e2e/tp-col-coercion.spec.js
git commit -m "fix: coerce tp/col to integers in _getPlnrDoc to prevent '' in sync payload"
```

---

## Task 6 — Comprehensive sign-out wipe

**Why:** Current `wipe()` only deletes planners for remote identities. Sign-out should clear all persisted data: planner docs, sync state, prefs, identities, and auth tokens — leaving only `dev` (device UUID is per-device, not per-identity).

**Files:**
- Modify: `site/js/service/StorageLocal.js`
- Modify: `site/js/vue/methods/auth.js`
- Create: `.tests/e2e/signout-wipe.spec.js`

- [ ] **Step 1: Write failing E2E test**

Create `.tests/e2e/signout-wipe.spec.js`:

```js
// .tests/e2e/signout-wipe.spec.js
// Verifies sign-out clears all auth, planner, sync, prefs, and identity keys.
const { test, expect } = require('../fixtures/cdn');

function makeFakeJwt(sub = 'test-uuid') {
  function b64u(obj) {
    return Buffer.from(JSON.stringify(obj)).toString('base64url');
  }
  const now = Math.floor(Date.now() / 1000);
  return b64u({ alg: 'HS256', typ: 'JWT' }) + '.' +
         b64u({ sub, iat: now, iat_session: now }) + '.fakesig';
}

test('sign-out clears all localStorage except dev key', async ({ page }) => {
  await page.addInitScript((token) => {
    localStorage.clear();
    localStorage.setItem('dev', 'stable-device-uuid');
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_provider', 'google');
    localStorage.setItem('auth_time', String(Date.now()));
    localStorage.setItem('ids', JSON.stringify([{ uuid: 'user-1', name: '', provider: 'google', email: '' }]));
    localStorage.setItem('prefs:12345', JSON.stringify({ year: 2026, lang: 'en' }));
    localStorage.setItem('plnr:abc-123', JSON.stringify({ meta: { uid: 12345 }, days: {} }));
    localStorage.setItem('rev:abc-123',  '{}');
    localStorage.setItem('base:abc-123', '{}');
    localStorage.setItem('sync:abc-123', '0000000000000-000000-00000000');
    localStorage.setItem('anon_uid', 'anon-device-uuid');
  }, makeFakeJwt());

  // Stub sync so it doesn't fire 401
  await page.route('**/year-planner/sync', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ serverClock: '0000000000001-000000-00000000', serverChanges: [] }) })
  );
  // Stub auth/google so sign-out doesn't hit network
  await page.route('**/auth/**', (route) => route.fulfill({ status: 404 }));

  await page.goto('/');
  await page.waitForSelector('[data-app-ready]');

  // Trigger sign-out via Vue method (simulate clicking the sign-out button)
  await page.evaluate(() => {
    // Access the Vue app instance and call signout directly
    const app = document.querySelector('[data-app-ready]').__vueParentComponent?.appContext?.app;
    if (app) {
      const vm = app._context?.app?._instance?.proxy;
      if (vm?.signout) vm.signout();
    }
  });

  // page will redirect to origin after wipe — wait for reload
  await page.waitForURL('http://localhost:8080/', { timeout: 5000 });

  const storage = await page.evaluate(() => {
    const result = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      result[k] = localStorage.getItem(k);
    }
    return result;
  });

  // auth keys must be gone
  expect(storage['auth_token']).toBeUndefined();
  expect(storage['auth_provider']).toBeUndefined();
  expect(storage['auth_time']).toBeUndefined();
  // planner/sync keys must be gone
  expect(storage['plnr:abc-123']).toBeUndefined();
  expect(storage['rev:abc-123']).toBeUndefined();
  expect(storage['base:abc-123']).toBeUndefined();
  expect(storage['sync:abc-123']).toBeUndefined();
  // prefs and ids must be gone
  expect(storage['prefs:12345']).toBeUndefined();
  expect(storage['ids']).toBeUndefined();
  expect(storage['anon_uid']).toBeUndefined();
  // dev key MUST survive — it's the stable device UUID
  expect(storage['dev']).toBe('stable-device-uuid');
});
```

- [ ] **Step 2: Run test — confirm it FAILS**

```bash
cd /Users/craig/src/github/alt-html/year-planner/.tests
npx playwright test e2e/signout-wipe.spec.js --reporter=line
```

Expected: FAIL — old `wipe()` only deletes remote-identity planners, leaves auth/prefs/ids.

- [ ] **Step 3: Replace StorageLocal.wipe() with comprehensive clear**

Replace the `wipe()` method body:

```js
wipe() {
    // Collect all keys to remove (can't removeItem while iterating)
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (k.startsWith('plnr:') || k.startsWith('rev:') ||
            k.startsWith('base:') || k.startsWith('sync:') ||
            k.startsWith('prefs:')) {
            toRemove.push(k);
        }
    }
    for (const k of toRemove) localStorage.removeItem(k);
    localStorage.removeItem('ids');
    localStorage.removeItem('anon_uid');
    // auth_token, auth_provider, auth_time are cleared by authProvider.signOut()
    window.location.href = window.location.origin;
}
```

- [ ] **Step 4: Update vue/methods/auth.js signout() to call authProvider.signOut() first**

Replace the `signout()` method body:

```js
signout() {
    this.authProvider.signOut(); // clears auth_token, auth_provider via ClientAuthSession.clear()
    this.uuid = '';
    this.signedin = false;
    this.storageLocal.wipe();    // clears plnr:*, rev:*, base:*, sync:*, prefs:*, ids, anon_uid → redirects
},
```

- [ ] **Step 5: Run test — confirm it PASSES**

```bash
cd /Users/craig/src/github/alt-html/year-planner/.tests
npx playwright test e2e/signout-wipe.spec.js --reporter=line
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
cd /Users/craig/src/github/alt-html/year-planner
git add site/js/service/StorageLocal.js site/js/vue/methods/auth.js \
        .tests/e2e/signout-wipe.spec.js
git commit -m "feat: comprehensive sign-out wipe — clear all auth/planner/prefs/identity storage"
```

---

## Task 7 — Sign-in pester modal (30-day)

**Why:** Unsigned users should see the sign-in modal once every 30 days so they're reminded to sync. The `pester_signin` localStorage key tracks the last show time.

**Files:**
- Modify: `site/js/Application.js`
- Modify: `site/js/vue/model/ui.js`
- Create: `.tests/e2e/signin-pester.spec.js`

- [ ] **Step 1: Write failing E2E test**

Create `.tests/e2e/signin-pester.spec.js`:

```js
// .tests/e2e/signin-pester.spec.js
// Verifies that the sign-in modal is shown automatically if the user is not
// signed in AND has not been pestered in the last 30 days.
const { test, expect } = require('../fixtures/cdn');

test('sign-in modal auto-shown when not signed in and pester not recent', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    // Ensure not signed in (no auth_token) and pester has never fired
    // pester_signin is absent — modal should show
  });

  await page.goto('/');
  await page.waitForSelector('[data-app-ready]');

  // Modal should appear automatically within 2 seconds of app ready
  await expect(page.locator('#authModal')).toHaveClass(/\bshow\b/, { timeout: 3000 });
});

test('sign-in modal NOT auto-shown if pestered recently', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    // Pretend we just pestered the user (1 hour ago)
    localStorage.setItem('pester_signin', String(Date.now() - 60 * 60 * 1000));
  });

  await page.goto('/');
  await page.waitForSelector('[data-app-ready]');

  // Wait a moment — modal must NOT appear
  await page.waitForTimeout(1500);
  const modal = page.locator('#authModal');
  const classes = await modal.getAttribute('class') || '';
  expect(classes).not.toMatch(/\bshow\b/);
});

test('sign-in modal NOT auto-shown if user is signed in', async ({ page }) => {
  await page.addInitScript(() => {
    function b64u(obj) {
      return btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    }
    const now = Math.floor(Date.now() / 1000);
    const token = b64u({ alg: 'HS256', typ: 'JWT' }) + '.' +
                  b64u({ sub: 'user-uuid', iat: now, iat_session: now }) + '.fakesig';
    localStorage.setItem('auth_token', token);
    // No pester_signin key
  });

  await page.route('**/year-planner/sync', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ serverClock: '0000000000001-000000-00000000', serverChanges: [] }) })
  );

  await page.goto('/');
  await page.waitForSelector('[data-app-ready]');
  await page.waitForTimeout(1500);

  const modal = page.locator('#authModal');
  const classes = await modal.getAttribute('class') || '';
  expect(classes).not.toMatch(/\bshow\b/);
});
```

- [ ] **Step 2: Run tests — confirm they FAIL (first test fails, others pass or fail differently)**

```bash
cd /Users/craig/src/github/alt-html/year-planner/.tests
npx playwright test e2e/signin-pester.spec.js --reporter=line
```

Expected: FAIL — modal is never auto-shown (no pester logic yet).

- [ ] **Step 3: Add _showSigninPester flag to Vue model**

In `site/js/vue/model/ui.js`, add the pester flag:
```js
export const uiState = {
    rename : false,
    error : '',
    warning : '',
    modalError : '',
    modalErrorTarget : null,
    modalWarning : '',
    modalSuccess : '',
    loaded : false,
    touch : '',
    _showSigninPester : false,
}
```

- [ ] **Step 4: Add pester logic to Application.init()**

In `Application.js`, at the END of `init()`, after all model assignments, add:
```js
// Sign-in pester: show auth modal once every 30 days if not signed in
if (!this.model.signedin) {
    const lastPester = parseInt(localStorage.getItem('pester_signin') || '0', 10);
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - lastPester > thirtyDaysMs) {
        localStorage.setItem('pester_signin', String(Date.now()));
        this.model._showSigninPester = true;
    }
}
```

- [ ] **Step 5: Wire pester flag to modal show in Vue lifecycle**

In `site/js/vue/methods/lifecycle.js`, in the `refresh()` method, add after `this.loaded = true;`:
```js
if (this._showSigninPester) {
    this._showSigninPester = false;
    this.$nextTick(() => { jQuery('#authModal').modal('show'); });
}
```

- [ ] **Step 6: Run tests — confirm all three PASS**

```bash
cd /Users/craig/src/github/alt-html/year-planner/.tests
npx playwright test e2e/signin-pester.spec.js --reporter=line
```

Expected: All 3 PASS.

- [ ] **Step 7: Commit**

```bash
cd /Users/craig/src/github/alt-html/year-planner
git add site/js/Application.js site/js/vue/model/ui.js site/js/vue/methods/lifecycle.js \
        .tests/e2e/signin-pester.spec.js
git commit -m "feat: sign-in pester modal — auto-show auth modal every 30 days for unsigned users"
```

---

## Task 8 — Rail toggle preference

**Why:** The sidebar rail's open/closed state should persist across page loads via PreferencesStore.

**Files:**
- Modify: `site/js/Application.js`
- Modify: `site/js/vue/model/ui.js`
- Create: `.tests/e2e/rail-toggle.spec.js`

The rail toggle is a CSS class on `<nav class="yp-rail" id="rail">`. Toggling `yp-rail--collapsed` collapses the nav.

- [ ] **Step 1: Write failing E2E test**

Create `.tests/e2e/rail-toggle.spec.js`:

```js
// .tests/e2e/rail-toggle.spec.js
// Verifies that the rail open/closed state persists via preferences.
const { test, expect } = require('../fixtures/cdn');

test('rail collapsed state persists across page reload', async ({ page }) => {
  // Start fresh — rail should be open by default
  await page.addInitScript(() => { localStorage.clear(); });
  await page.goto('/');
  await page.waitForSelector('[data-app-ready]');

  // Rail is open by default
  const rail = page.locator('#rail');
  await expect(rail).not.toHaveClass(/yp-rail--collapsed/);

  // Click the rail toggle button (if it exists) or trigger the toggle via JS
  await page.evaluate(() => {
    // Dispatch a custom toggle event — the Vue app handles it
    document.dispatchEvent(new CustomEvent('yp-rail-toggle'));
  });

  // Verify rail is now collapsed
  await expect(rail).toHaveClass(/yp-rail--collapsed/, { timeout: 1000 });

  // Reload the page
  await page.reload();
  await page.waitForSelector('[data-app-ready]');

  // Rail should still be collapsed after reload (pref persisted)
  await expect(page.locator('#rail')).toHaveClass(/yp-rail--collapsed/, { timeout: 1000 });
});
```

- [ ] **Step 2: Run test — confirm it FAILS**

```bash
cd /Users/craig/src/github/alt-html/year-planner/.tests
npx playwright test e2e/rail-toggle.spec.js --reporter=line
```

Expected: FAIL — no toggle logic or persistence yet.

- [ ] **Step 3: Add railCollapsed to uiState**

In `site/js/vue/model/ui.js`:
```js
export const uiState = {
    rename : false,
    error : '',
    warning : '',
    modalError : '',
    modalErrorTarget : null,
    modalWarning : '',
    modalSuccess : '',
    loaded : false,
    touch : '',
    _showSigninPester : false,
    railCollapsed : false,
}
```

- [ ] **Step 4: Add rail toggle handler and persistence to Application.js**

In `Application.js init()`, add at the end (after pester logic):
```js
// Restore rail collapsed state from preferences
const savedPrefs = this.storageLocal.getLocalPreferences(this.model.uid);
this.model.railCollapsed = !!(savedPrefs?.railOpen === false);
```

Add a static helper method at the bottom of the class (before the closing `}`):
```js
static handleRailToggle(model, storageLocal) {
    model.railCollapsed = !model.railCollapsed;
    const uid = model.uid;
    const prefs = storageLocal.getLocalPreferences(uid) || {};
    storageLocal.setLocalPreferences(uid, { ...prefs, railOpen: !model.railCollapsed });
}
```

- [ ] **Step 5: Wire the toggle event in Application.run()**

In `Application.run()`, add after the tooltip init:
```js
const self = this;
document.addEventListener('yp-rail-toggle', () => {
    Application.handleRailToggle(self.model, self.storageLocal);
    const rail = document.getElementById('rail');
    if (rail) rail.classList.toggle('yp-rail--collapsed', self.model.railCollapsed);
});
```

- [ ] **Step 6: Apply initial CSS class in Application.run()**

In `Application.run()`, add before the `$('[data-toggle="tooltip"]')` call:
```js
const rail = document.getElementById('rail');
if (rail && this.model.railCollapsed) rail.classList.add('yp-rail--collapsed');
```

- [ ] **Step 7: Run rail test — confirm it PASSES**

```bash
cd /Users/craig/src/github/alt-html/year-planner/.tests
npx playwright test e2e/rail-toggle.spec.js --reporter=line
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
cd /Users/craig/src/github/alt-html/year-planner
git add site/js/Application.js site/js/vue/model/ui.js .tests/e2e/rail-toggle.spec.js
git commit -m "feat: persist rail toggle (open/closed) in preferences"
```

---

## Task 9 — Full regression test run

**Why:** Verify all previously-passing tests still pass after all changes.

- [ ] **Step 1: Run the complete E2E suite**

```bash
cd /Users/craig/src/github/alt-html/year-planner/.tests
npx playwright test --reporter=line
```

Expected: All tests pass.

- [ ] **Step 2: If any tests fail, fix them**

Common failure causes:
- Any spec that still seeds `localStorage.setItem('1', ...)` → update to seed `auth_token` (pattern from Task 1)
- Any spec that checks `signedin` behaviour → update mock to use JWT token
- Any spec that tests wipe → may need adjustment after Task 6

Fix each failing test, run only that spec to confirm pass, then re-run full suite.

- [ ] **Step 3: Commit any test fixes**

```bash
cd /Users/craig/src/github/alt-html/year-planner
git add .tests/
git commit -m "test: fix remaining E2E specs for ClientAuthSession migration"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Replace SyncClient.js with SyncClientAdapter wrapper → Task 3
- ✅ Replace AuthProvider.js token storage with ClientAuthSession → Task 2
- ✅ Shrink StorageLocal.js — remove session/prefs/dev → Tasks 2 & 4
- ✅ Wire SDK classes throughout app → Tasks 2 & 4
- ✅ Fix tp/col data bug → Task 5
- ✅ Sign-in pester (30 days) → Task 7
- ✅ Sign-out wipe (comprehensive) → Task 6
- ✅ New-device planner adoption → Task 3 (adoption logic in SyncClient wrapper)
- ✅ Rail toggle preference → Task 8

**Known scope note:** IdentityStore is not used for StorageLocal's identity map — the existing `setLocalIdentities/getLocalIdentities` retain their own localStorage implementation because year-planner's `{0:uid, 1:agent, 2:remote}` format is incompatible with IdentityStore's `{uuid, name, provider, email}` format. Both use the `ids` key, so `wipe()` clears identities via `localStorage.removeItem('ids')` directly.
