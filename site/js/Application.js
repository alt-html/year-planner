import { urlParam } from './util/urlparam.js';
import { getNavigatorLanguage } from "./vue/i18n.js";
import { ClientAuthSession, DeviceSession, PreferencesStore } from './vendor/jsmdma-auth-client.esm.js';

import { DateTime } from 'https://cdn.jsdelivr.net/npm/luxon@2/build/es6/luxon.min.js';

export default class Application {

    constructor(i18n, api, model, storage, storageLocal, messages, authProvider) {
        this.qualifier = '@alt-html/year-planner/Application'
        this.logger = null;

        this.pageLoadTime = DateTime.now();
        this.url = {
            parameters : {
                // Only OAuth callback params and name are read from URL.
                // year / lang / theme are no longer bootstrap inputs (R103).
                name : urlParam('name')
            }
        }
        this.i18n = i18n || null;
        this.api = api || null;
        this.model = model || null;
        this.storage = storage || null;
        this.storageLocal = storageLocal || null;
        this.messages = messages || null;
        this.authProvider = authProvider || null;
    }

    init(){

        // Handle OAuth link callback: detect oauth_link_intent + ?code= + ?state= (LNK-01)
        const linkIntent = localStorage.getItem('oauth_link_intent');
        const urlCodeRaw = urlParam('code');
        const urlStateRaw = urlParam('state');
        const urlCodeVerifierRaw = urlParam('code_verifier');
        if (linkIntent && urlCodeRaw && urlStateRaw) {
            // Decode URL params — urlParam() returns percent-encoded values
            const urlCode = decodeURIComponent(urlCodeRaw);
            const urlState = decodeURIComponent(urlStateRaw);
            const urlCodeVerifier = urlCodeVerifierRaw ? decodeURIComponent(urlCodeVerifierRaw) : '';
            // Async link completion — sets model.linkedProviders after POST succeeds
            this._pendingLink = this.authProvider.completeLinkCallback(linkIntent, urlCode, urlState, urlCodeVerifier)
                .then(providers => {
                    this.model.linkedProviders = providers;
                    // LNK-04: migrate userKey on all local planners to primary UUID.
                    // plannerStore is accessed via this.model.plannerStore — CDI property-injects
                    // the PlannerStore singleton onto the model plain object (see model.js line 15).
                    // Application does NOT have plannerStore as a constructor param.
                    const plannerStore = this.model.plannerStore;
                    if (plannerStore) {
                        const planners = plannerStore.listPlanners();
                        for (const { uuid } of planners) {
                            plannerStore.takeOwnership(uuid);
                        }
                    }
                    this.logger?.debug?.(`[Application.init] link complete — providers=${providers.join(',')}`);
                })
                .catch(err => {
                    this.logger?.debug?.(`[Application.init] link failed: ${err.message}`);
                    this.model.modalError = err.message || 'error.general';
                });
            // Clean up URL query params
            const cleanUrl = new URL(window.location.href);
            cleanUrl.searchParams.delete('code');
            cleanUrl.searchParams.delete('state');
            cleanUrl.searchParams.delete('code_verifier');
            window.history.replaceState({}, '', cleanUrl.toString());
        }

        // Handle OAuth callback: server sends JWT as ?token= after /auth/:provider/callback
        const urlToken = urlParam('token');
        if (urlToken) {
            ClientAuthSession.store(urlToken);
            const VALID_PROVIDERS = ['google', 'github', 'apple', 'microsoft'];
            const raw = localStorage.getItem('oauth_intended_provider');
            const intendedProvider = VALID_PROVIDERS.includes(raw) ? raw : 'google';
            localStorage.setItem('auth_provider', intendedProvider);
            localStorage.removeItem('oauth_state');
            localStorage.removeItem('oauth_code_verifier');
            localStorage.removeItem('oauth_intended_provider');
            this.logger?.debug?.('[Application.init] ?token= received — stored JWT, auth_provider=' + intendedProvider);
            const cleanUrl = new URL(window.location.href);
            cleanUrl.searchParams.delete('token');
            window.history.replaceState({}, '', cleanUrl.toString());
        }

        this.model.userKey = ClientAuthSession.getUserUuid() || DeviceSession.getDeviceId();
        this.model.uuid = ClientAuthSession.getUserUuid() || '',
        this.model.uid = 0; // deprecated — no longer read from URL or storage
        this.model.pageLoadTime = this.pageLoadTime;
        this.model.identities = this.storageLocal.getLocalIdentities() || [{0:this.model.uid,1:window.navigator.userAgent,2:0,3:0}],

        this.model.preferences = (this.storageLocal.getLocalPreferences(this.model.userKey) || {});

        // Resolve startup year/lang/theme from preferences + system defaults only.
        // URL params year/lang/theme are intentionally ignored here (R103).
        const SUPPORTED_LANGS = ['en','zh','hi','ar','es','pt','fr','ru','id','ja'];
        const navLangRaw = getNavigatorLanguage().substring(0, 2).toLowerCase();
        const navLang = SUPPORTED_LANGS.includes(navLangRaw) ? navLangRaw : 'en';
        const systemTheme = window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

        this.model.year = this.model.preferences['0'] || this.pageLoadTime.year;
        this.model.lang = this.model.preferences['1'] || navLang;
        this.model.theme = this.model.preferences['2'] !== undefined
            ? (this.model.preferences['2'] == 1 ? 'dark' : 'light')
            : systemTheme;
        // Mode contract: 'system' follows OS/navigator live; 'explicit' is a user override.
        // Default: 'system' for fresh installs, 'explicit' for existing prefs that had a stored value.
        this.model.langMode = this.model.preferences.langMode
            || (this.model.preferences['1'] ? 'explicit' : 'system');
        this.model.themeMode = this.model.preferences.themeMode
            || (this.model.preferences['2'] !== undefined ? 'explicit' : 'system');

        this.model.name = this.url.parameters.name || (this.model.preferences['3']?.[''+this.model.year]?.[this.model.lang]) || '';

        this.model.preferences['0'] = this.model.year;
        this.model.preferences['1'] = this.model.lang;
        this.model.preferences['2'] = (this.model.theme == 'light' ? 0:1);
        this.model.preferences.langMode  = this.model.langMode;
        this.model.preferences.themeMode = this.model.themeMode;
        if (!this.model.preferences['3']){
            this.model.preferences['3'] = {};
        }
        if (!this.model.preferences['3'][''+this.model.year]){
            this.model.preferences['3'][''+this.model.year] = {}
        }

        this.model.preferences['3'][''+this.model.year][this.model.lang]=this.model.name;
        this.model.updated = this.pageLoadTime.ts,
        this.model.cyear  = this.pageLoadTime.year,
        this.model.cmonth  = this.pageLoadTime.month,
        this.model.cday = this.pageLoadTime.day,

        this.model.registered = this.storageLocal.registered(),
        this.model.signedin = this.storageLocal.signedin(),
        this.model.availableProviders = this.authProvider?.getAvailableProviders() || [];

        // Populate linked providers from JWT payload (LNK-03)
        const payload = ClientAuthSession.getPayload();
        this.model.linkedProviders = payload?.providers ?? [];

        this.logger?.debug?.(`[Application.init] userKey=${this.model.userKey} uuid=${this.model.uuid} year=${this.model.year} lang=${this.model.lang} langMode=${this.model.langMode} theme=${this.model.theme} themeMode=${this.model.themeMode} signedin=${this.model.signedin} registered=${this.model.registered} url=${window.location.href}`);

        this.messages[this.model.lang]['label']['name_'+this.model.year] = this.model.name;

        // Sign-in pester: show auth modal once every 30 days if not signed in
        if (!this.model.signedin) {
            const lastPester = parseInt(localStorage.getItem('pester_signin') || '0', 10);
            const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
            if (Date.now() - lastPester > thirtyDaysMs) {
                localStorage.setItem('pester_signin', String(Date.now()));
                this.model._showSigninPester = true;
            }
        }

        // Restore rail collapsed state from saved preferences
        const savedPrefs = PreferencesStore.get(String(this.model.userKey));
        this.model.railCollapsed = (savedPrefs?.railOpen === false);
        this.logger?.debug?.(`[Application.init] complete — railCollapsed=${this.model.railCollapsed}`);
    }

