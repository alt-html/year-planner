# Decisions

## D010 — Day object schema extended with keys '3' (notes) and '4' (emoji); merge semantics defined

- **Date:** 2026-03-28
- **Milestone:** M008
- **Context:** Extending the day data model requires defining how conflicting values are resolved during importLocalPlanner (e.g. when syncing two planners that both have entries for the same day).
- **Decision:** Key '3' (notes) uses concat-with-newline merge — same semantics as key '1' (tagline). Key '4' (emoji) uses last-write-wins — emoji doesn't accumulate across imports.
- **Rationale:** Notes are prose content that the user may have written independently in two copies; concatenating preserves both. Emoji is a single decorative stamp; overwriting is the expected behaviour and accumulation would be confusing.
- **Trade-offs:** Concat-merge for notes can produce duplicates if the same planner is imported twice. Last-write-wins for emoji means the most recently imported planner's emoji wins silently.

## D001 — Selected m4 for HTML composition over PostHTML, Nunjucks, and nginx SSI

- **Date:** 2026-03-12
- **Slice:** S04
- **Context:** Needed a tool to decompose the 768-line `index.html` into maintainable fragments without introducing npm dependencies or changing the runtime serving path.
- **Decision:** Use GNU m4 with `-P` prefix mode and `changequote([[[, ]]])`.
- **Rationale:** m4 is pre-installed on macOS and Linux (zero install cost), supports native nesting, and produces a committed `index.html` that Docker/Skaffold serve unchanged. PostHTML and Nunjucks both require npm dependencies; nginx SSI would change the runtime artefact.
- **Trade-offs:** m4 syntax is unfamiliar to most web developers. The `changequote` and `-P` directives add cognitive overhead. Fragment editing requires running `build.sh` manually — there is no file watcher.

## D002 — Used m4 -P flag to avoid JavaScript builtin collisions

- **Date:** 2026-03-12
- **Slice:** S04
- **Context:** m4 has builtins (`substr`, `len`, `index`, etc.) that collide with JavaScript method names in Vue templates embedded in the HTML fragments.
- **Decision:** Use `-P` flag, which prefixes all m4 builtins with `m4_` (e.g., `m4_include`, `m4_dnl`, `m4_changequote`).
- **Rationale:** Without `-P`, m4 silently eats `substr(0,20)` calls in the grid fragment, producing corrupt output. The `-P` flag eliminates all name collisions without requiring manual quoting of every JavaScript identifier.

## D003 — Hidden .compose/ directory for build-time fragments

- **Date:** 2026-03-12
- **Slice:** S04
- **Context:** The project uses hidden directories for tooling (`.docker/`, `.skaffold/`, `.tests/`).
- **Decision:** Place all composition files in `.compose/` to maintain this convention.
- **Rationale:** Keeps the project root clean. The `.compose/` directory is a build-time concern — its contents do not need to be served by the web server.

## D004 — Stay with Vue 3 Options API, do not migrate to Composition API

- **Date:** 2026-03-13
- **Milestone:** M002
- **Context:** Vue 3 supports both Options API and Composition API. The existing app uses Options API (data/methods). M002 could migrate to Composition API for a more modern pattern.
- **Decision:** Stay with Options API. Split controller methods into domain-grouped imports that merge into the existing methods object.
- **Rationale:** Lower risk — same runtime pattern, just reorganised. Composition API migration would touch every reactive reference and change how state works. Not worth the risk for a refactoring milestone.
- **Trade-offs:** Options API is less idiomatic for new Vue 3 code. May revisit if a future milestone adds significant new Vue components.

## D005 — All new modules wired through CDI

- **Date:** 2026-03-13
- **Milestone:** M002
- **Context:** The project uses @alt-javascript/cdi for dependency injection. When splitting modules, some could use direct ES6 imports instead.
- **Decision:** Wire all new modules through CDI for consistency.
- **Rationale:** Consistent pattern across the entire codebase. CDI provides constructor injection, logger auto-injection, and config resolution. User preference for uniformity.
- **Trade-offs:** More wiring overhead in contexts.js. Simple utility modules that don't need DI still go through CDI.

## D006 — Remove SquareUp payment integration entirely

