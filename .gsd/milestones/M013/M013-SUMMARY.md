---
id: M013
title: "Legacy Alignment Cleanup"
status: complete
completed_at: 2026-04-16T08:08:57.267Z
key_decisions:
  - D021 clean-URL app-state contract with OAuth callback params only
  - D022 identity contract alignment to userKey + planner document UUID semantics
  - D023 remove legacy share now; defer replacement sharing design
  - D024 language/theme system-follow modes with explicit override and return-to-system
  - D025 direct cleanup strategy without compatibility scaffolding for greenfield context
  - D026 dual-field mode persistence (mode + effective value) for compatibility
  - D027 single orchestrator verification gate with JSON stage reporting
key_files:
  - site/js/Application.js
  - site/js/service/StorageLocal.js
  - site/js/service/Storage.js
  - site/js/vue/methods/lifecycle.js
  - site/index.html
  - .compose/fragments/rail.html
  - .compose/fragments/footer.html
  - scripts/verify-m013-cleanup.sh
  - scripts/verify-no-url-state-params.sh
  - .tests/e2e/system-follow-preferences.spec.js
  - .tests/e2e/identity-storage-contract.spec.js
  - .tests/e2e/legacy-surface-removal.spec.js
  - .github/workflows/e2e.yml
lessons_learned:
  - Use targeted grep patterns for contract removal gates (surface-specific checks avoid false positives).
  - System-follow preference modes should persist both mode and effective value to preserve compatibility and avoid race conditions.
  - When removing feature flags, remove scaffolding but preserve intended functionality through direct behavior checks.
  - A single orchestrator verifier reused by CI/local prevents proof-path drift and improves failure localization.
  - Playwright may clear test-results directories during runs; verification scripts must re-create artifact directories before write.
---

# M013: Legacy Alignment Cleanup

**M013 removed legacy uid/query/share/feature contracts, introduced system-follow language/theme with explicit override, and closed with an integrated regression gate proving cleanup end-to-end.**

## What Happened

M013 executed in four completed slices and delivered the planned legacy-alignment cleanup across runtime, storage, templates, and verification.

- **S01 (Identity & storage contract cleanup):** replaced uid-based preference/storage mechanics with `userKey` + planner UUID semantics; moved app state controls (theme/lang/year) to in-app lifecycle mutations; removed uid/id URL navigation surfaces; added identity contract tests and `verify-no-legacy-uid.sh` gate.
- **S02 (Clean URL + system-follow prefs):** removed year/lang/theme URL bootstrap contract, introduced `langMode`/`themeMode` (`system` vs `explicit`) with live matchMedia/languagechange behavior, and expanded regression coverage (`system-follow-preferences.spec.js`, updated clean-url/dark-mode flow) plus `verify-no-url-state-params.sh` gate.
- **S03 (Share/feature legacy surface removal):** removed `?share=` + LZ import/export runtime paths, deleted share/feature modal surfaces and feature-flag plumbing, preserved auth controls via direct signedin checks, and added `verify-no-legacy-share-features.sh` + targeted E2E assertions.
- **S04 (Verification hardening and closure):** added `scripts/verify-m013-cleanup.sh` unified orchestrator (3 grep gates + smoke/e2e), produced structured report artifact, fixed remaining legacy URL-param surfaces in composed templates/output, and aligned CI to use the same verifier.

### Decision Re-evaluation
| Decision | Re-evaluation | Status | Next-step |
|---|---|---|---|
| D021 (clean URL app state; keep OAuth callbacks) | Implemented and reinforced by grep + E2E gates; no regressions observed. | Valid | Keep as default navigation contract. |
| D022 (identity via userKey + document UUID) | Implemented in storage/bootstrap/tests; multi-planner behavior remains intact. | Valid | Keep; remove remaining cosmetic `model.uid` residue when convenient. |
| D023 (remove legacy share now, defer replacement) | Legacy share removed completely; no replacement scope required in M013. | Valid | Revisit only when replacement sharing requirements are explicitly planned. |
| D024 (system-follow + explicit override) | Delivered with mode persistence and live listeners; tests confirm behavior. | Valid | Revisit only if UX research changes default-mode policy. |
| D025 (direct cleanup, no migration scaffolding) | Worked for this greenfield/no-live-users context; accelerated cleanup. | Valid | No revisit needed unless deployment context changes. |
| D026 (dual-field mode persistence with compatibility) | Effective and safe for existing consumers; no compatibility regressions. | Valid | Keep for future preference-model extensions. |
| D027 (single orchestrator gate + JSON report) | Successfully unified local/CI verification and failure localization. | Valid | Reuse orchestrator pattern for future cleanup milestones. |

