# S01: Controller Decomposition — Research

**Date:** 2026-03-13

## Summary

S01 splits the monolithic 314-line `js/vue/controller.js` (34 methods mixing 5 concerns) into 5 domain-grouped method modules under `js/vue/methods/`. The controller is a plain object literal passed as `methods: controller` to `Vue.createApp()`. Each method uses `this` to access Vue instance state (model fields) and CDI-injected services (`this.api`, `this.storageLocal`, `this.storage`). The split is mechanical: group methods by domain, export each group as an object literal, import all five into `app.js`, and spread them into the Vue `methods` option.

The primary risk is that methods call each other across domain boundaries via `this` — e.g. `createPlanner()` calls `this.createLocalPlanner()`, `refresh()` calls `this.setYear()`. Because all method objects are spread into the same Vue `methods`, cross-module `this.xxx()` calls work unchanged — they resolve on the Vue instance proxy. No adapter or delegation pattern is needed.

A secondary discovery: several template-bound method names (`sendRecoverPasswordEmail`, `setUsername`, `setPassword`, `setEmail`, `sendVerificationEmail`, `sendRecoverUsernameEmail`, `updateMonthColour`, `reset`) are NOT in the controller — they live on `Api.js`, `Storage.js`, and `StorageLocal.js`. They're called from templates without an object prefix (e.g. `v-on:click="sendRecoverPasswordEmail(username)"`), which likely means they're broken at runtime (Vue 3 doesn't flatten data-nested object methods). These are out of scope for S01 — they relate to auth/profile features addressed in S03/S04.

## Recommendation

**Approach: Mechanical split with spread merge in app.js**

1. Create `js/vue/methods/` directory with 5 modules: `calendar.js`, `entries.js`, `planner.js`, `auth.js`, `lifecycle.js`
2. Each module exports a named const object literal containing its methods
3. Update `app.js` to import all 5 and spread into `methods: { ...calendarMethods, ...entryMethods, ...plannerMethods, ...authMethods, ...lifecycleMethods }`
4. Delete `controller.js` import from `app.js` and `contexts.js`
5. The `controller` CDI registration in `contexts.js` can be removed since the controller object was only used as a pass-through to Vue methods — CDI never injected anything into it (it has no `qualifier` or null fields)
6. Run all 14 E2E tests to verify

**Why this approach:** The controller is a plain object, not a class. Methods rely on `this` binding from Vue, not from CDI. Splitting into object literals that merge via spread preserves the exact same runtime behaviour — Vue sees one flat methods object, identical to today.

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Method `this` binding | Vue Options API proxy | Methods in the `methods` option are auto-bound to the Vue instance. No manual `.bind()` needed — just spread the objects. |
| DateTime calculations | Luxon (`DateTime.local()`, `DateTime.now()`) | Already used in controller. Import it in modules that need it (calendar, entries, planner). |
| Cross-method calls | Vue instance `this` proxy | `this.setYear()` from `refresh()` works because both are on the same Vue instance. No delegation needed. |

## Existing Code and Patterns

- `js/vue/controller.js` — 314 lines, plain object exported as `export const controller = { ... }`. All 34 methods. Import: Luxon DateTime.
- `js/vue/app.js` — 27 lines, `Vue.createApp({ data() { return model }, methods: controller, mounted() { this.refresh() } })`. This is the merge point — replace `methods: controller` with spread of 5 imports.
- `js/vue/model.js` — 59 lines, flat state bag. Has `qualifier: '@alt-html/year-planner/vue/controller'` for CDI autowiring. CDI injects `api`, `storage`, `storageLocal`, `messages` into null fields. Since `data()` returns this object, injected services are available as `this.api` etc. in methods.
- `js/config/contexts.js` — 39 lines, CDI context array. `controller` registered as `{name:'controller', Reference: controller}`. Classes (Api, Storage, etc.) registered directly and CDI instantiates them. Plain objects registered with `{name, Reference}` pattern.
- `js/Application.js` — 92 lines, bootstrapper. Populates model with dynamic fields (`uid`, `year`, `lang`, `theme`, `name`, `share`, etc.) before Vue mounts. These fields are not in `model.js` statically but are available at runtime.
- `js/main.js` — 21 lines, CDI entry point. `new ApplicationContext({contexts, config}); await applicationContext.start()`.

## Method Grouping

### `calendar.js` — calendarMethods (2 methods)
- `setYear(year)` — populates firstWeekdayOfMonth/daysInMonth arrays via Luxon DateTime. **Uses:** DateTime, model fields.
- `navigateToYear()` — parses nyear, sets year, redirects. **Uses:** model fields, window.location.

### `entries.js` — entryMethods (7 methods)
- `updateEntry(mindex, day, entry, entryType, entryColour, syncToRemote)` — delegates to storageLocal, optionally syncs. **Uses:** `this.storageLocal`, `this.api`.
- `updateWeekColour(mindex, day, entryColour)` — applies colour to remaining weekdays. **Uses:** DateTime, `this.getEntry()`, `this.getEntryType()`, `this.daysInMonth`, `this.updateEntry()`.
- `updateEntryState(mindex, day)` — loads entry state into modal fields. **Uses:** `this.api`, model fields, `this.getEntry()`, `this.getEntryType()`, `this.getEntryColour()`.
- `getEntry(mindex, day)` — reads entry text from planner data. **Uses:** `this.planner`.
- `getEntryType(mindex, day)` — reads entry type from planner data. **Uses:** `this.planner`.
- `getEntryColour(mindex, day)` — reads entry colour from planner data. **Uses:** `this.planner`.
- `getEntryTypeIcon(mindex, day)` — returns icon class based on entry type. **Uses:** `this.getEntryType()`.

### `planner.js` — plannerMethods (9 methods)
- `createPlanner()` — syncs then creates local, syncs to remote. **Uses:** `this.api`, `this.createLocalPlanner()`.
- `createLocalPlanner()` — creates new uid/planner/preferences, redirects. **Uses:** DateTime, `this.storageLocal`, `this.storage`, `this.refresh()`, model fields.
- `deletePlannerByYear(uid, year)` — deletes and switches to remaining. **Uses:** `this.storageLocal`, `this.identities`, model fields.
- `showRenamePlanner()` — syncs and shows rename UI. **Uses:** `this.api`, model fields.
- `renamePlanner()` — saves name to preferences and syncs. **Uses:** DateTime, `this.storageLocal`, `this.messages`, `this.api`, model fields.
- `getPlannerName()` — returns current planner name from messages. **Uses:** `this.messages`, model fields.
- `getPlannerNameByUidYear(uid, year)` — returns name for specific uid/year. **Uses:** `this.storageLocal`, model fields.
- `getPlannerYears()` — returns years from local storage. **Uses:** `this.storageLocal`.
- `sharePlanner()` / `copyUrl()` — generates share URL. **Uses:** `this.storage`, model fields, navigator.clipboard.

### `auth.js` — authMethods (12 methods)
- `showProfile()` — opens profile modal with current data. **Uses:** `this.clearModalAlert()`, model fields, jQuery.
- `showRegister()` — clears and opens register modal. **Uses:** `this.clearModalAlert()`, model fields, jQuery.
- `register(username, password, email, mobile)` — validates and calls api.register(). **Uses:** `this.api`, `this.storageLocal`, model fields.
- `signin()` — validates and calls api.signin(). **Uses:** `this.api`, model fields.
- `signout()` — clears session and wipes storage. **Uses:** `this.storageLocal`, model fields.
- `showSignin()` — clears and opens signin modal. **Uses:** `this.clearModalAlert()`, model fields, jQuery.
- `showResetPassword()` — clears and opens reset password modal. **Uses:** `this.clearModalAlert()`, jQuery.
- `showRecoverUser()` — clears and opens recover username modal. **Uses:** `this.clearModalAlert()`, jQuery.
- `showDonate()` — calls initPaymentForm(), opens donate modal. **Uses:** jQuery, window global `initPaymentForm`. **Note:** will be deleted in S04 (MOD-05).
- `clearModalAlert()` — resets modal error/warning/success fields. **Uses:** model fields only.
- `peekPass()` / `unpeekPass()` / `peekNewPass()` / `unpeekNewPass()` — toggle password visibility. **Uses:** model fields only.

### `lifecycle.js` — lifecycleMethods (4 methods)
- `refresh()` — main orchestrator: sets year, accepts cookies, syncs, sets URL, applies theme. **Uses:** `this.setYear()`, `this.storageLocal`, `this.api`, model fields, window.location.
- `initialise()` — saves current state to local storage and refreshes. **Uses:** `this.storageLocal`, `this.refresh()`, model fields.
- `setLocalFromModel()` — wrapper not in controller (it's on StorageLocal). Actually in controller at line 10 as `this.storageLocal.setLocalFromModel()` call, not a controller method itself.
- `clearError()` — resets error/warning fields. **Uses:** model fields only.

**Correction:** `setLocalFromModel` is a method on StorageLocal, not a controller method. The lifecycle module has 3 methods: `refresh`, `initialise`, `clearError`.

## Constraints

- **No build step** — Pure ES6 modules loaded from CDN. New method files must use bare relative imports and CDN imports for Luxon.
- **Vue Options API `this` binding** — All methods must be plain functions (not arrow functions) in object literals so Vue can bind `this` to the component instance.
- **CDI autowiring on the model** — The `model` object's null properties (`api`, `storage`, `storageLocal`, `messages`) are injected by CDI. This mechanism must NOT change in S01. The model's `qualifier` field triggers CDI autowiring.
- **Template bindings unchanged** — S01 must not change any `.compose` fragment or `index.html` template. All method names must be preserved exactly.
- **`mounted()` calls `this.refresh()`** — The Vue mounted hook calls `refresh()` which must be in the merged methods. `app.js` must import lifecycle methods.
- **DateTime import** — Luxon `DateTime` is imported in controller.js. Modules that use it (calendar, entries, planner) must each import it from the CDN URL.

## Common Pitfalls

- **Arrow functions in method objects** — Arrow functions don't get `this` bound by Vue. Every method must be a shorthand method (`methodName() {}`) or regular function, never `methodName: () => {}`. The existing controller uses shorthand methods — preserve this pattern.
- **Missing method in spread** — If any method is accidentally omitted from the split, the app will fail silently (undefined function) or throw at runtime. The 14 E2E tests exercise boot, entry CRUD, planner management but NOT auth flows — manual verification may be needed for auth modal methods.
- **Import order in app.js** — If two modules export the same method name, the last spread wins. Verify no method name duplicates exist across the 5 modules.
- **CDI context registration** — The `{name:'controller', Reference: controller}` entry in contexts.js currently exists. Since controller is only used by app.js (not injected into any class via CDI), this registration can likely be removed. But verify no class declares `this.controller = null` first.
- **`showDonate` references `initPaymentForm` global** — This method calls `initPaymentForm()` which is a window global set by SquareUp.js. It must stay in auth.js for now and will be deleted in S04.

## Open Risks

- **Cross-module method calls are invisible at import time** — `updateWeekColour` calls `this.updateEntry()`, `refresh()` calls `this.setYear()`, `createPlanner()` calls `this.createLocalPlanner()`. These work because Vue merges everything, but a future refactor that breaks the merge would silently break cross-module calls. Document the cross-module `this` dependencies in each module.
- **Template bindings calling Api/Storage methods directly** — `sendRecoverPasswordEmail`, `setUsername`, `setPassword`, `setEmail`, `sendVerificationEmail`, `sendRecoverUsernameEmail` (Api.js), `updateMonthColour` (Storage.js), and `reset` (StorageLocal.js) are called from templates without object prefix. These likely don't work at runtime but are never tested. S01 should NOT attempt to fix this — it's an S03/S04 concern. But it means S03's API split must also address template binding for these methods.
- **Controller CDI removal impact** — Removing `{name:'controller', Reference: controller}` from contexts.js should be safe since no class has `this.controller = null`, but verify by grepping for `controller` in class constructors.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| Vue.js | (searched `npx skills find "Vue.js"`) | none relevant found — Vue Options API patterns are well-known |
| @alt-javascript/cdi | (searched `npx skills find "CDI dependency injection"`) | none found — niche library, source read directly from /Users/craig/src/alt-javascript/cdi/ |
| Luxon | not searched | standard date library, no skill needed |

## Forward Intelligence for S02

- The 5 method modules export plain objects with method shorthand. S02 will need to update `this.fieldName` references inside these methods when model fields move to grouped sub-objects — but the method module files are the code to modify, not the deleted controller.js.
- Cross-module `this` dependencies (documented above) mean S02 must update field references in ALL 5 modules, not just the module that "owns" a domain.
- The `mounted()` hook in app.js calls `this.refresh()` — this stays unchanged.

## Forward Intelligence for S03

- Template bindings `sendRecoverPasswordEmail(username)`, `setUsername(username)`, `setPassword(password, newpassword)`, `setEmail(email)`, `sendVerificationEmail()`, `sendRecoverUsernameEmail(email)` call Api methods without prefix. When Api.js is split into SyncApi/AuthApi/ProfileApi, these must either: (a) become wrapper methods in the auth method module, or (b) be rewritten in templates as `api.sendRecoverPasswordEmail(username)` etc. Option (a) is safer for S03.
- Similarly, `updateMonthColour(month,day,entryColour)` calls `Storage.updateMonthColour()` from templates without prefix. Needs a wrapper in entries module or template fix.
- `reset()` calls `StorageLocal.reset()` from the feature modal template. Needs a wrapper in lifecycle module or template fix.

## Sources

- CDI autowiring mechanism (source: `/Users/craig/src/alt-javascript/cdi/ApplicationContext.js` lines 302-330 — null properties auto-injected by name match)
- Vue 3 Options API methods binding (source: Vue documentation — methods in options are bound to component instance, accessible via `this`)
