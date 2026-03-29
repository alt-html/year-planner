# Requirements

## Active

### MOD-01 — Split controller.js into domain-grouped method modules

- Class: core-capability
- Status: active
- Description: Replace the monolithic 314-line controller.js with focused method modules grouped by domain (calendar, entries, planner, auth, UI lifecycle). Each module exports a methods object that is merged into the Vue app.
- Why it matters: The current controller mixes 5+ concerns — calendar navigation, entry CRUD, planner management, auth UI, and app lifecycle — making it hard to reason about, modify, or test any single capability.
- Source: user
- Primary owning slice: M002/S01
- Supporting slices: none
- Validation: validated
- Notes: Methods are plain object literals spread into Vue Options API `methods`. The `this` context is the Vue instance. Validated by M002/S01 — all 14 E2E tests pass with split controller.

### MOD-02 — Restructure model.js into grouped sub-objects

- Class: core-capability
- Status: active
- Description: Replace the flat 40+ field model object with grouped sub-objects (e.g. model.auth, model.planner, model.calendar, model.ui). Update all template bindings in .compose fragments and recompose index.html.
- Why it matters: The flat model conflates auth state, planner data, calendar state, and UI transients — making ownership unclear and refactoring risky.
- Source: user
- Primary owning slice: M002/S02
- Supporting slices: M002/S05
- Validation: validated
- Notes: Model split into 4 domain sub-files (calendar, planner, auth, ui) with flat spread merge. Template bindings unchanged — runtime model shape preserved. Validated by M002/S02 — all 14 E2E tests pass.

### MOD-03 — Split Api.js into focused service modules

- Class: core-capability
- Status: active
- Description: Replace the monolithic 503-line Api.js with focused modules: SyncApi (sync to/from remote), AuthApi (register, signin, signout), ProfileApi (username, password, email, mobile changes). Each wired through CDI.
- Why it matters: Api.js bundles 12+ methods across sync, auth, profile, payment, and email verification. Splitting enables M004 to surgically replace auth and redesign the sync contract without touching unrelated code.
- Source: user
- Primary owning slice: M002/S03
- Supporting slices: M002/S05
- Validation: partial
- Notes: fetch migration complete in Api.js. Sub-module split (SyncApi/AuthApi/ProfileApi) deferred to S05 due to ES module import issues in test environment.

### MOD-04 — Replace superagent with native fetch

- Class: core-capability
- Status: active
- Description: Remove the superagent CDN dependency and replace all HTTP calls with native fetch API. Remove the `window.request = superagent` global.
- Why it matters: superagent is loaded as a global via CDN script tag. Native fetch eliminates a dependency, removes the window global, and aligns with modern web standards.
- Source: user
- Primary owning slice: M002/S03
- Supporting slices: none
- Validation: validated
- Notes: All superagent calls replaced with fetchJSON helper. CDN tag and window.request removed. Sync-error E2E test verifies fetch error handling.

### MOD-05 — Remove SquareUp.js and all payment-related code

- Class: core-capability
- Status: active
- Description: Delete SquareUp.js, remove payment modal HTML, remove payment-related methods from controller and Api, remove Square CDN script tag, remove payment feature flag.
- Why it matters: Donation payments are not needed. Removing dead code simplifies the codebase and eliminates a CDN dependency (Square payment form).
- Source: user
- Primary owning slice: M002/S04
- Supporting slices: none
- Validation: unmapped
- Notes: Includes removing `squarePayment`, `setDonation`, `showDonate`, `onGetCardNonce` methods and the `#payModal` HTML fragment.

### MOD-06 — Clean up feature flags into proper ES6 module

- Class: core-capability
- Status: active
- Description: Replace the current model-features.js with a proper ES6 module that exports feature flag state without polluting the window global (`window.ftoggle`).
- Why it matters: The current pattern uses a mutable window global for runtime toggling. A proper module is importable, testable, and doesn't leak globals.
- Source: user
- Primary owning slice: M002/S04
- Supporting slices: none
- Validation: unmapped
- Notes: Feature flags: debug, profile, register, signin, import, export, donate, pay. Payment-related flags removed with MOD-05.

