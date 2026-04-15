# Requirements: Year Planner

**Defined:** 2026-04-14
**Core Value:** Offline-first local planner that works without an account, and syncs bidirectionally when signed in — without data loss across devices.

## v1.5 Requirements

Requirements for GitHub OAuth & Account Linking milestone. Each maps to roadmap phases.

### Backend Discovery & Wiring

- [ ] **BKD-01**: Audit jsmdma server for GitHub OAuth route support — document existing routes, missing middleware, required config
- [ ] **BKD-02**: Patch KNOWN_PROVIDERS in vendored jsmdma-auth-client.esm.js to include "github"
- [ ] **BKD-03**: Register GitHub OAuth App for dev localhost with correct callback URL (production CloudFront app deferred to deployment phase)
- [ ] **BKD-04**: Wire missing backend routes/middleware for GitHub OAuth token exchange in jsmdma run-server

### GitHub OAuth Client

- [ ] **GHO-01**: User can sign in with GitHub via real OAuth flow (server-assisted authorization code exchange)
- [ ] **GHO-02**: Fix provider identification — remove hardcoded 'google' fallback in Application.js callback handler
- [ ] **GHO-03**: Fix PKCE state storage — switch from sessionStorage to localStorage with post-exchange cleanup
- [ ] **GHO-04**: Hide Apple/Microsoft sign-in buttons when their client IDs are not configured

### Auth Module Extraction

- [ ] **AUT-01**: Extract auth code to site/js/auth/ folder with app-agnostic API (AuthService.js, OAuthClient.js, auth-config.js)
- [ ] **AUT-02**: Migrate Google OAuth provider into site/js/auth/ alongside GitHub
- [ ] **AUT-03**: Fix sign-out to clear credentials only — do not wipe() unsynced planner data
- [ ] **AUT-04**: Atomic CDI swap — delete old AuthProvider.js, rewire contexts.js, Api.js, Application.js

### Account Linking

- [ ] **LNK-01**: User can link a second OAuth provider to their existing account
- [ ] **LNK-02**: User can unlink a provider (with last-provider guard — must retain at least one)
- [ ] **LNK-03**: Connected accounts UI — settings view showing linked providers with link/unlink actions
- [ ] **LNK-04**: Run userKey migration on planner entries after identity merge to prevent sync duplicates

## Future Requirements

### Deferred Providers

- **PRV-01**: User can sign in with Apple OAuth
- **PRV-02**: User can sign in with Microsoft OAuth

### Backlog

- **BLG-01**: Anonymous UID migration (timestamp → UUID)
- **BLG-02**: Pester modal skip UX

## Out of Scope

| Feature | Reason |
|---------|--------|
| Apple/Microsoft OAuth sign-in | Client IDs not configured; buttons hidden in v1.5, re-enable when ready |
| Silent auto-linking on email match | Account takeover vector — all linking requires explicit user confirmation |
| PKCE as required (no client_secret) | GitHub still requires client_secret even with PKCE; PKCE is additive defence-in-depth only |
| Mobile app OAuth | Web-first; mobile browser OAuth works via redirect flow |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BKD-01 | Phase 16 | Pending |
| BKD-02 | Phase 16 | Pending |
| BKD-03 | Phase 16 | Pending |
| BKD-04 | Phase 16 | Pending |
| GHO-01 | Phase 17 | Pending |
| GHO-02 | Phase 17 | Pending |
| GHO-03 | Phase 17 | Pending |
| GHO-04 | Phase 17 | Pending |
| AUT-01 | Phase 18 | Pending |
| AUT-02 | Phase 18 | Pending |
| AUT-03 | Phase 18 | Pending |
| AUT-04 | Phase 18 | Pending |
| LNK-01 | Phase 19 | Pending |
| LNK-02 | Phase 19 | Pending |
| LNK-03 | Phase 19 | Pending |
| LNK-04 | Phase 19 | Pending |

**Coverage:**
- v1.5 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-14*
*Last updated: 2026-04-14 after roadmap creation*
