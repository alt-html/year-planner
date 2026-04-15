---
phase: 18-auth-module-extraction
plan: "01"
subsystem: auth
tags: [auth, oauth, sign-out, data-preservation, module-extraction]
dependency_graph:
  requires: []
  provides: [site/js/auth/AuthService.js, site/js/auth/OAuthClient.js, site/js/auth/auth-config.js]
  affects: [site/js/vue/methods/auth.js, .tests/e2e/signout-wipe.spec.js]
tech_stack:
  added: []
  patterns: [CDI singleton facade, stateless OAuth redirect initiator, uniform provider abstraction]
key_files:
  created:
    - site/js/auth/auth-config.js
    - site/js/auth/OAuthClient.js
    - site/js/auth/AuthService.js
  modified:
    - site/js/vue/methods/auth.js
    - .tests/e2e/signout-wipe.spec.js
decisions:
  - AuthService preserves qualifier '@alt-html/year-planner/AuthProvider' for CDI compat (Pitfall 1)
  - OAuthClient uses uniform signIn(provider) — no switch; both Google and GitHub handled identically
  - Apple/Microsoft methods dropped entirely (deferred to PRV-01/PRV-02)
  - AuthService takes model only (not storageLocal) — wipe() removed so storageLocal dep gone
metrics:
  duration: ~37 minutes
  completed: "2026-04-15"
  tasks_completed: 2
  files_modified: 2
  files_created: 3
---

# Phase 18 Plan 01: Auth Module Extraction Summary

**One-liner:** Fixed data-destructive sign-out bug (wipe() removal) and extracted app-agnostic auth module to site/js/auth/ with AuthService, OAuthClient, and auth-config — Google and GitHub both use uniform OAuthClient.signIn(provider).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix sign-out data preservation (AUT-03) and rewrite E2E test | 619c307 | site/js/vue/methods/auth.js, .tests/e2e/signout-wipe.spec.js |
| 2 | Create site/js/auth/ module (AUT-01, AUT-02) | 74ecbfe | site/js/auth/auth-config.js, site/js/auth/OAuthClient.js, site/js/auth/AuthService.js |

## What Was Built

### Task 1 — Sign-out bug fix (AUT-03)

Removed `this.storageLocal.wipe()` from `signout()` in `site/js/vue/methods/auth.js`. The `wipe()` call was destroying all planner data (plnr:*, rev:*, base:*, sync:*, prefs:*, ids, anon_uid) on every sign-out — violating the offline-first contract. `authProvider.signOut()` already clears auth credentials via `ClientAuthSession.clear()`.

Rewrote `.tests/e2e/signout-wipe.spec.js` to assert the correct post-fix behaviour:
- Auth keys gone: `auth_token`, `auth_provider`, `auth_time`
- OAuth transient keys gone: `oauth_intended_provider`, `oauth_state`, `oauth_code_verifier`
- Planner data survives: `plnr:abc-123`, `rev:abc-123`, `base:abc-123`, `sync:abc-123`
- Prefs survive: `prefs:12345`
- Identity survives: `ids`, `anon_uid`, `dev`
- Uses `page.waitForFunction()` (not `page.waitForURL`) — no navigation after wipe() removal

### Task 2 — site/js/auth/ module (AUT-01, AUT-02)

Three new files created in `site/js/auth/`:

**auth-config.js** — Provider configuration object (copied from config/auth-config.js). No app-specific code. Google and GitHub client IDs configured; Apple and Microsoft empty (deferred).

**OAuthClient.js** — Stateless BFF redirect initiator. `signIn(provider)` fetches `{apiUrl}auth/{provider}`, stores `oauth_intended_provider`, then redirects to `authorizationURL`. Works for any provider uniformly. No model, no CDI, no Apple SDK, no Microsoft MSAL.

**AuthService.js** — CDI singleton facade replacing AuthProvider.js (not yet wired — Plan 02 does the swap). Key details:
- Preserves `qualifier = '@alt-html/year-planner/AuthProvider'` for CDI compatibility
- `constructor(model)` — storageLocal dependency dropped (wipe() is gone)
- `getAvailableProviders()` uses `Object.entries(authConfig).filter(([, v]) => v.clientId)` — uniform across all providers
- `signIn(provider)` delegates to `this._oauthClient().signIn(provider)` — no switch statement
- `signOut()` calls `ClientAuthSession.clear()` + removes all OAuth transient keys + sets `model.signedin = false`
- `_oauthClient()` lazy-creates OAuthClient with resolved API URL
- Dead code dropped: `_signInApple`, `_signInMicrosoft`, `_loadSDK`, `_storeAuth`, `_sdkLoaded`

Existing `site/js/service/AuthProvider.js` and `site/js/config/auth-config.js` are untouched — CDI swap happens in Plan 02 (AUT-04).

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Preserve CDI qualifier in AuthService | Plan 02 swaps AuthProvider → AuthService in contexts.js; keeping same qualifier means no CDI key changes |
| Drop storageLocal from AuthService constructor | wipe() is removed; only remaining dependency was for wipe() |
| No switch in signIn() | OAuthClient handles all BFF providers uniformly; switch was only needed because Apple/Microsoft had different flows |
| Apple/Microsoft dropped entirely | Client IDs empty; no BFF routes; deferred to PRV-01/PRV-02 per plan |

## Verification Results

- `npx playwright test e2e/signout-wipe.spec.js` — 1 passed
- `npx playwright test smoke/` — 20 passed, 0 failed

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — AuthService.js, OAuthClient.js, and auth-config.js are fully implemented. No placeholder data flows to UI from these files (CDI wiring happens in Plan 02).

## Threat Surface Scan

T-18-01 mitigated: `signOut()` in AuthService.js calls `ClientAuthSession.clear()` and removes `oauth_intended_provider`, `oauth_state`, `oauth_code_verifier`. E2E test verifies all auth keys gone after sign-out.

T-18-02 mitigated: `wipe()` removed from `signout()` in vue/methods/auth.js. Planner data survives sign-out per offline-first contract.

T-18-03 accepted: `OAuthClient.signIn()` redirect URL comes from BFF server — same trust pattern as existing AuthProvider._signInGoogle(). No new attack surface introduced.

No new unplanned threat surface introduced.

## Self-Check

### Files Created/Modified

- [x] site/js/auth/auth-config.js — FOUND
- [x] site/js/auth/OAuthClient.js — FOUND
- [x] site/js/auth/AuthService.js — FOUND
- [x] site/js/vue/methods/auth.js — FOUND (wipe() removed)
- [x] .tests/e2e/signout-wipe.spec.js — FOUND (rewritten)

### Commits

- [x] 619c307 — fix(18-01): remove wipe() from signout; rewrite E2E test
- [x] 74ecbfe — feat(18-01): create site/js/auth/ module

## Self-Check: PASSED
