# Multi-Document Sync, Document Ownership, and Planner Selector — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace single-doc sync with multi-doc sync, add device/user ownership tiers, and restore the planner selector dropdown so users can see, switch between, and manage multiple planners.

**Architecture:** New `SyncDocumentStore` in jsmdma-client wraps `DocumentStore` with ownership filtering (`listSyncable`, `takeOwnership`). `SyncClientAdapter.sync()` reworked to sync all eligible docs in one HTTP request. Year-planner `PlannerStore` simplified — removes auto-activate/adopt heuristics, delegates to selector for doc choice. Planner selector added to nav dropdown.

**Tech Stack:** JavaScript ES modules, mocha/chai (jsmdma-client tests), Playwright (year-planner E2E), Vue 3 (planner selector UI), Bootstrap 4 dropdown, jsmdma HLC sync protocol.

**Repos:**
- jsmdma-client: `/Users/craig/src/github/alt-javascript/jsmdma/packages/jsmdma-client/`
- year-planner: `/Users/craig/src/github/alt-html/year-planner/`

---

### Task 1: SyncDocumentStore TDD (jsmdma-client)

**Files:**
- Create: `packages/jsmdma-client/src/SyncDocumentStore.js`
- Create: `packages/jsmdma-client/test/SyncDocumentStore.spec.js`

- [ ] **Step 1: Write failing tests for SyncDocumentStore**

```javascript
// packages/jsmdma-client/test/SyncDocumentStore.spec.js
import { expect } from 'chai';
import { SyncDocumentStore } from '../src/SyncDocumentStore.js';

// Mock localStorage for Node.js
const storage = {};
globalThis.localStorage = {
  getItem: (k) => storage[k] ?? null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { for (const k of Object.keys(storage)) delete storage[k]; },
  get length() { return Object.keys(storage).length; },
  key: (i) => Object.keys(storage)[i] ?? null,
};

describe('SyncDocumentStore', () => {
  let store;

  beforeEach(() => {
    localStorage.clear();
    store = new SyncDocumentStore({ namespace: 'test' });
  });

  describe('delegation to DocumentStore', () => {
    it('set() and get() round-trip', () => {
      store.set('doc-1', { meta: { userKey: 'u1' }, data: 'hello' });
      expect(store.get('doc-1')).to.deep.include({ data: 'hello' });
    });

    it('get() returns null for unknown uuid', () => {
      expect(store.get('missing')).to.be.null;
    });

    it('list() returns all documents', () => {
      store.set('a', { meta: { userKey: 'u1' } });
      store.set('b', { meta: { userKey: 'device-1' } });
      expect(store.list()).to.have.length(2);
    });

    it('delete() removes document', () => {
      store.set('doc-1', { meta: { userKey: 'u1' } });
      store.delete('doc-1');
      expect(store.get('doc-1')).to.be.null;
    });

    it('find() with predicate', () => {
      store.set('a', { meta: { userKey: 'u1', year: 2026 } });
      store.set('b', { meta: { userKey: 'u1', year: 2025 } });
      const result = store.find((doc) => doc.meta.year === 2025);
      expect(result.uuid).to.equal('b');
    });
  });

  describe('listSyncable(userId)', () => {
    it('returns only docs with matching meta.userKey', () => {
      store.set('a', { meta: { userKey: 'user-1' }, days: {} });
      store.set('b', { meta: { userKey: 'device-abc' }, days: {} });
      store.set('c', { meta: { userKey: 'user-1' }, days: {} });
      const result = store.listSyncable('user-1');
      expect(result).to.have.length(2);
      expect(result.map(r => r.uuid).sort()).to.deep.equal(['a', 'c']);
    });

    it('returns empty array when no docs match userId', () => {
      store.set('a', { meta: { userKey: 'device-abc' }, days: {} });
      expect(store.listSyncable('user-1')).to.deep.equal([]);
    });
  });

  describe('listLocal()', () => {
    it('returns all docs regardless of userKey', () => {
      store.set('a', { meta: { userKey: 'user-1' } });
      store.set('b', { meta: { userKey: 'device-abc' } });
      expect(store.listLocal()).to.have.length(2);
    });
  });

  describe('takeOwnership(uuid, userId)', () => {
    it('updates meta.userKey to userId', () => {
      store.set('doc-1', { meta: { userKey: 'device-abc', year: 2026 }, days: {} });
      store.takeOwnership('doc-1', 'user-1');
      expect(store.get('doc-1').meta.userKey).to.equal('user-1');
    });

    it('makes doc appear in listSyncable after ownership transfer', () => {
      store.set('doc-1', { meta: { userKey: 'device-abc' }, days: {} });
      expect(store.listSyncable('user-1')).to.have.length(0);
      store.takeOwnership('doc-1', 'user-1');
      expect(store.listSyncable('user-1')).to.have.length(1);
    });

    it('preserves all other document fields', () => {
      store.set('doc-1', { meta: { userKey: 'device-abc', year: 2026, name: 'My Plan' }, days: { '2026-01-01': { tl: 'HNY' } } });
      store.takeOwnership('doc-1', 'user-1');
      const doc = store.get('doc-1');
      expect(doc.meta.year).to.equal(2026);
      expect(doc.meta.name).to.equal('My Plan');
      expect(doc.days['2026-01-01'].tl).to.equal('HNY');
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/craig/src/github/alt-javascript/jsmdma && npx mocha packages/jsmdma-client/test/SyncDocumentStore.spec.js`
Expected: FAIL — `Cannot find module '../src/SyncDocumentStore.js'`

- [ ] **Step 3: Implement SyncDocumentStore**

