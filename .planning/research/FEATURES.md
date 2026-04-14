# Feature Research: GitHub OAuth & Account Linking

**Domain:** Multi-provider federated auth with account linking for a vanilla-JS offline-first PWA
**Researched:** 2026-04-14
**Confidence:** HIGH (GitHub official docs, Auth0 docs, Supabase docs, Firebase docs, verified cross-source)

---

## Context

This is a subsequent milestone (v1.5) for an app that already has Google OAuth wired via AuthProvider.js with Bearer token integration to jsmdma sync backend. The new work adds:

1. GitHub OAuth as a real sign-in path (currently only Google is configured)
2. An extracted, app-agnostic `site/js/auth/` module shared across sibling apps
3. Account linking UI — connect a second provider, transfer identity, unlink a provider
4. Apple/Microsoft stubs hidden until client IDs are registered

The app is a vanilla ES modules + Vue 3 Options API SPA with no bundler, CDN-only deps, and a CDI wiring pattern for all services. The auth callback must be handled at a page that GitHub can redirect to (redirect_uri), and token exchange requires a backend because GitHub's OAuth token endpoint does not support CORS for browser-direct requests and still requires the client_secret.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that must exist for the milestone to be complete. Missing any of these = the feature set is broken or the UX is unacceptable.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| GitHub OAuth authorization redirect | Entry point to GitHub sign-in; users click "Sign in with GitHub" and are sent to `github.com/login/oauth/authorize` with `client_id`, `redirect_uri`, `scope=user:email`, and a CSRF `state` nonce | LOW | Vanilla `window.location.assign()` — no library needed; state nonce must be saved to sessionStorage before redirect |
| OAuth callback handler page | After authorization, GitHub redirects to `redirect_uri?code=…&state=…`; a callback page or route must capture the code and state, verify state matches, then call the backend to exchange for a token | MEDIUM | The app has no router. Callback must either be a separate HTML page or the index.html must detect `?code=` in the URL on load. Separate callback page is cleaner and avoids polluting main.js startup. |
| Backend code-for-token exchange | GitHub's token endpoint (`POST https://github.com/login/oauth/access_token`) requires the `client_secret` and does NOT support CORS — the browser cannot call it directly. Backend proxy endpoint is mandatory. | MEDIUM | jsmdma backend must expose a `/auth/github/callback` endpoint (or equivalent) that accepts the `code` and exchanges it server-side, returning a session token to the client. This is the highest-risk assumption in the milestone — must be audited first. |
| Fetch GitHub user identity | After token exchange, call `GET https://api.github.com/user` with `Authorization: Bearer <token>` to retrieve `login`, `id`, `email`, `avatar_url` | LOW | GitHub tokens do not expire by default (unless token expiry is enabled on the OAuth app). `user:email` scope needed for email; email may be null if user has no public email — must handle `GET /user/emails` fallback. |
| Store auth state in localStorage | User expects to remain signed in across page refreshes; auth token and provider identity stored in `tok` and `dev` keys (existing schema from M009) | LOW | Already established pattern from Google OAuth. GitHub token storage follows the same path. |
| Sign-out / revoke session | User must be able to sign out; local tokens cleared, optional server-side session revocation | LOW | Already exists for Google; GitHub follows same UX. GitHub token revocation via `DELETE /applications/{client_id}/token` is optional (backend concern). |
| Auth module API surface stabilised | All auth operations (signIn, signOut, getUser, linkProvider, unlinkProvider) must be accessible via a stable module interface before wiring account linking | MEDIUM | This is the extraction task — moving Google auth + adding GitHub auth into `site/js/auth/` with a provider-agnostic interface. CDI registration must be updated in `contexts.js`. |
| CSRF state parameter validation | The `state` parameter sent to GitHub must be verified to match on return; missing this = open redirect / session fixation vulnerability | LOW | Generate `crypto.getRandomValues()` nonce, save to `sessionStorage`, verify on callback. This is non-negotiable security. |
| "Connected accounts" settings UI | Users with multiple providers must be able to see which providers are linked and take action (link / unlink) | MEDIUM | Typically a list in account settings showing each provider (Google, GitHub) with a status badge (Connected / Not connected) and a Link/Unlink button per row. |
| Link second provider flow | An already signed-in user initiates a new OAuth flow for a different provider; on completion the backend merges the two identities into one account | HIGH | Requires: (1) detecting that an OAuth callback is for linking not for fresh login, (2) backend to merge identities, (3) re-authentication of the primary account before merge is accepted. This is the most complex feature in the milestone. |
| Unlink provider guard (last-provider block) | A user must not be able to unlink their only remaining provider — doing so locks them out of their account | LOW | UI: disable or hide the Unlink button when only one provider is linked. Backend: enforce server-side as well. Standard pattern from Supabase, Firebase, Auth0. |
| Provider already-linked detection | If a GitHub account is already linked to a different user account, the backend must detect the conflict and respond with a clear error — not silently create a duplicate account | MEDIUM | This is a backend concern primarily, but the client must handle the error state and surface a meaningful message. |

