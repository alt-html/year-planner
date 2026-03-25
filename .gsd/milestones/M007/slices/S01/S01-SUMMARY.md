---
slice: M007/S01
title: Core framework swap — config, contexts, Boot global root
status: complete
date: 2026-03-21
---

## What Was Done

- `js/config/config.js`: Replaced `ConfigFactory.getConfig()` + v2 URL-key pattern with `ProfileAwareConfig` + `BrowserProfileResolver`. Active profiles resolved from URL mapping (`localhost:8080` and `127.0.0.1:8080` → `dev`). Dev overlay carries the `logging.format/level` overrides previously encoded as the `"http://127+0+0+1:8080/"` key.

- `js/config/contexts.js`: Replaced bare class array with `new Context([new Singleton(...)])` using helpers imported from the v3 cdi ESM bundle. Removed manual `LoggerFactory`/`LoggerCategoryCache`/`ConfigurableLogger` construction — these are now populated via the global boot root in `main.js` and picked up by `detectGlobalContextComponents()`.

- `js/main.js`: Kept `ApplicationContext` for now (v2-style construction still supported). Added explicit global root population (`getGlobalRef().boot = { contexts: { root: { config, loggerFactory, loggerCategoryCache } } }`) so CDI autowires loggers correctly without needing `Boot.boot()` directly (which can't wrap `ProfileAwareConfig`).

## Key Decisions

- `ProfileAwareConfig` is used directly without `ConfigFactory.getConfig()` wrapping. It implements `has()`/`get()` natively. `Boot.detectConfig()` cannot wrap it cleanly in browser mode, so global root is set manually in main.js.
- Service classes (`Api`, `Application`, `AuthProvider`, `Storage`, `StorageLocal`, `StorageRemote`) are unchanged — CDI autowiring via `this.qualifier`/`this.logger = null` is backward-compatible with v3.

## Verification

- All 14 Playwright E2E tests pass.
