# Pitfalls Research

**Domain:** GitHub OAuth & Multi-Provider Account Linking — adding to existing vanilla JS/Vue 3 app with jsmdma sync
**Researched:** 2026-04-14
**Confidence:** HIGH (codebase directly inspected, research verified against official docs and community patterns)

---

## Critical Pitfalls

### Pitfall 1: jsmdma-auth-client.esm.js does not include "github" in KNOWN_PROVIDERS

**What goes wrong:**
The vendored `jsmdma-auth-client.esm.js` has `KNOWN_PROVIDERS = new Set(["google", "apple", "microsoft"])`. The `AuthProvider.getAvailableProviders()` method filters against this set. If GitHub is added to `auth-config.js` without updating the vendor bundle, `getAvailableProviders()` silently drops it — GitHub never appears as a provider option, and `isConfigured()` returns false when only GitHub is configured.

**Why it happens:**
The vendor bundle is a compiled ESM snapshot of the jsmdma auth-client library. Developers add GitHub to the app-level `auth-config.js` without auditing whether the vendored library itself enumerates that provider. The runtime failure is silent (no error, just absent).

**How to avoid:**
Before any other GitHub wiring, inspect `jsmdma-auth-client.esm.js` for `KNOWN_PROVIDERS`. If it excludes `"github"`, either update the vendor bundle from upstream jsmdma or patch the constant in-place. This must be the first task in the backend discovery phase.

**Warning signs:**
- `authProvider.getAvailableProviders()` returns `[]` despite `auth-config.js` having a github entry
- GitHub sign-in button does not render
- No error is thrown — fails silently

**Phase to address:** Backend Discovery and Wiring (Phase 1) — must be verified before any GitHub client flow is attempted.

---

### Pitfall 2: Application.js OAuth callback hard-codes `auth_provider` as "google" on token receipt

**What goes wrong:**
In `Application.js` line 38, the OAuth callback handler does:
```js
localStorage.setItem('auth_provider', localStorage.getItem('auth_provider') || 'google');
```
When GitHub is the provider and no prior `auth_provider` is stored, this defaults to `'google'`. Every GitHub sign-in will be recorded as a Google session. `AuthProvider.getProvider()` returns `'google'` for a GitHub user, breaking any provider-conditional UI or account-linking logic.

**Why it happens:**
The callback handler was written when Google was the only provider. The fallback string was never intended to remain, but it looks like a harmless default.

**How to avoid:**
The server must include the provider name in the callback — either as a `?provider=github` URL param or as a `provider` claim in the JWT itself. The callback handler must read the provider from the server response, not default to a hardcoded string.

**Warning signs:**
- After GitHub sign-in, `localStorage.getItem('auth_provider')` returns `'google'`
- UI shows "signed in with Google" after GitHub flow
- Account linking UI shows wrong linked provider

**Phase to address:** GitHub OAuth Client Flow (Phase 2) — fix before any multi-provider UI is built.

---

### Pitfall 3: State and PKCE stored in sessionStorage breaks on mobile OAuth redirect

**What goes wrong:**
`jsmdma-auth-client.esm.js` stores `oauth_state` and `oauth_code_verifier` in `sessionStorage` before redirecting to GitHub. After GitHub redirects back, `sessionStorage` may be empty on mobile browsers or any browser that treats the OAuth redirect as a new tab context. The PKCE code verifier is missing, token exchange fails, and the user sees a generic error.

**Why it happens:**
`sessionStorage` is tab-scoped. On mobile browsers (particularly Safari on iOS), OAuth redirects often load in a new tab or the original tab loses session state during full-page navigation. GitHub's redirect can also return to a slightly different context, creating a fresh `sessionStorage`.

**How to avoid:**
Store `oauth_state` and `oauth_code_verifier` in `localStorage` (not `sessionStorage`) for the duration of the OAuth handshake only. Delete them immediately after successful token exchange. This is the pattern used in aaronpk's canonical PKCE vanilla JS reference implementation and recommended by Auth0.

