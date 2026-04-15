import { authConfig } from './auth-config.js';
import { OAuthClient } from './OAuthClient.js';
import { ClientAuthSession } from '../vendor/jsmdma-auth-client.esm.js';

// AuthService — CDI singleton facade for federated auth.
// Replaces AuthProvider.js with an app-agnostic API.
// Google and GitHub both dispatch through OAuthClient.signIn(provider) — no switch.
export default class AuthService {
    constructor(model) {
        this.qualifier = '@alt-html/year-planner/AuthProvider';  // CDI compat — Pitfall 1
        this.logger = null;

        this.url = '${api.url}';
        this.model = model;
        this._client = null;
    }

    // Returns list of configured providers (those with a clientId set)
    getAvailableProviders() {
        return Object.entries(authConfig)
            .filter(([, v]) => v.clientId)
            .map(([k]) => k);
    }

    // Returns true if at least one provider is configured
    isConfigured() {
        return this.getAvailableProviders().length > 0;
    }

    // Sign in with the specified provider — delegates to OAuthClient (no switch)
    async signIn(provider) {
        return this._oauthClient().signIn(provider);
    }

    // Unlink an OAuth provider from the current account (LNK-02)
    // Returns remaining provider names array, e.g. ['google']
    // Throws on 409 (last provider) or other HTTP errors
    async unlinkProvider(provider) {
        const token = this.getToken();
        if (!token) throw new Error('Not signed in');
        const res = await fetch(`${this._getApiUrl()}auth/providers/${provider}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (res.status === 409) throw new Error('error.lastProvider');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { providers } = await res.json();
        return providers.map(p => p.provider);
    }

    // Sign out — clear auth credentials; planner data is preserved (AUT-03)
    signOut() {
        ClientAuthSession.clear();
        localStorage.removeItem('auth_provider');
        localStorage.removeItem('oauth_intended_provider');
        localStorage.removeItem('oauth_state');
        localStorage.removeItem('oauth_code_verifier');
        this.model.signedin = false;
    }

    // Get the current auth token (null if not signed in)
    getToken() {
        return ClientAuthSession.getToken();
    }

    // Get the current auth provider name (null if not signed in)
    getProvider() {
        return localStorage.getItem('auth_provider');
    }

    // Lazy-create OAuthClient with the resolved API URL
    _oauthClient() {
        if (!this._client) {
            this._client = new OAuthClient(this._getApiUrl());
        }
        return this._client;
    }

    // Read the configured API base URL (replaced by build system in production)
    _getApiUrl() {
        const raw = this.url || '${api.url}';
        if (raw.startsWith('${')) return 'http://127.0.0.1:8081/';
        return raw.endsWith('/') ? raw : raw + '/';
    }
}
