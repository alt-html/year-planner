# Architecture Research

**Domain:** GitHub OAuth & Account Linking — auth module extraction for a CDN-only vanilla PWA
**Researched:** 2026-04-14
**Confidence:** HIGH — all findings based on live source files read in this session

---

## Standard Architecture

### System Overview

The current auth surface is spread across four files: `AuthProvider.js` (provider sign-in flows), `Application.js` (OAuth callback handling), `Api.js` (Bearer header injection), and `auth-config.js` (client IDs). The goal is to consolidate these into a cohesive `site/js/auth/` module that is app-agnostic and reusable by sibling `@alt-html` apps.

```
┌─────────────────────────────────────────────────────────────────────┐
│  site/js/vue/                         Vue layer (app-specific)       │
│  ┌───────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ vue/model/    │  │ vue/methods/ │  │ .compose/fragments/      │  │
│  │ auth.js       │  │ auth.js      │  │ modals/auth.html         │  │
│  │ (state shape) │  │ (signInWith, │  │ modals/link-account.html │  │
│  └───────────────┘  │  signout)    │  └──────────────────────────┘  │
│                     └──────┬───────┘                                 │
├───────────────────────────┼─────────────────────────────────────────┤
│  site/js/auth/            │              Auth module (app-agnostic)  │
│                           ▼                                          │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  AuthService.js  (NEW)                                       │    │
│  │  - signIn(provider)  → delegates to OAuthClient              │    │
│  │  - signOut()         → ClientAuthSession.clear()             │    │
│  │  - getToken()        → ClientAuthSession.getToken()          │    │
│  │  - isSignedIn()      → ClientAuthSession.isSignedIn()        │    │
│  │  - getProvider()     → localStorage.getItem('auth_provider') │    │
│  │  CDI singleton: constructor(model, storageLocal)             │    │
│  └──────────────────────────┬──────────────────────────────────┘    │
│                              │                                        │
│  ┌───────────────────────────▼──────────────────────────────────┐    │
│  │  OAuthClient.js  (NEW)                                        │    │
│  │  - Pure flow logic: redirect → callback → store token         │    │
│  │  - No Vue model dependency                                    │    │
│  │  - Wraps vendor AuthProvider from jsmdma-auth-client.esm.js  │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  AccountLinker.js  (NEW)                                      │    │
│  │  - linkProvider(provider)  → server POST /auth/link           │    │
│  │  - unlinkProvider(provider) → server DELETE /auth/link        │    │
│  │  - getLinkedProviders()    → server GET /auth/identities       │    │
│  │  CDI singleton: constructor(model, authService)               │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  auth-config.js  (MOVED from config/ → auth/)                 │    │
│  │  - github: { clientId }  (NEW)                                │    │
│  │  - google: { clientId }  (MOVED)                              │    │
│  │  - apple: { clientId }   (hidden until set)                   │    │
│  │  - microsoft: { clientId } (hidden until set)                 │    │
│  └──────────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────────┤
│  site/js/service/                     Service layer (existing)        │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────────┐  │
│  │  Api.js      │  │  Application │  │  StorageLocal.js          │  │
│  │  (MODIFIED)  │  │  .js         │  │  (signedin, registered)   │  │
│  │  authService │  │  (MODIFIED)  │  │  unchanged                │  │
│  │  replaces    │  │  uses        │  │                           │  │
│  │  authProvider│  │  authService │  │                           │  │
│  └──────────────┘  └──────────────┘  └───────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│  site/js/vendor/                      Vendor layer (unchanged)        │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  jsmdma-auth-client.esm.js                                    │    │
│  │  exports: AuthProvider, ClientAuthSession, DeviceSession,     │    │
│  │           IdentityStore, PreferencesStore                     │    │
│  └──────────────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  jsmdma-client.esm.js                                         │    │
│  │  exports: SyncDocumentStore, SyncClientAdapter                │    │
│  └──────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Recommended Project Structure

```
site/js/
├── auth/                          NEW FOLDER — app-agnostic auth module
│   ├── AuthService.js             NEW — CDI singleton; public auth API
│   ├── OAuthClient.js             NEW — stateless OAuth redirect/callback helper
│   ├── AccountLinker.js           NEW — provider link/unlink/list
│   └── auth-config.js             MOVED from config/auth-config.js
│
├── config/
│   ├── contexts.js                MODIFIED — swap AuthProvider for AuthService
│   └── config.js                  UNCHANGED
│
├── service/
│   ├── Api.js                     MODIFIED — constructor: authService not authProvider
│   ├── Application.js             MODIFIED — imports AuthService for callback handling
│   ├── AuthProvider.js            DELETED — replaced by auth/AuthService.js
│   ├── PlannerStore.js            UNCHANGED
│   ├── Storage.js                 UNCHANGED
│   ├── StorageLocal.js            UNCHANGED
│   └── SyncScheduler.js           UNCHANGED
│
├── vue/
│   ├── model/auth.js              MODIFIED — add linked providers state
│   ├── methods/auth.js            MODIFIED — add linkProvider/unlinkProvider methods
│   └── …                         UNCHANGED
│
└── vendor/
    ├── jsmdma-auth-client.esm.js  UNCHANGED
    └── jsmdma-client.esm.js       UNCHANGED