**Warning signs:**
- Token exchange fails intermittently, especially on mobile
- `oauth_code_verifier` is `null` when callback fires
- Works on desktop Chrome but fails on Safari/Firefox mobile

**Phase to address:** GitHub OAuth Client Flow (Phase 2) — implement callback handling with localStorage for PKCE state.

---

### Pitfall 4: GitHub OAuth App allows only ONE callback URL — dev and prod cannot share an app registration

**What goes wrong:**
Unlike Google OAuth which supports multiple authorized redirect URIs per client ID, GitHub OAuth Apps only accept a single callback URL in the app registration. Registering the production CloudFront URL blocks localhost development. Registering `http://127.0.0.1:8081/` blocks production. Teams either break prod while testing, or use prod credentials locally — which exposes prod secrets in dev environments.

**Why it happens:**
Developers coming from Google OAuth assume the same flexibility exists. GitHub's restriction is not obvious until you hit the `redirect_uri_mismatch` error.

**How to avoid:**
Register two separate GitHub OAuth App registrations: one for production (CloudFront callback), one for development (`http://127.0.0.1:8081/`). Store the client ID and secret in environment config, not source code. Never commit either secret. Use the same build-time substitution mechanism already in place for `${api.url}` to inject the client configuration.

**Warning signs:**
- `redirect_uri_mismatch` error when testing locally with the prod OAuth app registered
- Developer testing with prod credentials from localhost

**Phase to address:** Backend Discovery and Wiring (Phase 1) — register both apps before writing any code.

---

### Pitfall 5: JWT token delivered in `?token=` query param leaks into browser history and server logs

**What goes wrong:**
The current callback pattern passes the JWT as `?token=JWT_VALUE` in the query string. Although `Application.js` calls `window.history.replaceState` to strip the token, the JWT is already captured in: browser history (before replaceState), server access logs, CloudFront access logs, and Referrer headers if the page makes any outbound request before replaceState runs.

**Why it happens:**
Query params are the simplest server-side callback mechanism for a SPA. The replaceState cleanup is a partial mitigation that does not cover server-side logs or browser history entries already written.

**How to avoid:**
Keep query param delivery for this app's threat model (acceptable for non-financial data), but ensure: (1) `Referrer-Policy: no-referrer` is set as an HTTP header on the page, and (2) the `?token=` replaceState at Application.js line 41 runs BEFORE the canonical URL replaceState at line 83. The current order is correct — verify it is not changed during refactoring. Longer-term, prefer short-lived opaque codes that the SPA exchanges server-side.

**Warning signs:**
- JWT visible in CloudFront access logs
- JWT appears in third-party analytics request logs as a referrer
- replaceState order changes during refactor, leaving token in URL longer

**Phase to address:** GitHub OAuth Client Flow (Phase 2) — verify callback handler order during implementation.

---

### Pitfall 6: Account linking transfers identity but not localStorage planner `meta.userKey` ownership

**What goes wrong:**
Planner documents in localStorage have a `meta.userKey` field set to either a device UUID or the JWT `sub` value. When a user links a GitHub account to an existing Google account, the server merges the two identities into one canonical `sub`. All new syncs use the new `sub`. But existing `plnr:*` entries in localStorage still have the old `meta.userKey`. The sync adapter uses `userKey` to match planners server-side — mismatched `userKey` causes planners to be treated as new/unsynced items, potentially creating duplicate planner entries on the server.

**Why it happens:**
`StorageLocal._migrateUserKey()` only updates `meta.userKey` when `doc.meta.uid` is set and `doc.meta.userKey` is missing. It does not handle the case where `userKey` has changed (old Google sub to new merged sub). Identity linking changes the active `sub` but migration logic has no concept of a changed `sub`.

**How to avoid:**
After successful account linking, run a `userKey` migration pass: read the old `sub` from the current JWT before linking, store it temporarily, then after the server confirms the merge, iterate all `plnr:*` entries in localStorage and update `meta.userKey` to the new `sub`. This must happen before the first sync attempt under the new identity.

