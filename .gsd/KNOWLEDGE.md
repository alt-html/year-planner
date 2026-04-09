# Knowledge Base

Project-specific rules, patterns, and lessons learned. Append-only.

---

## M007 — Boot v3 Uplift (2026-03-21)

### vueStarter is the correct boot-vue@3 entry point
Use `vueStarter` from `@alt-javascript/boot-vue@3` rather than manually chaining `Boot.boot()` + `createCdiApp()`. vueStarter handles config detection, CDI context setup, Vue app creation, and mount in a single call. It eliminates the CDI ordering risk (boot root must be set before ApplicationContext starts) entirely.

### ProfileAwareConfig cannot be wrapped by ConfigFactory.getConfig() in browser mode
Use `ProfileAwareConfig` directly — it implements `has()`/`get()` natively. `Boot.detectConfig()` cannot cleanly wrap it when running in a browser ESM context. Passing it through ConfigFactory produces a double-wrap that breaks profile resolution.

### CDN route interception must be registered in both globalSetup.js and per-test fixtures
Extract a shared helper (e.g., `cdn-routes.js`) and call it from both `globalSetup.js` and the per-test `cdn.js` fixture. If they diverge, globalSetup-driven pages (used by some smoke tests) will hit the real CDN while per-test pages are intercepted — causing flaky offline failures.

### SRI integrity attributes cause fixture interception failures in globalSetup contexts
Playwright's per-test fixture mechanism strips SRI checks internally. `globalSetup.js` does not benefit from this — the browser enforces integrity hashes against the intercepted fixture content. Strip `integrity="..."` attributes from `index.html` in the globalSetup route interceptor (`body.replace(/ integrity="[^"]*"/g, '')`).

### Grep for v2 references in both js/ and .tests/fixtures/cdn*.js
When verifying that no v2 `@alt-javascript` references remain, check both source files (`js/`) and the CDN fixture configuration (`cdn*.js`). The fixture layer is part of the test contract — an intercepted v2 URL that maps to a v3 local file would pass tests but ship broken.

---

## M008 — Day data model extension (2026-03-28)

### #yp-entry-textarea id must stay on the tagline input
The E2E entry-crud test targets `#yp-entry-textarea` to fill the primary text entry. When the modal was redesigned in S02 to use `input[type=text]` instead of `textarea`, the id was preserved on the tagline input. Any future modal restructuring must keep this id on whichever element captures the tagline text, or update the E2E test at the same time.

### Converting a textarea to input[type=text] requires explicit CSS override for min-height and resize
The `.yp-entry-text` class had `min-height` and `resize: vertical` rules targeting it as a textarea. When the tagline field was changed to `input[type=text]`, those properties were explicitly overridden (`min-height: unset; resize: none`) to prevent the input from rendering with textarea-style dimensions. Always audit for textarea-specific CSS when changing element type.

### updateEntry call sites: notes and emoji must come before the syncToRemote boolean
`updateEntry(mindex, day, entry, entryType, colour, notes, emoji, syncToRemote)` — the boolean sync flag is last. There are 10 call sites in entry.html (9 colour dots + 1 save button) and 1 in scripts.html (applyMarkerToCell). When adding new parameters in the future, insert before syncToRemote or all call sites break silently (boolean coerces to string).

### Forward references in the scripts.html IIFE: use typeof guard for mutual exclusion
`scripts.html` is a single large IIFE. The emoji stamp mode block is declared after the marker mode block. Inside `activateMarkerMode()`, calling `deactivateEmojiMode()` is a forward reference. Even though JS var-hoists function declarations, use `if (typeof deactivateEmojiMode === 'function' && emojiActive) deactivateEmojiMode();` as the safe pattern. This avoids ReferenceError if the emoji block is ever removed or conditionally included.

### New rail modes: mirror the marker mode pattern exactly
The marker mode pattern (flyout button → flyout div → activate/deactivate functions → capture-phase mousedown/click/mousemove/mouseup handlers → outside-click close guard) is the established rail mode template. New rail modes should follow it exactly: same CSS class naming (`rail-flyout`, `flyout-active`, `open`, `active`), same capture-phase intercept approach, same DOM traversal via `applyXxxToCell`. The outside-click guard must be extended to include `!emojiActive` and `!emojiFlyout.contains(e.target)` checks for each new mode added — otherwise clicking into one mode's flyout will collapse a parallel mode.


## M009 — localStorage Schema Redesign (2026-03-28)

### CDI init() fires before Vue mounted() — migration must be eager
`@alt-javascript/cdi` calls `init()` on singletons during `Boot.boot()`, which happens before `vueApp.mount()`. Any code that depends on `initialised()` / `refresh()` / `mounted()` fires too late for CDI-driven reads. Fix: call `migrate()` eagerly from every read entry point (`getLocalIdentities`, `getLocalPreferences`, `getLocalPlanner`) so it fires before any storage consumer reads, regardless of who calls first.

### addInitScript runs on every navigation in a Playwright context
`context.addInitScript()` fires on EVERY page navigation, including app-initiated redirects. If a test seeds localStorage in `addInitScript`, the seed runs again on the redirect — potentially undoing migration. Guard with a `sessionStorage` flag: `if (sessionStorage.getItem('_seeded')) return; sessionStorage.setItem('_seeded', '1');`.

### setLocalIdentities compat-write of '0' must be dev-guarded
`setLocalIdentities` writes `'0'` for migration-detection compat. If this write is unconditional, the second page load (after redirect) finds `'0'` and triggers migrate() again, creating duplicate planners. Guard: only write `'0'` when `dev` doesn't exist yet (pre-migration path).

### globalSetup.js waitForFunction must match the schema the app actually writes
`globalSetup.js` saves `consent.json` after a wait for localStorage state. If the condition (`localStorage.getItem('0') !== null`) doesn't match the new schema, globalSetup hangs or saves wrong state. Update the condition whenever the schema changes. M009 condition: `localStorage.getItem('dev') !== null || localStorage.getItem('0') !== null`.

### Playwright doesn't forward browser console.log to test reporter by default
Add `page.on('console', msg => logs.push(msg.text()))` to capture browser-side logs in tests. Without this, `console.log` calls in StorageLocal.js are invisible during test runs.

---

## M011 — SyncClient / jsmdma Sync Rewrite (2026-04-09)

### globalSetup storageState has `dev` key — tests that need initialise() to run must clear localStorage first
`globalSetup.js` saves `.auth/consent.json` after booting the app once. This storageState includes the `dev` key. Every test starts with this state injected. When a test navigates to `/?uid=X&year=Y`, `StorageLocal.initialised()` returns true (because `dev` exists), so `lifecycle.refresh()` skips `this.initialise()`. `initialise()` is what calls `setLocalPlanner(uid, year, ...)` which creates the planner document. Without it, `getActivePlnrUuid(X, Y)` returns null, and `api.sync(null)` returns early. Fix: call `localStorage.clear()` at the start of `addInitScript` (before setting any session/seed keys), guarded by `sessionStorage._seeded` to avoid re-clearing on app-internal redirects.

### SyncClient.sync() is a no-op when plannerId is null — guard is silent
`Api.sync(plannerId)` silently returns when `!plannerId`. No error is thrown, no model.error is set. This makes the "sync didn't fire" scenario invisible during testing — the route intercept simply never fires. When debugging missing sync requests, first verify `getActivePlnrUuid(uid, year)` returns a non-null UUID, then verify `signedin()` returns true.
