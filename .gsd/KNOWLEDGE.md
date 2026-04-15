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

---

## M011 — SyncClient / jsmdma Sync Rewrite, continued (2026-04-09)

### SyncClient fetchJSON is module-private; Api.js fetchJSON stays module-level for deleteAccount
SyncClient.js defines its own module-level fetchJSON helper for the POST /year-planner/sync call. Api.js retains its own module-level fetchJSON because deleteAccount() still needs it. Do NOT share a single fetchJSON across both files via an import — they have different error handling needs and keeping them independent avoids coupling a new module to Api.js internals.

### markEdited() ticks HLC from the existing field clock, not always from sync:{uuid}
In SyncClient.markEdited(plannerId, dotPath), the per-field HLC tick reads `rev:{plannerId}[dotPath]` first and ticks from that clock (fallback: baseClock from sync:{uuid}, fallback: HLC_ZERO). This ensures monotonically increasing stamps even while offline — the field clock advances relative to its own history, not relative to the last server sync. Ticking always from sync:{uuid} would produce identical stamps for rapid offline edits to the same field.

### HLC_ZERO is re-exported from storage-schema.js — use that, not HLC.zero()
`storage-schema.js` re-exports `HLC_ZERO` from data-api-core. Use `import { HLC_ZERO } from './storage-schema.js'` in SyncClient instead of importing and calling `HLC.zero()`. This avoids a duplicate HLC instantiation and keeps all storage-related constants in one place.

### api.sync() Vue call sites are fire-and-forget — do not add await
All 9 call sites that previously called `synchroniseToLocal()` / `synchroniseToRemote()` are fire-and-forget (no await). When replacing them with `this.api.sync(plannerId)`, preserve the fire-and-forget pattern. The original behavior was intentional — UI should not block on sync. Adding await would change the UX contract and potentially cause loading delays.

### deletePlannerByYear: remove the sync call, not replace it
When a planner is deleted locally, the sync call that previously followed the delete should be removed entirely rather than replaced with `api.sync(plannerId)`. Syncing after a local delete makes no sense — the document is gone. This is a simplification, not an oversight.

---

## M011 — SyncClient / jsmdma Sync Rewrite, S02 (2026-04-10)

### markEdited() returns empty rev:{uuid} when getActivePlnrUuid() returns null
The `if (plannerId && this.syncClient)` guard in `entries.js` is correct, but `getActivePlnrUuid(uid, year)` returns null when `initialise()` didn't run. This happens in any test that starts from globalSetup's storageState (which includes the `dev` key, making `initialised()` return true). When debugging empty `rev:*` in tests, first confirm `localStorage.clear()` is called in `addInitScript` before page load — this forces the app to re-run `initialise()` and create the planner.

### Tests that verify write-path side effects (rev:, sync:) must clear localStorage like sync-payload.spec.js
Any E2E test that needs to observe rev:, base:, or sync: localStorage writes must start from a clean localStorage (addInitScript with localStorage.clear(), guarded by sessionStorage._seeded). Using the globalSetup storageState alone is not sufficient — the planner won't be created, getActivePlnrUuid returns null, and the write-path guard silently skips the HLC write. Pattern: `if (sessionStorage.getItem('_seeded')) return; sessionStorage.setItem('_seeded', '1'); localStorage.clear();`

### Orphan compose fragment audit: verify non-inclusion in .m4 templates before deletion
Before deleting any file from `.compose/fragments/`, confirm it is not referenced by any `.m4` template and that `bash .compose/build.sh` produces identical output before and after. The build output line count is the reliable indicator — if it changes, something was still included. Seven orphan modal fragments accumulated silently across M002–M004 (pay.html, signin.html, register.html, reset-password.html, recover-username.html, cookie.html, settings.html). Periodic audits prevent this accumulation.

