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
