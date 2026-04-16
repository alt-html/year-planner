import {
    KEY_DEV, KEY_IDS,
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
        let existing = {};
        try {
            existing = PreferencesStore.get(String(userKey)) || {};
        } catch (e) {
            existing = {};
        }

        const normalized = this._normalizePreferences(preferences || {}, existing);
        this.model.preferences = { ...normalized };
        this.model.lang = normalized.lang || 'en';
        this.model.theme = normalized.theme || 'light';
        if (normalized.langMode)  this.model.langMode  = normalized.langMode;
        if (normalized.themeMode) this.model.themeMode = normalized.themeMode;

        const persisted = { ...existing, ...normalized };
        PreferencesStore.set(String(userKey), persisted);
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

        const normalized = this._normalizePreferences(prefs, prefs);
        const missingNamedShape =
            prefs.year === undefined ||
            prefs.lang === undefined ||
            prefs.theme === undefined ||
            prefs.names === undefined;

        if (missingNamedShape) {
            PreferencesStore.set(String(userKey), { ...prefs, ...normalized });
        }
        return normalized;
    }

    getDefaultLocalPreferences() {
        const userKey = this.model.userKey || ClientAuthSession.getUserUuid() || DeviceSession.getDeviceId();
        return this.getLocalPreferences(userKey);
    }

    _normalizePreferences(preferences = {}, fallback = {}) {
        const year = preferences.year ?? fallback.year ?? new Date().getFullYear();
        const langRaw = preferences.lang ?? fallback.lang ?? 'en';
        const supportedLangs = ['en','zh','hi','ar','es','pt','fr','ru','id','ja'];
        const lang2 = String(langRaw || '').substring(0, 2).toLowerCase();
        const lang = supportedLangs.includes(lang2) ? lang2 : 'en';

        const rawTheme = preferences.theme ?? fallback.theme ?? 'light';
        const theme = (rawTheme === 'dark' ? 'dark' : 'light');
        const names = preferences.names ?? fallback.names ?? null;
        const langMode = preferences.langMode ?? fallback.langMode ?? null;
        const themeMode = preferences.themeMode ?? fallback.themeMode ?? null;

        return {
            year,
            lang,
            theme,
            names,
            langMode,
            themeMode,
        };
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
        return null;
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
        return localStorage.getItem(KEY_DEV) !== null;
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
        // Legacy numeric preference/day migration has been removed.
        // Keep lightweight metadata cleanup and prune unsupported legacy keys.
        this._migrateUserKey();
        this._pruneLegacyStorageKeys();
    }

    _pruneLegacyStorageKeys() {
        const toRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;
            // Legacy identity array key
            if (key === '0') {
                toRemove.push(key);
                continue;
            }
            // Legacy numeric prefs key (e.g., '1234567890')
            if (/^\d+$/.test(key)) {
                toRemove.push(key);
                continue;
            }
            // Legacy namespaced numeric prefs key (e.g., 'prefs:1234567890')
            if (key.startsWith('prefs:') && /^\d+$/.test(key.slice(6))) {
                toRemove.push(key);
                continue;
            }
            // Legacy month key (e.g., '1234567890-20263')
            if (/^\d+-\d{4}(1[0-2]|[1-9])$/.test(key)) {
                toRemove.push(key);
            }
        }
        for (const key of toRemove) localStorage.removeItem(key);
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
