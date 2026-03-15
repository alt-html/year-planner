# S02: Federated auth service module

**Goal:** Create AuthProvider.js with a common interface for Google/Apple/Microsoft sign-in. Configurable client IDs. Sign-in button in nav triggers provider selection. App boots without any provider configured.
**Demo:** App boots cleanly. Sign-in button shows provider selector modal (Google/Apple/Microsoft). No errors when no client IDs configured.

## Must-Haves

- `js/service/AuthProvider.js` — common auth interface with provider abstraction
- `js/config/auth-config.js` — configurable client IDs (empty by default)
- Auth provider modal (`.compose/fragments/modals/auth.html`) with provider buttons
- `showSignin()` opens auth provider modal
- Sign-in with a provider: loads SDK, initiates flow, stores token in localStorage
- `signout()` clears auth state
- App boots without any provider configured (no errors)
- CDI wiring for AuthProvider
- All 14 E2E tests pass

## Tasks

- [x] **T01: Create auth config and AuthProvider service** `est:20m`
- [x] **T02: Create auth modal and update nav flow** `est:15m`
- [x] **T03: Wire CDI, recompose, test** `est:10m`
