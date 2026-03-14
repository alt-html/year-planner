# S05: CDI wiring and integration verification

**Goal:** Final integration verification of all M002 changes. Confirm contexts.js is clean, delete orphaned controller.js, verify app boots with no console errors, all 14 E2E tests pass, and .compose/build.sh produces valid output. Close the milestone.
**Demo:** All 14 E2E tests pass, app boots cleanly in browser with no console errors, orphaned files cleaned up.

## Must-Haves

- controller.js deleted (orphaned since S01)
- contexts.js verified clean (no orphaned imports)
- All 14 Playwright E2E tests pass
- App boots in browser with no console errors
- .compose/build.sh produces valid index.html

## Proof Level

- This slice proves: final-assembly
- Real runtime required: yes
- Human/UAT required: no

## Verification

- `cd .tests && npx playwright test` — all 14 tests pass
- Browser boot with console error check — no errors

## Tasks

- [x] **T01: Clean up orphaned files and verify full integration** `est:10m`
  - Why: Final milestone verification — clean up and prove everything works
  - Files: `js/vue/controller.js`, `js/config/contexts.js`
  - Do: Delete controller.js. Verify contexts.js has no orphaned imports. Run E2E tests. Boot app in browser and check console for errors. Verify .compose/build.sh output.
  - Verify: All 14 tests pass, no console errors, compose produces valid output
  - Done when: Milestone definition of done is met

## Files Likely Touched

- `js/vue/controller.js` (deleted)