**Warning signs:**
- After account linking, sync creates duplicate planners server-side
- Planner list shows duplicate entries after linking
- Server returns 409 conflict or unexpected 201 for planners that previously synced normally

**Phase to address:** Account Linking UI (Phase 4) — must be part of the linking completion handler.

---

### Pitfall 7: Unlinking the last provider silently signs out the user via the 401 sync path

**What goes wrong:**
If the user unlinks their only remaining provider, the server may revoke the associated JWT. The client still has the old JWT in localStorage. The next sync returns 401. `Api.js` handles 401 by calling `authProvider.signOut()` and setting `model.signedin = false`. The user is silently signed out without understanding why.

**Why it happens:**
The 401 handler in Api.js is correct for expired tokens but creates jarring UX when triggered by an intentional provider unlink. There is no distinction between "token expired" and "deliberately unlinked."

**How to avoid:**
Before allowing unlink, verify on the server that the account has at least one remaining provider. Return an error if the user attempts to unlink their last provider. After a successful unlink, issue a new JWT bound to the remaining provider and refresh the client session. Do not rely on the 401 sync path to clean up after an intentional unlink.

**Warning signs:**
- Unlink succeeds but user is signed out within ~30 seconds (next sync scheduler cycle)
- User reports "I unlinked Google and now I'm signed out"
- 401 appears in network tab shortly after an unlink operation

**Phase to address:** Account Linking UI (Phase 4) — enforce last-provider guard on both client and server.

---

### Pitfall 8: `signout()` calls `wipe()` which destroys unsynced local planner data permanently

**What goes wrong:**
`signout()` in `site/js/vue/methods/auth.js` calls `this.storageLocal.wipe()`, which deletes all `plnr:*`, `rev:*`, `base:*`, `sync:*`, and `prefs:*` keys from localStorage. If the user signs out before any planners have synced (e.g., offline-only usage, or sync has been failing silently), all local planner data is destroyed permanently. This directly violates the app's core value of "without data loss."

**Why it happens:**
The wipe was designed for a "clean slate on sign-out" model. It assumes synced data is safe on the server.

**How to avoid:**
Before wipe, check whether each planner has ever successfully synced (`sync:{uuid}` value differs from `HLC_ZERO`). If any planner has never synced, warn the user with a confirmation dialog. Strongly consider not wiping local data on sign-out at all — instead only clear auth credentials (`ClientAuthSession.clear()` plus `auth_provider`). Reserve wipe for an explicit "delete my account data" action.

**Warning signs:**
- User signs out, signs back in, all planners are gone
- SyncScheduler was not yet triggered before sign-out
- User with offline-only data (never signed in before) triggers sign-out after receiving the pester modal

**Phase to address:** Auth Module Extraction (Phase 3) — revisit wipe semantics when extracting the auth module to ensure sign-out is non-destructive.

---

### Pitfall 9: jsmdma backend GitHub OAuth route may not exist or may not be wired

**What goes wrong:**
The frontend `AuthProvider` calls `fetch(\`${apiUrl}auth/${provider}\`)` which for GitHub becomes `GET /auth/github`. The jsmdma backend may not have this route implemented, or it may exist as code but not be registered in the Express router or run-server configuration. The frontend gets a 404 or 500 with no meaningful error to the user.

**Why it happens:**
jsmdma is an external dependency that "should have" GitHub support, but this has not been verified against the actual running server. Assumptions about what the backend supports are common when the backend is not owned by the same developer.

**How to avoid:**
Phase 1 must include a dedicated jsmdma backend audit: (1) check whether `GET /auth/github` exists in the router, (2) check whether the GitHub OAuth middleware is registered, (3) check whether the run-server config has the GitHub client ID/secret environment variables, (4) test the route directly with curl before writing any frontend code. Document findings and wire any missing pieces before frontend work begins.

**Warning signs:**
- `GET /auth/github` returns 404 in network tab
- Server logs show route not found
- Only Google auth routes appear in jsmdma source

