# S04: Dependency cleanup

**Goal:** Remove SquareUp.js and all payment code, replace lodash with native Array methods in StorageLocal.js and StorageRemote.js, rewrite model-features.js as proper ES6 module without window.ftoggle global. All 14 E2E tests pass.
**Demo:** No SquareUp import in contexts.js, no lodash imports, no window.ftoggle. App boots and all 14 tests pass.

## Must-Haves

- SquareUp.js deleted
- SquareUp CDN script tag and sqpaymentform.css removed from head.html
- Payment modal (pay.html) removed from .compose fragments
- showDonate() removed from auth method module
- squarePayment/setDonation methods removed from Api.js
- SquareUp import and registration removed from contexts.js
- lodash imports replaced with native Array methods in StorageLocal.js and StorageRemote.js
- model-features.js rewritten without window.ftoggle global
- index.html recomposed
- All 14 Playwright E2E tests pass

## Proof Level

- This slice proves: integration
- Real runtime required: yes
- Human/UAT required: no

## Verification

- `cd .tests && npx playwright test` — all 14 tests pass
- `grep -rn "lodash\|SquareUp\|squareup\|ftoggle\|initPaymentForm" js/ .compose/ index.html` — no remaining references

## Tasks

- [x] **T01: Remove SquareUp and payment code** `est:15m`
  - Why: SquareUp.js, payment modal, and related methods are dead code
  - Files: `js/service/SquareUp.js`, `js/service/Api.js`, `js/vue/methods/auth.js`, `js/config/contexts.js`, `.compose/fragments/head.html`, `.compose/fragments/modals/pay.html`, `.compose/fragments/modals.html`, `.compose/fragments/nav.html`
  - Do: Delete SquareUp.js. Remove SquareUp import/registration from contexts.js. Remove squarePayment/setDonation from Api.js. Remove showDonate from auth.js. Remove squareup CDN script and sqpaymentform.css from head.html. Remove pay.html include from modals.html. Remove donate buttons from nav.html.
  - Verify: grep confirms no SquareUp/payment references
  - Done when: No payment-related code remains

- [x] **T02: Replace lodash with native Array methods** `est:15m`
  - Why: lodash is an unnecessary CDN dependency — all used functions have native equivalents
  - Files: `js/service/StorageLocal.js`, `js/service/StorageRemote.js`
  - Do: Replace _.findIndex→findIndex, _.filter→filter, _.find→find, _.map→map, _.uniq→[...new Set()], _.remove→splice-based removal. Remove lodash import lines.
  - Verify: `cd .tests && npx playwright test` — all 14 pass
  - Done when: No lodash imports remain, all tests pass

- [x] **T03: Rewrite model-features.js without window global** `est:5m`
  - Why: window.ftoggle is a global function that should be a proper ES6 module export
  - Files: `js/vue/model-features.js`
  - Do: Remove window.ftoggle assignment. Export feature as const. If ftoggle is needed, export it as a named function.
  - Verify: App boots, feature flags work
  - Done when: No window.ftoggle reference

## Files Likely Touched

- `js/service/SquareUp.js` (deleted)
- `js/service/Api.js` (modified)
- `js/vue/methods/auth.js` (modified)
- `js/config/contexts.js` (modified)
- `.compose/fragments/head.html` (modified)
- `.compose/fragments/modals/pay.html` (removed from include)
- `.compose/fragments/modals.html` (modified)
- `.compose/fragments/nav.html` (modified)
- `js/service/StorageLocal.js` (modified)
- `js/service/StorageRemote.js` (modified)
- `js/vue/model-features.js` (modified)
- `index.html` (recomposed)
