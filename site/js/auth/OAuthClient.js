// OAuthClient — stateless OAuth redirect initiator.
// Handles BFF-based OAuth flows for all configured providers (Google, GitHub, etc.)
// via a uniform signIn(provider) interface. No app-specific code, no framework dependency.
export class OAuthClient {
    constructor(apiUrl) {
        this._apiUrl = apiUrl?.endsWith('/') ? apiUrl : (apiUrl ?? 'http://127.0.0.1:8081/') + '/';
    }

    async signIn(provider) {
        let beginResult;
        try {
            const res = await fetch(`${this._apiUrl}auth/${provider}`);
            if (!res.ok) throw new Error(`Server returned ${res.status}`);
            beginResult = await res.json();
        } catch (err) {
            throw new Error(`${provider} sign-in failed: could not reach auth server (${err.message})`);
        }
        const { authorizationURL } = beginResult;
        if (!authorizationURL) throw new Error(`${provider} sign-in failed: no authorizationURL from server`);
        localStorage.setItem('oauth_intended_provider', provider);
        window.location.href = authorizationURL;
        return new Promise(() => {});
    }
}
