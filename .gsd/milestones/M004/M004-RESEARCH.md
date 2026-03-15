# M004: Auth & API Contract — Research

**Date:** 2026-03-14

## Summary

The current auth system is bespoke username/password with modals for register, signin, password reset, username recovery, and a profile settings modal for username/password/email changes. Api.js contains 10 auth/profile methods (~300 lines of its 453 total). Auth methods module (auth.js) has 14 methods. Five modal HTML fragments total ~310 lines. The nav has 8 auth-related buttons.

The approach is: (1) remove all bespoke auth code, (2) add federated auth service module with configurable provider client IDs, (3) write OpenAPI 3.x spec, (4) rewrite sync client to match spec. All testable without live provider accounts — the auth service module wraps provider SDKs behind a common interface, and the SDK script tags are conditionally loaded only when client IDs are configured.

## Recommendation

Execute in 4 slices:
1. **S01: Remove bespoke auth code** — Delete register/signin/password-reset/recover-username modals, remove auth methods from Api.js, simplify auth.js methods, simplify nav. Highest risk (most deletions, could break tests).
2. **S02: Federated auth service module** — Create `js/service/AuthProvider.js` with a common interface for Google/Apple/Microsoft. Each provider loaded conditionally. Auth config in `js/config/auth-config.js`. Sign-in/sign-out buttons in nav with provider selector.
3. **S03: OpenAPI 3.x spec** — Write `api/openapi.yaml` defining sync endpoints, auth token exchange, planner CRUD.
4. **S04: Sync client aligned to spec** — Rewrite sync methods in Api.js to match the OpenAPI contract, using Bearer token from federated auth.

## Existing Code and Patterns

### Auth methods in Api.js (to remove/replace)
- `register(username, password, email, mobile)` — remove
- `signin(username, password, rememberme)` — replace with federated token exchange
- `setUsername(username)` — remove (federated users don't set usernames)
- `setPassword(password, newpassword)` — remove
- `setEmail(email)` — remove
- `setMobile(mobile)` — remove
- `sendVerificationEmail()` — remove
- `verifyEmailToken(token, model)` — remove
- `sendRecoverPasswordEmail(username)` — remove
- `deleteRegistration()` — keep but simplify (delete account)
- `synchroniseToRemote()` — keep, align to spec
- `synchroniseToLocal(syncPrefs)` — keep, align to spec
- `getData()` — dead code, remove

### Auth methods in auth.js (to simplify)
- `showProfile()` — empty, remove
- `showRegister()`, `register()` — remove
- `showSignin()`, `signin()` — replace with federated flow
- `signout()` — keep (clear local session)
- `showResetPassword()`, `showRecoverUser()` — remove
- `clearModalAlert()` — keep (used by remaining modals)
- `peekPass()`, `unpeekPass()`, `peekNewPass()`, `unpeekNewPass()` — remove

### Modals to remove
- `register.html` (63 lines) — username/password registration
- `signin.html` (67 lines) — username/password sign in
- `reset-password.html` (39 lines) — password reset
- `recover-username.html` (39 lines) — username recovery
- `settings.html` (101 lines) — profile editing (username/password/email)

### Nav buttons to simplify
- Remove: register button, signin buttons (4 variants for different states)
- Keep: signout button (simplify condition)
- Add: federated sign-in button

### Model fields that become dead
After removing bespoke auth: `username`, `password`, `newpassword`, `email`, `mobile`, `emailverified`, `mobileverified`, `changeuser`, `changepass`, `changeemail`, `peek`, `peeknp`, `rememberme`, `modalErrorTarget`

## Constraints

- No build step — provider SDKs loaded from CDN via `<script>` tags
- Auth must be optional — app works without signing in
- Provider client IDs must be configurable (not hardcoded)
- E2E tests must not depend on real provider accounts
- Feature flags `feature.register` and `feature.signin` control nav visibility

## Common Pitfalls

- **Breaking sync-error test** — The test injects a fake session to trigger sync. Must preserve the `signedin()` check and session structure.
- **Dead model fields in templates** — Removing model fields that are still bound in templates causes Vue errors. Must remove template bindings first.
- **Feature flag dependencies** — Nav buttons are gated by `feature.register` and `feature.signin`. Simplify to `feature.signin` only.

## Open Risks

- Settings modal removal means no profile editing — acceptable since federated auth handles identity
- `deleteRegistration()` API call may need auth token instead of UUID
