# S03: MOD audit + cleanup

**Goal:** Mark MOD-05/06/07/09 as validated (already done in prior milestones), mark MOD-08 as deferred (cosmetic-only, not worth the churn), and delete seven orphan modal fragment files that were left behind when SquareUp, legacy auth, and cookie-consent were removed.
**Demo:** After this: MOD audit is documented; all pending MOD-05–09 items are resolved or explicitly deferred with rationale; all 14 tests pass.

## Must-Haves

- MOD-05, MOD-06, MOD-07, MOD-09 status → validated in REQUIREMENTS.md
- MOD-08 status → deferred in REQUIREMENTS.md with rationale
- `.compose/fragments/modals/` retains exactly 5 files: auth.html, delete.html, entry.html, feature.html, share.html
- `bash .compose/build.sh` exits 0 and produces unchanged site/index.html
- All 18 Playwright tests pass

## Proof Level

- This slice proves: contract — requirement status DB updates verified by REQUIREMENTS.md content; file deletion verified by ls; compose and Playwright confirm no regressions

## Integration Closure

No new wiring. S03 is terminal housekeeping — no downstream slices depend on it.

## Verification

- None — no runtime code changes.

## Tasks

- [x] **T01: Mark MOD requirements validated/deferred and delete orphan fragment files** `est:20m`
  This is the single execution task for S03. It does two things:

1. **Update requirement statuses** — call `gsd_requirement_update` for each of the five MOD requirements:
   - MOD-05 (Remove SquareUp) → status: validated. Validation note: SquareUp.js deleted in M002/S04; grep of site/js/ and index.html confirms zero squareup references; REQUIREMENTS.md updated.
   - MOD-06 (Clean feature flags) → status: validated. Validation note: model-features.js has no donate flag or window.ftoggle global; only debug/signin flags remain; cleaned in M002/S04.
   - MOD-07 (Replace lodash) → status: validated. Validation note: zero lodash/_.  references in site/js/ or index.html; all 8 lodash calls replaced with native Array methods in M002/S04.
   - MOD-08 (Update template bindings) → status: deferred. Notes: v-bind:/v-on: → :/@ shorthand conversion is purely cosmetic; Vue 3 supports both forms identically; 41× v-bind: and 27× v-on: in index.html are harmless; changing them across 6 fragment files risks introducing typos with zero functional benefit; defer to a future cosmetic pass.
   - MOD-09 (Wire modules through CDI) → status: validated. Validation note: contexts.js registers Api, Application, AuthProvider, Storage, StorageLocal, SyncClient as singletons; StorageRemote removed in M011/S01; all modules correctly wired.

2. **Delete orphan modal fragments** — these files exist in `.compose/fragments/modals/` but are NOT included in the modals.html build, so they have zero runtime impact:
   - `.compose/fragments/modals/pay.html` — SquareUp payment modal, removed with SquareUp in M002/S04
   - `.compose/fragments/modals/signin.html` — old username/password auth, replaced by auth.html in M004
   - `.compose/fragments/modals/register.html` — bespoke registration, removed in M004
   - `.compose/fragments/modals/reset-password.html` — bespoke password reset, removed in M004
   - `.compose/fragments/modals/recover-username.html` — bespoke username recovery, removed in M004
   - `.compose/fragments/modals/cookie.html` — cookie consent modal, removed in M003
   - `.compose/fragments/modals/settings.html` — settings modal, removed/superseded

   After deletion, `.compose/fragments/modals/` should contain exactly: auth.html, delete.html, entry.html, feature.html, share.html.

3. **Verify compose build** — run `bash .compose/build.sh` to confirm the build still produces the same site/index.html. The deleted files are not included in the build, so this should pass without changes.

4. **Run all Playwright tests** — run `cd .tests && npx playwright test --reporter=line` and confirm 18/18 pass.
  - Files: `.gsd/REQUIREMENTS.md`, `.compose/fragments/modals/pay.html`, `.compose/fragments/modals/signin.html`, `.compose/fragments/modals/register.html`, `.compose/fragments/modals/reset-password.html`, `.compose/fragments/modals/recover-username.html`, `.compose/fragments/modals/cookie.html`, `.compose/fragments/modals/settings.html`
  - Verify: ls .compose/fragments/modals/ | sort | tr '\n' ' ' && echo '' && bash .compose/build.sh && cd .tests && npx playwright test --reporter=line

## Files Likely Touched

- .gsd/REQUIREMENTS.md
- .compose/fragments/modals/pay.html
- .compose/fragments/modals/signin.html
- .compose/fragments/modals/register.html
- .compose/fragments/modals/reset-password.html
- .compose/fragments/modals/recover-username.html
- .compose/fragments/modals/cookie.html
- .compose/fragments/modals/settings.html
