# Architecture

**Analysis Date:** 2026-03-11

## Pattern Overview

**Overall:** Dependency Injection Container + Isomorphic MVC

This is a modern single-page application (SPA) using Vue 3 with an isomorphic Dependency Injection Container pattern. The application relies on the `@alt-javascript/cdi` library to manage component instantiation, lifecycle, and dependency wiring at runtime. All business logic is decoupled from the UI layer and injected where needed.

**Key Characteristics:**
- Dependency injection via `ApplicationContext` from `@alt-javascript/cdi` library
- Reactive Vue 3 frontend with global i18n support
- Three-tier storage: local cookies, remote API, and in-memory model
- Service-oriented architecture separating API communication, data persistence, and business logic
- URL parameter-driven initialization and state synchronization

## Layers

**Presentation Layer (Vue):**
- Purpose: Render UI, handle user interactions, display localized content
- Location: `js/vue/`
- Contains: Vue app instance, Vue controller methods, reactive data model, i18n configuration
- Depends on: Services (Api, Storage, StorageLocal), Model, i18n, DateTime utilities
- Used by: Browser DOM mount point in `index.html`

**Service Layer:**
- Purpose: Encapsulate business logic, API communication, and data persistence
- Location: `js/service/`
- Contains: Api (HTTP client wrapper), Storage (unified storage interface), StorageLocal (cookie persistence), StorageRemote (remote sync), SquareUp (payment integration)
- Depends on: Model, i18n, external HTTP client (superagent), compression (LZString)
- Used by: Application coordinator, Vue controller

**Configuration & DI Layer:**
- Purpose: Bootstrap application, wire dependencies, provide environment-specific config
- Location: `js/config/`, `js/main.js`
- Contains: ApplicationContext setup, service registrations, logger factory, config factory
- Depends on: All services, `@alt-javascript/cdi` library
- Used by: Page load sequence

**Data Layer:**
- Purpose: In-memory state representation and browser storage interface
- Location: `js/vue/model.js` (in-memory), cookies (browser persistence)
- Contains: User preferences, planner data, UI state, session information
- Depends on: DateTime utilities for temporal operations
- Used by: Services and Vue components

## Data Flow

**Application Initialization:**

1. Browser loads `index.html`, imports `js/main.js`
2. `main.js` creates `ApplicationContext` with contexts configuration and config factory
3. `ApplicationContext.start()` instantiates all registered services and objects via dependency injection
4. `Application.init()` reads URL parameters (uid, year, lang, theme, share, verify) and initializes model
5. `Application.run()` mounts Vue app to `#app` div and triggers initial refresh

**User Planning Entry Update Flow:**

1. User edits a day entry in Vue template
2. Vue controller method `updateEntry(mindex, day, entry, entryType, entryColour, syncToRemote)` is called
3. `updateEntry` delegates to `StorageLocal.updateLocalEntry()` to persist to cookies
4. If `syncToRemote` is true and user is signed in, `Api.synchroniseToRemote()` is triggered
5. Remote API receives POST request with updated planner data via `StorageLocal.cookies`
6. On sign-in, `Api.synchroniseToLocal(syncPrefs)` pulls remote data and `StorageRemote.synchroniseLocalPlanners()` merges it

**Authentication Flow:**

1. User submits signin/register form via Vue modal
2. `Api.register()` or `Api.signin()` sends credentials to `/api/planner` endpoint
3. On success, response contains `uuid`, `username`, session token
4. `StorageLocal.setLocalSession()` stores session in cookie with optional expiry
5. `StorageRemote.synchroniseLocalPlanners()` pulls remote planner data from response
6. Page redirects to signed-in state with populated data

**Export/Import Flow:**

1. User initiates export: `Storage.exportPlannerToBase64()` compresses and encodes planner as Base64
2. `Storage.getExportString()` packages identity, preferences, year, and planner for sharing
3. User shares URL with encoded import string: `?share=<Base64>`
4. On page load, `Application.init()` reads `share` parameter
5. `Storage.setModelFromImportString(importUrlParam)` decompresses and applies remote planner data to model

