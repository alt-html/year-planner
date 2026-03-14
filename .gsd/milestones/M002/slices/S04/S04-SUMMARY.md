---
id: S04
parent: M002
milestone: M002
provides:
  - SquareUp.js deleted, payment modal removed, donate buttons removed
  - lodash replaced with native Array methods in StorageLocal.js and StorageRemote.js
  - model-features.js rewritten as proper ES6 module without window.ftoggle
  - 3 CDN dependencies removed (superagent already gone from S03, plus lodash-es, squareup, uuid)
requires:
  - slice: S01
    provides: Split method modules (showDonate removed from auth.js)
  - slice: S03
    provides: fetch-based Api.js (squarePayment/setDonation removed)
affects:
  - S05
key_files:
  - js/service/StorageLocal.js
  - js/service/StorageRemote.js
  - js/vue/model-features.js
  - js/service/Api.js
  - js/config/contexts.js
  - .compose/fragments/head.html
  - .compose/fragments/nav.html
  - .compose/fragments/modals.html
key_decisions:
  - donate feature flag set to false (was true) since payment infrastructure removed
  - _.remove replaced with filter+reassign (not splice) for simplicity
  - signout button condition changed from feature.donate to feature.signin
patterns_established:
  - Native Array methods for all collection operations (filter, find, findIndex, map, Set)
observability_surfaces:
  - none
drill_down_paths:
  - .gsd/milestones/M002/slices/S04/S04-PLAN.md
duration: 15m
verification_result: passed
completed_at: 2026-03-14
---

# S04: Dependency cleanup

**Removed SquareUp/payment code, replaced lodash with native Array methods, cleaned up feature flags — all 14 E2E tests pass**

## What Happened

1. **SquareUp removal:** Deleted SquareUp.js, removed payment modal (pay.html), donate buttons from nav, squarePayment/setDonation from Api.js, showDonate from auth method module, SquareUp from CDI contexts, squareup CDN script and sqpaymentform.css from head.html.

2. **Lodash replacement:** Replaced all 8 lodash calls in StorageLocal.js and StorageRemote.js with native equivalents: `_.filter`→`Array.filter`, `_.find`→`Array.find`, `_.findIndex`→`Array.findIndex`, `_.map`→`Array.map`, `_.uniq`→`[...new Set()]`, `_.remove`→`Array.filter` (reassign).

3. **Feature flags:** Rewrote model-features.js as proper ES6 module — removed `window.ftoggle` global, exported `ftoggle` as named function. Set `donate: false` since payment infrastructure removed.

index.html recomposed: 723 lines (down from 765).

## Verification

- All 14 Playwright E2E tests pass (10.8s)
- No remaining references to lodash, SquareUp, squareup, ftoggle, initPaymentForm, squarePayment, setDonation, showDonate

## Requirements Advanced

- MOD-05 — SquareUp.js deleted, all payment code removed
- MOD-06 — lodash replaced with native Array methods
- MOD-08 — model-features.js rewritten as proper ES6 module

## Requirements Validated

- MOD-05 — No payment code remains, all 14 tests pass
- MOD-06 — No lodash imports remain, all 14 tests pass
- MOD-08 — No window.ftoggle global, feature flags exported as ES6 module

## Deviations

None.

## Known Limitations

- controller.js still exists on disk (orphaned since S01)
- pay.html still exists on disk but is no longer included in modals.html

## Files Created/Modified

- `js/service/SquareUp.js` — deleted
- `js/service/Api.js` — removed squarePayment/setDonation methods
- `js/vue/methods/auth.js` — removed showDonate method
- `js/config/contexts.js` — removed SquareUp import and registration
- `.compose/fragments/head.html` — removed squareup CDN script and sqpaymentform.css
- `.compose/fragments/modals.html` — removed pay.html include
- `.compose/fragments/nav.html` — removed donate buttons, fixed signout button condition
- `js/service/StorageLocal.js` — replaced lodash with native Array methods
- `js/service/StorageRemote.js` — replaced lodash with native Array methods
- `js/vue/model-features.js` — rewritten as ES6 module without window.ftoggle
- `index.html` — recomposed (723 lines)

## Forward Intelligence

### What the next slice should know
- CDI contexts.js no longer has SquareUp — 6 classes and 7 plain objects remain
- lodash CDN fixture in .tests/fixtures/ still exists but is no longer needed by the app
- feature.donate is now false by default

### Authoritative diagnostics
- `cd .tests && npx playwright test` — 14 tests, ~11s