```javascript
// packages/jsmdma-client/src/SyncDocumentStore.js
import DocumentStore from './DocumentStore.js';

/**
 * SyncDocumentStore — ownership-aware wrapper around DocumentStore.
 *
 * Adds device/user ownership tiers:
 *   - listSyncable(userId) — docs where meta.userKey === userId (sync-eligible)
 *   - listLocal()          — all docs (device + user)
 *   - takeOwnership(uuid, userId) — re-keys a device doc to a user doc
 *
 * All CRUD operations delegate to the underlying DocumentStore.
 */
export default class SyncDocumentStore {
  constructor({ namespace } = {}) {
    this._store = new DocumentStore({ namespace });
  }

  get(uuid)         { return this._store.get(uuid); }
  set(uuid, doc)    { this._store.set(uuid, doc); }
  delete(uuid)      { this._store.delete(uuid); }
  list()            { return this._store.list(); }
  find(predicate)   { return this._store.find(predicate); }

  /**
   * Return all documents owned by userId (sync-eligible).
   * @param {string} userId
   * @returns {Array<{uuid: string, doc: object}>}
   */
  listSyncable(userId) {
    return this._store.list().filter(({ doc }) => doc.meta?.userKey === userId);
  }

  /**
   * Return all documents (device + user).
   * @returns {Array<{uuid: string, doc: object}>}
   */
  listLocal() {
    return this._store.list();
  }

  /**
   * Transfer ownership of a document from device to user.
   * @param {string} uuid
   * @param {string} userId
   */
  takeOwnership(uuid, userId) {
    const doc = this._store.get(uuid);
    if (!doc) return;
    doc.meta = { ...doc.meta, userKey: userId };
    this._store.set(uuid, doc);
  }
}

export { SyncDocumentStore };
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/craig/src/github/alt-javascript/jsmdma && npx mocha packages/jsmdma-client/test/SyncDocumentStore.spec.js`
Expected: all PASS

- [ ] **Step 5: Add export to index.js**

In `packages/jsmdma-client/src/index.js`, add:

```javascript
export { default as DocumentStore }       from './DocumentStore.js';
export { default as HttpClient }          from './HttpClient.js';
export { default as SyncClientAdapter }   from './SyncClientAdapter.js';
export { default as SyncDocumentStore }   from './SyncDocumentStore.js';
```

- [ ] **Step 6: Commit**

```bash
cd /Users/craig/src/github/alt-javascript/jsmdma
git add packages/jsmdma-client/src/SyncDocumentStore.js packages/jsmdma-client/test/SyncDocumentStore.spec.js packages/jsmdma-client/src/index.js
git commit -m "feat(jsmdma-client): add SyncDocumentStore with ownership tiers"
```

---

### Task 2: Rework SyncClientAdapter.sync() to multi-doc (jsmdma-client)

**Files:**
- Modify: `packages/jsmdma-client/src/SyncClientAdapter.js`
- Modify: `packages/jsmdma-client/test/SyncClientAdapter.spec.js`

- [ ] **Step 1: Write failing tests for the new sync() signature**

Add these tests to the existing `SyncClientAdapter.spec.js`. The existing tests for the old signature will also need updating. Replace the entire test file:

