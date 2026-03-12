# Year Planner — Project Status

## Overview

A multi-lingual, responsive Progressive Web App (PWA) for personal and student year planning. Pure ES6 modules loaded via CDN — no build step. Optional cloud sync via REST API.

## Current State

**Completed Milestones:**
- ✅ **M001: Migration** (2026-03-12) — Test infrastructure, E2E coverage, security hardening, and HTML composition pipeline

**Active Milestone:** None

## What Exists

### Test Infrastructure
- Playwright test harness in `.tests/` with 14 passing tests (smoke + E2E)
- CDN fixture interception for deterministic offline testing
- `data-app-ready` attribute for reliable test synchronisation
- GitHub Actions CI workflow at `.github/workflows/e2e.yml`

### Security
- polyfill.io supply-chain risk removed
- All CDN resources pinned with SRI integrity hashes
- Bootstrap tooltip XSS vector closed
- API/sync errors surface visible user feedback
- `generate-sri.mjs` for automated hash regeneration

### HTML Composition
- 768-line `index.html` decomposed into 18 fragments in `.compose/`
- GNU m4 with `-P` flag assembles fragments via `.compose/build.sh`
- Composed output is byte-identical to committed `index.html`

### Architecture
- Vue 3 + Vue-i18n + Luxon + Bootstrap 4 loaded from CDN
- alt-js/cdi for dependency injection (bindings in `js/config/contexts.js`)
- 10 language translations in `js/vue/i18n/`
- localStorage/cookie persistence for unregistered users; REST API sync for registered users

## Key Patterns
- Hidden directories for tooling: `.tests/`, `.compose/`, `.docker/`, `.skaffold/`
- No root-level `package.json` — test dependencies isolated in `.tests/`
- CDN fixture interception via custom Playwright fixture (`cdn.js`)
- m4 `-P` with `changequote([[[, ]]])` for safe HTML macro processing

## Running Locally
```bash
# Docker (nginx)
.docker/bin/build && .docker/bin/run   # serves on http://localhost:8080

# Tests
cd .tests && npx playwright test       # 14 tests, ~12s

# Compose HTML (after editing fragments)
.compose/build.sh
```
