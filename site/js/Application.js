import { urlParam } from './util/urlparam.js';
import { getNavigatorLanguage } from "./vue/i18n.js";

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
            localStorage.setItem('auth_token', urlToken);
            localStorage.setItem('auth_time', Date.now().toString());
            // Remove ?token= from URL without triggering a reload
            const cleanUrl = new URL(window.location.href);
            cleanUrl.searchParams.delete('token');
            window.history.replaceState({}, '', cleanUrl.toString());
        }

        // Handle OAuth redirect: Google sends ?code=&state= back to the SPA
        const oauthCode  = urlParam('code');
        const oauthState = urlParam('state');
        if (oauthCode && oauthState) {
            Application._handleOAuthCallback(oauthCode, oauthState);
        }

        this.model.uid = parseInt( urlParam('uid') ) || this.storageLocal.getLocalUid() || Math.floor(this.pageLoadTime.ts/1000);
        this.model.uuid = this.storageLocal.getLocalSession()?.['0']||'',
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
        this.model.planner = this.storage.getPlanner(this.model.uid, this.model.year),

        this.storage.setModelFromImportString(this.model.share);

        this.messages[this.model.lang]['label']['name_'+this.model.year] = this.model.name;
    }

    static async _handleOAuthCallback(oauthCode, oauthState) {
        const storedState  = sessionStorage.getItem('oauth_state');
        const codeVerifier = sessionStorage.getItem('oauth_code_verifier');
        sessionStorage.removeItem('oauth_state');
        sessionStorage.removeItem('oauth_code_verifier');

        // Guard: abort if sessionStorage was empty (fresh tab, cleared storage, or CSRF probe).
        // The state stored here must match the state returned by the provider — if it doesn't,
        // the request is likely stale or tampered. Clean up the URL and bail out.
        if (!storedState || storedState !== oauthState) {
            const cleanUrl = new URL(window.location.href);
            cleanUrl.searchParams.delete('code');
            cleanUrl.searchParams.delete('state');
            window.history.replaceState({}, '', cleanUrl.toString());
            return;
        }

        const apiUrl = 'http://127.0.0.1:8081/';
        try {
            const res = await fetch(
                `${apiUrl}auth/google/callback?code=${encodeURIComponent(oauthCode)}` +
                `&state=${encodeURIComponent(oauthState)}` +
                `&stored_state=${encodeURIComponent(storedState ?? '')}` +
                `&code_verifier=${encodeURIComponent(codeVerifier ?? '')}`,
            );
            if (res.ok) {
                const body = await res.json();
                if (body.token) {
                    localStorage.setItem('auth_token', body.token);
                    localStorage.setItem('auth_time', Date.now().toString());
                }
            }
        } catch { /* silent — auth failed, user stays signed out */ }

        // Clean up URL
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('code');
        cleanUrl.searchParams.delete('state');
        window.history.replaceState({}, '', cleanUrl.toString());
    }

    async run (vueApp) {
        this.logger?.verbose('Running application: configuring Vue app before mount.');
        vueApp.use(this.i18n);
        // Mount and data-app-ready are handled by vueStarter / main.js after onReady returns.

        document.title = this.i18n.global.t('label.yearplanner');
        document.documentElement.lang = this.model.lang;

        $(function () {
            $('[data-toggle="tooltip"]').tooltip()
        })
    }
}