```javascript
// packages/jsmdma-client/test/SyncClientAdapter.spec.js
import { expect } from 'chai';
import { SyncClientAdapter } from '../src/SyncClientAdapter.js';
import { SyncDocumentStore } from '../src/SyncDocumentStore.js';
import { HLC } from '@alt-javascript/jsmdma-core';

// Mock localStorage for Node.js
const storage = {};
globalThis.localStorage = {
  getItem: (k) => storage[k] ?? null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { for (const k of Object.keys(storage)) delete storage[k]; },
  get length() { return Object.keys(storage).length; },
  key: (i) => Object.keys(storage)[i] ?? null,
};

// Mock fetch
let fetchCalls = [];
let fetchResponse = { serverClock: '0000000000001-000001-server', serverChanges: [] };
globalThis.fetch = async (url, opts) => {
  fetchCalls.push({ url, opts });
  return {
    ok: true,
    json: async () => fetchResponse,
  };
};

describe('SyncClientAdapter', () => {
  let store;
  let adapter;

  beforeEach(() => {
    localStorage.clear();
    fetchCalls = [];
    fetchResponse = { serverClock: '0000000000001-000001-server', serverChanges: [] };
    store = new SyncDocumentStore({ namespace: 'test' });
    adapter = new SyncClientAdapter(store, { collection: 'planners' });
  });

  describe('markEdited(docId, dotPath)', () => {
    it('stores HLC timestamp for dotPath', () => {
      adapter.markEdited('doc-1', 'days.2026-01-01.tl');
      const revs = JSON.parse(localStorage.getItem('rev:doc-1'));
      expect(revs).to.have.property('days.2026-01-01.tl');
    });

    it('produces strictly later clock on second call', () => {
      adapter.markEdited('doc-1', 'field.a');
      const rev1 = JSON.parse(localStorage.getItem('rev:doc-1'))['field.a'];
      adapter.markEdited('doc-1', 'field.a');
      const rev2 = JSON.parse(localStorage.getItem('rev:doc-1'))['field.a'];
      expect(HLC.compare(rev2, rev1)).to.be.greaterThan(0);
    });
  });

  describe('sync(userId, authHeaders, syncUrl)', () => {
    it('sends all syncable docs in one request', async () => {
      store.set('doc-1', { meta: { userKey: 'user-1' }, days: { '2026-01-01': { tl: 'A' } } });
      store.set('doc-2', { meta: { userKey: 'user-1' }, days: { '2026-02-01': { tl: 'B' } } });
      store.set('doc-3', { meta: { userKey: 'device-x' }, days: {} }); // not syncable

      await adapter.sync('user-1', { Authorization: 'Bearer tok' }, 'http://localhost/sync');
      expect(fetchCalls).to.have.length(1);
      const body = JSON.parse(fetchCalls[0].opts.body);
      expect(body.changes).to.have.length(2);
      expect(body.changes.map(c => c.key).sort()).to.deep.equal(['doc-1', 'doc-2']);
    });

    it('sends empty changes when no syncable docs (pull-only)', async () => {
      store.set('doc-1', { meta: { userKey: 'device-x' }, days: {} });

      await adapter.sync('user-1', {}, 'http://localhost/sync');
      expect(fetchCalls).to.have.length(1);
      const body = JSON.parse(fetchCalls[0].opts.body);
      expect(body.changes).to.deep.equal([]);
    });

    it('sends Authorization header', async () => {
      await adapter.sync('user-1', { Authorization: 'Bearer abc' }, 'http://localhost/sync');
      const headers = fetchCalls[0].opts.headers;
      expect(headers['Authorization']).to.equal('Bearer abc');
    });

    it('merges matching _key serverChanges via merge', async () => {
      store.set('doc-1', { meta: { userKey: 'user-1' }, days: {} });
      fetchResponse = {
        serverClock: '0000000000001-000001-server',
        serverChanges: [{
          _key: 'doc-1', _rev: '0000000000001-000001-server', _fieldRevs: {},
          meta: { userKey: 'user-1' }, days: { '2026-03-01': { tl: 'ServerDay' } },
        }],
      };

      const results = await adapter.sync('user-1', {}, 'http://localhost/sync');
      // The merged doc should be returned for doc-1
      expect(results).to.have.property('doc-1');
    });

    it('stores foreign _key serverChanges via set()', async () => {
      store.set('doc-1', { meta: { userKey: 'user-1' }, days: {} });
      fetchResponse = {
        serverClock: '0000000000001-000001-server',
        serverChanges: [{
          _key: 'foreign-doc', _rev: '0000000000001-000001-server', _fieldRevs: {},
          meta: { userKey: 'user-1', year: 2026 }, days: { '2026-05-01': { tl: 'Foreign' } },
        }],
      };

      await adapter.sync('user-1', {}, 'http://localhost/sync');
      const foreignDoc = store.get('foreign-doc');
      expect(foreignDoc).to.not.be.null;
      expect(foreignDoc.days['2026-05-01'].tl).to.equal('Foreign');
    });

    it('updates sync state for all synced docs', async () => {
      store.set('doc-1', { meta: { userKey: 'user-1' }, days: {} });
      store.set('doc-2', { meta: { userKey: 'user-1' }, days: {} });
      adapter.markEdited('doc-1', 'days.2026-01-01.tl');

      await adapter.sync('user-1', {}, 'http://localhost/sync');
      expect(localStorage.getItem('sync:doc-1')).to.equal('0000000000001-000001-server');
      expect(localStorage.getItem('sync:doc-2')).to.equal('0000000000001-000001-server');
    });

    it('clears rev: after successful sync', async () => {
      store.set('doc-1', { meta: { userKey: 'user-1' }, days: {} });
      adapter.markEdited('doc-1', 'days.2026-01-01.tl');
      expect(JSON.parse(localStorage.getItem('rev:doc-1'))).to.have.property('days.2026-01-01.tl');

      await adapter.sync('user-1', {}, 'http://localhost/sync');
      expect(JSON.parse(localStorage.getItem('rev:doc-1'))).to.deep.equal({});
    });

    it('throws with err.status on HTTP error', async () => {
      globalThis.fetch = async () => ({ ok: false, status: 401 });
      try {
        await adapter.sync('user-1', {}, 'http://localhost/sync');
        expect.fail('should have thrown');
      } catch (err) {
        expect(err.status).to.equal(401);
      }
      // Restore mock
      globalThis.fetch = async (url, opts) => {
        fetchCalls.push({ url, opts });
        return { ok: true, json: async () => fetchResponse };
      };
    });
  });

  describe('prune(docId)', () => {
    it('removes rev/base/sync keys', () => {
      localStorage.setItem('sync:doc-1', 'clock');
      localStorage.setItem('rev:doc-1', '{}');
      localStorage.setItem('base:doc-1', '{}');
      adapter.prune('doc-1');
      expect(localStorage.getItem('sync:doc-1')).to.be.null;
      expect(localStorage.getItem('rev:doc-1')).to.be.null;
      expect(localStorage.getItem('base:doc-1')).to.be.null;
    });
  });

  describe('pruneAll()', () => {
    it('prunes all documents in store', () => {
      store.set('a', { meta: { userKey: 'u' } });
      store.set('b', { meta: { userKey: 'u' } });
      localStorage.setItem('sync:a', 'x');
      localStorage.setItem('sync:b', 'x');
      adapter.pruneAll();
      expect(localStorage.getItem('sync:a')).to.be.null;
      expect(localStorage.getItem('sync:b')).to.be.null;
    });
  });
});
```

- [ ] **Step 2: Run tests to verify old tests fail with new signature expectations**

Run: `cd /Users/craig/src/github/alt-javascript/jsmdma && npx mocha packages/jsmdma-client/test/SyncClientAdapter.spec.js`
Expected: multiple FAILs — sync() now expects different args, returns different shape

- [ ] **Step 3: Rewrite SyncClientAdapter**

Replace `packages/jsmdma-client/src/SyncClientAdapter.js`:

