---
phase: 19-account-linking-ui
plan: "02"
subsystem: auth
tags: [oauth, account-linking, pkce, link-flow, userkey-migration]
dependency_graph:
  requires: [19-01]
  provides: [LNK-01, LNK-04]
  affects: [site/js/auth/AuthService.js, site/js/Application.js, site/js/vue/methods/auth.js]
tech_stack:
  added: []
  patterns: [oauth-link-mode-callback, auth-modal-dual-mode, url-param-decode-before-reencode]
key_files:
  created: []
  modified:
    - site/js/auth/AuthService.js
    - site/js/Application.js
    - site/js/vue/methods/auth.js
    - site/js/vue/model/ui.js
    - site/js/vue/methods/rail.js
    - .compose/fragments/modals/auth.html
    - .compose/fragments/rail.html
    - site/js/vue/i18n/en.js
decisions:
  - "Server-side link mode required: beginAuth accepts ?link=true, completeAuth redirects with ?code= instead of ?token="
  - "Auth modal reused for link flow with authLinkMode flag — hides already-linked providers, changes button labels"
  - "code_verifier passed through server callback redirect URL for PKCE providers (Google)"
  - "urlParam() returns percent-encoded values — must decodeURIComponent before passing to completeLinkCallback"
  - "Unlink styled with inherited colour at 70% opacity to match flyout tone"
metrics:
  duration: "~45 minutes"
  completed: "2026-04-15"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 8
requirements-completed: [LNK-01, LNK-04]
---

# Phase 19 Plan 02: OAuth Link Flow and userKey Migration Summary

**OAuth link flow with server-side link mode, auth modal provider picker, PKCE code_verifier passthrough, and per-planner userKey migration**

## Performance

- **Duration:** ~45 min (including 4 bug fix iterations during human verification)
- **Tasks:** 2/2
- **Files modified:** 8 (client) + 2 (server jsmdma)

## Accomplishments
- Complete OAuth link flow: initiate redirect → server callback in link mode → SPA receives code → POST /auth/link/:provider
- Auth modal reused in link mode — hides current provider, shows "Link with" labels
- userKey migration runs on all local planners after successful link (LNK-04)
- Server-side link mode in AuthService/AuthController (beginAuth ?link=true, completeAuth forwards code)

## Task Commits

1. **Task 1: Implement linkProvider, completeLinkCallback, doLinkProvider, userKey migration** - `9505153`
2. **Fix: Link flow uses auth modal with current provider hidden** - `e4c7f55`
3. **Fix: Server link mode — callback redirects with ?code= instead of ?token=** - `127cca0`
4. **Fix: Decode URL params before link callback (double-encoding)** - `ee2d543`
5. **Fix: Unlink button styling** - `5a16a1c`, `48c66e1`
6. **Task 2: Human verification** - approved

## Files Created/Modified
- `site/js/auth/AuthService.js` - linkProvider(?link=true), completeLinkCallback(+codeVerifier)
- `site/js/Application.js` - Link callback detection with URL param decoding
- `site/js/vue/methods/auth.js` - doLinkProvider() opens modal in link mode, signInWith() handles link mode
- `site/js/vue/model/ui.js` - authLinkMode flag
- `site/js/vue/methods/rail.js` - closeAuthModal() resets authLinkMode
- `.compose/fragments/modals/auth.html` - Dual-mode title/labels, hide linked providers
- `.compose/fragments/rail.html` - Unlink styling (inherited colour, 70% opacity)
- `site/js/vue/i18n/en.js` - error.providerConflict label

## Decisions Made
- Server change was required — GET /auth/:provider always exchanged the code and redirected with ?token=. Link flow needs raw code for POST /auth/link/:provider.
- Auth modal reused rather than creating a separate link picker — simpler, consistent UX
- Unlink styled as inherited-colour text at 70% opacity to match flyout tone

## Deviations from Plan

### Auto-fixed Issues

**1. Link flow replaced session instead of linking**
- **Found during:** Human verification (Task 2)
- **Issue:** linkProvider() used GET /auth/:provider which always redirects with ?token=, replacing the session
- **Fix:** Added ?link=true param; server stores linkMode flag; completeAuth redirects with ?code=&state=&code_verifier=
- **Files modified:** AuthService.js (server+client), AuthController.js, Application.js
- **Verification:** Human-verified — both providers appear after link

**2. Double-encoded OAuth code caused 500**
- **Found during:** Human verification (Task 2)
- **Issue:** urlParam() returns percent-encoded values; completeLinkCallback re-encoded them
- **Fix:** Added decodeURIComponent() in Application.init()
- **Verification:** POST /auth/link/:provider succeeds

**3. CORS blocked DELETE for unlink**
- **Found during:** Human verification (Task 2)
- **Issue:** CorsMiddlewareRegistrar only allowed GET, POST, OPTIONS
- **Fix:** Added DELETE to allowMethods
- **Verification:** Unlink works without CORS error

**4. Unlink button styling**
- **Found during:** Human verification (Task 2)
- **Issue:** btn-link text-danger rendered as bold underlined red
- **Fix:** Changed to inherited colour at 70% opacity
- **Verification:** Matches flyout tone

---

**Total deviations:** 4 auto-fixed (1 architectural, 1 encoding, 1 CORS, 1 styling)
**Impact on plan:** Server-side change was required but not anticipated. The link flow fundamentally cannot work without server cooperation in the BFF OAuth pattern.

## Issues Encountered
- Plan assumed OAuth callback would return ?code= to SPA, but server always exchanges code and returns ?token=. Required server-side changes to AuthService and AuthController in jsmdma repo.

## User Setup Required
None.

## Next Phase Readiness
- All LNK requirements (LNK-01 through LNK-04) implemented and human-verified
- Ready for phase verification

---
*Phase: 19-account-linking-ui*
*Completed: 2026-04-15*
