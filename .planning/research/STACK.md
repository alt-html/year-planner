# Stack Research

**Domain:** GitHub OAuth sign-in, auth module extraction, account linking (vanilla ES module PWA)
**Researched:** 2026-04-14
**Confidence:** HIGH

## Context

This is a SUBSEQUENT MILESTONE research file. The existing stack (Vue 3 Options API, Bootstrap 5.3.8, CDI, m4 build, jsmdma vendor bundles) is validated and NOT re-researched here. This file covers only what is NEW or CHANGED for v1.5 GitHub OAuth & Account Linking.

---

## New Capabilities Required

### 1. GitHub OAuth Web Application Flow (No Client-side SDK)

**Verdict:** No CDN library needed. The flow is 3 server-assisted steps, all implemented with native browser fetch + sessionStorage + window.location redirect.

GitHub's token exchange endpoint (`https://github.com/login/oauth/access_token`) does NOT support CORS. The code→token exchange must occur server-side. The existing pattern in `AuthProvider.js` (`_signInGoogle()`) already implements this correctly: client calls `GET /auth/google` → server returns `authorizationURL` → client redirects. GitHub follows the same pattern at `GET /auth/github`.

The existing `jsmdma-auth-client.esm.js` vendor bundle already includes `ClientAuthSession` (JWT storage/retrieval), `DeviceSession`, `IdentityStore`, and `PreferencesStore`. The bundle handles token storage in `localStorage.auth_token`. No additional library is needed on the client side.

**PKCE (optional enhancement):** GitHub announced PKCE support on 2025-07-14. The S256 method is the only accepted method. However, GitHub still requires `client_secret` on the token exchange even with PKCE (it does not yet distinguish public clients). PKCE is therefore an additive security layer, not a flow replacement, and the existing server-side flow remains required. PKCE can be added later without architectural change.

If PKCE is added: `code_verifier` and `code_challenge` are generated client-side using `crypto.subtle.digest('SHA-256', ...)` (Web Crypto API, available on https and localhost). Store `code_verifier` in `sessionStorage` (not localStorage — lives only for the redirect round-trip). The existing `jsmdma-auth-client.esm.js` already stores `oauth_state` and `oauth_code_verifier` in `sessionStorage` (lines 338-339 of the vendor bundle) so the infrastructure is already there.

**Scope:** Use `read:user` + `user:email` for minimum identity (user ID, login, name, email). This is narrower and safer than the broad `user` scope.

### 2. Auth Module Extraction — `site/js/auth/`

**What moves:** All auth logic currently in `site/js/service/AuthProvider.js` and auth-related Vue methods/model pieces. The goal is a generic, app-agnostic auth module usable by sibling apps.

**Pattern:** Flat ES module folder `site/js/auth/` with explicit named exports. No new framework, no new CDN dependency. CDI registration in `contexts.js` remains the wiring point — the new module's class is registered as a `Singleton` with the same constructor injection pattern.

