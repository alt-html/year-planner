export const lifecycleMethods = {

    refresh() {
        this.logger?.debug?.(`[lifecycle.refresh] uid=${this.uid} userKey=${this.userKey} year=${this.year} signedin=${this.signedin}`);
        this.setYear(this.year);
        if (!this.storageLocal.initialised()) {
            this.logger?.debug?.('[lifecycle.refresh] not initialised — calling initialise()');
            this.initialise();
        }
        this.userKey = this.plannerStore.getUserKey();

        // Restore last active planner, or auto-create on first visit
        const restored = this.plannerStore.restoreActive();
        if (restored) {
            this.activeDocUuid = restored;
        } else if (this.plannerStore.listPlanners().length === 0) {
            // First visit — create a default planner so the user can start editing
            const uuid = this.plannerStore.createDoc(this.userKey, this.year, '');
            this.plannerStore.activateDoc(uuid);
            this.activeDocUuid = uuid;
        }

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
            this.$nextTick(() => { this.showAuthModal = true; });
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
