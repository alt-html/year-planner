# Feature Landscape

**Domain:** E2E test suite, security hardening, and HTML composition for a vanilla ES6 + Vue 3 PWA year planner
**Researched:** 2026-03-11
**Confidence note:** WebSearch and WebFetch were unavailable. Findings are derived from codebase analysis (HIGH confidence on app-specific items) and training-data knowledge of Playwright and PWA security patterns (MEDIUM confidence, flagged where relevant). No external verification was possible in this session.

---

## Table Stakes

Features that must be present or the milestone fails. Missing any of these means the milestone deliverable is incomplete.

### E2E Test Suite (Playwright)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **App bootstrap smoke test** | Without it, no test run is valid — CDI init failure silently leaves a blank page | Low | Assert `model.loaded == true` via a DOM marker; CDI init is fragile (see CONCERNS.md) |
| **Calendar grid renders for current year** | The primary UI surface; must show 12 months × weeks matrix | Low | Assert month headers, week rows, and at least one day cell visible |
| **Year navigation (prev/next/direct input)** | Core navigation — a wrong year means all entries are wrong | Low | `navigateToYear()` rewrites `window.location.href`; test must handle navigation |
| **Entry CRUD — create** | Write a diary entry to a day cell | Medium | Involves clicking a cell, typing in entry modal, saving; entry persisted to cookies |
| **Entry CRUD — read** | Entry text visible on the grid after save | Low | Assert text appears in the day cell after write |
| **Entry CRUD — update** | Edit existing entry and confirm change | Medium | Re-open the cell entry modal with pre-populated text |
| **Entry CRUD — delete (clear)** | Clear entry text and verify cell empties | Medium | Clearing entry to empty string must update the cell |
| **Entry type selection** | Icons (bell, birthday, etc.) are set per entry | Low | `getEntryTypeIcon` returns raw HTML injected via v-html — test that the icon class appears |
| **Cookie acceptance gate** | First-visit modal must be dismissed before any data is stored | Low | `cookiesAccepted()` controls all storage writes; test must accept cookies first |
| **Create new planner** | Creates a new UID, redirects, renders fresh grid | Medium | `createLocalPlanner()` rewrites `window.location.href` — test must await navigation |
| **Rename planner** | Name persists in preferences | Medium | Involves `$('#rename').show()` (jQuery), then input and save |
| **Auth — register flow** | Core path for cloud sync users | High | Requires a live test API or mock; Bootstrap modal interaction + API call |
| **Auth — signin flow** | Core path for returning users | High | Basic auth to API; on success, redirect occurs |
| **Auth — signout** | Session cleared; returns to anonymous state | Medium | Wipe of remote identities + redirect |
| **Share — generate share URL** | Core differentiator; share modal must populate a compressed URL | Medium | `sharePlanner()` uses `document.execCommand('copy')` (deprecated) — assert URL format |
| **Share — load from share URL** | A `?share=` URL must reconstruct a planner | High | Full round-trip: export → navigate to share URL → assert entries visible |
| **Sync — manual sync to remote** | Registered users can push planners to backend | High | Requires test API or intercept; assert success indicator |
| **Network error feedback** | Sync failure must surface a visible user message | Medium | Currently silent (see CONCERNS.md); test asserts error message is displayed after mock failure |
| **Input validation — entry length** | Oversized entry text must be rejected at client | Low | No current validation; milestone adds it — test the boundary |
| **Input validation — auth fields** | Empty username/password must show inline error | Low | `modalErr()` exists; test that error targets are rendered |
| **SRI hashes present in index.html** | All CDN `<script>` and `<link>` tags must have `integrity` attributes | Low | Playwright `page.content()` + assertion, or direct file inspection in CI |
| **XSS — entry text escaping** | User text in entries must not execute as HTML | Medium | Inject `<img src=x onerror=window.__xss=1>` as entry; assert `window.__xss` is undefined |
| **Playwright config lives in `.tests/`** | Obtrusive tooling violates project constraint | Low | `playwright.config.js` and test files in `.tests/`; `package.json` script points there |

---

