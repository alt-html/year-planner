---
phase: 12-auth-client-configuration-live-sync
reviewed: 2026-04-13T05:46:08Z
depth: standard
files_reviewed: 24
files_reviewed_list:
  - .compose/fragments/grid.html
  - .compose/fragments/modals/auth.html
  - .compose/fragments/modals/delete.html
  - .compose/fragments/modals/entry.html
  - .compose/fragments/modals/share.html
  - .compose/fragments/nav.html
  - .compose/fragments/rail.html
  - .compose/fragments/scripts.html
  - .compose/index.html.m4
  - .tests/e2e/auth-modal.spec.js
  - .tests/e2e/contract-sync.spec.js
  - .tests/e2e/planner-management.spec.js
  - .tests/globalSetup.js
  - .tests/globalTeardown.js
  - .tests/playwright.config.js
  - site/index.html
  - site/js/Application.js
  - site/js/vue/app.js
  - site/js/vue/methods/auth.js
  - site/js/vue/methods/entries.js
  - site/js/vue/methods/lifecycle.js
  - site/js/vue/methods/planner.js
  - site/js/vue/methods/rail.js
  - site/js/vue/model/ui.js
findings:
  critical: 1
  warning: 4
  info: 4
  total: 9
status: issues_found
---

# Phase 12: Code Review Report

**Reviewed:** 2026-04-13T05:46:08Z
**Depth:** standard
**Files Reviewed:** 24
**Status:** issues_found

## Summary

This phase introduces federated auth client configuration (Google, Apple, Microsoft), a sign-in pester modal, live-sync wiring, and planner-selector ownership indicators. The overall structure is well-organised and the Vue-reactive modal pattern is clean. One critical issue was found: a real Google OAuth 2.0 client ID is committed in a source file. Four warnings cover logic/reliability issues: an unchecked `null` dereference in `copyUrl()`, an unresolved template placeholder in `AuthProvider`, a state inconsistency in `signout()` where `userKey` is not cleared, and a test reliability gap where Apple/Microsoft provider assumptions are not verified. Four info-level items cover dead code and minor maintainability concerns.

---

## Critical Issues

### CR-01: Real Google OAuth Client ID Committed to Source

**File:** `site/js/config/auth-config.js:6`
**Issue:** A live Google OAuth 2.0 client ID (`98746316056-d581h0p6u6ts0544fcu28gtu5brblal5.apps.googleusercontent.com`) is committed in plain text. Even if this is a deliberately public client ID (OAuth client IDs for web apps are visible to the browser at runtime), committing it to source means it travels into every fork, archive, and git mirror of the repository. If the intent is that this ID is environment-specific, it should be injected at build time. If it is the permanent production credential, this finding can be downgraded to info after a conscious decision is documented.

**Fix:**
```js
// Option A — inject at build time via an environment variable substitution:
export const authConfig = {
    google: {
        clientId: '__GOOGLE_CLIENT_ID__',   // replaced by build/deploy pipeline
    },
    // ...
};

// Option B — if the ID is intentionally public and fixed, add an explicit comment:
// NOTE: Google OAuth client IDs for web applications are public credentials;
// they appear in every browser request. This value is intentional.
export const authConfig = {
    google: {
        clientId: '98746316056-d581h0p6u6ts0544fcu28gtu5brblal5.apps.googleusercontent.com',
    },
    // ...
};
```

---

## Warnings

### WR-01: Null Dereference in `copyUrl()` — `document.getElementById` May Return Null

**File:** `site/js/vue/methods/planner.js:88-91`
**Issue:** `copyUrl()` calls `document.getElementById('copyUrl')` and immediately calls `.select()` on the result without a null check. If the share modal is not in the DOM (e.g., called programmatically or from a test), this throws `TypeError: Cannot read properties of null (reading 'select')`. The sibling method `sharePlanner()` (line 81) already has a null guard for the same element.

**Fix:**
```js
copyUrl() {
    const copyText = document.getElementById('copyUrl');
    if (!copyText) return;
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    document.execCommand('copy');
},
```

### WR-02: Unresolved Template Placeholder `'${api.url}'` as Literal String in AuthProvider

**File:** `site/js/service/AuthProvider.js:12`
**Issue:** The constructor assigns `this.url = '${api.url}'` — a literal string, not a template literal. The `_getApiUrl()` method at line 96 detects this by checking `if (raw.startsWith('${'))` and falls back to a hardcoded `http://127.0.0.1:8081/`. This means the production URL is never actually read from config; the fallback is always triggered. If a production deployment needs a real server URL, this placeholder mechanism is silently broken for any environment that does not perform string substitution at build time.

**Fix:** Either wire the API URL from the config object explicitly:
```js
import config from '../config/config.js';

constructor(model, storageLocal) {
    // ...
    this.url = config.get('api.url') || 'http://127.0.0.1:8081/';
    // ...
}
```
Or document clearly that `'${api.url}'` is a sentinel that must be replaced by the build pipeline before deployment, and add a runtime assertion so the issue is obvious rather than silent.