```

### Structure rationale

- **auth/ folder:** Groups everything auth-related that a sibling app can copy or symlink wholesale. The folder has zero year-planner-specific logic; it only knows about the jsmdma vendor contract and the generic `model.signedin` boolean.
- **auth-config.js moved to auth/:** Config is consumed only by auth code. It no longer belongs in `config/` where app-level config lives.
- **AuthProvider.js deleted:** The existing class duplicated the `AuthProvider` class already vendored in `jsmdma-auth-client.esm.js`. `AuthService.js` wraps the vendor class instead of reimplementing it.
- **AccountLinker.js separate from AuthService:** Auth (who am I?) and linking (which providers are wired to my account?) are orthogonal concerns. Keeping them in separate files makes account linking an optional addition for apps that don't need it.

---

## Component Responsibilities

| Component | Responsibility | New or Modified |
|-----------|----------------|-----------------|
| `auth/AuthService.js` | CDI singleton wrapping the vendor `AuthProvider` and `ClientAuthSession`. Public interface: `signIn`, `signOut`, `getToken`, `isSignedIn`, `getProvider`. Mutates `model.signedin` on sign-in/out. | NEW |
| `auth/OAuthClient.js` | Stateless helper: reads `?token=` from URL on return from OAuth redirect, stores via `ClientAuthSession.store()`, and strips the parameter from history. Extracted from `Application.init()`. | NEW |
| `auth/AccountLinker.js` | Communicates with server `POST /auth/link`, `DELETE /auth/link`, `GET /auth/identities`. Updates `model.linkedProviders`. Does not touch `ClientAuthSession`. | NEW |
| `auth/auth-config.js` | Provider client IDs and flags. `github.clientId` added. `apple` and `microsoft` remain as empty strings (hidden by `AuthService.getAvailableProviders()`). | MOVED + MODIFIED |
| `service/Api.js` | Constructor param renamed from `authProvider` to `authService` (same CDI injection — camelCase class name matches). `_authHeaders()` unchanged in behaviour. | MODIFIED |
| `service/Application.js` | OAuth callback (`?token=` handling) delegated to `OAuthClient.js`. Import of `ClientAuthSession` direct in `Application.js` removed. | MODIFIED |
| `service/AuthProvider.js` | Deleted. All callers updated to `authService`. | DELETED |
| `config/contexts.js` | `import AuthProvider` → `import AuthService`; `new Singleton(AuthProvider)` → `new Singleton(AuthService)`. AccountLinker added if account-linking phase is included. | MODIFIED |
| `vue/model/auth.js` | `linkedProviders: []` array added to reactive state. | MODIFIED |
| `vue/methods/auth.js` | `linkProvider(provider)`, `unlinkProvider(provider)` methods added. | MODIFIED |
| `.compose/fragments/modals/auth.html` | GitHub button added. Apple/Microsoft buttons hidden with `v-if="authService.isConfigured('apple')"` guard (or driven by `model.availableProviders`). | MODIFIED |

---

## Architectural Patterns

### Pattern 1: CDI Singleton with Constructor Injection

**What:** Every service in this app is a CDI singleton registered in `contexts.js`. Constructor parameter names must exactly match the CDI-registered camelCase class name. The CDI framework (`@alt-javascript/cdi`) auto-injects matching instances.

**When to use:** All new auth module services that need collaborators (model, storageLocal, other services).

**Trade-offs:** Forces explicit dependency declaration; no ambient globals. The constraint that parameter names equal class names (camelCase) is strict — a typo (`AuthService` vs `authService`) results in `undefined` injection with no error.

**Example:**
```javascript
// auth/AuthService.js
export default class AuthService {
    constructor(model, storageLocal) {   // 'model' and 'storageLocal' match CDI registrations
        this.qualifier = '@alt-javascript/auth/AuthService';
        this.logger = null;              // CDI injects logger if registered
        this.model = model;
        this.storageLocal = storageLocal;
        this._provider = new AuthProvider({ github: authConfig.github, google: authConfig.google });
    }
}

