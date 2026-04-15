---
phase: 19-account-linking-ui
plan: "01"
subsystem: auth-ui
tags: [account-linking, unlink, vue, auth-service, settings-flyout]
dependency_graph:
  requires: [19-00]
  provides: [linkedProviders-model, unlinkProvider-service, connected-accounts-ui]
  affects: [site/js/auth/AuthService.js, site/js/vue/methods/auth.js, site/js/vue/model/auth.js, site/js/vue/i18n/en.js, .compose/fragments/rail.html, site/js/Application.js]
tech_stack:
  added: []
  patterns: [JWT-payload-population, DELETE-REST-endpoint, Vue-reactive-model-update, last-provider-guard]
key_files:
  created: []
  modified:
    - site/js/vue/model/auth.js
    - site/js/vue/i18n/en.js
    - .compose/fragments/rail.html
    - site/js/Application.js
    - site/js/auth/AuthService.js
    - site/js/vue/methods/auth.js
    - site/index.html
decisions:
  - "linkedProviders populated from JWT payload at init (payload?.providers ?? []) — no extra API call needed at startup"
  - "Dual last-provider guard: client-side v-if hides Unlink button when only 1 provider; server returns 409 as safety net"
  - "doLinkProvider() hook stubbed in rail.html for Plan 02 to implement"
metrics:
  duration: "81 seconds"
  completed: "2026-04-15"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 7
requirements: [LNK-03, LNK-02]
---

# Phase 19 Plan 01: Connected Accounts UI and Unlink Flow Summary

**One-liner:** Settings flyout Connected Accounts section with reactive linkedProviders model, JWT-populated init, and AuthService.unlinkProvider() DELETE endpoint with dual last-provider guard.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add linkedProviders model state, i18n labels, settings flyout HTML, and populate at init | fdcb33b | model/auth.js, i18n/en.js, rail.html, Application.js, site/index.html |
| 2 | Implement unlinkProvider in AuthService and wire doUnlinkProvider Vue method | 2f88e17 | auth/AuthService.js, vue/methods/auth.js |

## Objective Achieved

Built the Connected Accounts settings UI and unlink flow:
- Settings flyout renders a Connected Accounts section gated on `feature.signin && signedin`
- Each linked provider shown with Phosphor icon and provider name from `linkedProviders` reactive array
- Unlink button rendered only when `linkedProviders.length > 1` (client-side last-provider guard, T-19-05)
- `AuthService.unlinkProvider()` sends DELETE to `/auth/providers/:provider` with Bearer token, handles 409 gracefully
- `doUnlinkProvider()` Vue method updates `this.linkedProviders` reactively from server response
- "Link another account" link placeholder present for Plan 02 (`doLinkProvider()`)
- `linkedProviders` populated from JWT payload at app init — no extra API call needed

## Deviations from Plan

None — plan executed exactly as written.

## Threat Model Coverage

| Threat ID | Mitigation Applied |
|-----------|-------------------|
| T-19-05 | Dual guard: `v-if="linkedProviders.length > 1"` in rail.html + server 409 handled in AuthService |
| T-19-06 | Bearer token attached in Authorization header for DELETE request |
| T-19-07 | linkedProviders updated from server response (remaining providers), not from client-side manipulation |

## Threat Flags

None — no new network endpoints, auth paths, or schema changes beyond what was planned.

## Known Stubs

- `doLinkProvider()` is referenced in rail.html but not yet implemented — intentional stub for Plan 02 (link flow).

## Self-Check: PASSED

Files exist:
- site/js/vue/model/auth.js: FOUND (linkedProviders: [])
- site/js/vue/i18n/en.js: FOUND (connectedAccounts label)
- .compose/fragments/rail.html: FOUND (connectedAccounts section, doUnlinkProvider)
- site/js/Application.js: FOUND (linkedProviders = payload?.providers)
- site/js/auth/AuthService.js: FOUND (async unlinkProvider)
- site/js/vue/methods/auth.js: FOUND (doUnlinkProvider)
- site/index.html: FOUND (regenerated, contains connectedAccounts)

Commits exist:
- fdcb33b: feat(19-01): add linkedProviders model, i18n labels, connected accounts UI, and init wiring
- 2f88e17: feat(19-01): implement unlinkProvider in AuthService and wire doUnlinkProvider Vue method

Smoke tests: 20 passed (0 failures)
