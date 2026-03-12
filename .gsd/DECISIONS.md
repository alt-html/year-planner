# Decisions

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
