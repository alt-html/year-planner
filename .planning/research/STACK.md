# Technology Stack — PWA Quality & Testing Tooling

**Project:** Year Planner
**Dimension:** E2E testing, HTML composition, SRI hardening
**Researched:** 2026-03-11
**Overall confidence:** MEDIUM (WebSearch and WebFetch blocked; findings from training data cross-checked against project codebase evidence where possible. Version numbers flagged LOW where unverified.)

---

## Context: The No-Build Constraint

The runtime must stay CDN-based. Everything in this stack is **dev-only tooling**: it runs on a developer's machine or in CI, never in the browser. The constraint is not "no node ever" but "no bundler in the production serving path." A `devDependencies`-only `package.json` in `.tests/` or a root-level dev manifest is acceptable and idiomatic.

Key principle from PROJECT.md: tooling should "feel like a natural extension of the existing workflow." Reject anything that pulls in webpack, Rollup, esbuild, or Vite as a dependency.

---

## Recommended Stack

### E2E Test Runner

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Playwright | 1.49+ (verify) | Browser E2E tests | See rationale below |

**Rationale — Playwright over alternatives:**

Playwright is the right choice for this project for three concrete reasons:

1. **No framework coupling.** Playwright tests against a running HTTP server; it does not care whether the app is Vue, React, or vanilla HTML. It navigates URLs and asserts DOM state. A CDN-assembled app with no build step is a first-class citizen.

2. **`webServer` config auto-starts a static server.** `playwright.config.js` has a `webServer` block that can start `npx http-server .` (or any command) before tests run and shut it down after. No separate terminal window, no manual coordination.

3. **Test isolation model matches this app's architecture.** The app stores state in cookies. Playwright's browser contexts can be created with empty storage (`storageState: {}`), giving hermetic test runs without a backend.

**What NOT to use and why:**

| Tool | Why Not |
|------|---------|
| Cypress | Heavier install (~500 MB), requires a separate runner process, historically slower; Playwright has matched or surpassed it on every axis since 2023. No advantage for this project. |
| WebdriverIO | More configuration surface, older WebDriver protocol (though it supports CDP too). Playwright's API is cleaner for assertion-heavy tests. |
| Puppeteer | No test runner built in; you'd add Jest/Mocha on top. Playwright subsumes Puppeteer and adds multi-browser + test runner. Strictly inferior choice here. |
| Vitest browser mode | Designed for unit/component tests in a Vite-transformed module graph. Requires Vite. Violates the no-build spirit. |
| Jest + jsdom | DOM simulation, not a real browser. CDN scripts do not execute in jsdom. Wrong tool entirely for a CDN-assembled app. |

**Confidence:** MEDIUM — Playwright's capability set and install model are well-established. The specific current version (1.49 was current as of early 2025; likely 1.5x by March 2026) should be verified before pinning in package.json.

---

### Static Server (for Playwright `webServer`)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `http-server` | ^14.x | Serve project root during E2E runs | Already used in project (Dockerfile-node-16-alpine); zero new conceptual weight |

**Rationale:** The project already uses `http-server` in its Docker dev setup (codebase STACK.md confirms `http-server (Node.js) - Simple static server for development`). Using the same tool in Playwright's `webServer` config keeps the mental model consistent.

Alternative `serve` (by Vercel) is equally viable and slightly more actively maintained, but `http-server` is the established choice here.

**Playwright `webServer` integration pattern:**
```javascript
// playwright.config.js
export default {
  webServer: {
    command: 'npx http-server . -p 3000 --cors',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://localhost:3000',
  },
};
```

**What NOT to use:** nginx — viable but requires Docker or a local install; adds operational complexity for a dev-only test runner. `http-server` as an npm devDependency is simpler and portable across developer machines and CI.

**Confidence:** HIGH — `http-server` is already in the project ecosystem.

---

### HTML Fragment Composition

**Recommendation: POSIX shell script (`build-html.sh`)**

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| POSIX shell (`/bin/sh`) | system | Assemble `index.html` from fragments | Zero dependencies, already available everywhere this project runs |

**Rationale:**