```javascript
/**
 * SyncClientAdapter.js — localStorage-backed multi-document sync.
 *
 * Wraps the jsmdma HLC-based sync protocol with browser localStorage persistence.
 * Syncs ALL sync-eligible documents in a single HTTP request.
 *
 * localStorage key patterns:
 *   sync:<uuid>  — last server HLC clock (string)
 *   rev:<uuid>   — fieldRevs map { 'days.2026-03-28.tl': '<hlcString>', ... }
 *   base:<uuid>  — base snapshot (last known server state, for 3-way merge)
 */
import { HLC, merge } from '@alt-javascript/jsmdma-core';

export default class SyncClientAdapter {
  /**
   * @param {import('./SyncDocumentStore.js').default} syncDocumentStore
   * @param {{
   *   clockKey?: string,
   *   revKey?: string,
   *   baseKey?: string,
   *   collection?: string,
   * }} [options]
   */
  constructor(syncDocumentStore, options = {}) {
    this.syncDocumentStore = syncDocumentStore;
    // Keep legacy alias for pruneAll iteration
    this.documentStore = syncDocumentStore;
    this.clockKey   = options.clockKey  ?? 'sync';
    this.revKey     = options.revKey    ?? 'rev';
    this.baseKey    = options.baseKey   ?? 'base';
    this.collection = options.collection ?? 'documents';
  }

  _syncKey(docId)  { return `${this.clockKey}:${docId}`; }
  _revKey(docId)   { return `${this.revKey}:${docId}`; }
  _baseKey(docId)  { return `${this.baseKey}:${docId}`; }

  /**
   * Tick HLC for a dot-path field on a document. Call on every user edit.
   * @param {string} docId
   * @param {string} dotPath — e.g. 'days.2026-03-28.tl'
   */
  markEdited(docId, dotPath) {
    const rawRev    = localStorage.getItem(this._revKey(docId));
    const revs      = rawRev ? JSON.parse(rawRev) : {};
    const syncRaw   = localStorage.getItem(this._syncKey(docId));
    const baseClock = syncRaw || HLC.zero();
    const existing  = revs[dotPath] || baseClock;
    revs[dotPath]   = HLC.tick(existing, Date.now());
    localStorage.setItem(this._revKey(docId), JSON.stringify(revs));
  }

  /**
   * Sync all documents owned by userId in a single HTTP request.
   *
   * @param {string} userId — authenticated user UUID
   * @param {object} authHeaders — e.g. { Authorization: 'Bearer ...' }
   * @param {string} syncUrl — e.g. 'http://127.0.0.1:8081/year-planner/sync'
   * @returns {Promise<Object<string, object>>} map of docId → merged document
   * @throws {{ status: number }} on HTTP error
   */
  async sync(userId, authHeaders, syncUrl) {
    const syncableDocs = this.syncDocumentStore.listSyncable(userId);

    // Build changes array — one entry per syncable doc
    const changes = [];
    // Track the highest clientClock across all docs for the request-level clock
    let maxClientClock = HLC.zero();

    for (const { uuid, doc } of syncableDocs) {
      const clientClock = localStorage.getItem(this._syncKey(uuid)) || HLC.zero();
      const fieldRevs   = JSON.parse(localStorage.getItem(this._revKey(uuid))  ?? '{}');

      if (HLC.compare(clientClock, maxClientClock) > 0) {
        maxClientClock = clientClock;
      }

      changes.push({ key: uuid, doc, fieldRevs, baseClock: clientClock });
    }

    const payload = {
      collection: this.collection,
      clientClock: maxClientClock,
      changes,
    };

    const response = await fetch(syncUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...authHeaders },
      body:    JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = new Error(`HTTP ${response.status}`);
      err.status = response.status;
      throw err;
    }

    const { serverClock, serverChanges = [] } = await response.json();

    // Build lookup of local docs for merge
    const localDocMap = new Map(syncableDocs.map(({ uuid, doc }) => [uuid, doc]));
    const results = {};

    for (const serverChange of serverChanges) {
      const { _key, _rev, _fieldRevs, ...serverDoc } = serverChange;

      if (localDocMap.has(_key)) {
        // 3-way merge own document
        const localDoc  = localDocMap.get(_key);
        const base      = JSON.parse(localStorage.getItem(this._baseKey(_key)) ?? '{}');
        const fieldRevs = JSON.parse(localStorage.getItem(this._revKey(_key))  ?? '{}');
        const result    = merge(
          base,
          { doc: localDoc, fieldRevs },
          { doc: serverDoc, fieldRevs: _fieldRevs ?? {} },
        );
        results[_key] = result.merged;
      } else {
        // Foreign document — store locally
        this.syncDocumentStore.set(_key, serverDoc);
      }
    }

    // Persist sync state for all synced docs
    for (const { uuid } of syncableDocs) {
      localStorage.setItem(this._syncKey(uuid), serverClock);
      const merged = results[uuid] || localDocMap.get(uuid);
      localStorage.setItem(this._baseKey(uuid), JSON.stringify(merged));
      localStorage.setItem(this._revKey(uuid), '{}');
    }

    return results;
  }

  /** Remove all sync state for a document. */
  prune(docId) {
    localStorage.removeItem(this._syncKey(docId));
    localStorage.removeItem(this._revKey(docId));
    localStorage.removeItem(this._baseKey(docId));
  }

  /** Remove sync state for ALL documents in the store. */
  pruneAll() {
    for (const { uuid } of this.syncDocumentStore.list()) {
      this.prune(uuid);
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/craig/src/github/alt-javascript/jsmdma && npx mocha packages/jsmdma-client/test/SyncClientAdapter.spec.js`
Expected: all PASS

- [ ] **Step 5: Run all jsmdma-client tests**

Run: `cd /Users/craig/src/github/alt-javascript/jsmdma && npx mocha packages/jsmdma-client/test/*.spec.js`
Expected: all PASS (DocumentStore and HttpClient tests unchanged)

- [ ] **Step 6: Commit**

```bash
cd /Users/craig/src/github/alt-javascript/jsmdma
git add packages/jsmdma-client/src/SyncClientAdapter.js packages/jsmdma-client/test/SyncClientAdapter.spec.js
git commit -m "feat(jsmdma-client): rework sync() to multi-doc, single HTTP request"
```

---

### Task 3: Build jsmdma-client ESM bundle and vendor to year-planner

**Files:**
- Modify: `packages/jsmdma-client/src/index.js` (already done in Task 1)
- Build output: `packages/jsmdma-client/dist/jsmdma-client.esm.js`
- Copy to: `site/js/vendor/jsmdma-client.esm.js` (in year-planner repo)

- [ ] **Step 1: Build the ESM bundle**

```bash
cd /Users/craig/src/github/alt-javascript/jsmdma/packages/jsmdma-client
npm run build
```

Expected: `dist/jsmdma-client.esm.js` created

- [ ] **Step 2: Copy to year-planner vendor**

```bash
cp /Users/craig/src/github/alt-javascript/jsmdma/packages/jsmdma-client/dist/jsmdma-client.esm.js \
   /Users/craig/src/github/alt-html/year-planner/site/js/vendor/jsmdma-client.esm.js
```

- [ ] **Step 3: Verify the bundle exports SyncDocumentStore**

```bash
grep 'SyncDocumentStore' /Users/craig/src/github/alt-html/year-planner/site/js/vendor/jsmdma-client.esm.js
```

Expected: `SyncDocumentStore` appears in exports

- [ ] **Step 4: Commit in both repos**

