---
slice: M007/S02
title: E2E fixture coverage for v3 CDN bundles
status: complete
date: 2026-03-21
---

## What Was Done

- Downloaded all seven fixture files to `.tests/fixtures/`:
  - `alt-javascript-common-esm.js` (1.7 KB, self-contained)
  - `alt-javascript-config-esm.js` (17 KB)
  - `alt-javascript-logger-esm.js` (13 KB)
  - `alt-javascript-cdi-esm.js` (59 KB)
  - `alt-javascript-boot-esm.js` (4 KB)
  - `alt-javascript-boot-vue-esm.js` (4 KB)
  - `lodash-es.min.js` (16 KB, transitive dep of cdi bundle)

- Updated `.tests/fixtures/cdn.js` with seven new intercept routes (items 12–13) covering all `@alt-javascript/*@3` ESM bundle URLs and `lodash-es`. Old v2 routes were already absent (they were never explicitly intercepted; the app was hitting the real CDN). Zero v2 CDN references remain anywhere in `js/` or `cdn.js`.

## Verification

- All 14 Playwright E2E tests pass with fully offline fixture interception.
- `grep` confirms zero v2 `@alt-javascript` references in `js/` and `cdn.js`.