### Differentiators (Competitive Advantage)

Features that go beyond table stakes and improve UX or robustness, but are not strictly required for a working v1.5.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Popup-based OAuth flow (vs full-page redirect) | User stays on the current planner view; auth happens in a small popup window; no loss of scroll position or unsaved UI state | MEDIUM | Popup opens `github.com/login/oauth/authorize`; callback page uses `window.postMessage()` to return the code to the parent; parent completes exchange. Popup must be opened synchronously from a click handler to avoid popup blockers. The existing Google flow uses redirect — diverging flows adds complexity. |
| Automatic email-match linking suggestion | If a user signs in with GitHub and the backend detects that their GitHub email already matches an existing Google account, prompt to link rather than creating a new account | HIGH | Industry-standard pattern (Supabase, Auth0 both do this). Requires backend to check email before creating a new user. Adds a "Detected existing account — link them?" confirmation step. |
| Auth module as a published shared lib | `site/js/auth/` designed to work as a drop-in across sibling apps without copy-paste; consistent interface across providers | LOW (once extracted) | The extraction is table stakes for this milestone; publishing it as a separate package is a future differentiator. Low cost once the interface is stable. |
| Provider icon + username in auth UI | Showing the GitHub avatar and `@username` in the sign-in button state / account dropdown feels premium vs a plain "Signed in" label | LOW | GitHub user API returns `login` and `avatar_url`. Google already returns name and picture. Consistent display across providers. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Browser-direct token exchange (no backend) | Simpler setup, no backend change | GitHub's token endpoint has no CORS support; client_secret cannot be embedded in browser JS (security violation). Attempting this breaks in all browsers. | Mandatory backend proxy. Audit jsmdma for `/auth/github/callback` first. |
| Silent auto-linking on email match (no confirmation) | Reduces friction | Allows account takeover: attacker registers GitHub with victim's email, gets silently merged into victim's account. Firebase, Auth0, and Supabase all require explicit confirmation or re-authentication. | Show a "Link accounts?" confirmation dialog; require the user to authenticate both providers before merging. |
| Storing client_secret in frontend code or env vars committed to repo | Convenient for local dev | GitHub client_secret grants full OAuth app permissions; leaked = all users compromised. Even in a private repo. | Store in backend environment only (e.g., jsmdma server `.env`). Never in frontend. |
| Implementing GitHub Device Flow instead of Web Flow | "Simpler" for SPAs (no redirect needed) | Device flow is designed for headless/TV devices with no browser. For a browser SPA it produces worse UX (shows a code users must type at github.com/device) and is not the standard web sign-in pattern. | Web Authorization Code Flow with PKCE + backend exchange. |
| Rolling custom session management from scratch | Full control | Sessions are a solved problem; custom implementations typically miss token rotation, clock skew, expiry edge cases. jsmdma already issues and validates Bearer tokens — extend that system. | Reuse jsmdma's existing Bearer token pattern. |
| Wiring Apple/Microsoft OAuth fully in this milestone | "While we're here" | Apple OAuth requires a paid Apple Developer account and a backend secret-key JWT signing flow (more complex than GitHub/Google). Microsoft requires Azure app registration with tenant configuration. Both are separate non-trivial efforts. | Hide the buttons in this milestone (CSS or v-if). Stub them with a "Coming soon" tooltip. Wire only when client IDs are registered. |

