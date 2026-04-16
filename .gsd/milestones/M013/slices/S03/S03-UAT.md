# S03: Legacy Surface Removal (Share + Feature Flags) — UAT

**Milestone:** M013
**Written:** 2026-04-16T06:14:50.544Z

# User Acceptance Test: S03 Legacy Surface Removal

## Preconditions
- App boots at `http://localhost:8080` via `.tests/` local server
- No external API required (offline mode)
- localStorage cleared between test sections
- Browser DevTools console available for manual verification

## Test Cases

### UAT-1: Share URL parameter is ignored and does not import planner state
**Purpose**: Verify that `?share=` URL parameter does not trigger import behavior or mutate planner state.

**Steps**:
1. Navigate to `http://localhost:8080/?share=LZ_PAYLOAD` (malformed LZ string)
2. Wait for app to fully load (body has `[data-app-ready]` attribute)
3. Verify app boots normally and displays default planner UI
4. Inspect localStorage: no `_pendingImport` key exists
5. Inspect Vue model: no `share` field exists and no `shareUrl` field exists

**Expected Outcome**:
- App boots without error
- No import happens
- App ignores the `?share=` param and shows normal empty/home planner state
- Playwright assertions (LSR suite) confirm this behavior ✅

---

### UAT-2: Share button is absent from rail UI
**Purpose**: Verify that the share button (top rail icon/flyout) is completely removed from the interface.

**Steps**:
1. Boot the app normally
2. Look at the top navigation rail (right side, vertically stacked icons)
3. Use browser DevTools to search for "Share" text or `showShareModal`
4. Count visible action buttons in rail (should be: home, settings, about, help; no share)
5. Run `rg -n "sharePlanner" site/js/vue/` to verify no share method exists

**Expected Outcome**:
- No "Share" button visible in rail
- No share-related HTML in rail element
- No `sharePlanner()` method exists in Vue source
- Playwright assertion LSR-01 confirms ✅

---

### UAT-3: Feature-flag system is completely removed
**Purpose**: Verify that all feature-flag scaffolding, hidden triggers, and conditional logic is removed.

**Steps**:
1. Boot the app and inspect DevTools Elements/HTML
2. Search for "feature" in page source (`Ctrl+F` in DevTools > search "feature")
3. Search footer HTML for hidden feature trigger (small clickable span)
4. Search grid.html for responsive debug block (`v-if="feature.debug"`)
5. Run `rg -n "model-features.js" site/js/vue/` and verify zero matches
6. Verify auth controls (sign-in button) still render and function (direct `signedin()` check, not `feature.signin`)

**Expected Outcome**:
- No "feature" text in page HTML (except in comments)
- No hidden span in footer
- No debug responsive block in grid
- model-features.js file deleted and no imports remain
- Sign-in button is present and clickable
- Playwright assertions LSR-04 and LSR-05 confirm ✅

---

### UAT-4: Share and feature modals do not exist in DOM
**Purpose**: Verify that the share modal and feature modal have been completely removed from the HTML structure.

**Steps**:
1. Boot the app normally
2. Open browser DevTools > Elements
3. Search for `<div id="shareModal"` — should find zero matches
4. Search for `<div id="featureModal"` — should find zero matches
5. Inspect all modals present in `[data-modal]` elements (should be: deleteModal, wipeModal, only)
6. Verify compose output by checking generated `site/index.html` line count (should be 625, down from prior 695)

**Expected Outcome**:
- No shareModal element in DOM
- No featureModal element in DOM
- Remaining modals (deleteModal, wipeModal) are present and functional
- Playwright assertions LSR-02 and LSR-03 confirm ✅

---

### UAT-5: Compose build is clean and includes no orphaned modal fragments
**Purpose**: Verify that the static HTML composition process produces a valid, reduced output with no stale includes.

**Steps**:
1. Run `bash .compose/build.sh` manually
2. Check exit code (should be 0)
3. Verify output line count: `wc -l site/index.html` (should be 625 ± 2 lines)
4. Run `grep -c "shareModal" site/index.html` (should be 0)
5. Run `grep -c "featureModal" site/index.html` (should be 0)
6. Verify `.compose/fragments/share.html` does not exist
7. Verify `.compose/fragments/feature.html` does not exist

**Expected Outcome**:
- Compose build exits cleanly
- Generated index.html is 625 lines (down from 695 after removing two modal markup blocks)
- No share or feature modal markup in composed HTML
- Deleted fragment files confirmed absent
- Smoke assertion COMP-02 confirms ✅

---

### UAT-6: Regression gate catches any reintroduction of legacy surfaces
**Purpose**: Verify that automated grep-gate script would catch accidental reintroduction of share/feature code.

**Steps**:
1. Run `bash scripts/verify-no-legacy-share-features.sh` manually
2. Check exit code (should be 0, "✅ No forbidden share/feature surfaces found.")
3. Temporarily add `shareUrl: 'test'` to site/js/vue/model/planner.js
4. Re-run grep gate (should fail with exit 1 and print matching line)
5. Remove temporary change
6. Re-run grep gate (should pass again)

**Expected Outcome**:
- Grep gate passes in clean state (exit 0)
- Grep gate catches forbidden symbol when introduced (exit 1)
- Grep gate recovers to passing state after removal
- Gate provides line-number evidence of any violations
- This pattern proves regression proof is in place ✅

---

### UAT-7: Auth controls (sign-in button) remain functional after feature-flag removal
**Purpose**: Verify that removing `feature.signin` gate did not break authentication UI.

**Steps**:
1. Boot app as unauthenticated user (no JWT token in localStorage)
2. Look for sign-in button in rail/header
3. Click sign-in button (should navigate to OAuth or show auth modal)
4. Verify sign-in control is NOT behind any `v-if="feature.*"` directive
5. Check that sign-in uses direct `signedin()` method, not `feature.signin` conditional

**Expected Outcome**:
- Sign-in button is visible when not authenticated
- Sign-in functionality works (OAuth flow initiates or modal appears)
- No feature-flag gates control auth visibility
- Playwright assertion LSR-05 confirms ✅

---

## Summary Verification Checklist

- [ ] All 7 UAT cases pass
- [ ] Compose build: exit 0, 625 lines
- [ ] Grep gate: exit 0
- [ ] Playwright suite: 12/12 passed
- [ ] No share URL ingestion observed
- [ ] No feature modals in DOM
- [ ] No hidden feature trigger visible
- [ ] Auth controls functional (sign-in button visible and works)
- [ ] HTML diff before/after S03 shows only removal (no additions)

**Test Run Date**: 2026-04-16
**Test Result**: ✅ ALL PASS — S03 complete, legacy surfaces fully removed, regression proof in place