**State Management:**

- **URL Parameters:** Drive initial state (uid, year, lang, theme, share, verify)
- **Cookies:** Persist user preferences, session token, planner data per user per year
- **In-Memory Model:** Single reactive object in Vue holds current session state
- **Remote API:** Single source of truth for registered users; local planners are authoritative for guests

## Key Abstractions

**Storage Abstraction:**
- Purpose: Unified interface for reading planner data regardless of source (local vs. remote)
- Examples: `js/service/Storage.js`, `js/service/StorageLocal.js`, `js/service/StorageRemote.js`
- Pattern: Delegation pattern where `Storage` reads from `StorageLocal` and syncs via `StorageRemote`; planner data is stored as nested maps keyed by [month-index][day] containing [entryType, entryText, colour]

**Api Service:**
- Purpose: HTTP client wrapper for all backend communication
- Examples: `js/service/Api.js` (475 lines)
- Pattern: Method per endpoint (register, signin, setUsername, setPassword, setEmail, setMobile, synchroniseToRemote, synchroniseToLocal, squarePayment, sendVerificationEmail, etc.)
- Error handling: HTTP status code checks with fallback to generic API unavailable message

**Application Coordinator:**
- Purpose: Initialize all subsystems, coordinate startup sequence
- Examples: `js/Application.js`
- Pattern: Receives all major services via constructor injection, contains init() (setup) and run() (mount Vue)

## Entry Points

**Browser Entry Point:**
- Location: `index.html`
- Triggers: Page load
- Responsibilities: Load script dependencies (Vue, i18n, superagent, Bootstrap), render mounting point div, load application CSS

**JavaScript Entry Point:**
- Location: `js/main.js`
- Triggers: HTML script tag execution
- Responsibilities: Import config and contexts, create ApplicationContext, call start() and await completion, attach applicationContext to window for debugging

**Application Coordinator:**
- Location: `js/Application.js`
- Triggers: Dependency injection container instantiation
- Responsibilities: Parse URL parameters, initialize model with user preferences and stored planners, coordinate Vue mounting via run()

## Error Handling

**Strategy:** Graceful degradation with user-facing error messages

**Patterns:**
- **API Errors:** Catch promise rejections, set model.error/model.modalError based on HTTP status code (400, 401, 404, 405, 500)
- **Validation Errors:** Field-level error storage in `model.modalErrorTarget[fieldName]`; trigger form re-render via touch flag
- **Missing Data:** Use fallback values (empty string, current date, null identity) rather than failing initialization
- **Offline Handling:** Guest users work fully offline; registered users queue changes and sync when connection restores

## Cross-Cutting Concerns

**Logging:**
- Framework: `@alt-javascript/logger` (ConfigurableLogger) via LoggerFactory
- Available on services via `this.logger` injected field
- Levels controlled via config in `js/config/config.js`; default "warn" at root, "info" for localhost
- Service qualifiers use reverse DNS pattern: `@alt-html/year-planner/ServiceName`

**Validation:**
- Form validation in Api.js methods (setUsername, setPassword, setEmail) checks for empty required fields
- Errors stored in `model.modalErrorTarget` for per-field display
- Touch flag (`model.touch`) toggles to force Vue reactivity

**Authentication:**
- Session token in cookie: `[uuid].[token]` format
- Bearer token passed in Authorization header: `Bearer [uuid].[token]`
- Sign-in timeout: 30 minutes if not "remember me"; session extension on API calls
- Verify email tokens passed in URL: `?verify=<token>`

**Internationalization:**
- Vue i18n plugin provides translations for 11 languages
- Language selection from URL param, user preference, or navigator.language
- Translation messages keyed by category: label.*, error.*, success.*, warn.*
- Month and day names generated from DateTime.local().toLocaleString()

---

*Architecture analysis: 2026-03-11*