    async run (vueApp) {
        this.logger?.verbose('Running application: configuring Vue app before mount.');
        vueApp.use(this.i18n);
        // Mount and data-app-ready are handled by vueStarter / main.js after onReady returns.

        // Sync i18n locale to resolved startup language (not from URL — R103).
        this.i18n.global.locale = this.model.lang;
        document.title = this.i18n.global.t('label.yearplanner');
        document.documentElement.lang = this.model.lang;

        // Apply initial rail state
        const rail = document.getElementById('rail');
        if (rail && this.model.railCollapsed) rail.classList.add('yp-rail--collapsed');

        // Wire toggle event
        const self = this;
        document.addEventListener('yp-rail-toggle', () => {
            Application.handleRailToggle(self.model, self.storageLocal);
            const r = document.getElementById('rail');
            if (r) r.classList.toggle('yp-rail--collapsed', self.model.railCollapsed);
        });

        // Bootstrap tooltips removed with jQuery — tooltips rely on title= attributes
        // which browsers render natively. No replacement needed.

        // Start sync scheduler — fires on online / visibilitychange events
        this.model.syncScheduler?.start();
    }

    static handleRailToggle(model, storageLocal) {
        model.railCollapsed = !model.railCollapsed;
        const existing = PreferencesStore.get(String(model.userKey)) || {};
        PreferencesStore.set(String(model.userKey), { ...existing, railOpen: !model.railCollapsed });
    }
}
