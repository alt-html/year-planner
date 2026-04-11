# Spec D: jsmdma Sync Validation + Year-Planner Data Layer Alignment

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Validate the jsmdma bidirectional sync protocol with two-client integration tests, then realign the year-planner UI layer so that `model.days === localStorage === remote sync` — one source of truth, no conversion layers, no dual-write conflicts.

**Architecture:** A new `PlannerStore` anti-corruption layer bridges jsmdma's `DocumentStore` to Vue's reactive model. `model.days` is a plain reactive object keyed by ISO date strings, replacing the legacy 12-element month array. A `SyncScheduler` replaces scattered `api.sync()` calls with event-driven triggers (`online`, `visibilitychange`, debounce). Planner ownership moves from a numeric timestamp uid to the JWT uuid (signed-in) or device UUID (anonymous).

**Repositories:**
- `@alt-javascript/jsmdma` — `packages/core/` (sync engine + new integration tests)
- `@alt-html/year-planner` — `site/js/` (PlannerStore, SyncScheduler, identity refactor, Vue alignment)

**Tech Stack:** Mocha/Chai (jsmdma tests), vanilla ES modules (year-planner), Vue 3, jsmdma-client SDK, jsmdma-auth-client SDK, CDI singleton wiring.

---

## Part 1 — jsmdma-core: Bidirectional Sync Integration Tests

### Context

`packages/core/test/SyncClient.spec.js` already covers:
- `edit()`, `getChanges()`, `sync()`, `prune()`, `shouldPrune()`
- `getSnapshot()` / `fromSnapshot()` round-trip
- Isomorphism audit (no Node-specific imports)

**Missing:** two-client convergence, conflict resolution, offline reconnect, server-as-client symmetry. These are the tests that validate the central claim — "server is just another client."

---

### Task 1: Two-client convergence tests

**File:** `packages/core/test/SyncClient.spec.js` — add `describe('two-client bidirectional sync', ...)` block

A mock server function is needed. Add this helper at the top of the spec file alongside the existing `makeServerResponse` / `makeServerDoc` helpers:

```js
/**
 * Minimal mock server: receives changes from one client, stores them,
 * and returns all known docs as serverChanges to any syncing client.
 * Uses a SyncClient internally to demonstrate server-as-client symmetry.
 */
function createMockServer(nodeId = 'server') {
  const server = new SyncClient(nodeId, 0);
  let serverClock = HLC.tick(HLC.zero(), 1);

  return {
    sync(clientChanges, wallMs = Date.now()) {
      // Apply each incoming change to server state
      for (const change of clientChanges) {
        server.edit(change.key, change.doc, wallMs);
      }
      serverClock = HLC.tick(serverClock, wallMs);

      // Return all known docs as serverChanges
      const serverChanges = Object.entries(server.docs).map(([key, entry]) => ({
        _key: key,
        _fieldRevs: entry.fieldRevs,
        ...entry.doc,
      }));

      return { serverClock, serverChanges };
    },
    get docs() { return server.docs; },
  };
}
```

**Tests to add:**

