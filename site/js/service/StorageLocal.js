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

    setLocalPreferences(userKey, preferences) {
        const prefs = preferences['0'] !== undefined ? {
            year:      preferences['0'],
            lang:      preferences['1'],
            theme:     (preferences['2'] == 1 ? 'dark' : 'light'),
            dark:      (preferences['2'] == 1),
            names:     preferences['3'] || null,
            langMode:  preferences.langMode  || null,
            themeMode: preferences.themeMode || null,
        } : preferences;

        this.model.preferences = preferences;
        this.model.lang      = prefs.lang  || preferences['1'] || 'en';
        this.model.theme     = prefs.theme || (preferences['2'] == 1 ? 'dark' : 'light');
        if (prefs.langMode)  this.model.langMode  = prefs.langMode;
        if (prefs.themeMode) this.model.themeMode = prefs.themeMode;

        PreferencesStore.set(String(userKey), prefs);
    }

    getLocalPreferences(userKey) {
        try { this.migrate(); } catch (e) { /* skip corrupt migration state */ }
        let prefs;
        try {
            prefs = PreferencesStore.get(String(userKey));
        } catch (e) {
            this.logger?.debug?.('[StorageLocal.getLocalPreferences] corrupt prefs — returning null');
            return null;
        }
        if (!prefs || Object.keys(prefs).length === 0) return null;
        if (prefs.year !== undefined && prefs['0'] === undefined) {
            return {
                0:         prefs.year,
                1:         prefs.lang || 'en',
                2:         prefs.dark ? 1 : 0,
                3:         prefs.names || null,
                langMode:  prefs.langMode  || null,
                themeMode: prefs.themeMode || null,
            };
        }
        return prefs;
    }

    getDefaultLocalPreferences() {
        const userKey = this.model.userKey || ClientAuthSession.getUserUuid() || DeviceSession.getDeviceId();
        return this.getLocalPreferences(userKey);
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
        const userKey = this.model.userKey || ClientAuthSession.getUserUuid() || DeviceSession.getDeviceId();
        this.setLocalPreferences(userKey, this.model.preferences);
        // Planner persistence is owned by PlannerStore
    }

    // ── Migration ────────────────────────────────────────────────────────────

    migrate() {
        const devExists = !!localStorage.getItem(KEY_DEV);
        const legacyRaw = localStorage.getItem('0');

        if (devExists && !legacyRaw) {
            // Already on M009 schema — lightweight cleanup only.
            this._migrateUserKey();
            this._migratePrefsKey();
            return;
        }
        if (!legacyRaw) return;

        let identities;
        try { identities = JSON.parse(legacyRaw); } catch (e) { return; }
        if (!Array.isArray(identities) || identities.length === 0) return;

        this.getDevId();

        // Resolve the current user's identity key once — used for all writes in this migration pass.
        const userKey = ClientAuthSession.getUserUuid() || DeviceSession.getDeviceId();
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

            // Write prefs under userKey (UUID), not the legacy numeric uid.
            localStorage.setItem(keyPrefs(userKey), JSON.stringify({
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

    // Migrate prefs stored under numeric uid (legacy) to prefs:${userKey} (UUID).
    // Runs only when dev key exists (M009+) and the userKey-keyed prefs are absent.
    _migratePrefsKey() {
        const userKey = ClientAuthSession.getUserUuid() || DeviceSession.getDeviceId();
        const newKey = keyPrefs(userKey);
        if (localStorage.getItem(newKey)) return; // already on new schema
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (!k?.startsWith('prefs:')) continue;
            const keyPart = k.slice(6); // strip 'prefs:'
            if (/^\d+$/.test(keyPart)) {
                const val = localStorage.getItem(k);
                if (val) {
                    localStorage.setItem(newKey, val);
                    localStorage.removeItem(k);
                }
                return; // migrate first numeric prefs key found
            }
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
