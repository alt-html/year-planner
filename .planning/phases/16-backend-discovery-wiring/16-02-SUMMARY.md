---
phase: 16-backend-discovery-wiring
plan: "02"
subsystem: auth-config
tags: [github-oauth, bkd-03, client-id, auth-config]
dependency_graph:
  requires: [16-01]
  provides: [BKD-03]
  affects: [site/js/config/auth-config.js]
tech_stack:
  added: []
  patterns: [env-var-secret, public-client-id]
key_files:
  created: []
  modified:
    - site/js/config/auth-config.js
decisions:
  - "GitHub OAuth App client ID committed to auth-config.js — client IDs are public by OAuth design and appear in authorization URLs"
  - "Client secret passed only via GITHUB_CLIENT_SECRET env var, never committed"
metrics:
  duration: "~5 minutes"
  completed: "2026-04-15"
  tasks_completed: 2
  tasks_total: 3
  files_changed: 1
---

# Phase 16 Plan 02: Register GitHub OAuth App & Wire Client ID Summary

**One-liner:** GitHub OAuth App (year-planner-dev) registered with callback `http://127.0.0.1:8081/auth/github/callback`; client ID `Ov23liYtyMmZlVM26OIv` committed to auth-config.js completing BKD-03.

## What Was Built

### Task 1 — Register GitHub OAuth App (BKD-03) [human-action checkpoint]

User registered a GitHub OAuth App at https://github.com/settings/developers with:
- Application name: `year-planner-dev`
- Homepage URL: `http://localhost:8080`
- Authorization callback URL: `http://127.0.0.1:8081/auth/github/callback`

Client ID: `Ov23liYtyMmZlVM26OIv`
Client Secret: stored in environment only (never committed)

### Task 2 — Set client ID in auth-config.js and verify wiring (BKD-03)

`site/js/config/auth-config.js` updated: empty `github.clientId` stub replaced with the real client ID `Ov23liYtyMmZlVM26OIv`.

Wiring chain verified:
1. `KNOWN_PROVIDERS` in `site/js/vendor/jsmdma-auth-client.esm.js` includes `"github"` — PASS
2. `auth-config.js` `github.clientId` is non-empty — PASS
3. `GitHubProvider` imported and wired in `run-local.js` — PASS
4. `GITHUB_CLIENT_SECRET` not present anywhere in `site/` — PASS (secret env-var only)

20/20 Playwright smoke tests pass — no regressions.

**Commit:** `0bc692e` (year-planner repo)

### Task 3 — End-to-end verification [checkpoint:human-verify — pending]

Human verification of `/auth/github` returning valid `authorizationURL` JSON when server runs with GitHub credentials. See checkpoint below.

## Verification

| Check | Command | Result |
|-------|---------|--------|
| KNOWN_PROVIDERS includes github | `grep '"github"' site/js/vendor/jsmdma-auth-client.esm.js` | PASS |
| auth-config non-empty clientId | `grep 'github' site/js/config/auth-config.js` | PASS |
| GitHubProvider in run-local.js | `grep 'GitHubProvider' .../run-local.js` | PASS |
| Secret not in site/ | `grep -r 'GITHUB_CLIENT_SECRET' site/` | PASS (no match) |
| Smoke tests | `cd .tests && npx playwright test smoke/ --reporter=line` | 20/20 PASS |

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Commit client ID to auth-config.js | GitHub OAuth client IDs are public by design — they appear in authorization URLs sent to GitHub |
| Secret via env var only | T-16-06 mitigation — GITHUB_CLIENT_SECRET never in source, passed at server startup |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — `github.clientId` is now populated with the real registered app client ID. The stub from Plan 01 is resolved.

## Threat Surface Scan

No new network endpoints introduced. The client ID committed to auth-config.js is intentionally public (T-16-05 accepted). Client secret confirmed absent from all source files (T-16-06 mitigated). Callback URL exactly matches registered GitHub OAuth App (T-16-07 mitigated).

## Self-Check: PASSED

- `site/js/config/auth-config.js` contains `clientId: 'Ov23liYtyMmZlVM26OIv'` — FOUND
- Commit `0bc692e` — FOUND
- 20/20 smoke tests passed — CONFIRMED
- GITHUB_CLIENT_SECRET not in site/ — CONFIRMED
