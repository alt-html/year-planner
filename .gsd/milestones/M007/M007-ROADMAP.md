# M007: M007: Boot v3 Uplift

## Vision
Replace all @alt-javascript v2 CDN imports with v3.0.3, adopt the cleaner Boot/Context/Singleton API, migrate config to ProfileAwareConfig, wire boot-vue's createCdiApp, and keep all 14 E2E tests green throughout.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | Core framework swap — config, contexts, Boot.boot() | high | — | ✅ | app boots with v3 config/logger/cdi bundles; `ProfileAwareConfig` resolves env-specific API URL; services autowire logger correctly; boot E2E test passes. |
| S02 | main.js — wire boot-vue createCdiApp + E2E fixture coverage | medium | S01 | ✅ | all 14 E2E tests pass with offline-intercepted v3 CDN fixtures; zero v2 CDN references remain in the codebase. |
