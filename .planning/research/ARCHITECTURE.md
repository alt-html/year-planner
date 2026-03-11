# Architecture Patterns

**Domain:** E2E testing and lightweight HTML composition for a no-build PWA
**Researched:** 2026-03-11
**Confidence:** MEDIUM — Playwright webServer config is well-established (HIGH); HTML composition shell patterns are straightforward (HIGH); integration with the specific hidden-dir convention is inferred from codebase evidence (MEDIUM)

---

## Context

The existing project is a CDN-first, no-build vanilla ES6 + Vue 3 PWA. The runtime has no build step. Dev tooling (Docker, Skaffold, Minikube) is already isolated in hidden directories (`.docker/`, `.skaffold/`, `.minikube/`). This architecture document covers two additions to that tooling layer:

1. A Playwright E2E test suite
2. An optional HTML fragment composition step for `index.html`

Neither addition should touch the runtime delivery model. Both belong in the tooling tier, below the runtime boundary.

---

## Component Boundaries

There are three distinct tiers. The boundary between them is hard — tooling must never be shipped to or required by the runtime.

```
+------------------------------------------+
|  RUNTIME TIER                            |
|  index.html, js/, css/, manifest.json    |
|  Served by nginx (prod) or http-server   |
|  No node_modules, no build artifacts     |
+------------------------------------------+
           |  (static files served over HTTP)
           v
+------------------------------------------+
|  DEV SERVER TIER                         |
|  npx http-server (local, no Docker)      |
|  Docker nginx (containerised)            |
|  Skaffold / Minikube (k8s local dev)     |
|  Serves runtime tier unchanged           |
+------------------------------------------+
           |  (HTTP: localhost:8080 or 9001)
           v
+------------------------------------------+
|  TOOLING TIER                            |
|  .tests/  — Playwright tests + config    |
|  .docker/ — Container definitions        |
|  .skaffold/ — Kubernetes local dev       |
|  .minikube/ — Minikube config            |
|  (HTML composition script, if adopted)   |
+------------------------------------------+
```

### What talks to what

| Component | Communicates With | Direction | Protocol |
|-----------|------------------|-----------|----------|
| Playwright test runner | Dev server (http-server or Docker nginx) | outbound HTTP | HTTP/HTTPS |
| Playwright test runner | Browser (Chromium/Firefox/WebKit) | orchestration | CDP/DevTools |
| `playwright.config.js` webServer | `npx http-server` process | lifecycle (spawn/kill) | process signals |
| HTML compose script | `index.html` fragments | file I/O | stdin/stdout/files |
| HTML compose script | runtime `index.html` | file write | filesystem |
| Docker build | runtime tier files | COPY | filesystem |
| Docker build | HTML compose output | COPY | filesystem |

---

## Recommended Architecture

### Test Directory: `.tests/`

Use `.tests/` as the Playwright home directory. Rationale:

- Follows the established hidden-directory convention for tooling (`.docker/`, `.skaffold/`)
- Keeps `playwright.config.js` and all test files in one place, out of the project root
- Git-ignorable as a group if needed during CI setup
- `.playwright/` is also reasonable but `.tests/` is more generic and mirrors the project's naming style (`.docker/`, `.skaffold/` are plural-noun hidden dirs)

```
.tests/
├── playwright.config.js   # Playwright configuration
├── e2e/                   # Test files
│   ├── planner.spec.js    # Core planner feature tests
│   ├── auth.spec.js       # Sign-in / register / password
│   ├── sync.spec.js       # Remote sync scenarios
│   └── share.spec.js      # URL share / import
└── fixtures/              # Shared test helpers, page objects
    └── app.js             # Page object model for year-planner
```

The `playwright.config.js` uses `testDir: './e2e'` (relative to its own location). Playwright is invoked from the project root with:

```bash
npx playwright test --config .tests/playwright.config.js
```

Or via an npm script in a `package.json` that lives only in `.tests/` (keeping the project root `package.json`-free for the runtime).

### Server Lifecycle: Playwright webServer Config

Playwright's `webServer` block in `playwright.config.js` starts and stops the static server automatically before and after test runs. This is the correct integration point — do not write separate shell scripts to manage the server for tests.

```javascript
// .tests/playwright.config.js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:8080',
  },
  webServer: {
    command: 'npx http-server .. -p 8080 --silent',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 10000,
  },
});
```

Key decisions in this config:

- `command: 'npx http-server .. -p 8080'` — the `..` serves the project root (one level up from `.tests/`). This matches the Docker nginx behaviour: serve the project root as the document root.
- `reuseExistingServer: !process.env.CI` — in local dev, reuse a running server to save startup time. In CI, always start fresh.
- `timeout: 10000` — 10 seconds is generous for `http-server` startup; it starts in under 1 second.
- Port 8080 aligns with `.docker/bin/run` (`--publish 8080:80`) and the Skaffold `localPort: 8080`, so the same port works for Docker-served and `http-server`-served local dev.

