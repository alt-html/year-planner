---
id: S01
parent: M003
milestone: M003
provides:
  - StorageLocal.js using localStorage instead of cookies
  - StorageRemote.js using localStorage instead of cookies
  - Cookie consent modal removed from HTML
  - '@alt-javascript/cookies' CDN dependency removed from contexts.js
  - LZString compression removed for local storage (kept for share URLs and import)
  - Cookie config keys removed from config.js
affects:
  - S02
key_files:
  - js/service/StorageLocal.js
  - js/service/StorageRemote.js
  - js/service/Api.js
  - js/config/contexts.js
  - js/config/config.js
  - js/vue/methods/lifecycle.js
  - .compose/fragments/modals.html
  - index.html
key_decisions:
  - acceptCookies/cookiesAccepted replaced with initialised() checking localStorage.getItem('0')
  - setLocalFromModel no longer gated by consent check (always writes)
  - refresh() auto-initialises on first visit if not yet initialised
  - getLocalStorageData() method added for sync-to-remote data gathering
duration: 20m
verification_result: passed
completed_at: 2026-03-14
---

# S01: Replace cookies with localStorage and remove consent modal

**All cookie operations replaced with localStorage, consent modal removed, app auto-initialises on first visit**

## What Happened

Rewrote StorageLocal.js (265 → 270 lines): all `this.cookies.setCookie/getCookie/deleteCookie/getCookies` replaced with `localStorage.setItem/getItem/removeItem/Object.keys(localStorage)`. Removed `cookies` constructor param, `samesite` property, and LZString compress/decompress for local data (raw JSON stored directly). Added `getLocalStorageData()` for sync-to-remote. Replaced `cookiesAccepted()`/`acceptCookies()` with `initialised()`.

Updated StorageRemote.js: removed `cookies` constructor param, replaced 6 cookie operations with localStorage equivalents. Updated Api.js `synchroniseToRemote()` to use `getLocalStorageData()`. Removed Cookies import and CDI registration from contexts.js. Removed cookie config keys from config.js. Updated lifecycle.js `refresh()` to auto-initialise on first visit.

Removed cookie consent modal from modals.html (cookie.html fragment no longer included). Recomposed index.html (708 lines, down from 723).

## Verification

- App boots without cookie modal, data in localStorage, `document.cookie` empty
- Browser console: no errors (only 3 verbose DOM autocomplete suggestions)
