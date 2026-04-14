---
phase: 17-github-oauth-client-flow
plan: "01"
subsystem: auth
tags: [github-oauth, pkce, auth-provider, vue-model, index-html]
dependency_graph:
  requires: [16-02]
  provides: [GHO-01, GHO-02, GHO-03, GHO-04]
  affects: [site/js/service/AuthProvider.js, site/js/Application.js, site/js/vue/model/auth.js, site/index.html, site/js/vendor/jsmdma-auth-client.esm.js]
tech_stack:
  added: []
  patterns: [BFF-redirect-oauth, PKCE-localStorage, VALID_PROVIDERS-allowlist, availableProviders-v-if]
key_files:
  created: []
  modified:
    - site/js/service/AuthProvider.js
    - site/js/vendor/jsmdma-auth-client.esm.js
    - site/js/Application.js
    - site/js/vue/model/auth.js
    - site/index.html
    - .compose/fragments/modals/auth.html
decisions:
  - "VALID_PROVIDERS allowlist in Application.js guards oauth_intended_provider before writing to auth_provider (T-17-01 mitigation)"
  - "Fragment auth.html updated alongside index.html to keep build source in sync"
metrics:
  duration: ~5 minutes
  completed: 2026-04-15
  tasks_completed: 2
  files_changed: 6
---

# Phase 17 Plan 01: GitHub OAuth Client Flow Summary

**One-liner:** GitHub sign-in wired end-to-end via BFF redirect with PKCE localStorage fix, VALID_PROVIDERS allowlist, and conditional provider buttons.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add GitHub sign-in method, fix PKCE storage, add oauth_intended_provider writes | bc0c8d7 | AuthProvider.js, jsmdma-auth-client.esm.js |
| 2 | Fix Application.js callback handler, add availableProviders to model, update auth modal template | f79f4a6 | Application.js, auth.js, index.html, auth.html |

## What Was Built

### Task 1 — AuthProvider.js + vendored client

- `getAvailableProviders()` now includes `'github'` when `authConfig.github.clientId` is set (after google, before apple).
- `signIn()` switch gains `case 'github': return this._signInGitHub()`.
- `_signInGitHub()` added — mirrors `_signInGoogle()` BFF pattern: fetches `auth/github`, validates `authorizationURL`, writes `oauth_intended_provider = 'github'` to localStorage, then redirects.
- `_signInGoogle()` now also writes `oauth_intended_provider = 'google'` before redirect.
- `signOut()` cleans up `oauth_intended_provider`, `oauth_state`, and `oauth_code_verifier` from localStorage.
- `jsmdma-auth-client.esm.js` lines 338-339 changed from `sessionStorage` to `localStorage` for `oauth_state` and `oauth_code_verifier` — required for PKCE state to survive the OAuth redirect.

### Task 2 — Application.js + Vue model + index.html

- `Application` constructor gains `authProvider` as 7th parameter; stored as `this.authProvider`.
- OAuth callback handler replaced: reads `oauth_intended_provider` from localStorage, validates against `VALID_PROVIDERS = ['google', 'github', 'apple', 'microsoft']` allowlist, falls back to `'google'` if invalid/absent, writes to `auth_provider`, then removes all three OAuth keys.
- `this.model.availableProviders` populated from `this.authProvider?.getAvailableProviders() || []` at init.
- `authState` in `vue/model/auth.js` gains `availableProviders: []` initial value.
- Auth modal buttons in `index.html` each get `v-if="availableProviders.includes('...')"` guards; GitHub button added between Google and Apple using `ph-github-logo` icon.
- `.compose/fragments/modals/auth.html` updated identically so the build source stays in sync with the assembled file.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] Updated .compose/fragments/modals/auth.html**
- **Found during:** Task 2
- **Issue:** The plan only listed `site/index.html` as the file to modify for the auth modal buttons, but `site/index.html` is assembled from `.compose/fragments/` via m4. Leaving the fragment unchanged would mean the next `build.sh` run would overwrite the index.html changes with the old un-guarded buttons.
- **Fix:** Updated `.compose/fragments/modals/auth.html` with the same v-if guards and GitHub button as index.html.
- **Files modified:** `.compose/fragments/modals/auth.html`
- **Commit:** f79f4a6

## Verification Results

All 8 plan verification checks passed:
1. `_signInGitHub` present in AuthProvider.js — PASS
2. `case 'github'` in signIn() switch — PASS
3. 3 occurrences of `oauth_intended_provider` in AuthProvider.js (google write, github write, signOut remove) — PASS
4. 2 occurrences of `oauth_intended_provider` in Application.js (getItem, removeItem) — PASS
5. `VALID_PROVIDERS` allowlist present in Application.js — PASS
6. `localStorage.setItem("oauth_state"` in vendored file (not sessionStorage) — PASS
7. `availableProviders` in vue/model/auth.js — PASS
8. 4 occurrences of `availableProviders.includes` in index.html — PASS

Smoke tests: 20/20 passed after both tasks.

## Known Stubs

None — all provider availability checks are live (driven by real authConfig values). GitHub clientId is set; Apple and Microsoft clientIds are empty strings, so their buttons will be hidden at runtime as intended.

## Threat Flags

No new security surface introduced beyond what is in the plan's threat model. T-17-01 mitigation (VALID_PROVIDERS allowlist) implemented as specified.

## Self-Check: PASSED

- site/js/service/AuthProvider.js — exists, contains `_signInGitHub`
- site/js/vendor/jsmdma-auth-client.esm.js — exists, uses localStorage for PKCE
- site/js/Application.js — exists, contains VALID_PROVIDERS and oauth_intended_provider handling
- site/js/vue/model/auth.js — exists, contains availableProviders
- site/index.html — exists, 4 occurrences of availableProviders.includes
- .compose/fragments/modals/auth.html — exists, updated to match
- Commits bc0c8d7 and f79f4a6 present in git log