```bash
cd /Users/craig/src/github/alt-javascript/jsmdma
git add packages/jsmdma-client/dist/jsmdma-client.esm.js
git commit -m "build(jsmdma-client): rebuild ESM bundle with SyncDocumentStore + multi-doc sync"

cd /Users/craig/src/github/alt-html/year-planner
git add site/js/vendor/jsmdma-client.esm.js
git commit -m "vendor: update jsmdma-client ESM bundle (SyncDocumentStore + multi-doc sync)"
```

---

### Task 4: Simplify PlannerStore (year-planner)

**Files:**
- Modify: `site/js/service/PlannerStore.js`

- [ ] **Step 1: Rewrite PlannerStore**

Replace `site/js/service/PlannerStore.js` with:

```javascript
/**
 * PlannerStore.js — anti-corruption layer between jsmdma SyncDocumentStore and Vue.
 *
 * Single source of truth for planner data.
 * - Owns SyncDocumentStore (namespace='plnr') — the only writer of plnr:* localStorage keys.
 * - Owns SyncClientAdapter — HLC field tracking and HTTP sync.
 * - Exposes model.days as the Vue reactive surface (ISO-date keyed plain object).
 *
 * CDI singleton — wired via contexts.js.
 */
import { SyncDocumentStore, SyncClientAdapter } from '../vendor/jsmdma-client.esm.js';
import { ClientAuthSession, DeviceSession } from '../vendor/jsmdma-auth-client.esm.js';

const ACTIVE_KEY = 'active-planner';

export default class PlannerStore {
    constructor(model) {
        this.qualifier = '@alt-html/year-planner/PlannerStore';
        this.logger = null;
        this.model = model;
        this.url = '${api.url}';

        this._docStore = new SyncDocumentStore({ namespace: 'plnr' });
        this._adapter  = new SyncClientAdapter(this._docStore, { collection: 'planners' });
        this._activeUuid = null;
    }

    // ── Identity ─────────────────────────────────────────────────────────────

    getUserKey() {
        return ClientAuthSession.getUserUuid() || DeviceSession.getDeviceId();
    }

    // ── Document lifecycle ────────────────────────────────────────────────────

    /**
     * Activate a specific planner by UUID. Called from the selector.
     * @param {string} uuid
     */
    activateDoc(uuid) {
        this._activeUuid = uuid;
        localStorage.setItem(ACTIVE_KEY, uuid);
        this._syncModelDays();
        const doc = this._docStore.get(uuid);
        this.logger?.debug?.(`[PlannerStore] activated uuid=${uuid} days=${Object.keys(doc?.days || {}).length}`);
    }

    /**
     * Restore the last active planner from localStorage.
     * @returns {string|null} uuid if valid, null if not found
     */
    restoreActive() {
        const uuid = localStorage.getItem(ACTIVE_KEY);
        if (uuid && this._docStore.get(uuid)) {
            this._activeUuid = uuid;
            this._syncModelDays();
            return uuid;
        }
        return null;
    }

    getActiveUuid() {
        return this._activeUuid;
    }

    /**
     * Create a new planner document. Called from "New Planner" menu action.
     * @param {string} userKey — device UUID (anon) or user UUID (signed-in)
     * @param {number} year
     * @param {string} name
     * @returns {string} uuid
     */
    createDoc(userKey, year, name) {
        const uuid = crypto.randomUUID();
        const doc  = {
            meta: {
                name:    name || String(year),
                userKey, year,
                lang:    this.model?.lang  || 'en',
                theme:   this.model?.theme || 'light',
                created: Date.now(),
            },
            days: {},
        };
        this._docStore.set(uuid, doc);
        this.logger?.debug?.(`[PlannerStore] createDoc uuid=${uuid} userKey=${userKey} year=${year}`);
        return uuid;
    }

    // ── Day read/write ────────────────────────────────────────────────────────

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

        if (!isEmpty) {
            for (const field of ['tp', 'tl', 'col', 'notes', 'emoji']) {
                this._adapter.markEdited(this._activeUuid, `days.${isoDate}.${field}`);
            }
        }
        this.model.updated = Date.now();
        this.logger?.debug?.(`[PlannerStore] setDay ${isoDate} tl="${entry.tl}"`);
    }

    getDay(isoDate) {
        return this.model.days[isoDate] || null;
    }

    // ── Sync ──────────────────────────────────────────────────────────────────

    /**
     * Sync all user-owned docs in a single request. Updates active doc model if it was merged.
     */
    async sync(authHeaders) {
        const userId = ClientAuthSession.getUserUuid();
        if (!userId) return null;
        const syncUrl = this._getApiUrl() + 'year-planner/sync';
        const results = await this._adapter.sync(userId, authHeaders, syncUrl);
        // If the active doc was merged, persist and update Vue model
        if (results && this._activeUuid && results[this._activeUuid]) {
            this._docStore.set(this._activeUuid, results[this._activeUuid]);
            this._syncModelDays();
        }
        this.logger?.debug?.(`[PlannerStore] sync complete activeUuid=${this._activeUuid} mergedDocs=${Object.keys(results || {}).length}`);
        return results;
    }

    // ── Planner list (for selector) ──────────────────────────────────────────

    listPlanners() {
        return this._docStore.listLocal().map(({ uuid, doc }) => ({
            uuid,
            meta: doc.meta || {},
            dayCount: Object.keys(doc.days || {}).length,
        }));
    }

    // ── Ownership ─────────────────────────────────────────────────────────────

    takeOwnership(uuid) {
        const userId = ClientAuthSession.getUserUuid();
        if (!userId) return;
        this._docStore.takeOwnership(uuid, userId);
        this.logger?.debug?.(`[PlannerStore] takeOwnership uuid=${uuid} userId=${userId}`);
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    deletePlanner(uuid) {
        this._docStore.delete(uuid);
        this._adapter.prune(uuid);
        if (this._activeUuid === uuid) {
            this._activeUuid = null;
            localStorage.removeItem(ACTIVE_KEY);
            Object.keys(this.model.days).forEach(k => delete this.model.days[k]);
        }
    }

    // ── Import ────────────────────────────────────────────────────────────────

    importDays(year, monthsArrayOrDaysMap) {
        if (Array.isArray(monthsArrayOrDaysMap)) {
            for (let m = 0; m < 12; m++) {
                if (!monthsArrayOrDaysMap[m]) continue;
                for (const [day, dayObj] of Object.entries(monthsArrayOrDaysMap[m])) {
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
        } else if (monthsArrayOrDaysMap && typeof monthsArrayOrDaysMap === 'object') {
            for (const [isoDate, dayObj] of Object.entries(monthsArrayOrDaysMap)) {
                if (!dayObj) continue;
                this.setDay(isoDate, dayObj);
            }
        }
    }

    // ── Prune ─────────────────────────────────────────────────────────────────

    prune(uuid)  { this._adapter.prune(uuid); }
    pruneAll()   { this._adapter.pruneAll(); }

    // ── Private ───────────────────────────────────────────────────────────────

    _syncModelDays() {
        const doc  = this._docStore.get(this._activeUuid);
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

- [ ] **Step 2: Commit**

```bash
cd /Users/craig/src/github/alt-html/year-planner
git add site/js/service/PlannerStore.js
git commit -m "refactor(PlannerStore): simplify to multi-doc sync, remove adopt/merge heuristics"
```

---

### Task 5: Update Api.js and SyncScheduler.js

**Files:**
- Modify: `site/js/service/Api.js`
- Modify: `site/js/service/SyncScheduler.js`

- [ ] **Step 1: Update Api.sync() to use new PlannerStore.sync()**

In `site/js/service/Api.js`, change `syncActive` to `sync`:

Replace line 49:
```javascript
            const merged = await this.plannerStore.syncActive(this._authHeaders());
