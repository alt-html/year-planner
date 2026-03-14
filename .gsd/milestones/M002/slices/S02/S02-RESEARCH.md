# S02: Model Restructuring — Research

**Date:** 2026-03-14

## Summary

S02 splits the monolithic `model.js` (43 static fields + 17 dynamic fields set by `Application.js`) into domain-grouped source files under `js/vue/model/`. The critical design decision is whether to expose grouped sub-objects to templates (nested paths like `auth.username`) or compose back to a flat object for `data()` (preserving existing template bindings).

The boundary map specifies "compose sub-objects into flat model for Vue data()" — meaning the model sub-files are an **organizational** improvement, not a runtime restructuring. Templates and method modules continue to use flat field names. This dramatically reduces risk: no template binding changes, no method module updates, no Application.js changes to field paths.

The main value is: (1) all ~60 model fields are now documented and grouped by domain in source, (2) dynamic fields currently only set at runtime by Application.js are now declared with initial values, making the full state shape visible at import time, and (3) future milestones (M003, M004) can modify fields in the relevant sub-file without hunting through a monolithic model.

## Recommendation

**Approach: Source-level split with flat spread merge in model.js**

1. Create `js/vue/model/` directory with 4 sub-files: `calendar.js`, `planner.js`, `auth.js`, `ui.js`
2. Each sub-file exports a named const object with its domain fields (including initial values for dynamic fields)
3. `model.js` imports all 4 and spreads them into the existing model object alongside CDI/service fields
4. No template or method module changes required — runtime model is identical to today
5. Application.js continues to set `this.model.fieldName` — works because fields still exist flat on the model
6. Run `.compose/build.sh` to recompose (no fragment changes needed)
7. All 14 E2E tests pass

**Why this approach:** The boundary map explicitly says "compose sub-objects into flat model for Vue data()." Template binding changes would cascade to ~75+ bindings across 18 fragments and all 5 method modules — massive risk for organizational benefit that can be achieved without it.

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Reactive nested objects | Vue 3 Proxy reactivity | Vue 3 makes all `data()` properties reactive via Proxy — spread objects are automatically reactive |
| CDI autowiring | model qualifier + null fields | CDI injects services into null-valued properties matching registered names. Keep these on model.js, not sub-files |

## Existing Code and Patterns

- `js/vue/model.js` — 43 static fields. CDI qualifier `@alt-html/year-planner/vue/controller`. Null fields for CDI: `logger`, `api`, `messages`, `storage`, `storageLocal`. The `feature` field imports from `model-features.js` (already a sub-module pattern).
- `js/Application.js` — `init()` method populates 17 dynamic fields on `this.model.*`: uid, uuid, pageLoadTime, identities, preferences, year, lang, theme, name, share, updated, cyear, cmonth, cday, registered, signedin, planner. These are NOT declared in model.js today — they're "ghost" fields.
- `js/vue/model-features.js` — Existing precedent for model sub-module. Exports `feature` object imported by model.js.

## Field Inventory and Grouping

### calendar.js — calendarState (10 fields)
**Static:** DateTime, nyear, daysOfWeek, monthsOfYear, firstWeekdayOfMonth, daysInMonth
**Dynamic (from Application.js):** year, cyear, cmonth, cday

### planner.js — plannerState (11 fields)
**Static:** month, day, entry, entryType, entryColour, shareUrl
**Dynamic (from Application.js):** uid, planner, identities, preferences, updated, name, share, pageLoadTime

### auth.js — authState (17 fields)
**Static:** username, password, newpassword, peek, peeknp, rememberme, changeuser, changepass, email, emailverified, changeemail, mobile, mobileverified, donation, paymentSuccess, receiptUrl
**Dynamic (from Application.js):** uuid, registered, signedin

### ui.js — uiState (9 fields)
**Static:** error, warning, modalError, modalErrorTarget, modalWarning, modalSuccess, loaded, touch, rename

### Remaining in model.js (7 fields)
**CDI/service:** qualifier, logger, api, messages, storage, storageLocal
**Sub-module:** feature (imported from model-features.js)

### Dynamic fields from Application.js (also set on model at runtime)
**Calendar:** year, cyear, cmonth, cday
**Planner:** uid, planner, identities, preferences, updated, name, share, pageLoadTime
**Auth:** uuid, registered, signedin
**Other:** lang, theme — these cross concerns (used everywhere). Place in planner.js alongside uid since they're part of the planner identity/preferences context.

## Constraints

- **CDI null fields must stay on model.js** — `qualifier`, `logger`, `api`, `messages`, `storage`, `storageLocal` are autowired by CDI matching property names to registered context names. Moving them to sub-files would break autowiring because CDI resolves on the model object's own properties.
- **Vue data() must return a flat object** — The existing model is a flat object. Keeping it flat avoids template and method changes.
- **No build step** — Pure ES6 modules. Sub-files must use `export const`.
- **Application.js sets fields by direct assignment** — `this.model.year = ...` works on the flat model. No path changes needed.
- **Dynamic fields need initial values** — Declaring dynamic fields with sensible defaults (null, '', 0, false, []) in sub-files makes the model shape explicit and avoids Vue reactivity caveats.

## Common Pitfalls

- **Moving CDI fields to sub-files** — CDI autowires by scanning the object's own properties for null values matching registered names. If `api: null` is in a sub-file and spread into model, it IS on the model's own properties after spread — so this would work. But keeping CDI fields on model.js is clearer and preserves the existing pattern.
- **Forgetting dynamic fields** — 17 fields are only set by Application.js at runtime. If they're not declared in model sub-files with initial values, they're still "ghost" fields. The main value of S02 is making these visible.
- **Spread order matters** — If two sub-files export the same field name, the last spread wins. Verify no field name duplicates across sub-files.
- **feature field special handling** — `feature` is already imported from `model-features.js` and set on model. Keep this pattern — it stays in model.js alongside CDI fields.

## Open Risks

- **Negligible** — This approach (flat spread) has minimal runtime risk. The model object at runtime is identical to today. The only risk is a typo in a field name causing a property to be missing from the spread.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| Vue.js | none relevant | Vue Options API data() patterns are well-known |

## Sources

- Field inventory extracted from `js/vue/model.js` (43 static fields) and `js/Application.js` (17 dynamic fields)
- Template binding audit across all 18 `.compose/fragments/*.html` files
- S01 research forward intelligence for S02
