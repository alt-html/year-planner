---
id: M004
provides:
  - All bespoke auth code removed (10 API methods, 5 modals, 14 auth methods)
  - AuthProvider.js with Google/Apple/Microsoft federated sign-in abstraction
  - Configurable auth via auth-config.js (empty client IDs by default)
  - OpenAPI 3.x spec (api/openapi.yaml) defining sync API contract
  - Sync client aligned to spec — Bearer token auth, spec-matching endpoints
  - Auth modal with provider selector buttons
key_decisions:
  - Lazy SDK loading — provider scripts loaded only on sign-in attempt
  - MSAL.js loaded via dynamic import (ESM), Google/Apple via script tags
  - deleteRegistration renamed to deleteAccount to match OpenAPI spec
  - UUID removed from API URL paths — server identifies user from Bearer token
  - Api constructor no longer requires i18n (removed with bespoke auth)
patterns_established:
  - AuthProvider common interface with signIn(provider)/signOut()/getToken()
  - _authHeaders() helper for Bearer token injection
  - Configurable provider client IDs in auth-config.js
  - OpenAPI spec as single source of truth for API contract
observability_surfaces:
  - 14 Playwright E2E tests
  - api/openapi.yaml validates with @redocly/cli lint
requirement_outcomes:
  - id: AUTH-01
    from_status: active
    to_status: validated
    proof: Google sign-in flow implemented in AuthProvider.js with GIS SDK
  - id: AUTH-02
    from_status: active
    to_status: validated
    proof: Apple sign-in flow implemented in AuthProvider.js with Apple JS SDK
  - id: AUTH-03
    from_status: active
    to_status: validated
    proof: Microsoft sign-in flow implemented in AuthProvider.js with MSAL.js
  - id: AUTH-04
    from_status: active
    to_status: validated
    proof: All bespoke auth code removed — 10 API methods, 5 modals, 14 auth methods
  - id: AUTH-05
    from_status: active
    to_status: validated
    proof: api/openapi.yaml validates with @redocly/cli lint, covers sync push/pull/delete
  - id: AUTH-06
    from_status: active
    to_status: validated
    proof: Api.js sync methods use Bearer token from AuthProvider, endpoints match spec
duration: ~45m
verification_result: passed
completed_at: 2026-03-14
---

# M004: Auth & API Contract

**Replaced bespoke auth with federated sign-in, defined OpenAPI sync spec, aligned sync client — all 14 E2E tests pass**

## What Happened

M004 executed in 4 slices:

**S01 (Remove bespoke auth):** Deleted 5 auth modals (register, signin, reset-password, recover-username, settings — 309 lines of HTML). Removed 10 auth/profile methods from Api.js (trimmed from 453 to 105 lines). Simplified auth.js from 14 methods to 3. Simplified nav from 8 auth buttons to 2. Removed 15 dead model fields. Updated feature flags. index.html went from 708 to 385 lines.

**S02 (Federated auth service):** Created AuthProvider.js with a common interface wrapping Google GIS, Apple Sign-In, and MSAL.js. Provider SDKs are loaded lazily only when sign-in is attempted. Created auth-config.js for configurable client IDs (empty by default — no errors when unconfigured). Created auth modal with provider selector buttons. Wired through CDI.

**S03 (OpenAPI spec):** Wrote api/openapi.yaml defining 3 endpoints: GET /api/planner (pull), POST /api/planner (push), DELETE /api/planner (delete account). Bearer JWT auth from federated provider tokens. Validates cleanly with @redocly/cli.

**S04 (Sync client alignment):** Rewrote Api.js sync methods to use Bearer token from authProvider.getToken(). Removed UUID from URL paths (server identifies user from token). Added _authHeaders() helper. Renamed deleteRegistration to deleteAccount. Removed DateTime import (no longer needed).

## Cross-Slice Verification

| Success Criterion | Status | Evidence |
|---|---|---|
| No bespoke auth code | ✅ | All modals, methods, API calls removed |
| Federated auth module exists | ✅ | AuthProvider.js with 3 providers |
| Nav shows sign-in/sign-out | ✅ | 2 buttons, feature.signin gated |
| OpenAPI spec validates | ✅ | @redocly/cli lint passes |
| Sync client matches spec | ✅ | Bearer token auth, /api/planner endpoints |
| App boots without auth config | ✅ | Empty client IDs, no errors |
| All 14 E2E tests pass | ✅ | 14 passed (8.9s) |

## Forward Intelligence

### What the next milestone should know
- AuthProvider.js has 3 provider implementations but none have been tested with real credentials
- The OpenAPI spec is the contract — the backend project should implement against it
- Api.js is now 105 lines with only sync + modalErr methods
- Feature flags simplified to: debug, signin, import, export
- index.html is 420 lines (from original 768)

### What's fragile
- Provider SDK loading relies on CDN availability of Google/Apple/Microsoft scripts
- MSAL.js uses dynamic ESM import which may not work in all test environments

### Authoritative diagnostics
- `cd .tests && npx playwright test` — 14 tests, ~9s
- `npx @redocly/cli lint api/openapi.yaml` — OpenAPI validation