```js
describe('two-client bidirectional sync', () => {

  it('two clients editing different fields converge after mutual sync', () => {
    const mockServer = createMockServer();
    const clientA = new SyncClient('device-a', 1000);
    const clientB = new SyncClient('device-b', 2000);

    // Client A edits the 'title' field
    clientA.edit('doc/1', { title: 'A title', note: '' }, 1000);

    // Client A syncs to server
    const respA = mockServer.sync(clientA.getChanges(), 3000);
    clientA.sync(respA, 3000);

    // Client B edits the 'note' field (different field — no conflict)
    clientB.edit('doc/1', { title: '', note: 'B note' }, 2000);

    // Client B syncs to server
    const respB = mockServer.sync(clientB.getChanges(), 4000);
    clientB.sync(respB, 4000);

    // Client A syncs again to receive B's changes
    const respA2 = mockServer.sync(clientA.getChanges(), 5000);
    clientA.sync(respA2, 5000);

    // Both clients must converge: A's title + B's note
    assert.equal(clientA.docs['doc/1'].doc.title, 'A title');
    assert.equal(clientA.docs['doc/1'].doc.note, 'B note');
    assert.equal(clientB.docs['doc/1'].doc.title, 'A title');
    assert.equal(clientB.docs['doc/1'].doc.note, 'B note');
  });

  it('two clients editing the same field — higher HLC wins, both converge', () => {
    const mockServer = createMockServer();
    const clientA = new SyncClient('device-a', 1000);
    const clientB = new SyncClient('device-b', 9000); // B has higher wall clock

    clientA.edit('doc/1', { title: 'A wins?' }, 1000);
    clientB.edit('doc/1', { title: 'B wins' }, 9000); // B's HLC will be higher

    // Both sync to server
    mockServer.sync(clientA.getChanges(), 10000);
    const respB = mockServer.sync(clientB.getChanges(), 10000);
    clientB.sync(respB, 10000);

    const respA = mockServer.sync(clientA.getChanges(), 11000);
    clientA.sync(respA, 11000);

    // Sync again so each client gets the other's latest
    const respB2 = mockServer.sync(clientB.getChanges(), 12000);
    clientB.sync(respB2, 12000);

    // B had the higher HLC — B's value should win on both clients
    assert.equal(clientA.docs['doc/1'].doc.title, 'B wins');
    assert.equal(clientB.docs['doc/1'].doc.title, 'B wins');
  });

  it('offline client catches up in a single sync after reconnect', () => {
    const mockServer = createMockServer();
    const clientA = new SyncClient('device-a', 1000);
    const clientB = new SyncClient('device-b', 2000);

    // Client B goes offline — makes 3 edits without syncing
    clientB.edit('doc/1', { v: 1 }, 2000);
    clientB.edit('doc/1', { v: 2 }, 3000);
    clientB.edit('doc/1', { v: 3 }, 4000);

    // Client A syncs normally
    clientA.edit('doc/1', { v: 0, extra: 'from-a' }, 1000);
    const respA = mockServer.sync(clientA.getChanges(), 5000);
    clientA.sync(respA, 5000);

    // Client B reconnects — single sync call
    const respB = mockServer.sync(clientB.getChanges(), 6000);
    clientB.sync(respB, 6000);

    // Client A syncs once more to get B's changes
    const respA2 = mockServer.sync(clientA.getChanges(), 7000);
    clientA.sync(respA2, 7000);

    // Both converge: B's latest v=3 wins (higher HLC), A's 'extra' field preserved
    assert.equal(clientA.docs['doc/1'].doc.v, 3);
    assert.equal(clientA.docs['doc/1'].doc.extra, 'from-a');
    assert.equal(clientB.docs['doc/1'].doc.v, 3);
    assert.equal(clientB.docs['doc/1'].doc.extra, 'from-a');
  });

  it('server-as-client symmetry: server SyncClient produces identical merge to client', () => {
    // Both 'sides' use the same SyncClient code — the merge result must be identical
    // regardless of which side is labelled 'server' or 'client'.
    const side1 = new SyncClient('side-1', 1000);
    const side2 = new SyncClient('side-2', 2000);

    side1.edit('doc/1', { a: 1, b: 0 }, 1000);
    side2.edit('doc/1', { a: 0, b: 2 }, 2000);

    // side1 sends changes to side2 (acting as server)
    const changes1 = side1.getChanges();
    const serverResp = {
      serverClock: HLC.tick(HLC.zero(), 5000),
      serverChanges: changes1.map(c => ({
        _key: c.key,
        _fieldRevs: c.fieldRevs,
        ...c.doc,
      })),
    };
    side2.sync(serverResp, 5000);

    // side2 sends changes back to side1 (now side2 acts as server)
    const changes2 = side2.getChanges();
    const clientResp = {
      serverClock: HLC.tick(HLC.zero(), 6000),
      serverChanges: changes2.map(c => ({
        _key: c.key,
        _fieldRevs: c.fieldRevs,
        ...c.doc,
      })),
    };
    side1.sync(clientResp, 6000);

    // Both sides must converge to the same merged result
    assert.deepEqual(
      side1.docs['doc/1'].doc,
      side2.docs['doc/1'].doc,
      'Both sides must converge to identical merged doc regardless of client/server labelling'
    );
  });

  it('snapshot round-trip preserves sync ability across serialisation boundary', () => {
    // Simulates a browser tab close + reopen: state is serialised to localStorage
    // and restored, then sync continues correctly.
    const mockServer = createMockServer();
    const clientA = new SyncClient('device-a', 1000);

    clientA.edit('doc/1', { title: 'Before snap' }, 1000);
    const resp1 = mockServer.sync(clientA.getChanges(), 2000);
    clientA.sync(resp1, 2000);

    // Serialise and restore (simulates localStorage round-trip)
    const snap = JSON.parse(JSON.stringify(clientA.getSnapshot()));
    const restored = SyncClient.fromSnapshot(snap);

    // Make a new edit on the restored client
    restored.edit('doc/1', { title: 'After snap' }, 3000);
    const resp2 = mockServer.sync(restored.getChanges(), 4000);
    restored.sync(resp2, 4000);

    // Restored client must have the latest value
    assert.equal(restored.docs['doc/1'].doc.title, 'After snap');
    // Server must also have it
    assert.equal(mockServer.docs['doc/1'].doc.title, 'After snap');
  });

});
```

