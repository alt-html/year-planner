# Requirements

This file is the explicit capability and coverage contract for the project.

## Active

### R007 — Close or re-scope the prior unresolved MOD-09 requirement so active requirement debt is not silently carried forward.
- Class: continuity
- Status: active
- Description: Close or re-scope the prior unresolved MOD-09 requirement so active requirement debt is not silently carried forward.
- Why it matters: The project should not retain ambiguous active requirements across completed milestones.
- Source: execution
- Primary owning slice: M013/S04
- Supporting slices: M013/S01,M013/S02,M013/S03
- Validation: unmapped
- Notes: M013 explicitly closes/re-scopes prior unresolved MOD-09 debt via verification gates: clean URL state flow, uid removal, feature/share legacy cleanup, and regression proof.

### R103 — Remove app-state URL params (`uid`,`year`,`lang`,`theme`) from normal navigation and keep URLs clean except required OAuth/callback parameters.
- Class: continuity
- Status: active
- Description: Remove app-state URL params (`uid`,`year`,`lang`,`theme`) from normal navigation and keep URLs clean except required OAuth/callback parameters.
- Why it matters: URL-coupled state is redundant with current architecture and causes reload-driven behavior that conflicts with in-app state mechanics.
- Source: user
- Primary owning slice: M013/S02
- Supporting slices: M013/S04
- Validation: unmapped
- Notes: Applies to nav/year/language/theme interactions; callback params remain allowed for auth flows only.

### R104 — Remove legacy `uid` runtime/storage/schema usage and align identity mechanics to `userKey` plus jsmdma document UUID semantics while preserving multi-planner support.
- Class: data-model
- Status: active
- Description: Remove legacy `uid` runtime/storage/schema usage and align identity mechanics to `userKey` plus jsmdma document UUID semantics while preserving multi-planner support.
- Why it matters: `uid` is confusing and out of line with current jsmdma document and ownership model.
- Source: user
- Primary owning slice: M013/S01
- Supporting slices: M013/S04
- Validation: unmapped
- Notes: No backward-compat migration required (greenfield). Multi-planner remains explicit and unchanged as a capability.

### R105 — Remove legacy share surface and URL/LZ import-export behavior (`?share=` and compressed payload path) from runtime and UI.
- Class: continuity
- Status: active
- Description: Remove legacy share surface and URL/LZ import-export behavior (`?share=` and compressed payload path) from runtime and UI.
- Why it matters: Current share behavior is legacy and should not remain as an architectural artifact.
- Source: user
- Primary owning slice: M013/S03
- Supporting slices: M013/S04
- Validation: unmapped
- Notes: Replacement sharing semantics are deferred to a future requirement.

### R106 — Remove feature-flag system completely, including hidden feature modal, trigger paths, and flag plumbing.
- Class: operability
- Status: active
- Description: Remove feature-flag system completely, including hidden feature modal, trigger paths, and flag plumbing.
- Why it matters: Hidden/legacy flagging adds confusion and drift with no product value.
- Source: user
- Primary owning slice: M013/S03
- Supporting slices: M013/S04
- Validation: unmapped
- Notes: Cleanup must remove dead affordances and dead state/method wiring, not just hide UI.

### R107 — Implement language preference modes with `system` live-follow and explicit override, including ability to return to system-follow.
- Class: primary-user-loop
- Status: active
- Description: Implement language preference modes with `system` live-follow and explicit override, including ability to return to system-follow.
- Why it matters: Language behavior should align with user environment by default while still supporting explicit user choice.
- Source: user
- Primary owning slice: M013/S02
- Supporting slices: M013/S04
- Validation: unmapped
- Notes: When mode is `system`, app follows browser language changes; explicit mode must be authoritative until reset to system.

### R108 — Implement light/dark preference modes with `system` live-follow and explicit light/dark override, including ability to return to system-follow.
- Class: quality-attribute
- Status: active
- Description: Implement light/dark preference modes with `system` live-follow and explicit light/dark override, including ability to return to system-follow.
- Why it matters: Theme should follow system by default and remain controllable by explicit user preference.
- Source: user
- Primary owning slice: M013/S02
- Supporting slices: M013/S04
- Validation: unmapped
- Notes: Use media query change events for live system updates while in `system` mode.