**Phase to address:** Backend Discovery and Wiring (Phase 1) — this is the entire point of Phase 1.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcoded Google client ID in `auth-config.js` | Works immediately | Committed to source, rotation requires code commit, blocks multi-provider generalisation | Never for prod — move to build-time substitution consistent with `${api.url}` pattern |
| `KNOWN_PROVIDERS` in vendor bundle without "github" | jsmdma ships as-is | Silent provider exclusion, must re-vendor on every new provider addition | Never — patch vendor or update from upstream jsmdma |
| `?token=` query param JWT delivery | Simple server-side implementation | Token in server logs and browser history even with replaceState | Acceptable for non-financial, non-PII app if replaceState fires synchronously before any outbound requests and Referrer-Policy is set |
| Single `auth_provider` string in localStorage | Simple read/write | Breaks when user has multiple providers linked simultaneously | Never once multi-provider is live — needs to become provider list |
| `wipe()` on sign-out deletes all planner data | Clean slate behaviour | Destroys data if sync has never run — violates offline-first core value | Never — should only wipe on explicit account delete with confirmation |
| `sessionStorage` for PKCE state/code_verifier | Tab-scoped isolation | Breaks on mobile OAuth redirect where tab context is lost | Never — use `localStorage` with cleanup on exchange |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| GitHub OAuth App registration | Register one app for both prod and dev | Register two separate apps; different callback URLs per environment |
| GitHub OAuth App vs GitHub App | Assume GitHub App is required for OAuth sign-in | Use GitHub OAuth App for user-auth-only; GitHub Apps add unnecessary complexity (non-standard flow) |
| jsmdma backend `/auth/github` route | Assume it exists because Google works | Audit jsmdma server source for `auth/github` route and middleware registration before writing frontend |
| PKCE code_verifier storage | Store in `sessionStorage` | Store in `localStorage`, delete immediately after token exchange |
| JWT `sub` claim across providers | Assume `sub` is stable across providers | GitHub `sub` is a numeric user ID, Google's is a different format; server must normalise to a single internal UUID |
| `auth_provider` localStorage key | Store as single string | Will need to become a list/set when multi-provider linking is live |
| CloudFront callback URL for local dev | Test GitHub OAuth with prod CloudFront callback | Test with separate dev OAuth App pointing to `http://127.0.0.1:8081/` |
| GitHub user email scope | Assume `read:user` returns email | GitHub primary email is private by default; request `user:email` scope separately |
| Account linking — email auto-match | Auto-link accounts with matching email across providers | Never auto-link on email match alone; require authentication of both accounts before linking (pre-account-takeover attack vector) |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| JWT in `?token=` query param without `Referrer-Policy` header | Token leaks to third-party analytics or CDN in Referer header | Add `Referrer-Policy: no-referrer` HTTP response header; ensure replaceState fires before any outbound requests in Application.init() |
| Storing JWT in `localStorage` | XSS can exfiltrate token | Acceptable tradeoff for offline-first app; mitigate with short JWT TTL (current 7-day hard TTL is reasonable), Content Security Policy, no inline scripts |
| `oauth_state` not validated on callback | CSRF attack: attacker forces arbitrary OAuth exchange | Server must validate `state` matches what it issued; client should also verify stored state matches URL param on return |
| Auto-linking accounts by email match alone | Pre-account-takeover: attacker registers GitHub account with victim email, links to victim's account | Require active authentication of both accounts before linking; never link on unverified email match |
| Google client ID committed to source | Client ID visible in repo; rotation requires code commit | Move to build-time env substitution using the existing `${api.url}` m4 pattern in `auth-config.js` |
| Using implicit grant flow (currently not used, but temptation exists) | Token in URL fragment, accessible via `window.location.hash` to any JS on page | Always use authorization code flow with PKCE; never use implicit grant for new implementations |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Sign-in modal closes immediately on provider click, then redirect navigates away with no loading indicator | User thinks sign-in failed; clicks again; double-redirect | Show "Redirecting to GitHub..." state; disable the button; keep modal open or replace with interstitial |
| After OAuth redirect returns, page fully reloads — Vue state and any open modal context is lost | User's context before sign-in is wiped | Design return-from-OAuth as graceful Application.init() re-bootstrap; Application.js already handles this but no "you are now signed in" confirmation is shown |
| "Link another account" requires redirect without warning | User is surprised by navigating away | Clearly inform: "You will be redirected to GitHub to confirm the link" before initiating the flow |
| Unlink confirmation does not explain data consequences | User fears their planner data will be deleted when they unlink | Confirm: "Your planner data is safe. Only this sign-in method is removed." |
| Sign-out with unsynced planners silently destroys data | Data loss with no warning | Pre-sign-out check: warn if any planner has `sync:{uuid} === HLC_ZERO` (never synced) |
| GitHub user's email may be null/private | Downstream profile or account page shows blank email | Request `user:email` scope; handle null email gracefully in UI |

