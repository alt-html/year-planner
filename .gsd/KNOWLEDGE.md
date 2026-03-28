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
