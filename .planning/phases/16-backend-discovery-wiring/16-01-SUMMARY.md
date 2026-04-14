---
phase: 16-backend-discovery-wiring
plan: "01"
subsystem: auth-backend
tags: [github-oauth, vendor-patch, run-local, audit]
dependency_graph:
  requires: []
  provides: [BKD-01, BKD-02, BKD-04]
  affects: [site/js/vendor/jsmdma-auth-client.esm.js, site/js/config/auth-config.js, jsmdma/packages/example-auth/run-local.js]
tech_stack:
  added: []
  patterns: [provider-map-pattern, env-var-validation, option-a-vendor-patch]
key_files:
  created:
    - .planning/phases/16-backend-discovery-wiring/16-AUDIT.md
  modified:
    - site/js/vendor/jsmdma-auth-client.esm.js
    - site/js/config/auth-config.js
    - /Users/craig/src/github/alt-javascript/jsmdma/packages/example-auth/run-local.js
decisions:
  - "Option A (patch-in-place) used for KNOWN_PROVIDERS — simpler for single-field patch, avoids esbuild rebuild risk"
  - "auth-config.js github stub added with empty clientId — unblocks Phase 17 getAvailableProviders() without requiring BKD-03 first"
metrics:
  duration: "~12 minutes"
  completed: "2026-04-15"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 4
---

# Phase 16 Plan 01: Backend Discovery & Wiring Summary

**One-liner:** jsmdma backend GitHub OAuth wired — KNOWN_PROVIDERS patched, GitHubProvider registered in run-local.js with env validation, route audit documented.

## What Was Built

### Task 1 — Route audit, KNOWN_PROVIDERS patch, auth-config stub (BKD-01, BKD-02)

**16-AUDIT.md** documents the full jsmdma auth route inventory. All six routes (`GET /auth/:provider`, `GET /auth/:provider/callback`, `GET /auth/me`, `POST /auth/logout`, `POST /auth/link/:provider`, `DELETE /auth/providers/:provider`) are parameterised — no GitHub-specific routes are needed. The audit confirms `AuthMiddlewareRegistrar` already protects the correct paths and `CorsMiddlewareRegistrar` covers all routes including `/auth/github`.

**KNOWN_PROVIDERS** in `site/js/vendor/jsmdma-auth-client.esm.js` line 313 patched from:
```js
new Set(["google", "apple", "microsoft"])
```
to:
```js
new Set(["google", "apple", "microsoft", "github"])
```

**auth-config.js** updated to include a `github` stub entry with empty `clientId`. This ensures `AuthProvider.getAvailableProviders()` can surface GitHub once a real client ID is set (BKD-03).

**Commit:** `6c5eb0d` (year-planner repo)

### Task 2 — Wire GitHubProvider in run-local.js (BKD-04)

`packages/example-auth/run-local.js` updated with:

- `GitHubProvider` imported alongside `GoogleProvider`
- `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` read from `process.env`
- Both GitHub env vars added to the startup missing-env validation check
- `REDIRECT_URI` split into `GOOGLE_REDIRECT_URI` and `GITHUB_REDIRECT_URI`
- `github: new GitHubProvider({...})` added to `authController.providers` map
- Header comment updated with GitHub env vars and run example
- Startup console.log updated to document `/auth/github` and `/auth/github/callback` routes

**Commit:** `b7a2535` (jsmdma repo)

## Verification

All plan verification checks passed:

1. `grep '"github"' site/js/vendor/jsmdma-auth-client.esm.js` — match on line 313
2. `grep 'github' site/js/config/auth-config.js` — github key with empty clientId
3. `grep 'GitHubProvider' .../run-local.js` — import and providers map entry
4. `grep 'GITHUB_CLIENT_ID' .../run-local.js` — env read + missing-env check
5. `test -f .planning/phases/16-backend-discovery-wiring/16-AUDIT.md` — exists
6. 20/20 Playwright smoke tests pass — no regressions

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Option A patch-in-place for KNOWN_PROVIDERS | Avoids esbuild rebuild and potential version-drift risk (Pitfall 5 from RESEARCH.md). Single-field change is auditable as a diff. |
| github stub added to auth-config.js in this phase | Without the config key, KNOWN_PROVIDERS patch alone has no effect — `getAvailableProviders()` filters both Set membership AND config key presence. Adding stub here unblocks Phase 17. |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

- `site/js/config/auth-config.js` — `github.clientId: ''` is intentionally empty. This is the BKD-03 stub, to be filled after GitHub OAuth App registration. Phase 17 (GHO-01) will set the real client ID. The empty stub does not affect functionality — `getAvailableProviders()` will not surface GitHub until a non-empty clientId is provided.

## Threat Surface Scan

No new network endpoints introduced in this phase. The `/auth/github` and `/auth/github/callback` routes already existed (parameterised). GITHUB_CLIENT_SECRET is read from process.env only and never committed to source — mitigates T-16-01. No new threat surface beyond what the threat model anticipated.

## Self-Check: PASSED

- `.planning/phases/16-backend-discovery-wiring/16-AUDIT.md` — FOUND
- `site/js/vendor/jsmdma-auth-client.esm.js` KNOWN_PROVIDERS includes "github" — FOUND
- `site/js/config/auth-config.js` github stub — FOUND
- `/Users/craig/src/github/alt-javascript/jsmdma/packages/example-auth/run-local.js` GitHubProvider — FOUND
- Commit `6c5eb0d` (year-planner) — FOUND
- Commit `b7a2535` (jsmdma) — FOUND
- 20/20 smoke tests passed — CONFIRMED
