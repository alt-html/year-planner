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
        let normalized = false;
        for (const k of Object.keys(this.model.days)) {
            if (!days[k]) delete this.model.days[k];
        }
        for (const [k, v] of Object.entries(days)) {
            // Coerce legacy tp/col from empty-string storage
            const tp  = parseInt(v.tp,  10);
            const col = parseInt(v.col, 10);
            if (v.tp !== (Number.isFinite(tp) ? tp : 0) || v.col !== (Number.isFinite(col) ? col : 0)) {
                v.tp  = Number.isFinite(tp)  ? tp  : 0;
                v.col = Number.isFinite(col) ? col : 0;
                normalized = true;
            }
            this.model.days[k] = v;
        }
        if (normalized && doc) {
            this._docStore.set(this._activeUuid, doc);
        }
    }

    _getApiUrl() {
        const raw = this.url;
        if (!raw || raw.startsWith('${')) return 'http://127.0.0.1:8081/';
        return raw.endsWith('/') ? raw : raw + '/';
    }
}