**What does NOT move:** `jsmdma-auth-client.esm.js` stays in `site/js/vendor/` (it's a vendored upstream). The auth module imports from it.

**auth-config.js:** Add `github: { clientId: '...' }` entry alongside existing `google`, `apple`, `microsoft`. The `authConfig` shape already supports this; no structural change required.

### 3. Account Linking UI

**What is needed:** New Vue reactive state flags (`showLinkModal`, `linkProvider`, etc.) and Vue methods (`linkWith`, `unlinkProvider`, `transferIdentity`) following the existing pattern in `site/js/vue/methods/auth.js` and `site/js/vue/model/auth.js`.

**API shape:** Account linking calls POSTed to the jsmdma backend (`/auth/link`, `/auth/unlink`) with the current JWT in `Authorization: Bearer` header. The server associates providers; the client stores the returned updated JWT. This is server-authoritative — the client never directly merges identities.

**No new CDN dependency.** The account linking UI is pure Vue reactivity + `fetch`. No third-party library needed.

---

## Recommended Stack (New Additions Only)

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Web Crypto API (`crypto.subtle`) | Browser built-in | PKCE code_verifier / code_challenge generation | No library needed; available on https + localhost; already used in `jsmdma-auth-client.esm.js` for `crypto.randomUUID()` |
| sessionStorage | Browser built-in | Temporary PKCE `code_verifier` + `oauth_state` across redirect round-trip | sessionStorage clears on tab close — correct lifetime for OAuth round-trip; localStorage would persist stale verifiers |

### Supporting Libraries

No new CDN dependencies required.

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| `jsmdma-auth-client.esm.js` | vendored (current) | `ClientAuthSession`, `DeviceSession`, `IdentityStore`, `PreferencesStore` | Already in `site/js/vendor/` — covers all client-side auth storage needs |
| `@alt-javascript/cdi` | 3.x (CDN) | CDI singleton registration for new auth module | Already in use — no change |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| m4 build system | HTML fragment composition | `auth-config.js` changes go in `site/js/config/` — not in fragments; no m4 changes expected for auth |
| Playwright | Auth flow integration tests | Existing test suite; add tests for sign-in redirect, callback token handling, link/unlink flows |

---

## Installation

No npm install. No new CDN `<script>` or `<link>` tags required.

GitHub OAuth flow is handled by:
1. Browser's native `fetch()` calling the jsmdma backend
2. `window.location.href` redirect to GitHub
3. `sessionStorage` for PKCE state (if used)
4. Existing `ClientAuthSession` in vendor bundle for JWT storage

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Server-assisted flow (client calls `GET /auth/github`, backend returns `authorizationURL`) | Pure client-side implicit grant | Implicit grant is deprecated in OAuth 2.1; client_secret exposure is a security violation. Never use for a real app. |
| `read:user` + `user:email` scopes | Broad `user` scope | Only request `user` if write access to profile is actually needed — it's not needed here |
| sessionStorage for `code_verifier` | localStorage for `code_verifier` | localStorage persists stale verifiers across sessions, creating replay attack surface |
| Extending `AuthProvider.js` into `site/js/auth/` module folder | Keeping auth logic in `site/js/service/` | Module extraction is the milestone goal; `service/` is for app-specific services, `auth/` enables cross-app reuse |
| Vendored `jsmdma-auth-client.esm.js` for token management | Custom JWT handling code | Vendor bundle already implements `iat` / `iat_session` idle+hard TTL logic; reinventing it adds risk with no benefit |

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| GitHub OAuth SDK (Octokit `auth-oauth-app.js` etc.) | Node.js focused; ESM bundle is oversized for a single redirect flow; all functionality needed is 3 `fetch()` calls | Native `fetch()` + `window.location.href` |
| Passport.js | Node.js middleware — not relevant to client-side ES module app | Backend handles Passport if jsmdma uses it; client has no dependency |
| Firebase Auth / Auth0 / Clerk | Full auth platform = unnecessary external dependency, cross-origin token issuance, and vendor lock-in for a self-hosted sync backend | Server-side GitHub OAuth callback returning jsmdma JWT |
| Implicit grant flow | Deprecated in OAuth 2.1; access token exposed in URL fragment, leaks via Referer header, no refresh tokens | Authorization code flow via server-assisted redirect |
| MSAL.js for GitHub | MSAL is Microsoft-specific (already used for Microsoft provider) | GitHub has its own OAuth endpoint; MSAL is irrelevant |
| Any new `<script>` CDN tag for auth | Every new CDN tag is a supply-chain risk and SRI management burden | All needed auth behaviour is already in vendored bundle + native browser APIs |

---

## Integration Points

### Existing Pattern Match (HIGH confidence)

The Google flow in `AuthProvider.js` is the correct template for GitHub. Both use:

```
GET /auth/{provider}
→ { authorizationURL, state, codeVerifier }
→ sessionStorage.setItem('oauth_state', state)
→ sessionStorage.setItem('oauth_code_verifier', codeVerifier)
→ window.location.href = authorizationURL
```

On return, `Application.js` already handles the `?token=` URL parameter (line 35-43), stores the JWT via `ClientAuthSession.store(urlToken)`, and cleans the URL. This pattern is unchanged for GitHub.

The only addition is setting `localStorage.setItem('auth_provider', 'github')` on callback.

### CDI Wiring

The new `site/js/auth/AuthModule.js` (or equivalent) follows the existing `Singleton` pattern in `contexts.js`. Constructor parameter names must match CDI-registered names (`model`, `storageLocal`, etc. — camelCase class name convention).

### auth-config.js Addition

```javascript
export const authConfig = {
    github: {
        clientId: '',  // GitHub OAuth App client ID
    },
    google: { ... },
    apple: { ... },
    microsoft: { ... },
};
```

The jsmdma backend `auth/github` route uses `clientId` from server-side environment config, not this client-side config. The client-side `clientId` here is only for `getAvailableProviders()` gating (show/hide the GitHub sign-in button).

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `jsmdma-auth-client.esm.js` (vendored) | GitHub OAuth callback | `ClientAuthSession.store(token)` accepts any JWT — provider-agnostic |
| Web Crypto API | All modern browsers + localhost | `crypto.subtle` requires secure context (HTTPS or localhost); fine for both dev and production |
| sessionStorage | All modern browsers | Same-origin, same-tab scope — correct for OAuth redirect round-trip |

---

## Sources

- https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps — Web application flow steps, PKCE parameters, client_secret requirement (HIGH confidence, official GitHub docs)
- https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps — `read:user` + `user:email` scope definitions (HIGH confidence, official GitHub docs)
- https://github.blog/changelog/2025-07-14-pkce-support-for-oauth-and-github-app-authentication/ — PKCE support announcement, S256 only, client_secret still required (HIGH confidence, official GitHub changelog)
- https://github.com/isaacs/github/issues/330 — CORS not supported on GitHub's token exchange endpoint (MEDIUM confidence, widely corroborated community issue)
- Community research on sessionStorage for PKCE code_verifier: sessionStorage preferred over localStorage for redirect-round-trip temporary data (MEDIUM confidence, multiple sources agree)
- `site/js/service/AuthProvider.js` + `site/js/vendor/jsmdma-auth-client.esm.js` — Existing flow pattern verified against codebase (HIGH confidence, direct code inspection)

---
*Stack research for: GitHub OAuth & Account Linking — year-planner v1.5*
*Researched: 2026-04-14*
