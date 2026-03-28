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
