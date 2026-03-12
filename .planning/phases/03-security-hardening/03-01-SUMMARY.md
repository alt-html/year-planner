---
phase: 03-security-hardening
plan: "01"
subsystem: testing/security-scaffolding
tags: [sri, e2e, playwright, security, red-tests, fontawesome]
dependency_graph:
  requires: []
  provides:
    - .scripts/generate-sri.mjs
    - .tests/fixtures/fontawesome.min.css
    - .tests/e2e/tooltip-xss.spec.js
    - .tests/e2e/sync-error.spec.js
    - updated .tests/fixtures/cdn.js
  affects:
    - all E2E specs using ../fixtures/cdn
tech_stack:
  added:
    - node:crypto (built-in, generate-sri.mjs)
    - FontAwesome 6.7.2 CSS fixture (cdnjs)
  patterns:
    - RED test scaffolding (tests fail before fix, pass after)
    - CDN route interception via Playwright page.route()
key_files:
  created:
    - .scripts/generate-sri.mjs
    - .tests/fixtures/fontawesome.min.css
    - .tests/e2e/tooltip-xss.spec.js
    - .tests/e2e/sync-error.spec.js
  modified:
    - .tests/fixtures/cdn.js
decisions:
  - "FA cdnjs URL used for both SRI and fixture to keep source consistent"
  - "Superagent route pinned to @10.3.0 to match planned index.html pinning in Plan 02"
  - "Vue and vue-i18n routes pinned to exact versions for future SRI compatibility"
  - "Polyfill.io stub removed from cdn.js ahead of its removal from index.html"
metrics:
  duration: "~8 minutes"
  completed: "2026-03-12T03:33:16Z"
  tasks_completed: 3
  files_created: 4
  files_modified: 1
---

# Phase 3 Plan 1: Security Hardening Scaffolding Summary

Wave 0 scaffolding: SRI hash script, FA CSS fixture, RED E2E tests for XSS and sync-error bugs, updated CDN intercepts.

## What Was Built

**generate-sri.mjs** — Node 18+ script using built-in fetch and `node:crypto` to fetch 4 pinned CDN URLs and print `sha384` integrity hashes. Output is copy-paste-ready for `index.html` `integrity=` attributes.

**fontawesome.min.css** — Local FA 6.7.2 `all.min.css` (73890 bytes, from cdnjs) committed to `.tests/fixtures/` so E2E tests can intercept and serve it without network access.

**cdn.js updates** — Four changes:
1. Vue route pinned: `vue@3` → `vue@3.5.30`
2. Vue-i18n route pinned: `vue-i18n@9` → `vue-i18n@9.14.5`
3. Superagent route pinned: `**/superagent**` → `**/superagent@10.3.0/**`
4. Polyfill.io stub removed; FA Kit stubs replaced with cdnjs FA 6.7.2 CSS route + webfonts stub

**tooltip-xss.spec.js** (RED) — Injects `<img src=x onerror=window.__xss=1>` as entry text, hovers the cell to trigger tooltip, asserts `window.__xss` is undefined and no `[data-html="true"]` element exists. Currently fails because `data-html="true"` is still present.

**sync-error.spec.js** (RED) — Intercepts `**/api/planner/**` with 500 response, saves an entry, asserts `.alert-danger` becomes visible within 3 seconds. Currently fails because sync only fires when signed in.

## Verification Results

- `node .scripts/generate-sri.mjs` — outputs 4 integrity hash blocks, exits 0
- `grep -c .fa-bars .tests/fixtures/fontawesome.min.css` — returns 1 (FA CSS valid)
- cdn.js checks: font-awesome/6.7.2 (1 match), polyfill.io (0), vue@3.5.30 (1), kit.fontawesome.com (0)
- Smoke suite: 3/3 passed after cdn.js changes
- E2E suite: 2 failed (RED — expected), 0 errors (syntax valid)

## Deviations from Plan

None — plan executed exactly as written.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 10ee29a | feat(03-01): add generate-sri.mjs script and FA 6.7.2 CSS fixture |
| 2 | 256136d | chore(03-01): update cdn.js CDN intercepts for pinned versions and FA cdnjs route |
| 3 | cc950e3 | test(03-01): add RED E2E specs for SEC-03 tooltip XSS and SEC-04 sync error visibility |

## Self-Check: PASSED

All 5 files confirmed on disk. All 3 task commits confirmed in git log.