- **Date:** 2026-03-13
- **Milestone:** M002
- **Context:** SquareUp.js handles donation payments via Square. It's tightly coupled to the current auth model.
- **Decision:** Remove SquareUp.js and all payment-related code, modals, and feature flags.
- **Rationale:** Donations are not needed. Removing dead code simplifies the codebase and eliminates the Square CDN dependency.
- **Trade-offs:** Cannot accept donations. Can be re-added later if needed.

## D007 — Replace superagent with native fetch

- **Date:** 2026-03-13
- **Milestone:** M002
- **Context:** Api.js uses superagent (loaded as window.request global) for HTTP calls.
- **Decision:** Replace all superagent usage with native fetch API.
- **Rationale:** Eliminates a CDN dependency, removes a window global, aligns with modern web standards. Fetch is supported in all target browsers.
- **Trade-offs:** Error handling patterns change — fetch doesn't reject on 4xx/5xx, requiring manual `response.ok` checks.

## D008 — Replace lodash with native Array methods

- **Date:** 2026-03-13
- **Milestone:** M002
- **Context:** StorageLocal.js and StorageRemote.js use lodash-es for _.filter, _.find, _.findIndex, _.uniq, _.map, _.remove.
- **Decision:** Replace all lodash usage with native Array.prototype equivalents.
- **Rationale:** All used lodash functions have native equivalents. Removes a CDN dependency.
- **Trade-offs:** _.remove mutates in place — native equivalent requires splice or filter+reassign.

## D009 — Model restructured into grouped sub-objects

- **Date:** 2026-03-13
- **Milestone:** M002
- **Context:** model.js is a flat bag of 40+ fields mixing auth, planner, calendar, and UI state.
- **Decision:** Restructure into grouped sub-objects (auth, planner, calendar, ui) while keeping the flat model for Vue data() compatibility via spread or composition.
- **Rationale:** Groups related state, makes ownership clear, and prepares clean boundaries for M003 (storage) and M004 (auth) to work against.
- **Trade-offs:** Requires updating all Vue template bindings (~75 references across 18 .compose fragments).

---

## Decisions Table

