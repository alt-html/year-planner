# CONVENTIONS.md — Code Style & Patterns

## Language & Runtime

- Vanilla ES6+ (no transpilation, no build step)
- Native ES modules (`import`/`export`) loaded directly by browser
- All libraries loaded from CDN in `index.html` — no npm/package.json

## Naming

| Scope | Convention | Example |
|---|---|---|
| Classes | PascalCase | `StorageLocal`, `Application` |
| Methods & variables | camelCase | `getPlannerData()`, `currentYear` |
| Files (class files) | PascalCase | `StorageLocal.js`, `Application.js` |
| Files (utility/config) | camelCase or kebab-case | `urlparam.js`, `contexts.js` |
| CSS classes | kebab-case | `yp-dark`, `planner-cell` |
| i18n message keys | camelCase dot-notation | `settings.theme`, `nav.register` |
| Storage/planner IDs | numeric strings (Unix timestamp) | `"1234567890"` |

## Module & Class Pattern

Classes use constructor injection via Alt-JavaScript CDI. Dependencies are declared as constructor parameters and injected by the CDI container.

```js
// js/service/StorageRemote.js
export class StorageRemote {
  constructor(api, storageLocal) {
    this.api = api
    this.storageLocal = storageLocal
  }
  // ...
}
```

No class inheritance hierarchies — composition via DI only.

## CDI Context Pattern

All service bindings are declared in `js/config/contexts.js`. The CDI container resolves the dependency graph at startup.

```js
// js/config/contexts.js
context.bind(StorageRemote).to(StorageRemote).inject(Api, StorageLocal)
```

## Error Handling

Promise-based with explicit HTTP status code checks. No `try/catch` wrapping — errors propagate as rejected promises.

```js
// js/service/Api.js — typical pattern
return superagent
  .post(`${this.apiUrl}/register`)
  .send(payload)
  .then(res => {
    if (res.status === 200) return res.body
    throw new Error(`Unexpected status: ${res.status}`)
  })
```

Vue controller catches errors and updates model state (e.g. `model.error = err.message`).

## Logging

Uses `alt-js/logger` injected via CDI. Log levels controlled via config.

```js
this.logger.debug('StorageLocal.save', data)
this.logger.error('Api.register failed', err)
```

## Vue Model & Controller Split

- `js/vue/model.js` — all reactive data (`data()` return object). No methods here.
- `js/vue/controller.js` — all Vue methods. References `this` (Vue instance) for reactive data access.

## i18n Pattern

Messages loaded from per-language files in `js/vue/i18n/`. The `messages.js` loader aggregates them. Vue-i18n v9 composables used in templates via `$t('key')`.

## CSS Theming

Light theme: `css/main.css` (default)
Dark theme: `css/yp-dark.css` — applied by toggling a CSS class on `<body>` or root element. Stored in user preferences via `StorageLocal`.

## Code Style

- No linter or formatter configured
- Single quotes for strings in JS
- 2-space indentation
- Arrow functions for callbacks; regular functions for class methods
- No semicolons (some files) — inconsistent across codebase
