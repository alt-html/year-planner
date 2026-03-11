# Domain Pitfalls

**Domain:** CDN-first no-build PWA — adding Playwright E2E tests, HTML composition, SRI, and XSS hardening
**Researched:** 2026-03-11
**Confidence:** HIGH (grounded in codebase inspection + known Playwright and browser-security patterns)

---

## Critical Pitfalls

Mistakes that cause rewrites, test suite abandonment, or security regressions.

---

### Pitfall 1: Playwright Tests That Require a Local Server But the Project Has None

**What goes wrong:** Playwright's `webServer` config assumes a dev server command (e.g. `npm run dev`). This project has no `package.json`, no dev server, and no build step. If tests are written assuming `http://localhost:3000` served by a Node process, every developer needs to stand up their own server first — and CI breaks without extra setup.

**Why it happens:** Playwright documentation leads with `webServer` configuration because that's the common case. Developers copy it without questioning whether it applies.

**Consequences:** Either the test suite only runs after manual server setup (reducing adoption), or a real build dependency — a Node HTTP server — gets introduced, which is the first crack in the no-build principle.

**Prevention:**
- Use `file://` protocol or Playwright's built-in static server (`npx playwright test --serve`). Playwright 1.32+ supports `webServer: { command: 'npx serve .', url: 'http://localhost:3000' }` where `serve` (a zero-config static file server) is the only Node binary needed and is a dev-only concern.
- Alternatively: configure `playwright.config.js` with `use: { baseURL: 'http://localhost:8080' }` and document that any static file server works (`python -m http.server 8080`, `npx serve`, Docker Nginx).
- The config file itself lives in `.tests/` (or `.playwright/`) per the project's hidden-tooling convention — never in the project root.

**Warning signs:**
- `playwright.config.js` references `npm run` in `webServer.command`
- CI config installs more than `@playwright/test` and a static file server
- A `package.json` appears in the project root

**Phase:** Testing setup phase (Playwright bootstrap)

---

### Pitfall 2: CDI Async Initialization Breaks Test Timing

**What goes wrong:** `js/main.js` calls `await applicationContext.start()` before mounting Vue. If Playwright navigates to the page and immediately queries DOM elements, the Vue app may not be mounted yet — CDI startup is async and has no deterministic "ready" signal exposed to the DOM.

**Why it happens:** Tests assume synchronous page load. The Vue `mounted()` hook fires only after CDI completes, which depends on all CDN imports resolving and all CDI-registered services instantiating. On a slow network or cold CDN cache, this takes 2–5 seconds.

**Consequences:** Flaky tests that fail intermittently. Developers add `page.waitForTimeout(2000)` as a workaround, which makes the suite slow and masks real timing problems.

**Prevention:**
- Add a DOM readiness signal: once `Application.run()` completes, write a known attribute to `document.body` (e.g. `data-app-ready="true"`). Playwright tests wait on `page.waitForSelector('[data-app-ready]')` before interacting.
- This requires one small code change in `Application.js` — acceptable, minimal, reversible.
- Never use `waitForTimeout` as a substitute; use `waitForSelector` or `waitForFunction`.

**Warning signs:**
- Test file contains `page.waitForTimeout(N)`
- Tests pass locally but fail in CI (CI fetches CDN cold)
- Tests must be re-run to pass

**Phase:** Testing setup phase (Playwright bootstrap)

---

### Pitfall 3: CDN Unavailability During Tests Makes the Suite Unreliable

**What goes wrong:** This app loads 12+ libraries from CDN at runtime, including from `cdn.jsdelivr.net`, `unpkg.com`, `polyfill.io`, `fonts.googleapis.com`, `kit.fontawesome.com`, and `js.squareup.com`. Playwright tests that hit a live CDN will fail when any CDN is slow, rate-limiting, or down. CI pipelines in isolated network environments (e.g. GitHub Actions with restricted outbound) may block CDN requests entirely.

**Why it happens:** No-build means no local bundling — CDN URLs are load-bearing at test time as much as at runtime.

**Consequences:** CI is unreliable. Tests report failures that are CDN outages, not code bugs.

