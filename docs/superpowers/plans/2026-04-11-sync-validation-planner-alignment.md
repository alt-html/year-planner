# Spec D: jsmdma Sync Validation + Year-Planner Data Layer Alignment — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add five bidirectional sync integration tests to jsmdma-core, then collapse year-planner's three-copy data problem (model.planner / DocumentStore / localStorage) into one: `model.days === localStorage === remote sync`.

**Architecture:** `PlannerStore` (new CDI singleton) owns `DocumentStore` and `SyncClientAdapter`, exposes `model.days` as the sole Vue reactive surface. `SyncScheduler` (new CDI singleton) replaces scattered `api.sync()` calls with `online`/`visibilitychange`/debounce triggers. `SyncClient.js` is deleted. `StorageLocal` shrinks to ~150 lines (preferences + identities + wipe + migration only). Planner ownership key changes from numeric uid-timestamp to JWT uuid (signed-in) or device UUID (anonymous).

**Tech Stack:** Mocha/Chai (jsmdma-core tests), vanilla ES modules (year-planner), Vue 3, jsmdma-client ESM bundle (`DocumentStore`, `SyncClientAdapter`), jsmdma-auth-client ESM bundle (`ClientAuthSession`, `DeviceSession`), CDI singleton wiring via `contexts.js`.

**Repositories:**
- `/Users/craig/src/github/alt-javascript/jsmdma` — packages/core tests
- `/Users/craig/src/github/alt-html/year-planner` — everything else

---

## File Map

| File | Action | Owned by task |
|------|--------|--------------|
| `jsmdma/packages/core/test/SyncClient.spec.js` | extend | Task 1 |
| `year-planner/site/js/service/PlannerStore.js` | create | Task 2 |
| `year-planner/site/js/service/SyncScheduler.js` | create | Task 3 |
| `year-planner/site/js/vue/model/planner.js` | update | Task 4 |
| `year-planner/site/js/vue/model.js` | update | Task 4 |
| `year-planner/site/js/Application.js` | update | Task 4 |
| `year-planner/site/js/config/contexts.js` | update | Task 5 |
| `year-planner/site/js/vue/methods/entries.js` | update | Task 6 |
| `year-planner/site/js/vue/methods/lifecycle.js` | update | Task 6 |
| `year-planner/site/js/vue/methods/planner.js` | update | Task 7 |
| `year-planner/site/js/vue/methods/auth.js` | update | Task 7 |
| `year-planner/site/js/service/StorageLocal.js` | shrink | Task 8 |
| `year-planner/site/js/service/Api.js` | update | Task 9 |
| `year-planner/site/js/service/SyncClient.js` | delete | Task 9 |

---

## Task 1: jsmdma-core — bidirectional sync integration tests

**Repo:** `/Users/craig/src/github/alt-javascript/jsmdma`

**Files:**
- Modify: `packages/core/test/SyncClient.spec.js` (add after the final `describe` block, before the closing of the outer `describe('SyncClient', ...)`)

**Context:** The existing spec already covers single-client `edit()`, `sync()`, `prune()`, snapshots. It does NOT cover two clients syncing through a shared server. The `createMockServer` helper uses a `SyncClient` instance internally — this is the proof that server and client use identical code.

- [ ] **Step 1: Verify existing tests pass before touching anything**

```bash
cd /Users/craig/src/github/alt-javascript/jsmdma
npm test --workspace=packages/core
```
Expected: all tests pass (currently ~50 passing).

- [ ] **Step 2: Add the `createMockServer` helper**

Open `packages/core/test/SyncClient.spec.js`. After the `makeServerDoc` helper function (around line 38), add:

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
      for (const change of clientChanges) {
        server.edit(change.key, change.doc, wallMs);
      }
      serverClock = HLC.tick(serverClock, wallMs);
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

- [ ] **Step 3: Add the `two-client bidirectional sync` describe block**

At the end of the outer `describe('SyncClient', () => {` block (after the `isomorphism` describe, before the final `});`), add:

