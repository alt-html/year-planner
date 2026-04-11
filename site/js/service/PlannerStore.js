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
        if (!this._activeUuid) return;
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
        this._docStore.delete(uuid);
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
            if (doc.meta?.userKey === userKey && doc.meta?.year == year) return uuid; // loose == intentional: allows numeric year to match string year
            // Migration compat: accept old docs with numeric meta.uid
            if (doc.meta?.uid && String(doc.meta.uid) === String(userKey) && doc.meta?.year == year) return uuid; // loose == intentional: allows numeric year to match string year
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
