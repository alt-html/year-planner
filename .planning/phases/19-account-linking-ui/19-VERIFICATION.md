---
phase: 19-account-linking-ui
verified: 2026-04-15T18:30:00Z
status: human_needed
score: 4/4
overrides_applied: 0
human_verification:
  - test: "Sign in with GitHub, open Settings flyout, verify Connected Accounts section shows GitHub with Phosphor icon and no Unlink button"
    expected: "Connected Accounts header visible, GitHub listed with icon, no Unlink button (last-provider guard)"
    why_human: "Visual layout and icon rendering cannot be verified programmatically"
  - test: "Click 'Link another account', complete Google OAuth, verify both providers appear with Unlink buttons"
    expected: "OAuth redirect completes, both GitHub and Google shown, Unlink buttons visible on both"
    why_human: "Requires real OAuth provider interaction and live backend"
  - test: "Click Unlink on Google, verify it disappears and GitHub's Unlink button is hidden"
    expected: "DELETE request succeeds, Google removed, Unlink button hidden (back to 1 provider)"
    why_human: "Requires live backend for DELETE /auth/providers/:provider"
  - test: "After link, check localStorage plnr:* entries — meta.userKey should match ClientAuthSession.getUserUuid()"
    expected: "All plnr:* meta.userKey values updated to primary UUID"
    why_human: "Requires real identity merge scenario with live backend"
---

# Phase 19: Account Linking UI Verification Report

**Phase Goal:** Users can manage connected OAuth providers from a settings view -- linking a second provider, unlinking with a safety guard, and merging planner data across identities without sync duplicates
**Verified:** 2026-04-15T18:30:00Z
**Status:** human_needed
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A signed-in user can link a second OAuth provider from the settings view and see it appear in the connected accounts list | VERIFIED | `linkProvider()` in AuthService.js (line 53) initiates OAuth with `?link=true`; `completeLinkCallback()` (line 65) POSTs to `/auth/link/:provider`; `doLinkProvider()` in auth.js opens modal in link mode; `signInWith()` routes to `linkProvider()` when `authLinkMode` is true; auth modal hides already-linked providers; Application.init() detects link callback and updates `model.linkedProviders` |
| 2 | A user can unlink a provider and is blocked from unlinking their last remaining provider | VERIFIED | `unlinkProvider()` in AuthService.js (line 38) sends DELETE with Bearer token, throws on 409; `doUnlinkProvider()` in auth.js (line 34) updates `linkedProviders` reactively; rail.html `v-if="linkedProviders.length > 1"` hides Unlink button when 1 provider (dual guard) |
| 3 | The connected accounts settings view lists all linked providers with link and unlink actions visible | VERIFIED | rail.html line 298-307: Connected Accounts header, `v-for="provider in linkedProviders"` with Phosphor icon and Unlink button; "Link another account" link shown when `availableProviders.length > linkedProviders.length`; `linkedProviders` populated from JWT payload at init (Application.js line 127) |
| 4 | After identity merge, planner entries carry the merged userKey and do not create duplicate sync records | VERIFIED | Application.js lines 53-58: link success handler calls `plannerStore.listPlanners()` then `plannerStore.takeOwnership(uuid)` for each planner; PlannerStore.takeOwnership() (line 164) delegates to `_docStore.takeOwnership(uuid, userId)` using `ClientAuthSession.getUserUuid()` |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `site/js/vue/model/auth.js` | linkedProviders reactive state | VERIFIED | Contains `linkedProviders : []` in authState |
| `site/js/auth/AuthService.js` | linkProvider, completeLinkCallback, unlinkProvider methods | VERIFIED | All three async methods present with correct HTTP verbs and endpoint paths |
| `site/js/vue/methods/auth.js` | doUnlinkProvider, doLinkProvider Vue methods | VERIFIED | Both methods present; doLinkProvider sets authLinkMode and opens modal; doUnlinkProvider updates linkedProviders from server response |
| `.compose/fragments/rail.html` | Connected Accounts HTML section | VERIFIED | Lines 297-307: header, provider list with icons, conditional Unlink, Link another account |
| `.compose/fragments/modals/auth.html` | Dual-mode auth modal | VERIFIED | Title switches between Sign In / Link; hides already-linked providers in link mode |
| `site/js/vue/model/ui.js` | authLinkMode flag | VERIFIED | Line 23: `authLinkMode : false` |
| `site/js/vue/i18n/en.js` | i18n labels for connected accounts UI | VERIFIED | connectedAccounts, link, unlink, addAccount, lastProvider labels present; error.providerConflict present |
| `site/js/Application.js` | Link callback detection, linkedProviders init, userKey migration | VERIFIED | Lines 35-72: link callback block; line 127: JWT payload population; lines 53-58: takeOwnership loop |
| `.tests/e2e/account-linking.spec.js` | E2E test stubs for LNK-01 through LNK-04 | VERIFIED | 5 test.fixme() stubs covering all four requirements |
| `site/index.html` | Regenerated build output | VERIFIED | Contains connectedAccounts template markup |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| rail.html | vue/methods/auth.js | `v-on:click.prevent="doUnlinkProvider(provider)"` | WIRED | rail.html line 303 binds click to doUnlinkProvider; auth.js line 34 implements it |
| rail.html | vue/methods/auth.js | `v-on:click.prevent="doLinkProvider()"` | WIRED | rail.html line 307 binds click; auth.js line 47 implements doLinkProvider |
| vue/methods/auth.js | AuthService.js | `this.authProvider.unlinkProvider(provider)` | WIRED | auth.js line 36 calls unlinkProvider; AuthService.js line 38 implements it |
| vue/methods/auth.js | AuthService.js | `this.authProvider.linkProvider(provider)` | WIRED | auth.js line 14 calls linkProvider (in signInWith link mode); AuthService.js line 53 implements it |
| Application.js | AuthService.js | `authProvider.completeLinkCallback()` | WIRED | Application.js line 46 calls completeLinkCallback; AuthService.js line 65 implements it |
| Application.js | PlannerStore.js | `this.model.plannerStore.takeOwnership(uuid)` | WIRED | Application.js line 57 calls takeOwnership; PlannerStore.js line 164 implements it |
| Application.js | model/auth.js | `model.linkedProviders = payload?.providers` | WIRED | Application.js line 127 populates from JWT; model/auth.js line 6 declares the state |
| vue/methods/rail.js | model/ui.js | `this.authLinkMode = false` on modal close | WIRED | rail.js line 90 resets authLinkMode; ui.js line 23 declares the flag |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| rail.html (Connected Accounts) | linkedProviders | JWT payload via ClientAuthSession.getPayload() at init | Yes -- reads providers array from server-issued JWT | FLOWING |
| rail.html (after unlink) | linkedProviders | DELETE /auth/providers/:provider response | Yes -- server returns remaining providers array | FLOWING |
| rail.html (after link) | linkedProviders | POST /auth/link/:provider response | Yes -- server returns updated user.providers | FLOWING |
| Application.js (userKey migration) | plannerStore.listPlanners() | localStorage plnr:* documents | Yes -- reads from DocStore | FLOWING |