```js
// ── two-client bidirectional sync ────────────────────────────────────────────

describe('two-client bidirectional sync', () => {

  it('two clients editing different fields converge after mutual sync', () => {
    const mockServer = createMockServer();
    const clientA = new SyncClient('device-a', 1000);
    const clientB = new SyncClient('device-b', 2000);

    clientA.edit('doc/1', { title: 'A title', note: '' }, 1000);

    const respA = mockServer.sync(clientA.getChanges(), 3000);
    clientA.sync(respA, 3000);

    clientB.edit('doc/1', { title: '', note: 'B note' }, 2000);

    const respB = mockServer.sync(clientB.getChanges(), 4000);
    clientB.sync(respB, 4000);

    // Client A syncs again to receive B's note
    const respA2 = mockServer.sync(clientA.getChanges(), 5000);
    clientA.sync(respA2, 5000);

    assert.equal(clientA.docs['doc/1'].doc.title, 'A title');
    assert.equal(clientA.docs['doc/1'].doc.note, 'B note');
    assert.equal(clientB.docs['doc/1'].doc.title, 'A title');
    assert.equal(clientB.docs['doc/1'].doc.note, 'B note');
  });

  it('two clients editing the same field — higher HLC wins, both converge', () => {
    const mockServer = createMockServer();
    const clientA = new SyncClient('device-a', 1000);
    const clientB = new SyncClient('device-b', 9000);

    clientA.edit('doc/1', { title: 'A wins?' }, 1000);
    clientB.edit('doc/1', { title: 'B wins' }, 9000);

    mockServer.sync(clientA.getChanges(), 10000);
    const respB = mockServer.sync(clientB.getChanges(), 10000);
    clientB.sync(respB, 10000);

    const respA = mockServer.sync(clientA.getChanges(), 11000);
    clientA.sync(respA, 11000);

    const respB2 = mockServer.sync(clientB.getChanges(), 12000);
    clientB.sync(respB2, 12000);

    assert.equal(clientA.docs['doc/1'].doc.title, 'B wins');
    assert.equal(clientB.docs['doc/1'].doc.title, 'B wins');
  });

  it('offline client catches up in a single sync after reconnect', () => {
    const mockServer = createMockServer();
    const clientA = new SyncClient('device-a', 1000);
    const clientB = new SyncClient('device-b', 2000);

    // Client B makes 3 edits while offline
    clientB.edit('doc/1', { v: 1 }, 2000);
    clientB.edit('doc/1', { v: 2 }, 3000);
    clientB.edit('doc/1', { v: 3 }, 4000);

    // Client A syncs normally
    clientA.edit('doc/1', { v: 0, extra: 'from-a' }, 1000);
    const respA = mockServer.sync(clientA.getChanges(), 5000);
    clientA.sync(respA, 5000);

    // Client B reconnects — single sync
    const respB = mockServer.sync(clientB.getChanges(), 6000);
    clientB.sync(respB, 6000);

    // Client A gets B's changes
    const respA2 = mockServer.sync(clientA.getChanges(), 7000);
    clientA.sync(respA2, 7000);

    assert.equal(clientA.docs['doc/1'].doc.v, 3);
    assert.equal(clientA.docs['doc/1'].doc.extra, 'from-a');
    assert.equal(clientB.docs['doc/1'].doc.v, 3);
    assert.equal(clientB.docs['doc/1'].doc.extra, 'from-a');
  });

  it('server-as-client symmetry: both sides use SyncClient, both converge to identical result', () => {
    const side1 = new SyncClient('side-1', 1000);
    const side2 = new SyncClient('side-2', 2000);

    side1.edit('doc/1', { a: 1, b: 0 }, 1000);
    side2.edit('doc/1', { a: 0, b: 2 }, 2000);

    // side2 acts as server — receives side1's changes
    const changes1 = side1.getChanges();
    side2.sync({
      serverClock: HLC.tick(HLC.zero(), 5000),
      serverChanges: changes1.map(c => ({ _key: c.key, _fieldRevs: c.fieldRevs, ...c.doc })),
    }, 5000);

    // side1 acts as server — receives side2's merged changes
    const changes2 = side2.getChanges();
    side1.sync({
      serverClock: HLC.tick(HLC.zero(), 6000),
      serverChanges: changes2.map(c => ({ _key: c.key, _fieldRevs: c.fieldRevs, ...c.doc })),
    }, 6000);

    assert.deepEqual(
      side1.docs['doc/1'].doc,
      side2.docs['doc/1'].doc,
      'Both sides must converge regardless of which is labelled server or client'
    );
  });

  it('snapshot round-trip preserves sync ability across serialisation boundary', () => {
    const mockServer = createMockServer();
    const clientA = new SyncClient('device-a', 1000);

    clientA.edit('doc/1', { title: 'Before snap' }, 1000);
    const resp1 = mockServer.sync(clientA.getChanges(), 2000);
    clientA.sync(resp1, 2000);

    // Simulate tab close + reopen via JSON round-trip
    const snap = JSON.parse(JSON.stringify(clientA.getSnapshot()));
    const restored = SyncClient.fromSnapshot(snap);

    restored.edit('doc/1', { title: 'After snap' }, 3000);
    const resp2 = mockServer.sync(restored.getChanges(), 4000);
    restored.sync(resp2, 4000);

    assert.equal(restored.docs['doc/1'].doc.title, 'After snap');
    assert.equal(mockServer.docs['doc/1'].doc.title, 'After snap');
  });

});
```

- [ ] **Step 4: Run tests — verify all new tests pass and no existing tests broke**

```bash
cd /Users/craig/src/github/alt-javascript/jsmdma
npm test --workspace=packages/core
```
Expected: previous count + 5 new tests passing. Total should be ~55 passing, 0 failing.

- [ ] **Step 5: Commit**