### Security Hardening

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **SRI on all CDN resources** | Supply chain risk is explicit in CONCERNS.md; CDN compromise = full code execution | Medium | Must cover: Vue, Luxon, Lodash-ES, LZ-String, UUID, all @alt-javascript/* modules, Bootstrap CSS + JS, Popper, Font Awesome kit, Polyfill.io |
| **Consistent XSS escaping in Vue templates** | `getEntryTypeIcon()` returns raw HTML injected via `v-html`; user text must NOT use v-html | Medium | Audit all `v-html` uses; entry text must use `{{ }}` interpolation (auto-escaped) |
| **URL param sanitization** | `urlparam.js` returns decoded strings passed directly into app state (uid, year, lang, theme, share) | Medium | `?share=` parameter feeds directly into `importLocalPlanner` — must validate before use |
| **Visible error on network failure** | Silent promise rejection on sync/auth failure is current behaviour (CONCERNS.md) | Low | Catch blocks in `Api.js` must update `model.error` or `model.modalError`; existing partial pattern |
| **Input length enforcement — entry text** | No client-side max length; cookie storage is 4KB limited — oversized entries cause silent truncation | Low | Add `maxlength` attribute + JS validation in entry modal |
| **Input format enforcement — auth fields** | Username/email/password only validated server-side | Low | Client-side regex or HTML5 validation attributes |

---

### Unobtrusive Test Tooling

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Tests in `.tests/` hidden directory** | Explicit project constraint — mirror `.docker/`, `.skaffold/` pattern | Low | `testDir: '.tests'` in `playwright.config.js`; config file itself lives in `.tests/playwright.config.js` |
| **Minimal config surface** | CDN-first spirit; no webpack/jest/vitest config sprawl | Low | Single `playwright.config.js`; no `babel.config`, no `jest.config`, no `tsconfig` |
| **`npm test` script with no build step** | Tests must run against a served HTML file, not a compiled bundle | Low | `playwright test --config .tests/playwright.config.js`; `webServer` block in config starts `http-server` or `npx serve` |
| **Test state isolation via cookies** | Each test must start clean; cookie-based storage requires `context.clearCookies()` before each test | Medium | Playwright browser context `storageState`; use `test.beforeEach` with `context.clearCookies()` and `context.clearLocalStorage()` |

---

## Differentiators

Features that add value but are not milestone-critical.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Page Object Model (POM)** | Isolates selectors from test logic; when index.html changes, only one place updates | Medium | For a CDN SPA with inline templates, a thin POM per modal (EntryModal, AuthModal, ShareModal) is sufficient; not a full Playwright component model |
| **API mock / intercept layer** | Enables auth/sync tests without a live backend | High | Playwright `page.route()` can intercept superagent XHR calls; mock `PUT /api/planner`, `GET /api/planner`, `POST /api/planner/{uid}`; HIGH value for CI reliability |
| **Visual regression snapshots** | Catch grid layout regressions across browsers | High | Playwright `page.screenshot()` + `toMatchSnapshot()`; useful for responsive collapse testing |
| **Multi-browser matrix** | PWA must work in Chromium, Firefox, WebKit | Medium | Playwright `projects` config; Chromium is sufficient for smoke; full matrix for release |
| **Accessibility assertions** | WCAG baseline for a multi-lingual, responsive app | Medium | `@axe-core/playwright` package; run on calendar grid and modal flows |
| **i18n smoke tests** | With 10 languages, a broken message key is easy to miss | Low | Load app with `?lang=zh`, `?lang=ar` (RTL); assert month headers render without `[missing key]` strings |
| **Dark theme smoke test** | Theme is user-configurable; CSS class application is code-path tested | Low | Load with `?theme=dark`; assert `document.body` has `.yp-dark` class |
| **Year boundary test (Dec → Jan)** | Off-by-one risk in date math (CONCERNS.md) | Medium | Navigate from December of year N to January of year N+1; assert correct month header |
| **Cookie overflow detection test** | Silent data loss at 4KB limit is a known risk | High | Not currently catchable in E2E without instrumenting storage layer; flag for later |
| **CSP header assertion** | Content Security Policy enforced by server | Medium | Assert via `page.on('response')` that `Content-Security-Policy` header is present; server-side config, not app code |
| **`document.execCommand` deprecation guard** | `copyUrl()` uses deprecated clipboard API | Low | Test clipboard copy in Chromium; assert text is in clipboard or fallback message shown |

---

## Anti-Features

Things to deliberately NOT build in this milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Unit test framework (Jest / Vitest)** | Explicit out-of-scope in PROJECT.md; complex logic goes into `@alt-javascript` modules with their own suites | E2E tests at browser level cover the same surface implicitly |
| **Build-step test compilation** | Violates CDN-first principle; tests must run against the same plain HTML served in production | Use Playwright's native ES module support; no transpilation |
| **`package.json` at project root for test deps** | Would introduce `node_modules` at root, polluting the project | Keep `package.json` inside `.tests/`; or use a global Playwright install |
| **Mocking Vue internals / CDI container** | CDI init is fragile; mocking it masks real breakage | Test against actual CDI bootstrap; let the boot failure be a real test signal |
| **Testing payment (Square donation) flow** | Square SqPaymentForm is a legacy API being replaced; live payment testing requires sandbox creds and is unstable | Document as excluded; verify Square iframe renders (not payment execution) |
| **Automated email verification testing** | Requires live email service or complex mock SMTP | Mark email flows as manual acceptance criteria |
| **Snapshot testing of i18n text content** | 10 languages × 12 months = unmaintainable snapshots | Use structural assertions (correct number of cells) not text matching |
| **Testing `window.ftoggle` feature flags** | Debug/dev utility; not a user-facing feature path | Exclude from test suite; it has no visual consequence worth asserting |
| **HttpOnly / Secure cookie flag testing** | These are server-enforced; Playwright cannot read HttpOnly cookies by design | Delegate to server config; note in security audit docs |

---

## Feature Dependencies

```
Cookie acceptance gate
  → ALL other tests (nothing persists until cookies accepted)

App bootstrap smoke
  → ALL user-flow tests (CDI must mount before any interaction)

Entry CRUD — create
  → Entry CRUD — read
  → Entry CRUD — update
  → Entry CRUD — delete

Auth — signin flow
  → Sync — manual sync to remote
  → Profile management (update username/email/password)
  → Auth — signout

Create new planner
  → Rename planner
  → Share — generate share URL

Share — generate share URL
  → Share — load from share URL (round-trip test)

API mock / intercept layer (differentiator)
  → Auth — register flow (reliable in CI)
  → Auth — signin flow (reliable in CI)
  → Sync — manual sync to remote (reliable in CI)
  → Network error feedback test

SRI hashes in index.html (security)
  → XSS escaping audit (both are index.html / template audits)

Input validation (client boundary)
  → Input validation E2E tests
```

---

## MVP Recommendation for This Milestone

The milestone has four pillars: E2E tests, HTML composition, security hardening, input validation. For the test suite specifically, prioritise:

1. **App bootstrap + calendar render** — establishes that the test harness actually works against this CDN SPA before writing anything complex
2. **Cookie acceptance gate** — must be the first `beforeEach` helper; without it, nothing else works
3. **Entry CRUD (create + read)** — the core user value; if this breaks, the app is broken
4. **Auth flows with API intercept** — register and signin are high-value but need the mock layer built first to be reliable in CI
5. **XSS entry text test** — the highest-risk security item given the `v-html` usage in `getEntryTypeIcon` and the proximity to user text rendering
6. **SRI presence assertion** — can be a simple `page.content()` string check, very low cost

Defer to a later pass:
- Visual regression (High complexity, low urgency)
- Full i18n matrix (10 languages × flows = test maintenance overhead before core tests are stable)
- Cookie overflow detection (requires instrumentation beyond E2E scope)

---

## Playwright Structural Notes (CDN SPA Context)

These are design decisions specific to testing a CDN-first, no-build SPA — not generic Playwright advice.

**Serving the app under test.** Playwright's `webServer` config block should start a local HTTP server (e.g. `npx http-server . -p 8080`) pointing at the project root. The app's CDN imports (jsDelivr, unpkg) resolve normally over the network; tests require internet access unless CDN resources are cached or proxied.

**Waiting for CDI mount.** The app sets `model.loaded = true` after CDI initialises and calls `refresh()`. Tests should wait for a DOM marker (`page.waitForSelector('[data-loaded="true"]')` or equivalent) rather than arbitrary timeouts. A data attribute on the root element is the reliable signal.

**Bootstrap 4 modals.** Register, signin, share, cookie-acceptance, and rename all use Bootstrap 4 `$('#id').modal('show/hide')`. Playwright must wait for modal `is-visible` CSS state (`.modal.show`) before interacting with modal content. `page.waitForSelector('#registerModal.show')` is the pattern.

**Cookie state between tests.** Playwright browser contexts share no state by default; `context.clearCookies()` in `beforeEach` is redundant if each test creates a new context. Use `test.use({ storageState: undefined })` and new contexts per test to guarantee isolation.

**`window.location.href` redirects.** Several controller actions (`createLocalPlanner`, `navigateToYear`, `signin success`, `signout`) rewrite `window.location.href`. Playwright's `page.waitForNavigation()` must wrap these interactions; without it, assertions run before the redirect completes.

**`document.execCommand` clipboard.** `copyUrl()` uses the deprecated execCommand API. In Playwright, grant clipboard permissions via `context.grantPermissions(['clipboard-read', 'clipboard-write'])` and read via `page.evaluate(() => navigator.clipboard.readText())`. On WebKit this may require additional handling.

---

## Sources

- Codebase analysis: `js/vue/controller.js`, `js/service/Api.js`, `js/service/StorageLocal.js`, `js/util/urlparam.js`, `js/vue/model.js`, `js/vue/model-features.js` — HIGH confidence
- `.planning/PROJECT.md`, `.planning/codebase/CONCERNS.md`, `.planning/codebase/INTEGRATIONS.md` — HIGH confidence (project-authoritative)
- Playwright configuration and API patterns (training data, August 2025 cutoff) — MEDIUM confidence; verify `webServer` config and `storageState` API against current Playwright docs before implementation
- PWA security patterns (SRI, CSP, XSS via v-html, cookie token storage) — MEDIUM confidence; well-established practices unlikely to have changed materially
- WebSearch and WebFetch unavailable in this session — no external verification performed
