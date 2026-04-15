---
phase: 19-account-linking-ui
plan: "02"
subsystem: auth
tags: [oauth, account-linking, link-flow, userkey-migration]
dependency_graph:
  requires: [19-01]
  provides: [LNK-01, LNK-04]
  affects: [site/js/auth/AuthService.js, site/js/Application.js, site/js/vue/methods/auth.js, site/js/vue/i18n/en.js]
tech_stack:
  added: []
  patterns: [oauth-link-callback-detection, localStorage-intent-flags, fire-and-forget-promise]
key_files:
  created: []
  modified:
    - site/js/auth/AuthService.js
    - site/js/Application.js
    - site/js/vue/methods/auth.js
    - site/js/vue/i18n/en.js
decisions:
  - Link callback detected by checking oauth_link_intent localStorage flag before urlToken block in Application.init()
  - _pendingLink is fire-and-forget from init() perspective; model updates reactively when promise resolves
  - plannerStore accessed via this.model.plannerStore (CDI property-injected) — not a constructor param
  - doLinkProvider() picks first unlinked provider; multi-provider picker deferred to future enhancement
metrics:
  duration: "~15 minutes"
  completed: "2026-04-15"
  tasks_completed: 1
  tasks_total: 2
  files_changed: 4
---

# Phase 19 Plan 02: OAuth Link Flow and userKey Migration Summary

One-liner: OAuth provider link flow with intent-flag callback detection and per-planner userKey migration via PlannerStore.takeOwnership().

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Implement linkProvider, completeLinkCallback, doLinkProvider, userKey migration | 9505153 | site/js/auth/AuthService.js, site/js/Application.js, site/js/vue/methods/auth.js, site/js/vue/i18n/en.js |

## Task 2 — Awaiting Human Verification

Task 2 is a `checkpoint:human-verify` gate requiring end-to-end verification of the full account linking flow against a live jsmdma backend. See checkpoint message for test steps.

## What Was Built

### AuthService.js

- `linkProvider(provider)`: fetches GET /auth/:provider for authorizationURL, stores `oauth_link_intent` and `oauth_link_state` in localStorage, redirects browser, returns a never-resolving promise (LNK-01)
- `completeLinkCallback(provider, code, state)`: POSTs to /auth/link/:provider with Bearer token; cleans up localStorage flags regardless of outcome; handles 409 (providerConflict) and other HTTP errors; returns updated providers array (LNK-01)

### Application.js

- Link callback detection block added BEFORE the `urlToken` block in `init()`: checks `oauth_link_intent` + `?code=` + `?state=`
- On success: updates `model.linkedProviders` reactively and runs `plannerStore.takeOwnership(uuid)` on all local planners (LNK-04)
- On failure: sets `model.modalError` with the error message
- Cleans up `?code=` and `?state=` URL params via `history.replaceState`

### vue/methods/auth.js

- `doLinkProvider()`: finds first unlinked provider (available minus linked), calls `this.authProvider.linkProvider(provider)`. Already referenced in rail.html template from Plan 01.

### vue/i18n/en.js

- Added `error.providerConflict: 'This provider is already linked to another account'`

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: state-param-passthrough | site/js/auth/AuthService.js | `oauth_link_state` is read from localStorage and passed as `stored_state` to the server; server validates it — mitigated per T-19-01 |
| threat_flag: url-cleanup | site/js/Application.js | OAuth `?code=` and `?state=` removed from URL via replaceState immediately after detection — mitigates T-19-04 |

## Self-Check: PASSED

- [x] site/js/auth/AuthService.js contains `async linkProvider` — FOUND
- [x] site/js/auth/AuthService.js contains `async completeLinkCallback` — FOUND
- [x] site/js/Application.js contains `oauth_link_intent` — FOUND
- [x] site/js/Application.js contains `takeOwnership` — FOUND
- [x] site/js/vue/methods/auth.js contains `doLinkProvider` — FOUND
- [x] site/js/vue/i18n/en.js contains `providerConflict` — FOUND
- [x] Commit 9505153 exists — FOUND
- [x] Smoke tests: 20 passed
