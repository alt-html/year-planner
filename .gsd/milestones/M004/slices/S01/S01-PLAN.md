# S01: Remove bespoke auth code

**Goal:** Remove all bespoke registration, login, password reset, email verification, and profile editing code. Simplify nav and Api.js. All 14 E2E tests pass.
**Demo:** App boots with no register/signin modals in DOM. Nav shows only a simplified sign-in/sign-out flow. Api.js contains only sync methods.

## Must-Haves

- Remove modals: register.html, signin.html, reset-password.html, recover-username.html, settings.html
- Remove modal includes from modals.html
- Remove auth methods from Api.js: register, signin, setUsername, setPassword, setEmail, setMobile, sendVerificationEmail, verifyEmailToken, sendRecoverPasswordEmail, getData
- Simplify auth.js: keep signout, clearModalAlert; remove all others
- Simplify nav buttons: remove register, simplify signin/signout
- Remove dead model fields from auth model sub-file
- Remove Application.js verifyEmailToken call
- Recompose index.html
- Update feature flags: remove register, keep signin
- All 14 E2E tests pass

## Tasks

- [x] **T01: Remove auth modals and nav buttons** `est:10m`
- [x] **T02: Remove auth methods from Api.js and auth.js** `est:15m`
- [x] **T03: Clean up model, Application.js, features, recompose, test** `est:10m`