For running against a Docker-served instance instead of `http-server`, swap the command or set `reuseExistingServer: true` with no command (Playwright will wait for the URL to become available). This is useful in CI where the container is started separately.

### Data Flow: Test Run

```
Developer runs: npx playwright test --config .tests/playwright.config.js
         |
         v
playwright.config.js webServer block executes:
  npx http-server .. -p 8080 --silent
         |
         v
http-server starts, serving project root (index.html, js/, css/)
         |
         v
Playwright waits until http://localhost:8080 responds (up to timeout)
         |
         v
Playwright launches browser (Chromium by default)
         |
         v
Each test navigates to baseURL (http://localhost:8080)
  → Browser loads index.html
  → index.html loads CDN scripts (Vue, i18n, superagent, Bootstrap)
  → js/main.js boots ApplicationContext
  → Vue mounts to #app
         |
         v
Test assertions run against live browser DOM
  → Playwright uses locators (role, text, CSS, data-testid)
  → No mocking of services by default (true E2E)
         |
         v
All tests complete
  → Playwright kills http-server process
  → HTML report generated (.tests/playwright-report/)
```

### Nginx Config Note

The existing `nginx.conf` uses `try_files $uri $uri/ /index.html` — all paths fall back to `index.html`. The `http-server` default behaviour also serves `index.html` at root. They are equivalent for this single-page app. No special configuration is needed.

---

## HTML Fragment Composition Architecture

### Problem

`index.html` is 761 lines of inline Vue templates. The no-build constraint means no `.vue` SFCs and no import-based templating. The composition question is: can `index.html` be broken into modular fragments and assembled without a heavy tool?

### Recommended Approach: Shell Script + `cat`

Use a shell script (`.docker/bin/compose` or a new `.compose/bin/compose`) that concatenates HTML fragments into a single `index.html`. This is the most natural extension of the existing workflow, consistent with `.docker/bin/build` (a 3-line shell script).

```
Source tree (fragments):              Output:
.compose/
├── bin/
│   └── compose                 -->  index.html (assembled)
└── fragments/
    ├── head.html               head + CDN script tags
    ├── nav.html                top navigation
    ├── calendar.html           year-grid Vue template
    ├── modals/
    │   ├── auth.html           sign-in / register modals
    │   ├── settings.html       settings modal
    │   └── share.html          share / import modal
    └── foot.html               closing tags, script init
```

The compose script:

```bash
#!/bin/bash
cat .compose/fragments/head.html \
    .compose/fragments/nav.html \
    .compose/fragments/calendar.html \
    .compose/fragments/modals/auth.html \
    .compose/fragments/modals/settings.html \
    .compose/fragments/modals/share.html \
    .compose/fragments/foot.html \
    > index.html
```

This is 8 lines of shell. No npm dependency, no node_modules, no configuration format to learn. The output `index.html` is identical to the current hand-maintained file.

### Alternative: `make`

A `Makefile` at project root or in `.compose/` is slightly more capable — it can track fragment modification timestamps and skip regeneration if nothing changed. For 761 lines of HTML, this optimisation is irrelevant. Shell script is preferred.

### What the Compose Step Does NOT Do

- No template variables or interpolation (Vue handles that at runtime)
- No minification (CDN-first; nginx gzip handles compression at the HTTP layer)
- No SRI hash injection (that is a separate script step, covered in its own milestone item)
- No dependency resolution between fragments

### Integration with Docker Build

If HTML composition is adopted, the Docker build sequence becomes:

```
.compose/bin/compose       →  generates index.html
.docker/bin/build          →  docker build (COPYs index.html into nginx image)
```

The compose step runs before the Docker build. The Dockerfile remains unchanged — it still `COPY . /usr/share/nginx/html`. The compose script can be called from `.docker/bin/build`:

```bash
#!/bin/bash
.compose/bin/compose
docker build -f ./.docker/Dockerfile-nginx-16-alpine --tag alt-html/year-planner:latest .
```

Or kept separate (developer runs compose manually when editing fragments, commits the generated `index.html`). The committed `index.html` approach is simpler: the output is always in version control, Docker never needs to know about fragments.

### Source vs Output

| File | Status | In Git | Built by |
|------|--------|--------|----------|
| `.compose/fragments/*.html` | Source | Yes | Human |
| `index.html` | Generated output | Yes (committed) | compose script |
| Docker image | Deployment artifact | No | Docker build |

Committing the generated `index.html` means:
- Existing Docker workflow unchanged (no compose step required in container build)
- `index.html` is always deployable without any tooling
- Fragment edits are always paired with a regenerated `index.html` in the same commit

This is consistent with the existing pattern where `index.html` is the source of truth for deployment.

---

## Fitting the Hidden-Directory Pattern

The existing convention:

| Directory | Purpose |
|-----------|---------|
| `.docker/` | Container build and run scripts |
| `.skaffold/` | Kubernetes local dev orchestration |
| `.minikube/` | Minikube cluster config |
| `.planning/` | Project planning documents |

