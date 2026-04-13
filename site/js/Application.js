import { urlParam } from './util/urlparam.js';
import { getNavigatorLanguage } from "./vue/i18n.js";
import { ClientAuthSession, DeviceSession, PreferencesStore } from './vendor/jsmdma-auth-client.esm.js';

import { DateTime } from 'https://cdn.jsdelivr.net/npm/luxon@2/build/es6/luxon.min.js';

export default class Application {

    constructor(i18n, api, model, storage, storageLocal, messages) {
        this.qualifier = '@alt-html/year-planner/Application'
        this.logger = null;

        this.pageLoadTime = DateTime.now();
        this.url = {
            parameters : {
                uid : urlParam('uid'),
                year : urlParam('year'),
                lang : urlParam('lang'),
                theme : urlParam('theme'),
                name : urlParam('name'),
                share : urlParam('share')
            }
        }
        this.i18n = i18n || null;
        this.api = api || null;
        this.model = model || null;
        this.storage = storage || null;
        this.storageLocal = storageLocal || null;
        this.messages = messages || null;
    }

    init(){

        // Handle OAuth callback: server sends JWT as ?token= after /auth/:provider/callback
        const urlToken = urlParam('token');
        if (urlToken) {
            ClientAuthSession.store(urlToken);
            localStorage.setItem('auth_provider', localStorage.getItem('auth_provider') || 'google');
            this.logger?.debug?.('[Application.init] ?token= received — stored JWT, auth_provider set');
            const cleanUrl = new URL(window.location.href);
            cleanUrl.searchParams.delete('token');
            window.history.replaceState({}, '', cleanUrl.toString());
        }

        this.model.uid = parseInt( urlParam('uid') ) || this.storageLocal.getLocalUid() || Math.floor(this.pageLoadTime.ts/1000);
        this.model.uuid = ClientAuthSession.getUserUuid() || '',
        this.model.userKey = ClientAuthSession.getUserUuid() || DeviceSession.getDeviceId();
        this.model.pageLoadTime = this.pageLoadTime;
        this.model.identities = this.storageLocal.getLocalIdentities() || [{0:this.model.uid,1:window.navigator.userAgent,2:0,3:0}],

        this.model.preferences = (this.storageLocal.getLocalPreferences(this.model.uid) || {});

        this.model.year = parseInt( this.url.parameters.year ) || this.model.preferences['0'] || this.pageLoadTime.year;
        this.model.lang = (this.url.parameters.lang || this.model.preferences['1'] || getNavigatorLanguage() ).substring(0,2);
        this.model.theme = this.url.parameters.theme || (this.model.preferences['2'] == 1 ? 'dark' : 'light');
        this.model.name = this.url.parameters.name || (this.model.preferences['3']?.[''+this.model.year]?.[this.model.lang]) || '';
        this.model.share = this.url.parameters.share || '';

        this.model.preferences['0'] = this.model.year;
        this.model.preferences['1'] = this.model.lang;
        this.model.preferences['2'] = (this.model.theme == 'light' ? 0:1);
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

        this.logger?.debug?.(`[Application.init] uid=${this.model.uid} uuid=${this.model.uuid} year=${this.model.year} signedin=${this.model.signedin} registered=${this.model.registered} url=${window.location.href}`);

        // Pre-set canonical URL (?uid=&year=) via replaceState so refresh() doesn't do a
        // hard navigation that would abort any in-flight sync fetch.
        if (!window.location.href.includes('?uid=')) {
            const canonical = new URL(window.location.origin + '/');
            canonical.searchParams.set('uid',   String(this.model.uid));
            canonical.searchParams.set('year',  String(this.model.year));
            canonical.searchParams.set('lang',  this.model.lang);
            canonical.searchParams.set('theme', this.model.theme);
            this.logger?.debug?.(`[Application.init] replaceState → canonical URL ${canonical.toString()}`);
            window.history.replaceState({}, '', canonical.toString());
        }

        this.storage.setModelFromImportString(this.model.share);

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
        const savedPrefs = PreferencesStore.get(String(this.model.uid));
        this.model.railCollapsed = (savedPrefs?.railOpen === false);
        this.logger?.debug?.(`[Application.init] complete — railCollapsed=${this.model.railCollapsed}`);
    }

    async run (vueApp) {
        this.logger?.verbose('Running application: configuring Vue app before mount.');
        vueApp.use(this.i18n);
        // Mount and data-app-ready are handled by vueStarter / main.js after onReady returns.

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
        const existing = PreferencesStore.get(String(model.uid)) || {};
        PreferencesStore.set(String(model.uid), { ...existing, railOpen: !model.railCollapsed });
    }
}
