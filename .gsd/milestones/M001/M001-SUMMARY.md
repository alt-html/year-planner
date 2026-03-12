---
id: M001
provides:
  - Playwright test harness with CDN fixture interception and app-ready signalling
  - E2E test coverage for boot, entry CRUD, planner management, tooltip XSS, and sync error visibility
  - Security hardening — polyfill.io removed, SRI hashes on CDN resources, tooltip XSS fixed, API error feedback
  - HTML composition pipeline via m4 — 768-line index.html decomposed into 18 fragment files
key_decisions:
  - "Selected m4 over PostHTML, Nunjucks, and nginx SSI for HTML composition — zero install cost, native nesting, POSIX-standard"
  - "Used m4 -P flag to prefix builtins, avoiding collisions with JavaScript's substr/len/index"
  - "Changed m4 quotes to [[[/]]] to avoid conflicts with backtick and apostrophe in HTML/JS"
  - "Hidden .compose/ directory for build-time fragments, following .docker/.skaffold/.tests/ convention"
  - "CDN fixtures downloaded for offline Playwright test execution via custom cdn.js fixture"
  - "data-app-ready attribute on Vue mount as CDI readiness signal for test synchronisation"
patterns_established:
  - ".tests/ hidden directory for Playwright harness with own package.json — no root-level package.json"
  - "CDN route interception via custom Playwright fixture (cdn.js) for deterministic offline tests"
  - "data-app-ready attribute pattern for app readiness signalling"
  - "beforeEach helper clears storage + dismisses cookie consent for clean test baselines"
  - ".compose/ directory pattern for build-time HTML assembly"
  - "m4 -P with changequote([[[, ]]])  for safe HTML macro processing"
  - "generate-sri.mjs script for automated SRI hash regeneration"
observability_surfaces:
  - "npx playwright test — 14 tests across smoke/ and e2e/ directories"
  - ".compose/build.sh — prints line count of composed output"
  - "generate-sri.mjs — regenerates SRI hashes for CDN resources"
requirement_outcomes:
  - id: TEST-01
    from_status: active
    to_status: validated
    proof: ".tests/ directory exists with package.json; no root-level package.json (verified by harness.spec.js)"
  - id: TEST-02
    from_status: active
    to_status: validated
    proof: "playwright.config.js webServer block starts http-server on port 8080; harness.spec.js confirms app boots"
  - id: TEST-03
    from_status: active
    to_status: validated
    proof: "Application.js sets data-app-ready attribute; harness.spec.js waits for it successfully"
  - id: TEST-04
    from_status: active
    to_status: validated
    proof: "globalSetup.js and test fixtures clear storage and dismiss cookie modal; harness.spec.js verifies cookie modal not visible"
  - id: E2E-01
    from_status: active
    to_status: validated
    proof: "boot.spec.js passes — verifies 12 month columns and current year label"
  - id: E2E-02
    from_status: active
    to_status: validated
    proof: "entry-crud.spec.js passes — full create/see/edit/delete lifecycle"
  - id: E2E-03
    from_status: active
    to_status: validated
    proof: "planner-management.spec.js passes — create, rename, switch, delete planners"
  - id: SEC-01
    from_status: active
    to_status: validated
    proof: "polyfill.io script tag removed from index.html (commit 2837011)"
  - id: SEC-02
    from_status: active
    to_status: validated
    proof: "CDN tags pinned to exact versions with integrity+crossorigin attributes; generate-sri.mjs script exists"
  - id: SEC-03
    from_status: active
    to_status: validated
    proof: "tooltip-xss.spec.js passes — data-html='true' removed, injected HTML not executed"
  - id: SEC-04
    from_status: active
    to_status: validated
    proof: "sync-error.spec.js passes — API failure surfaces visible error alert to user"
  - id: COMP-01
    from_status: active
    to_status: validated
    proof: ".compose/RESEARCH.md covers all four candidates with comparison matrix"
  - id: COMP-02
    from_status: active
    to_status: validated
    proof: "compose.spec.js — 5 tests verify fragments, build idempotency, nesting, and m4 availability"
  - id: COMP-03
    from_status: active
    to_status: validated
    proof: "All 14 tests pass against composed index.html; Docker/Skaffold configs unchanged"
duration: ~1 day
verification_result: passed
completed_at: 2026-03-12
---

# M001: Migration