### R109 — Require strict regression proof for cleanup: existing smoke and E2E suites plus new targeted tests and grep gates for removed legacy surfaces.
- Class: quality-attribute
- Status: active
- Description: Require strict regression proof for cleanup: existing smoke and E2E suites plus new targeted tests and grep gates for removed legacy surfaces.
- Why it matters: Cleanup milestones must prove behavioral integrity and complete removal of deprecated mechanisms.
- Source: user
- Primary owning slice: M013/S04
- Supporting slices: M013/S01,M013/S02,M013/S03
- Validation: unmapped
- Notes: Includes grep gate for uid removal and checks for removed share/feature paths.

## Validated

### AUTH-06 — Rewrite the client-side sync layer (Api.js, retire StorageRemote.js) to use the jsmdma sync protocol: `POST /year-planner/sync` with HLC-clocked dot-path fieldRevs, `clientClock`, `changes` array, and `serverChanges` response. Replace the current raw-localStorage-dump push/pull pattern entirely.
- Status: validated
- Description: Rewrite the client-side sync layer (Api.js, retire StorageRemote.js) to use the jsmdma sync protocol: `POST /year-planner/sync` with HLC-clocked dot-path fieldRevs, `clientClock`, `changes` array, and `serverChanges` response. Replace the current raw-localStorage-dump push/pull pattern entirely.
- Primary owning slice: M011/S01
- Supporting slices: M011/S02
- Validation: SyncClient.js created; Api.js rewrites to POST /year-planner/sync with jsmdma payload shape {clientClock, deviceId, changes[{id,doc,fieldRevs}]}; StorageRemote.js deleted; sync-payload.spec.js Playwright test verifies payload shape; all 17 tests pass. M011/S01 complete 2026-04-09.

### MOD-03 — Untitled
- Status: validated
- Primary owning slice: M011/S01
- Validation: StorageRemote.js deleted from codebase and removed from contexts.js. All references to synchroniseToLocal/synchroniseToRemote replaced across 5 Vue method files and Storage.js. M011/S01 complete 2026-04-09.
- Notes: In M011/S01 Api.js is rewritten to use jsmdma sync protocol. The sub-module split (SyncApi/AuthApi/ProfileApi) from original MOD-03 is partially superseded — Api.js becomes the jsmdma sync client wrapper; auth is handled by AuthProvider. StorageRemote.js is deleted.

### MOD-05 — Remove SquareUp payment integration
- Status: validated
- Description: Remove SquareUp payment integration
- Primary owning slice: M011/S03
- Validation: SquareUp.js deleted in M002/S04; grep of site/js/ and index.html confirms zero squareup references; pay.html modal fragment deleted in M011/S03.

### MOD-06 — Clean feature flags — remove donate flag and window.ftoggle global
- Status: validated
- Description: Clean feature flags — remove donate flag and window.ftoggle global
- Primary owning slice: M011/S03
- Validation: model-features.js has no donate flag or window.ftoggle global; only debug/signin flags remain; cleaned in M002/S04.

### MOD-07 — Replace lodash with native Array methods
- Status: validated
- Description: Replace lodash with native Array methods
- Primary owning slice: M011/S03
- Validation: Zero lodash/_.  references in site/js/ or index.html; all 8 lodash calls replaced with native Array methods in M002/S04.

### MOD-09 — Wire all modules through CDI context (contexts.js)
- Status: validated
- Description: Wire all modules through CDI context (contexts.js)
- Primary owning slice: M011/S03
- Validation: contexts.js registers Api, Application, AuthProvider, Storage, StorageLocal, SyncClient as singletons; StorageRemote removed in M011/S01; all modules correctly wired through CDI.

### R001 — Create 2–3 distinct visual icon/logo sets for Year Planner that are complete enough to evaluate across small and large surfaces.
- Class: core-capability
- Status: validated
- Description: Create 2–3 distinct visual icon/logo sets for Year Planner that are complete enough to evaluate across small and large surfaces.
- Why it matters: The current identity is too weak to ship confidently across install surfaces.
- Source: user
- Primary owning slice: M012/S01
- Supporting slices: none
- Validation: Three structurally distinct icon/logo candidate systems delivered as canonical SVG masters with complete preview PNG matrix (16/32/180/192/512) and side-by-side gallery ready for S02 winner selection. All 52 smoke tests pass. Manual legibility review confirms all candidates are visually distinguishable at 16×16 and 32×32. Contract enforced via README and automated assertions.
- Notes: Candidate sets must be coherent systems, not one-off icon sketches.

