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