**Test infrastructure, E2E coverage, security hardening, and HTML composition pipeline established for a no-build vanilla JS PWA**

## What Happened

The Migration milestone took the Year Planner from an untested, monolithic vanilla JS app to a well-tested, security-hardened project with a maintainable HTML composition pipeline — all without introducing a build step.

**S01 (Test Infrastructure)** laid the foundation: a Playwright test harness in `.tests/` with its own `package.json` (no root-level package.json), CDN fixture interception for deterministic offline test execution, a `data-app-ready` attribute on Vue mount for reliable test synchronisation with the CDI bootstrap, and a `beforeEach` helper that clears storage and dismisses the cookie consent modal.

**S02 (Core E2E Tests)** built on the harness with three E2E specs: boot/grid verification (12 months, correct year), entry CRUD (create → see → edit → delete), and planner management (create → rename → switch → delete). A GitHub Actions CI workflow was also added.

**S03 (Security Hardening)** addressed four vulnerabilities: removed the compromised `polyfill.io` CDN script, pinned all remaining CDN resources to exact versions with SRI integrity hashes (automated by `generate-sri.mjs`), closed a Bootstrap tooltip XSS vector where `data-html="true"` allowed injected HTML execution, and added visible error feedback for API/sync failures (previously silent promise rejections). Font Awesome was upgraded to v6.7.2 with canonical class names.

**S04 (HTML Composition)** decomposed the 768-line `index.html` into 18 maintainable fragments using GNU m4. A research phase evaluated four tools (PostHTML, Nunjucks, nginx SSI, m4) before selecting m4 for its zero-dependency footprint. The implementation uses m4's `-P` prefix mode to avoid JavaScript builtin name collisions, and `changequote([[[, ]]])` to prevent misinterpretation of backticks and apostrophes. The composed output is byte-identical to the original — zero runtime changes.

## Cross-Slice Verification

The milestone roadmap has no explicit success criteria listed. Verification was performed against the implicit criteria: all slices complete, all requirements validated, and all tests pass.

- **All 4 slices complete**: Roadmap shows all slices marked `[x]`
- **All 14 requirements validated**: REQUIREMENTS.md shows 14 validated, 0 active/deferred/blocked
- **All 14 Playwright tests pass**: `npx playwright test` runs 14 tests across 5 spec files in 12.2s — all green
  - `smoke/harness.spec.js` (3 tests): TEST-01, TEST-02, TEST-03, TEST-04
  - `e2e/boot.spec.js` (2 tests): E2E-01
  - `e2e/entry-crud.spec.js` (1 test): E2E-02
  - `e2e/planner-management.spec.js` (1 test): E2E-03
  - `e2e/tooltip-xss.spec.js` (1 test): SEC-03
  - `e2e/sync-error.spec.js` (1 test): SEC-04
  - `smoke/compose.spec.js` (5 tests): COMP-02
- **Composition idempotency**: `.compose/build.sh` output is byte-identical to committed `index.html` (verified by compose.spec.js)
- **Docker/Skaffold unchanged**: No modifications to `.docker/` or `.skaffold/` configurations

**Gap noted**: S01–S03 slice summary files were not persisted to `.gsd/milestones/M001/slices/` during those sessions. Only S04 has a summary file. The work is fully evidenced by git commits and passing tests, but the GSD artefact trail is incomplete for the first three slices.

## Requirement Changes

All 14 requirements transitioned from active → validated during this milestone:

- **TEST-01**: active → validated — `.tests/` harness with own `package.json`; no root-level `package.json`
- **TEST-02**: active → validated — `webServer` config auto-starts `http-server` on port 8080
- **TEST-03**: active → validated — `data-app-ready` attribute emitted on Vue mount
- **TEST-04**: active → validated — `beforeEach` clears storage and dismisses cookie modal
- **E2E-01**: active → validated — boot.spec.js verifies 12 months and current year
- **E2E-02**: active → validated — entry-crud.spec.js covers full CRUD lifecycle
- **E2E-03**: active → validated — planner-management.spec.js covers create/rename/switch/delete
- **SEC-01**: active → validated — `polyfill.io` removed (commit 2837011)
- **SEC-02**: active → validated — CDN resources pinned with SRI; `generate-sri.mjs` automates hash regeneration
- **SEC-03**: active → validated — tooltip XSS closed; `data-html="true"` removed
- **SEC-04**: active → validated — API failures surface visible error alerts
- **COMP-01**: active → validated — research report at `.compose/RESEARCH.md`
- **COMP-02**: active → validated — m4 composition with 18 fragments and nesting
- **COMP-03**: active → validated — Docker/Skaffold unchanged; composed `index.html` is sole runtime artefact

