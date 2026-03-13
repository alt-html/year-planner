# M003: Storage Modernisation — Context

**Gathered:** 2026-03-13
**Status:** Pending (M002 must complete first)

## Project Description

The Year Planner currently uses browser cookies for all local persistence — identities, preferences, planner data, and session state. The @alt-javascript/cookies library wraps document.cookie with get/set/delete operations. Data is LZString-compressed and stored across many individual cookies (one per planner-month). A cookie consent modal is shown on first visit.

## Why This Milestone

Cookies are the wrong tool for application state persistence. They have a ~4KB per-cookie limit, are sent with every HTTP request, and require a consent modal under privacy regulations. localStorage provides 5-10MB, stays client-side, and needs no consent. Removing cookie dependency also removes the @alt-javascript/cookies CDN library and the consent modal — simplifying both code and UX.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Open the app without seeing a cookie consent modal
- Use the planner with all data persisted in localStorage (no cookies)
- Share planners via URL (LZString compression preserved for share URLs)
- See terse but meaningful keys when inspecting localStorage in DevTools

### Entry point / environment

- Entry point: `http://localhost:8080`
- Environment: browser
- Live dependencies involved: none

## Completion Class

- Contract complete means: all E2E tests pass with localStorage backend; no cookies set
- Integration complete means: app boots, persists data, and recovers it across page reloads using localStorage
- Operational complete means: Docker serve works; existing data migration path from cookies to localStorage (if needed)

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- No cookies are set by the application at any point
- All planner data persists across page reloads via localStorage
- Share URL feature still works (LZString compression intact)
- Cookie consent modal is completely removed from HTML and JS
- All E2E tests pass

## Risks and Unknowns

- **Data migration** — Existing users have data in cookies. Need to decide whether to migrate on first visit or start fresh.
- **Data format change** — Switching from numeric keys to meaningful keys changes the storage schema. Must handle carefully.
- **localStorage vs sessionStorage for session** — Session state (signed-in status) may need different lifetime semantics.

## Existing Codebase / Prior Art

- `js/service/StorageLocal.js` — The primary file to change. All cookie operations live here.
- `js/service/StorageRemote.js` — Uses cookies for remote sync. Needs updating.
- `js/service/Storage.js` — Facade over StorageLocal. Interface may stay stable.
- `.compose/fragments/modals/cookie.html` — Cookie consent modal to remove.
- `@alt-javascript/cookies` — CDN dependency to remove.

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions.

## Relevant Requirements

- STO-01 — Replace cookie-based persistence with localStorage
- STO-02 — Clean up data format with terse meaningful keys
- STO-03 — Keep LZString compression for share URL feature
- STO-04 — Remove cookie consent modal and all cookie-related code
- STO-05 — Remove @alt-javascript/cookies CDN dependency

## Scope

### In Scope

- Replacing all cookie operations with localStorage
- Cleaning up data format (terse meaningful keys)
- Removing LZString compression for local storage (keeping for share URLs)
- Removing cookie consent modal
- Removing @alt-javascript/cookies CDN dependency
- Updating CDI wiring to remove Cookies class

### Out of Scope / Non-Goals

- Auth changes (M004)
- New features or UX changes beyond modal removal
- Backend API changes

## Technical Constraints

- localStorage has ~5-10MB limit per origin (varies by browser) — sufficient for planner data
- localStorage is synchronous — no async needed
- Share URL must keep LZString.compressToEncodedURIComponent for URL-safe encoding
- Terse keys — short but meaningful (e.g. `uid`, `yr`, `lng`, `thm`) for share URL compression benefit

## Integration Points

- StorageLocal.js — primary integration point; interface to rest of app should stay stable
- CDI contexts.js — Cookies class removed from wiring
- .compose fragments — cookie modal HTML removed, build.sh recomposed

## Open Questions

- Data migration strategy from cookies to localStorage for existing users — decide during M003 planning