---

## Feature Dependencies

```
GitHub OAuth App registered (client_id + client_secret)
    └──required for──> GitHub authorization redirect
    └──required for──> Backend code-for-token exchange endpoint

Backend /auth/github/callback endpoint (jsmdma audit + wire)
    └──required for──> All GitHub sign-in flows (redirect or popup)
    └──required for──> Link second provider (backend must merge identities)

Auth module extraction (site/js/auth/)
    └──required for──> Consistent Google + GitHub interface in app
    └──required for──> Account linking UI (must call auth.linkProvider())
    └──required for──> CDI rewiring (contexts.js)

CSRF state nonce
    └──required for──> Authorization redirect (must be set before redirect)
    └──required for──> Callback handler (must be verified before proceeding)

Primary provider sign-in working end-to-end
    └──required for──> Link second provider (user must be authenticated first)

Link second provider
    └──required for──> Unlink provider (can only unlink if 2+ providers linked)
    └──required for──> Unlink guard enforcement (requires knowing provider count)

"Connected accounts" settings UI
    └──requires──> Auth module extraction (needs stable getLinkedProviders() API)
    └──requires──> Link + Unlink flows (UI invokes these)
```

### Dependency Notes

- **Backend audit is the critical path**: If jsmdma does not support GitHub OAuth token exchange (or a generic `/auth/callback` endpoint), this must be wired before any client-side GitHub flow can be tested. This is the highest-risk unknown and should be the first task in the milestone.
- **Auth module extraction unlocks everything downstream**: The account linking UI cannot be built cleanly until the module has a stable `linkProvider()` / `unlinkProvider()` / `getLinkedProviders()` API. Plan extraction before building the settings UI.
- **Linking requires auth for both accounts**: Per Auth0, Firebase, and Supabase: the backend must verify the user is authenticated to the primary account AND has freshly authenticated to the secondary provider before merging. This is a security invariant, not optional UX polish.
- **Unlink guard blocks loss of access**: Enforce in both UI (disable the button) and backend (reject the request). UI-only enforcement is insufficient — a direct API call could still remove the last provider.

---

## MVP Definition

### Launch With (v1.5 scope)

These are necessary and sufficient for the milestone as described in PROJECT.md.

- [ ] jsmdma backend audited and wired for GitHub OAuth token exchange
- [ ] GitHub OAuth App registered with correct `redirect_uri` for localhost and production
- [ ] Authorization redirect with CSRF state nonce (client-side)
- [ ] Callback handler page (captures code, verifies state, calls backend)
- [ ] GitHub user identity fetched and stored in localStorage (`tok`, `dev`)
- [ ] Auth module extracted to `site/js/auth/` with provider-agnostic API
- [ ] Google OAuth migrated into `site/js/auth/` alongside GitHub
- [ ] "Connected accounts" settings UI (list of providers, link/unlink buttons)
- [ ] Link second provider flow (OAuth callback detected as linking, backend merge)
- [ ] Unlink provider with last-provider guard
- [ ] Apple/Microsoft buttons hidden (not removed — stubbed for future wiring)

### Add After Validation (v1.5.x)

- [ ] Popup-based OAuth flow — add only if redirect-based UX proves disruptive
- [ ] Email-match auto-link suggestion — add when multiple users report duplicate accounts
- [ ] Provider avatar/username in auth UI — low effort, improve after core flows stable

### Future Consideration (v2+)

