# Phase 16: jsmdma Backend Route Audit (BKD-01)

**Audited:** 2026-04-14
**Source:** `/Users/craig/src/github/alt-javascript/jsmdma/packages/auth-hono/AuthController.js`
**Confidence:** HIGH — all routes read directly from source

---

## Auth Route Inventory

All routes are parameterised on `:provider` — no GitHub-specific routes are needed. GitHub reuses the same routes as Google by passing `provider = github`.

| Method | Path | Status | Protected | Notes |
|--------|------|--------|-----------|-------|
| GET | /auth/:provider | EXISTS | No | beginAuth — returns { authorizationURL, state } |
| GET | /auth/:provider/callback | EXISTS | No | completeAuth — 302 redirect to {spaOrigin}/?token=jwt |
| GET | /auth/me | EXISTS | JWT required | current user |
| POST | /auth/logout | EXISTS | No | stateless |
| POST | /auth/link/:provider | EXISTS | JWT required | link additional provider |
| DELETE | /auth/providers/:provider | EXISTS | JWT required | unlink provider |

---

## Middleware Coverage

**AuthMiddlewareRegistrar** (`packages/auth-hono/AuthMiddlewareRegistrar.js`) applies JWT verification to:

- `/auth/me`
- `/auth/link/*`
- `/auth/providers/*`
- `/:application/sync`
- `/:application/search`
- `/orgs`, `/orgs/*`, `/docIndex/*`, `/account/*`

`/auth/:provider` and `/auth/:provider/callback` are intentionally **unprotected** — they are the entry and exit points of the login flow, before a JWT is issued.

**CorsMiddlewareRegistrar** covers `app.use('*', cors(...))` — all routes including `/auth/github` and `/auth/github/callback` are already in CORS scope. No CORS change needed for GitHub.

---

## Gap Analysis

All routes already exist and are parameterised. No new routes or middleware changes are needed to support GitHub OAuth.

**The only missing piece** is the `GitHubProvider` instance in `run-local.js`. Without it, any request to `GET /auth/github` returns:

```json
{ "error": "Unknown provider: github" }
```

**Required addition** (BKD-04): Register a `GitHubProvider` instance in the `authController.providers` map in `packages/example-auth/run-local.js`.

---

## State Parameter Security

`AuthService.beginAuth()` generates a random state parameter for each OAuth initiation. It is stored server-side in a `_pendingAuth` Map with a 10-minute TTL. `completeAuth()` validates the state on callback and removes it (one-time use). This mechanism applies to all providers including GitHub — no additional CSRF protection is needed.

---

## PKCE Note

GitHub does not support PKCE. `GitHubProvider.createAuthorizationURL(state)` takes only `state` — no `codeVerifier`. `AuthService.beginAuth()` always passes a `codeVerifier` as the second argument, but GitHub's provider implementation ignores it. The `codeVerifier` is still stored server-side (harmless). This is verified in `packages/auth-core/providers/github.js`.

---

## Conclusion

No new backend routes or middleware are required. Phase 16 delivers GitHub OAuth support by:

1. **BKD-02** — Adding `"github"` to `KNOWN_PROVIDERS` in the vendored client bundle
2. **BKD-04** — Adding a `GitHubProvider` instance to `run-local.js` providers map

After these changes, `GET /auth/github` will return a valid `{ authorizationURL, state }` JSON response, and the front-end `AuthProvider.getAvailableProviders()` will surface GitHub when the `authConfig.github.clientId` is set.