## Forward Intelligence

### What the next milestone should know
- The `.compose/` directory is build-time only. The committed `index.html` at project root is the runtime artefact — Docker/Skaffold/http-server serve it directly.
- m4 requires the `-P` flag to avoid JavaScript builtin name collisions. Never run without it.
- CDN fixtures in `.tests/fixtures/cdn/` enable offline test execution. When upgrading CDN dependencies, update fixtures and regenerate SRI hashes via `generate-sri.mjs`.
- The `data-app-ready` attribute on `#app` is the authoritative signal that CDI bootstrap and Vue mount are complete. All E2E tests wait for this before interacting.
- Font Awesome was upgraded to v6.7.2 during S03. Icon class names use the FA 6 canonical format (`fa-solid fa-*` instead of `fas fa-*`).

### What's fragile
- The CDN fixture interception in `cdn.js` must match the exact URLs in `index.html`. If CDN versions are bumped, fixtures must be re-downloaded and routes updated.
- m4 `changequote([[[, ]]])` — if any future HTML content contains literal `[[[` or `]]]`, m4 will misinterpret it. Extremely unlikely but worth noting.
- Fragment ordering in `.compose/fragments/modals.html` matters for byte-identical output. Reordering will break the compose.spec.js idempotency test.
- The tooltip XSS fix relies on `data-html` being absent. If Bootstrap tooltip configuration is changed to re-enable HTML rendering, the vulnerability reopens.

### Authoritative diagnostics
- `cd .tests && npx playwright test` — the single command that validates the entire milestone (14 tests, ~12s)
- `.compose/build.sh` output — prints line count, confirms assembly
- `generate-sri.mjs` — regenerates SRI hashes for audit

### What assumptions changed
- Originally assumed `changequote` alone would suffice for m4 — JavaScript's `substr()` proved that `-P` prefix mode is essential.
- The cookie consent modal initially needed explicit dismissal in tests, but the `beforeEach` helper handles this transparently.
- Font Awesome upgrade from v5 to v6 required updating icon class names across all E2E test selectors — this wasn't anticipated during S03 planning.

## Files Created/Modified

### S01: Test Infrastructure
- `js/Application.js` — added `data-app-ready` attribute on Vue mount
- `.tests/package.json` — Playwright + http-server dependencies
- `.tests/playwright.config.js` — webServer config, CDN fixture paths
- `.tests/globalSetup.js` — storage clearing, cookie modal dismissal
- `.tests/smoke/harness.spec.js` — 3 smoke tests for harness validation

### S02: Core E2E Tests
- `.tests/fixtures/cdn/` — downloaded CDN assets for offline testing
- `.tests/e2e/boot.spec.js` — year grid structure tests (E2E-01)
- `.tests/e2e/entry-crud.spec.js` — entry CRUD lifecycle test (E2E-02)
- `.tests/e2e/planner-management.spec.js` — planner management test (E2E-03)
- `.github/workflows/e2e.yml` — GitHub Actions CI workflow

### S03: Security Hardening
- `index.html` — polyfill.io removed, SRI hashes added, tooltip XSS fixed, FA 6 upgrade
- `js/service/Api.js` — else-fallback branches on all catch blocks for error visibility
- `js/vue/i18n/*.js` — `error.syncfailed` key added to all 10 language files
- `.tests/generate-sri.mjs` — automated SRI hash generation script
- `.tests/e2e/tooltip-xss.spec.js` — XSS prevention test (SEC-03)
- `.tests/e2e/sync-error.spec.js` — sync error visibility test (SEC-04)

### S04: HTML Composition
- `.compose/RESEARCH.md` — comparison report of four composition tools
- `.compose/build.sh` — m4 composition build script
- `.compose/index.html.m4` — root m4 template
- `.compose/fragments/*.html` — 7 top-level fragments
- `.compose/fragments/modals/*.html` — 11 modal sub-fragments
- `.tests/smoke/compose.spec.js` — 5 composition verification tests