---

## "Looks Done But Isn't" Checklist

- [ ] **KNOWN_PROVIDERS in vendor bundle:** Contains `"github"` — verify `authProvider.getAvailableProviders()` returns `['github']` in browser console before any UI is built
- [ ] **GitHub OAuth App registered:** Two separate registrations exist (prod + dev) with correct callback URLs — verify both before writing frontend code
- [ ] **Backend route exists:** `GET /auth/github` returns 200 and `{ authorizationURL, state, codeVerifier }` — verify with curl before frontend integration
- [ ] **Provider detection on callback:** `localStorage.auth_provider` is `'github'` after GitHub sign-in — verify it does not fall back to the hardcoded `'google'` value
- [ ] **PKCE on mobile:** OAuth flow completes on Safari iOS — verify sessionStorage is not the cause of intermittent callback failures
- [ ] **State validation:** `oauth_state` from URL is validated against stored value — verify 400/error response if state is tampered
- [ ] **Account linking userKey migration:** All `plnr:*` entries have updated `meta.userKey` after linking — verify sync does not create duplicates post-link
- [ ] **Last-provider unlink blocked:** Attempting to unlink the only provider returns an error and does not sign the user out silently
- [ ] **Sign-out data safety:** Signing out with unsynced planners shows a confirmation — verify `wipe()` is not called without user acknowledgment when `sync:{uuid} === HLC_ZERO`
- [ ] **Auth module extraction:** Extracted `site/js/auth/` module has no year-planner-specific references — verify it could be dropped into a sibling app as-is
- [ ] **Token URL cleanup order:** `?token=` replaceState (Application.js line 41) fires before canonical URL replaceState (line 83) — verify order is preserved after any refactor

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| KNOWN_PROVIDERS missing "github" in vendor bundle | LOW | One-line patch to vendor bundle constant; or update from upstream jsmdma and re-vendor |
| Wrong `auth_provider` stored as "google" for GitHub users | LOW | Clear `auth_provider` from localStorage; re-sign-in; fix callback handler to read provider from server |
| PKCE state lost due to sessionStorage | LOW | Switch state/verifier storage to localStorage; add cleanup after token exchange |
| Duplicate planners from userKey mismatch after linking | HIGH | Write a migration that deduplicates server-side planner records; requires backend coordination to identify and merge |
| User data lost from premature wipe on sign-out | HIGH | Data unrecoverable client-side if not synced; server may have a copy if any sync occurred; prevent with confirmation gate |
| GitHub OAuth App callback URL mismatch | LOW | Update GitHub App settings in GitHub Developer Settings UI (immediate, no deploy required) |
| Last-provider unlink causes silent sign-out via 401 | MEDIUM | Reissue JWT on server after unlink; update 401 handler to prompt re-auth rather than silent sign-out |
| jsmdma backend missing GitHub route | MEDIUM | Wire the route in jsmdma server; update run-server config with GitHub credentials; re-test end-to-end |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| KNOWN_PROVIDERS missing "github" in vendor | Phase 1: Backend Discovery | `authProvider.getAvailableProviders()` returns `['github']` |
| jsmdma backend GitHub route missing or unwired | Phase 1: Backend Discovery | `curl http://127.0.0.1:8081/auth/github` returns 200 with authorizationURL |
| Single GitHub OAuth App (no dev/prod split) | Phase 1: Backend Discovery | Two separate GitHub App registrations confirmed in GitHub Developer Settings |
| `auth_provider` defaults to "google" on callback | Phase 2: GitHub OAuth Client Flow | After GitHub sign-in, `localStorage.auth_provider === 'github'` |
| sessionStorage PKCE state lost on redirect | Phase 2: GitHub OAuth Client Flow | E2E OAuth flow passes on Safari mobile or simulated mobile context |
| JWT in query param / referrer leakage | Phase 2: GitHub OAuth Client Flow | No token visible in server logs; Referrer-Policy header present; replaceState order correct |
| wipe() destroys unsynced data on sign-out | Phase 3: Auth Module Extraction | Sign-out with unsynced planner shows confirmation dialog; planner data preserved after cancel |
| Google client ID hardcoded in source | Phase 3: Auth Module Extraction | `auth-config.js` uses build-time substitution; no client IDs in committed source |
| userKey mismatch after account linking | Phase 4: Account Linking UI | Post-link sync does not create duplicate planners; `meta.userKey` matches new sub in all `plnr:*` |
| Last-provider unlink causes silent sign-out | Phase 4: Account Linking UI | Unlink of last provider returns error; 401 handler shows re-auth prompt, not silent sign-out |
| GitHub user email may be null/private | Phase 2: GitHub OAuth Client Flow | Profile and account UI handles null email gracefully |

