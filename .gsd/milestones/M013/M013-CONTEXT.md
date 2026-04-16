# M013: Legacy Alignment Cleanup — Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

## Project Description

M013 is a focused legacy code audit and cleanup milestone that removes behavior no longer aligned with the jsmdma-era architecture. The core cleanup targets are URL-state navigation, `uid`-based identity artifacts, legacy share mechanics, and leftover feature-flag plumbing, while adding user-level "follow system" behavior for language and light/dark mode.

## Why This Milestone

The app currently mixes modern jsmdma document mechanics with older URL/query and identity patterns (`uid`, hard reload navigation, share payload URLs, hidden feature modal toggles). That drift increases cognitive load and maintenance risk. This milestone aligns runtime behavior and storage contracts with the current architecture now, before new functional scope is added.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Use the planner without app state appearing in the URL for normal navigation/state changes.
- Keep language and light/dark on "system" with live follow, or override explicitly and later return to "system".

### Entry point / environment

- Entry point: `site/index.html` (browser app)
- Environment: local dev static server + Playwright smoke/e2e harness
- Live dependencies involved: browser localStorage/sessionStorage, OAuth callback URLs when auth flow runs

## Completion Class

- Contract complete means: legacy URL-state/uid/share/feature-flag contracts are removed from runtime and templates and replaced by explicit in-app state and user-level preference modes.
- Integration complete means: year/lang/theme interactions, planner switching, and auth callback URL handling work together without query-state coupling.
- Operational complete means: app boots and remains usable under clean URL conditions with callback-only query exceptions, and regression suites pass.

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- Normal app navigation/state does not rely on `?uid/&year/&lang/&theme` and does not hard-reload for those interactions.
- `uid` mechanics are removed from active runtime/storage/template/schema paths in favor of `userKey` + document UUID semantics, with multi-planner behavior intact.
- Legacy share and feature-flag surfaces are removed with no dead affordances and no regressions in smoke/e2e behavior.

## Scope

### In Scope

- Remove app-state URL query parameter coupling (`uid`, `year`, `lang`, `theme`) from normal navigation/state.
- Keep query parameters only where required for OAuth/callback mechanics.
- Remove legacy share behavior (`?share` + LZ compressed import/export flow).
- Remove feature-flagging system entirely (modal, hidden trigger, model/method plumbing).
- Remove `uid` runtime/storage/schema artifacts and align identity mechanics to jsmdma semantics.
- Add user-level preference modes:
  - language: `system` (live follow) or explicit language override
  - light/dark: `system` (live follow) or explicit override

### Out of Scope / Non-Goals

- Implementing replacement share semantics in this milestone.
- Adding unrelated planner business features.
- Electron runtime/distribution implementation.

## Architectural Decisions

### URL state removal for normal app behavior

**Decision:** Normal app navigation/state must use in-app state transitions and persistence, not query-param-driven reload flows.

**Rationale:** Query-state coupling (`uid/year/lang/theme`) is redundant with current runtime state and creates reload-driven behavior out of line with modern app flow.

**Alternatives Considered:**
- Keep URL params for partial back-compat — not chosen; user explicitly requested clean URL with no back-compat requirement.

### Callback-only URL query exception

**Decision:** Query params remain allowed only for OAuth/auth callback mechanics.

**Rationale:** Callback protocols require URL parameters; app-state navigation does not.

**Alternatives Considered:**
- Remove all query params unconditionally — not chosen; would break auth callback mechanics.

### Identity contract cleanup (`uid` removal)

**Decision:** Remove `uid` mechanics from runtime/storage/schema and rely on `userKey` + document UUID identity semantics while keeping multi-planner capability.

**Rationale:** `uid` is confusing and mismatched with current jsmdma document identity and ownership model.

**Alternatives Considered:**
- Keep dual model (`uid` + jsmdma identity) — not chosen; preserves confusion and technical drift.

### Legacy share surface removal now, replacement later

**Decision:** Remove legacy share URL/LZ flow now; defer replacement semantics to a later milestone/decision.

**Rationale:** The existing path is explicitly legacy and should not remain as active behavior.

**Alternatives Considered:**
- Replace share in the same milestone — not chosen; user explicitly deferred replacement.

### System-follow preferences as user-level modes

