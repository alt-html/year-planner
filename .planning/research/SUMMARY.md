# Project Research Summary

**Project:** Year Planner
**Domain:** CDN-first no-build PWA — E2E testing, security hardening, HTML composition
**Researched:** 2026-03-11
**Confidence:** MEDIUM (codebase analysis HIGH; external tool versions unverified)

## Executive Summary

This milestone adds dev-only tooling to a deliberately no-build PWA: a Playwright E2E test suite, SRI hash enforcement for CDN resources, XSS hardening, and an optional HTML fragment composition step for the 761-line `index.html`. The project's core constraint — CDN-assembled runtime, no bundler — is not changing. All new tooling must live inside hidden directories (`.tests/`, `.compose/`) and never touch the production serving path. The right mental model is: this milestone builds the quality gate that validates the existing runtime, not a build system for it.

The recommended approach is Playwright with an `http-server`-based `webServer` config, a POSIX shell script for HTML composition, and a minimal Node `crypto` script for SRI hash generation. All dev dependencies belong inside `.tests/package.json` — the project root remains `package.json`-free. Three CDN URLs require immediate remediation regardless of the test suite: `polyfill.io` (supply-chain compromised in 2024, remove entirely), the FontAwesome Kit URL (dynamic content, cannot be SRI-hashed, replace with pinned cdnjs version), and all unpinned CDN URLs (must be pinned to exact patch versions before hashes are computed).

The two highest-risk items for this milestone are CDN reliability in CI (the app loads 12+ CDN libraries at runtime, which will cause intermittent CI failures without `page.route()` interception) and the Bootstrap tooltip stored XSS vector (`data-html="true"` on `data-original-title` combines a raw HTML icon string with user entry text — a real stored XSS vulnerability exposed by the share-planner feature). Both are addressable but require deliberate design decisions, not just test coverage.

## Key Findings

### Recommended Stack

All tooling is dev-only and belongs in `.tests/` with its own `package.json`. The project root must not acquire a `package.json`. Playwright handles E2E testing with no framework coupling — it navigates URLs and asserts DOM state, making it a perfect fit for a CDN-assembled SPA. The `http-server` static file server is already in the project ecosystem (used in Dockerfile) and integrates cleanly with Playwright's `webServer` lifecycle config. HTML composition needs nothing more than a POSIX shell script with `cat` — reject anything that adds templating logic. SRI hash generation needs only Node's built-in `crypto` module (Node 18+ has built-in `fetch`).

**Core technologies:**
- `@playwright/test` ^1.49: browser E2E testing — no framework coupling, `webServer` auto-manages the dev server, cookie-state isolation model fits this app
- `http-server` ^14.x: static file server for Playwright `webServer` — already in project ecosystem, zero new conceptual weight, port-aligned with Docker (8080)
- POSIX shell (`/bin/sh`): HTML fragment composition — zero dependencies, already available everywhere, composable with SRI step
- Node `crypto` (built-in): SRI hash generation — zero npm deps, Node 18+ has native `fetch` for CDN downloads
- `eslint` + `eslint-plugin-vue`: XSS audit tooling — `vue/no-v-html` rule flags every `v-html` usage for manual review

### Expected Features

