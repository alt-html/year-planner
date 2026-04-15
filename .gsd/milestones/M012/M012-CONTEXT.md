# M012: Brand/Icon System Overhaul

**Gathered:** 2026-04-15
**Status:** Ready for planning

## Project Description

Replace Year Planner’s current rudimentary icon/logo set with a stronger visual system selected from 2–3 candidate directions, then wire the chosen set into the live web app and produce full cross-platform asset variants for iOS, Android, browser/PWA, and desktop packaging surfaces.

## Why This Milestone

Current icon assets are minimal and visually weak (especially the ISO-character-based identity), which undermines app quality on install and launch surfaces. This milestone establishes a canonical identity system and removes ambiguity before future desktop bundling.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Install/open Year Planner on browser/mobile surfaces and see the new chosen icon set instead of the old rudimentary set.
- Use a single, coherent icon identity across favicon, home-screen/app-launch, and desktop packaging targets.

### Entry point / environment

- Entry point: `site/index.html` + `site/manifest.json` icon references
- Environment: browser + PWA install surfaces (iOS/Android/desktop browsers)
- Live dependencies involved: none

## Completion Class

- Contract complete means: required icon file matrix exists in expected formats/sizes and references are wired correctly.
- Integration complete means: selected icon set is used end-to-end in web/PWA metadata and desktop packaging outputs.
- Operational complete means: existing test flow runs clean with new assets and critical visual surfaces remain legible.

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- The selected icon set is fully wired in `site/index.html` and `site/manifest.json`, with no stale references to retired assets.
- Required platform variants exist and are export-complete, including desktop packaging formats (`.ico`, `.icns`).
- Existing verification flow passes and critical visual checks at key sizes/surfaces confirm usability.

## Scope

### In Scope

- Create 2–3 complete icon/logo candidate sets.
- Choose one winning set by visual decision.
- Use canonical source assets and generate platform variants.
- Perform live wiring in shipped web assets.
- Produce desktop packaging assets for future Electron.

### Out of Scope / Non-Goals

- Building Electron runtime/distribution pipeline.
- Changing planner behavior/features unrelated to identity/assets.
- Introducing a heavyweight new visual regression infrastructure in this milestone.

## Architectural Decisions

### Single-source asset pipeline

**Decision:** Start from canonical source assets (vector masters) and generate platform outputs from that source.

**Rationale:** Prevents drift, keeps branding geometry consistent, and enables cheap future updates.

**Alternatives Considered:**
- Per-size handcrafted assets — rejected as default due to maintenance overhead and inconsistency risk.

### Selection strategy is pure visual call

**Decision:** Choose the winner by direct visual judgment rather than rubric scoring.

**Rationale:** User preference; keeps decision cycle fast and clear.

**Alternatives Considered:**
- Weighted rubric scoring — rejected for this milestone by user direction.

### Desktop packaging outputs included now

**Decision:** Include `.ico` and `.icns` output packs in M012.

**Rationale:** Future Electron bundling is expected; producing these now avoids a second asset pass.

**Alternatives Considered:**
- PWA/browser-only outputs — rejected as too narrow for stated future direction.

---

> See `.gsd/DECISIONS.md` for append-only decision records.

## Error Handling Strategy

- Fail fast if required assets are missing/invalid in the export matrix.
- Treat partial export completion as overall failure until the required matrix is complete.
- Keep current wired assets as rollback baseline until new set validates.
- Treat manifest/head reference mismatches as contract failures.
- Do not advance without explicit winner selection.

## Risks and Unknowns

- Candidate quality mismatch at tiny sizes (16/32) — may force late redesign if not tested early.
- Cross-platform interpretation differences (`maskable`/`monochrome`) — can produce unexpected clipping or contrast.
- Desktop packaging conversion pitfalls (`.icns` tooling details) — can block future desktop readiness if not validated now.

## Existing Codebase / Prior Art

- `site/index.html` — current apple-touch/favicon/manifest wiring to replace.
- `site/manifest.json` — current Android-only icon entries to expand.
- `mockups/icon-comparison.html` — existing icon-system comparison prior art.
- `mockups/combined-themes.html` — existing visual direction exploration prior art.
- `site/*.png`, `site/favicon.ico` — current minimal asset baseline.

## Relevant Requirements

- R001 — produce 2–3 complete candidate sets.
- R002 — select one winner by visual decision.
- R003 — generate platform export matrix.
- R004 — live-wire selected assets in app.
- R005 — produce `.ico`/`.icns` pack.
- R006 — verify through existing test flow + visual checks.

## Technical Constraints

- Maintain compatibility with static-file deployment model (no bundler).
- Preserve existing test harness flow in `.tests/` and integrate verification there.
- Keep reference paths stable and explicit in `site/index.html` and `site/manifest.json`.
- Use platform-appropriate manifest icon purposes (`any`, `maskable`, `monochrome`) where relevant.

## Integration Points

- Web app metadata (`<link rel="icon">`, `<link rel="apple-touch-icon">`, `<link rel="manifest">`) — must point to selected assets.
- PWA manifest icon array — must represent chosen matrix accurately.
- Desktop packaging consumers (future Electron build tooling) — must receive usable `.ico` and `.icns` artifacts.

## Testing Requirements

Use existing project verification flow as primary proof:

- Run existing Playwright suite and smoke checks to ensure no regressions from asset rewiring.
- Add/extend checks that validate key icon references/files exist and are reachable.
- Manual visual spot-checks at 16, 32, 180, 192, 512 and desktop launch surfaces.

## Acceptance Criteria

- 2–3 complete candidate icon/logo sets are produced and reviewable.
- One set is explicitly selected and locked as canonical source assets.
- Export matrix covers iOS, Android, web/PWA, and desktop packaging outputs.
- `site/index.html` and `site/manifest.json` are live-wired to the selected assets.
- Existing test flow passes after integration changes.
- Manual spot-checks confirm legibility and visual quality on critical surfaces.

## Discussion Layer Capture

### Scope (Layer 1)
- Include live wiring, not mock-only output.
- Produce 2–3 candidate sets.
- No fixed brand constraints imposed by user.
- Target full iOS/Android/browser/desktop variant coverage.

### Architectural Decisions (Layer 2)
- Canonical-source export pipeline.
- Pure visual winner selection.
- Include native desktop packaging outputs now.

### Error Handling Strategy (Layer 3)
- Sensible defaults selected: fail-fast matrix checks, no ambiguous advancement, rollback safety.

### Acceptance Criteria (Layer 4)
- Existing test flow is mandatory verification path.
- Done includes both canonical source lock and production-ready export pack (`.ico`, `.icns`).

## Open Questions

- Should MOD-09 legacy active requirement be pulled into M012 or tracked separately in a later milestone?
- Which exact desktop surface preview method should be used for visual sign-off (platform emulation vs captured real host views)?