### api.sync(plannerId) fire-and-forget is a deliberate UX contract
All 9 Vue call sites that replaced synchroniseToLocal/synchroniseToRemote use `this.api.sync(plannerId)` without await. This is intentional — UI must not block on sync. When adding new call sites in future, preserve the fire-and-forget pattern. Adding await anywhere changes the UX contract and could cause visible loading delays on every user interaction.

---

## M012 — Brand/Icon System Overhaul (2026-04-16)

### stripStyleBlocks() helper prevents false-positive attribute selectors in HTML validation
When validating HTML that contains embedded `<style>` blocks with CSS attribute selectors (e.g. `[data-candidate="C1"]::before`), text-based grep patterns searching for HTML attributes can produce false positives if the CSS content contains identical tokens. The solution: strip all `<style>...</style>` blocks before attribute inspection using `html.replace(/<style[\s\S]*?<\/style>/gi, '')`. This eliminates CSS noise and ensures grep patterns match only actual HTML attributes. Applied in `.tests/smoke/icon-candidates-selection.spec.js` to reliably validate `data-selection-state` attributes across the gallery.

### Metadata-based selection separate from asset folders preserves downstream contracts
When implementing winner selection in S02, the decision was to represent it as separate metadata files (canonical.json, alternatives.json) rather than moving/renaming the candidate folders themselves. This approach preserves the asset folder contract (C1-ink-paper/, C2-nordic-clarity/, C3-verdant-studio/) that S03 export work depends on. Folders stay in place; metadata points to the winner. This avoids re-normalization or path-translation work in downstream slices and keeps asset references stable.

### Gallery marker consistency across multiple attributes requires test coverage across both metadata and HTML
The icon-comparison.html gallery uses `data-selection-state` attributes on rationale cards, column headers, and preview cells for styling and semantic consistency. It's easy for gallery markers to drift from the canonical.json/alternatives.json metadata if they're updated separately. Smoke tests must enforce agreement across both surfaces — test that canonical.json candidateId matches the gallery `data-selection-state="winner"` attribute, and that alternatives.json archived candidates match `data-selection-state="archived-alternative"` attributes. Divergence between metadata and gallery would silently break S03 export asset resolution.

---

## M012 — Brand/Icon System Overhaul, S03 Export (2026-04-16)

### Purpose-specific SVG sources with svgSources metadata preserves export flexibility
S03 introduced purpose-specific SVG variants (icon.svg, icon-maskable.svg, icon-monochrome.svg) alongside the main source. These are explicitly listed in canonical.json as `svgSources: { "any": "icon.svg", "maskable": "icon-maskable.svg", "monochrome": "icon-monochrome.svg" }`. This metadata-driven approach lets the exporter render different purpose variants from different source files without hardcoding filename assumptions. If future revisions need different SVG content for maskable (e.g., redesigned safe-zone layout) or monochrome (e.g., new silhouette), only the SVG files and svgSources metadata need updating — the exporter script remains unchanged. Do NOT collapse purpose variants into a single source SVG with CSS display:none rules, as that makes per-purpose customization invisible and breaks the export contract.

### Export contract matrix.json enables deterministic asset reference in downstream slices
S03 emits site/icons/matrix.json as the canonical source of truth for all exported asset locations, purposes, platforms, and source SVG paths. S04 production wiring and S05 desktop packaging both read from this matrix rather than recomputing export logic. The matrix is immutable once generated (it's derived from canonical.json only) and provides a single inspection surface for understanding which assets exist, their purpose/platform/size metadata, and where to find them in the codebase. When future slices need icon assets, they should query matrix.json first rather than hardcoding paths. This centralizes the export contract and prevents path divergence.

### Relative path safety validation in exporter prevents traversal attacks
The exporter validates that svgSources paths in canonical.json are relative (no `../`, no absolute paths starting with `/`) before joining them with the CANDIDATES_DIR base path. This prevents path-traversal attacks where a malicious canonical.json could force reads from outside the candidate folder hierarchy. Always validate untrusted path inputs before filesystem operations, even when they come from repo-local JSON files that are mutable by developers.
