---
id: M010
title: "Source Root Tidy — Move Web Assets to site/"
status: complete
completed_at: 2026-04-02T22:50:23.411Z
key_decisions:
  - git mv used throughout to preserve rename history
  - site/ is now the canonical web root for all serving contexts
key_files:
  - site/
  - .compose/build.sh
  - .tests/playwright.config.js
  - .tests/smoke/compose.spec.js
  - .docker/Dockerfile-nginx-16-alpine
  - AGENTS.md
lessons_learned:
  - Smoke tests that read project files by absolute path are a hidden coupling point — check them whenever moving files, not just tooling config
---

# M010: Source Root Tidy — Move Web Assets to site/

**Relocated all web assets to site/, updated all tooling references, 16/16 tests green.**

## What Happened

Moved all web-serving assets into site/ using git mv, updated build pipeline, test harness, Docker image, and AGENTS.md. Caught and fixed a hardcoded path in the compose smoke test. All 16 E2E tests pass. Project root is now tooling/config/docs only.

## Success Criteria Results

All five success criteria met and verified by command output and Playwright run.

## Definition of Done Results

- ✅ site/ contains index.html, css/, js/, manifest.json, all icons\n- ✅ .compose/build.sh writes site/index.html\n- ✅ Playwright serves site/, 16/16 tests pass\n- ✅ Docker COPY targets site/\n- ✅ AGENTS.md dev server command updated\n- ✅ No web-serving files at project root

## Requirement Outcomes

COMP-02 validated (compose smoke test passes against site/). COMP-03 advanced (Docker/tooling unchanged in behaviour). All other requirements unaffected.

## Deviations

compose.spec.js had a hardcoded ROOT/index.html path not caught in the initial scan — fixed in T02.

## Follow-ups

None.
