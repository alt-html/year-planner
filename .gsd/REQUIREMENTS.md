# Requirements

This file is the explicit capability and coverage contract for the project.

Use it to track what is actively in scope, what has been validated by completed work, what is intentionally deferred, and what is explicitly out of scope.

Guidelines:
- Keep requirements capability-oriented, not a giant feature wishlist.
- Requirements are atomic, testable, and stated in plain language.
- Every **Active** requirement is mapped to a slice, deferred, blocked with reason, or moved out of scope.
- Validation means the requirement was actually proven by completed work and verification.

## Active

### R001 — Produce 2–3 complete brand/icon candidate sets
- Class: core-capability
- Status: active
- Description: Create 2–3 distinct visual icon/logo sets for Year Planner that are complete enough to evaluate across small and large surfaces.
- Why it matters: The current identity is too weak to ship confidently across install surfaces.
- Source: user
- Primary owning slice: M012/S01
- Supporting slices: none
- Validation: mapped
- Notes: Candidate sets must be coherent systems, not one-off icon sketches.

### R002 — Select one winning set by visual decision
- Class: primary-user-loop
- Status: active
- Description: Choose one of the candidate sets through an explicit visual decision and lock it as the canonical direction.
- Why it matters: Implementation and export work must converge on one source-of-truth style.
- Source: user
- Primary owning slice: M012/S02
- Supporting slices: none
- Validation: mapped
- Notes: Selection method is pure visual call (no weighted rubric).

### R003 — Generate cross-platform icon export matrix
- Class: integration
- Status: active
- Description: Produce platform-ready outputs from canonical sources for web/PWA, iOS, Android, and desktop launch contexts.
- Why it matters: Each platform expects different icon shapes/sizes/purposes.
- Source: user
- Primary owning slice: M012/S03
- Supporting slices: M012/S05
- Validation: mapped
- Notes: Include manifest purposes where applicable (`any`, `maskable`, `monochrome`).

### R004 — Live-wire chosen assets into shipped web app
- Class: launchability
- Status: active
- Description: Replace existing icon references in the app (`index.html`, `manifest.json`, favicon/apple/android files) with the chosen set.
- Why it matters: The milestone must ship integrated assets, not just a design pack.
- Source: user
- Primary owning slice: M012/S04
- Supporting slices: M012/S03
- Validation: mapped
- Notes: Wiring must remain backward-safe until full asset matrix exists.

### R005 — Produce native desktop packaging assets for future Electron
- Class: integration
- Status: active
- Description: Generate `.ico` and `.icns` packaging assets from the canonical source set for future Windows/macOS desktop bundling.
- Why it matters: Avoids rework when Electron packaging starts.
- Source: user
- Primary owning slice: M012/S05
- Supporting slices: M012/S03
- Validation: mapped
- Notes: Electron runtime implementation itself is out of scope for M012.

### R006 — Verify integration through existing test flow and visual checks
- Class: quality-attribute
- Status: active
- Description: Prove icon integration using existing project test flow plus explicit visual spot checks on key sizes/surfaces.
- Why it matters: Prevents shipping broken or illegible icons despite correct file presence.
- Source: user
- Primary owning slice: M012/S06
- Supporting slices: M012/S04, M012/S05
- Validation: mapped
- Notes: Key checks include 16/32/180/192/512 and desktop launch surfaces.

### R007 — Resolve legacy active requirement MOD-09
- Class: continuity
- Status: active
- Description: Close or re-scope the prior unresolved MOD-09 requirement so active requirement debt is not silently carried forward.
- Why it matters: The project should not retain ambiguous active requirements across completed milestones.
- Source: execution
- Primary owning slice: none yet
- Supporting slices: none
- Validation: unmapped
- Notes: This requirement is tracked but not planned inside M012 unless user explicitly expands scope.

## Validated

### R100 — jsmdma sync protocol integration is complete
- Class: integration
- Status: validated
- Description: Client sync stack was rewritten to jsmdma protocol (`POST /year-planner/sync`) with HLC field revisions.
- Why it matters: Provides robust sync semantics and future-proof merge behavior.
- Source: execution
- Primary owning slice: M011/S01
- Supporting slices: M011/S02
- Validation: validated
- Notes: Verified by sync payload and write-path tests in M011.

### R101 — Legacy sync service path removed
- Class: continuity
- Status: validated
- Description: Old `StorageRemote` path and legacy sync calls were removed from live code paths.
- Why it matters: Eliminates competing sync systems and reduces complexity.
- Source: execution
- Primary owning slice: M011/S01
- Supporting slices: none
- Validation: validated
- Notes: Replacement path is `Api.sync` + `SyncClient`.

### R102 — MOD cleanup completed for squareup/lodash/feature-flag debt
- Class: operability
- Status: validated
- Description: SquareUp integration removed, lodash replaced, and obsolete feature-flag globals removed.
- Why it matters: Reduces runtime and maintenance surface.
- Source: execution
- Primary owning slice: M011/S03
- Supporting slices: none
- Validation: validated
- Notes: Verified in codebase and test runs during M011 completion.

## Deferred

### R020 — Add automated visual regression baseline for icon surfaces
- Class: quality-attribute
- Status: deferred
- Description: Add deterministic screenshot regression checks for key icon surfaces and themes.
- Why it matters: Improves long-term protection against visual regressions.
- Source: inferred
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Deferred because M012 requires existing test flow + manual spot checks, not new visual infrastructure.

### R021 — Cosmetic template shorthand migration from MOD-08
- Class: admin/support
- Status: deferred
- Description: Convert `v-bind:`/`v-on:` syntax to shorthand `:`/`@` throughout templates.
- Why it matters: Consistency and style hygiene.
- Source: execution
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Cosmetic-only; explicitly deferred from earlier milestones.

## Out of Scope

### R030 — Build Electron runtime, packaging pipeline, and desktop app delivery
- Class: constraint
- Status: out-of-scope
- Description: Implement the Electron app runtime and distribution pipeline.
- Why it matters: Prevents scope confusion between icon-pack readiness and desktop app implementation.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: M012 delivers desktop-ready assets only.

### R031 — Expand planner feature behavior unrelated to brand/icon system
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
| R001 | core-capability | active | M012/S01 | none | mapped |
| R002 | primary-user-loop | active | M012/S02 | none | mapped |
| R003 | integration | active | M012/S03 | M012/S05 | mapped |
| R004 | launchability | active | M012/S04 | M012/S03 | mapped |
| R005 | integration | active | M012/S05 | M012/S03 | mapped |
| R006 | quality-attribute | active | M012/S06 | M012/S04, M012/S05 | mapped |
| R007 | continuity | active | none yet | none | unmapped |
| R100 | integration | validated | M011/S01 | M011/S02 | validated |
| R101 | continuity | validated | M011/S01 | none | validated |
| R102 | operability | validated | M011/S03 | none | validated |
| R020 | quality-attribute | deferred | none | none | unmapped |
| R021 | admin/support | deferred | none | none | unmapped |
| R030 | constraint | out-of-scope | none | none | n/a |
| R031 | anti-feature | out-of-scope | none | none | n/a |

## Coverage Summary

- Active requirements: 7
- Mapped to slices: 6
- Validated: 3
- Unmapped active requirements: 1