Proposed additions:

| Directory | Purpose |
|-----------|---------|
| `.tests/` | Playwright config and E2E test files |
| `.compose/` | HTML fragment sources and compose script (if composition adopted) |

Both follow the pattern: tooling that supports development but is invisible to the runtime. Neither appears in the nginx container (the Dockerfile's `COPY .` includes them, but nginx ignores non-HTML/CSS/JS files and the hidden directories don't conflict with route handling).

If desired, the nginx Dockerfile can be updated to exclude tooling directories:

```dockerfile
COPY --chown=nginx:nginx css/ /usr/share/nginx/html/css/
COPY --chown=nginx:nginx js/ /usr/share/nginx/html/js/
COPY --chown=nginx:nginx index.html manifest.json *.png *.ico /usr/share/nginx/html/
```

This is cleaner but requires updating the Dockerfile. The current `COPY .` approach is harmless since nginx only serves files that match routes.

---

## Component Boundary: Dev Tooling vs Runtime Code

This boundary is the most important architectural constraint in this project.

### Runtime Code (must never depend on tooling)

- `index.html` — served directly; no build required to run it
- `js/` — ES6 modules loaded by `<script type="module">`; no transpilation
- `css/` — plain CSS; no preprocessor
- `manifest.json` — PWA manifest; static file
- External CDN libraries — Vue 3, Vue i18n, Superagent, Bootstrap, LZString, etc.

The runtime is self-contained. Opening `index.html` directly in a browser (file://) with CDN access works.

### Dev Tooling (never shipped to end users)

- `.tests/` — Playwright; requires Node.js; only for test runs
- `.docker/` — Docker; requires Docker daemon; only for containerisation
- `.skaffold/` — Skaffold; requires k8s; only for local cluster dev
- `.compose/` — shell scripts; only for fragment assembly
- `.planning/` — documentation; not code

### Enforcement

There is no package.json at the project root (by design). This physically prevents runtime code from accidentally taking an npm dependency. If a `package.json` is added in `.tests/` for Playwright, it lives there and does not propagate to the root. Playwright itself is invoked via `npx` (no global install required) or installed locally to `.tests/node_modules/` via a `.tests/package.json`.

---

## Build Order Implications

The following sequence represents the dependency graph for getting from source to deployed:

```
1. Edit fragments in .compose/fragments/    (if composition adopted)
       |
       v
2. Run .compose/bin/compose                 generates index.html
       |
       v
3. index.html + js/ + css/ are ready       runtime is complete and testable
       |
       v
4. Run .tests/ Playwright suite             validates runtime against a live server
       |     (webServer starts http-server automatically)
       v
5. All tests pass
       |
       v
6. Run .docker/bin/build                   creates nginx Docker image
       |
       v
7. Run .docker/bin/run or skaffold dev     deploys to container/k8s
```

Steps 1-2 only apply if HTML composition is adopted. Without it, step 3 is the starting point.

Step 4 (E2E tests) can run at any point after step 3. In CI, the natural gate is: compose → test → build → deploy.

Steps 4 and 6 are independent of each other — you can run Docker build without running tests (though CI should enforce the gate). The Playwright `webServer` block means tests do not require Docker to be running.

---

## Scalability Considerations

These apply to the tooling architecture, not the application itself.

| Concern | Now (0 tests) | At 50 tests | At 500 tests |
|---------|---------------|-------------|--------------|
| Test startup time | N/A | ~5s (http-server + browser launch) | ~5s (parallel workers) |
| Test isolation | N/A | Cookie/localStorage state leak risk | Use `storageState` fixture or clear state in `beforeEach` |
| CI integration | N/A | Single `npx playwright test` command | Shard across workers with `--shard=1/4` |
| Fragment count | N/A (monolithic) | ~6-10 fragments | Consider sub-fragments for modals |

The main isolation risk: the application uses cookies for state. Playwright's browser contexts each get fresh cookies by default when using `browser.newContext()`. This is handled automatically if tests use `test()` (each test gets a fresh page context). Tests that share a `page` across a describe block must explicitly clear cookies.

---

## Sources

- Codebase analysis: `.docker/`, `.skaffold/`, `index.html`, `js/main.js` (direct inspection, HIGH confidence)
- Playwright `webServer` config: training knowledge cross-referenced with official docs structure (MEDIUM confidence — verify `reuseExistingServer` option name and `timeout` units against current Playwright docs before implementing)
- `http-server` port alignment: inferred from `.docker/bin/run` (`8080:80`) and `.skaffold/skaffold.yaml` (`localPort: 8080`) (HIGH confidence)
- Shell-based HTML composition: training knowledge; `cat` and heredoc patterns are POSIX-stable (HIGH confidence)
- Playwright `testDir` accepting hidden directories: training knowledge (MEDIUM confidence — test this; some tools skip dot-directories by default)