### MOD-07 — Replace lodash with native Array methods

- Class: core-capability
- Status: active
- Description: Remove the lodash-es CDN dependency. Replace _.filter, _.find, _.findIndex, _.uniq, _.map, _.remove with native Array.prototype equivalents.
- Why it matters: All lodash usage has native equivalents. Removing it eliminates a CDN dependency and reduces load time.
- Source: user
- Primary owning slice: M002/S04
- Supporting slices: none
- Validation: unmapped
- Notes: Used in StorageLocal.js (getLocalPlannerYears, deleteLocalPlanner, deletePlannerByYear) and StorageRemote.js (synchroniseLocalPlanners, getRemotePlannerYears).

### MOD-08 — Update HTML template bindings for restructured model and recompose

- Class: core-capability
- Status: active
- Description: Update all Vue template bindings (v-model, v-on:click, mustache expressions) in .compose HTML fragments to reflect the restructured model sub-objects. Recompose index.html via m4 build.sh.
- Why it matters: Model restructuring (MOD-02) changes field paths. Templates must match or the app breaks.
- Source: user
- Primary owning slice: M002/S02
- Supporting slices: M002/S05
- Validation: unmapped
- Notes: ~60 v-on bindings and ~15 v-model bindings in the HTML need updating.

### MOD-09 — Wire all new modules through CDI

- Class: core-capability
- Status: active
- Description: Register all new split modules in contexts.js via @alt-javascript/cdi. Each module declares a qualifier and receives dependencies through constructor injection.
- Why it matters: The project uses CDI for all service wiring. New modules must follow the same pattern for consistency and testability.
- Source: user
- Primary owning slice: M002/S05
- Supporting slices: none
- Validation: unmapped
- Notes: Each new class needs a qualifier string, constructor parameters matching CDI names, and a `logger = null` field for auto-injection.

### MOD-10 — All 14 existing Playwright E2E tests pass after refactoring

- Class: quality-attribute
- Status: validated
- Description: The refactoring is behaviour-preserving. All 14 existing Playwright E2E tests (boot, entry CRUD, planner management, sync error, tooltip XSS, compose, harness) must pass without modification.
- Why it matters: The E2E tests are the safety net proving no regressions. If they pass, the refactoring preserved behaviour.
- Source: inferred
- Primary owning slice: M002/S05
- Supporting slices: M002/S01, M002/S02, M002/S03, M002/S04
- Validation: Validated in M008 — all 14 Playwright E2E tests passed at completion of each M008 slice (S01: 6.3s, S02: 6.2s, S03: 6.2s; final verification: 7.0s). Schema extension was fully additive and backward-compatible; no test files were modified.
- Notes: Tests run via `cd .tests && npx playwright test`. Currently 14 tests, ~7s.

### STO-01 — Replace cookie-based persistence with localStorage

- Class: core-capability
- Status: validated
- Description: Replace all cookie read/write operations with localStorage API. StorageLocal class internals change but its interface to the rest of the app remains stable.
- Why it matters: Cookies have 4KB limits, require consent modals, and are sent with every HTTP request. localStorage is simpler, has 5-10MB capacity, and needs no consent.
- Source: user
- Primary owning slice: M003
- Supporting slices: none
- Validation: Delivered in M003. localStorage-backed StorageLocal.js in production. All 14 E2E tests pass.

### STO-02 — Redesign localStorage schema with terse readable keys and HLC support