### R002 — Choose one of the candidate sets through an explicit visual decision and lock it as the canonical direction.
- Class: primary-user-loop
- Status: validated
- Description: Choose one of the candidate sets through an explicit visual decision and lock it as the canonical direction.
- Why it matters: Implementation and export work must converge on one source-of-truth style.
- Source: user
- Primary owning slice: M012/S02
- Supporting slices: none
- Validation: C2 Nordic Clarity explicitly selected as canonical winner based on visual review applying tie-breaker criteria (small-size legibility at 16×16, cross-size coherence). Selection locked in canonical.json with full metadata and alternatives.json documenting archived alternatives (C1, C3). Gallery (icon-comparison.html) updated with data-selection-state attributes. Decision D016 recorded. All selection smoke tests pass enforcing winner uniqueness, alternative completeness, and metadata/gallery agreement."
- Notes: Selection method is pure visual call (no weighted rubric).

### R003 — Produce platform-ready outputs from canonical sources for web/PWA, iOS, Android, and desktop launch contexts.
- Class: integration
- Status: validated
- Description: Produce platform-ready outputs from canonical sources for web/PWA, iOS, Android, and desktop launch contexts.
- Why it matters: Each platform expects different icon shapes/sizes/purposes.
- Source: user
- Primary owning slice: M012/S03
- Supporting slices: M012/S05
- Validation: S03 delivered: bash scripts/export-canonical-icon-matrix.sh produces 9 platform-specific PNG variants (favicon-16x16, favicon-32x32, apple-touch-180x180, pwa-any-{192,512}, pwa-maskable-{192,512}, pwa-monochrome-{192,512}) in site/icons/. matrix.json enumerates all entries with platform, purpose (any/maskable/monochrome), size, src paths, and output locations. All 24 matrix export smoke tests pass; all 80 S01/S02 regression tests pass. Export matrix is deterministic and read-only from canonical.json winner metadata. Platform coverage: web (2 sizes), iOS (1 size), PWA (6 sizes across 3 purposes).
- Notes: Include manifest purposes where applicable (`any`, `maskable`, `monochrome`).