// config/contexts.js
import AuthService from '../auth/AuthService.js';
// ...
new Singleton(AuthService),  // registered as 'authService' (camelCase class name)
```

### Pattern 2: Vendor Wrapper, Not Reimplementation

**What:** `jsmdma-auth-client.esm.js` already exports an `AuthProvider` class that handles the server-redirect OAuth flow (`GET /auth/:provider` → PKCE params → `window.location.href`). The existing `service/AuthProvider.js` reimplements this. The new `auth/AuthService.js` should wrap the vendor class instead.

**When to use:** Whenever a vendored class already implements the behaviour needed.

**Trade-offs:** Vendor API changes (minor jsmdma updates) require only `AuthService` to adapt, not all call sites. The wrapper adds CDI-awareness and model mutation that the vendor class intentionally omits.

**Example:**
```javascript
import { AuthProvider, ClientAuthSession } from '../vendor/jsmdma-auth-client.esm.js';
import { authConfig } from './auth-config.js';

export default class AuthService {
    constructor(model, storageLocal) {
        this._provider = new AuthProvider({
            apiUrl: this._resolveApiUrl(),
            github: authConfig.github.clientId ? { enabled: true } : undefined,
            google: authConfig.google.clientId ? { enabled: true } : undefined,
        });
        this.model = model;
    }

    async signIn(provider) {
        await this._provider.signIn(provider);
        // vendor AuthProvider redirects; this line is never reached
    }

    signOut() {
        ClientAuthSession.clear();
        localStorage.removeItem('auth_provider');
        this.model.signedin = false;
    }

    getToken()    { return ClientAuthSession.getToken(); }
    isSignedIn()  { return ClientAuthSession.isSignedIn(); }
    getProvider() { return localStorage.getItem('auth_provider'); }
}
```

### Pattern 3: OAuth Callback Extraction (OAuthClient)

**What:** The `?token=` callback handling currently lives in `Application.init()` mixed with preference loading and URL parameter parsing. Extracting it to `OAuthClient.js` makes `Application` smaller and makes the callback logic independently testable.

**When to use:** The extraction makes sense as a pure function — no CDI registration needed. `OAuthClient` is a namespace object, not a singleton.

**Trade-offs:** `Application.js` still needs to call `OAuthClient.handleCallback()` early in `init()`. The coupling is explicit and intentional — Application orchestrates startup order.

**Example:**
```javascript
// auth/OAuthClient.js — pure module, no CDI registration
import { ClientAuthSession } from '../vendor/jsmdma-auth-client.esm.js';

export const OAuthClient = {
    handleCallback() {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        if (!token) return false;
        ClientAuthSession.store(token);
        const provider = params.get('provider') || localStorage.getItem('auth_provider') || 'unknown';
        localStorage.setItem('auth_provider', provider);
        const clean = new URL(window.location.href);
        clean.searchParams.delete('token');
        clean.searchParams.delete('provider');
        window.history.replaceState({}, '', clean.toString());
        return true;
    }
};