- Class: core-capability
- Status: active
- Description: Replace the cookie-era localStorage schema entirely. New schema: `dev` (device UUID), `tok` (JWT), `ids` (identities map), `prefs:{uid}` (preferences), `plnr:{planner-uuid}` (planner document), `rev:{planner-uuid}` (dot-path fieldRevs), `base:{planner-uuid}` (base snapshot for 3-way merge), `sync:{planner-uuid}` (baseClock). Day object keys renamed from opaque numerics to readable abbreviations: `tp` (type), `tl` (tagline), `col` (colour), `notes` (notes), `emoji` (emoji).
- Why it matters: The current schema is opaque (numeric keys), conflates user identity with device detection (uid = unix timestamp), has no HLC, and cannot support multi-device merge. The new schema supports the data-api sync protocol directly.
- Source: design session 2026-03-28
- Primary owning milestone: M009
- Supporting slices: none
- Validation: All 14 E2E tests pass after migration. localStorage inspected in browser shows readable keys.

### STO-03 — Keep LZString compression for share URL feature

- Class: constraint
- Status: active
- Description: The share URL feature encodes planner data into a URL parameter using LZString.compressToEncodedURIComponent. This compression must be preserved even though localStorage no longer needs it.
- Why it matters: Share URLs would be impossibly long without compression.
- Source: user
- Primary owning slice: M003 (provisional)
- Supporting slices: none
- Validation: unmapped
- Notes: LZString CDN dependency stays for this use case.

### STO-04 — Remove cookie consent modal and all cookie-related code

