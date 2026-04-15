# Roadmap: Year Planner

## Milestones

- ✅ **v1.0 Foundation** — Phases 1–4 (complete)
- ✅ **v1.1 UX & Boot** — Phases 5–7 (complete)
- ✅ **v1.2 Data Model** — Phases 8–10 (complete)
- ✅ **v1.3 jsmdma Sync** — Phases 11–12 (complete 2026-04-13)
- ✅ **v1.4 Bootstrap 5 & UI Generalisation** — Phases 13–15 (complete 2026-04-14)
- 🚧 **v1.5 GitHub OAuth & Account Linking** — Phases 16–19 (in progress)

## Phases

<details>
<summary>✅ v1.0 Foundation (Phases 1–4) — COMPLETE</summary>

### Phase 1: Migration
**Goal**: Migrate codebase to maintainable baseline — decompose monolithic index.html with m4 composition, establish .compose build pipeline.
Plans:
- [x] 01-01: Initial migration and m4 composition setup

### Phase 2: JS Modularisation
**Goal**: Split monolithic JS into CDI-wired service modules; remove SquareUp, lodash, superagent; restructure Vue model into grouped sub-objects.
Plans:
- [x] 02-01: Module split and CDI wiring
- [x] 02-02: Dead code removal (SquareUp, lodash, superagent)
- [x] 02-03: Vue model restructure

### Phase 3: Storage Modernisation
**Goal**: Modernise StorageLocal/StorageRemote; align storage layer with CDI patterns.
Plans:
- [x] 03-01: Storage modernisation

### Phase 4: Auth & API Contract
**Goal**: Define auth contract, API shape; establish AuthProvider skeleton; replace superagent with native fetch.
Plans:
- [x] 04-01: Auth and API contract

</details>

<details>
<summary>✅ v1.1 UX & Boot (Phases 5–7) — COMPLETE</summary>

### Phase 5: UI/UX Design Research
**Goal**: Research and document UI/UX improvements.
Plans:
- [x] 05-01: UI/UX research

### Phase 6: UI/UX Polish & Finalisation
**Goal**: Implement UI/UX improvements from research.
Plans:
- [x] 06-01: UI/UX polish

### Phase 7: Boot v3 Uplift
**Goal**: Upgrade to @alt-javascript/boot-vue@3; migrate CDI bootstrap to vueStarter; fix CDN route interception in Playwright; establish SRI stripping pattern in globalSetup.
Plans:
- [x] 07-01: Boot v3 upgrade and test harness fixes

</details>

<details>
<summary>✅ v1.2 Data Model (Phases 8–10) — COMPLETE</summary>

### Phase 8: Day Data Model Extension
**Goal**: Extend day object schema with keys '3' (notes) and '4' (emoji); add emoji rail mode with flyout; define merge semantics for import.
Plans:
- [x] 08-01: Day model extension (notes, emoji)
- [x] 08-02: Emoji rail mode UI
- [x] 08-03: Import merge semantics

### Phase 9: localStorage Schema Redesign & Migration
**Goal**: Replace cookie-era opaque-key schema with HLC-ready readable schema (`dev`, `tok`, `plnr:{uuid}`, `rev:{uuid}`, `base:{uuid}`, `sync:{uuid}`). Write migration logic. Update all E2E tests.
Plans:
- [x] 09-01: Schema redesign and migration
- [x] 09-02: Test harness updates

### Phase 10: Source Root Tidy — Move Web Assets to site/
**Goal**: Move all web assets into `site/` subdirectory; update build paths; keep Docker/Skaffold serving unchanged.
Plans:
- [x] 10-01: Web assets migration to site/

</details>

<details>
<summary>✅ v1.3 jsmdma Sync (Phases 11–12) — COMPLETE 2026-04-13</summary>

### Phase 11: jsmdma Sync Protocol & MOD Cleanup
**Goal**: Create SyncClient.js, rewrite Api.js to POST /year-planner/sync, wire HLC field tracking into every StorageLocal write, delete StorageRemote.js, resolve MOD-05–09 cleanup items.
**Depends on**: Phase 10
**Requirements**: AUTH-06, MOD-03, MOD-05, MOD-06, MOD-07, SYNC-04, SYNC-05, SYNC-06
Plans:
- [x] 11-01: SyncClient.js + jsmdma sync API (S01)
- [x] 11-02: HLC write-path wiring (S02)
- [x] 11-03: MOD cleanup audit (S03)