**Prevention:**
- Use Playwright's network interception (`page.route()`) to cache or mock CDN responses for the libraries that are stable and well-known (Vue, Bootstrap, Luxon, lodash-es, LZString). This is a whitelist approach: intercept known CDN URLs and serve from a local `fixtures/` directory.
- For the `polyfill.io` URL specifically: this CDN had a documented supply-chain compromise in 2024. It must be removed or replaced (Cloudflare's `cdnjs` hosts the same polyfills). Do not intercept and cache it — remove the dependency.
- FontAwesome Kit (`kit.fontawesome.com`) uses a personalized kit ID. It can be replaced with the public CDN version for tests or intercepted with a stub that returns an empty stylesheet.

**Warning signs:**
- Tests that only fail in CI or on specific networks
- `page.route()` is not used anywhere in test setup
- The `polyfill.io` script tag is still present in `index.html`

**Phase:** Testing setup phase; also CDN/SRI hardening phase

---

### Pitfall 4: HTML Composition Scope Creep — Shell Script Grows Into a Build System

**What goes wrong:** A shell script or Makefile that starts as `cat header.html body.html footer.html > index.html` gradually acquires: environment variable substitution, conditional includes for dev vs. production, minification, SRI hash injection, CSS concatenation, and a watch mode. By the time this happens, the project has an undocumented bespoke build system that is harder to understand than Vite.

**Why it happens:** Each new requirement sounds small ("just add a flag for the CDN URL in dev vs. prod"). The accretion happens across multiple milestones with no single moment of decision.

**Consequences:** The "no-build" principle is violated in spirit while being maintained in name. New contributors cannot understand how `index.html` is generated without reading the build script. The monolithic `index.html` (the original concern) is replaced by a monolithic build script.

**Prevention:**
- Define the composition tool's scope in a single sentence before implementing it: "Assemble `index.html` from HTML fragment files. No logic, no templating, no environment branching."
- Enforce that sentence as a constraint: if a proposed change to the build script requires more than concatenation and comment stripping, it is out of scope — push complexity into the fragment files themselves or into runtime JS.
- Prefer a Makefile with a single `build` target over a shell script — Makefile targets are more composable and self-documenting.
- The output `index.html` must be committed to the repository as a first-class file. Developers can always edit it directly without running the composition step.

**Warning signs:**
- Build script contains `if`, `case`, or environment variable reads
- A `--watch` flag is added to the build script
- `index.html` is added to `.gitignore`
- The script exceeds ~30 lines

**Phase:** HTML composition research and implementation phase

---

### Pitfall 5: SRI Hash Drift — Hashes Go Stale After CDN URL Updates

**What goes wrong:** SRI `integrity` attributes are computed against a specific file at a specific URL at a point in time. When a CDN URL contains no version pin (e.g. `cdn.jsdelivr.net/npm/superagent` without a version), the CDN may silently serve a newer file while the hash in `index.html` remains the old one. The browser rejects the resource with an SRI violation, causing a silent or console-only failure.

**Specific instances in this codebase:**
- `https://cdn.jsdelivr.net/npm/superagent` — no version pin, no SRI hash
- `https://cdn.jsdelivr.net/npm/vue@3/...` — major-pinned (`@3`), no SRI hash; a new minor or patch release changes the file
- `https://cdn.jsdelivr.net/npm/@alt-javascript/cdi/...` — no version pin, no SRI hash
- `https://cdn.jsdelivr.net/npm/@alt-javascript/config@2/...` — major-pinned
- `https://cdn.jsdelivr.net/npm/@alt-javascript/cookies/...` — no version pin at all

**Why it happens:** SRI hashes are added once as a security measure, then forgotten. CDN URLs are updated to a new feature version without recalculating the hash.

**Consequences:** Production app breaks silently (SRI violation errors appear in the browser console but the app shows a blank screen or partial render). The breakage may not be noticed for hours if there is no monitoring.

**Prevention:**
- Pin every CDN URL to an exact patch version before computing the hash: `vue@3.4.21`, `superagent@9.0.2`, etc. This is a prerequisite for stable SRI hashes.
- Use `https://www.srihash.org/` or `openssl dgst -sha384 -binary [file] | openssl base64 -A` to compute hashes.
- The HTML composition step (if implemented) is the right place to automate SRI hash computation — but only after versions are pinned.
- The FontAwesome Kit URL (`kit.fontawesome.com/10808f8e76.js`) cannot have a stable SRI hash because FontAwesome dynamically generates kit scripts. Replace with a pinned version from `cdnjs.cloudflare.com/ajax/libs/font-awesome/`.

**Warning signs:**
- Any CDN URL in `index.html` lacks an explicit patch version in the URL path
- `integrity` attribute is absent on any `<script>` or `<link>` tag loading from a CDN
- The FontAwesome Kit URL is still in use when SRI is added

**Phase:** CDN/SRI hardening phase

---

### Pitfall 6: SRI Breaks the `polyfill.io` Script (Which Should Be Removed Anyway)

**What goes wrong:** `polyfill.io` was compromised in mid-2024 — the domain was transferred to a new owner who injected malicious code. Adding an SRI hash to the existing URL would lock in whatever is currently served, which may itself be compromised content. The correct action is removal, not hashing.

**Why it happens:** The reflex when adding SRI is to hash what is already there. Auditing whether the CDN itself is trustworthy is a separate step that is easy to skip.

**Consequences:** Hashing a compromised script gives false confidence. The SRI hash prevents future tampering by the CDN but does not protect against the already-malicious content that was hashed.

**Prevention:**
- Remove the `polyfill.io` script tag from `index.html` before the SRI phase.
- The polyfilled features (`Array.from`, `Promise`, `Symbol`, `Object.setPrototypeOf`, `Object.getOwnPropertySymbols`) are natively supported in all browsers targeted by this app (modern browsers, per PROJECT.md). The polyfill is likely vestigial.
- If polyfilling is genuinely needed, use `cdnjs.cloudflare.com` with a pinned version and SRI hash.

**Warning signs:**
- The `polyfill.io` URL is still present in `index.html` during or after the SRI phase
- An `integrity` attribute is added to the `polyfill.io` script tag

**Phase:** CDN/SRI hardening phase (prerequisite: remove polyfill.io before adding SRI)

---

### Pitfall 7: XSS via Bootstrap Tooltip `data-original-title` With User Entry Text

**What goes wrong:** Line 197 of `index.html` passes user entry text directly into `data-original-title` via Vue's `v-bind`:

```html
v-bind:data-original-title="getEntryTypeIcon(mindex,n)+' ' +getEntry(mindex,n).trimStart()"
```

`getEntryTypeIcon` returns a raw HTML string (`<i class="fas fa-bell"></i>`). The `data-html="true"` attribute on the same element tells Bootstrap's tooltip to render the title as HTML, not as text. This means user entry text that reaches the tooltip is rendered as HTML — a stored XSS vector if entry text contains `<script>` tags or event handlers.

**Why it happens:** The icon concatenation requires HTML (to render the `<i>` tag), so `data-html="true"` was added. The entry text was then concatenated into the same string without HTML-encoding it.

**Consequences:** Any user who can store a diary entry (all users) can inject HTML that executes in another user's browser when they view a shared planner. This is a stored XSS vulnerability for the share-planner feature.

**Prevention:**
- HTML-encode the user entry text portion before concatenating: replace `<`, `>`, `"`, `'`, `&` with their HTML entities.
- Alternatively, separate the icon from the entry text — render the tooltip title without `data-html="true"` and use a different mechanism (e.g. a custom tooltip component) for the icon.
- The XSS audit phase must specifically test this tooltip with `<img src=x onerror=alert(1)>` as entry text in a shared planner.

**Warning signs:**
- Tooltip renders raw HTML from user-supplied content
- `data-html="true"` is present alongside user content in the same attribute
- XSS audit tests only the entry modal, not the calendar cell tooltips

**Phase:** XSS audit phase

---

### Pitfall 8: Over-Aggressive HTML Escaping Breaks i18n Interpolation

**What goes wrong:** Vue-i18n v9 supports named interpolation with HTML in translation messages (e.g. `$t('label.foo', { name: '<b>John</b>' })`). If a global HTML-escaping helper is applied to all output — for example as a Vue filter or a utility function wrapping all `getEntry` calls — it will double-encode entities in i18n strings that are legitimately using HTML.

**Why it happens:** An XSS fix adds escaping at the wrong layer (output encoding applied after i18n interpolation rather than at the point of storing user input).

**Consequences:** Translated strings display as literal `&lt;b&gt;John&lt;/b&gt;` in the UI. This is most likely to affect languages that use special characters the escaper incorrectly encodes (Arabic, Chinese, Japanese) or messages that include formatted fragments.

**Prevention:**
- Escape user-supplied data at the point it enters the system (storage), not at the point of rendering.
- Vue's `{{ expression }}` syntax already HTML-encodes output by default — the XSS risk is specifically in `v-html` usage and the `data-original-title` Bootstrap tooltip case (Pitfall 7). The fix is surgical, not a global escaping layer.
- i18n message strings in `js/vue/i18n/` are developer-controlled and should not be HTML-escaped by application code.
- After any XSS fix, run the app with at least AR (Arabic), ZH (Chinese), and JA (Japanese) active and verify that month names, day names, and all modal text display correctly.

**Warning signs:**
- A utility function named `escapeHtml`, `sanitize`, or similar is called inside `$t()` wrappers or i18n message loaders
- Month or day names display garbled entities in non-Latin scripts after an XSS fix
- The fix modifies `model.js` or `controller.js` globally rather than targeting `getEntry` output in tooltip context

**Phase:** XSS audit phase

---

## Moderate Pitfalls

---

### Pitfall 9: No-Build Principle Eroded by Test Infrastructure Dependencies

**What goes wrong:** Playwright requires Node.js and is installed via npm. Once `npm install` is accepted for test tooling, the path of least resistance is to use npm for other things: a linter, a formatter, a CSS preprocessor. Each addition is individually reasonable; collectively they reconstitute the build pipeline that was deliberately avoided.

**Why it happens:** The psychological barrier is crossed the first time `package.json` appears. After that, each new tool feels like a small incremental step.

**Consequences:** Within 2-3 milestones the project has a `node_modules` directory, a `package.json` with 15 dev dependencies, and an implicit assumption that Node is required to work on the project — defeating the original CDN-first simplicity goal.

**Prevention:**
- Enforce a strict separation: test tooling (Playwright) lives in `.tests/` and has its own `package.json` inside that directory. The project root has no `package.json`.
- Any tool added to the test directory must have a documented reason for why it cannot be replaced with a CDN resource or a shell one-liner.
- In code review, treat additions to `.tests/package.json` as significant decisions, not routine housekeeping.
- The `node_modules` directory inside `.tests/` is gitignored; it never appears in the project root.

**Warning signs:**
- A `package.json` appears at the project root
- A linter or formatter is added "while we're already using npm"
- CI steps reference `npm install` at the repository root (not inside `.tests/`)

**Phase:** All phases involving dev tooling

---

### Pitfall 10: `window.location.href` Redirects in Controller Break Playwright Navigation Tests

**What goes wrong:** The controller calls `window.location.href = ...` directly in several methods (`refresh`, `createLocalPlanner`, `navigateToYear`). Playwright's `page.click()` triggers these redirects, which navigate away from the test page. Tests that expect to stay on the same page fail or end up in unexpected states.

**Why it happens:** The controller was written for browser interaction where full-page redirects are normal. Playwright treats navigation as an event to wait for, not a side effect to ignore.

**Consequences:** Tests for planner creation, year navigation, and theme switching require explicit `await page.waitForNavigation()` calls. Tests written without this fail intermittently depending on network speed.

**Prevention:**
- In Playwright tests, always wrap interactions that trigger `window.location.href` changes in a `Promise.all([page.waitForNavigation(), page.click(...)])` pattern.
- Document this pattern in a test helper comment so future test authors know to use it.
- Consider whether a "soft" navigation (updating URL parameters without full reload using `history.pushState`) would be better for UX and testability — but only if it doesn't conflict with the app's URL-parameter-driven initialization model.

**Warning signs:**
- Tests for create/rename/navigate planner pass locally but timeout in CI
- Test file contains bare `page.click()` without `waitForNavigation` for actions that redirect

**Phase:** Testing implementation phase

---

### Pitfall 11: Timestamp-Based UID Collisions Affect Test Isolation

**What goes wrong:** `createLocalPlanner()` uses `Math.floor(DateTime.now().ts/1000)` — a Unix timestamp at second precision — as the planner UID. Automated tests that create multiple planners within the same second (common in fast E2E suites) produce duplicate UIDs, causing planner data to overwrite each other silently.

**Why it happens:** In normal human use, creating two planners within the same second is impossible. In tests running at machine speed, it is routine.

**Consequences:** Tests that create multiple planners fail with silent data corruption rather than clear errors. The bug appears to be a test isolation problem when it is actually a UID generation problem surfaced by testing.

**Prevention:**
- Test helpers that create planners should include a small timestamp offset between creations, or mock `DateTime.now()` to return distinct values.
- Alternatively, fix the UID generation to use millisecond precision (`DateTime.now().ts` without the `Math.floor(.../ 1000)` truncation) — this is a genuine production bug that tests will reveal.
- Do not work around the UID collision in tests without also filing it as a production concern (as noted in CONCERNS.md).

**Warning signs:**
- Tests that create multiple planners fail with "planner already exists" or silent data overwrite
- The UID collision manifests only in automated tests, not in manual testing

**Phase:** Testing implementation phase; also surfaced during planner management testing

---

## Minor Pitfalls

---

### Pitfall 12: FontAwesome Kit Cannot Have SRI

**What goes wrong:** The current FontAwesome load uses a kit URL (`https://kit.fontawesome.com/10808f8e76.js`). Kit scripts are dynamically generated per-kit and change when icons are added or the kit configuration changes — they cannot have a stable SRI hash.

**Prevention:** Replace with a pinned version from `cdnjs.cloudflare.com/ajax/libs/font-awesome/` during the SRI phase. The version used should match the icons currently referenced in the codebase (FA 5.x or 6.x — verify by checking which icon classes are used in `getEntryTypeIcon`).

**Phase:** CDN/SRI hardening phase

---

### Pitfall 13: `document.execCommand("copy")` Is Deprecated

**What goes wrong:** `controller.js` line 184 uses `document.execCommand("copy")` for the share URL copy feature. This API is deprecated and may be removed in future browser versions.

**Prevention:** Replace with `navigator.clipboard.writeText()`. Note that Clipboard API requires a secure context (HTTPS or localhost) — relevant for test setup. Playwright tests for the copy feature must either mock the Clipboard API or run under HTTPS.

**Phase:** Minor cleanup; note in testing that clipboard interaction requires `page.context().grantPermissions(['clipboard-read', 'clipboard-write'])` in Playwright.

---

### Pitfall 14: HTML Fragment Composition Breaks Vue Template Parsing if Fragments Contain Unmatched Tags

**What goes wrong:** If `index.html` is split into fragments and a fragment boundary falls inside a Vue template (e.g. inside `<template v-for="...">...</template>`), concatenation may produce invalid HTML or HTML that Vue's template compiler rejects at runtime.

**Prevention:** Fragment boundaries must fall at logical HTML block boundaries, never inside Vue template directives. A simple rule: each fragment must be valid standalone HTML (pass an HTML validator independently). Test the concatenated output by loading it in a browser before committing.

**Phase:** HTML composition implementation phase

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Playwright bootstrap | No dev server / requires Node | Use static file server only in `.tests/`; keep project root Node-free |
| Playwright bootstrap | CDI async startup, flaky timing | Add `data-app-ready` DOM signal; use `waitForSelector` not `waitForTimeout` |
| Playwright bootstrap | CDN unavailability in CI | Use `page.route()` to intercept and serve known CDN libraries locally |
| Testing implementation | `window.location.href` redirects | Use `Promise.all([waitForNavigation, click])` pattern |
| Testing implementation | Timestamp UID collisions | Offset planner creation times in tests; note as production bug |
| HTML composition | Scope creep toward build system | Hard-limit to concatenation only; commit `index.html` to repo |
| HTML composition | Fragment boundary inside Vue template | Only split at block boundaries; validate each fragment independently |
| CDN/SRI hardening | Hash drift from unpinned versions | Pin to exact patch version before computing hash |
| CDN/SRI hardening | `polyfill.io` compromise | Remove entirely before SRI phase; verify polyfill is vestigial |
| CDN/SRI hardening | FontAwesome Kit incompatible with SRI | Switch to pinned cdnjs version |
| XSS audit | Tooltip `data-original-title` with `data-html="true"` | HTML-encode entry text portion; test with `<img onerror>` payload |
| XSS audit | Over-aggressive escaping breaks i18n | Fix at storage layer, not render layer; verify AR/ZH/JA output after fix |
| All tooling phases | No-build principle erosion | Test tooling `package.json` stays inside `.tests/`; never in project root |

---

## Sources

- Codebase inspection: `index.html`, `js/vue/controller.js`, `js/util/urlparam.js`, `js/main.js`, `js/config/contexts.js`, `js/service/*.js` (inspected 2026-03-11)
- `.planning/codebase/CONCERNS.md` — existing known issues, CDN trust concerns
- `.planning/PROJECT.md` — no-build constraint, hidden tooling directory requirement
- Playwright documentation patterns (training knowledge, HIGH confidence for timing/navigation patterns)
- polyfill.io supply chain compromise: documented public incident, mid-2024 (HIGH confidence)
- Vue-i18n v9 interpolation behavior: HIGH confidence (well-documented official API)
- Bootstrap `data-html` tooltip XSS pattern: HIGH confidence (standard browser security)
- SRI hash mechanics: HIGH confidence (W3C spec, well-established browser behavior)