**Must have (table stakes):**
- App bootstrap smoke test + CDI readiness signal (`data-app-ready` DOM attribute) — without this, all other tests are timing-dependent and flaky
- Cookie acceptance gate helper (global `beforeEach`) — nothing persists without this; it is a hard prerequisite for all other tests
- Entry CRUD (create, read, update, delete) — core user value; if this breaks the app is broken
- Year navigation tests — `navigateToYear()` rewrites `window.location.href`; requires `waitForNavigation` pattern
- SRI hashes on all CDN resources that support it — Vue, vue-i18n, superagent, Bootstrap, LZ-String, UUID, all @alt-javascript/* modules
- XSS test for entry text rendering — inject `<img src=x onerror=window.__xss=1>` and assert it does not execute
- Playwright config and tests in `.tests/` hidden directory — explicit project constraint
- `polyfill.io` removed from `index.html` — compromised CDN, vestigial polyfill, must go before SRI phase
- FontAwesome Kit replaced with pinned cdnjs version — Kit URL is dynamic, incompatible with SRI
- All CDN URLs pinned to exact patch version — prerequisite for stable SRI hashes

**Should have (differentiators):**
- API mock/intercept layer via `page.route()` — enables auth/sync tests in CI without live backend; also solves CDN reliability problem
- Auth flows (register, signin, signout) — high value but unreliable without mock layer
- Share URL round-trip test (generate → navigate → assert entries) — tests the compression/decompression pipeline
- Page Object Model for modals (EntryModal, AuthModal, ShareModal) — thin POM isolates selectors from test logic
- Network error feedback tests — currently silent on sync failure (CONCERNS.md); tests assert visible error after mocked failure
- Input validation (entry length, auth field format) — client-side enforcement, testable boundary conditions
- Bootstrap tooltip XSS fix — HTML-encode entry text before concatenation with icon HTML in `data-original-title`
- URL param sanitization for `?share=` and `?uid=` — decoded strings passed directly into app state

**Defer to later:**
- Visual regression snapshots — High complexity, low urgency; wait for core tests to be stable
- Full i18n matrix tests (10 languages) — test maintenance overhead before core tests are stable
- Accessibility assertions via `@axe-core/playwright` — valuable but not milestone-critical
- Cookie overflow detection — requires storage layer instrumentation beyond E2E scope
- CSP header assertions — server-side config, not app code

### Architecture Approach

The architecture has three hard tiers: Runtime (index.html, js/, css/ — served unchanged), Dev Server (`http-server` or Docker nginx — serves runtime), and Tooling (`.tests/`, `.docker/`, `.skaffold/` — never shipped). Playwright sits entirely in the Tooling tier, communicates with the Dev Server over HTTP, and never imports or modifies runtime code. HTML fragment composition (if adopted) also lives in tooling (`.compose/`) and outputs a committed `index.html` that is always deployable without the tooling present. The build order is: compose (optional) → test → Docker build → deploy.

**Major components:**
1. `.tests/playwright.config.js` — Playwright config; `webServer` starts `npx http-server .. -p 8080`; `testDir: './e2e'`; port 8080 aligns with Docker
2. `.tests/e2e/` — Test files organized by domain: `planner.spec.js`, `auth.spec.js`, `sync.spec.js`, `share.spec.js`
3. `.tests/fixtures/app.js` — Page Object Model; thin per-modal objects; shared helpers (cookie acceptance, CDI ready wait)
4. `.compose/bin/compose` — Shell script; concatenates HTML fragments; single `cat` pipeline; no logic
5. `.compose/fragments/` — HTML fragment sources committed to repo; output `index.html` also committed

### Critical Pitfalls

1. **CDI async init causes flaky tests** — Add `data-app-ready="true"` to `document.body` after `Application.run()` completes. Every test starts with `page.waitForSelector('[data-app-ready]')`. Never use `waitForTimeout`.

2. **CDN unavailability breaks CI** — Use `page.route()` to intercept and serve known CDN libraries (Vue, Bootstrap, etc.) from a local `fixtures/` directory. The `polyfill.io` URL must be removed entirely (compromised CDN, not just intercepted).

3. **Bootstrap tooltip stored XSS** — `data-original-title` with `data-html="true"` concatenates a raw HTML icon string with user entry text. HTML-encode the entry text portion before concatenation. This is a real stored XSS vector for shared planners.

4. **SRI hash drift from unpinned CDN URLs** — Pin every CDN URL to an exact patch version (`vue@3.4.x`, `superagent@9.x.x`, etc.) before computing hashes. Unpinned URLs cause SRI violations when CDN serves updated files.

5. **No-build principle erosion** — Test tooling `package.json` must stay inside `.tests/`. The psychological barrier is crossed once; after that every new tool feels incremental. Treat additions to `.tests/package.json` as significant decisions in code review.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Test Infrastructure Bootstrap
**Rationale:** Everything else depends on a working test harness. CDI readiness signal (`data-app-ready`) is a small runtime change that unlocks all reliable test timing. Must be done first.
**Delivers:** `.tests/` directory with `playwright.config.js`, `package.json`, CDI readiness signal in `Application.js`, smoke test confirming the test harness works against a live CDN load
**Addresses:** App bootstrap smoke test, cookie acceptance gate, test isolation via browser contexts
**Avoids:** CDI timing pitfall (add DOM signal), no-build erosion pitfall (keep `package.json` in `.tests/`)

### Phase 2: Core Planner E2E Tests
**Rationale:** Entry CRUD and year navigation are the core user value. These tests must be stable before building on top of them. Requires CDN interception to be reliable in CI.
**Delivers:** `page.route()` CDN interception layer, Page Object Model, entry CRUD tests, year navigation tests, create/rename planner tests
**Uses:** Playwright `page.route()`, Page Object Model pattern
**Avoids:** CDN reliability pitfall (intercept layer), `window.location.href` navigation pitfall (`waitForNavigation` pattern), timestamp UID collision pitfall

### Phase 3: CDN/SRI Hardening
**Rationale:** Must remove `polyfill.io` before adding any SRI (it may contain compromised code). Must pin all CDN versions before computing hashes. This phase has prerequisite cleanup that cannot be skipped.
**Delivers:** `polyfill.io` removed, FontAwesome Kit replaced with pinned cdnjs version, all CDN URLs pinned to exact patch versions, SRI integrity attributes on all applicable script/link tags, Node `crypto` SRI generation script
**Avoids:** polyfill.io compromise pitfall, hash drift pitfall, SRI-incompatible dynamic URLs pitfall

### Phase 4: XSS Audit and Hardening
**Rationale:** After SRI reduces supply-chain risk, audit the app's own code for injection vectors. The Bootstrap tooltip XSS is a known specific vulnerability. Fix must be surgical (at concatenation point) to avoid breaking i18n.
**Delivers:** ESLint `vue/no-v-html` audit, Bootstrap tooltip `data-original-title` XSS fix, URL param sanitization for `?share=` and `?uid=`, XSS E2E tests with injection payloads, i18n regression verification (AR, ZH, JA)
**Avoids:** Tooltip stored XSS pitfall, over-aggressive escaping breaking i18n pitfall

### Phase 5: Auth and Sync Tests
**Rationale:** Auth tests require either a live API or a mock layer. The mock layer (`page.route()` for API endpoints) should be built on top of the CDN interception already established in Phase 2.
**Delivers:** API mock/intercept for `PUT/GET/POST /api/planner`, auth flow tests (register, signin, signout), sync tests, network error feedback tests, visible error on sync failure fix
**Avoids:** CI reliability for auth tests without live backend

### Phase 6: HTML Fragment Composition (Optional)
**Rationale:** The 761-line `index.html` is maintainable as-is. Fragment composition is a quality-of-life improvement, not a correctness requirement. Defer until core tests are stable and green. Hard-scope to concatenation only.
**Delivers:** `.compose/fragments/` directory, `compose` shell script, fragment boundaries validated as legal HTML block boundaries, `index.html` regeneration documented
**Avoids:** Shell script scope creep pitfall (hard limit: no logic, no environment variables, no templating), fragment boundary inside Vue template pitfall

### Phase Ordering Rationale

- Phase 1 before all others: CDI readiness signal is a runtime change that must land before any test timing logic is written
- Phase 2 before auth/sync: Core planner tests establish patterns (POM, navigation helpers, CDN interception) that auth tests reuse
- Phase 3 before Phase 4: SRI hardening removes external supply-chain risk before auditing internal injection vectors; also `polyfill.io` removal is a Phase 3 prerequisite that affects Phase 4 baseline
- Phase 5 after Phase 2: API mock layer extends CDN interception patterns; avoids reimplementing the same infrastructure
- Phase 6 last: Optional and independent; does not affect test correctness; can be skipped if the 761-line `index.html` is acceptable

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (SRI Hardening):** Exact current patch versions for each CDN dependency must be looked up at implementation time; version numbers in research are from training data and will be stale
- **Phase 5 (Auth/Sync):** API endpoint contracts (`PUT/GET/POST /api/planner`) need to be verified against the actual running backend before mock responses can be written
- **Phase 6 (HTML Composition):** Vue template boundary analysis in `index.html` needs a careful read to identify safe fragment split points

Phases with standard patterns (skip research-phase):
- **Phase 1 (Test Bootstrap):** Playwright `webServer` + `http-server` is a well-documented standard pattern
- **Phase 2 (Core Tests):** Playwright `page.route()`, Page Object Model, `waitForNavigation` — all standard, well-documented Playwright patterns
- **Phase 4 (XSS Audit):** The specific vulnerability (tooltip `data-html="true"`) and the fix (HTML-encode user text) are clearly identified; no additional research needed

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Playwright capability set and http-server integration: HIGH. Exact current versions (Playwright 1.49+, eslint-plugin-vue 9.x): unverified, need confirmation before pinning |
| Features | HIGH | Derived from direct codebase inspection of `controller.js`, `Api.js`, `StorageLocal.js`, `urlparam.js` — these are facts about the actual code, not estimates |
| Architecture | HIGH | Three-tier model, hidden-directory convention, port alignment — all verified from codebase (`.docker/bin/run`, `.skaffold/skaffold.yaml`, existing directory structure) |
| Pitfalls | HIGH | Critical pitfalls are grounded in specific line numbers and code patterns from codebase inspection; CDI timing, tooltip XSS, polyfill.io compromise are documented facts |

**Overall confidence:** MEDIUM-HIGH (feature and pitfall findings are high-confidence codebase facts; stack version numbers need verification)

### Gaps to Address

- **Playwright current version:** Training data says 1.49; likely 1.5x by March 2026. Verify `https://playwright.dev/docs/release-notes` before pinning in `package.json`.
- **CDN exact patch versions:** All CDN URLs need exact patch version pinning (e.g. `vue@3.4.x`, `superagent@9.x.x`). These must be looked up at implementation time — do not use training-data version numbers.
- **Node version in CI:** SRI script uses `fetch` as built-in (Node 18+). Verify CI Node version before assuming built-in `fetch` is available.
- **`polyfill.io` current state:** The domain was compromised in mid-2024. Verify current ownership/content before deciding whether to cache or simply remove the dependency.
- **FontAwesome version in use:** The codebase uses a kit URL. Check which icon classes are used in `getEntryTypeIcon()` to determine the correct FA version (5.x vs 6.x) for the pinned cdnjs replacement.
- **API endpoint contracts:** Auth and sync tests require knowing exact request/response shapes for `PUT/GET/POST /api/planner`. These must be verified against the live API.

## Sources

### Primary (HIGH confidence)
- Codebase direct inspection: `index.html`, `js/vue/controller.js`, `js/service/Api.js`, `js/service/StorageLocal.js`, `js/util/urlparam.js`, `js/main.js`, `js/config/contexts.js`
- `.planning/codebase/CONCERNS.md` — existing known issues
- `.planning/PROJECT.md` — no-build constraint, hidden tooling directory requirement
- `.docker/bin/run`, `.skaffold/skaffold.yaml` — port and directory convention verification
- polyfill.io supply-chain compromise: documented public incident, mid-2024

### Secondary (MEDIUM confidence)
- Playwright `webServer` config and API patterns (training knowledge, August 2025 cutoff) — verify against `https://playwright.dev/docs/test-webserver`
- jsDelivr and unpkg CORS/SRI support (training knowledge) — verify against CDN documentation before implementation
- eslint-plugin-vue `no-v-html` rule (training knowledge) — verify version at `https://eslint.vuejs.org/rules/no-v-html.html`

### Tertiary (LOW confidence)
- PostHTML as alternative HTML composition tool (training knowledge, last confirmed ~0.16.x mid-2025) — not recommended; shell script is preferred
- Square SqPaymentForm SRI infeasibility — inferred from dynamic content model; verify if payment testing ever becomes in-scope

---
*Research completed: 2026-03-11*
*Ready for roadmap: yes*
