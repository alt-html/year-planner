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