| # | When | Scope | Decision | Choice | Rationale | Revisable? | Made By |
|---|------|-------|----------|--------|-----------|------------|---------|
| D001 | Design session 2026-03-28, data-api sync integration planning | architecture | localStorage schema redesign: replace cookie-era opaque-key schema with HLC-ready terse-readable schema | New schema: dev (device UUID), tok (JWT), ids (identities map), prefs:{uid} (preferences), plnr:{uuid} (planner doc), rev:{uuid} (dot-path fieldRevs), base:{uuid} (base snapshot), sync:{uuid} (baseClock). Day object keys: tp/tl/col/notes/emoji. | The current schema uses unix timestamps as UIDs, opaque numeric keys ('0'..'4') on day objects, and no HLC tracking. It cannot support multi-device merge. The new schema is directly compatible with the data-api sync protocol: plnr: documents are sent verbatim as sync payloads, rev: provides the dot-path fieldRevs, sync: provides the baseClock. | No — changing the schema again would require another migration. Lock it in M009. | collaborative |
| D002 | Design session 2026-03-28, data-api sync integration planning | data-model | Planner document structure for sync: nested map vs per-day documents vs per-month documents | One document per planner, shape: { meta: { name, year, lang, theme, dark, created }, days: { 'YYYY-MM-DD': { tp, tl, col, notes, emoji } } }. Days is a sparse map keyed by ISO date string. | One document per planner is human-readable at the API level (hittiing the sync endpoint directly shows the full planner), maps are dot-path addressable by the data-api merge engine (arrays are not), sparse days keep documents small (~5KB for 50 active days). changesSince returns the full doc on any change but the document is bounded (one year, ~50KB max) so this is acceptable. | Yes — if multi-year planners or very dense planners are added, per-day documents could be revisited. | collaborative |
| D003 | Design session 2026-03-28, data-api sync integration planning | data-model | Planner UUID generation: client-generated vs server-assigned | Client generates UUID via crypto.randomUUID() at planner creation time. Same mechanism for the device UUID (dev key). | Offline-first design principle — the planner must be usable before the first sync. Client-generated UUIDs eliminate a server round-trip dependency for creation. Every node (browser, mobile, server) generates its own IDs. Collision probability with UUIDv4 is negligible. | No — changing this would require coordinating UUID generation across all existing clients. | collaborative |
| D004 | Design session 2026-03-28, supersedes AUTH-05 | architecture | Sync API contract: separate OpenAPI spec (AUTH-05) vs data-api protocol | data-api IS the sync API. year-planner uses POST /year-planner/sync directly. No separate OpenAPI spec file in year-planner. | AUTH-05 was written before the data-api project existed as a concrete deliverable. Now that data-api M001-M005 are complete with a tested, documented protocol, a separate OpenAPI spec would be redundant. The data-api README and test suite are the living contract. | Yes — if a third-party backend integration requires a formal OpenAPI spec, AUTH-05 can be reinstated. | collaborative |
| D005 | Design session 2026-03-28 | architecture | Where sync protocol logic lives in year-planner: inside StorageLocal.js vs a separate SyncClient.js | SyncClient.js in js/service/. Uses data-api-core.esm.js bundle (local asset initially). Manages baseClock/fieldRevs/baseSnapshot per planner. StorageLocal delegates sync state to SyncClient. | Separation of concerns: StorageLocal handles persistence (reading/writing localStorage), SyncClient handles the sync protocol (HLC, fieldRevs, baseClock, server communication). SyncClient is independently testable without a DOM. Mirrors the data-api-core SyncClient design (D006 in data-api decisions). | Yes — if the CDI wiring becomes cumbersome, the two could be merged back. | collaborative |
| D006 | M011 | architecture | SyncClient.js service design and CDI registration | New `site/js/service/SyncClient.js` CDI-registered service. Constructor: `constructor(model, storageLocal)`. Exposes `markEdited(plannerId, dotPath)`, `async sync(plannerId, plannerDoc, authHeaders)`, `prune(plannerId)`. Injected into `Api` and called from `StorageLocal`. | D005 specifies this pattern. Keeps sync state management (baseClock, fieldRevs, baseSnapshot) separate from storage CRUD and HTTP concerns. StorageLocal delegates to SyncClient — not the other way around. | Yes — if sync state needs to become more complex (e.g. multi-device clock merge on startup) | collaborative |
| D007 | M011 | architecture | jsmdma sync payload shape for POST /year-planner/sync | Request: `{ clientClock: string, deviceId: string, changes: [{ id: string, doc: object, fieldRevs: object }] }`. Response: `{ serverClock: string, serverChanges: [{ id: string, doc: object, fieldRevs: object }] }`. clientClock read fresh from `sync:{uuid}` (or `HLC.zero()` if absent). serverClock written back to `sync:{uuid}` after successful sync. | Per D004 and confirmed in M011 discussion: jsmdma IS the sync protocol. The data-api-core.esm.js merge() function expects {doc, fieldRevs} shape. Reading clientClock fresh from localStorage each call is crash-safe and avoids in-memory/on-disk divergence. | No — this is the jsmdma protocol contract | collaborative |
| D008 | M011/S01 | architecture | StorageRemote.js disposal | Delete `site/js/service/StorageRemote.js` entirely. Remove from `contexts.js`. No stub retained. | StorageRemote.js references the obsolete uid-year schema replaced by M009. No method is compatible with the plnr:{uuid} schema. Keeping dead files creates confusion. | No | collaborative |
| D009 | M011/S03 | pattern | MOD-05-09 cleanup approach | Audit first (grep + read) to determine per-item status (done/pending/deferred), then write fix tasks only for pending items. | Several MOD items from M002 may have been partially resolved in M003-M010 without requirement status being updated. Auditing prevents wasted rework on already-done items. | Yes | collaborative |
| D010 | M012/S01 | pattern | How icon assets are authored and exported in M012 | Use canonical vector source assets with generated platform variants. | Prevents per-size/per-platform drift and keeps future revisions cheap and consistent. | Yes | collaborative |
| D011 | M012/S02 | convention | How the candidate set winner is chosen | Select the winning icon/logo set by explicit visual call. | User explicitly requested pure visual decision-making over rubric scoring. | Yes | human |
| D012 | M012/S05 | architecture | Whether desktop packaging assets are part of this milestone | Include `.ico` and `.icns` generation in M012. | User wants readiness for future Electron packaging without a second design/export pass. | Yes | human |
| D013 | M012/S06 | observability | Verification strategy for branding/icon integration | Use existing project test flow as primary verification path for icon integration. | User directed validation through current test flow instead of adding new verification infrastructure. | Yes | human |
| D014 | M012/S01 | convention | How candidate icon systems are packaged in S01 for downstream slices | Use a fixed candidate artifact contract under `mockups/icon-candidates/` with folders `C1-ink-paper`, `C2-nordic-clarity`, `C3-verdant-studio`, each containing `icon.svg`, `logo.svg`, and generated `preview-{16,32,180,192,512}.png` files. | A stable folder/file contract lets S02 visual selection and S03 export work consume assets deterministically without renaming or re-normalization, and enables smoke tests to enforce completeness. | Yes | agent |
| D015 | M012/S02 planning | architecture | How S02 locks the canonical winner without destabilizing S01 artifact contracts | Represent winner selection as machine-readable metadata files (`mockups/icon-candidates/canonical.json` and `mockups/icon-candidates/alternatives.json`) while keeping candidate folders in place. | This preserves existing candidate folder and preview path assumptions used by current smoke tests and upcoming S03 work, while giving downstream slices a deterministic single-source pointer and archived-alternatives set. | Yes | agent |
| D016 | M012/S02 winner selection — no human preference provided, tie-breaker criteria applied | design | Which icon candidate (C1, C2, or C3) to select as the canonical winner for the Year Planner PWA icon | C2 Nordic Clarity | C2 has superior small-size legibility: its bold dark header / white grid / single electric-blue today-cell creates an instantly distinct 3-zone silhouette at 16×16 that survives all target surfaces (browser tab, taskbar, HiDPI favicon). Cross-size coherence is highest — the same bold contrast pattern reads identically from 16px through 512px without redesign. C1 (Ink & Paper) is warm and editorial but the 7×5 grid with ring-binding pins loses fidelity at favicon size. C3 (Verdant Studio) has a compelling organic arc at large sizes but at 16px the arc collapses — the calendar metaphor is lost. Tie-breaker criteria: small-size legibility, then cross-size coherence (per task plan when no human preference available). | No — locked as canonical for S03 export and production wiring | agent |
| D017 | M012/S03 planning | architecture | How S03 publishes canonical cross-platform icon exports for downstream wiring | Generate a purpose-labeled export matrix under `site/icons/` (`favicon`, `apple-touch`, `pwa-any`, `pwa-maskable`, `pwa-monochrome`) and emit `site/icons/matrix.json` as the machine-readable mapping contract, while deferring `index.html`/`manifest.json` wiring to S04. | A fixed output-path contract plus matrix metadata lets S04 wire production references deterministically without recomputing filename logic, and keeps S03 focused on R003 export readiness rather than integration rewiring. | Yes | agent |
| D018 | M012/S05 planning | architecture | How S05 exports desktop packaging assets without destabilizing the existing web/PWA icon contract | Publish desktop outputs under `site/icons/desktop/` with a dedicated `site/icons/desktop-matrix.json` contract; keep `site/icons/matrix.json` unchanged, and package ICNS via `iconutil` with verification-only fallback behavior when macOS tooling is unavailable. | S03 already locks a 9-entry web/PWA matrix consumed by existing smoke tests, so desktop packaging must not change that schema/count. A separate desktop contract isolates responsibilities, keeps downstream S04 wiring stable, and still provides machine-checkable metadata for future Electron tooling. Explicit handling of macOS-only ICNS tooling avoids CI portability surprises while preserving deterministic local generation. | Yes | agent |
| D019 | M012/S06 planning | verification | How S06 records explicit visual spot-check evidence for icon integration sign-off | Generate a deterministic Playwright visual sign-off sheet plus PNG/JSON artifacts under `.tests/test-results/icon-visual-signoff/` and gate completion through a single integrated runner script that also executes existing icon smoke + full Playwright flow. | R006 requires both existing test-flow proof and explicit visual spot checks. A deterministic artifact/report path makes sign-off reproducible for future agents without introducing heavyweight visual-regression infrastructure, while preserving D013’s strategy of relying on the current verification flow. | Yes | agent |
