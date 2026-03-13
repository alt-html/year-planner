# M004: Auth & API Contract — Context

**Gathered:** 2026-03-13
**Status:** Pending (M003 must complete first)

## Project Description

The Year Planner has a bespoke registration and login system — username/password with email verification, password recovery, and username recovery. The backend API (in a separate project) handles auth, profile management, and planner sync. M004 replaces bespoke auth with federated sign-in (Google, Apple, Microsoft) and defines a formal OpenAPI 3.x spec for the sync API contract.

## Why This Milestone

Bespoke auth is a maintenance burden and a security liability. Federated auth offloads credential management to trusted providers. The existing API has no formal contract — the frontend and backend are coupled by convention. An OpenAPI spec enables the backend project to implement against a well-defined target, and enables client-side validation.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Sign in with their Google account via a "Sign in with Google" button
- Sign in with their Apple ID via a "Sign in with Apple" button
- Sign in with their Microsoft account via a "Sign in with Microsoft" button
- Have their planner data sync to the cloud after signing in
- No longer see username/password registration, login, or password reset flows

### Entry point / environment

- Entry point: `http://localhost:8080`
- Environment: browser
- Live dependencies involved: Google Identity Services (accounts.google.com/gsi/client), Apple Sign-In JS (appleid.cdn-apple.com), MSAL.js (@azure/msal-browser), and the backend sync API (may be mocked during development)

## Completion Class

- Contract complete means: OpenAPI spec validates; client-side auth flows complete token acquisition; sync client matches spec
- Integration complete means: at least Google Sign-In works against real Google IDP in a browser; sync client makes correct API calls (may use mock responses)
- Operational complete means: auth tokens are stored securely; token refresh works; sign-out clears state

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- Google Sign-In acquires a real identity token in a browser
- Apple and Microsoft Sign-In flows are implemented and testable (may require developer accounts)
- The OpenAPI spec is valid and covers all sync endpoints
- The sync client makes requests matching the OpenAPI spec
- Bespoke auth code (registration, login, password reset, email verification) is fully removed
- All remaining E2E tests pass

## Risks and Unknowns

- **Provider developer accounts** — Google, Apple, and Microsoft each require developer account setup (OAuth consent screen, Services ID, Azure AD app registration). This is configuration work outside the codebase.
- **Apple Sign-In domain verification** — Apple requires domain ownership verification and a registered Services ID. May not work on localhost without workarounds.
- **Token exchange with backend** — The frontend gets an IDP token, but the backend needs to verify it and issue its own session. The API contract must define this exchange.
- **Offline/unauthenticated usage** — The app currently works without signing in. Federated auth must remain optional — the app works locally without auth, and auth enables sync.
- **E2E test impact** — Removing registration/login modals may affect test fixtures that interact with or dismiss these modals.

## Existing Codebase / Prior Art

- `js/service/AuthApi.js` — (after M002) auth API calls to replace
- `js/service/SyncApi.js` — (after M002) sync API calls to align with new contract
- `js/service/ProfileApi.js` — (after M002) profile API calls — may be simplified or removed with federated auth
- `js/vue/methods/auth.js` — (after M002) auth controller methods to replace
- `.compose/fragments/modals/` — registration, signin, reset password, recover username modals to remove

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions.

## Relevant Requirements

- AUTH-01 — Working Google Sign-In
- AUTH-02 — Working Apple Sign-In
- AUTH-03 — Working Microsoft Sign-In
- AUTH-04 — Remove bespoke auth system
- AUTH-05 — OpenAPI 3.x sync API spec
- AUTH-06 — Sync layer aligned to new API contract

## Scope

### In Scope

- Google Identity Services integration (GIS)
- Apple Sign-In for web integration
- Microsoft MSAL.js integration
- Removing all bespoke auth code (registration, login, password reset, email verification, username recovery)
- OpenAPI 3.x spec for sync API contract
- Rewriting sync client to match the spec
- Auth token storage and lifecycle (acquire, store, refresh, clear)

### Out of Scope / Non-Goals

- Backend API implementation (separate project)
- Payment/donation system (removed in M002)
- Storage backend changes (completed in M003)
- New planner features

## Technical Constraints

- No build step — auth provider SDKs must be loaded from CDN
- Google: accounts.google.com/gsi/client (official GIS library)
- Apple: appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js
- Microsoft: @azure/msal-browser from CDN
- Auth must be optional — app works without signing in
- OpenAPI spec should be version 3.0.x or 3.1.x

## Integration Points

- Google Cloud Console — OAuth 2.0 client ID configuration
- Apple Developer Portal — Services ID and domain verification
- Azure AD — App registration for Microsoft auth
- Backend sync API — the OpenAPI spec is the contract between frontend and backend
- CDI — auth provider services wired through CDI

## Open Questions

- How to handle localhost development with provider SDKs that require verified domains — decide during M004 planning
- Whether to support multiple simultaneous provider tokens or require choosing one — decide during M004 planning
- Token refresh strategy for each provider — research during M004 planning
