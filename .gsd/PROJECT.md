# Year Planner

## What This Is

A multi-lingual, offline-first progressive web app (PWA) year planner. It renders a weeks-by-months calendar grid and lets users keep per-day diary entries (type, tagline, colour, notes, emoji) in localStorage, with optional account-based sync.

Live app: https://d1uamxeylh4qir.cloudfront.net/

## Core Value

A planner that works immediately offline with no account friction, while still supporting reliable sync when the user signs in.

## Current State

- Vanilla ES module browser app (no bundler), static assets under `site/`
- Vue 3 app mounted through CDI boot wiring (`@alt-javascript/boot-vue`)
- localStorage M009 schema and jsmdma/HLC sync contract implemented
- M011 completed: sync rewrite + MOD cleanup completed and verified in Playwright
- Current branding/icon assets are functional but minimal and visually weak for platform install surfaces (browser/mobile/desktop)

## Architecture / Key Patterns

- Entry: `site/index.html` → `site/js/main.js` → CDI contexts → Vue app
- Services in `site/js/service/` (`Storage`, `StorageLocal`, `Api`, `SyncClient`, etc.)
- Planner data model keyed by ISO date (`days[YYYY-MM-DD]`)
- PWA metadata through `site/manifest.json` and `<head>` icon links in `site/index.html`
- Existing mock exploration assets in `mockups/` (used as prior art for M012)

## Capability Contract

See `.gsd/REQUIREMENTS.md` for the explicit capability contract, requirement status, and coverage mapping.

## Milestone Sequence

- [x] M001: Migration — baseline migration and project stabilization
- [x] M002: JS Modularisation — modular service/method split and cleanup
- [x] M003: Storage Modernisation — local storage architecture hardening
- [x] M004: Auth & API Contract — auth/api structure alignment
- [x] M005: UI/UX Design Research — design exploration and direction input
- [x] M006: UI/UX Polish & Finalisation — UI refinement and consistency pass
- [x] M007: Boot v3 Uplift — boot/runtime upgrade to boot-vue v3
- [x] M008: Day Data Model Extension — richer day model support and UI wiring
- [x] M009: localStorage Schema Redesign — schema redesign for sync-readiness
- [x] M010: Planner Ownership/Identity Alignment — ownership/identity alignment work
- [x] M011: jsmdma Sync Protocol & MOD Cleanup — sync protocol rewrite and legacy cleanup
- [ ] M012: Brand/Icon System Overhaul — select and integrate a full cross-platform icon set with live wiring and desktop packaging assets
