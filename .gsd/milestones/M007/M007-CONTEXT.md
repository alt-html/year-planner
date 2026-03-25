# M007: Boot v3 Uplift — Context

## What This Is

Uplift the year-planner from @alt-javascript v2 to v3.0.3. v3 is a complete rewrite as a monorepo with breaking API changes. This milestone is purely a framework upgrade — no user-visible behaviour changes.

## Scope

Three JS files change. All service classes and Vue templates are untouched.

| File | v2 | v3 |
|---|---|---|
| `js/config/config.js` | `ConfigFactory.getConfig()` with URL-as-key env switching | `ProfileAwareConfig` + `BrowserProfileResolver` with declarative URL→profile mapping |
| `js/config/contexts.js` | bare class array + manual `LoggerFactory`/`LoggerCategoryCache` construction | `Context([Singleton(...)])` helpers; logger infra provided by `Boot.boot()` via global root |
| `js/main.js` | `new ApplicationContext({contexts,config}).start()` | `Boot.boot({config})` then `createCdiApp({contexts,config,rootComponent,onReady})` from `boot-vue` |

## CDN URL Map (v2 → v3)

| Package | v2 URL | v3 URL |
|---|---|---|
| config | `@alt-javascript/config@2/dist/alt-javascript-config-esm.js` | `@alt-javascript/config@3/dist/alt-javascript-config-esm.js` |
| logger | `@alt-javascript/logger@2.0.3/dist/alt-javascript-logger-esm.js` | `@alt-javascript/logger@3/dist/alt-javascript-logger-esm.js` |
| cdi | `@alt-javascript/cdi/dist/alt-javascript-cdi-esm.js` (unpinned) | `@alt-javascript/cdi@3/dist/alt-javascript-cdi-esm.js` |
| boot | (not used in v2) | `@alt-javascript/boot@3/dist/alt-javascript-boot-esm.js` |
| boot-vue | (not used in v2) | `@alt-javascript/boot-vue@3/dist/alt-javascript-boot-vue-esm.js` |
| common | (not used directly) | (transitive — served by cdi/config/logger bundles) |

## v3 API Notes

### ProfileAwareConfig pattern
```js
// v2 — URL-as-key (gone)
"http://127+0+0+1:8080/": { api: { url: 'http://localhost:8081' } }

// v3 — declarative profile overlay
profiles: {
  urls: { 'localhost:8080': 'dev' },
  dev: { api: { url: 'http://localhost:8081' } }
}
```

### contexts.js — Context/Singleton helpers
```js
// v2
export default [ Api, Application, ... ]

// v3
import { Context, Singleton } from '@alt-javascript/cdi@3/...'
export default new Context([ new Singleton(Api), new Singleton(Application), ... ])
// Plain object refs (non-class values like app, model, i18n) still use { name, Reference } shape
```

### main.js — Boot + createCdiApp
```js
// v2
let applicationContext = new ApplicationContext({contexts, config});
await applicationContext.start();

// v3
import { Boot } from '...boot...'
import { createCdiApp } from '...boot-vue...'
Boot.boot({ config });
const { vueApp, applicationContext } = await createCdiApp({
  contexts: [contexts],
  config,
  rootComponent,
  onReady: async (app, ctx) => {
    const application = ctx.get('application');
    application.init();
    await application.run();   // mounts Vue, sets data-app-ready
  }
});
window.applicationContext = applicationContext;
```

### CDI backward compatibility
- `ApplicationContext` constructor still accepts bare arrays — but `Context([Singleton(...)])` is the v3 idiom
- Service classes need no changes: `this.qualifier` + `this.logger = null` autowiring works identically
- `loggerFactory` and `loggerCategoryCache` are no longer registered manually in contexts.js — `Boot.boot()` places them in the global root and `detectGlobalContextComponents()` picks them up automatically

## Constraints

- No service class changes (Api, Storage, StorageLocal, StorageRemote, AuthProvider, Application)
- No Vue template changes
- No HTML composition changes
- No new npm dependencies in .tests/
- Test fixture files for v3 bundles are downloaded and committed locally (same pattern as existing fixtures)