## Success Criteria Results

- [x] **Identity/state surfaces operate without uid mechanics and preserve multi-planner flows (S01 After-this).**
  - Evidence: `prefs:${userKey}` persistence, planner `meta.userKey`, active-planner UUID flow, 25+ S01 regressions, `verify-no-legacy-uid.sh` PASS, integrated S04 verifier PASS.
- [x] **Year/lang/theme are controlled in-app with clean URLs; language/theme can follow system unless explicitly overridden (S02 After-this).**
  - Evidence: URL-state params removed from runtime bootstrap; mode-aware `setTheme`/`setLang` + live listeners; 45-test S02 suite PASS; `verify-no-url-state-params.sh` PASS.
- [x] **No legacy share or feature-flag surfaces remain in UI/runtime (S03 After-this).**
  - Evidence: share URL/LZ runtime path removed; feature-flag plumbing removed; compose/UI cleanup complete; 12/12 S03 Playwright assertions PASS; `verify-no-legacy-share-features.sh` PASS.
- [x] **Full smoke+e2e and new M013 gates pass with explicit proof of removed legacy contracts (S04 After-this).**
  - Evidence: unified gate `scripts/verify-m013-cleanup.sh` exit 0; stage report shows all grep gates green and Playwright smoke/e2e 263 pass (9 skipped server-dependent); CI uses same orchestrator.

## Definition of Done Results

- [x] **All slices complete.** `gsd_milestone_status(M013)` reports S01/S02/S03/S04 all `complete` with task totals fully done (3/3, 3/3, 3/3, 2/2).
- [x] **All slice summaries exist.** Found: `.gsd/milestones/M013/slices/S01/S01-SUMMARY.md`, `S02-SUMMARY.md`, `S03-SUMMARY.md`, `S04-SUMMARY.md`.
- [x] **Cross-slice integration points work in assembled milestone.**
  - S01/S02/S03 gate scripts are consumed by S04 orchestrator and pass in integrated run.
  - S01 identity contract (`userKey` + active planner UUID) underpins S02 mode persistence and remains compatible with S03 removals.
  - S02 clean-URL contract remains intact after S03 UI/template removals and S04 final fragment/index cleanup.
- [x] **Code-change verification confirms non-doc implementation landed.** Equivalent milestone-range diff (`git diff --stat 9306b98 HEAD -- ':!.gsd/'`) shows 51 non-`.gsd/` files changed (runtime, templates, scripts, tests).
- [x] **Horizontal checklist verification.** No explicit Horizontal Checklist section exists in `M013-ROADMAP.md`; treated as not applicable.

## Requirement Outcomes

| Requirement | Transition | Evidence |
|---|---|---|
| R007 | active → validated | S04 unified verifier passes all stages and records pass artifact (`.tests/test-results/m013-cleanup/M013-cleanup-report.json`), closing prior MOD-09 debt surfaces across S01-S03. |
| R103 | active → validated | S02 removed app-state URL bootstrap params and proved clean URL behavior via tests and URL-state grep gate. |
| R104 | active → validated | S01 moved identity/storage contract to `userKey` + planner UUID semantics; regression + gate evidence holds in S04 integrated run. |
| R105 | active → validated | S03 removed share URL/LZ runtime/UI surfaces; grep + targeted E2E confirmation. |
| R106 | active → validated | S03 removed feature-flag plumbing/modal/trigger surfaces while preserving auth behavior; grep + E2E confirmation. |
| R107 | active → validated | S02 implemented language system-follow + explicit override with live behavior and regression proof. |
| R108 | active → validated | S02 implemented theme system-follow + explicit override with live behavior and regression proof. |
| R109 | active → validated | S04 provides strict integrated proof (3 grep gates + full smoke/e2e) with structured reporting and CI parity. |

All listed transitions are supported by objective slice evidence and final integrated verification; R104 and R109 were re-confirmed in DB during milestone closure.

## Deviations

None.

## Follow-ups

Optional cleanup: remove remaining cosmetic `model.uid` residue and any legacy comment references now that identity is fully `userKey` + planner UUID.
