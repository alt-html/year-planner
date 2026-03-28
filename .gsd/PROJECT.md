# Year Planner — Project Status

## What This Is

A multi-lingual, responsive Progressive Web App (PWA) for personal and student year planning. Pure ES6 modules loaded via CDN — no build step. Optional cloud sync via REST API.

## Core Value

A simple, fast year planner that works offline with local storage, supports 10 languages, and optionally syncs to the cloud.

## Current State

**Active Milestone:** None — awaiting next milestone planning

M007 (Boot v3 Uplift) is complete. The entire @alt-javascript CDN stack has been upgraded from v2 to v3.0.x. `main.js` uses `vueStarter` from boot-vue@3; `config.js` uses `ProfileAwareConfig` + `BrowserProfileResolver`; `contexts.js` uses `Context`/`Singleton` helpers from cdi@3. All 14 E2E tests pass with fully offline CDN fixture interception via a shared `cdn-routes.js` helper.

Two switchable visual themes (Ink & Paper / Crisp & Clear) with light and dark modes are fully polished. Grid fills the viewport with flex layout, columns align precisely, and a marker/highlighter mode enables interactive cell colouring via the vertical rail.

## Architecture / Key Patterns

### Runtime Stack
- Vue 3 (Options API) + Vue-i18n + Luxon + Bootstrap 4 loaded from CDN
- @alt-javascript v3 (common, config, logger, cdi, boot, boot-vue) for CDI and app bootstrap
- `vueStarter` from boot-vue@3 as the app entry point; `ProfileAwareConfig` + `BrowserProfileResolver` for environment config; `Context`/`Singleton` for CDI wiring
- ES6 modules with bare CDN imports — no bundler, no build step

### Visual Theming
- Two themes via CSS custom properties on `<body data-theme="ink|nordic">`
- Dark mode via `.yp-dark` class on `<body>`
- Theme stored in `localStorage('style_theme')`
- Design mockups in `/mockups/combined-themes.html`

### Test Infrastructure
- Playwright test harness in `.tests/` with 14 passing tests (smoke + E2E)
- CDN fixture interception via shared `cdn-routes.js` helper (used by both per-test `cdn.js` fixture and `globalSetup.js`) — all 7 v3 ESM bundles + lodash-es served locally
- `data-app-ready` attribute for reliable test synchronisation
- GitHub Actions CI workflow at `.github/workflows/e2e.yml`

### Security
- All CDN resources pinned with SRI integrity hashes
- `generate-sri.mjs` for automated hash regeneration

### HTML Composition
- `index.html` decomposed into 18 fragments in `.compose/`
- GNU m4 with `-P` flag assembles fragments via `.compose/build.sh`
- Composed output is byte-identical to committed `index.html`

### Key Conventions
- Hidden directories for tooling: `.tests/`, `.compose/`, `.docker/`, `.skaffold/`
- No root-level `package.json` — test dependencies isolated in `.tests/`
- CDN fixture interception via custom Playwright fixture (`cdn.js`)
- m4 `-P` with `changequote([[[, ]]])` for safe HTML macro processing

## Capability Contract

See `.gsd/REQUIREMENTS.md` for the explicit capability contract, requirement status, and coverage mapping.

## Milestone Sequence

- [x] M001: Migration — Test infrastructure, E2E coverage, security hardening, and HTML composition pipeline
- [x] M002: JS Modularisation — Decomposed monolithic Vue controller, model, and API into focused ES6 modules; removed superagent, lodash, SquareUp CDN dependencies
- [x] M003: Storage Modernisation — Migrated all persistence from cookies to localStorage, removed consent modal and @alt-javascript/cookies CDN dependency
- [x] M004: Auth & API Contract — Replaced bespoke auth with federated sign-in (Google/Apple/Microsoft), defined OpenAPI 3.x sync spec, aligned sync client
- [x] M005: UI/UX Design Research — Created 3 design mockups, applied hybrid of Ink & Paper + Crisp & Clear as dual-theme system
- [x] M006: UI/UX Polish & Finalisation — Flex-fill grid, column alignment fix, marker/highlighter mode, modal cleanup
- [x] M007: Boot v3 Uplift — Replaced @alt-javascript v2 CDN stack with v3.0.x; vueStarter/ProfileAwareConfig/Context+Singleton pattern; fully offline E2E fixture coverage

## Running Locally
```bash
# Docker (nginx)
.docker/bin/build && .docker/bin/run   # serves on http://localhost:8080

# Tests
cd .tests && npx playwright test       # 14 tests, ~12s

# Compose HTML (after editing fragments)
.compose/build.sh
```