- [ ] Add `createMockServer` helper to `SyncClient.spec.js`
- [ ] Add the five `two-client bidirectional sync` tests above
- [ ] Run `npm test --workspace=packages/core` — all tests pass

---

## Part 2 — Year-Planner: Identity Model Refactor

### Context

`model.uid` is currently `Math.floor(pageLoadTime.ts/1000)` — a Unix timestamp that differs on every new device. Cross-device sync requires patching `meta.uid` after adoption, which is a fragile workaround. The clean model: when signed in, planner ownership key = JWT `uuid` (sub claim); when anonymous, ownership key = device UUID from `DeviceSession.getDeviceId()`.

**Key:** `userKey` replaces `uid` as the planner lookup key throughout. Numeric `uid` is kept only as a legacy display/identity concept if needed by the UI, but is never used for planner storage lookups.

---

### Task 2: Replace uid with userKey in Application.js and model

**Files:**
- Modify: `site/js/Application.js`
- Modify: `site/js/vue/model/planner.js`

**In `Application.js`:**

Replace:
```js
this.model.uid = parseInt( urlParam('uid') ) || this.storageLocal.getLocalUid() || Math.floor(this.pageLoadTime.ts/1000);
```

With:
```js
const authUuid   = ClientAuthSession.getUserUuid();
const deviceUuid = DeviceSession.getDeviceId();
this.model.userKey = authUuid || deviceUuid;
// Keep legacy uid for URL param compat and display only — not used for planner lookup
this.model.uid = parseInt(urlParam('uid')) || this.storageLocal.getLocalUid() || Math.floor(this.pageLoadTime.ts/1000);
```

**In `model/planner.js`:**

Add `userKey: null` to `plannerState`.

- [ ] Add `userKey` to `plannerState` in `model/planner.js`
- [ ] Compute `model.userKey` in `Application.js` as above
- [ ] Update `refresh()` in `lifecycle.js` to pass `userKey` to `plannerStore.activateDoc(userKey, year)` instead of `storageLocal.getActivePlnrUuid(uid, year)`
- [ ] Commit: `refactor: introduce userKey — JWT uuid or device UUID replaces uid for planner lookup`

---

## Part 3 — Year-Planner: PlannerStore

### Context

`PlannerStore` is the anti-corruption layer between jsmdma's `DocumentStore` and Vue's reactive model. It is the **only** place in the app that reads/writes planner documents. It owns the `DocumentStore` instance (namespace=`plnr`) and the `SyncClientAdapter` instance previously held by `SyncClient.js`.

`model.days` is a Vue reactive plain object (`{}`) keyed by ISO date strings. `PlannerStore` keeps it in sync with the active DocumentStore document.

---

### Task 3: Create PlannerStore.js

**File:** Create `site/js/service/PlannerStore.js`

