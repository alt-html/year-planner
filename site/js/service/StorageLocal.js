import { DateTime } from 'https://cdn.jsdelivr.net/npm/luxon@2/build/es6/luxon.min.js';
import LZString from 'https://cdn.jsdelivr.net/npm/lz-string/libs/lz-string.min.js/+esm';
import {
    HLC,
    KEY_DEV, KEY_TOK, KEY_IDS,
    keyPrefs, keyPlnr, keyRev, keyBase, keySync,
    F_TYPE, F_TL, F_COL, F_NOTES, F_EMOJI,
    HLC_ZERO,
} from './storage-schema.js';

//  Interface to localStorage-based persistence — M009 schema
//
//  localStorage keys (new schema):
//    dev             — stable device UUID
//    tok             — JWT auth token
//    ids             — identities map { [uid]: { name, provider, email } }
//    prefs:{uid}     — preferences { year, lang, theme, dark }
//    plnr:{uuid}     — planner document { meta: {...}, days: { "YYYY-MM-DD": {tp,tl,col,notes,emoji} } }
//    rev:{uuid}      — dot-path fieldRevs { "days.2026-03-28.tl": hlcString, ... }
//    base:{uuid}     — base snapshot at last sync (for 3-way text merge)
//    sync:{uuid}     — baseClock string (last serverClock received)
//
//  Runtime Vue model uses planner[mindex][day] — this class converts to/from that format.

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
        let id = localStorage.getItem(KEY_DEV);
        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem(KEY_DEV, id);
        }
        return id;
    }

    // ── Planner enumeration ──────────────────────────────────────────────────

    // Returns array of { uuid, meta } for all plnr:* keys
    getLocalPlanners() {
        const planners = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('plnr:')) {
                const uuid = key.slice(5);
                try {
                    const doc = JSON.parse(localStorage.getItem(key)) || {};
                    planners.push({ uuid, meta: doc.meta || {} });
                } catch (e) { /* skip corrupt entries */ }
            }
        }
        return planners;
    }

    // Legacy-compat: returns { [uid]: [years] } shape used by planner switcher
    getLocalPlannerYears() {
        const result = {};
        const planners = this.getLocalPlanners();
        for (const { uuid, meta } of planners) {
            const uid = meta.uid || uuid;
            if (!result[uid]) result[uid] = [];
            if (meta.year && !result[uid].includes(meta.year)) {
                result[uid].push(meta.year);
            }
        }
        return result;
    }

    // ── Planner read/write ───────────────────────────────────────────────────

    // Read planner document { meta, days } from storage
    _getPlnrDoc(uuid) {
        const raw = localStorage.getItem(keyPlnr(uuid));
        return raw ? JSON.parse(raw) : { meta: {}, days: {} };
    }

    // Write planner document to storage
    _setPlnrDoc(uuid, doc) {
        localStorage.setItem(keyPlnr(uuid), JSON.stringify(doc));
    }

    // Convert sparse { days: { "YYYY-MM-DD": dayObj } } → runtime months array [0..11][day]
    _docToMonthArray(doc) {
        const months = Array.from({ length: 12 }, () => ({}));
        for (const [isoDate, dayObj] of Object.entries(doc.days || {})) {
            try {
                const [, mStr, dStr] = isoDate.split('-');
                const m = parseInt(mStr, 10) - 1; // 0-indexed
                const d = parseInt(dStr, 10);
                if (m >= 0 && m < 12 && d >= 1 && d <= 31) {
                    months[m][String(d)] = dayObj;
                }
            } catch (e) { /* skip malformed keys */ }
        }
        return months;
    }

    // Convert runtime months array → sparse days map
    _monthArrayToDays(year, months) {
        const days = {};
        for (let m = 0; m < 12; m++) {
            if (!months[m]) continue;
            const entries = Object.entries(months[m]);
            for (const [day, dayObj] of entries) {
                if (!dayObj) continue;
                // Skip truly empty entries
                const isEmpty = !dayObj[F_TL] && !dayObj[F_NOTES] && !dayObj[F_EMOJI] &&
                    !dayObj[F_TYPE] && !dayObj[F_COL];
                if (isEmpty) continue;
                const month = String(m + 1).padStart(2, '0');
                const d = String(day).padStart(2, '0');
                days[`${year}-${month}-${d}`] = dayObj;
            }
        }
        return days;
    }

    // Get planner as runtime months array (for Vue model)
    // uuidOrUid may be a planner UUID or a legacy uid
    getLocalPlanner(uuidOrUid, year) {
        this.migrate(); // ensure migration has run before first read
        let uuid = uuidOrUid;
        if (uuidOrUid && !String(uuidOrUid).includes('-')) {
            uuid = this._findPlnrUuid(uuidOrUid, year);
            if (!uuid) return Array.from({ length: 12 }, () => ({}));
        }
        const doc = this._getPlnrDoc(uuid);
        return this._docToMonthArray(doc);
    }

    // Write runtime months array back to planner document
    // uuid may be a planner UUID or a legacy uid — handles both
    setLocalPlanner(uuidOrUid, year, months) {
        let uuid = uuidOrUid;
        // If it looks like a legacy uid (number/timestamp) rather than a UUID, find/create
        if (uuidOrUid && !String(uuidOrUid).includes('-')) {
            uuid = this._findPlnrUuid(uuidOrUid, year);
            if (!uuid) {
                uuid = this._createPlnr(uuidOrUid, year, this.model?.lang, this.model?.theme, this.model?.theme === 'dark');
            }
        }
        const doc = this._getPlnrDoc(uuid);
        doc.days = this._monthArrayToDays(year, months);
        this._setPlnrDoc(uuid, doc);
    }

    // ── Active planner UUID management ───────────────────────────────────────

    // Find a planner UUID by uid+year (looks for plnr: doc with matching meta)
    _findPlnrUuid(uid, year) {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('plnr:')) {
                try {
                    const doc = JSON.parse(localStorage.getItem(key));
                    if (doc && doc.meta && doc.meta.uid == uid && doc.meta.year == year) {
                        return key.slice(5);
                    }
                } catch (e) { /* skip */ }
            }
        }
        return null;
    }

    // Create a new planner document, return its UUID
    _createPlnr(uid, year, lang, theme, dark) {
        const uuid = crypto.randomUUID();
        const doc = {
            meta: { name: String(year), year, lang: lang || 'en', theme: theme || 'ink', dark: !!dark, uid, created: HLC.create(this.getDevId(), Date.now()) },
            days: {},
        };
        this._setPlnrDoc(uuid, doc);
        localStorage.setItem(keySync(uuid), HLC_ZERO);
        localStorage.setItem(keyRev(uuid), JSON.stringify({}));
        localStorage.setItem(keyBase(uuid), JSON.stringify({}));
        return uuid;
    }

    // ── fieldRevs update ─────────────────────────────────────────────────────

    _updateRev(uuid, isoDate, dayObj) {
        const devId = this.getDevId();
        const raw = localStorage.getItem(keyRev(uuid));
        const revs = raw ? JSON.parse(raw) : {};
        const syncRaw = localStorage.getItem(keySync(uuid));
        let clock = syncRaw || HLC.create(devId, Date.now());
        for (const field of [F_TYPE, F_TL, F_COL, F_NOTES, F_EMOJI]) {
            clock = HLC.tick(clock, Date.now());
            revs[`days.${isoDate}.${field}`] = clock;
        }
        localStorage.setItem(keyRev(uuid), JSON.stringify(revs));
    }

    // ── Entry update ─────────────────────────────────────────────────────────

    updateLocalEntry(mindex, day, entry, entryType, entryColour, notes = '', emoji = '') {
        // Build ISO date from mindex + day + current year
        const year = this.model.year;
        const month = String(mindex + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        const isoDate = `${year}-${month}-${d}`;

        // Find or create the planner UUID for this uid+year
        let uuid = this._findPlnrUuid(this.model.uid, year);
        if (!uuid) {
            uuid = this._createPlnr(this.model.uid, year, this.model.lang, this.model.theme, this.model.theme === 'dark');
        }

        // Update runtime planner model
        if (!this.model.planner[mindex]) this.model.planner[mindex] = {};
        this.model.planner[mindex][String(day)] = {
            [F_TYPE]: entryType, [F_TL]: entry, [F_COL]: entryColour,
            [F_NOTES]: notes, [F_EMOJI]: emoji,
        };
        this.model.entryColour = entryColour;
        this.model.updated = DateTime.now().ts;

        // Persist to storage
        this.setLocalPlanner(uuid, year, this.model.planner);
        // Update fieldRevs
        this._updateRev(uuid, isoDate, this.model.planner[mindex][String(day)]);
    }

    // ── Preferences ──────────────────────────────────────────────────────────

    setLocalPreferences(uid, preferences) {
        // Support both old format {0:year,1:lang,2:dark,3:names} and new format
        const prefs = preferences['0'] !== undefined ? {
            year:  preferences['0'],
            lang:  preferences['1'],
            theme: (preferences['2'] == 1 ? 'dark' : 'light'),
            dark:  (preferences['2'] == 1),
            names: preferences['3'] || null,  // preserve planner name map {year:{lang:name}}
        } : preferences;

        this.model.preferences = preferences;
        this.model.lang = prefs.lang || preferences['1'] || 'en';
        this.model.theme = prefs.theme || (preferences['2'] == 1 ? 'dark' : 'light');

        localStorage.setItem(keyPrefs(uid), JSON.stringify(prefs));
    }

    getLocalPreferences(uid) {
        this.migrate(); // ensure migration has run before first read
        const raw = localStorage.getItem(keyPrefs(uid));
        if (!raw) return null;
        const prefs = JSON.parse(raw);
        // Return in legacy format so callers expecting {0,1,2,3} still work
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
        const uid = this.model.uid || this.getLocalUid();
        return this.getLocalPreferences(uid);
    }

    // ── Identities ───────────────────────────────────────────────────────────

    setLocalIdentities(identities) {
        // Accept old array format [{0:uid,...}] or new map format
        if (Array.isArray(identities)) {
            const map = {};
            for (const id of identities) {
                const uid = id['0'] || id.uid;
                if (uid) map[String(uid)] = { uid, agent: id['1'] || id.agent || '', remote: id['2'] || 0 };
            }
            localStorage.setItem(KEY_IDS, JSON.stringify(map));
            // Write '0' compat key only if we haven't migrated yet (no dev key means pre-migration)
            // This allows lifecycle.initialise() to work before migration runs
            if (!localStorage.getItem(KEY_DEV)) {
                localStorage.setItem('0', JSON.stringify(identities));
            }
        } else {
            localStorage.setItem(KEY_IDS, JSON.stringify(identities));
        }
    }

    getLocalIdentities() {
        this.migrate(); // ensure migration has run before first read
        // Check new-schema map first, fall back to old array
        const raw = localStorage.getItem(KEY_IDS);
        if (raw) {
            const parsed = JSON.parse(raw);
            // Return as array for compat with callers expecting [{0:uid,...}]
            if (Array.isArray(parsed)) return parsed;
            return Object.values(parsed).map(v => ({ 0: v.uid, 1: v.agent || '', 2: v.remote || 0, 3: 0 }));
        }
        // Fall back to old-schema key '0'
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

    // ── Session (simplified — M010 handles JWT properly) ────────────────────

    setLocalSession(uuid, expires) {
        localStorage.setItem('1', JSON.stringify({ 0: uuid, 1: expires, 2: this.model.uid, 3: this.model.year }));
    }

    getLocalSession() {
        const raw = localStorage.getItem('1');
        return raw ? JSON.parse(raw) : null;
    }

    expireLocalSession() {
        localStorage.setItem('1', JSON.stringify({ 0: this.model.uuid, 1: 1 }));
    }

    deleteLocalSession() {
        localStorage.removeItem('1');
    }

    extendLocalSession() {
        if (this.signedin() && this.getLocalSession()?.['1'] > 0) {
            this.setLocalSession(this.model.uuid, DateTime.local().plus({ minutes: 30 }).ts);
        }
    }

    signedin() {
        const expires = this.getLocalSession()?.['1'];
        return expires != null && ((expires > 0 && expires >= DateTime.now().ts) || expires == 0);
    }

    registered() {
        return !!this.getLocalSession();
    }

    // ── Bootstrap ────────────────────────────────────────────────────────────

    initialised() {
        this.migrate(); // no-op if already migrated or fresh install
        // New schema: dev key exists. Legacy: '0' key exists.
        return localStorage.getItem(KEY_DEV) !== null || localStorage.getItem('0') !== null;
    }

    // One-time migration from cookie-era schema to M009 schema.
    // Also cleans up the compat '0' key written by setLocalIdentities during
    // transitional first-load (when dev gets created mid-initialise).
    // Idempotent — safe to call multiple times.
    migrate() {
        const devExists = !!localStorage.getItem(KEY_DEV);
        const legacyRaw = localStorage.getItem('0');

        // If dev exists, we're in M009 — just clean up any stale compat '0' key and return
        if (devExists) {
            if (legacyRaw) localStorage.removeItem('0');
            return;
        }

        // No dev, no '0' — fresh install
        if (!legacyRaw) return;

        // No dev, '0' exists — this is a genuine old-schema migration
        let identities;
        try { identities = JSON.parse(legacyRaw); } catch (e) { return; }
        if (!Array.isArray(identities) || identities.length === 0) return;

        // Ensure dev UUID exists
        this.getDevId();

        const oldKeysToRemove = new Set(['0']); // '0'=old identities array

        for (const identity of identities) {
            const uid = identity['0'];
            if (!uid) continue;

            // Read old preferences
            const prefKey = String(uid);
            oldKeysToRemove.add(prefKey);
            let oldPrefs = {};
            try { oldPrefs = JSON.parse(localStorage.getItem(prefKey)) || {}; } catch (e) { /* skip */ }

            const year  = oldPrefs['0'] || new Date().getFullYear();
            const lang  = oldPrefs['1'] || 'en';
            const dark  = oldPrefs['2'] == 1;
            const names = oldPrefs['3'] || null;

            // Write new preferences
            localStorage.setItem(keyPrefs(uid), JSON.stringify({
                year, lang, theme: dark ? 'dark' : 'light', dark, names,
            }));

            // Find all years for this uid from old keys: uid-year, uid-year1..12
            const yearSet = new Set();
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (!k || !k.startsWith(String(uid) + '-')) continue;
                oldKeysToRemove.add(k);
                // uid-yearM or uid-year — extract year (4 digits after uid-)
                const suffix = k.slice(String(uid).length + 1); // e.g. "20263" or "2026"
                const yr = parseInt(suffix.slice(0, 4), 10);
                if (yr >= 1900 && yr <= 2100) yearSet.add(yr);
            }

            for (const yr of yearSet) {
                // Read 12 month blobs
                const months = Array.from({ length: 12 }, () => ({}));
                for (let m = 1; m <= 12; m++) {
                    const raw = localStorage.getItem(`${uid}-${yr}${m}`);
                    if (!raw) continue;
                    let monthObj;
                    try { monthObj = JSON.parse(raw); } catch (e) { continue; }
                    if (!monthObj || typeof monthObj !== 'object') continue;
                    for (const [day, dayObj] of Object.entries(monthObj)) {
                        if (!dayObj || typeof dayObj !== 'object') continue;
                        // Convert old numeric keys to new names
                        months[m - 1][day] = {
                            [F_TYPE]:  dayObj['0'] !== undefined ? dayObj['0']  : (dayObj.tp    || 0),
                            [F_TL]:    dayObj['1'] !== undefined ? dayObj['1']  : (dayObj.tl    || ''),
                            [F_COL]:   dayObj['2'] !== undefined ? dayObj['2']  : (dayObj.col   || 0),
                            [F_NOTES]: dayObj['3'] !== undefined ? dayObj['3']  : (dayObj.notes || ''),
                            [F_EMOJI]: dayObj['4'] !== undefined ? dayObj['4']  : (dayObj.emoji || ''),
                        };
                    }
                }

                // Create new planner doc
                const uuid = crypto.randomUUID();
                const days = this._monthArrayToDays(yr, months);
                const doc = {
                    meta: {
                        name: String(yr), year: yr, lang, theme: dark ? 'dark' : 'light',
                        dark, uid, created: HLC.create(localStorage.getItem(KEY_DEV), Date.now()),
                    },
                    days,
                };
                localStorage.setItem(keyPlnr(uuid), JSON.stringify(doc));
                localStorage.setItem(keyRev(uuid),  JSON.stringify({}));
                localStorage.setItem(keyBase(uuid), JSON.stringify({}));
                localStorage.setItem(keySync(uuid), HLC_ZERO);
            }
        }

        // Remove all old-schema keys
        for (const k of oldKeysToRemove) localStorage.removeItem(k);
    }

    setLocalFromModel() {
        this.setLocalIdentities(this.model.identities);
        this.setLocalPreferences(this.model.uid, this.model.preferences);
        // Persist current planner
        const uuid = this._findPlnrUuid(this.model.uid, this.model.year);
        if (uuid) {
            this.setLocalPlanner(uuid, this.model.year, this.model.planner);
        }
    }

    // ── Delete operations ────────────────────────────────────────────────────

    deleteLocalPlanner(uid) {
        // Remove all plnr: entries where meta.uid matches
        const toRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('plnr:')) {
                try {
                    const doc = JSON.parse(localStorage.getItem(key));
                    if (doc?.meta?.uid == uid) {
                        const uuid = key.slice(5);
                        toRemove.push(key, keyRev(uuid), keyBase(uuid), keySync(uuid));
                    }
                } catch (e) { /* skip */ }
            }
        }
        // Also remove old-schema keys that match uid
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key === String(uid) || key.startsWith(String(uid) + '-'))) {
                toRemove.push(key);
            }
        }
        for (const k of toRemove) localStorage.removeItem(k);

        this.model.identities = (this.model.identities || []).filter(id => id['0'] != uid);
        if (this.model.identities.length === 0) {
            this.model.identities = [{ 0: Math.floor(DateTime.now().ts / 1000), 1: window.navigator.userAgent, 2: 0, 3: 0 }];
        }
        this.setLocalIdentities(this.model.identities);
    }

    deletePlannerByYear(uid, year) {
        const uuid = this._findPlnrUuid(uid, year);
        if (uuid) {
            localStorage.removeItem(keyPlnr(uuid));
            localStorage.removeItem(keyRev(uuid));
            localStorage.removeItem(keyBase(uuid));
            localStorage.removeItem(keySync(uuid));
        }
        // Also clean up old-schema keys
        const keys = Object.keys(localStorage);
        for (const k of keys.filter(k => k.includes(uid + '-' + year))) {
            localStorage.removeItem(k);
        }
        this.model.year = this.model.cyear;
        window.location.href = window.location.origin + '?uid=' + this.model.uid + '&year=' + this.model.cyear;
        location.reload();
    }

    // ── Import/Export ────────────────────────────────────────────────────────

    importLocalPlannerFromJSON(planner) {
        this.importLocalPlanner(JSON.parse(planner));
    }

    importLocalPlannerFromBase64(planner) {
        this.importLocalPlanner(JSON.parse(LZString.decompressFromBase64(planner)));
    }

    importLocalPlanner(planner) {
        // planner may be in old format [12 months][days][numeric keys] or new format
        for (let m = 0; m < 12; m++) {
            if (!planner[m]) continue;
            for (const [d, dayObj] of Object.entries(planner[m])) {
                if (!dayObj) continue;
                // Normalise: detect old vs new field names
                const isOld = dayObj['1'] !== undefined || dayObj['0'] !== undefined;
                const tl    = isOld ? (dayObj['1'] || '') : (dayObj[F_TL]    || '');
                const tp    = isOld ? (dayObj['0'] || 0)  : (dayObj[F_TYPE]  || 0);
                const col   = isOld ? (dayObj['2'] || 0)  : (dayObj[F_COL]   || 0);
                const notes = isOld ? (dayObj['3'] || '') : (dayObj[F_NOTES] || '');
                const emoji = isOld ? (dayObj['4'] || '') : (dayObj[F_EMOJI] || '');

                if (!this.model.planner[m]) this.model.planner[m] = {};

                const existing = this.model.planner[m][d] || {};
                const exTl    = existing[F_TL]    || '';
                const exNotes = existing[F_NOTES]  || '';

                this.model.planner[m][d] = {
                    [F_TYPE]:  tp || existing[F_TYPE]  || 0,
                    [F_TL]:    tl && exTl && tl !== exTl ? exTl + '\n' + tl : (tl || exTl),
                    [F_COL]:   col || existing[F_COL]  || 0,
                    [F_NOTES]: notes && exNotes && notes !== exNotes ? exNotes + '\n' + notes : (notes || exNotes),
                    [F_EMOJI]: emoji || existing[F_EMOJI] || '',
                };
            }
        }
        const uuid = this._findOrCreatePlnr();
        this.setLocalPlanner(uuid, this.model.year, this.model.planner);
    }

    _findOrCreatePlnr() {
        let uuid = this._findPlnrUuid(this.model.uid, this.model.year);
        if (!uuid) {
            uuid = this._createPlnr(this.model.uid, this.model.year, this.model.lang, this.model.theme, this.model.theme === 'dark');
        }
        return uuid;
    }

    // ── Remote identity helpers (kept for compat) ─────────────────────────────

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

    wipe() {
        for (const uid of (this.getRemoteIdentities() || []).map(id => id['0'])) {
            this.deleteLocalPlanner(uid);
        }
        window.location.href = window.location.origin;
    }

    // ── Misc ─────────────────────────────────────────────────────────────────

    getLocalStorageData() {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            data[key] = localStorage.getItem(key);
        }
        return data;
    }

    reset() {
        localStorage.clear();
        window.location.href = window.location.origin;
    }

    setLocalPlannerLastUpdated(uid, year, lastUpdated) {
        // Kept for compat — updates the planner doc meta
        const uuid = this._findPlnrUuid(uid, year);
        if (uuid) {
            const doc = this._getPlnrDoc(uuid);
            doc.meta = doc.meta || {};
            doc.meta.updated = lastUpdated;
            this._setPlnrDoc(uuid, doc);
        }
    }
}
