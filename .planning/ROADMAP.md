# Roadmap: Year Planner — Quality & Tooling Milestone

## Overview

This milestone adds the quality gate that validates the existing CDN-first runtime. Work proceeds in four phases: first establish a reliable test harness (the prerequisite for everything else), then write core planner E2E tests, then harden the CDN supply chain and fix known XSS vectors, and finally decompose the 761-line `index.html` into maintainable fragments. All tooling lives in hidden directories and never touches the production serving path.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Test Infrastructure** - Configure Playwright harness in `.tests/`, add CDI readiness signal, establish clean test baseline (completed 2026-03-11)
- [ ] **Phase 2: Core E2E Tests** - Smoke test, entry CRUD, and planner management E2E specs (gap closure in progress)
- [ ] **Phase 3: Security Hardening** - Remove polyfill.io, add SRI hashes, fix XSS vectors, surface sync errors
- [ ] **Phase 4: HTML Composition** - Research and implement fragment-based `index.html` composition

## Phase Details

### Phase 1: Test Infrastructure
**Goal**: A working Playwright test harness exists in `.tests/` that can start a local server, wait for CDI initialisation, and provide a clean browser state — so all subsequent test phases can be written reliably.
**Depends on**: Nothing (first phase)
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04
**Success Criteria** (what must be TRUE):
  1. Running `/gs` from `.tests/` starts `http-server` on port 8080, loads the app, and exits with a pass
  2. The `document.body` carries a `data-app-ready` attribute after CDI initialises — tests can use `waitForSelector('[data-app-ready]')` instead of arbitrary timeouts
  3. Each test starts with a clean browser state: cookies cleared and cookie consent modal accepted without manual intervention
  4. No `package.json` exists at the project root; all dev dependencies are confined to `.tests/package.json`
**Plans**: 2 plans

Plans:
- [ ] 01-01-PLAN.md — Add data-app-ready signal to Application.js and scaffold Playwright harness (package.json, playwright.config.js, globalSetup.js)
- [ ] 01-02-PLAN.md — Install Chromium, write baseline smoke spec, update .gitignore, run full harness

### Phase 2: Core E2E Tests
**Goal**: The core user workflows — app boot, entry CRUD, and planner management — are covered by passing E2E specs that run reliably in CI.
**Depends on**: Phase 1
**Requirements**: E2E-01, E2E-02, E2E-03
**Success Criteria** (what must be TRUE):
  1. A smoke test asserts the year grid renders with correct month columns and day rows for the current year
  2. A user can click a calendar cell, type an entry, save it, confirm it appears on the grid, edit it, and delete it — all exercised in a single spec
  3. A user can create a named planner, rename it, switch between planners, and delete one — all in a single spec
  4. Tests pass in CI without requiring a live CDN (CDN libraries served from local fixtures via `page.route()`)
**Plans**: 5 plans (3 original + 2 gap closure)

Plans:
- [ ] 02-01-PLAN.md — Download CDN fixture assets and write cdn.js custom Playwright fixture for CDN route mocking
- [ ] 02-02-PLAN.md — Write boot.spec.js (E2E-01 year grid) and entry-crud.spec.js (E2E-02 CRUD)
- [ ] 02-03-PLAN.md — Write planner-management.spec.js (E2E-03 create/rename/switch/delete lifecycle)
- [ ] 02-04-PLAN.md — [GAP] Add GitHub Actions CI workflow to run Playwright suite on push/PR
- [ ] 02-05-PLAN.md — [GAP] Add missing navbar-brand assertion after rename in planner-management.spec.js

### Phase 3: Security Hardening
**Goal**: The app's CDN supply chain is auditable and locked, known XSS vectors are closed, and users see visible feedback when sync fails.
**Depends on**: Phase 1
**Requirements**: SEC-01, SEC-02, SEC-03, SEC-04
**Success Criteria** (what must be TRUE):
  1. No `polyfill.io` reference exists anywhere in `index.html` or any served file
  2. Every applicable CDN `<script>` and `<link>` tag in `index.html` carries `integrity` and `crossorigin` attributes with correct SRI hashes; a `generate-sri.mjs` script in `.scripts/` or `.tests/` regenerates them when versions change
  3. Injecting `<img src=x onerror=window.__xss=1>` as entry text does not execute JavaScript — the Bootstrap tooltip `data-original-title` XSS vector is closed
  4. When a network or sync failure occurs, the user sees a visible error message (toast or inline); the failure does not disappear silently
**Plans**: 4 plans

Plans:
- [ ] 03-01-PLAN.md — Wave 0 scaffolding: generate-sri.mjs, FA 6.7.2 fixture, RED E2E specs for SEC-03/SEC-04, cdn.js route updates
- [ ] 03-02-PLAN.md — CDN supply chain: remove polyfill.io, pin Vue/vue-i18n/superagent with SRI, replace FA Kit with cdnjs CSS link
- [ ] 03-03-PLAN.md — index.html body: FA 6 icon class name sweep + Bootstrap tooltip XSS fix
- [ ] 03-04-PLAN.md — Api.js error surfacing: else-fallback catch blocks + error.syncfailed i18n key in all 10 language files

### Phase 4: HTML Composition
**Goal**: The 761-line `index.html` is decomposed into maintainable fragments that assemble back into a single committed `index.html`, with no change to how Docker and Skaffold serve the app.
**Depends on**: Phase 3
**Requirements**: COMP-01, COMP-02, COMP-03
**Success Criteria** (what must be TRUE):
  1. A written research report in `.planning/` compares PostHTML+posthtml-include, Nunjucks, nginx SSI, and m4 across setup cost, nesting capability, dev workflow impact, and no-build alignment — with a clear recommendation
  2. `index.html` is generated from fragment files in `.compose/` via a shell script or equivalent tool; at least one fragment includes another (nesting demonstrated)
  3. The composed `index.html` at the project root is the only runtime artefact; Docker and Skaffold workflows function identically before and after the change
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase                  | Plans Complete | Status      | Completed  |
|------------------------|----------------|-------------|------------|
| 1. Test Infrastructure | 2/2            | Complete    | 2026-03-11 |
| 2. Core E2E Tests      | 4/5            | In Progress |            |
| 3. Security Hardening  | 1/4 | In Progress|  |
| 4. HTML Composition    | 0/TBD          | Not started | -          |