```
With:
```javascript
            const results = await this.plannerStore.sync(this._authHeaders());
```

And replace line 50:
```javascript
            if (merged) this.model.error = '';
```
With:
```javascript
            if (results) this.model.error = '';
```

- [ ] **Step 2: Update SyncScheduler._sync() guard**

In `site/js/service/SyncScheduler.js`, the `_sync()` method currently checks `getActiveUuid()`. It should fire sync even without an active doc (to pull docs from server). Replace the `_sync` method:

```javascript
    _sync() {
        this.api.sync();
    }
```

- [ ] **Step 3: Commit**

```bash
cd /Users/craig/src/github/alt-html/year-planner
git add site/js/service/Api.js site/js/service/SyncScheduler.js
git commit -m "refactor(Api, SyncScheduler): wire to new PlannerStore.sync() multi-doc API"
```

---

### Task 6: Update lifecycle.js and auth.js

**Files:**
- Modify: `site/js/vue/methods/lifecycle.js`
- Modify: `site/js/vue/methods/auth.js`

- [ ] **Step 1: Rewrite lifecycle.js refresh()**

Replace `site/js/vue/methods/lifecycle.js`:

```javascript
export const lifecycleMethods = {

    refresh() {
        this.logger?.debug?.(`[lifecycle.refresh] uid=${this.uid} userKey=${this.userKey} year=${this.year} signedin=${this.signedin}`);
        this.setYear(this.year);
        if (!this.storageLocal.initialised()) {
            this.logger?.debug?.('[lifecycle.refresh] not initialised — calling initialise()');
            this.initialise();
        }
        this.userKey = this.plannerStore.getUserKey();

        // Restore last active planner, or show selector
        const restored = this.plannerStore.restoreActive();
        if (restored) {
            this.activeDocUuid = restored;
        }
        // If no active planner, selector will open after sync populates docs

        if (this._pendingImport && this.activeDocUuid) {
            this.plannerStore.importDays(this.year, this._pendingImport);
            this._pendingImport = null;
        }
        this.storageLocal.setLocalFromModel();
        if (this.theme === 'dark') {
            document.body.classList.add('yp-dark');
        } else {
            document.body.classList.remove('yp-dark');
        }
        this.loaded = true;
        this.syncScheduler.markDirty();
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

- [ ] **Step 2: Rewrite auth.js — remove adoptIfEmpty calls**

Replace `site/js/vue/methods/auth.js`:

```javascript
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
            this.userKey = this.plannerStore.getUserKey();
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
git add site/js/vue/methods/lifecycle.js site/js/vue/methods/auth.js
git commit -m "refactor(lifecycle, auth): remove adoptIfEmpty, use restoreActive + selector"
```

---

### Task 7: Update planner.js methods

**Files:**
- Modify: `site/js/vue/methods/planner.js`

- [ ] **Step 1: Rewrite planner methods for selector-based flow**

Replace `site/js/vue/methods/planner.js`:

```javascript
import { DateTime } from 'https://cdn.jsdelivr.net/npm/luxon@2/build/es6/luxon.min.js';

export const plannerMethods = {

    createPlanner() {
        const userKey = this.plannerStore.getUserKey();
        const uuid = this.plannerStore.createDoc(userKey, this.year, '');
        this.plannerStore.activateDoc(uuid);
        this.activeDocUuid = uuid;
        this.syncScheduler.markDirty();
    },

    selectPlanner(uuid) {
        this.plannerStore.activateDoc(uuid);
        this.activeDocUuid = uuid;
        // Update year/name from the selected planner's meta
        const planners = this.plannerStore.listPlanners();
        const selected = planners.find(p => p.uuid === uuid);
        if (selected?.meta) {
            this.year = selected.meta.year || this.year;
            this.name = selected.meta.name || '';
            this.setYear(this.year);
        }
    },

    deletePlannerByUuid(uuid) {
        this.plannerStore.deletePlanner(uuid);
        // If we just deleted the active planner, try to activate another
        if (this.activeDocUuid === uuid) {
            this.activeDocUuid = null;
            const remaining = this.plannerStore.listPlanners();
            if (remaining.length > 0) {
                this.selectPlanner(remaining[0].uuid);
            }
        }
    },

    takeOwnership(uuid) {
        this.plannerStore.takeOwnership(uuid);
        this.syncScheduler.markDirty();
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
        return this.plannerStore.listPlanners();
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

- [ ] **Step 2: Commit**

```bash
cd /Users/craig/src/github/alt-html/year-planner
git add site/js/vue/methods/planner.js
git commit -m "refactor(planner): selector-based flow, add selectPlanner/takeOwnership/deletePlannerByUuid"
```

---

### Task 8: Add i18n labels for planner selector

**Files:**
- Modify: `site/js/vue/i18n/en.js`

- [ ] **Step 1: Add labels**

Add to the `label` section in `site/js/vue/i18n/en.js`:

```javascript
        planners: 'My Planners',
        synctocloud: 'Sync to cloud',
        localonly: 'Local only',
```

- [ ] **Step 2: Commit**

```bash
cd /Users/craig/src/github/alt-html/year-planner
git add site/js/vue/i18n/en.js
git commit -m "i18n: add planner selector labels (en)"
```

---

### Task 9: Planner selector UI in nav dropdown

**Files:**
- Modify: `site/index.html` (nav-settings dropdown section)

- [ ] **Step 1: Add planner selector section to the dropdown**

In `site/index.html`, find the `.nav-settings` dropdown div and add the planner list section at the top, before the Share link. Replace the entire `.nav-settings` dropdown content:

```html
                          <div class="nav-settings dropdown-menu dropdown-menu-right">
                                <h6 class="dropdown-header">{{$t('label.planners')}}</h6>
                                <template v-for="planner in plannerStore.listPlanners().sort((a,b) => (b.meta.year||0)-(a.meta.year||0) || (a.meta.name||'').localeCompare(b.meta.name||''))">
                                  <a class="dropdown-item d-flex align-items-center" href="#"
                                     v-bind:class="{'dropdown-item-checked': planner.uuid === activeDocUuid}"
                                     v-on:click.prevent="selectPlanner(planner.uuid)">
                                    <span class="mr-auto text-truncate">{{ planner.meta.name || ($t('label.untitled') + ' ' + (planner.meta.year || '')) }}</span>
                                    <small class="text-muted ml-2">{{ planner.meta.year }}</small>
                                    <i v-if="planner.meta.userKey === userKey && signedin" class="ph ph-cloud ml-1" title="Synced"></i>
                                    <i v-else class="ph ph-device-mobile ml-1" :title="$t('label.localonly')"></i>
                                  </a>
                                  <a v-if="signedin && planner.meta.userKey !== userKey" class="dropdown-item small pl-5" href="#"
                                     v-on:click.prevent="takeOwnership(planner.uuid)">
                                    <i class="ph ph-cloud-arrow-up"></i> {{$t('label.synctocloud')}}
                                  </a>
                                </template>
                                <div class="dropdown-divider"></div>
                                <a  class="dropdown-item" href="#" v-on:click="sharePlanner()">{{$t('label.share')}}…</a>
                                <a  class="dropdown-item" href="#" v-on:click="showRenamePlanner()">{{$t('label.rename')}}</a>
                                <a  class="dropdown-item" href="#" v-on:click="createPlanner()">{{$t('label.new')}}</a>
                                <a  class="dropdown-item" href="#" v-if="activeDocUuid" v-on:click="deletePlannerByUuid(activeDocUuid)">{{$t('label.delete')}}…</a>
                                <div class="dropdown-divider"></div>
                                <h6 class="dropdown-header">{{$t('label.theme')}}</h6>
                                <a class="dropdown-item" v-bind:class="{'dropdown-item-checked':theme=='light'}" v-bind:href="'/?uid='+uid+'&year='+year+'&lang='+lang+'&theme=light'">{{$t('label.light')}}</a>
                                <a class="dropdown-item" v-bind:class="{'dropdown-item-checked':theme=='dark'}" v-bind:href="'/?uid='+uid+'&year='+year+'&lang='+lang+'&theme=dark'">{{$t('label.dark')}}</a>
                                <div v-if="feature.signin" class="dropdown-divider"></div>
                                <a v-if="feature.signin && !signedin" class="dropdown-item" href="#" v-on:click="showSignin()">{{$t('label.signin')}}…</a>
                                <a v-if="feature.signin && signedin" class="dropdown-item" href="#" v-on:click="signout()">{{$t('label.signout')}}…</a>
                          </div>
```

- [ ] **Step 2: Commit**

```bash
cd /Users/craig/src/github/alt-html/year-planner
git add site/index.html
git commit -m "feat: restore planner selector in nav dropdown with ownership indicators"
```

---

### Task 10: Update E2E tests

**Files:**
- Modify: `.tests/e2e/cross-profile-sync.spec.js`
- Modify: `.tests/e2e/planner-management.spec.js`

- [ ] **Step 1: Rewrite cross-profile-sync.spec.js for multi-doc sync**

Replace `.tests/e2e/cross-profile-sync.spec.js`:

```javascript
// .tests/e2e/cross-profile-sync.spec.js
// Verifies: multi-doc sync delivers all user-owned planners across devices.
const { test, expect } = require('../fixtures/cdn');

function makeFakeJwt(sub = 'shared-user-uuid') {
  function b64u(obj) {
    return Buffer.from(JSON.stringify(obj)).toString('base64url');
  }
  const now = Math.floor(Date.now() / 1000);
  return b64u({ alg: 'HS256', typ: 'JWT' }) + '.' +
         b64u({ sub, iat: now, iat_session: now }) + '.fakesig';
}

const SHARED_USER    = 'shared-user-uuid';
const PLANNER_UUID   = 'aaaaaaaa-1111-4000-8000-aaaaaaaaaaaa';

test('signed-in user syncs all owned planners in one request', async ({ page }) => {
  // Seed two user-owned planners locally
  await page.addInitScript(({ token }) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('plnr:plan-a', JSON.stringify({
      meta: { name: 'Work 2026', userKey: 'shared-user-uuid', year: 2026 },
      days: { '2026-01-15': { tp: 1, tl: 'Dentist', col: 2, notes: '', emoji: '' } },
    }));
    localStorage.setItem('plnr:plan-b', JSON.stringify({
      meta: { name: 'Home 2026', userKey: 'shared-user-uuid', year: 2026 },
      days: { '2026-03-20': { tp: 0, tl: 'Holiday', col: 3, notes: 'Beach', emoji: '' } },
    }));
    localStorage.setItem('active-planner', 'plan-a');
  }, { token: makeFakeJwt(SHARED_USER) });

  let capturedBody = null;

  await page.route('**/year-planner/sync', async (route) => {
    const req = route.request();
    capturedBody = JSON.parse(req.postData() || 'null');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ serverClock: '0000000000001-000001-server', serverChanges: [] }),
    });
  });

  await page.goto('/?uid=12345&year=2026');
  await page.waitForSelector('[data-app-ready]');

  const deadline = Date.now() + 5000;
  while (capturedBody === null && Date.now() < deadline) {
    await page.waitForTimeout(100);
  }

  expect(capturedBody).not.toBeNull();
  // Both user-owned planners should be in the changes array
  expect(capturedBody.changes.length).toBe(2);
  const keys = capturedBody.changes.map(c => c.key).sort();
  expect(keys).toEqual(['plan-a', 'plan-b']);
});