### R004 — Replace existing icon references in the app (`index.html`, `manifest.json`, favicon/apple/android files) with the chosen set.
- Class: launchability
- Status: validated
- Description: Replace existing icon references in the app (`index.html`, `manifest.json`, favicon/apple/android files) with the chosen set.
- Why it matters: The milestone must ship integrated assets, not just a design pack.
- Source: user
- Primary owning slice: M012/S04
- Supporting slices: M012/S03
- Validation: S04 integration complete: index.html head links and manifest.json icons[] wired to canonical ./icons/* outputs from S03. All 57 smoke tests pass (icon-live-wiring.spec.js: 28 tests, compose.spec.js: 5 tests, icon-export-matrix.spec.js: 24 tests). Negative-boundary assertions confirm legacy paths are rejected and canonical structure is enforced.
- Notes: Wiring must remain backward-safe until full asset matrix exists.

### R005 — Generate `.ico` and `.icns` packaging assets from the canonical source set for future Windows/macOS desktop bundling.
- Class: integration
- Status: validated
- Description: Generate `.ico` and `.icns` packaging assets from the canonical source set for future Windows/macOS desktop bundling.
- Why it matters: Avoids rework when Electron packaging starts.
- Source: user
- Primary owning slice: M012/S05
- Supporting slices: M012/S03
- Validation: M012/S05 delivered: bash scripts/export-desktop-packaging-assets.sh generates site/icons/desktop/year-planner.ico (7 frames: 16,24,32,48,64,128,256) and site/icons/desktop/year-planner.icns (iconset: 16,32,64,128,256,512,1024) from canonical.json winner metadata (C2). site/icons/desktop-matrix.json contract records platform (windows/macos), format (ico/icns), sizes, src paths, and output locations. All 34 desktop-packaging smoke tests pass; all 52 existing icon-export-matrix and icon-live-wiring regression tests pass (86 total). Web/PWA matrix.json remains untouched with 9 entries. candidateId alignment verified (C2 → C2). Python ICO packer and bash exporter implement path safety validation (rejects ../ and absolute paths). Deterministic export and contract enabled by purpose-specific SVG metadata in canonical.json. Desktop assets ready for future Windows/macOS Electron bundling.
- Notes: Electron runtime implementation itself is out of scope for M012.

### R006 — Prove icon integration using existing project test flow plus explicit visual spot checks on key sizes/surfaces.
- Class: quality-attribute
- Status: validated
- Description: Prove icon integration using existing project test flow plus explicit visual spot checks on key sizes/surfaces.
- Why it matters: Prevents shipping broken or illegible icons despite correct file presence.
- Source: user
- Primary owning slice: M012/S06
- Supporting slices: M012/S04, M012/S05
- Validation: S06 complete with 8-stage integrated sign-off runner: (1) icon export matrix generation, (2) desktop packaging assets, (3–5) existing smoke contracts (export, live-wiring, desktop-packaging), (6) S06 visual sign-off spec (29 tests validating matrix contracts and generating deterministic HTML/PNG/JSON artifacts), (7) full Playwright suite, (8) artifact assertions. All stages pass (exit 0). Visual sign-off sheet validates 16/32/180/192/512 web/PWA/desktop surfaces with base64-embedded PNGs and ICC rendering. S06-sign-off-report.json records all stage verdicts and artifact paths. Negative-boundary tests prove path safety (rejects absolute paths, .. traversal, missing files). No blockers discovered across S06 execution.
- Notes: Key checks include 16/32/180/192/512 and desktop launch surfaces.

### R100 — Client sync stack was rewritten to jsmdma protocol (`POST /year-planner/sync`) with HLC field revisions.
- Class: integration
- Status: validated
- Description: Client sync stack was rewritten to jsmdma protocol (`POST /year-planner/sync`) with HLC field revisions.
- Why it matters: Provides robust sync semantics and future-proof merge behavior.
- Source: execution
- Primary owning slice: M011/S01
- Supporting slices: M011/S02
- Validation: validated
- Notes: Verified by sync payload and write-path tests in M011.

### R101 — Old `StorageRemote` path and legacy sync calls were removed from live code paths.
- Class: continuity
- Status: validated
- Description: Old `StorageRemote` path and legacy sync calls were removed from live code paths.
- Why it matters: Eliminates competing sync systems and reduces complexity.
- Source: execution
- Primary owning slice: M011/S01
- Supporting slices: none
- Validation: validated
- Notes: Replacement path is `Api.sync` + `SyncClient`.

### R102 — SquareUp integration removed, lodash replaced, and obsolete feature-flag globals removed.
- Class: operability
- Status: validated
- Description: SquareUp integration removed, lodash replaced, and obsolete feature-flag globals removed.
- Why it matters: Reduces runtime and maintenance surface.
- Source: execution
- Primary owning slice: M011/S03
- Supporting slices: none
- Validation: validated
- Notes: Verified in codebase and test runs during M011 completion.

### SYNC-04 — Untitled
- Status: validated
- Primary owning slice: M011/S02
- Validation: markEdited() wired in entries.js updateEntry() for all 5 day fields (tp, tl, col, notes, emoji); hlc-write.spec.js Playwright test confirms rev:{uuid} localStorage key contains dot-path keys matching days.YYYY-MM-DD.{field} with non-empty HLC strings after any edit; all 18 tests pass. M011/S02 complete 2026-04-10.
- Notes: Will be implemented when StorageLocal is wired to call SyncClient.markEdited() on every field write in M011/S02.

### SYNC-05 — Untitled
- Status: validated
- Primary owning slice: M011/S01
- Validation: POST /year-planner/sync endpoint wired end-to-end: SyncClient builds payload, Api.sync() calls it, all 9 Vue/Storage call sites updated. sync-payload.spec.js Playwright mock test verifies payload shape (D007). All 17 tests pass. M011/S01 complete 2026-04-09.
- Notes: Base snapshot management is part of SyncClient.sync() — persisted to base:{uuid} after each successful sync in M011/S01.

### SYNC-06 — Implement `js/service/SyncClient.js` that wraps the jsmdma sync protocol for the year-planner. Uses `HLC` and `flatten` from the local `data-api-core.esm.js` bundle (jsmdma project). Manages `baseClock`, `fieldRevs`, and `baseSnapshot` per planner. Exposes `sync(plannerId)`, `markEdited(plannerId, dotPath)`, and `prune(plannerId)`. `StorageLocal.js` delegates all sync state management to `SyncClient`.
- Status: validated
- Description: Implement `js/service/SyncClient.js` that wraps the jsmdma sync protocol for the year-planner. Uses `HLC` and `flatten` from the local `data-api-core.esm.js` bundle (jsmdma project). Manages `baseClock`, `fieldRevs`, and `baseSnapshot` per planner. Exposes `sync(plannerId)`, `markEdited(plannerId, dotPath)`, and `prune(plannerId)`. `StorageLocal.js` delegates all sync state management to `SyncClient`.
- Primary owning slice: M011/S01
- Validation: SyncClient.js implemented with markEdited(plannerId, dotPath), async sync(plannerId, plannerDoc, authHeaders), and prune(plannerId). Manages rev:{uuid}, base:{uuid}, sync:{uuid} per planner. Uses HLC and flatten/merge from data-api-core.esm.js vendor bundle. CDI-registered as syncClient singleton. M011/S01 complete 2026-04-09.
- Notes: Clarified: the vendor bundle is from the jsmdma project, not a standalone data-api project.

## Deferred

### MOD-08 — Update Vue template bindings from v-bind:/v-on: to :/@ shorthand
- Status: deferred
- Description: Update Vue template bindings from v-bind:/v-on: to :/@ shorthand
- Primary owning slice: M011/S03
- Validation: Deferred — no validation required. Vue 3 supports both forms identically; this is a style preference only.
- Notes: Cosmetic-only change; Vue 3 supports both v-bind:/v-on: and :/@ shorthand identically. 41× v-bind: and 27× v-on: in index.html are harmless. Changing them across 6 fragment files risks introducing typos with zero functional benefit. Deferred to a future cosmetic pass.

### R020 — Add deterministic screenshot regression checks for key icon surfaces and themes.
- Class: quality-attribute
- Status: deferred
- Description: Add deterministic screenshot regression checks for key icon surfaces and themes.
- Why it matters: Improves long-term protection against visual regressions.
- Source: inferred
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Deferred because M012 requires existing test flow + manual spot checks, not new visual infrastructure.

### R021 — Convert `v-bind:`/`v-on:` syntax to shorthand `:`/`@` throughout templates.
- Class: admin/support
- Status: deferred
- Description: Convert `v-bind:`/`v-on:` syntax to shorthand `:`/`@` throughout templates.
- Why it matters: Consistency and style hygiene.
- Source: execution
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Cosmetic-only; explicitly deferred from earlier milestones.

### R110 — Design and implement replacement sharing semantics (jsmdma-native share and/or redesigned export/import flow) after legacy share removal.
- Class: integration
- Status: deferred
- Description: Design and implement replacement sharing semantics (jsmdma-native share and/or redesigned export/import flow) after legacy share removal.
- Why it matters: Legacy share is removed now, but replacement requires separate product/architecture decision.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Explicitly deferred from M013 by user direction.

### SYNC-08 — Untitled
- Status: deferred
- Notes: Deferred from M011 — user confirmed pruning can come later. No primary owning slice until a future milestone is planned.

## Out of Scope

### R030 — Implement the Electron app runtime and distribution pipeline.
- Class: constraint
- Status: out-of-scope
- Description: Implement the Electron app runtime and distribution pipeline.
- Why it matters: Prevents scope confusion between icon-pack readiness and desktop app implementation.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: M012 delivers desktop-ready assets only.

### R031 — Add or change planner business features unrelated to branding/icon integration.
- Class: anti-feature
- Status: out-of-scope
- Description: Add or change planner business features unrelated to branding/icon integration.
- Why it matters: Keeps milestone focused and executable.
- Source: inferred
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Functional planner changes belong in later milestones.

## Traceability

| ID | Class | Status | Primary owner | Supporting | Proof |
|---|---|---|---|---|---|
| AUTH-06 |  | validated | M011/S01 | M011/S02 | SyncClient.js created; Api.js rewrites to POST /year-planner/sync with jsmdma payload shape {clientClock, deviceId, changes[{id,doc,fieldRevs}]}; StorageRemote.js deleted; sync-payload.spec.js Playwright test verifies payload shape; all 17 tests pass. M011/S01 complete 2026-04-09. |
| MOD-03 |  | validated | M011/S01 | none | StorageRemote.js deleted from codebase and removed from contexts.js. All references to synchroniseToLocal/synchroniseToRemote replaced across 5 Vue method files and Storage.js. M011/S01 complete 2026-04-09. |
| MOD-05 |  | validated | M011/S03 | none | SquareUp.js deleted in M002/S04; grep of site/js/ and index.html confirms zero squareup references; pay.html modal fragment deleted in M011/S03. |
| MOD-06 |  | validated | M011/S03 | none | model-features.js has no donate flag or window.ftoggle global; only debug/signin flags remain; cleaned in M002/S04. |
| MOD-07 |  | validated | M011/S03 | none | Zero lodash/_.  references in site/js/ or index.html; all 8 lodash calls replaced with native Array methods in M002/S04. |
| MOD-08 |  | deferred | M011/S03 | none | Deferred — no validation required. Vue 3 supports both forms identically; this is a style preference only. |
| MOD-09 |  | validated | M011/S03 | none | contexts.js registers Api, Application, AuthProvider, Storage, StorageLocal, SyncClient as singletons; StorageRemote removed in M011/S01; all modules correctly wired through CDI. |
| R001 | core-capability | validated | M012/S01 | none | Three structurally distinct icon/logo candidate systems delivered as canonical SVG masters with complete preview PNG matrix (16/32/180/192/512) and side-by-side gallery ready for S02 winner selection. All 52 smoke tests pass. Manual legibility review confirms all candidates are visually distinguishable at 16×16 and 32×32. Contract enforced via README and automated assertions. |
| R002 | primary-user-loop | validated | M012/S02 | none | C2 Nordic Clarity explicitly selected as canonical winner based on visual review applying tie-breaker criteria (small-size legibility at 16×16, cross-size coherence). Selection locked in canonical.json with full metadata and alternatives.json documenting archived alternatives (C1, C3). Gallery (icon-comparison.html) updated with data-selection-state attributes. Decision D016 recorded. All selection smoke tests pass enforcing winner uniqueness, alternative completeness, and metadata/gallery agreement." |
| R003 | integration | validated | M012/S03 | M012/S05 | S03 delivered: bash scripts/export-canonical-icon-matrix.sh produces 9 platform-specific PNG variants (favicon-16x16, favicon-32x32, apple-touch-180x180, pwa-any-{192,512}, pwa-maskable-{192,512}, pwa-monochrome-{192,512}) in site/icons/. matrix.json enumerates all entries with platform, purpose (any/maskable/monochrome), size, src paths, and output locations. All 24 matrix export smoke tests pass; all 80 S01/S02 regression tests pass. Export matrix is deterministic and read-only from canonical.json winner metadata. Platform coverage: web (2 sizes), iOS (1 size), PWA (6 sizes across 3 purposes). |
| R004 | launchability | validated | M012/S04 | M012/S03 | S04 integration complete: index.html head links and manifest.json icons[] wired to canonical ./icons/* outputs from S03. All 57 smoke tests pass (icon-live-wiring.spec.js: 28 tests, compose.spec.js: 5 tests, icon-export-matrix.spec.js: 24 tests). Negative-boundary assertions confirm legacy paths are rejected and canonical structure is enforced. |
| R005 | integration | validated | M012/S05 | M012/S03 | M012/S05 delivered: bash scripts/export-desktop-packaging-assets.sh generates site/icons/desktop/year-planner.ico (7 frames: 16,24,32,48,64,128,256) and site/icons/desktop/year-planner.icns (iconset: 16,32,64,128,256,512,1024) from canonical.json winner metadata (C2). site/icons/desktop-matrix.json contract records platform (windows/macos), format (ico/icns), sizes, src paths, and output locations. All 34 desktop-packaging smoke tests pass; all 52 existing icon-export-matrix and icon-live-wiring regression tests pass (86 total). Web/PWA matrix.json remains untouched with 9 entries. candidateId alignment verified (C2 → C2). Python ICO packer and bash exporter implement path safety validation (rejects ../ and absolute paths). Deterministic export and contract enabled by purpose-specific SVG metadata in canonical.json. Desktop assets ready for future Windows/macOS Electron bundling. |
| R006 | quality-attribute | validated | M012/S06 | M012/S04, M012/S05 | S06 complete with 8-stage integrated sign-off runner: (1) icon export matrix generation, (2) desktop packaging assets, (3–5) existing smoke contracts (export, live-wiring, desktop-packaging), (6) S06 visual sign-off spec (29 tests validating matrix contracts and generating deterministic HTML/PNG/JSON artifacts), (7) full Playwright suite, (8) artifact assertions. All stages pass (exit 0). Visual sign-off sheet validates 16/32/180/192/512 web/PWA/desktop surfaces with base64-embedded PNGs and ICC rendering. S06-sign-off-report.json records all stage verdicts and artifact paths. Negative-boundary tests prove path safety (rejects absolute paths, .. traversal, missing files). No blockers discovered across S06 execution. |
| R007 | continuity | active | M013/S04 | M013/S01,M013/S02,M013/S03 | unmapped |
| R020 | quality-attribute | deferred | none | none | unmapped |
| R021 | admin/support | deferred | none | none | unmapped |
| R030 | constraint | out-of-scope | none | none | n/a |
| R031 | anti-feature | out-of-scope | none | none | n/a |
| R100 | integration | validated | M011/S01 | M011/S02 | validated |
| R101 | continuity | validated | M011/S01 | none | validated |
| R102 | operability | validated | M011/S03 | none | validated |
| R103 | continuity | active | M013/S02 | M013/S04 | unmapped |
| R104 | data-model | active | M013/S01 | M013/S04 | unmapped |
| R105 | continuity | active | M013/S03 | M013/S04 | unmapped |
| R106 | operability | active | M013/S03 | M013/S04 | unmapped |
| R107 | primary-user-loop | active | M013/S02 | M013/S04 | unmapped |
| R108 | quality-attribute | active | M013/S02 | M013/S04 | unmapped |
| R109 | quality-attribute | active | M013/S04 | M013/S01,M013/S02,M013/S03 | unmapped |
| R110 | integration | deferred | none | none | unmapped |
| SYNC-04 |  | validated | M011/S02 | none | markEdited() wired in entries.js updateEntry() for all 5 day fields (tp, tl, col, notes, emoji); hlc-write.spec.js Playwright test confirms rev:{uuid} localStorage key contains dot-path keys matching days.YYYY-MM-DD.{field} with non-empty HLC strings after any edit; all 18 tests pass. M011/S02 complete 2026-04-10. |
| SYNC-05 |  | validated | M011/S01 | none | POST /year-planner/sync endpoint wired end-to-end: SyncClient builds payload, Api.sync() calls it, all 9 Vue/Storage call sites updated. sync-payload.spec.js Playwright mock test verifies payload shape (D007). All 17 tests pass. M011/S01 complete 2026-04-09. |
| SYNC-06 |  | validated | M011/S01 | none | SyncClient.js implemented with markEdited(plannerId, dotPath), async sync(plannerId, plannerDoc, authHeaders), and prune(plannerId). Manages rev:{uuid}, base:{uuid}, sync:{uuid} per planner. Uses HLC and flatten/merge from data-api-core.esm.js vendor bundle. CDI-registered as syncClient singleton. M011/S01 complete 2026-04-09. |
| SYNC-08 |  | deferred | none | none | unmapped |

## Coverage Summary

- Active requirements: 8
- Mapped to slices: 8
- Validated: 18 (AUTH-06, MOD-03, MOD-05, MOD-06, MOD-07, MOD-09, R001, R002, R003, R004, R005, R006, R100, R101, R102, SYNC-04, SYNC-05, SYNC-06)
- Unmapped active requirements: 0