---

## Sources

- GitHub Docs: [Authorizing OAuth apps](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps) — HIGH confidence
- GitHub Docs: [Differences between GitHub Apps and OAuth apps](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/differences-between-github-apps-and-oauth-apps) — HIGH confidence
- Auth0 Docs: [Token Storage](https://auth0.com/docs/secure/security-guidance/data-security/token-storage) — HIGH confidence
- Auth0 Docs: [User Account Linking](https://auth0.com/docs/manage-users/user-accounts/user-account-linking) — HIGH confidence
- WorkOS Blog: [Lessons in safe identity linking](https://workos.com/blog/lessons-in-safe-identity-linking) — MEDIUM confidence
- Auth0 Blog: [Demystifying OAuth Security: State vs. Nonce vs. PKCE](https://auth0.com/blog/demystifying-oauth-security-state-vs-nonce-vs-pkce/) — HIGH confidence
- Pragmatic Web Security: [Why avoiding LocalStorage for tokens is the wrong solution](https://pragmaticwebsecurity.com/articles/oauthoidc/localstorage-xss.html) — MEDIUM confidence
- IETF RFC 9700: OAuth 2.0 Security Best Current Practice (January 2025) — HIGH confidence
- PortSwigger Web Security Academy: [OAuth 2.0 authentication vulnerabilities](https://portswigger.net/web-security/oauth) — HIGH confidence
- aaronpk/pkce-vanilla-js: [PKCE flow in plain JavaScript](https://github.com/aaronpk/pkce-vanilla-js) — HIGH confidence
- Firebase Docs: [Link Multiple Auth Providers](https://firebase.google.com/docs/auth/web/account-linking) — HIGH confidence
- Curity: [SPA Best Practices](https://curity.io/resources/learn/spa-best-practices/) — HIGH confidence
- OAuth Redirect URI Setup: [Avoiding redirect_uri_mismatch errors in 2025](https://www.automaticbacklinks.com/blog/oauth-redirect-uri-setup-avoiding-redirect_uri_mismatch-errors-in-2025-4320/) — MEDIUM confidence
- Codebase inspection: `site/js/vendor/jsmdma-auth-client.esm.js`, `site/js/Application.js`, `site/js/service/AuthProvider.js`, `site/js/service/StorageLocal.js`, `site/js/vue/methods/auth.js` (2026-04-14) — HIGH confidence

---
*Pitfalls research for: GitHub OAuth & Multi-Provider Account Linking in Year Planner (v1.5)*
*Researched: 2026-04-14*