// service/Application.js — init() starts with:
import { OAuthClient } from '../auth/OAuthClient.js';
// ...
init() {
    OAuthClient.handleCallback();   // must be first — sets auth state before model init
    // ... rest of init unchanged
}
```

### Pattern 4: Provider Visibility via Config Presence

**What:** A provider button in the auth modal is visible only when its `clientId` is non-empty in `auth-config.js`. This is the existing pattern (used for `getAvailableProviders()`). GitHub and Google will be visible; Apple and Microsoft hidden.

**When to use:** For the `auth.html` fragment — drive visibility from `model.availableProviders` array (populated by `AuthService.getAvailableProviders()` during `Application.init()`).

**Trade-offs:** Avoids hardcoding provider names in the Vue template. Adding a new provider only requires a config entry and an icon in the template.

**Example:**
```javascript
// Application.init() — after AuthService is injected:
this.model.availableProviders = this.authService.getAvailableProviders();
// → ['github', 'google'] when only those two have clientIds set
```

```html
<!-- modals/auth.html — template fragment -->
<button v-if="availableProviders.includes('github')" v-on:click="signInWith('github')">
    <i class="ph ph-github-logo me-2"></i> Sign in with GitHub
</button>
```

---

## Data Flow

### Sign-In Flow (GitHub)

```
User clicks "Sign in with GitHub"
    ↓
vue/methods/auth.js: signInWith('github')
    ↓
AuthService.signIn('github')
    ↓
vendor AuthProvider.signIn('github')
    ↓
GET /auth/github  (server returns { authorizationURL, state, codeVerifier })
    ↓
sessionStorage: oauth_state, oauth_code_verifier stored
    ↓
window.location.href = authorizationURL   (page navigates to GitHub)
    ↓
[GitHub authorises, redirects back to callback URL]
    ↓
GET /auth/github/callback?code=&state=    (server validates, issues JWT)
    ↓
Server redirects browser to app: /?token=<jwt>
    ↓
Application.init() → OAuthClient.handleCallback()
    ↓
ClientAuthSession.store(token)  +  localStorage auth_provider='github'
    ↓
URL cleaned via history.replaceState
    ↓
model.signedin = true  (set by Application.init after OAuthClient returns true)
    ↓
SyncScheduler.markDirty()  (triggered by Vue watcher on model.signedin)
```

### Sign-Out Flow

```
User clicks "Sign out"
    ↓
vue/methods/auth.js: signout()
    ↓
AuthService.signOut()
    ↓
ClientAuthSession.clear()  +  localStorage.removeItem('auth_provider')
    ↓
model.signedin = false
    ↓
StorageLocal.wipe()   (existing behaviour — clears plnr:/rev:/base:/sync: keys)
    ↓
window.location.href = window.location.origin  (hard reload)
```

### Account Linking Flow (adding a second provider)

```
User clicks "Link Google account" in settings flyout
    ↓
vue/methods/auth.js: linkProvider('google')
    ↓
AccountLinker.linkProvider('google')
    ↓
AuthService.signIn('google')   (re-uses same OAuth redirect flow)
    ↓
[Google authorises, server receives callback with existing JWT in session]
    ↓
Server merges identities, reissues JWT with both providers in claims
    ↓
OAuthClient.handleCallback()  (new JWT stored, replaces old)
    ↓
AccountLinker.getLinkedProviders()  → GET /auth/identities
    ↓
model.linkedProviders = ['github', 'google']
```

### API Sync — Auth Header Injection

```
SyncScheduler fires (debounced, on dirty)
    ↓
Api.sync()
    ↓
Api._authHeaders()
    ↓