```js
/**
 * PlannerStore.js — anti-corruption layer between jsmdma DocumentStore and Vue.
 *
 * Single source of truth for planner data.
 * - Owns DocumentStore (namespace='plnr') — the only writer of plnr:* localStorage keys.
 * - Owns SyncClientAdapter — HLC field tracking and HTTP sync.
 * - Exposes model.days as the Vue reactive surface (ISO-date keyed object).
 *
 * CDI singleton — wired via contexts.js.
 */
import { DocumentStore, SyncClientAdapter } from '../vendor/jsmdma-client.esm.js';
import { ClientAuthSession, DeviceSession } from '../vendor/jsmdma-auth-client.esm.js';

export default class PlannerStore {
  constructor(model) {
    this.qualifier = '@alt-html/year-planner/PlannerStore';
    this.logger = null;
    this.model = model;
    this.url = '${api.url}';

    this._docStore = new DocumentStore({ namespace: 'plnr' });
    this._adapter  = new SyncClientAdapter(this._docStore, { collection: 'planners' });
    this._activeUuid = null;
  }

  // ── Identity ─────────────────────────────────────────────────────────────────

  getUserKey() {
    return ClientAuthSession.getUserUuid() || DeviceSession.getDeviceId();
  }

  // ── Document lifecycle ───────────────────────────────────────────────────────

  /**
   * Find or create the planner doc for userKey+year, activate it as model.days.
   * @param {string} userKey — JWT uuid or device UUID
   * @param {number} year
   */
  activateDoc(userKey, year) {
    let uuid = this._findDoc(userKey, year);
    if (!uuid) uuid = this._createDoc(userKey, year);
    this._activeUuid = uuid;
    this._syncModelDays();
    this.logger?.debug?.(`[PlannerStore] activated doc uuid=${uuid} userKey=${userKey} year=${year} days=${Object.keys(this.model.days).length}`);
    return uuid;
  }

  getActiveUuid() {
    return this._activeUuid;
  }

  // ── Day read/write ───────────────────────────────────────────────────────────

  /**
   * Write a day entry. Updates model.days, DocumentStore, and marks HLC edit.
   * @param {string} isoDate — 'YYYY-MM-DD'
   * @param {object} dayObj  — { tp, tl, col, notes, emoji }
   */
  setDay(isoDate, dayObj) {
    if (!this._activeUuid) { this.logger?.warn?.('[PlannerStore] setDay called before activateDoc'); return; }

    // Coerce integer fields
    const tp  = parseInt(dayObj.tp,  10);
    const col = parseInt(dayObj.col, 10);
    const entry = {
      ...dayObj,
      tp:  Number.isFinite(tp)  ? tp  : 0,
      col: Number.isFinite(col) ? col : 0,
    };

    // Skip empty entries
    const isEmpty = !entry.tl && !entry.notes && !entry.emoji && !entry.tp && !entry.col;

    const doc = this._docStore.get(this._activeUuid) || { meta: {}, days: {} };
    if (isEmpty) {
      delete doc.days[isoDate];
    } else {
      doc.days[isoDate] = entry;
    }
    this._docStore.set(this._activeUuid, doc);

    // Mirror to Vue reactive model
    if (isEmpty) {
      delete this.model.days[isoDate];
    } else {
      this.model.days[isoDate] = entry;
    }

    // HLC field tracking for sync
    for (const field of ['tp', 'tl', 'col', 'notes', 'emoji']) {
      this._adapter.markEdited(this._activeUuid, `days.${isoDate}.${field}`);
    }

    this.model.updated = Date.now();
    this.logger?.debug?.(`[PlannerStore] setDay isoDate=${isoDate} tl=${entry.tl}`);
  }

  getDay(isoDate) {
    return this.model.days[isoDate] || null;
  }

  // ── Sync ─────────────────────────────────────────────────────────────────────

  async syncActive(authHeaders) {
    if (!this._activeUuid) return;
    const syncUrl = this._getApiUrl() + 'year-planner/sync';
    const doc = this._docStore.get(this._activeUuid) || { meta: {}, days: {} };
    this.logger?.debug?.(`[PlannerStore] sync start uuid=${this._activeUuid} days=${Object.keys(doc.days||{}).length}`);
    const merged = await this._adapter.sync(this._activeUuid, doc, authHeaders, syncUrl);
    if (merged) {
      this._docStore.set(this._activeUuid, merged);
      this._syncModelDays();
      this.logger?.debug?.(`[PlannerStore] sync complete days=${Object.keys(merged.days||{}).length}`);
    }
    return merged;
  }

  // ── Adoption (new-device, anon→signed-in) ────────────────────────────────────

  /**
   * After sign-in: look for a richer planner from the server for this year.
   * If own planner is empty and a foreign doc arrived, migrate ownership.
   * @param {string} userKey — new authenticated userKey (JWT uuid)
   * @param {number} year
   */
  adoptIfEmpty(userKey, year) {
    const doc = this._docStore.get(this._activeUuid);
    const ownIsEmpty = !doc?.days || Object.keys(doc.days).length === 0;
    if (!ownIsEmpty) return;

    let best = null;
    for (const { uuid, doc: d } of this._docStore.list()) {
      if (uuid === this._activeUuid) continue;
      if (d.meta?.year == year) {
        const days = Object.keys(d.days || {}).length;
        if (days > Object.keys(best?.days || {}).length) best = { uuid, doc: d };
      }
    }
    if (!best) return;

    // Re-key the adopted doc to this userKey+year
    const adoptedDoc = { ...best.doc, meta: { ...best.doc.meta, userKey, year } };
    this._docStore.set(this._activeUuid, adoptedDoc);
    this._syncModelDays();
    this.logger?.debug?.(`[PlannerStore] adopted doc from uuid=${best.uuid} days=${Object.keys(adoptedDoc.days).length}`);
  }

  // ── Planner list (for switcher UI) ───────────────────────────────────────────

  listPlanners() {
    return this._docStore.list().map(({ uuid, doc }) => ({
      uuid,
      meta: doc.meta || {},
    }));
  }

  // ── Prune ────────────────────────────────────────────────────────────────────

  prune(uuid) { this._adapter.prune(uuid); }
  pruneAll()  { this._adapter.pruneAll(); }

  // ── Private ──────────────────────────────────────────────────────────────────

  _findDoc(userKey, year) {
    for (const { uuid, doc } of this._docStore.list()) {
      if (doc.meta?.userKey === userKey && doc.meta?.year == year) return uuid;
      // Migration compat: old docs may have meta.uid (numeric) — accept them
      if (doc.meta?.uid && String(doc.meta.uid) === String(userKey) && doc.meta?.year == year) return uuid;
    }
    return null;
  }

  _createDoc(userKey, year) {
    const uuid = crypto.randomUUID();
    const doc = {
      meta: { userKey, year, lang: this.model?.lang || 'en', theme: this.model?.theme || 'light', created: Date.now() },
      days: {},
    };
    this._docStore.set(uuid, doc);
    return uuid;
  }

  _syncModelDays() {
    const doc = this._docStore.get(this._activeUuid);
    // Replace model.days contents in-place so Vue reactivity is preserved
    const days = doc?.days || {};
    for (const k of Object.keys(this.model.days)) {
      if (!days[k]) delete this.model.days[k];
    }
    for (const [k, v] of Object.entries(days)) {
      this.model.days[k] = v;
    }
  }

  _getApiUrl() {
    const raw = this.url;
    if (!raw || raw.startsWith('${')) return 'http://127.0.0.1:8081/';
    return raw.endsWith('/') ? raw : raw + '/';
  }
}
```

