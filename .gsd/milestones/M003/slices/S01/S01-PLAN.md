# S01: Replace cookies with localStorage and remove consent modal

**Goal:** Replace all cookie operations with localStorage, remove the cookie consent modal, remove @alt-javascript/cookies CDN dependency, simplify the first-run flow. App boots and works without cookies.
**Demo:** App boots without cookie modal, creates entries, persists data in localStorage, reloads with data intact.

## Must-Haves

- StorageLocal.js uses localStorage instead of cookies
- StorageRemote.js uses localStorage instead of cookies
- Api.js `synchroniseToRemote()` updated (no more `cookies.getCookies()`)
- @alt-javascript/cookies CDN import removed from contexts.js
- Cookies class removed from CDI registration
- Constructor params updated (no `cookies` param)
- Cookie consent modal HTML removed
- `acceptCookies()`/`cookiesAccepted()` replaced or removed
- lifecycle.js `refresh()` and `initialise()` updated
- LZString compression removed for localStorage (kept for share URLs)
- index.html recomposed

## Proof Level

- This slice proves: integration
- Real runtime required: yes
- Human/UAT required: no

## Verification

- App boots in browser, no cookie modal, no console errors
- Create an entry, reload, entry persists
- `document.cookie` is empty
- `localStorage` contains planner data

## Tasks

- [x] **T01: Replace cookie operations with localStorage in StorageLocal.js** `est:20m`
  - Why: Core migration — all 20+ cookie operations need replacing
  - Files: `js/service/StorageLocal.js`
  - Do: Replace `this.cookies.setCookie(key, value, expiry, samesite)` → `localStorage.setItem(key, value)`. Replace `this.cookies.getCookie(key)` → `localStorage.getItem(key)`. Replace `this.cookies.deleteCookie(key)` → `localStorage.removeItem(key)`. Replace `Object.keys(this.cookies.getCookies())` → `Object.keys(localStorage)`. Remove `cookies` constructor param. Remove `samesite` property. Drop LZString compress/decompress for localStorage (keep raw JSON). Update `cookiesAccepted()` → check `localStorage.getItem('0') !== null`. Remove `acceptCookies()` method (no consent needed).
  - Verify: File loads without errors
  - Done when: No cookie references in StorageLocal.js

- [x] **T02: Update StorageRemote.js, Api.js, contexts.js, lifecycle.js** `est:15m`
  - Why: All files that reference cookies or the Cookies class
  - Files: `js/service/StorageRemote.js`, `js/service/Api.js`, `js/config/contexts.js`, `js/vue/methods/lifecycle.js`
  - Do: StorageRemote.js — replace cookie operations with localStorage, remove `cookies` constructor param. Api.js — replace `this.storageLocal.cookies.getCookies()` with localStorage keys query. contexts.js — remove Cookies import and CDI registration. lifecycle.js — remove `acceptCookies()` call, simplify `cookiesAccepted()` check, auto-initialise on first visit.
  - Verify: All files load without errors
  - Done when: No Cookies class references anywhere

- [x] **T03: Remove cookie consent modal and recompose** `est:10m`
  - Why: No cookies means no consent needed
  - Files: `.compose/fragments/modals/cookie.html`, `.compose/fragments/modals.html`, `index.html`
  - Do: Delete cookie.html fragment. Remove include from modals.html. Recompose index.html.
  - Verify: `grep -rn 'cookieModal' index.html` returns nothing
  - Done when: No cookie modal in HTML, index.html recomposed

## Files Likely Touched

- `js/service/StorageLocal.js` (modified — core migration)
- `js/service/StorageRemote.js` (modified)
- `js/service/Api.js` (modified)
- `js/config/contexts.js` (modified)
- `js/vue/methods/lifecycle.js` (modified)
- `.compose/fragments/modals/cookie.html` (deleted)
- `.compose/fragments/modals.html` (modified)
- `index.html` (recomposed)