**Decision:** Implement language and light/dark as user-level modes with `system` live follow and explicit override, including return-to-system behavior.

**Rationale:** Matches requested UX: system by default, explicit override when chosen.

**Evidence:** MDN guidance on `Window.matchMedia` + `MediaQueryList` `change` events and `window.languagechange` / `Navigator.languages` behavior.

**Alternatives Considered:**
- Snapshot-on-load only — not chosen; user requested live follow.

### Greenfield cleanup strategy (no migration scaffolding)

**Decision:** Execute direct cleanup/removal without compatibility migration paths.

**Rationale:** User confirmed no deployed users/data; migration overhead is unnecessary.

**Alternatives Considered:**
- Add one-time migration from legacy keys/fields — not chosen; out of proportion for greenfield state.

## Error Handling Strategy

Default strategy approved by user:

- Fail-safe startup defaults when system-follow resolution fails (no boot block).
- No destructive fallback behavior (cleanup must not wipe planner docs).
- Callback parsing/cleanup failures surface clear UI error while app remains usable.
- `system` listeners (`matchMedia`, `languagechange`) are active only in `system` mode; explicit user mode is authoritative.
- In-app year/lang/theme actions preserve active planner context on failure and expose actionable diagnostics.
- Keep targeted debug logs for key transitions (`userKey` resolution, active doc switching, preference mode application).

## Risks and Unknowns

- `uid` references are currently broad across model, storage, and template links — partial cleanup risk is high without strict grep/test gates.
- URL-state removal can inadvertently break year/lang/theme interactions if residual hard-navigation code remains.
- Removing legacy share/feature paths can leave dead UI affordances if cleanup misses compose fragments.

## Existing Codebase / Prior Art

- `site/js/Application.js` — current URL-param ingestion and canonical `replaceState` behavior.
- `site/js/service/StorageLocal.js` + `site/js/service/Storage.js` — current `uid`/identities/prefs/share legacy paths.
- `.compose/fragments/{rail,nav,footer}.html` — query-param link generation for year/lang/theme.
- `.compose/fragments/modals/feature.html` + `site/js/vue/model-features.js` — feature-flag legacy surfaces.
- `site/js/vue/methods/{calendar,rail,lifecycle}.js` — hard navigation and theme/lang behavior seams.

## Relevant Requirements

- R007 — Close/re-scope unresolved active requirement debt with explicit proof.
- R103 — Remove normal app-state URL params.
- R104 — Remove `uid` mechanics and align identity semantics.
- R105 — Remove legacy share surface.
- R106 — Remove feature-flag system.
- R107 — Language system-follow mode with override.
- R108 — Theme system-follow mode with override.
- R109 — Strict regression and grep proof gates.
- R110 (deferred) — replacement share semantics.

## Technical Constraints

- Preserve multi-planner capability and planner-document behaviors.
- Keep OAuth callback mechanics working while removing app-state query usage.
- No migration/back-compat paths required for this milestone.

## Integration Points

- OAuth/auth callback handling — callback params must still be consumed and cleaned safely.
- Local persistence (`localStorage`/`sessionStorage`) — preference mode state and planner identity bindings.
- Playwright test harness (`.tests/`) — smoke/e2e + new targeted verification gates.

## Testing Requirements

- Run existing smoke suite and existing e2e suite.
- Add targeted tests for:
  - clean URL behavior (no app-state query param dependence),
  - `uid` removal contract,
  - feature-flag/share legacy surface removal,
  - language/theme system-follow + explicit override behavior.
- Add repo-level grep gate proving removal of active `uid` runtime/template/storage references (historical docs may be excluded explicitly).

## Acceptance Criteria

- App navigation/state does not use `uid/year/lang/theme` query params in normal operation.
- Year/lang/theme interactions are in-app updates (no hard reload required for state changes).
- `uid` mechanics are removed from active runtime/storage/schema/template paths while multi-planner remains functional.
- Legacy share URL/LZ behavior is removed and no dead share affordances remain.
- Feature-flag modal/trigger/plumbing are removed and no dead controls remain.
- Language and light/dark both support `system` live-follow plus explicit override and return-to-system behavior at user level.
- Existing smoke+e2e and new targeted tests pass.

## Open Questions

- Replacement share design is deferred (captured as R110).
