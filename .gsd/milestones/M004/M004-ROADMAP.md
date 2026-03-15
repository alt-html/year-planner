# M004: Auth & API Contract

**Vision:** Replace bespoke username/password auth with federated sign-in (Google, Apple, Microsoft), define the sync API contract formally via OpenAPI 3.x, and align the sync client to the spec. All testable without live provider accounts.

## Success Criteria

- No bespoke registration, login, password reset, or email verification code remains
- Federated auth service module exists with configurable provider client IDs
- Nav shows sign-in/sign-out buttons using federated auth
- OpenAPI 3.x spec exists and validates
- Sync client makes requests matching the OpenAPI spec format
- All E2E tests pass (updated for new auth flow)
- App boots and works without any auth configured

## Key Risks / Unknowns

- Large bespoke auth removal could break tests or leave dead template bindings — highest risk, do first
- Federated SDK loading without live accounts — need to verify SDKs don't error when client IDs aren't configured

## Proof Strategy

- Bespoke auth removal breakage → retire in S01 by removing all auth code and running tests
- SDK loading safety → retire in S02 by testing with empty/unconfigured client IDs

## Verification Classes

- Contract verification: 14 Playwright E2E tests, OpenAPI spec validation
- Integration verification: App boots, sign-in/out buttons visible, sync error handling works
- Operational verification: none (no live providers)
- UAT / human verification: none

## Milestone Definition of Done

This milestone is complete only when all are true:

- All bespoke auth modals, methods, and API calls removed
- Federated auth service module exists with provider abstraction
- OpenAPI 3.x spec validates (`npx @redocly/cli lint`)
- Sync client aligned to spec
- All E2E tests pass
- App boots cleanly with no auth configured

## Requirement Coverage

- Covers: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06
- Partially covers: none
- Leaves for later: none
- Orphan risks: none

## Slices

- [x] **S01: Remove bespoke auth code** `risk:high` `depends:[]`
  > After this: No register/signin/password-reset/recover-username modals. Nav simplified. Api.js trimmed from 453 to ~180 lines. All 14 E2E tests pass.
- [x] **S02: Federated auth service module** `risk:medium` `depends:[S01]`
  > After this: AuthProvider.js module with Google/Apple/Microsoft support. Sign-in nav button triggers provider selection. Configurable client IDs. App boots without provider config.
- [x] **S03: OpenAPI 3.x sync API spec** `risk:low` `depends:[S01]`
  > After this: `api/openapi.yaml` validates. Covers auth token exchange, planner sync push/pull, and account deletion.
- [x] **S04: Sync client aligned to spec and final integration** `risk:low` `depends:[S01,S02,S03]`
  > After this: Sync methods use Bearer token from federated auth, request/response shapes match OpenAPI spec. All E2E tests pass. Milestone complete.

## Boundary Map

### S01 → S02

Produces:
- Simplified auth.js with only `signout()`, `clearModalAlert()`, and placeholder `showSignin()`
- Api.js with only `synchroniseToRemote()`, `synchroniseToLocal()`, `deleteRegistration()`
- Simplified nav with sign-in/sign-out buttons

Consumes:
- nothing (first slice)

### S01 → S03

Produces:
- Clear picture of remaining sync API surface (sync push, sync pull, delete account)
- Auth token format (Bearer token from federated provider)

### S02 → S04

Produces:
- AuthProvider.js with `getToken()` method returning current auth token
- Provider abstraction that S04 uses for Bearer token in sync requests

### S03 → S04

Produces:
- OpenAPI spec defining exact request/response shapes for sync endpoints
- Spec that S04's sync client must match