- [ ] Write the file as above
- [ ] Register `PlannerStore` as a CDI singleton in `contexts.js` — add `import PlannerStore from '../service/PlannerStore.js'` and `new Singleton(PlannerStore)` to the context array
- [ ] Add `plannerStore: null` to the Vue model in `model.js` (CDI injects it like `api`, `storageLocal`)
- [ ] Commit: `feat: add PlannerStore — single source of truth for planner docs`

---

## Part 4 — Year-Planner: SyncScheduler

### Context

`api.sync(plannerId)` is called explicitly in 4 Vue methods today (lifecycle.refresh, entries.updateEntryState, auth.signInWith, and entries.updateEntry). This scatter means any new entry point can forget to call sync. A `SyncScheduler` singleton owns all trigger logic.

---

### Task 4: Create SyncScheduler.js

**File:** Create `site/js/service/SyncScheduler.js`

```js
/**
 * SyncScheduler.js — event-driven sync trigger.
 *
 * Syncs on:
 *   - 300ms debounce after any edit (markDirty)
 *   - window 'online' event (reconnect)
 *   - document 'visibilitychange' when tab regains focus
 *
 * CDI singleton. Call start() once after application init.
 */
export default class SyncScheduler {
  constructor(api, plannerStore) {
    this.qualifier = '@alt-html/year-planner/SyncScheduler';
    this.logger = null;
    this.api = api;
    this.plannerStore = plannerStore;
    this._debounceTimer = null;
    this._started = false;
  }

  start() {
    if (this._started) return;
    this._started = true;
    window.addEventListener('online', () => {
      this.logger?.debug?.('[SyncScheduler] online event — syncing');
      this._sync();
    });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.logger?.debug?.('[SyncScheduler] tab visible — syncing');
        this._sync();
      }
    });
    this.logger?.debug?.('[SyncScheduler] started');
  }

  markDirty() {
    clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(() => {
      this.logger?.debug?.('[SyncScheduler] debounce fired — syncing');
      this._sync();
    }, 300);
  }

  _sync() {
    if (this.plannerStore?.getActiveUuid()) this.api.sync();
  }
}
```