### Behavioral Spot-Checks

Step 7b: SKIPPED (requires live OAuth backend and browser environment -- not runnable from CLI)

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| LNK-01 | 19-02 | Link second OAuth provider | SATISFIED | AuthService.linkProvider() + completeLinkCallback() + Application.init() callback detection + doLinkProvider() Vue method + auth modal link mode |
| LNK-02 | 19-01 | Unlink provider with last-provider guard | SATISFIED | AuthService.unlinkProvider() with 409 handling + doUnlinkProvider() + rail.html `v-if="linkedProviders.length > 1"` dual guard |
| LNK-03 | 19-01 | Connected accounts UI | SATISFIED | rail.html Connected Accounts section with provider list, icons, unlink buttons, link button; i18n labels; linkedProviders model state populated from JWT |
| LNK-04 | 19-02 | userKey migration after identity merge | SATISFIED | Application.init() link success handler iterates planners and calls takeOwnership(uuid) |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| .tests/e2e/account-linking.spec.js | multiple | test.fixme() stubs | Info | Intentional Wave 0 stubs -- tests are verification targets, not implementation gaps |

No TODO, FIXME, placeholder, or stub patterns found in any production files.

### Human Verification Required

### 1. Connected Accounts Display (LNK-03)

**Test:** Sign in with GitHub, open Settings flyout, verify "Connected Accounts" section appears below Sign Out with GitHub listed and a Phosphor icon. Verify no Unlink button is shown (only 1 provider).
**Expected:** Connected Accounts header visible, GitHub listed with `ph-github-logo` icon, no Unlink button.
**Why human:** Visual layout, icon rendering, and flyout interaction require a browser with live auth.

### 2. Link Flow End-to-End (LNK-01)

**Test:** While signed in with GitHub, click "Link another account...", complete Google OAuth flow, verify both providers appear in Connected Accounts with Unlink buttons on both.
**Expected:** OAuth redirect completes, SPA receives callback with `?code=` and `?state=`, POST /auth/link/google succeeds, both providers listed.
**Why human:** Requires real OAuth provider interaction and running backend.

### 3. Unlink Flow End-to-End (LNK-02)

**Test:** With both providers linked, click Unlink on Google. Verify Google disappears and GitHub's Unlink button is hidden.
**Expected:** DELETE request succeeds, provider removed from list, last-provider guard re-engages.
**Why human:** Requires live backend for DELETE /auth/providers/:provider.

### 4. userKey Migration (LNK-04)

**Test:** After linking, check localStorage plnr:* entries in DevTools. meta.userKey should match ClientAuthSession.getUserUuid().
**Expected:** All plnr:* meta.userKey values updated to primary UUID after identity merge.
**Why human:** Requires real identity merge scenario with planner data in localStorage.

### Gaps Summary

No code-level gaps found. All artifacts exist, are substantive, are wired, and have real data flowing through them. All four requirements (LNK-01 through LNK-04) are satisfied at the code level.

The phase requires human verification because the feature involves OAuth redirects, live backend API calls, and visual UI that cannot be tested programmatically from CLI. The 19-02 SUMMARY reports that human verification was completed and approved during plan execution, but per verification protocol, these items are surfaced for the verifier record.

---

_Verified: 2026-04-15T18:30:00Z_
_Verifier: Claude (gsd-verifier)_
