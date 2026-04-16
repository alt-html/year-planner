# Year Planner

## What This Is

A multi-lingual, offline-first progressive web app (PWA) year planner. It renders a weeks-by-months calendar grid and stores per-day entries (type, tagline, colour, notes, emoji) locally, with optional account-based sync using jsmdma document mechanics.

Live app: https://d1uamxeylh4qir.cloudfront.net/

## Core Value

A planner that works immediately offline with low friction, while supporting reliable multi-document sync when signed in.

## Current State

- Static ES-module app under `site/` (no bundler)
- Vue 3 app mounted via CDI boot wiring
- Multi-planner jsmdma document model with `userKey` ownership and per-document UUIDs
- M011 complete: sync protocol rewrite + legacy MOD cleanup
- M012 complete: brand/icon overhaul delivered and ratified
- M013 planned: legacy architecture cleanup (URL state removal, uid removal, feature/share legacy removal, system-follow language/theme modes)

## Architecture / Key Patterns

- Entry: `site/index.html` → `site/js/main.js` → CDI contexts → Vue app
- Service layer in `site/js/service/` (`PlannerStore`, `StorageLocal`, `Api`, etc.)
- Planner data modeled by ISO day keys (`days[YYYY-MM-DD]`) inside jsmdma planner documents
- PWA metadata served from composed HTML + `site/manifest.json`
- Tests in `.tests/` with Playwright smoke + e2e coverage and fixture-based CDN interception

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
- [x] M012: Brand/Icon System Overhaul — cross-platform icon system integration and sign-off
- [ ] M013: Legacy Alignment Cleanup — remove legacy URL/uid/share/feature drift and add system-follow language/theme behavior
