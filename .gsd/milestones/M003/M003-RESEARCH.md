# M003: Storage Modernisation — Research

**Date:** 2026-03-14

## Summary

The Year Planner stores all local state in browser cookies via the `@alt-javascript/cookies` CDN library: identities (key `'0'`), session (key `'1'`), preferences (key `uid`), and planner data (key `uid-year+month` × 12). Data is LZString-compressed. A cookie consent modal is the first thing users see. StorageLocal.js has 265 lines of cookie read/write operations; StorageRemote.js has 6 cookie operations for sync.

The migration to localStorage is straightforward: replace `this.cookies.setCookie(key, value, expiry, samesite)` with `localStorage.setItem(key, value)`, and `this.cookies.getCookie(key)` with `localStorage.getItem(key)`. LZString compression is no longer needed for local storage (5-10MB limit vs 4KB cookies) but must be kept for share URLs. The `@alt-javascript/cookies` CDN dependency and CDI `Cookies` class registration can be removed entirely.

The E2E test infrastructure has deep cookie dependencies: `globalSetup.js` clicks the cookie modal and waits for `document.cookie.includes('0=')`, the `consent.json` storageState includes cookies, the `harness.spec.js` test checks the cookie modal is NOT visible, and the `compose.spec.js` test checks for `cookie.html` in the fragment list. All of these must be updated.

## Recommendation

Execute in 3 slices:
1. **S01: Replace cookie operations with localStorage** — Change StorageLocal.js and StorageRemote.js internals. Drop LZString compression for localStorage reads/writes (keep for share URLs). Remove `Cookies` from CDI. Drop `@alt-javascript/cookies` CDN import. The `acceptCookies()`/`cookiesAccepted()` pattern becomes a simple localStorage check (e.g. `localStorage.getItem('0') !== null`). The `samesite` parameter and cookie expiry logic disappear.
2. **S02: Remove cookie consent modal and update app flow** — Delete `cookie.html` fragment, remove from `modals.html`, update lifecycle methods to remove `acceptCookies` gating, update `initialise()` to write to localStorage directly, recompose index.html.
3. **S03: Update E2E test infrastructure** — Rewrite `globalSetup.js` to no longer click cookie modal or check `document.cookie`. Update `consent.json` generation to use localStorage state. Update harness test to verify no cookie modal exists. Update compose test for removed cookie.html fragment.

Risk assessment: S01 and S02 could be combined since the cookie modal removal and localStorage migration are tightly coupled — removing cookies makes the modal unnecessary. But separating them gives a safer verification point.

Actually, on reflection, the app currently shows the cookie modal on first visit and only writes to cookies after acceptance. With localStorage, we don't need consent. So the flow simplifies to: on first visit, write identities directly to localStorage (no modal). This means S01+S02 are necessarily coupled — you can't keep the cookie modal if you've removed cookies. Better to do it in 2 slices: one for the storage+modal change, one for the test infrastructure update.

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| LZString compression for share URLs | `lz-string` CDN (already loaded) | Already used, keep for share URL encoding |
| localStorage API | Built-in browser API | No library needed — `setItem`, `getItem`, `removeItem`, `Object.keys(localStorage)` |

## Existing Code and Patterns

- `js/service/StorageLocal.js` — 265 lines, all cookie operations. Constructor receives `cookies` (CDI-injected Cookies instance). 20+ methods use `this.cookies.setCookie/getCookie/deleteCookie/getCookies`. Replace each with localStorage equivalent.
- `js/service/StorageRemote.js` — 6 cookie operations via `this.cookies`. Constructor receives `cookies` param. Replace same way.
- `js/service/Api.js` — 1 reference: `this.storageLocal.cookies.getCookies()` in `synchroniseToRemote()`. Needs updating.
- `js/vue/methods/lifecycle.js` — `refresh()` calls `this.storageLocal.acceptCookies()` and checks `this.storageLocal.cookiesAccepted()`. These gates go away.
- `.tests/globalSetup.js` — Clicks cookie modal, waits for `document.cookie.includes('0=')`, saves storageState.
- `.tests/smoke/harness.spec.js` — Tests `#cookieModal` is not visible on pre-consented load.
- `.tests/smoke/compose.spec.js` — Checks `cookie.html` exists in fragments and is referenced in `modals.html`.

## Constraints

- LZString compression must stay for share URL feature (`Storage.getExportString()` / `setModelFromImportString()`)
- localStorage is synchronous — no async needed, simpler than cookies
- `@alt-javascript/cookies` Cookies class is CDI-injected — removing it changes constructor signatures of StorageLocal and StorageRemote
- StorageLocal constructor param `cookies` → remove it; StorageRemote constructor param `cookies` → remove it
- CDI autowiring: constructor params are matched by name. Removing `cookies` param is safe as long as the CDI context no longer registers `Cookies`

## Common Pitfalls

- **Forgetting the Api.js reference** — Api.js has `this.storageLocal.cookies.getCookies()` in `synchroniseToRemote()`. Must replace with `Object.keys(localStorage)` or a new StorageLocal method.
- **Test infrastructure coupling** — globalSetup.js and 2 smoke tests depend on cookie modal and `document.cookie`. Must update tests or they'll break even if the app works.
- **LZString removal scope** — Drop LZString for local storage reads/writes, but keep for share URLs and import/export. Don't accidentally break share URL feature.
- **StorageLocal.setLocalFromModel()** — Currently gated by `this.cookiesAccepted()`. With localStorage, this check changes to a simple localStorage existence check or removes entirely.

## Open Risks

- Data migration for existing users: users with data in cookies will lose it. Acceptable for this project phase — no production users to worry about.
- Test state management: `consent.json` currently stores cookies. After migration, it stores localStorage state. Playwright's `storageState` supports both cookies and localStorage — just need to ensure the right data is there.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| localStorage | Native browser API | Built-in |
| Playwright storageState | Supports localStorage | Built-in |

## Sources

- Direct code analysis of StorageLocal.js, StorageRemote.js, Api.js, lifecycle.js, globalSetup.js
