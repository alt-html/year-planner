const _VALID_LANGS = ['en','zh','hi','ar','es','pt','fr','ru','id','ja'];

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

        this.storageLocal.setLocalFromModel();
        this._applyThemeDom(this.theme);
        this.loaded = true;
        this.syncScheduler.markDirty();
        if (this._showSigninPester) {
            this._showSigninPester = false;
            this.$nextTick(() => { this.showAuthModal = true; });
        }
        // Register OS-follow listeners — idempotent across multiple refresh() calls
        this.registerSystemListeners();
    },

    initialise() {
        this.storageLocal.setLocalIdentities(this.identities);
        this.storageLocal.setLocalPreferences(this.userKey, {
            0: this.year, 1: this.lang,
            2: (this.theme === 'dark' ? 1 : 0),
            3: this.preferences['3'] || null,
            langMode:  this.langMode  || 'system',
            themeMode: this.themeMode || 'system',
        });
    },

    // ── Theme DOM helper ─────────────────────────────────────────────────────

    _applyThemeDom(theme) {
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

    // ── System-follow helpers ────────────────────────────────────────────────

    _applySystemTheme() {
        // Recompute from current query state — do not trust event.matches (handles malformed payloads)
        const systemDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
        const resolved = systemDark ? 'dark' : 'light';
        this.theme = resolved;
        this.preferences['2'] = (resolved === 'dark' ? 1 : 0);
        this.storageLocal.setLocalPreferences(this.userKey, this.preferences);
        this._applyThemeDom(resolved);
        this.logger?.debug?.(`[lifecycle._applySystemTheme] resolved=${resolved}`);
    },

    _applySystemLang() {
        const navRaw = (navigator.languages && navigator.languages.length)
            ? navigator.languages[0]
            : (navigator.userLanguage || navigator.language || navigator.browserLanguage || 'en');
        const nav2 = String(navRaw || '').substring(0, 2).toLowerCase();
        const resolved = _VALID_LANGS.includes(nav2) ? nav2 : 'en';
        if (resolved === this.lang) {
            this.logger?.debug?.(`[lifecycle._applySystemLang] resolved=${resolved} (no change)`);
            return;
        }
        this.lang = resolved;
        this.preferences['1'] = resolved;
        this.storageLocal.setLocalPreferences(this.userKey, this.preferences);
        this.$i18n.locale = resolved;
        document.documentElement.lang = resolved;
        this.logger?.debug?.(`[lifecycle._applySystemLang] resolved=${resolved}`);
    },

    // ── Live OS-follow listener registration ─────────────────────────────────

    registerSystemListeners() {
        if (this._systemListenersRegistered) return;
        this._systemListenersRegistered = true;

        // Theme — follow OS color scheme when themeMode === 'system'
        const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
        if (mq) {
            this._onSystemThemeChange = () => {
                if (this.themeMode !== 'system') return;
                this._applySystemTheme();
            };
            try {
                mq.addEventListener('change', this._onSystemThemeChange);
            } catch (e) {
                // Safari <14 fallback
                mq.addListener?.(this._onSystemThemeChange);
            }
        }

        // Language — follow navigator language when langMode === 'system'
        this._onSystemLangChange = () => {
            if (this.langMode !== 'system') return;
            this._applySystemLang();
        };
        window.addEventListener('languagechange', this._onSystemLangChange);

        this.logger?.debug?.('[lifecycle.registerSystemListeners] registered matchMedia + languagechange listeners');
    },

    // ── Theme setter ─────────────────────────────────────────────────────────

    setTheme(theme) {
        if (theme === 'system') {
            this.themeMode = 'system';
            this.preferences.themeMode = 'system';
            this._applySystemTheme();
            this.logger?.debug?.('[lifecycle.setTheme] mode=system — applied OS theme');
            return;
        }
        if (theme !== 'light' && theme !== 'dark') return;
        this.themeMode = 'explicit';
        this.preferences.themeMode = 'explicit';
        this.theme = theme;
        this.preferences['2'] = (theme === 'dark' ? 1 : 0);
        this.storageLocal.setLocalPreferences(this.userKey, this.preferences);
        this._applyThemeDom(theme);
        this.logger?.debug?.(`[lifecycle.setTheme] mode=explicit theme=${theme}`);
    },

    // ── Language setter ───────────────────────────────────────────────────────

    setLang(lang) {
        if (lang === 'system') {
            this.langMode = 'system';
            this.preferences.langMode = 'system';
            this._applySystemLang();
            this.showLangMenu = false;
            this.logger?.debug?.('[lifecycle.setLang] mode=system — applied navigator lang');
            return;
        }
        const normalized = String(lang || '').substring(0, 2).toLowerCase();
        if (!_VALID_LANGS.includes(normalized)) return;
        this.langMode = 'explicit';
        this.preferences.langMode = 'explicit';
        this.lang = normalized;
        this.preferences['1'] = this.lang;
        this.storageLocal.setLocalPreferences(this.userKey, this.preferences);
        this.$i18n.locale = this.lang;
        document.documentElement.lang = this.lang;
        this.showLangMenu = false;
        this.logger?.debug?.(`[lifecycle.setLang] mode=explicit lang=${normalized}`);
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