### Phase 12: Auth Client Configuration & Live Sync
**Goal**: Stabilise rail UI (move inside Vue #app, drop jQuery bridge), write contract tests against real jsmdma backend, verify sync protocol end-to-end.
**Depends on**: Phase 11
**Requirements**: MOD-09, SYNC-08
Plans:
- [x] 12-01: Vue rail migration, jQuery removal, modal Vue flags, MOD-09 audit
- [x] 12-02: Contract tests against live jsmdma backend, SYNC-08 verification

</details>

<details>
<summary>✅ v1.4 Bootstrap 5 & UI Generalisation (Phases 13–15) — COMPLETE 2026-04-14</summary>

### Phase 13: Bootstrap 5 Migration
**Goal**: Swap Bootstrap 4.3.1 CDN for Bootstrap 5.3.8, rename all data-toggle/data-dismiss/data-target to data-bs-* equivalents, replace deprecated utility classes, convert feature modal to Vue-reactive state.
Plans:
- [x] 13-01: Bootstrap 5 CDN swap and markup migration

### Phase 14: Dark Mode BS5
**Goal**: Wire BS5 native data-bs-theme="dark" attribute alongside .yp-dark class, remove redundant dark CSS overrides from yp-dark.css.
Plans:
- [x] 14-01: Wire data-bs-theme attribute and clean dark CSS overrides

### Phase 15: CSS Generalisation
**Goal**: Extract design tokens, rail styles, and dot styles from main.css into separate CSS files; namespace bare custom properties to --yp-*; update head.html to load extracted files.
Plans:
- [x] 15-01: Extract design-tokens.css, rail.css, dots.css from main.css
- [x] 15-02: Rename bare custom properties to --yp-* and update head.html

</details>

### v1.5 GitHub OAuth & Account Linking (In Progress)

**Milestone Goal:** End-to-end GitHub sign-in with real OAuth flow, account linking/unlinking UI, and a reusable auth module — including verifying and wiring the jsmdma backend to support GitHub auth locally.

## Phase Details

### Phase 16: Backend Discovery & Wiring
**Goal**: The jsmdma backend supports GitHub OAuth end-to-end — routes documented, middleware wired, GitHub OAuth Apps registered, local dev server can complete an authorization code exchange
**Depends on**: Phase 15
**Requirements**: BKD-01, BKD-02, BKD-03, BKD-04
**Success Criteria** (what must be TRUE):
  1. A developer running jsmdma locally can complete a GitHub OAuth callback without a 404 or missing-route error
  2. KNOWN_PROVIDERS in vendored jsmdma-auth-client.esm.js includes "github"
  3. GitHub OAuth App exists for localhost dev with correct callback URL (production CloudFront app deferred to deployment phase)
  4. All missing backend routes/middleware are patched and the run-server config reflects them
**Plans**: 2 plans

Plans:
- [x] 16-01: Backend route audit and KNOWN_PROVIDERS patch
- [x] 16-02: GitHub OAuth App registration and client ID wiring

### Phase 17: GitHub OAuth Client Flow
**Goal**: Users can sign in with GitHub via the real OAuth authorization code flow wired end-to-end against the local server, with correct provider identification and durable PKCE state
**Depends on**: Phase 16
**Requirements**: GHO-01, GHO-02, GHO-03, GHO-04
**Success Criteria** (what must be TRUE):
  1. User can click "Sign in with GitHub", complete the GitHub consent screen, and land back in the app as an authenticated user
  2. The provider returned from the OAuth callback is identified as "github" (not hardcoded "google")
  3. PKCE state survives a page reload mid-flow and is cleaned up from localStorage after exchange completes
  4. Apple and Microsoft sign-in buttons are hidden when their client IDs are absent from config
**Plans**: 2 plans
**UI hint**: yes

Plans:
- [x] 17-01-PLAN.md — GitHub sign-in method, PKCE storage fix, callback handler fix, auth modal template updates
- [x] 17-02-PLAN.md — E2E test coverage for all GHO requirements and human verification

### Phase 18: Auth Module Extraction
**Goal**: Auth code lives in a standalone site/js/auth/ folder with an app-agnostic API; old AuthProvider.js is deleted; all consumers rewired through CDI; sign-out preserves unsynced planner data
**Depends on**: Phase 17
**Requirements**: AUT-01, AUT-02, AUT-03, AUT-04
**Success Criteria** (what must be TRUE):
  1. site/js/auth/ contains AuthService.js, OAuthClient.js, and auth-config.js — no year-planner-specific code
  2. Google OAuth provider is wired through site/js/auth/ alongside GitHub using the same abstraction
  3. Signing out clears credentials (tok key) but leaves planner data (plnr:* keys) intact in localStorage
  4. Old AuthProvider.js does not exist; contexts.js, Api.js, and Application.js reference the new auth module only
**Plans**: 2 plans

Plans:
- [x] 18-01-PLAN.md — Fix sign-out data preservation, create site/js/auth/ module (AUT-01, AUT-02, AUT-03)
- [x] 18-02-PLAN.md — CDI swap, delete old AuthProvider.js, human verification (AUT-04)

### Phase 19: Account Linking UI
**Goal**: Users can manage connected OAuth providers from a settings view — linking a second provider, unlinking with a safety guard, and merging planner data across identities without sync duplicates
**Depends on**: Phase 18
**Requirements**: LNK-01, LNK-02, LNK-03, LNK-04
**Success Criteria** (what must be TRUE):
  1. A signed-in user can link a second OAuth provider from the settings view and see it appear in the connected accounts list
  2. A user can unlink a provider and is blocked from unlinking their last remaining provider
  3. The connected accounts settings view lists all linked providers with link and unlink actions visible
  4. After identity merge, planner entries carry the merged userKey and do not create duplicate sync records
**Plans**: 2 plans
**UI hint**: yes

Plans:
- [ ] 19-01-PLAN.md — Connected accounts UI in settings flyout, unlink flow with last-provider guard (LNK-03, LNK-02)
- [ ] 19-02-PLAN.md — OAuth link flow, userKey migration after identity merge, human verification (LNK-01, LNK-04)

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Migration | v1.0 | — | Complete | 2026-03 |
| 2. JS Modularisation | v1.0 | — | Complete | 2026-03 |
| 3. Storage Modernisation | v1.0 | — | Complete | 2026-03 |
| 4. Auth & API Contract | v1.0 | — | Complete | 2026-03 |
| 5. UI/UX Research | v1.1 | — | Complete | 2026-03 |
| 6. UI/UX Polish | v1.1 | — | Complete | 2026-03 |
| 7. Boot v3 Uplift | v1.1 | — | Complete | 2026-03 |
| 8. Day Data Model | v1.2 | — | Complete | 2026-03 |
| 9. localStorage Schema | v1.2 | — | Complete | 2026-03 |
| 10. Source Root Tidy | v1.2 | — | Complete | 2026-04 |
| 11. jsmdma Sync & MOD | v1.3 | 3/3 | Complete | 2026-04-10 |
| 12. Auth Config & Live Sync | v1.3 | 2/2 | Complete | 2026-04-13 |
| 13. BS5 Migration | v1.4 | 1/1 | Complete | 2026-04-14 |
| 14. Dark Mode BS5 | v1.4 | 1/1 | Complete | 2026-04-14 |
| 15. CSS Generalisation | v1.4 | 2/2 | Complete | 2026-04-14 |
| 16. Backend Discovery & Wiring | v1.5 | 2/2 | Complete    | 2026-04-14 |
| 17. GitHub OAuth Client Flow | v1.5 | 2/2 | Complete    | 2026-04-14 |
| 18. Auth Module Extraction | v1.5 | 2/2 | Complete    | 2026-04-15 |
| 19. Account Linking UI | v1.5 | 0/2 | Not started | - |