### WR-03: `signout()` Does Not Clear `userKey` — Stale Ownership Indicators After Sign-Out

**File:** `site/js/vue/methods/auth.js:21-26`
**Issue:** After sign-out, `this.uuid` and `this.signedin` are reset but `this.userKey` is not updated. The nav-settings dropdown uses `planner.meta.userKey === userKey` to determine which planners show the cloud sync icon (nav.html:40). After signing out, `userKey` still holds the old authenticated UUID, so cloud indicators remain visible and the "Sync to cloud" link may still appear. The correct post-signout `userKey` should be the device ID.

**Fix:**
```js
signout() {
    this.authProvider.signOut();
    this.uuid     = '';
    this.signedin = false;
    this.userKey  = this.plannerStore.getUserKey();  // reverts to DeviceSession key
    this.storageLocal.wipe();
},
```

### WR-04: E2E Test Assumption — Apple/Microsoft Buttons Assert Modal Closes Without Verifying Provider Is Enabled

**File:** `.tests/e2e/auth-modal.spec.js:56-80`
**Issue:** Tests `E2E-AUTH-02` and `E2E-AUTH-03` assert that clicking the Apple and Microsoft buttons immediately closes the modal (comment: "sets showAuthModal = false immediately"). The actual `signInWith()` implementation in `auth.js` sets `showAuthModal = false` then calls `this.authProvider.signIn(provider)`. For Apple and Microsoft, `signIn()` attempts to load provider SDKs and calls provider APIs. If the auth config has no `clientId` configured (which is the current state for both providers in `auth-config.js`), `getAvailableProviders()` returns them as unavailable — but `signInWith()` is called regardless, because the modal buttons are always shown. The tests will pass now but will break if `_signInApple()` or `_signInMicrosoft()` throws synchronously before the modal-close line runs, or if the modal's reactive state is checked too quickly. More critically: the buttons in `auth.html` are unconditionally shown regardless of provider configuration, meaning users can click Apple/Microsoft when those providers have no `clientId`.

**Fix (two parts):**
1. Guard the auth modal buttons against unconfigured providers:
```html
<!-- auth.html -->
<button ... v-if="authProvider.isConfigured('apple')" v-on:click="signInWith('apple')">
```
2. In the test, stub out the provider SDK calls to prevent network requests:
```js
await page.route('https://appleid.cdn-apple.com/**', route => route.abort());
```

---

## Info

### IN-01: `document.execCommand('copy')` Is Deprecated

**File:** `site/js/vue/methods/planner.js:90`
**Issue:** `document.execCommand('copy')` is deprecated and may be removed in future browser versions. The modern replacement is `navigator.clipboard.writeText()`.

**Fix:**
```js
copyUrl() {
    const copyText = document.getElementById('copyUrl');
    if (!copyText) return;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(copyText.value).catch(() => {
            // fallback for non-secure contexts
            copyText.select();
            document.execCommand('copy');
        });
    } else {
        copyText.select();
        document.execCommand('copy');
    }
},
```

### IN-02: Hardcoded Local Path in `globalSetup.js`

**File:** `.tests/globalSetup.js:9`
**Issue:** `const JSMDMA_PATH = process.env.JSMDMA_PATH || '/Users/craig/src/github/alt-javascript/jsmdma'` has a developer-specific absolute path as the fallback. This works correctly (the env variable is the primary mechanism and the path is only used for optional contract tests that skip if the file doesn't exist), but it is confusing for other contributors.

**Fix:** Remove the fallback, or use a path relative to the project root:
```js
const JSMDMA_PATH = process.env.JSMDMA_PATH || '';
```

### IN-03: `waitForTimeout` Used in E2E Planner Management Test

**File:** `.tests/e2e/planner-management.spec.js:29, 39, 47`
**Issue:** `page.waitForTimeout(500)` and `page.waitForTimeout(300)` are time-based waits, which are fragile on slow CI runners. Playwright recommends waiting for a specific DOM condition instead.

**Fix:** Replace with an explicit selector wait, e.g.:
```js
// Instead of: await page.waitForTimeout(500);
await page.waitForSelector('.nav-settings', { state: 'visible' });
// or wait for planner count to change
```

### IN-04: `_showSigninPester` UI State Exposed on Model as Private-Convention Field

**File:** `site/js/vue/model/ui.js:11` and `site/js/Application.js:102`
**Issue:** `_showSigninPester` (underscore prefix indicating "private") is a reactive model property that is set in `Application.js` and consumed in `lifecycle.js`. Mixing application-init concerns (`Application.js`) with Vue reactive state that is then read and consumed by lifecycle methods is an implicit coupling. This is a low-severity maintainability issue, not a bug, but it could cause confusion if the field is ever renamed or refactored.

**Fix:** Consider passing the pester decision as an argument to `refresh()` or handling it entirely within the lifecycle method, rather than using a reactive model property as a communication channel between the application init and the Vue component mount phase.

---

_Reviewed: 2026-04-13T05:46:08Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