AuthService.getToken()  →  ClientAuthSession.getToken()
    ↓
{ Authorization: 'Bearer <jwt>' }  injected into POST /year-planner/sync
```

---

## Integration Points

### New Files → CDI

| New File | CDI Registration | Constructor Dependencies |
|----------|-----------------|--------------------------|
| `auth/AuthService.js` | `new Singleton(AuthService)` in contexts.js | `model`, `storageLocal` |
| `auth/AccountLinker.js` | `new Singleton(AccountLinker)` in contexts.js | `model`, `authService` |
| `auth/OAuthClient.js` | None — pure module, not a CDI singleton | None |
| `auth/auth-config.js` | None — plain export, consumed by `AuthService` directly | None |

### Modified Files → What Changes

| File | Change | Why |
|------|--------|-----|
| `config/contexts.js` | `import AuthService from '../auth/AuthService.js'`; replace `new Singleton(AuthProvider)` with `new Singleton(AuthService)`; add `new Singleton(AccountLinker)` | CDI wiring for new singletons |
| `service/Api.js` | Constructor: `authProvider` → `authService` | Renamed CDI-injected dep |
| `service/Application.js` | Add `OAuthClient.handleCallback()` call at top of `init()`; remove direct `ClientAuthSession.store()` logic; add `this.model.availableProviders = this.authService.getAvailableProviders()` | Delegate callback to OAuthClient; expose providers to Vue |
| `vue/model/auth.js` | Add `availableProviders: []` and `linkedProviders: []` | New reactive state |
| `vue/methods/auth.js` | Add `linkProvider(provider)` and `unlinkProvider(provider)` methods | Account linking UI |
| `.compose/fragments/modals/auth.html` | Replace hardcoded buttons with `v-if="availableProviders.includes('github')"` guards; add GitHub button | Dynamic provider visibility |

### Files to Delete

| File | Reason |
|------|--------|
| `service/AuthProvider.js` | Replaced by `auth/AuthService.js` + vendor `AuthProvider` |
| `config/auth-config.js` | Moved to `auth/auth-config.js` |

### jsmdma Vendor Contract

The vendored `jsmdma-auth-client.esm.js` exports:

- `AuthProvider` — handles `GET /auth/:provider` and redirect; stores PKCE params in `sessionStorage`
- `ClientAuthSession` — `store(token)`, `getToken()`, `isSignedIn()`, `getUserUuid()`, `clear()` — all operate on `localStorage.auth_token`
- `DeviceSession` — device UUID via `localStorage.dev`
- `IdentityStore` — linked identity records via `localStorage.ids`
- `PreferencesStore` — per-user preferences via `localStorage.prefs:<uuid>`

The `AuthProvider` in the vendor file is already provider-agnostic — it calls `GET /auth/{provider}` regardless of provider name. Adding GitHub requires only adding `github: {}` to the config passed to `new AuthProvider(config)` and registering the GitHub OAuth app on the server side.

### Server Requirements

The existing jsmdma server must expose:
- `GET /auth/github` — begin GitHub OAuth (return `{ authorizationURL, state, codeVerifier }`)
- `GET /auth/github/callback` — handle code exchange, issue JWT, redirect to app with `?token=`
- `POST /auth/link` — associate second provider identity with existing account (requires Bearer token)
- `DELETE /auth/link` — remove a provider association (requires Bearer token)
- `GET /auth/identities` — list linked providers for current user (requires Bearer token)

---

## Anti-Patterns

### Anti-Pattern 1: Keeping Model Mutation in the Vendor Layer

**What people do:** Pass `model` into `new AuthProvider()` so the vendor class can set `model.signedin = true` directly.
**Why it's wrong:** The vendor `AuthProvider` in `jsmdma-auth-client.esm.js` is intentionally model-free. Coupling it to a Vue model makes it impossible to reuse across apps with different state shapes.
**Do this instead:** `AuthService` owns model mutation. The vendor `AuthProvider` only handles the redirect flow. `AuthService.signIn()` calls the vendor then mutates the model in the callback path (via `OAuthClient.handleCallback()` return value checked in `Application.init()`).

### Anti-Pattern 2: Hardcoding Provider Buttons in auth.html

**What people do:** Write three `<button>` elements for GitHub, Google, Apple — always visible.
**Why it's wrong:** Apple and Microsoft have no configured client IDs. Visible but non-functional buttons erode trust. Each new provider requires an HTML change.
**Do this instead:** Drive visibility from `model.availableProviders` (a string array populated by `AuthService.getAvailableProviders()` during init). Template uses `v-if="availableProviders.includes('github')"`.

### Anti-Pattern 3: Re-registering auth-config as a CDI Singleton

**What people do:** Register `authConfig` as a CDI reference (like `model` or `feature`) so it can be injected.
**Why it's wrong:** Config is a static export, not a service. CDI injection is for services with collaborators. `AuthService` imports `auth-config.js` directly — no indirection needed.
**Do this instead:** `AuthService.js` imports `auth-config.js` as a plain ES module import. No CDI registration.

### Anti-Pattern 4: Storing PKCE State in localStorage

**What people do:** Persist `oauth_state` and `oauth_code_verifier` to `localStorage` so they survive hard refreshes.
**Why it's wrong:** The PKCE flow is a single-page navigation round trip. If the page is hard-refreshed mid-flow the state is invalid anyway. `sessionStorage` (already used by the vendor `AuthProvider`) is the correct scope — it clears on tab close and is not accessible cross-tab.
**Do this instead:** The vendor already uses `sessionStorage` for these. Do not override this behaviour.

### Anti-Pattern 5: Moving AccountLinker Logic into AuthService

**What people do:** Add `linkProvider()`, `unlinkProvider()`, `getLinkedProviders()` methods directly on `AuthService`.
**Why it's wrong:** Auth (who am I, am I signed in) and account management (which identities are linked) are orthogonal concerns. Mixing them makes `AuthService` grow unboundedly as account management features expand.
**Do this instead:** `AccountLinker.js` is a separate CDI singleton that takes `authService` as a constructor dependency. It calls `authService.getToken()` for Bearer headers and makes its own server calls.

---

## Build Order Recommendation

The auth module extraction has strict dependency ordering. Build phases in this sequence:

1. **Phase 1: jsmdma Backend Audit**
   Verify `GET /auth/github` and callback routes exist in the jsmdma server. No client code changes yet. Unblocks Phase 2.

2. **Phase 2: New auth/ files (non-breaking)**
   Create `auth/AuthService.js`, `auth/OAuthClient.js`, `auth/auth-config.js` as new files. Do not yet wire them. Both old and new code coexist. No regression risk.

3. **Phase 3: CDI swap (breaking — single commit)**
   - `contexts.js`: swap `AuthProvider` → `AuthService`; delete `AuthProvider.js` import
   - `Api.js`: rename constructor param `authProvider` → `authService`
   - `Application.js`: add `OAuthClient.handleCallback()` call; remove inline `ClientAuthSession.store()` logic
   - `vue/model/auth.js`: add `availableProviders`, `linkedProviders`
   - `auth.html`: add GitHub button with `v-if` guards; hide Apple/Microsoft
   - Delete `service/AuthProvider.js`
   - Move `config/auth-config.js` → `auth/auth-config.js`; update import in `AuthService`
   All of these must land in one commit because CDI injection will fail if the old `AuthProvider` singleton is missing and `AuthService` is not yet registered.

4. **Phase 4: GitHub OAuth end-to-end test**
   Register GitHub OAuth app, configure callback URL, set `auth-config.js` `github.clientId`. Test full redirect round trip locally.

5. **Phase 5: AccountLinker (additive)**
   Add `auth/AccountLinker.js`, register in `contexts.js`, add `vue/methods/auth.js` methods, add account-linking UI fragment. Completely additive — no existing code modified.

---

## Scaling Considerations

This app has a fixed browser-side architecture — scaling is a server concern. The client-side auth module design is appropriate at any user count. The only client-side consideration:

| Concern | Current approach | Notes |
|---------|-----------------|-------|
| JWT expiry | `ClientAuthSession.getToken()` returns null if expired (idle >3d or hard >7d) | App must handle null token gracefully — `Api.sync()` already skips when `!signedin` |
| Token refresh | No refresh token flow — user must sign in again | Acceptable for a PWA with infrequent server sync |
| Multiple tabs | `localStorage` auth state is shared across tabs — sign-out in one tab affects all | This is the correct behaviour for a security-sensitive session |

---

## Sources

- Live source: `site/js/service/AuthProvider.js` (read 2026-04-14)
- Live source: `site/js/service/Api.js` (read 2026-04-14)
- Live source: `site/js/Application.js` (read 2026-04-14)
- Live source: `site/js/config/contexts.js` (read 2026-04-14)
- Live source: `site/js/config/auth-config.js` (read 2026-04-14)
- Live source: `site/js/vendor/jsmdma-auth-client.esm.js` (read 2026-04-14)
- Live source: `site/js/vue/methods/auth.js` (read 2026-04-14)
- Live source: `site/js/vue/model/auth.js` (read 2026-04-14)
- Live source: `.compose/fragments/modals/auth.html` (read 2026-04-14)
- PROJECT.md milestone context (read 2026-04-14)

---
*Architecture research for: GitHub OAuth & Account Linking, Year Planner v1.5*
*Researched: 2026-04-14*