The project's stated preference is "something that feels like a natural extension of the existing workflow — possibly a shell script, a Makefile." A shell script using `cat` to concatenate fragment files into `index.html` matches this exactly.

Structure:
```
html/
  _head.html        # <head> block with CDN script tags
  _nav.html         # Vue navbar template
  _planner.html     # Year-grid template
  _modals.html      # Dialog templates
  _footer.html      # Scripts, CDI bootstrap
build-html.sh       # cat html/*.html > index.html
index.html          # Generated (gitignore or keep in repo)
```

The shell script approach has two key advantages for this project:
1. `build-html.sh` can also run the SRI-hash injection step (see below), making one `./build-html.sh` command handle both composition and hardening.
2. It works in CI (GitHub Actions, etc.) without installing anything.

**Alternatives evaluated:**

| Tool | Assessment | Verdict |
|------|-----------|---------|
| Makefile | Good for dependency tracking (only rebuild if fragments changed). Slightly more portable than `npm run build`. Adds no dependencies. | Viable, slightly more complex than needed for a single output file |
| `html-include` (npm) | Browser-level HTML include directive, not a build tool. Not applicable. | Wrong tool |
| Panini (Handlebars-based) | Requires npm, was built for Zurb Foundation. Adds ~50 transitive dependencies. Overkill. | Too heavy |
| `html-minifier-terser` | Minification, not composition. | Wrong tool |
| Eleventy (11ty) | Static site generator; could assemble HTML from partials. Node-based, well-maintained. | Violates no-build spirit; designed for sites with routing, not a single `index.html` |
| PostHTML | Node pipeline for HTML transformation. Legitimate option — `posthtml-include` plugin handles includes. ~10 deps total. | Viable second choice if shell feels too low-level |
| Gulp | Task runner. Would work but brings 200+ transitive deps just for file concatenation. | Too heavy |

**Second choice — `posthtml` with `posthtml-include`:**
If the team wants a more structured approach (e.g., handling variable interpolation in fragments, not just concatenation), `posthtml` + `posthtml-include` is the lightest npm-based option. Install size is ~15 packages vs Eleventy's 100+. Invocation: `node build.js` or `npx posthtml index.src.html -o index.html`.

**Confidence:** MEDIUM — Shell script approach is low-risk and well-understood. PostHTML version numbers should be verified (posthtml was at ~0.16.x in mid-2025; likely stable).

---

### SRI Hash Generation

**Recommendation: `hashcheck.js` — a minimal Node script using the built-in `crypto` module + `fetch`**

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Node.js `crypto` (built-in) | system Node | Generate sha384 hashes | Zero npm dependencies |
| `node-fetch` or Node 18+ `fetch` | built-in (Node 18+) | Download CDN resources for hashing | Available in Node 18+ without install |

**Rationale:**

SRI hash generation has one canonical workflow:
1. Fetch the CDN resource (the exact bytes, not a local copy).
2. Compute SHA-384 of the response body.
3. Base64-encode the result.
4. Write `integrity="sha384-<hash>"` into the `<script>` or `<link>` tag.

This can be done with ~40 lines of Node.js using only built-in modules (Node 18+), or with `node-fetch` for older Node. No npm package is needed.

**The script fits naturally into `build-html.sh`:**
```bash
node .tests/scripts/generate-sri.mjs  # writes hashes into assembled index.html
```

**Alternative tools:**

| Tool | Assessment | Verdict |
|------|-----------|---------|
| `sri-toolbox` (online) | Manual, not automatable | Development aid only, not for CI |
| `@rdfjs/fetch` / `node-fetch` | Would work but unnecessary on Node 18+ | Skip if Node 18+ available |
| `webpack-subresource-integrity` | Webpack plugin. Fundamentally wrong for this project — requires a webpack build graph. | Explicitly excluded |
| `vite-plugin-sri` | Same problem — Vite plugin. | Explicitly excluded |
| `gulp-sri-hash` | Gulp plugin. Brings gulp dependency. | Too heavy |
| `hashlib` (Python) | Would work if Python is available. Less portable than Node since the project already uses Node for http-server. | Viable fallback |

