import { authConfig } from '../config/auth-config.js';

// Federated auth provider abstraction.
// Wraps Google, Apple, and Microsoft sign-in behind a common interface.
// Provider SDKs are loaded lazily only when sign-in is attempted.
export default class AuthProvider {
    constructor(model, storageLocal) {
        this.qualifier = '@alt-html/year-planner/AuthProvider'
        this.logger = null;

        this.model = model;
        this.storageLocal = storageLocal;
        this._sdkLoaded = {};
    }

    // Returns list of configured providers (those with a clientId set)
    getAvailableProviders() {
        let providers = [];
        if (authConfig.google.clientId) providers.push('google');
        if (authConfig.apple.clientId) providers.push('apple');
        if (authConfig.microsoft.clientId) providers.push('microsoft');
        return providers;
    }

    // Returns true if at least one provider is configured
    isConfigured() {
        return this.getAvailableProviders().length > 0;
    }

    // Sign in with the specified provider
    async signIn(provider) {
        switch (provider) {
            case 'google': return this._signInGoogle();
            case 'apple': return this._signInApple();
            case 'microsoft': return this._signInMicrosoft();
            default: throw new Error(`Unknown auth provider: ${provider}`);
        }
    }

    // Sign out — clear auth token from localStorage
    signOut() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_provider');
        this.model.signedin = false;
        this.storageLocal.deleteLocalSession();
    }

    // Get the current auth token (null if not signed in)
    getToken() {
        return localStorage.getItem('auth_token');
    }

    // Get the current auth provider name (null if not signed in)
    getProvider() {
        return localStorage.getItem('auth_provider');
    }

    // Store auth result after successful sign-in
    _storeAuth(provider, token) {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_provider', provider);
        this.model.signedin = true;
        // Create a session compatible with existing sync flow
        this.storageLocal.setLocalSession(token, 0); // expires=0 means "remember me"
    }

    // --- Provider-specific sign-in flows ---

    async _signInGoogle() {
        await this._loadSDK('google', 'https://accounts.google.com/gsi/client');
        return new Promise((resolve, reject) => {
            const container = document.getElementById('google-signin-button');
            if (!container) {
                reject(new Error('Google sign-in not available — #google-signin-button container missing'));
                return;
            }

            window.google.accounts.id.initialize({
                client_id: authConfig.google.clientId,
                callback: (response) => {
                    if (response.credential) {
                        this._storeAuth('google', response.credential);
                        resolve(response.credential);
                    } else {
                        reject(new Error('Google sign-in failed'));
                    }
                },
                cancel_on_tap_outside: true,
            });

            // Render the branded button immediately — always visible in the modal.
            // renderButton does not depend on Google servers; it renders synchronously.
            container.innerHTML = '';
            window.google.accounts.id.renderButton(container, {
                theme: 'outline',
                size: 'large',
                width: 300,
            });

            // Also attempt One Tap overlay (shows in production; silently suppressed
            // in incognito/localhost — the rendered button above is the reliable fallback).
            window.google.accounts.id.prompt();
        });
    }

    async _signInApple() {
        await this._loadSDK('apple',
            'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js');

        if (!window.AppleID?.auth) {
            throw new Error('Apple Sign-In SDK not available');
        }
        try {
            const response = await window.AppleID.auth.signIn({
                clientId: authConfig.apple.clientId,
                redirectURI: authConfig.apple.redirectURI || window.location.origin,
                scope: 'name email',
                usePopup: true,
            });
            const token = response.authorization?.id_token;
            if (token) {
                this._storeAuth('apple', token);
                return token;
            }
            throw new Error('Apple sign-in failed — no token');
        } catch (err) {
            throw new Error(`Apple sign-in failed: ${err.message || err}`);
        }
    }

    async _signInMicrosoft() {
        // MSAL.js is an ES module — dynamic import from CDN
        if (!this._msalInstance) {
            const msal = await import('https://cdn.jsdelivr.net/npm/@azure/msal-browser@3/+esm');
            this._msalInstance = new msal.PublicClientApplication({
                auth: {
                    clientId: authConfig.microsoft.clientId,
                    authority: authConfig.microsoft.authority,
                    redirectUri: window.location.origin,
                },
            });
            await this._msalInstance.initialize();
        }

        try {
            const response = await this._msalInstance.loginPopup({
                scopes: ['openid', 'profile', 'email'],
            });
            const token = response.idToken;
            if (token) {
                this._storeAuth('microsoft', token);
                return token;
            }
            throw new Error('Microsoft sign-in failed — no token');
        } catch (err) {
            throw new Error(`Microsoft sign-in failed: ${err.message || err}`);
        }
    }

    // Lazy-load a provider SDK by inserting a <script> tag
    _loadSDK(name, src) {
        if (this._sdkLoaded[name]) return Promise.resolve();
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = () => {
                this._sdkLoaded[name] = true;
                resolve();
            };
            script.onerror = () => reject(new Error(`Failed to load ${name} SDK`));
            document.head.appendChild(script);
        });
    }
}
