import { HLC, merge, flatten, diff, unflatten } from '../vendor/data-api-core.esm.js';
import { keySync, keyRev, keyBase, HLC_ZERO } from './storage-schema.js';

//  SyncClient — owns all jsmdma HLC sync state management (M009 schema, D007).
//
//  Writes to localStorage on every successful sync:
//    sync:{uuid}  — serverClock (last known server HLC clock string)
//    base:{uuid}  — merged snapshot (plain days object, base for next 3-way merge)
//    rev:{uuid}   — fieldRevs map { "days.YYYY-MM-DD.tl": hlcString, ... }
//
//  On HTTP error, throws with err.status set so Api.sync() can map:
//    404 → error.apinotavailable
//    401 → error.unauthorized
//    else → error.syncfailed

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

export default class SyncClient {
    constructor(model, storageLocal) {
        this.qualifier = '@alt-html/year-planner/SyncClient';
        this.logger = null;
        this.url = '${api.url}';
        this.model = model;
        this.storageLocal = storageLocal;
    }

    // ── markEdited ───────────────────────────────────────────────────────────
    //
    // Ticks the HLC clock for the given dot-path field and writes it into
    // rev:{plannerId}. Called by StorageLocal.updateLocalEntry() on every edit
    // so that the field has a monotonically increasing revision stamp for
    // 3-way merge (merge2 in data-api-core).
    //
    // markEdited(plannerId: string, dotPath: string): void
    //   e.g. markEdited(uuid, 'days.2026-03-28.tl')

    markEdited(plannerId, dotPath) {
        // Read current rev map (or start fresh)
        const rawRev = localStorage.getItem(keyRev(plannerId));
        const revs = rawRev ? JSON.parse(rawRev) : {};

        // Get the current "base" clock from sync:{plannerId} as the reference
        // so the new clock is guaranteed to be > the last server clock.
        const syncRaw = localStorage.getItem(keySync(plannerId));
        const baseClock = syncRaw || HLC_ZERO;

        // Tick the clock forward from the existing field rev (or the base clock)
        // to produce a new, strictly larger HLC stamp.
        const existingFieldClock = revs[dotPath] || baseClock;
        const newClock = HLC.tick(existingFieldClock, Date.now());

        revs[dotPath] = newClock;
        localStorage.setItem(keyRev(plannerId), JSON.stringify(revs));
    }

    // ── sync ─────────────────────────────────────────────────────────────────
    //
    // POST ${url}year-planner/sync with jsmdma payload.
    // On success: write sync:{plannerId}, base:{plannerId}, rev:{plannerId}.
    // On HTTP error: throws with err.status set.
    //
    // async sync(plannerId: string, plannerDoc: object, authHeaders: object): Promise<object>
    //   plannerDoc — the days object from _getPlnrDoc(plannerId).days
    //   authHeaders — { Authorization: 'Bearer ...' } or {}
    //   returns merged days object (or plannerDoc unchanged if no serverChanges)

    async sync(plannerId, plannerDoc, authHeaders) {
        // (a) Read client clock fallback to HLC_ZERO
        const clientClock = localStorage.getItem(keySync(plannerId)) || HLC_ZERO;

        // (b) Read fieldRevs fallback to {}
        const rawRev = localStorage.getItem(keyRev(plannerId));
        const fieldRevs = rawRev ? JSON.parse(rawRev) : {};

        // (c) Read base snapshot fallback to {}
        const rawBase = localStorage.getItem(keyBase(plannerId));
        const base = rawBase ? JSON.parse(rawBase) : {};

        // (d) Build jsmdma payload
        const payload = {
            collection: 'planners',
            clientClock,
            changes: [{ key: plannerId, doc: plannerDoc, fieldRevs, baseClock: clientClock }],
        };

        // (e) POST to /year-planner/sync — throws with err.status on HTTP error
        const response = await fetchJSON(`${this.url}year-planner/sync`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify(payload),
        });

        // (f) Process server response { serverClock, serverChanges }
        const { serverClock, serverChanges } = response;

        let merged = plannerDoc;

        if (serverChanges && serverChanges.length > 0) {
            // 3-way merge each server change and accumulate the merged doc
            for (const serverChange of serverChanges) {
                const result = merge(
                    base,
                    { doc: plannerDoc, fieldRevs },
                    { doc: serverChange.doc, fieldRevs: serverChange.fieldRevs },
                );
                merged = result.merged;
            }
            // Write the final merged snapshot as new base
            localStorage.setItem(keyBase(plannerId), JSON.stringify(merged));
        } else {
            // No server changes — keep current plannerDoc as base
            localStorage.setItem(keyBase(plannerId), JSON.stringify(plannerDoc));
        }

        // Write the server clock
        localStorage.setItem(keySync(plannerId), serverClock);

        return merged;
    }

    // ── prune ────────────────────────────────────────────────────────────────
    //
    // Remove all sync state for a planner (call on planner deletion).
    // prune(plannerId: string): void

    prune(plannerId) {
        localStorage.removeItem(keyRev(plannerId));
        localStorage.removeItem(keyBase(plannerId));
        localStorage.removeItem(keySync(plannerId));
    }
}