**Important SRI constraint:** SRI requires the CDN to serve the resource with `Access-Control-Allow-Origin: *` (or the same origin). jsDelivr, unpkg, cdnjs, and Google Fonts CDN all do this. The Square payment form (`js.squareup.com`) and Font Awesome kit URL (`kit.fontawesome.com`) likely do NOT support SRI because their content is dynamic or personalised. These tags cannot have SRI added without architectural changes.

**CDN script audit from `index.html` (lines 25-31):**

| URL | SRI feasible? | Notes |
|-----|--------------|-------|
| `cdn.jsdelivr.net/npm/vue@3/dist/vue.global.prod.js` | YES | jsDelivr serves with CORS headers; pin exact version |
| `unpkg.com/vue-i18n@9/dist/vue-i18n.global.prod.js` | YES | unpkg serves with CORS; pin exact version |
| `polyfill.io/v3/polyfill.min.js?features=...` | NO | Response is dynamic (browser UA-dependent). Cannot SRI. Consider self-hosting or removing (modern browsers don't need it). |
| `cdn.jsdelivr.net/npm/superagent` | YES | jsDelivr; pin version first |
| `kit.fontawesome.com/10808f8e76.js` | NO | Personalised kit URL; dynamic content. Cannot SRI. |
| `js.squareup.com/v2/paymentform` | NO | Third-party payment; dynamic; Square does not publish SRI hashes for this. |
| Bootstrap CSS `stackpath.bootstrapcdn.com` | YES — already has it | Line 16 already has `integrity="sha384-..."` — good! |

**Confidence:** HIGH for the overall approach. MEDIUM for exact Node API details (built-in fetch stabilised in Node 18.0; verify your CI Node version). LOW confidence that Square/FontAwesome feasibility will not change — verify against current documentation.

---

### XSS Audit Tooling

**Recommendation: Manual grep audit + ESLint with `eslint-plugin-vue`**

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `eslint` + `eslint-plugin-vue` | eslint ^8.x, plugin ^9.x | Static analysis for `v-html` usage | Catches `v-html` on user-supplied content; rules are Vue-aware |

**Rationale:**

The CONCERNS.md specifically flags: "User-supplied diary entry text rendered via Vue's v-html or direct interpolation in some places." The audit goal is:
1. Find every `v-html` in `index.html`.
2. Verify the value is never derived from user input without sanitization.
3. Find any `window.location` / URL param usage passed into Vue data.

`eslint-plugin-vue` has a `vue/no-v-html` rule that flags all `v-html` usage, forcing each instance to be reviewed. This is a one-time audit tool; the rule can be disabled after review with inline `// eslint-disable` comments on known-safe uses.

This is dev-only tooling, not a build step.

**What NOT to use:**
- `DOMPurify` in the build — this is a runtime sanitization library, not an audit tool. Separately, it should be evaluated as a runtime addition if `v-html` with user content is confirmed.
- Automated XSS scanners (OWASP ZAP, etc.) — too heavy for a focused audit of a single-page app with known template structure.

**Confidence:** MEDIUM — `eslint-plugin-vue` is well-established (maintained by the Vue core team). Version pinning should be verified.

---

## Summary: What Goes in `package.json`

Since the project has no `package.json`, the tests introduce a dev-only one. It belongs in `.tests/` (or `.playwright/`) to honour the "unobtrusive, hidden directory" requirement from PROJECT.md.

```json
{
  "name": "year-planner-tests",
  "private": true,
  "description": "Dev-only E2E testing. Not part of the production runtime.",
  "devDependencies": {
    "@playwright/test": "^1.49.0",
    "http-server": "^14.1.1",
    "eslint": "^8.57.0",
    "eslint-plugin-vue": "^9.30.0"
  },
  "scripts": {
    "test": "playwright test",
    "test:headed": "playwright test --headed",
    "sri": "node scripts/generate-sri.mjs",
    "lint:xss": "eslint --plugin vue --rule 'vue/no-v-html: warn' ../../index.html"
  }
}
```

Note: `http-server` is listed as a devDependency here so CI can install it without a global install. Playwright's `webServer` config will invoke it via `npx`.

**What is NOT in this package.json:**

| Excluded | Reason |
|----------|--------|
| webpack / Rollup / esbuild / Vite | Bundlers. Violate no-build spirit. |
| Babel / TypeScript | Transpilers. Runtime is vanilla ES6 — no transformation needed. |
| Jest / Vitest | Test runners. Playwright is the test runner. |
| Cypress | Heavier alternative to Playwright, no benefit here. |
| Eleventy / Hugo / Jekyll | Static site generators. Too heavy for single-file assembly. |
| Gulp / Grunt | Task runners. Shell script handles the one task needed. |
| PostCSS / autoprefixer | CSS tooling. Not in scope for this milestone. |

---

## Alternatives Considered (Full Table)

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| E2E runner | Playwright | Cypress | Heavier, slower startup, no benefit for a CDN-served static app |
| E2E runner | Playwright | Puppeteer | No built-in test runner; Playwright subsumes it |
| E2E runner | Playwright | WebdriverIO | More config surface, older default protocol |
| Static server | http-server | serve (Vercel) | Equally valid; http-server already in project ecosystem |
| Static server | http-server | nginx | Requires Docker or local system install; adds operational burden |
| HTML composition | Shell script | Makefile | Slightly more complex for single-output use case |
| HTML composition | Shell script | PostHTML | Viable if variable interpolation needed; 10x more deps than shell |
| HTML composition | Shell script | Eleventy / 11ty | SSG overkill; 100+ transitive deps |
| HTML composition | Shell script | Panini | Bundled with Foundation, 50+ deps, unmaintained |
| SRI generation | Node `crypto` (built-in) | `hashlib` (Python) | Python not guaranteed present; Node already required |
| SRI generation | Node `crypto` (built-in) | webpack-subresource-integrity | Requires webpack. Hard no. |
| XSS audit | `eslint-plugin-vue` | OWASP ZAP | Automated scanner; overkill for template audit |
| XSS audit | `eslint-plugin-vue` | Manual only | eslint gives repeatable, documented evidence |

---

## Installation

```bash
# In .tests/ (or .playwright/)
npm install

# Install Playwright browsers (one-time per machine/CI)
npx playwright install --with-deps chromium

# Run tests
npm test

# Generate SRI hashes (run after pinning CDN versions)
npm run sri

# XSS audit
npm run lint:xss
```

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| Playwright as E2E runner | MEDIUM | Architecture and capabilities are well-established; exact current version (1.49+) unverified due to tool access restrictions |
| `webServer` config pattern | MEDIUM | This feature has been stable since Playwright 1.10 (mid-2022); pattern is reliable |
| `http-server` as static server | HIGH | Already in project ecosystem; behaviour well-known |
| Shell script for HTML composition | HIGH | POSIX shell, no dependencies, cannot become stale |
| PostHTML as composition alternative | LOW | Last confirmed version ~0.16.x mid-2025; verify before adopting |
| Node `crypto` for SRI | HIGH | Built-in Node module, stable API |
| `fetch` as built-in (Node 18+) | MEDIUM | Stabilised in Node 18.0; verify CI Node version |
| SRI feasibility per CDN | MEDIUM | CORS policies for jsDelivr/unpkg are well-documented; Square/FontAwesome SRI infeasibility based on their dynamic serving model — verify |
| `eslint-plugin-vue` for XSS audit | MEDIUM | Maintained by Vue core team; version number unverified |

---

## Sources

All findings from training data (knowledge cutoff August 2025). External verification was blocked during this research session.

**Authoritative sources to verify before implementation:**
- Playwright releases and changelog: https://playwright.dev/docs/release-notes
- Playwright `webServer` config docs: https://playwright.dev/docs/test-webserver
- http-server npm page: https://www.npmjs.com/package/http-server
- jsDelivr CORS policy: https://www.jsdelivr.com/features (look for SRI/CORS section)
- MDN SRI reference: https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity
- eslint-plugin-vue rules: https://eslint.vuejs.org/rules/no-v-html.html
- PostHTML: https://github.com/posthtml/posthtml
