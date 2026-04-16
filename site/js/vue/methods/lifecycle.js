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
            var appEl = document.getElementById('app');
            if (appEl) appEl.setAttribute('data-bs-theme', 'dark');
        } else {
            document.body.classList.remove('yp-dark');
            var appEl = document.getElementById('app');
            if (appEl) appEl.removeAttribute('data-bs-theme');
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
        this.storageLocal.setLocalPreferences(this.userKey, {
            0: this.year, 1: this.lang,
            2: (this.theme === 'dark' ? 1 : 0),
            3: this.preferences['3'] || null,
        });
    },

    setTheme(theme) {
        if (theme !== 'light' && theme !== 'dark') return;
        this.theme = theme;
        this.preferences['2'] = (theme === 'dark' ? 1 : 0);
        this.storageLocal.setLocalPreferences(this.userKey, this.preferences);
        if (theme === 'dark') {
            document.body.classList.add('yp-dark');
            const appEl = document.getElementById('app');
            if (appEl) appEl.setAttribute('data-bs-theme', 'dark');
        } else {
            document.body.classList.remove('yp-dark');
            const appEl = document.getElementById('app');
            if (appEl) appEl.removeAttribute('data-bs-theme');
        }
    },

    setLang(lang) {
        const VALID_LANGS = ['en','zh','hi','ar','es','pt','fr','ru','id','ja'];
        const normalized = String(lang || '').substring(0, 2).toLowerCase();
        if (!VALID_LANGS.includes(normalized)) return;
        this.lang = normalized;
        this.preferences['1'] = this.lang;
        this.storageLocal.setLocalPreferences(this.userKey, this.preferences);
        this.$i18n.locale = this.lang;
        document.documentElement.lang = this.lang;
        this.showLangMenu = false;
    },

    jumpToYear(yr) {
        const parsed = parseInt(yr);
        if (isNaN(parsed) || parsed < 1 || parsed > 9999) return;
        this.setYear(parsed);
        this.preferences['0'] = parsed;
        this.storageLocal.setLocalPreferences(this.userKey, this.preferences);
    },

    clearError() {
        this.error = '';
    },
}
