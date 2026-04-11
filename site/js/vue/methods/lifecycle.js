export const lifecycleMethods = {

    refresh() {
        this.logger?.debug?.(`[lifecycle.refresh] uid=${this.uid} userKey=${this.userKey} year=${this.year} signedin=${this.signedin}`);
        this.setYear(this.year);
        if (!this.storageLocal.initialised()) {
            this.logger?.debug?.('[lifecycle.refresh] not initialised — calling initialise()');
            this.initialise();
        }
        const userKey = this.plannerStore.getUserKey();
        this.userKey      = userKey;
        this.activeDocUuid = this.plannerStore.activateDoc(userKey, this.year);
        this.storageLocal.setLocalFromModel();
        if (this.theme === 'dark') {
            document.body.classList.add('yp-dark');
        } else {
            document.body.classList.remove('yp-dark');
        }
        this.loaded = true;
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
