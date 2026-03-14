# Year Planner — Project Status

## What This Is

A multi-lingual, responsive Progressive Web App (PWA) for personal and student year planning. Pure ES6 modules loaded via CDN — no build step. Optional cloud sync via REST API.

## Core Value

A simple, fast year planner that works offline with local storage, supports 10 languages, and optionally syncs to the cloud.

## Current State

**Completed Milestones:**
- ✅ **M001: Migration** (2026-03-12) — Test infrastructure, E2E coverage, security hardening, and HTML composition pipeline

**Active Milestone:** M004 — Auth & API Contract (not yet started)

## Architecture / Key Patterns

### Runtime Stack
- Vue 3 (Options API) + Vue-i18n + Luxon + Bootstrap 4 loaded from CDN
- @alt-javascript/cdi for dependency injection (constructor wiring via `contexts.js`)
- ES6 modules with bare CDN imports — no bundler, no build step

### Test Infrastructure
- Playwright test harness in `.tests/` with 14 passing tests (smoke + E2E)
- CDN fixture interception for deterministic offline testing
- `data-app-ready` attribute for reliable test synchronisation
- GitHub Actions CI workflow at `.github/workflows/e2e.yml`

### Security
- All CDN resources pinned with SRI integrity hashes
- `generate-sri.mjs` for automated hash regeneration

### HTML Composition
- 768-line `index.html` decomposed into 18 fragments in `.compose/`
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
- [ ] M004: Auth & API Contract — Federated auth (Google/Apple/Microsoft), OpenAPI sync contract

## Running Locally
```bash
# Docker (nginx)
.docker/bin/build && .docker/bin/run   # serves on http://localhost:8080

# Tests
cd .tests && npx playwright test       # 14 tests, ~12s

# Compose HTML (after editing fragments)
.compose/build.sh
```