- [ ] Write the file as above
- [ ] Register `SyncScheduler` as CDI singleton in `contexts.js`
- [ ] Add `syncScheduler: null` to the Vue model
- [ ] In `Application.run()`, call `this.syncScheduler?.start()` (inject via CDI or call from `onReady` in `main.js`)
- [ ] Commit: `feat: add SyncScheduler — online/visibilitychange/debounce sync triggers`

---

## Part 5 — Year-Planner: Vue Model and Template Alignment

### Context

`model.planner` (12-element month array) is replaced by `model.days` (ISO-date keyed object). All Vue templates and methods that reference `planner[m][d]` are updated. The calendar renders by iterating the date grid for the current month and looking up `days['YYYY-MM-DD']`.

---

### Task 5: Replace model.planner with model.days

**Files:**
- Modify: `site/js/vue/model/planner.js`
- Modify: `site/js/vue/methods/entries.js`
- Modify: `site/js/vue/methods/planner.js`
- Modify: `site/js/vue/methods/calendar.js` (if it references planner)
- Modify: `site/js/vue/methods/lifecycle.js`

**In `model/planner.js`** — replace `planner: null` with:
```js
days: {},           // ISO-date keyed: { 'YYYY-MM-DD': { tp, tl, col, notes, emoji } }
activeDocUuid: null,
userKey: null,
```
Remove: `planner`, `uid` (keep `uid` only if still needed for URL param display).

**In `entries.js`** — replace `updateLocalEntry` call:

```js
updateEntry(mindex, day, entry, entryType, entryColour, notes = '', emoji = '', syncToRemote = false) {
  const year  = this.year;
  const month = String(mindex + 1).padStart(2, '0');
  const d     = String(day).padStart(2, '0');
  const isoDate = `${year}-${month}-${d}`;

  this.plannerStore.setDay(isoDate, {
    tp: entryType, tl: entry, col: entryColour, notes, emoji,
  });

  this.syncScheduler.markDirty();
},

updateEntryState(mindex, day) {
  this.month = mindex;
  this.day   = day;
  const isoDate = `${this.year}-${String(mindex+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  const d = this.days[isoDate] || {};
  this.entry       = d.tl    || '';
  this.entryType   = d.tp    || 0;
  this.entryColour = d.col   || 0;
  this.entryNotes  = d.notes || '';
  this.entryEmoji  = d.emoji || '';
},

getEntry(mindex, day) {
  const isoDate = `${this.year}-${String(mindex+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  return this.days[isoDate]?.tl || '';
},
getEntryType(mindex, day) {
  const isoDate = `${this.year}-${String(mindex+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  return this.days[isoDate]?.tp || 0;
},
getEntryColour(mindex, day) {
  const isoDate = `${this.year}-${String(mindex+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  return this.days[isoDate]?.col || 0;
},
getEntryNotes(mindex, day) {
  const isoDate = `${this.year}-${String(mindex+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  return this.days[isoDate]?.notes || '';
},
getEntryEmoji(mindex, day) {
  const isoDate = `${this.year}-${String(mindex+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  return this.days[isoDate]?.emoji || '';
},
```

**In `lifecycle.js`** — replace `initialise()` and `refresh()`:

```js
refresh() {
  this.logger?.debug?.(`[lifecycle.refresh] uid=${this.uid} year=${this.year} signedin=${this.signedin}`);
  this.setYear(this.year);
  if (!this.storageLocal.initialised()) {
    this.logger?.debug?.('[lifecycle.refresh] not initialised — calling initialise()');
    this.initialise();
  }
  const userKey = this.plannerStore.getUserKey();
  this.activeDocUuid = this.plannerStore.activateDoc(userKey, this.year);
  // Sync is handled by SyncScheduler — no explicit api.sync() call here
  this.storageLocal.setLocalFromModel();
  if (this.theme === 'dark') {
    document.body.classList.add('yp-dark');
  } else {
    document.body.classList.remove('yp-dark');
  }
  this.loaded = true;
  if (this._showSigninPester) {
    this._showSigninPester = false;
    this.$nextTick(() => { jQuery('#authModal').modal('show'); });
  }
},
```

- [ ] Update `model/planner.js` as above
- [ ] Update `entries.js` as above (all getEntry* methods + updateEntry + updateEntryState)
- [ ] Update `lifecycle.js` as above (refresh, remove explicit sync calls)
- [ ] Search for any remaining `this.planner[` references in Vue methods and templates — update each to use `this.days[isoDate]`
- [ ] Commit: `refactor: replace model.planner month array with model.days ISO map`

---

## Part 6 — Year-Planner: StorageLocal Planner Method Removal

### Context

`StorageLocal` no longer owns planner read/write. The planner-related methods and conversion functions are deleted. What remains: preferences, identities, wipe, migration (updated for userKey).

---

### Task 6: Strip planner methods from StorageLocal

**File:** Modify `site/js/service/StorageLocal.js`

**Delete entirely:**
- `getLocalPlanner(uuidOrUid, year)`
- `setLocalPlanner(uuidOrUid, year, months)`
- `updateLocalEntry(mindex, day, entry, ...)`
- `_docToMonthArray(doc)`
- `_monthArrayToDays(year, months)`
- `_findPlnrUuid(uid, year)` — moved to PlannerStore
- `_createPlnr(uid, year, ...)` — moved to PlannerStore
- `_findOrCreatePlnr()`
- `getActivePlnrUuid(uid, year)` — replaced by `plannerStore.getActiveUuid()`
- `_getPlnrDoc(uuid)` / `_setPlnrDoc(uuid, doc)` — DocumentStore owns this now
- `deleteLocalPlanner(uid)` / `deletePlannerByYear(uid, year)` — move to PlannerStore as `deletePlanner(userKey, year)` calling `this._docStore.delete(uuid)` and `this._adapter.prune(uuid)`
- `importLocalPlanner(planner)` / `importLocalPlannerFromJSON` / `importLocalPlannerFromBase64` — update to iterate entries and call `plannerStore.setDay(isoDate, dayObj)` instead of writing to `model.planner`

**Update `setLocalFromModel()`** — remove planner write (PlannerStore owns it):
```js
setLocalFromModel() {
  this.setLocalIdentities(this.model.identities);
  this.setLocalPreferences(this.model.uid, this.model.preferences);
  // Planner persistence is owned by PlannerStore — no planner write here
}
```

**Update `migrate()`** — add userKey rewrite for existing docs:
```js
// After migration runs, re-key any plnr:* docs that have meta.uid but not meta.userKey
// (handles devices that had data before this refactor)
_migrateUserKey() {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith('plnr:')) continue;
    try {
      const doc = JSON.parse(localStorage.getItem(key));
      if (doc?.meta && doc.meta.uid && !doc.meta.userKey) {
        // Assign userKey = current authenticated uuid or device uuid
        const userKey = ClientAuthSession.getUserUuid() || DeviceSession.getDeviceId();
        doc.meta.userKey = userKey;
        localStorage.setItem(key, JSON.stringify(doc));
      }
    } catch (e) { /* skip corrupt */ }
  }
}
```
Call `this._migrateUserKey()` at the end of `migrate()`.

**Delete from imports:** `HLC`, `HLC_ZERO`, `keyPlnr`, `F_TYPE`, `F_TL`, `F_COL`, `F_NOTES`, `F_EMOJI` (if only used by deleted methods — check storage-schema.js).

- [ ] Delete the listed methods from StorageLocal
- [ ] Update `setLocalFromModel()` as above
- [ ] Add `_migrateUserKey()` and call it from `migrate()`
- [ ] Update imports to remove unused schema symbols
- [ ] Verify `~150 lines` target — run a line count
- [ ] Commit: `refactor: strip planner methods from StorageLocal — PlannerStore owns planner I/O`

---

## Part 7 — Year-Planner: Delete SyncClient.js and Wire Api.js

### Context

`SyncClient.js` (year-planner's wrapper) is deleted — `PlannerStore` owns the `SyncClientAdapter` instance directly. `Api.sync()` is updated to delegate to `PlannerStore.syncActive()`.

---

### Task 7: Delete SyncClient.js, update Api.js, update contexts.js

**Delete:** `site/js/service/SyncClient.js`

**Update `Api.js`** — `sync()` method:
```js
async sync() {
  const signedin = this.storageLocal.signedin();
  this.logger?.debug?.(`[Api.sync] called signedin=${signedin}`);
  if (!signedin) { this.logger?.warn?.('[Api.sync] skipping — not signed in'); return; }
  try {
    const merged = await this.plannerStore.syncActive(this._authHeaders());
    if (merged) this.model.error = '';
  } catch (err) {
    this.logger?.error?.(`[Api.sync] sync failed: status=${err.status} message=${err.message}`);
    if (err.status === 404)      this.model.error = 'error.apinotavailable';
    else if (err.status === 401) { this.authProvider?.signOut?.(); this.model.signedin = false; this.model.error = 'error.unauthorized'; }
    else                         this.model.error = 'error.syncfailed';
  }
}
```

Update `Api` constructor to accept `plannerStore`:
```js
constructor(model, storageLocal, plannerStore, authProvider) {
  ...
  this.plannerStore = plannerStore;
  // Remove: this.syncClient = syncClient;
}
```

**Update `contexts.js`:**
- Remove `import SyncClient` and `new Singleton(SyncClient)`
- Add `import PlannerStore` (already done in Task 3) and `import SyncScheduler` (Task 4)
- Ensure CDI wiring order: `PlannerStore` before `Api`, `SyncScheduler` after both

**Update `auth.js` (Vue method):**
```js
async signInWith(provider) {
  this.clearModalAlert();
  try {
    await this.authProvider.signIn(provider);
    $('#authModal').modal('hide');
    this.signedin = true;
    this.userKey = this.plannerStore.getUserKey();
    this.activeDocUuid = this.plannerStore.activateDoc(this.userKey, this.year);
    this.plannerStore.adoptIfEmpty(this.userKey, this.year);
    this.syncScheduler.markDirty();
  } catch (err) {
    this.modalError = err.message || 'error.syncfailed';
  }
},
```

- [ ] Delete `site/js/service/SyncClient.js`
- [ ] Update `Api.js` constructor and `sync()` method as above
- [ ] Update `contexts.js` — remove SyncClient, confirm all singletons registered
- [ ] Update `auth.js` — signInWith uses plannerStore.adoptIfEmpty + syncScheduler.markDirty
- [ ] Commit: `refactor: delete SyncClient.js — PlannerStore owns SyncClientAdapter`

---

## Part 8 — Year-Planner: Regression Tests and UAT

### Task 8: Run full test suite and UAT checklist

**Commands:**
```bash
# jsmdma-core (new bidirectional tests)
cd /Users/craig/src/github/alt-javascript/jsmdma
npm test --workspace=packages/core

# jsmdma-client (SyncClientAdapter)
npm test --workspace=packages/jsmdma-client

# year-planner (Playwright E2E)
cd /Users/craig/src/github/alt-html/year-planner
npm test
```

**UAT checklist:**
- [ ] Anonymous user: open app → planner loads → add entry → entry persists on reload
- [ ] Sign in: Google OAuth → planner adopts server data → entry from other device visible
- [ ] Two devices: add entry on device A, sign in on device B → B receives A's entry without patching uid
- [ ] Sign out: localStorage wiped → fresh anonymous session
- [ ] Offline: add entry offline → go online → SyncScheduler fires → entry synced
- [ ] Tab focus: switch to another tab and back → SyncScheduler fires on visibilitychange

---

## File Manifest

| File | Action | Notes |
|------|--------|-------|
| `jsmdma/packages/core/test/SyncClient.spec.js` | **extend** | Add `createMockServer` helper + 5 bidirectional tests |
| `year-planner/site/js/service/PlannerStore.js` | **create** | Anti-corruption layer — DocumentStore ↔ Vue model.days |
| `year-planner/site/js/service/SyncScheduler.js` | **create** | online/visibilitychange/debounce triggers |
| `year-planner/site/js/service/SyncClient.js` | **delete** | Adoption logic obsolete; owned by PlannerStore |
| `year-planner/site/js/service/StorageLocal.js` | **shrink** | ~350→~150 lines; planner methods deleted; userKey migration |
| `year-planner/site/js/service/Api.js` | **update** | sync() delegates to plannerStore.syncActive() |
| `year-planner/site/js/Application.js` | **update** | userKey computed from JWT uuid or device UUID |
| `year-planner/site/js/vue/model.js` | **update** | plannerStore + syncScheduler injected |
| `year-planner/site/js/vue/model/planner.js` | **update** | days:{}, activeDocUuid, userKey — remove planner[] |
| `year-planner/site/js/vue/methods/entries.js` | **update** | plannerStore.setDay() replaces storageLocal.updateLocalEntry() |
| `year-planner/site/js/vue/methods/lifecycle.js` | **update** | activateDoc replaces explicit sync calls |
| `year-planner/site/js/vue/methods/auth.js` | **update** | adoptIfEmpty on sign-in |
| `year-planner/site/js/config/contexts.js` | **update** | Register PlannerStore + SyncScheduler; remove SyncClient |