test('device-local planners are NOT included in sync payload', async ({ page }) => {
  await page.addInitScript(({ token }) => {
    localStorage.setItem('auth_token', token);
    // User-owned planner
    localStorage.setItem('plnr:user-plan', JSON.stringify({
      meta: { name: 'Synced', userKey: 'shared-user-uuid', year: 2026 },
      days: {},
    }));
    // Device-local planner (different userKey)
    localStorage.setItem('plnr:device-plan', JSON.stringify({
      meta: { name: 'Local', userKey: 'device-uuid-abc', year: 2026 },
      days: { '2026-06-01': { tp: 0, tl: 'Local only', col: 0, notes: '', emoji: '' } },
    }));
    localStorage.setItem('active-planner', 'user-plan');
  }, { token: makeFakeJwt(SHARED_USER) });

  let capturedBody = null;

  await page.route('**/year-planner/sync', async (route) => {
    capturedBody = JSON.parse(route.request().postData() || 'null');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ serverClock: '0000000000001-000001-server', serverChanges: [] }),
    });
  });

  await page.goto('/?uid=12345&year=2026');
  await page.waitForSelector('[data-app-ready]');

  const deadline = Date.now() + 5000;
  while (capturedBody === null && Date.now() < deadline) {
    await page.waitForTimeout(100);
  }

  expect(capturedBody).not.toBeNull();
  // Only the user-owned planner should be synced
  expect(capturedBody.changes.length).toBe(1);
  expect(capturedBody.changes[0].key).toBe('user-plan');
});

