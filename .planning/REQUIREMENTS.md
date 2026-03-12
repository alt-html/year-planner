# Requirements: Year Planner — Quality & Tooling Milestone

**Defined:** 2026-03-11
**Core Value:** A user can open the app in any browser, create a planner, and start filling in their year — no account, no install, no setup required.

## v1 Requirements

### Test Infrastructure

- [x] **TEST-01**: Playwright test harness configured in `.tests/` (hidden directory, follows `.docker/` / `.skaffold/` convention), with its own `package.json` — no root-level `package.json` introduced
- [x] **TEST-02**: Playwright `webServer` config auto-starts `http-server` serving the project root before tests run; port aligns with existing Docker/Skaffold port (8080)
- [x] **TEST-03**: Vue app emits a `data-app-ready` attribute on mount (added to `Application.js` or `app.js`) so tests can wait for CDI initialisation before interacting
- [x] **TEST-04**: `beforeEach` helper clears browser storage and accepts the cookie consent modal, establishing a clean test baseline for every spec

### E2E Tests

- [x] **E2E-01**: App boot smoke test — page loads, year grid renders with correct month columns and day rows for the current year
- [x] **E2E-02**: Entry CRUD — user can click a calendar cell, type an entry, save it, see it persist on the grid, edit it, and delete it
- [x] **E2E-03**: Planner management — user can create a new named planner, rename it, switch between planners, and delete one

### Security

- [x] **SEC-01**: `polyfill.io` script tag removed from `index.html` (supply-chain risk; all polyfilled features natively supported in modern browsers)
- [x] **SEC-02**: Remaining feasible CDN `<script>` and `<link>` tags pinned to exact patch versions and annotated with `integrity` + `crossorigin` SRI attributes; a `generate-sri.mjs` script in `.tests/` or `.scripts/` automates hash regeneration when versions change
- [x] **SEC-03**: Bootstrap tooltip XSS fixed — `data-html="true"` + user entry text in `data-original-title` removed or sanitised; entry text rendered via text-only tooltip attribute or moved out of `v-html` context
- [x] **SEC-04**: Network and sync errors surfaced to the user via visible UI feedback (e.g. toast or inline message) rather than silent promise rejection

### HTML Composition

- [ ] **COMP-01**: Research report comparing PostHTML+posthtml-include, Nunjucks, nginx SSI, and m4 for composing `index.html` from nested fragments — covering setup cost, nesting capability, dev workflow impact, and alignment with the no-build philosophy
- [ ] **COMP-02**: Chosen composition tool implemented: `index.html` decomposed into a `.compose/` fragment directory; a build script (or npm script in `.tests/`) assembles them into the committed `index.html`; nesting (one fragment including another) demonstrated
- [ ] **COMP-03**: Existing Docker and Skaffold workflows unchanged — the composed `index.html` at the project root continues to be the single runtime artefact

## v2 Requirements

### Auth E2E Tests

- **AUTH-E2E-01**: Register flow E2E test (deferred — auth UI planned for replacement in a later milestone)
- **AUTH-E2E-02**: Sign-in / sign-out E2E test with Playwright `page.route()` API mock layer
- **AUTH-E2E-03**: Network error feedback test — simulate offline sync and verify user-visible error message

### Additional Security

- **SEC-05**: Content Security Policy (CSP) header evaluated and configured for nginx
- **SEC-06**: URL parameter sanitisation in `urlparam.js` — strip or encode values before passing to app logic

### Expanded E2E Coverage

- **E2E-04**: Year navigation (previous / next year, current/last/next quick links)
- **E2E-05**: Share flow — generate share URL, decode it, verify planner renders
- **E2E-06**: Theme switching (light / dark) persists across page reload

## Out of Scope

| Feature | Reason |
|---|---|
| Auth UI rework | Planned for a separate milestone |
| Unit test framework | E2E-first philosophy; complex logic extracted as CDN modules with own tests |
| webpack / Vite / full build pipeline | Contrary to CDN-first runtime principle |
| FontAwesome Kit SRI | Kit URL is a dynamic loader — incompatible with SRI; mitigation deferred |
| Square payment SRI | Dynamic response from Square CDN — SRI infeasible |
| Conflict resolution for remote sync | Last-write-wins acceptable; deferred |
| Mobile native app | Web PWA only |

## Traceability

| Requirement | Phase | Status |
|---|---|---|
| TEST-01 | Phase 1 | Complete |
| TEST-02 | Phase 1 | Complete |
| TEST-03 | Phase 1 | Complete |
| TEST-04 | Phase 1 | Complete |
| E2E-01 | Phase 2 | Complete |
| E2E-02 | Phase 2 | Complete |
| E2E-03 | Phase 2 | Complete |
| SEC-01 | Phase 3 | Complete |
| SEC-02 | Phase 3 | Complete |
| SEC-03 | Phase 3 | Complete |
| SEC-04 | Phase 3 | Complete |
| COMP-01 | Phase 4 | Pending |
| COMP-02 | Phase 4 | Pending |
| COMP-03 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-11*
*Last updated: 2026-03-11 after initial definition*