- [ ] Apple OAuth full implementation — requires paid Apple Developer account + backend JWT signing
- [ ] Microsoft OAuth full implementation — requires Azure app registration
- [ ] Auth module published as npm package — once interface stable across 2+ sibling apps

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Backend audit + wire GitHub token exchange | HIGH (blocker) | MEDIUM (unknown — must audit) | P1 |
| GitHub authorization redirect + CSRF nonce | HIGH | LOW | P1 |
| OAuth callback handler | HIGH | MEDIUM | P1 |
| Auth module extraction (`site/js/auth/`) | HIGH (enables all downstream) | MEDIUM | P1 |
| Google OAuth migrated into auth module | HIGH (consistency) | LOW (move + rewire CDI) | P1 |
| Connected accounts settings UI | HIGH | MEDIUM | P1 |
| Link second provider | HIGH | HIGH | P1 |
| Unlink provider + guard | HIGH | LOW | P1 |
| Apple/Microsoft button hiding | MEDIUM (UX cleanliness) | LOW | P1 |
| Popup OAuth flow | MEDIUM (UX polish) | MEDIUM | P2 |
| Email-match link suggestion | MEDIUM (friction reduction) | HIGH | P3 |
| Provider avatar in auth UI | LOW | LOW | P2 |
| Auth module as published package | LOW (future) | MEDIUM | P3 |

**Priority key:**
- P1: Must have for v1.5 milestone
- P2: Should have — add in v1.5.x once core stable
- P3: Nice to have — future consideration

---

## Account Linking & Unlinking UX — Standard Patterns

Based on Auth0, Firebase, Supabase, and Google Identity Platform documentation:

### Link Flow

1. User is signed in (Google). Opens Settings → "Connected Accounts".
2. Sees a list: "Google — Connected", "GitHub — Not connected".
3. Clicks "Connect GitHub".
4. App initiates GitHub OAuth flow (with a `linking=true` flag in the `state` parameter so the callback knows this is linking, not fresh login).
5. GitHub redirects back; callback detects `linking=true` in verified state.
6. Backend receives code + primary user's session token; exchanges code, fetches GitHub identity, merges into primary account.
7. Returns to settings page with "GitHub — Connected" status updated.

### Unlink Flow

1. User opens Settings → "Connected Accounts".
2. Sees: "Google — Connected [Disconnect]", "GitHub — Connected [Disconnect]".
3. Clicks "Disconnect GitHub".
4. Confirmation dialog: "Are you sure? You will no longer be able to sign in with GitHub."
5. Backend removes the GitHub identity from the user's account.
6. If this would remove the last provider: the Disconnect button is disabled (greyed out) with tooltip "This is your only sign-in method — add another before removing."

### Key UX Rules (from industry standards)

- **Never allow removal of the last identity**: Enforce in UI and backend. A user without any identity cannot recover their account.
- **Re-authentication before merge**: The linking callback should confirm the user is still authenticated to the primary account (i.e., the session is valid) before the backend merges.
- **Conflict detection**: If the GitHub account is already linked to a different user, surface an explicit error — do not silently reassign it.
- **Primary vs secondary**: When merging, one identity becomes the primary user record. The app should decide which to prefer (e.g., the older account, or the one with more planner data). Only the primary account's profile metadata is retained unless explicitly merged.
- **Data preservation during transfer**: Before merging, the backend should confirm the planner data linked to any secondary account UUID will be migrated or the user will be warned of potential data loss.

---

## Sources

- GitHub OAuth Apps — Authorizing OAuth Apps: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
- GitHub Changelog — PKCE support for OAuth (July 2025): https://github.blog/changelog/2025-07-14-pkce-support-for-oauth-and-github-app-authentication/
- Auth0 — User Account Linking: https://auth0.com/docs/manage-users/user-accounts/user-account-linking
- Supabase — Identity Linking: https://supabase.com/docs/guides/auth/auth-identity-linking
- Firebase — Link Multiple Auth Providers (JS): https://firebase.google.com/docs/auth/web/account-linking
- Google Cloud — Linking multiple providers: https://cloud.google.com/identity-platform/docs/link-accounts
- DEV.to — OAuth Popup implementation: https://dev.to/dinkydani21/how-we-use-a-popup-for-google-and-outlook-oauth-oci
- Auth0 Blog — Redirect vs Popup Mode: https://auth0.com/blog/getting-started-with-lock-episode-3-redirect-vs-popup-mode/

---
*Feature research for: GitHub OAuth & Account Linking — year-planner PWA v1.5*
*Researched: 2026-04-14*