```bash
cd /Users/craig/src/github/alt-javascript/jsmdma
git add packages/core/test/SyncClient.spec.js
git commit -m "test(core): add five bidirectional sync integration tests

Two-client convergence, same-field conflict (HLC wins), offline reconnect,
server-as-client symmetry, snapshot round-trip via createMockServer helper.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Create PlannerStore.js

**Repo:** `/Users/craig/src/github/alt-html/year-planner`

**Files:**
- Create: `site/js/service/PlannerStore.js`

**Context:** `PlannerStore` is the single writer of `plnr:*` localStorage keys. It owns `DocumentStore` (namespace=`plnr`) and `SyncClientAdapter`. It exposes `model.days` as a Vue-reactive in-place-mutated object. CDI wires it as a singleton — its constructor receives `model` (the Vue model object). `this.url` uses the CDI config token `'${api.url}'` exactly as `Api.js` and `SyncClient.js` do — the CDI config resolver replaces it at startup.

- [ ] **Step 1: Create the file**

Create `/Users/craig/src/github/alt-html/year-planner/site/js/service/PlannerStore.js`:

```js
/**
 * PlannerStore.js — anti-corruption layer between jsmdma DocumentStore and Vue.
 *
 * Single source of truth for planner data.
 * - Owns DocumentStore (namespace='plnr') — the only writer of plnr:* localStorage keys.
 * - Owns SyncClientAdapter — HLC field tracking and HTTP sync.
 * - Exposes model.days as the Vue reactive surface (ISO-date keyed plain object).
 *
 * CDI singleton — wired via contexts.js. Constructor receives (model).
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

    // ── Identity ─────────────────────────────────────────────────────────────

    getUserKey() {
        return ClientAuthSession.getUserUuid() || DeviceSession.getDeviceId();
    }

    // ── Document lifecycle ────────────────────────────────────────────────────

    /**
     * Find or create the planner doc for userKey+year, activate it as model.days.
     * @param {string} userKey — JWT uuid (signed-in) or device UUID (anonymous)
     * @param {number} year
     * @returns {string} uuid of the active document
     */
    activateDoc(userKey, year) {
        let uuid = this._findDoc(userKey, year);
        if (!uuid) uuid = this._createDoc(userKey, year);
        this._activeUuid = uuid;
        this._syncModelDays();
        this.logger?.debug?.(`[PlannerStore] activated uuid=${uuid} userKey=${userKey} year=${year} days=${Object.keys(this.model.days).length}`);
        return uuid;
    }

    getActiveUuid() {
        return this._activeUuid;
    }

    // ── Day read/write ────────────────────────────────────────────────────────

    /**
     * Write one day entry. Updates DocumentStore, localStorage, and model.days atomically.
     * @param {string} isoDate — 'YYYY-MM-DD'
     * @param {object} dayObj  — { tp, tl, col, notes, emoji }
     */
    setDay(isoDate, dayObj) {
        if (!this._activeUuid) {
            this.logger?.warn?.('[PlannerStore] setDay called before activateDoc');
            return;
        }
        const tp  = parseInt(dayObj.tp,  10);
        const col = parseInt(dayObj.col, 10);
        const entry = {
            ...dayObj,
            tp:  Number.isFinite(tp)  ? tp  : 0,
            col: Number.isFinite(col) ? col : 0,
        };
        const isEmpty = !entry.tl && !entry.notes && !entry.emoji && !entry.tp && !entry.col;

        const doc = this._docStore.get(this._activeUuid) || { meta: {}, days: {} };
        if (isEmpty) {
            delete doc.days[isoDate];
        } else {
            doc.days[isoDate] = entry;
        }
        this._docStore.set(this._activeUuid, doc);

        if (isEmpty) {
            delete this.model.days[isoDate];
        } else {
            this.model.days[isoDate] = entry;
        }

        for (const field of ['tp', 'tl', 'col', 'notes', 'emoji']) {
            this._adapter.markEdited(this._activeUuid, `days.${isoDate}.${field}`);
        }
        this.model.updated = Date.now();
        this.logger?.debug?.(`[PlannerStore] setDay ${isoDate} tl="${entry.tl}"`);
    }

    getDay(isoDate) {
        return this.model.days[isoDate] || null;
    }

    // ── Sync ──────────────────────────────────────────────────────────────────

    async syncActive(authHeaders) {
        if (!this._activeUuid) return null;
        const syncUrl = this._getApiUrl() + 'year-planner/sync';
        const doc = this._docStore.get(this._activeUuid) || { meta: {}, days: {} };
        this.logger?.debug?.(`[PlannerStore] sync start uuid=${this._activeUuid} days=${Object.keys(doc.days || {}).length}`);
        const merged = await this._adapter.sync(this._activeUuid, doc, authHeaders, syncUrl);
        if (merged) {
            this._docStore.set(this._activeUuid, merged);
            this._syncModelDays();
            this.logger?.debug?.(`[PlannerStore] sync complete days=${Object.keys(merged.days || {}).length}`);
        }
        return merged;
    }

    // ── Adoption (new device / anon→signed-in) ────────────────────────────────

    /**
     * If own planner is empty after sign-in, adopt the richest foreign doc for this year.
     * @param {string} userKey — newly authenticated userKey
     * @param {number} year
     */
    adoptIfEmpty(userKey, year) {
        const doc = this._docStore.get(this._activeUuid);
        if (doc?.days && Object.keys(doc.days).length > 0) return;

        let best = null;
        for (const { uuid, doc: d } of this._docStore.list()) {
            if (uuid === this._activeUuid) continue;
            if (d.meta?.year == year) {
                const days    = Object.keys(d.days || {}).length;
                const bestDays = Object.keys(best?.days || {}).length;
                if (days > bestDays) best = d;
            }
        }
        if (!best) return;

        const adoptedDoc = { ...best, meta: { ...best.meta, userKey, year } };
        this._docStore.set(this._activeUuid, adoptedDoc);
        this._syncModelDays();
        this.logger?.debug?.(`[PlannerStore] adoptIfEmpty adopted days=${Object.keys(adoptedDoc.days).length}`);
    }

    // ── Planner list ──────────────────────────────────────────────────────────

    listPlanners() {
        return this._docStore.list().map(({ uuid, doc }) => ({ uuid, meta: doc.meta || {} }));
    }

    getLocalPlannerYears() {
        const result = {};
        for (const { doc } of this._docStore.list()) {
            const key = doc.meta?.userKey || doc.meta?.uid || '';
            if (!result[key]) result[key] = [];
            if (doc.meta?.year && !result[key].includes(doc.meta.year)) {
                result[key].push(doc.meta.year);
            }
        }
        return result;
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    deletePlanner(userKey, year) {
        const uuid = this._findDoc(userKey, year);
        if (!uuid) return;
        localStorage.removeItem(`plnr:${uuid}`);
        this._adapter.prune(uuid);
        if (this._activeUuid === uuid) {
            this._activeUuid = null;
            Object.keys(this.model.days).forEach(k => delete this.model.days[k]);
        }
    }

    // ── Import ────────────────────────────────────────────────────────────────

    importDays(year, monthsArray) {
        // monthsArray: 12-element array [m][day] = dayObj (old export format)
        for (let m = 0; m < 12; m++) {
            if (!monthsArray[m]) continue;
            for (const [day, dayObj] of Object.entries(monthsArray[m])) {
                if (!dayObj) continue;
                const isOld = dayObj['1'] !== undefined || dayObj['0'] !== undefined;
                const month = String(m + 1).padStart(2, '0');
                const d     = String(day).padStart(2, '0');
                const isoDate = `${year}-${month}-${d}`;
                this.setDay(isoDate, {
                    tp:    isOld ? (dayObj['0'] || 0)  : (dayObj.tp    || 0),
                    tl:    isOld ? (dayObj['1'] || '') : (dayObj.tl    || ''),
                    col:   isOld ? (dayObj['2'] || 0)  : (dayObj.col   || 0),
                    notes: isOld ? (dayObj['3'] || '') : (dayObj.notes || ''),
                    emoji: isOld ? (dayObj['4'] || '') : (dayObj.emoji || ''),
                });
            }
        }
    }

    // ── Prune ─────────────────────────────────────────────────────────────────

    prune(uuid)  { this._adapter.prune(uuid); }
    pruneAll()   { this._adapter.pruneAll(); }

    // ── Private ───────────────────────────────────────────────────────────────

    _findDoc(userKey, year) {
        for (const { uuid, doc } of this._docStore.list()) {
            if (doc.meta?.userKey === userKey && doc.meta?.year == year) return uuid;
            // Migration compat: accept old docs with numeric meta.uid
            if (doc.meta?.uid && String(doc.meta.uid) === String(userKey) && doc.meta?.year == year) return uuid;
        }
        return null;
    }

    _createDoc(userKey, year) {
        const uuid = crypto.randomUUID();
        const doc  = {
            meta: {
                userKey, year,
                lang:    this.model?.lang    || 'en',
                theme:   this.model?.theme   || 'light',
                created: Date.now(),
            },
            days: {},
        };
        this._docStore.set(uuid, doc);
        return uuid;
    }

    _syncModelDays() {
        const doc  = this._docStore.get(this._activeUuid);
        const days = doc?.days || {};
        // Mutate in-place so Vue's reactive proxy is preserved
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

- [ ] **Step 2: Verify file was written — check line count**

```bash
wc -l /Users/craig/src/github/alt-html/year-planner/site/js/service/PlannerStore.js
```
Expected: ~180 lines.

- [ ] **Step 3: Commit**

```bash
cd /Users/craig/src/github/alt-html/year-planner
git add site/js/service/PlannerStore.js
git commit -m "feat: add PlannerStore — single source of truth for planner docs

Anti-corruption layer between jsmdma DocumentStore and Vue model.days.
Owns DocumentStore and SyncClientAdapter. Replaces SyncClient.js planner
lookup, setDay, adoptIfEmpty, delete, and import operations.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Create SyncScheduler.js

**Repo:** `/Users/craig/src/github/alt-html/year-planner`

**Files:**
- Create: `site/js/service/SyncScheduler.js`

**Context:** CDI singleton. Constructor receives `(api, plannerStore)`. `start()` is called once from `Application.run()`. `markDirty()` is called by `updateEntry` in place of the old explicit `api.sync()` scatter.

- [ ] **Step 1: Create the file**

Create `/Users/craig/src/github/alt-html/year-planner/site/js/service/SyncScheduler.js`:

```js
/**
 * SyncScheduler.js — event-driven sync trigger.
 *
 * Syncs on:
 *   - 300ms debounce after any edit (markDirty)
 *   - window 'online' event (network reconnect)
 *   - document 'visibilitychange' (tab regains focus)
 *
 * CDI singleton. Constructor: (api, plannerStore).
 * Call start() once from Application.run() after CDI init.
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

- [ ] **Step 2: Commit**

```bash
cd /Users/craig/src/github/alt-html/year-planner
git add site/js/service/SyncScheduler.js
git commit -m "feat: add SyncScheduler — online/visibilitychange/debounce sync triggers

Replaces scattered api.sync(plannerId) calls throughout Vue methods.
Singleton started once in Application.run().

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Update Vue model + Application.js (userKey, model.days)

**Repo:** `/Users/craig/src/github/alt-html/year-planner`

**Files:**
- Modify: `site/js/vue/model/planner.js`
- Modify: `site/js/vue/model.js`
- Modify: `site/js/Application.js`

**Context:** `model.planner` (12-element array) is replaced by `model.days` (`{}`). `model.userKey` is added. `model.activeDocUuid` is added. `plannerStore` and `syncScheduler` are added as CDI injection targets on the model. In `Application.js`, `model.uid` is kept for URL param display but `model.userKey` is the planner ownership key.

- [ ] **Step 1: Update `site/js/vue/model/planner.js`**

Replace the entire file content:

```js
export const plannerState = {
    uid : null,           // legacy numeric id — kept for URL params and display only
    userKey : null,       // JWT uuid (signed-in) or device UUID (anonymous) — planner ownership key
    activeDocUuid : null, // UUID of the active planner document
    month : 0,
    day : 1,
    entry: '',
    entryType : 0,
    entryColour : 0,
    entryNotes : '',
    entryEmoji : '',
    shareUrl: window.location.origin,
    days : {},            // ISO-date keyed: { 'YYYY-MM-DD': { tp, tl, col, notes, emoji } }
    identities : null,
    preferences : null,
    updated : null,
    name : '',
    share : '',
    pageLoadTime : null,
    lang : null,
    theme : null,
}
```

- [ ] **Step 2: Update `site/js/vue/model.js`** — add `plannerStore` and `syncScheduler` injection targets

The current file is:
```js
import { feature } from './model-features.js'
import { calendarState } from './model/calendar.js';
import { plannerState } from './model/planner.js';
import { authState } from './model/auth.js';
import { uiState } from './model/ui.js';

const model = {
    qualifier : '@alt-html/year-planner/vue/controller',
    logger : null,
    api : null,
    authProvider : null,
    messages : null,
    storage : null,
    storageLocal : null,
    syncClient : null,

    feature : feature,

    ...calendarState,
    ...plannerState,
    ...authState,
    ...uiState,
}

export { model };
```

Replace with:

```js
import { feature } from './model-features.js'
import { calendarState } from './model/calendar.js';
import { plannerState } from './model/planner.js';
import { authState } from './model/auth.js';
import { uiState } from './model/ui.js';

const model = {
    qualifier : '@alt-html/year-planner/vue/controller',
    logger : null,
    api : null,
    authProvider : null,
    messages : null,
    storage : null,
    storageLocal : null,
    plannerStore : null,
    syncScheduler : null,

    feature : feature,

    ...calendarState,
    ...plannerState,
    ...authState,
    ...uiState,
}

export { model };
```

- [ ] **Step 3: Update `site/js/Application.js`** — compute `model.userKey`, remove `model.planner`, start SyncScheduler

The current `init()` method sets `this.model.planner` and `this.model.uid`. Make these changes:

1. After `this.model.uuid = ClientAuthSession.getUserUuid() || ''`, add:
```js
this.model.userKey = ClientAuthSession.getUserUuid() || DeviceSession.getDeviceId();
```

2. Remove this line entirely:
```js
this.model.planner = this.storage.getPlanner(this.model.uid, this.model.year),
```

3. In `run()`, after `vueApp.use(this.i18n)`, add:
```js
// Wire CDI-injected syncScheduler reference from model (CDI puts it on model)
// Start scheduler after mount so window events are live
```
Then find the `onReady` call site in `main.js` — `Application.run()` is called there. Add `syncScheduler.start()` call. The cleanest place is at the end of `Application.run()`:

```js
async run(vueApp) {
    this.logger?.verbose('Running application: configuring Vue app before mount.');
    vueApp.use(this.i18n);

    document.title = this.i18n.global.t('label.yearplanner');
    document.documentElement.lang = this.model.lang;

    const rail = document.getElementById('rail');
    if (rail && this.model.railCollapsed) rail.classList.add('yp-rail--collapsed');

    const self = this;
    document.addEventListener('yp-rail-toggle', () => {
        Application.handleRailToggle(self.model, self.storageLocal);
        const r = document.getElementById('rail');
        if (r) r.classList.toggle('yp-rail--collapsed', self.model.railCollapsed);
    });

    $(function () {
        $('[data-toggle="tooltip"]').tooltip()
    });

    // Start sync scheduler — fires on online / visibilitychange events
    this.model.syncScheduler?.start();
}
```

- [ ] **Step 4: Commit**

```bash
cd /Users/craig/src/github/alt-html/year-planner
git add site/js/vue/model/planner.js site/js/vue/model.js site/js/Application.js
git commit -m "refactor: introduce model.days + userKey, wire PlannerStore/SyncScheduler

Replaces model.planner (month array) with model.days (ISO-date map).
Adds model.userKey = JWT uuid or device UUID. Removes model.planner and
model.syncClient. Adds plannerStore + syncScheduler CDI targets.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 5: Update contexts.js — register new singletons, remove SyncClient

**Repo:** `/Users/craig/src/github/alt-html/year-planner`

**Files:**
- Modify: `site/js/config/contexts.js`

**Context:** CDI auto-wires constructor parameters by type name. `PlannerStore(model)` receives `model`. `SyncScheduler(api, plannerStore)` receives `api` and `plannerStore` by matching names. `Api(model, storageLocal, plannerStore, authProvider)` replaces the old `Api(model, storageLocal, syncClient, authProvider)`.

- [ ] **Step 1: Replace `site/js/config/contexts.js`**

```js
import { Context, Singleton } from 'https://cdn.jsdelivr.net/npm/@alt-javascript/cdi@3/dist/alt-javascript-cdi-esm.js';

import Api from '../service/Api.js';
import Application from '../Application.js';
import AuthProvider from '../service/AuthProvider.js';
import PlannerStore from '../service/PlannerStore.js';
import Storage from '../service/Storage.js';
import StorageLocal from '../service/StorageLocal.js';
import SyncScheduler from '../service/SyncScheduler.js';
import { feature } from '../vue/model-features.js';
import { messages } from '../vue/i18n/messages.js';
import { model } from '../vue/model.js';
import { i18n } from '../vue/i18n.js';

export default new Context([
    new Singleton(PlannerStore),
    new Singleton(Api),
    new Singleton(Application),
    new Singleton(AuthProvider),
    new Singleton(Storage),
    new Singleton(StorageLocal),
    new Singleton(SyncScheduler),

    { name: 'feature',  Reference: feature },
    { name: 'messages', Reference: messages },
    { name: 'model',    Reference: model },
    { name: 'i18n',     Reference: i18n },
]);
```

Note: `PlannerStore` is registered before `Api` so CDI can inject it into `Api`'s constructor. `SyncScheduler` is after both.

- [ ] **Step 2: Commit**

```bash
cd /Users/craig/src/github/alt-html/year-planner
git add site/js/config/contexts.js
git commit -m "refactor: register PlannerStore + SyncScheduler, remove SyncClient from CDI

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 6: Update entries.js + lifecycle.js

**Repo:** `/Users/craig/src/github/alt-html/year-planner`

**Files:**
- Modify: `site/js/vue/methods/entries.js`
- Modify: `site/js/vue/methods/lifecycle.js`

**Context:** `entries.js` is the hot path for every user edit. It must call `plannerStore.setDay()` and `syncScheduler.markDirty()`. The `getEntry*` accessors now read from `this.days[isoDate]`. `lifecycle.js` calls `plannerStore.activateDoc()` on refresh — no explicit `api.sync()` call needed there (SyncScheduler handles it).

- [ ] **Step 1: Replace `site/js/vue/methods/entries.js`**

```js
export const entryMethods = {

    updateEntry(mindex, day, entry, entryType, entryColour, notes = '', emoji = '', syncToRemote = false) {
        const year    = this.year;
        const month   = String(mindex + 1).padStart(2, '0');
        const d       = String(day).padStart(2, '0');
        const isoDate = `${year}-${month}-${d}`;
        this.plannerStore.setDay(isoDate, {
            tp: entryType, tl: entry, col: entryColour, notes, emoji,
        });
        this.syncScheduler.markDirty();
    },

    updateEntryState(mindex, day) {
        this.month = mindex;
        this.day   = day;
        const isoDate = `${this.year}-${String(mindex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const d = this.days[isoDate] || {};
        this.entry       = d.tl    || '';
        this.entryType   = d.tp    || 0;
        this.entryColour = d.col   || 0;
        this.entryNotes  = d.notes || '';
        this.entryEmoji  = d.emoji || '';
    },

    getEntry(mindex, day) {
        const isoDate = `${this.year}-${String(mindex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return this.days[isoDate]?.tl || '';
    },

    getEntryType(mindex, day) {
        const isoDate = `${this.year}-${String(mindex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return this.days[isoDate]?.tp || 0;
    },

    getEntryColour(mindex, day) {
        const isoDate = `${this.year}-${String(mindex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return this.days[isoDate]?.col || 0;
    },

    getEntryNotes(mindex, day) {
        const isoDate = `${this.year}-${String(mindex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return this.days[isoDate]?.notes || '';
    },

    getEntryEmoji(mindex, day) {
        const isoDate = `${this.year}-${String(mindex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return this.days[isoDate]?.emoji || '';
    },

    getEntryTypeIcon(mindex, day) {
        const t = this.getEntryType(mindex, day);
        if (t == 1) return '<i class="ph ph-bell"></i>';
        if (t == 2) return '<i class="ph ph-cake"></i>';
        if (t == 3) return '<i class="ph ph-martini"></i>';
        if (t == 4) return '<i class="ph ph-fork-knife"></i>';
        if (t == 5) return '<i class="ph ph-graduation-cap"></i>';
        if (t == 6) return '<i class="ph ph-heartbeat"></i>';
        return '';
    },
}
```

- [ ] **Step 2: Replace `site/js/vue/methods/lifecycle.js`**

```js
export const lifecycleMethods = {

    refresh() {
        this.logger?.debug?.(`[lifecycle.refresh] uid=${this.uid} userKey=${this.userKey} year=${this.year} signedin=${this.signedin}`);
        this.setYear(this.year);
        if (!this.storageLocal.initialised()) {
            this.logger?.debug?.('[lifecycle.refresh] not initialised — calling initialise()');
            this.initialise();
        }
        const userKey = this.plannerStore.getUserKey();
        this.userKey      = userKey;
        this.activeDocUuid = this.plannerStore.activateDoc(userKey, this.year);
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

    initialise() {
        this.storageLocal.setLocalIdentities(this.identities);
        this.storageLocal.setLocalPreferences(this.uid, {
            0: this.year, 1: this.lang,
            2: (this.theme === 'dark' ? 1 : 0),
            3: this.preferences['3'] || null,
        });
    },

    clearError() {
        this.error = '';
    },
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/craig/src/github/alt-html/year-planner
git add site/js/vue/methods/entries.js site/js/vue/methods/lifecycle.js
git commit -m "refactor: entries + lifecycle use plannerStore.setDay / activateDoc

Removes storageLocal.updateLocalEntry and api.sync() calls.
getEntry* accessors now read from this.days[isoDate].

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 7: Update planner.js + auth.js Vue methods

**Repo:** `/Users/craig/src/github/alt-html/year-planner`

**Files:**
- Modify: `site/js/vue/methods/planner.js`
- Modify: `site/js/vue/methods/auth.js`

**Context:** `planner.js` has `createLocalPlanner` (creates new uid via timestamp), `showRenamePlanner`, `renamePlanner`, `deletePlannerByYear` — all reference `storageLocal.getActivePlnrUuid` and `api.sync(plannerId)`. These are updated to use `plannerStore` and `syncScheduler`. `auth.js` `signInWith` needs `plannerStore.adoptIfEmpty`.

- [ ] **Step 1: Replace `site/js/vue/methods/planner.js`**

```js
import { DateTime } from 'https://cdn.jsdelivr.net/npm/luxon@2/build/es6/luxon.min.js';

export const plannerMethods = {

    createPlanner() {
        this.createLocalPlanner();
    },

    createLocalPlanner() {
        // New anonymous planner: userKey stays the same (device UUID)
        // Just create a new year entry
        const userKey = this.plannerStore.getUserKey();
        this.userKey      = userKey;
        this.activeDocUuid = this.plannerStore.activateDoc(userKey, this.year);
        this.refresh();
    },

    deletePlannerByYear(userKey, year) {
        this.plannerStore.deletePlanner(userKey, year);
        window.location.href = window.location.origin + '?uid=' + this.uid +
            '&year=' + this.year + '&lang=' + this.lang + '&theme=' + this.theme;
    },

    showRenamePlanner() {
        this.syncScheduler.markDirty();
        this.rename = true;
        $('#rename').show();
        $('#title').focus();
    },

    renamePlanner() {
        $('#rename').hide();
        this.preferences['3'][''+this.year][this.lang] = this.name;
        this.messages[this.lang]['label']['name_'+this.year] = this.name;
        this.rename = false;
        this.storageLocal.setLocalPreferences(this.uid, this.preferences);
        this.updated = DateTime.now().ts;
        this.syncScheduler.markDirty();
    },

    getPlannerName() {
        const n = this.messages[this.lang]['label']['name_'+this.year];
        return n || null;
    },

    getPlannerNameByUidYear(uid, year) {
        const prefs = this.storageLocal.getLocalPreferences(uid) || {};
        return prefs['3']?.[''+year]?.[this.lang] || null;
    },

    getPlannerYears() {
        return this.plannerStore.getLocalPlannerYears();
    },

    sharePlanner() {
        $('#shareModal').modal('show');
        this.shareUrl = window.location.origin + '?share=' + this.storage.getExportString();
        const copyText = document.getElementById('copyUrl');
        copyText.select();
        copyText.setSelectionRange(0, 99999);
    },

    copyUrl() {
        const copyText = document.getElementById('copyUrl');
        copyText.select();
        copyText.setSelectionRange(0, 99999);
        document.execCommand('copy');
    },
}
```

- [ ] **Step 2: Replace `site/js/vue/methods/auth.js`**

```js
export const authMethods = {

    showSignin() {
        this.clearModalAlert();
        $('#authModal').modal('show');
    },

    async signInWith(provider) {
        this.clearModalAlert();
        try {
            await this.authProvider.signIn(provider);
            $('#authModal').modal('hide');
            this.signedin = true;
            const userKey = this.plannerStore.getUserKey();
            this.userKey       = userKey;
            this.activeDocUuid = this.plannerStore.activateDoc(userKey, this.year);
            this.plannerStore.adoptIfEmpty(userKey, this.year);
            this.syncScheduler.markDirty();
        } catch (err) {
            this.modalError = err.message || 'error.syncfailed';
        }
    },

    signout() {
        this.authProvider.signOut();
        this.uuid     = '';
        this.signedin = false;
        this.storageLocal.wipe();
    },

    clearModalAlert() {
        this.modalError       = '';
        this.modalErrorTarget = null;
        this.modalWarning     = '';
        this.modalSuccess     = '';
    },
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/craig/src/github/alt-html/year-planner
git add site/js/vue/methods/planner.js site/js/vue/methods/auth.js
git commit -m "refactor: planner + auth methods use plannerStore and syncScheduler

createLocalPlanner no longer generates uid timestamp.
signInWith calls plannerStore.adoptIfEmpty after OAuth.
deletePlannerByYear delegates to plannerStore.deletePlanner.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 8: Strip StorageLocal.js

**Repo:** `/Users/craig/src/github/alt-html/year-planner`

**Files:**
- Modify: `site/js/service/StorageLocal.js` (shrink ~350 → ~150 lines)

**Context:** All planner read/write methods are deleted — `PlannerStore` owns that concern. What remains: `getLocalPreferences`, `setLocalPreferences`, `getLocalIdentities`, `setLocalIdentities`, `getLocalUid`, `signedin`, `registered`, `initialised`, `migrate`, `_migrateUserKey`, `wipe`, `reset`, `setLocalFromModel`, `getLocalStorageData`, and the remote-identity helpers. The `import` methods (`importLocalPlannerFromJSON` etc.) are removed — they're replaced by `plannerStore.importDays()`.

- [ ] **Step 1: Replace `site/js/service/StorageLocal.js` with the stripped version**

```js
import {
    KEY_DEV, KEY_IDS,
    keyPrefs, keyPlnr, keyRev, keyBase, keySync, HLC_ZERO,
} from './storage-schema.js';
import { ClientAuthSession, DeviceSession, PreferencesStore } from '../vendor/jsmdma-auth-client.esm.js';

//  Reduced StorageLocal — owns: preferences, identities, wipe, migration.
//  Planner read/write is now owned entirely by PlannerStore.

export default class StorageLocal {
    constructor(api, model, storage) {
        this.qualifier = '@alt-html/year-planner/StorageLocal';
        this.logger = null;
        this.api = api;
        this.model = model;
        this.storage = storage;
    }

    // ── Device UUID ──────────────────────────────────────────────────────────

    getDevId() {
        return DeviceSession.getDeviceId();
    }

    // ── Preferences ──────────────────────────────────────────────────────────

    setLocalPreferences(uid, preferences) {
        const prefs = preferences['0'] !== undefined ? {
            year:  preferences['0'],
            lang:  preferences['1'],
            theme: (preferences['2'] == 1 ? 'dark' : 'light'),
            dark:  (preferences['2'] == 1),
            names: preferences['3'] || null,
        } : preferences;

        this.model.preferences = preferences;
        this.model.lang  = prefs.lang  || preferences['1'] || 'en';
        this.model.theme = prefs.theme || (preferences['2'] == 1 ? 'dark' : 'light');

        PreferencesStore.set(String(uid), prefs);
    }

    getLocalPreferences(uid) {
        this.migrate();
        const prefs = PreferencesStore.get(String(uid));
        if (!prefs || Object.keys(prefs).length === 0) return null;
        if (prefs.year !== undefined && prefs['0'] === undefined) {
            return {
                0: prefs.year,
                1: prefs.lang || 'en',
                2: prefs.dark ? 1 : 0,
                3: prefs.names || null,
            };
        }
        return prefs;
    }

    getDefaultLocalPreferences() {
        return this.getLocalPreferences(this.model.uid || this.getLocalUid());
    }

    // ── Identities ───────────────────────────────────────────────────────────

    setLocalIdentities(identities) {
        if (Array.isArray(identities)) {
            const map = {};
            for (const id of identities) {
                const uid = id['0'] || id.uid;
                if (uid) map[String(uid)] = { uid, agent: id['1'] || id.agent || '', remote: id['2'] || 0 };
            }
            localStorage.setItem(KEY_IDS, JSON.stringify(map));
            if (!localStorage.getItem(KEY_DEV)) {
                localStorage.setItem('0', JSON.stringify(identities));
            }
        } else {
            localStorage.setItem(KEY_IDS, JSON.stringify(identities));
        }
    }

    getLocalIdentities() {
        this.migrate();
        const raw = localStorage.getItem(KEY_IDS);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed;
            return Object.values(parsed).map(v => ({ 0: v.uid, 1: v.agent || '', 2: v.remote || 0, 3: 0 }));
        }
        const legacy = localStorage.getItem('0');
        return legacy ? JSON.parse(legacy) : null;
    }

    getLocalUid() {
        const ids = this.getLocalIdentities();
        return ids ? ids[0]['0'] : null;
    }

    getDefaultLocalIdentity() {
        return this.getLocalUid();
    }

    getLocalIdentity(uid) {
        const ids = this.getLocalIdentities();
        if (!ids) return null;
        return ids.find(id => id['0'] == uid) || null;
    }

    signedin() {
        return ClientAuthSession.isSignedIn();
    }

    registered() {
        return !!ClientAuthSession.getToken();
    }

    // ── Remote identity helpers ───────────────────────────────────────────────

    registerRemoteIdentity(uid) {
        const ids = this.getLocalIdentities() || [];
        for (const id of ids) { if (id['0'] == uid) id['2'] = 1; }
        this.model.identities = ids;
        this.setLocalIdentities(ids);
    }

    registerRemoteIdentities() {
        const ids = this.getLocalIdentities() || [];
        for (const id of ids) id['2'] = 1;
        this.model.identities = ids;
        this.setLocalIdentities(ids);
    }

    getRemoteIdentities() {
        return (this.getLocalIdentities() || []).filter(id => id?.[2] == 1);
    }

    // ── Bootstrap ────────────────────────────────────────────────────────────

    initialised() {
        this.migrate();
        return localStorage.getItem(KEY_DEV) !== null || localStorage.getItem('0') !== null;
    }

    // ── Wipe / reset ─────────────────────────────────────────────────────────

    wipe() {
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
        window.location.href = window.location.origin;
    }

    reset() {
        localStorage.clear();
        window.location.href = window.location.origin;
    }

    // ── Persist model state ───────────────────────────────────────────────────

    setLocalFromModel() {
        this.setLocalIdentities(this.model.identities);
        this.setLocalPreferences(this.model.uid, this.model.preferences);
        // Planner persistence is owned by PlannerStore
    }

    // ── Migration ────────────────────────────────────────────────────────────

    migrate() {
        const devExists = !!localStorage.getItem(KEY_DEV);
        const legacyRaw = localStorage.getItem('0');

        if (devExists) {
            if (legacyRaw) localStorage.removeItem('0');
            this._migrateUserKey();
            return;
        }
        if (!legacyRaw) return;

        let identities;
        try { identities = JSON.parse(legacyRaw); } catch (e) { return; }
        if (!Array.isArray(identities) || identities.length === 0) return;

        this.getDevId();

        const oldKeysToRemove = new Set(['0']);

        for (const identity of identities) {
            const uid = identity['0'];
            if (!uid) continue;
            const prefKey = String(uid);
            oldKeysToRemove.add(prefKey);
            let oldPrefs = {};
            try { oldPrefs = JSON.parse(localStorage.getItem(prefKey)) || {}; } catch (e) { /* skip */ }

            const year  = oldPrefs['0'] || new Date().getFullYear();
            const lang  = oldPrefs['1'] || 'en';
            const dark  = oldPrefs['2'] == 1;
            const names = oldPrefs['3'] || null;

            localStorage.setItem(keyPrefs(uid), JSON.stringify({
                year, lang, theme: dark ? 'dark' : 'light', dark, names,
            }));

            const yearSet = new Set();
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (!k || !k.startsWith(String(uid) + '-')) continue;
                oldKeysToRemove.add(k);
                const suffix = k.slice(String(uid).length + 1);
                const yr = parseInt(suffix.slice(0, 4), 10);
                if (yr >= 1900 && yr <= 2100) yearSet.add(yr);
            }

            for (const yr of yearSet) {
                const months = Array.from({ length: 12 }, () => ({}));
                for (let m = 1; m <= 12; m++) {
                    const raw = localStorage.getItem(`${uid}-${yr}${m}`);
                    if (!raw) continue;
                    let monthObj;
                    try { monthObj = JSON.parse(raw); } catch (e) { continue; }
                    if (!monthObj || typeof monthObj !== 'object') continue;
                    for (const [day, dayObj] of Object.entries(monthObj)) {
                        if (!dayObj || typeof dayObj !== 'object') continue;
                        months[m - 1][day] = {
                            tp:    dayObj['0'] !== undefined ? dayObj['0']  : (dayObj.tp    || 0),
                            tl:    dayObj['1'] !== undefined ? dayObj['1']  : (dayObj.tl    || ''),
                            col:   dayObj['2'] !== undefined ? dayObj['2']  : (dayObj.col   || 0),
                            notes: dayObj['3'] !== undefined ? dayObj['3']  : (dayObj.notes || ''),
                            emoji: dayObj['4'] !== undefined ? dayObj['4']  : (dayObj.emoji || ''),
                        };
                    }
                }
                const uuid = crypto.randomUUID();
                const userKey = ClientAuthSession.getUserUuid() || DeviceSession.getDeviceId();
                const days = {};
                for (let m = 0; m < 12; m++) {
                    for (const [day, dayObj] of Object.entries(months[m] || {})) {
                        const month = String(m + 1).padStart(2, '0');
                        const d = String(day).padStart(2, '0');
                        days[`${yr}-${month}-${d}`] = dayObj;
                    }
                }
                const doc = {
                    meta: { userKey, year: yr, lang, theme: dark ? 'dark' : 'light', dark, uid, created: Date.now() },
                    days,
                };
                localStorage.setItem(keyPlnr(uuid), JSON.stringify(doc));
                localStorage.setItem(keyRev(uuid),  JSON.stringify({}));
                localStorage.setItem(keyBase(uuid), JSON.stringify({}));
                localStorage.setItem(keySync(uuid), HLC_ZERO);
            }
        }

        for (const k of oldKeysToRemove) localStorage.removeItem(k);
    }

    _migrateUserKey() {
        const userKey = ClientAuthSession.getUserUuid() || DeviceSession.getDeviceId();
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key?.startsWith('plnr:')) continue;
            try {
                const doc = JSON.parse(localStorage.getItem(key));
                if (doc?.meta && doc.meta.uid && !doc.meta.userKey) {
                    doc.meta.userKey = userKey;
                    localStorage.setItem(key, JSON.stringify(doc));
                }
            } catch (e) { /* skip corrupt */ }
        }
    }

    // ── Debug ────────────────────────────────────────────────────────────────

    getLocalStorageData() {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            data[key] = localStorage.getItem(key);
        }
        return data;
    }
}
```

- [ ] **Step 2: Verify line count**

```bash
wc -l /Users/craig/src/github/alt-html/year-planner/site/js/service/StorageLocal.js
```
Expected: ~160 lines (within target of ~150).

- [ ] **Step 3: Commit**

```bash
cd /Users/craig/src/github/alt-html/year-planner
git add site/js/service/StorageLocal.js
git commit -m "refactor: strip planner methods from StorageLocal (~350→~160 lines)