test('foreign docs from server are stored locally', async ({ page }) => {
  await page.addInitScript(({ token }) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('plnr:my-plan', JSON.stringify({
      meta: { name: 'Mine', userKey: 'shared-user-uuid', year: 2026 },
      days: {},
    }));
    localStorage.setItem('active-planner', 'my-plan');
  }, { token: makeFakeJwt(SHARED_USER) });

  let syncCount = 0;

  await page.route('**/year-planner/sync', async (route) => {
    syncCount++;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        serverClock: '0000000000001-000001-server',
        serverChanges: [{
          _key: 'foreign-plan',
          _rev: '0000000000001-000001-server',
          _fieldRevs: {},
          meta: { name: 'From Other Device', userKey: SHARED_USER, year: 2026 },
          days: { '2026-07-04': { tp: 0, tl: 'Independence Day', col: 1, notes: '', emoji: '' } },
        }],
      }),
    });
  });

  await page.goto('/?uid=12345&year=2026');
  await page.waitForSelector('[data-app-ready]');

  const deadline = Date.now() + 5000;
  while (syncCount === 0 && Date.now() < deadline) {
    await page.waitForTimeout(100);
  }
  await page.waitForTimeout(500);

  // Foreign doc should be stored in localStorage
  const foreignDoc = await page.evaluate(() => {
    const raw = localStorage.getItem('plnr:foreign-plan');
    return raw ? JSON.parse(raw) : null;
  });

  expect(foreignDoc).not.toBeNull();
  expect(foreignDoc.meta.name).toBe('From Other Device');
  expect(foreignDoc.days['2026-07-04']?.tl).toBe('Independence Day');
});
```

- [ ] **Step 2: Update planner-management.spec.js for selector-based flow**

Update the test to use the selector dropdown instead of URL navigation. The create/rename/delete actions use the new methods. Replace key sections:

Find the `createPlanner()` call and update to verify the new planner appears in the selector dropdown. Find URL-based planner switching and replace with selector clicks. This will require reading the current test carefully and adjusting — the core flow remains create → rename → switch → delete, but switching now uses `selectPlanner()` via the dropdown instead of URL navigation.

- [ ] **Step 3: Run E2E tests**

```bash
cd /Users/craig/src/github/alt-html/year-planner/.tests
npx playwright test e2e/cross-profile-sync.spec.js e2e/planner-management.spec.js
```

Expected: all PASS

- [ ] **Step 4: Commit**

```bash
cd /Users/craig/src/github/alt-html/year-planner
git add .tests/e2e/cross-profile-sync.spec.js .tests/e2e/planner-management.spec.js
git commit -m "test: rewrite E2E tests for multi-doc sync and selector-based planner management"
```

---

### Task 11: Full regression test run

**Files:** none (verification only)

- [ ] **Step 1: Run all jsmdma tests**

```bash
cd /Users/craig/src/github/alt-javascript/jsmdma && npm test
```

Expected: all PASS (160+ tests)

- [ ] **Step 2: Run all year-planner E2E tests**

```bash
cd /Users/craig/src/github/alt-html/year-planner/.tests && npx playwright test
```

Expected: all PASS

- [ ] **Step 3: Manual smoke test**

1. Start server: `cd /Users/craig/src/github/alt-javascript/jsmdma && GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... JWT_SECRET=... node packages/example-auth/run-local.js`
2. Start SPA: `npx http-server site/ -p 8080` (in year-planner repo)
3. Open http://localhost:8080 — verify selector dropdown shows, create a planner
4. Sign in — verify sync fires, selector shows planners
5. Open in second browser profile, sign in — verify planners from first profile appear in selector
6. Edit different days in each profile, verify they merge after sync