- Class: core-capability
- Status: validated
- Description: Remove the cookie consent modal (#cookieModal), the .compose/fragments/modals/cookie.html fragment, the acceptCookies/cookiesAccepted methods, and all cookie consent flow logic.
- Why it matters: No cookies means no consent needed. Removes UX friction and dead code.
- Source: user
- Primary owning slice: M003
- Supporting slices: none
- Validation: Delivered in M003. Cookie modal removed. TEST-04 (app auto-initialises without consent modal) validates this.

### STO-05 — Remove @alt-javascript/cookies CDN dependency

- Class: core-capability
- Status: validated
- Description: Remove the @alt-javascript/cookies package from CDN imports and CDI wiring. All cookie operations replaced by localStorage in STO-01.
- Why it matters: Eliminates a CDN dependency that is no longer needed.
- Source: user
- Primary owning slice: M003
- Supporting slices: none
- Validation: Delivered in M003. No @alt-javascript/cookies import in index.html.

### AUTH-01 — Working Google Sign-In (GIS) federated auth flow

- Class: core-capability
- Status: active
- Description: Implement Google Sign-In using Google Identity Services (GIS) JavaScript library. User can sign in with their Google account and receive an identity token.
- Why it matters: Replaces bespoke username/password registration with trusted federated auth. Google is the first provider (pattern-setter for Apple and Microsoft).
- Source: user
- Primary owning slice: M004 (provisional)
- Supporting slices: none
- Validation: unmapped
- Notes: GIS loads from accounts.google.com/gsi/client. Returns a JWT credential. Requires a Google Cloud project with OAuth consent screen.

### AUTH-02 — Working Apple Sign-In federated auth flow

- Class: core-capability
- Status: active
- Description: Implement Sign in with Apple for web. User can sign in with their Apple ID.
- Why it matters: Provides auth option for Apple ecosystem users.
- Source: user
- Primary owning slice: M004 (provisional)
- Supporting slices: none
- Validation: unmapped
- Notes: Requires Apple Developer account, Services ID, and domain verification. Uses appleid.auth.js SDK.

### AUTH-03 — Working Microsoft Sign-In (MSAL.js) federated auth flow

- Class: core-capability
- Status: active
- Description: Implement Microsoft Sign-In using MSAL.js. User can sign in with their Microsoft account.
- Why it matters: Provides auth option for Microsoft ecosystem users (Outlook, Office 365, school accounts).
- Source: user
- Primary owning slice: M004 (provisional)
- Supporting slices: none
- Validation: unmapped
- Notes: Uses @azure/msal-browser. Requires Azure AD app registration.

### AUTH-04 — Remove bespoke registration/login/password-reset system

- Class: core-capability
- Status: active
- Description: Remove all bespoke auth code: register, signin, signout, password reset, username recovery, email verification flows, and associated modals.
- Why it matters: Federated auth replaces all of this. Dead code removal.
- Source: user
- Primary owning slice: M004 (provisional)
- Supporting slices: none
- Validation: unmapped
- Notes: Large removal — register modal, signin modal, reset password modal, recover username modal, profile modal password/username/email change sections.

### AUTH-05 — Sync API contract defined via data-api

- Class: core-capability
- Status: deferred
- Description: Originally: produce a formal OpenAPI 3.x spec. Superseded by the data-api project which IS the sync contract. The year-planner uses data-api's `POST /year-planner/sync` endpoint directly. No separate OpenAPI spec file is needed in the year-planner repo.
- Why it matters: N/A — superseded.
- Source: user
- Primary owning milestone: deferred
- Validation: n/a — superseded by SYNC-01 through SYNC-08.

### AUTH-06 — Sync layer aligned to data-api protocol

- Class: core-capability
- Status: active
- Description: Rewrite the client-side sync layer (Api.js, StorageRemote.js) to use the data-api sync protocol: `POST /year-planner/sync` with HLC-clocked dot-path fieldRevs, `clientClock`, `changes` array, and `serverChanges` response. Replace the current raw-localStorage-dump push/pull pattern entirely.
- Why it matters: The current Api.js pushes the entire raw localStorage blob and receives a full replace. The data-api protocol is bidirectional, field-level, and merge-safe across multiple devices.
- Source: user (updated 2026-03-28)
- Primary owning milestone: M010
- Validation: Playwright E2E sync test: two devices edit different planner days offline, both sync, final state on each device contains both edits with zero data loss.

## Sync

### SYNC-01 — Stable device UUID generated on first load

- Class: core-capability
- Status: active
- Description: On first load, generate a UUID v4 via `crypto.randomUUID()` and persist it as `dev` in localStorage. This UUID is the HLC node ID for this device and is used as the planner UUID for the initial default planner. It never changes for the lifetime of that browser profile.
- Why it matters: The current uid is a unix timestamp — not a stable identifier and prone to collision across devices. A UUID is the correct identity primitive for a distributed sync system.
- Source: design session 2026-03-28
- Primary owning milestone: M009
- Validation: On fresh load, `localStorage.getItem('dev')` returns a UUID v4 string. On subsequent loads, the same value is returned.

### SYNC-02 — Multi-planner support: each planner is a UUID-keyed document

- Class: core-capability
- Status: active
- Description: A user can have multiple planners for the same year (e.g. "Work 2026", "Home 2026"). Each planner is a UUID-keyed document in the `planners` collection: `plnr:{planner-uuid}` in localStorage, key `{planner-uuid}` in `POST /year-planner/sync`. The planner switcher UI maps to listing local `plnr:*` keys. Creating a new planner creates a new UUID (client-generated via `crypto.randomUUID()`). Deleting a planner removes the local `plnr:`, `rev:`, `base:`, `sync:` keys for that UUID.
- Why it matters: The existing planner switcher already supports multiple planners per user. The new schema must preserve this capability and extend it to the sync layer.
- Source: design session 2026-03-28
- Primary owning milestone: M009
- Validation: User can create two planners for the same year, add entries to each, and both persist independently. Planner switcher shows both.

### SYNC-03 — Planner document structure: nested map with ISO date keys

- Class: constraint
- Status: active
- Description: Each planner document has the shape `{ meta: { name, year, lang, theme, dark, created }, days: { "YYYY-MM-DD": { tp, tl, col, notes, emoji } } }`. `days` is a plain object keyed by ISO date string — not an array. Only days with data are present (sparse). This shape is stored verbatim in `plnr:{uuid}` and sent as the sync document body.
- Why it matters: Maps are dot-path addressable by the data-api merge engine. Arrays are not. Sparse maps keep the document small (~5KB for a year with 50 active days).
- Source: design session 2026-03-28
- Primary owning milestone: M009
- Validation: `plnr:{uuid}` in localStorage parses to `{ meta: {...}, days: { "2026-03-28": {...} } }`. No arrays in the structure.

### SYNC-04 — HLC fieldRevs maintained per planner in localStorage

- Class: core-capability
- Status: active
- Description: For each planner, maintain a `rev:{planner-uuid}` key in localStorage containing a dot-path fieldRevs map: `{ "days.2026-03-28.tl": hlcString, "meta.name": hlcString, ... }`. Each time a field is edited, advance the device HLC via `HLC.tick()` and update the corresponding dot-path entry. Also maintain `sync:{planner-uuid}` as the baseClock (last `serverClock` received from the server for that planner).
- Why it matters: Without per-field HLC revision tracking, the sync engine cannot determine which side's change is newer for a given field. fieldRevs are the causal foundation of the merge protocol.
- Source: design session 2026-03-28
- Primary owning milestone: M009
- Validation: After editing a day entry, `rev:{uuid}` contains a dot-path entry for each changed field with an HLC string value.

### SYNC-05 — Base snapshot maintained per planner for 3-way text merge

- Class: core-capability
- Status: active
- Description: After each successful sync, persist a `base:{planner-uuid}` snapshot of the planner document as received from the server. This base is used by the data-api merge engine for 3-way text merge of the `notes` field — without it, concurrent notes edits on two devices fall back to HLC winner instead of auto-merging.
- Why it matters: The notes field is the most likely to be concurrently edited on two devices (both devices add notes about the same day). 3-way text merge preserves both sets of additions; HLC winner discards one.
- Source: design session 2026-03-28
- Primary owning milestone: M009
- Validation: After sync, `base:{uuid}` exists and matches the last serverChanges document for that planner.

### SYNC-06 — SyncClient wraps data-api protocol in year-planner

- Class: core-capability
- Status: active
- Description: Implement `js/service/SyncClient.js` that wraps the data-api sync protocol for the year-planner. Uses `HLC` and `flatten` from the local `data-api-core.esm.js` bundle. Manages `baseClock`, `fieldRevs`, and `baseSnapshot` per planner. Exposes `sync(plannerId)` (push local changes + apply server delta), `markEdited(plannerId, dayKey, fieldName)` (advance HLC and record fieldRev), and `prune(plannerId)` (reset baseClock to `HLC.zero()`, drop `rev:` and `base:` for that planner). `StorageLocal.js` delegates all sync state management to `SyncClient`.
- Why it matters: Clean separation between storage (StorageLocal) and sync protocol (SyncClient). SyncClient is independently testable and can be reused by future native mobile clients.
- Source: design session 2026-03-28
- Primary owning milestone: M010
- Validation: Unit test (no DOM): SyncClient.markEdited advances HLC and records dot-path entry. SyncClient.prune resets baseClock to HLC.zero(). Integration test: sync round-trip against a local data-api server returns serverChanges.

### SYNC-07 — One-time migration of existing localStorage data on first M009 load

- Class: core-capability
- Status: active
- Description: On first load after M009 is deployed, detect the old schema (presence of key `'0'` — the old identities array) and migrate: generate a `dev` UUID, create a default planner UUID (or use the existing unix-timestamp uid as a seed), rewrite all `uid-yearM` month blobs into `plnr:{uuid}` nested map format (renaming day object keys `'0'→tp, '1'→tl, '2'→col, '3'→notes, '4'→emoji`), initialise `rev:`, `base:`, `sync:` as empty/zero, remove all old-schema keys. Migration is idempotent — running it twice is safe.
- Why it matters: Existing users have planner data in the old schema. Migration must preserve it without data loss.
- Source: design session 2026-03-28
- Primary owning milestone: M009
- Validation: Playwright test: seed localStorage with old-schema data, reload app, verify old keys gone, new keys present, all day entries readable with new field names, no data lost.

### SYNC-08 — Local pruning without server-side delete

- Class: core-capability
- Status: active
- Description: When localStorage approaches ~4MB (measured by estimating serialised size of all `plnr:` entries), automatically prune planners not accessed in the last 12 months: drop `plnr:`, `rev:`, `base:` for old planners and reset `sync:` to `HLC.zero()`. On next sync for a pruned planner, `clientClock: HLC.zero()` triggers a full pull from the server. The server retains full history — pruning is a purely local compaction. No data is deleted from the server or other devices.
- Why it matters: localStorage is ~5MB. A user with multiple planners across multiple years will eventually hit the limit. Silent pruning of old data prevents app breakage.
- Source: design session 2026-03-28
- Primary owning milestone: M010
- Validation: Integration test: client prunes a planner, re-syncs with `clientClock: HLC.zero()`, receives full planner document back from server. Local state after sync matches server state.

## Validated

### TEST-01 — Playwright test harness configured in `.tests/`

- Class: core-capability
- Status: validated
- Source: inferred
- Primary owning slice: M001/S01
- Validation: validated

### TEST-02 — Playwright webServer auto-starts http-server on port 8080

- Class: core-capability
- Status: validated
- Source: inferred
- Primary owning slice: M001/S01
- Validation: validated

### TEST-03 — Vue app emits data-app-ready attribute on mount

- Class: core-capability
- Status: validated
- Source: inferred
- Primary owning slice: M001/S01
- Validation: validated

### TEST-04 — beforeEach clears storage and accepts cookie consent

- Class: core-capability
- Status: validated
- Source: inferred
- Primary owning slice: M001/S01
- Validation: validated

### E2E-01 — App boot smoke test

- Class: core-capability
- Status: validated
- Source: inferred
- Primary owning slice: M001/S02
- Validation: validated

### E2E-02 — Entry CRUD E2E test

- Class: core-capability
- Status: validated
- Source: inferred
- Primary owning slice: M001/S02
- Validation: validated

### E2E-03 — Planner management E2E test

- Class: core-capability
- Status: validated
- Source: inferred
- Primary owning slice: M001/S02
- Validation: validated

### SEC-01 — polyfill.io removed

- Class: core-capability
- Status: validated
- Source: inferred
- Primary owning slice: M001/S03
- Validation: validated

### SEC-02 — CDN resources pinned with SRI

- Class: core-capability
- Status: validated
- Source: inferred
- Primary owning slice: M001/S03
- Validation: validated

### SEC-03 — Bootstrap tooltip XSS fixed

- Class: core-capability
- Status: validated
- Source: inferred
- Primary owning slice: M001/S03
- Validation: validated

### SEC-04 — Sync errors surfaced to user

- Class: core-capability
- Status: validated
- Source: inferred
- Primary owning slice: M001/S03
- Validation: validated

### COMP-01 — HTML composition research report

- Class: core-capability
- Status: validated
- Source: inferred
- Primary owning slice: M001/S04
- Validation: validated

### COMP-02 — m4 composition implemented

- Class: core-capability
- Status: validated
- Source: inferred
- Primary owning slice: M001/S04
- Validation: validated

### COMP-03 — Docker/Skaffold workflows unchanged

- Class: core-capability
- Status: validated
- Source: inferred
- Primary owning slice: M001/S04
- Validation: validated

## Deferred

(none)

## Out of Scope

### OOS-01 — New backend API implementation

- Class: constraint
- Status: out-of-scope
- Description: The actual backend API implementation lives in a separate project. This project defines the contract only.
- Why it matters: Prevents scope creep into backend work.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: M004 produces the OpenAPI spec; the other project implements it.

### OOS-02 — Unit tests for refactored modules

- Class: quality-attribute
- Status: out-of-scope
- Description: No new unit tests are added for the extracted modules. The 14 existing E2E tests serve as the safety net.
- Why it matters: Keeps M002 focused on refactoring, not test expansion.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Unit tests could be added later if needed.

### OOS-03 — UX improvements or visual changes

- Class: constraint
- Status: out-of-scope
- Description: No user-visible behaviour or visual changes in M002. Pure refactoring.
- Why it matters: Prevents scope creep — refactoring must be behaviour-preserving.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: UX improvements belong in a future milestone.

## Traceability

| ID | Class | Status | Primary owner | Supporting | Proof |
|---|---|---|---|---|---|
| MOD-01 | core-capability | active | M002/S01 | none | unmapped |
| MOD-02 | core-capability | active | M002/S02 | M002/S05 | unmapped |
| MOD-03 | core-capability | active | M002/S03 | none | unmapped |
| MOD-04 | core-capability | active | M002/S03 | none | unmapped |
| MOD-05 | core-capability | active | M002/S04 | none | unmapped |
| MOD-06 | core-capability | active | M002/S04 | none | unmapped |
| MOD-07 | core-capability | active | M002/S04 | none | unmapped |
| MOD-08 | core-capability | active | M002/S02 | M002/S05 | unmapped |
| MOD-09 | core-capability | active | M002/S05 | none | unmapped |
| MOD-10 | quality-attribute | validated | M002/S05 | M002/S01-S04 | M008 — 14 E2E tests pass across all 3 slices |
| STO-01 | core-capability | validated | M003 | none | M003 — localStorage in production |
| STO-02 | core-capability | active | M009 | none | unmapped |
| STO-03 | constraint | active | M003 | none | unmapped |
| STO-04 | core-capability | validated | M003 | none | M003 — cookie modal removed |
| STO-05 | core-capability | validated | M003 | none | M003 — cookies CDN removed |
| AUTH-01 | core-capability | active | M004 | none | unmapped |
| AUTH-02 | core-capability | active | M004 | none | unmapped |
| AUTH-03 | core-capability | active | M004 | none | unmapped |
| AUTH-04 | core-capability | active | M004 | none | unmapped |
| AUTH-05 | core-capability | deferred | — | none | superseded by SYNC-01..08 |
| AUTH-06 | core-capability | active | M010 | none | unmapped |
| SYNC-01 | core-capability | active | M009 | none | unmapped |
| SYNC-02 | core-capability | active | M009 | none | unmapped |
| SYNC-03 | constraint | active | M009 | none | unmapped |
| SYNC-04 | core-capability | active | M009 | none | unmapped |
| SYNC-05 | core-capability | active | M009 | none | unmapped |
| SYNC-06 | core-capability | active | M010 | none | unmapped |
| SYNC-07 | core-capability | active | M009 | none | unmapped |
| SYNC-08 | core-capability | active | M010 | none | unmapped |
| TEST-01 | core-capability | validated | M001/S01 | none | validated |
| TEST-02 | core-capability | validated | M001/S01 | none | validated |
| TEST-03 | core-capability | validated | M001/S01 | none | validated |
| TEST-04 | core-capability | validated | M001/S01 | none | validated |
| E2E-01 | core-capability | validated | M001/S02 | none | validated |
| E2E-02 | core-capability | validated | M001/S02 | none | validated |
| E2E-03 | core-capability | validated | M001/S02 | none | validated |
| SEC-01 | core-capability | validated | M001/S03 | none | validated |
| SEC-02 | core-capability | validated | M001/S03 | none | validated |
| SEC-03 | core-capability | validated | M001/S03 | none | validated |
| SEC-04 | core-capability | validated | M001/S03 | none | validated |
| COMP-01 | core-capability | validated | M001/S04 | none | validated |
| COMP-02 | core-capability | validated | M001/S04 | none | validated |
| COMP-03 | core-capability | validated | M001/S04 | none | validated |
| OOS-01 | constraint | out-of-scope | none | none | n/a |
| OOS-02 | quality-attribute | out-of-scope | none | none | n/a |
| OOS-03 | constraint | out-of-scope | none | none | n/a |

## Coverage Summary

- Active requirements: 24
- Validated: 17
- Deferred: 1 (AUTH-05 — superseded)
- Out of scope: 3
- Unmapped active: 14 (SYNC-01..08, AUTH-06, AUTH-01..04, STO-02)