Deleted: getLocalPlanner, setLocalPlanner, updateLocalEntry,
_docToMonthArray, _monthArrayToDays, _findPlnrUuid, _createPlnr,
getActivePlnrUuid, _getPlnrDoc/_setPlnrDoc, importLocalPlanner*,
deleteLocalPlanner, deletePlannerByYear, setLocalPlannerLastUpdated.
Added: _migrateUserKey (re-keys old meta.uid docs to meta.userKey).
Migration now writes days map directly (no month-array intermediary).

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 9: Delete SyncClient.js + update Api.js

**Repo:** `/Users/craig/src/github/alt-html/year-planner`

**Files:**
- Delete: `site/js/service/SyncClient.js`
- Modify: `site/js/service/Api.js`

**Context:** `Api.sync()` now takes no arguments — it delegates to `plannerStore.syncActive()`. The constructor parameter `syncClient` is replaced by `plannerStore`. CDI will inject `plannerStore` by matching the parameter name.

- [ ] **Step 1: Delete SyncClient.js**

```bash
cd /Users/craig/src/github/alt-html/year-planner
git rm site/js/service/SyncClient.js
```

- [ ] **Step 2: Replace `site/js/service/Api.js`**

```js
async function fetchJSON(url, options = {}) {
    const headers = {
        'Accept': 'application/json',
        ...options.headers,
    };
    if (options.body && typeof options.body === 'string') {
        headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
        const err = new Error(`HTTP ${response.status}`);
        err.status = response.status;
        throw err;
    }
    const text = await response.text();
    return text ? JSON.parse(text) : {};
}

//  Client SDK to server side sync API
//  See api/openapi.yaml for the API contract
export default class Api {
    constructor(model, storageLocal, plannerStore, authProvider) {
        this.qualifier = '@alt-html/year-planner/Api';
        this.logger = null;

        this.url = '${api.url}';
        this.model = model;
        this.storageLocal = storageLocal;
        this.plannerStore = plannerStore;
        this.authProvider = authProvider;
    }

    // Bearer token from federated auth provider
    _authHeaders() {
        const token = this.authProvider?.getToken();
        if (!token) return {};
        return { 'Authorization': 'Bearer ' + token };
    }

    // POST /year-planner/sync — delegates to PlannerStore.syncActive()
    async sync() {
        const signedin = this.storageLocal.signedin();
        this.logger?.debug?.(`[Api.sync] called signedin=${signedin}`);
        if (!signedin) {
            this.logger?.warn?.('[Api.sync] skipping — not signed in');
            return;
        }
        try {
            const merged = await this.plannerStore.syncActive(this._authHeaders());
            if (merged) this.model.error = '';
        } catch (err) {
            this.logger?.error?.(`[Api.sync] failed status=${err.status} message=${err.message}`);
            if (err.status === 404) {
                this.model.error = 'error.apinotavailable';
            } else if (err.status === 401) {
                this.authProvider?.signOut?.();
                this.model.signedin = false;
                this.model.error = 'error.unauthorized';
            } else {
                this.model.error = 'error.syncfailed';
            }
        }
    }

    // DELETE /api/planner — delete user account
    deleteAccount() {
        fetchJSON(`${this.url}api/planner`, {
            method: 'DELETE',
            headers: this._authHeaders(),
        })
            .then(body => {
                this.model.response = body;
                this.model.uuid = '';
            })
            .catch(() => {
                this.model.error = 'error.syncfailed';
            });
    }

    modalErr(target, err) {
        if (!this.model.modalErrorTarget) {
            this.model.modalErrorTarget = {};
        }
        this.model.modalErrorTarget[target] = err;
        this.model.touch = this.model.touch ? '' : ' ';
    }
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/craig/src/github/alt-html/year-planner
git add site/js/service/Api.js
git commit -m "refactor: delete SyncClient.js, Api.sync() delegates to plannerStore

Api constructor: syncClient → plannerStore. sync() takes no args.
PlannerStore now owns the SyncClientAdapter instance.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 10: Smoke test + regression

**Repo:** `/Users/craig/src/github/alt-html/year-planner`

- [ ] **Step 1: Run jsmdma-client tests (verify SyncClientAdapter still passes)**

```bash
cd /Users/craig/src/github/alt-javascript/jsmdma
npm test --workspace=packages/jsmdma-client
```
Expected: 26 passing.

- [ ] **Step 2: Run jsmdma-core tests (verify new bidirectional tests pass)**

```bash
npm test --workspace=packages/core
```
Expected: ~55 passing (original + 5 new).

- [ ] **Step 3: Browser smoke test — anonymous user**

Start the local server, open `http://localhost:8080`.
- [ ] Page loads without JS errors in browser console
- [ ] Calendar renders for current year
- [ ] Click a day → entry modal opens
- [ ] Type a title → save → entry appears on calendar cell
- [ ] Reload → entry persists (localStorage round-trip via PlannerStore)

- [ ] **Step 4: Browser smoke test — signed-in user (two devices)**

Use two browser profiles (Profile A with data, Profile B fresh):
- [ ] Profile B signs in with Google → `signInWith` calls `adoptIfEmpty` → Profile A's entries appear
- [ ] Profile A adds a new entry → Profile B hard-refreshes → entry appears (sync via SyncScheduler online event)

- [ ] **Step 5: Browser smoke test — sign-out wipe**

- [ ] Click sign-out → `storageLocal.wipe()` fires → page reloads to origin → localStorage is clean

- [ ] **Step 6: Final commit if any fixups were needed**

```bash
cd /Users/craig/src/github/alt-html/year-planner
git add -A
git commit -m "fix: post-refactor fixups from smoke testing

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```
(Only commit if there were actual fixups. Skip if clean.)
