# Phase 12 — Local POC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** End-to-end HLC sync working locally — real Google sign-in, local jsmdma server on port 8081, UAT passes before any cloud deployment.

**Architecture:** The SPA (localhost:8080) sends Google ID tokens as Bearer headers. A local Hono server (127.0.0.1:8081) verifies them directly against Google's JWKS endpoint using `jose`, bypassing jsmdma's JWT-based auth layer (which is for the production stack). In-memory jsnosqlc stores sync state for the session.

**Tech Stack:** `jose` (OIDC token verify), `hono/cors`, `@alt-javascript/boot-hono`, `@alt-javascript/jsnosqlc-memory`, `@alt-javascript/jsmdma-server`, `@alt-javascript/jsmdma-hono`

---

## Critical Context

Two repos are modified in this plan:

| Repo | Path |
|---|---|
| Year Planner SPA | `/Users/craig/src/github/alt-html/year-planner` |
| jsmdma backend | `/Users/craig/src/github/alt-javascript/jsmdma` |

**Three bugs to fix before sync can work:**

1. **Payload mismatch** — `SyncClient.js` sends `{ clientClock, deviceId, changes:[{id,doc,fieldRevs}] }` but `AppSyncController` expects `{ collection, clientClock, changes:[{key,doc,fieldRevs,baseClock}] }`. Needs: add `collection:'planners'`, rename `id`→`key`, add `baseClock`.

2. **Auth mismatch** — `authMiddleware.js` verifies jsmdma-issued JWTs. The SPA sends raw Google ID tokens. Local server needs custom middleware that verifies Google OIDC tokens via JWKS.

3. **One Tap blocked on localhost** — Google One Tap (`prompt()`) is suppressed by browsers on localhost. `AuthProvider._signInGoogle()` currently rejects with "not available". Needs button-based fallback using `renderButton()`.

**No changes needed to `config.js`** — it already maps `localhost:8080` → `dev` profile with `api.url: 'http://127.0.0.1:8081/'`.

---

## File Map

### `alt-html/year-planner` (SPA repo)

| File | Action | What changes |
|---|---|---|
| `site/js/service/SyncClient.js` | Modify | Add `collection:'planners'`, rename `id`→`key`, add `baseClock` per change |
| `site/js/config/auth-config.js` | Modify | Populate `google.clientId` |
| `site/js/service/AuthProvider.js` | Modify | Add `renderButton` fallback when One Tap suppressed |
| `.compose/fragments/modals/auth.html` | Modify | Add `#google-signin-button` container div |
| `.tests/e2e/sync-payload.spec.js` | Modify | Update assertions to use `key`, add `collection` check |

### `alt-javascript/jsmdma` (backend repo)

| File | Action | What it does |
|---|---|---|
| `packages/example-auth/CorsMiddlewareRegistrar.js` | Create | Registers CORS middleware before routes |
| `packages/example-auth/GoogleIdTokenMiddlewareRegistrar.js` | Create | Verifies Google OIDC ID tokens, sets `c.set('user', {sub})` |
| `packages/example-auth/run-local.js` | Create | TCP server on 127.0.0.1:8081 with year-planner app, in-memory store |

---

## Task 1: Fix SyncClient.js payload shape

**Files:**
- Modify: `site/js/service/SyncClient.js`
- Modify: `.tests/e2e/sync-payload.spec.js`

### Background

`AppSyncController.sync()` requires the request body to have:
- `collection` (string, required) — the logical collection name; for year-planner this is `'planners'`
- `clientClock` (string, required) — unchanged
- `changes[].key` (not `id`) — document key (the planner UUID)
- `changes[].baseClock` — the HLC from which the client last synced (equals `clientClock`)

Current `SyncClient.sync()` builds:
```js
const payload = {
    clientClock,
    deviceId: this.storageLocal.getDevId(),   // extra field, not required by server
    changes: [{ id: plannerId, doc: plannerDoc, fieldRevs }],
};
```

- [ ] **Step 1: Write the failing test**

Current `sync-payload.spec.js` checks `change.id` — update it to check `change.key` and `collection`:

```js
// .tests/e2e/sync-payload.spec.js
// Verifies: POST /year-planner/sync carries the correct jsmdma payload shape (D007).
const { test, expect } = require('../fixtures/cdn');

const SESSION_JSON = JSON.stringify({"0":"test-uuid","1":0});

test('sync POST carries jsmdma payload shape (D007)', async ({ page }) => {
  let capturedBody = null;

  await page.addInitScript((sessionData) => {
    if (sessionStorage.getItem('_seeded')) return;
    sessionStorage.setItem('_seeded', '1');
    localStorage.clear();
    localStorage.setItem('1', sessionData);
  }, SESSION_JSON);

  await page.route('**/year-planner/sync', async (route) => {
    const req = route.request();
    capturedBody = JSON.parse(req.postData() || 'null');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ serverClock: '0000000000001-000000-00000000', serverChanges: [] }),
    });
  });

  await page.goto('/?uid=12345&year=2026');
  await page.waitForSelector('[data-app-ready]');
  await page.waitForTimeout(2000);

  expect(capturedBody).not.toBeNull();
  expect(capturedBody.collection).toBe('planners');
  expect(typeof capturedBody.clientClock).toBe('string');
  expect(Array.isArray(capturedBody.changes)).toBe(true);
  if (capturedBody.changes.length > 0) {
    const change = capturedBody.changes[0];
    expect(typeof change.key).toBe('string');
    expect(change.id).toBeUndefined();
    expect(change.doc !== undefined).toBe(true);
    expect(change.fieldRevs !== undefined).toBe(true);
    expect(typeof change.baseClock).toBe('string');
  }
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
cd /Users/craig/src/github/alt-html/year-planner
npx playwright test .tests/e2e/sync-payload.spec.js
```

Expected: FAIL — `Expected: "planners", Received: undefined` (collection missing) and `change.id` present instead of `change.key`.

- [ ] **Step 3: Update SyncClient.js**

In `site/js/service/SyncClient.js`, replace the `sync` method's payload construction (lines 96–99) and POST call (line 103):

Old block:
```js
        // (d) Build jsmdma payload
        const payload = {
            clientClock,
            deviceId: this.storageLocal.getDevId(),
            changes: [{ id: plannerId, doc: plannerDoc, fieldRevs }],
        };

        // (e) POST to /year-planner/sync — throws with err.status on HTTP error
        const response = await fetchJSON(`${this.url}year-planner/sync`, {
```

New block:
```js
        // (d) Build jsmdma payload
        const payload = {
            collection: 'planners',
            clientClock,
            changes: [{ key: plannerId, doc: plannerDoc, fieldRevs, baseClock: clientClock }],
        };

        // (e) POST to /year-planner/sync — throws with err.status on HTTP error
        const response = await fetchJSON(`${this.url}year-planner/sync`, {
```

- [ ] **Step 4: Run the test to confirm it passes**

```bash
npx playwright test .tests/e2e/sync-payload.spec.js
```

Expected: PASS — 1 test passes.

- [ ] **Step 5: Run full e2e suite to check for regressions**

```bash
npx playwright test .tests/e2e/
```

Expected: All tests pass (sync-error.spec.js uses a mock that accepts any POST body — no change needed there).

- [ ] **Step 6: Commit**

```bash
cd /Users/craig/src/github/alt-html/year-planner
git add site/js/service/SyncClient.js .tests/e2e/sync-payload.spec.js
git commit -m "fix(sync): align SyncClient payload with AppSyncController protocol

Add collection:'planners', rename id→key, add baseClock per change.
AppSyncController requires all three fields; previous payload caused
400 Bad Request (missing collection) at the server."
```

---

## Task 2: Configure Google OAuth client ID

This task requires manual steps in Google Cloud Console. The plan records the steps and the file that receives the result.

- [ ] **Step 1: Create OAuth 2.0 credentials in Google Cloud Console**

1. Go to console.cloud.google.com → select or create a project
2. Navigate to APIs & Services → Credentials
3. Click "Create Credentials" → "OAuth 2.0 Client ID"
4. Application type: **Web application**
5. Authorized JavaScript origins — add both:
   - `http://localhost:8080`
   - `http://127.0.0.1:8080`
6. Click "Create"
7. Copy the **Client ID** (format: `123456789-abc...apps.googleusercontent.com`)

- [ ] **Step 2: Populate auth-config.js**

In `site/js/config/auth-config.js`, set `google.clientId`:

```js
// site/js/config/auth-config.js
export default {
    google: {
        clientId: 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com',
    },
    apple: {
        clientId: '',
    },
    microsoft: {
        clientId: '',
    },
};
```

Replace `YOUR_CLIENT_ID_HERE.apps.googleusercontent.com` with the actual client ID from Step 1.

- [ ] **Step 3: Verify the file is not committed with a real client ID** *(skip if the project treats client IDs as non-secret)*

Google OAuth client IDs are public-facing and safe to commit. The client ID appears in the SPA source anyway. Proceed.

- [ ] **Step 4: Commit**

```bash
cd /Users/craig/src/github/alt-html/year-planner
git add site/js/config/auth-config.js
git commit -m "config: add Google OAuth client ID for localhost POC"
```

---

## Task 3: Fix Google sign-in for localhost

**Files:**
- Modify: `site/js/service/AuthProvider.js`
- Modify: `.compose/fragments/modals/auth.html`

### Background

`_signInGoogle()` currently calls `window.google.accounts.id.prompt()` (One Tap). On localhost, One Tap is suppressed by browsers — the notification callback returns `isNotDisplayed() === true` and the promise rejects.

The fix: after calling `prompt()`, if it's suppressed, call `google.accounts.id.renderButton()` to render a Google-branded sign-in button into a container div already present in the auth modal. The user clicks it to complete auth. The same `callback` from `initialize()` fires with the credential, resolving the promise.

`renderButton` renders the button synchronously — the container div must exist in the DOM when it's called. The auth modal is already mounted when `signInWith('google')` is triggered.

- [ ] **Step 1: Add the button container to auth.html fragment**

Read `.compose/fragments/modals/auth.html` first, then locate the Google sign-in button. Add a `<div id="google-signin-button">` immediately after the existing Google button element.

The fragment currently contains something like:
```html
<button ... v-on:click="signInWith('google')">
```

Add the container div directly below it:
```html
<button ... v-on:click="signInWith('google')">
    <!-- existing button content unchanged -->
</button>
<div id="google-signin-button" style="margin-top:0.5rem;min-height:44px"></div>
```

The `min-height:44px` prevents layout shift when the Google button renders into it.

- [ ] **Step 2: Rebuild site/index.html**

```bash
cd /Users/craig/src/github/alt-html/year-planner
bash .compose/build.sh
```

Expected: exits 0, `site/index.html` updated (check that `google-signin-button` div appears with `grep "google-signin-button" site/index.html`).

- [ ] **Step 3: Update _signInGoogle() in AuthProvider.js**

Locate the `_signInGoogle()` method. Replace it entirely:

```js
async _signInGoogle() {
    await this._loadSDK('google', 'https://accounts.google.com/gsi/client');
    return new Promise((resolve, reject) => {
        window.google.accounts.id.initialize({
            client_id: authConfig.google.clientId,
            callback: (response) => {
                if (response.credential) {
                    this._storeAuth('google', response.credential);
                    resolve(response.credential);
                } else {
                    reject(new Error('Google sign-in failed'));
                }
            },
            cancel_on_tap_outside: false,
        });

        // Try One Tap first (works in production with proper browser context).
        // When suppressed (localhost, browser policy), fall back to the
        // rendered button — renderButton() renders the Google-branded button
        // into #google-signin-button; the user clicks it to complete auth.
        window.google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                const container = document.getElementById('google-signin-button');
                if (container) {
                    window.google.accounts.id.renderButton(container, {
                        theme: 'outline',
                        size: 'large',
                        width: '280',
                    });
                } else {
                    reject(new Error('Google sign-in not available — #google-signin-button container missing'));
                }
            }
        });
    });
}
```

- [ ] **Step 4: Run existing auth-related e2e tests**

```bash
cd /Users/craig/src/github/alt-html/year-planner
npx playwright test .tests/e2e/
```

Expected: All tests pass. (The auth flow tests use mocked sign-in; this change doesn't affect mock behaviour.)

- [ ] **Step 5: Commit**

```bash
git add site/js/service/AuthProvider.js .compose/fragments/modals/auth.html site/index.html
git commit -m "fix(auth): fall back to renderButton when One Tap suppressed on localhost

Google One Tap (prompt()) is blocked by browsers on localhost. When
notification.isNotDisplayed() or isSkippedMoment(), render the Google
sign-in button into #google-signin-button. Adds container div to auth
modal fragment and rebuilds site/index.html."
```

---

## Task 4: Write CorsMiddlewareRegistrar (jsmdma repo)

**Files:**
- Create: `packages/example-auth/CorsMiddlewareRegistrar.js`

This CDI component uses boot-hono's `routes()` hook to register the `hono/cors` middleware before any route handlers. It must be the first component registered in the CDI context that uses `routes()`.

- [ ] **Step 1: Create the file**

```js
// packages/example-auth/CorsMiddlewareRegistrar.js
/**
 * CorsMiddlewareRegistrar — registers CORS middleware for the local POC server.
 *
 * Must be registered BEFORE GoogleIdTokenMiddlewareRegistrar and AppSyncController
 * in the CDI context so CORS headers are added to all responses (including 401s).
 */
import { cors } from 'hono/cors';

export default class CorsMiddlewareRegistrar {
  // No __routes — uses the imperative routes() hook only

  routes(app) {
    app.use('*', cors({
      origin: ['http://localhost:8080', 'http://127.0.0.1:8080'],
      allowMethods: ['GET', 'POST', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
      maxAge: 300,
    }));
  }
}
```

- [ ] **Step 2: Verify hono/cors is available**

```bash
cd /Users/craig/src/github/alt-javascript/jsmdma
node -e "import('hono/cors').then(m => console.log('cors ok:', Object.keys(m)))"
```

Expected: `cors ok: [ 'cors' ]`

- [ ] **Step 3: Commit**

```bash
cd /Users/craig/src/github/alt-javascript/jsmdma
git add packages/example-auth/CorsMiddlewareRegistrar.js
git commit -m "feat(example-auth): add CorsMiddlewareRegistrar for local POC server"
```

---

## Task 5: Write GoogleIdTokenMiddlewareRegistrar (jsmdma repo)

**Files:**
- Create: `packages/example-auth/GoogleIdTokenMiddlewareRegistrar.js`

This CDI component verifies Google ID tokens (from `Authorization: Bearer <id_token>`) against Google's public JWKS endpoint. On success it sets `c.set('user', { sub: 'google:' + claims.sub })` — matching the shape `AppSyncController` expects (`userPayload.sub`).

`jose` is already in `example-auth/package.json`. The JWKS URL is `https://www.googleapis.com/oauth2/v3/certs` (Google's public key endpoint). The issuer is `https://accounts.google.com`.

- [ ] **Step 1: Create the file**

```js
// packages/example-auth/GoogleIdTokenMiddlewareRegistrar.js
/**
 * GoogleIdTokenMiddlewareRegistrar — verifies Google OIDC ID tokens for local POC.
 *
 * Replaces AuthMiddlewareRegistrar in the local server. Accepts a raw Google
 * ID token as the Bearer credential and verifies it against Google's JWKS.
 *
 * Sets c.set('user', { sub: 'google:' + claims.sub }) — AppSyncController reads
 * honoCtx.get('user').sub as the userId for storage namespacing.
 *
 * CDI property injection:
 *   this.googleClientId — audience for token verification (required)
 *   this.logger         — optional logger
 */
import { createRemoteJWKSet, jwtVerify } from 'jose';

const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const GOOGLE_ISSUER   = 'https://accounts.google.com';

export default class GoogleIdTokenMiddlewareRegistrar {
  // No __routes — uses the imperative routes() hook only

  constructor() {
    this.googleClientId = null; // CDI property-injected from config
    this.logger         = null; // CDI autowired (optional)
  }

  /**
   * Register Google ID token verification middleware on the sync route.
   * @param {import('hono').Hono} app
   */
  routes(app) {
    const clientId = this.googleClientId;
    const logger   = this.logger;

    if (!clientId) {
      logger?.warn?.('[GoogleIdTokenMiddlewareRegistrar] googleClientId not configured — sync will return 401');
      return;
    }

    const JWKS = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL));

    const mw = async (c, next) => {
      const authHeader = c.req.header('Authorization');

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        logger?.debug?.('[GoogleIdTokenMiddlewareRegistrar] missing Authorization header');
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const token = authHeader.slice(7); // strip 'Bearer '

      try {
        const { payload: claims } = await jwtVerify(token, JWKS, {
          issuer:   GOOGLE_ISSUER,
          audience: clientId,
        });

        // Set the user identity on the Hono context — AppSyncController reads this.
        // 'google:' prefix keeps userIds provider-namespaced for the local POC.
        c.set('user', { sub: `google:${claims.sub}` });
        logger?.debug?.(`[GoogleIdTokenMiddlewareRegistrar] verified Google user sub=${claims.sub}`);
        await next();
      } catch (err) {
        logger?.debug?.(`[GoogleIdTokenMiddlewareRegistrar] invalid token: ${err.message}`);
        return c.json({ error: 'Unauthorized' }, 401);
      }
    };

    app.use('/:application/sync', mw);
    logger?.debug?.('[GoogleIdTokenMiddlewareRegistrar] Google OIDC middleware applied to /:application/sync');
  }
}
```

- [ ] **Step 2: Verify jose imports resolve**

```bash
cd /Users/craig/src/github/alt-javascript/jsmdma
node -e "import { createRemoteJWKSet, jwtVerify } from 'jose'; console.log('jose ok')"
```

Expected: `jose ok`

- [ ] **Step 3: Commit**

```bash
git add packages/example-auth/GoogleIdTokenMiddlewareRegistrar.js
git commit -m "feat(example-auth): add GoogleIdTokenMiddlewareRegistrar for local POC

Verifies Google OIDC ID tokens via JWKS instead of jsmdma JWTs.
Sets c.set('user', {sub: 'google:'+claims.sub}) for AppSyncController.
Used in run-local.js for Phase 12 local end-to-end sync."
```

---

## Task 6: Write run-local.js (jsmdma repo)

**Files:**
- Create: `packages/example-auth/run-local.js`

This is the local HTTP server for Phase 12. It starts a real TCP server on `127.0.0.1:8081` via `HonoAdapter.run()`. It wires the year-planner application with in-memory jsnosqlc, CORS, Google ID token auth, and `AppSyncController`.

Key differences from `example/run.js`:
- Uses `appCtx.start()` (not `{ run: false }`) to bind the TCP port
- No `AuthMiddlewareRegistrar` — uses `GoogleIdTokenMiddlewareRegistrar` instead
- No `AuthController`, `UserRepository`, `AuthService` — sync only
- `year-planner` application registered with `planners` collection
- CORS for localhost:8080

- [ ] **Step 1: Create the file**

```js
// packages/example-auth/run-local.js
/**
 * run-local.js — Local POC server for Phase 12 end-to-end sync testing.
 *
 * Starts a real HTTP server on 127.0.0.1:8081.
 * Verifies Google ID tokens (not jsmdma JWTs).
 * Uses in-memory jsnosqlc for storage (data is lost on restart).
 *
 * Run:
 *   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com \
 *     node packages/example-auth/run-local.js
 *
 * Or set GOOGLE_CLIENT_ID in your shell environment before running.
 *
 * Routes served:
 *   GET  /health              — liveness check
 *   POST /year-planner/sync   — HLC sync endpoint (requires Google ID token)
 */

import '@alt-javascript/jsnosqlc-memory';
import { Context, ApplicationContext } from '@alt-javascript/cdi';
import { EphemeralConfig } from '@alt-javascript/config';
import { honoStarter } from '@alt-javascript/boot-hono';
import { jsnosqlcAutoConfiguration } from '@alt-javascript/boot-jsnosqlc';
import {
  SyncRepository,
  SyncService,
  ApplicationRegistry,
  SchemaValidator,
} from '@alt-javascript/jsmdma-server';
import { AppSyncController } from '@alt-javascript/jsmdma-hono';
import CorsMiddlewareRegistrar from './CorsMiddlewareRegistrar.js';
import GoogleIdTokenMiddlewareRegistrar from './GoogleIdTokenMiddlewareRegistrar.js';

// ── config ────────────────────────────────────────────────────────────────────

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

if (!GOOGLE_CLIENT_ID) {
  console.error('\nError: GOOGLE_CLIENT_ID environment variable is required.\n');
  console.error('  GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com \\');
  console.error('    node packages/example-auth/run-local.js\n');
  process.exit(1);
}

const APPLICATIONS_CONFIG = {
  'year-planner': {
    description: 'Year planner application',
    collections: {
      planners: {
        schemaPath: './packages/server/schemas/planner.json',
      },
    },
  },
};

// ── CDI context ───────────────────────────────────────────────────────────────

const config = new EphemeralConfig({
  'boot':         { 'banner-mode': 'off', nosql: { url: 'jsnosqlc:memory:' } },
  'logging':      { level: { ROOT: 'info' } },
  'server':       { port: 8081, host: '127.0.0.1' },
  'auth':         { google: { clientId: GOOGLE_CLIENT_ID } },
  'applications': APPLICATIONS_CONFIG,
});

const context = new Context([
  ...honoStarter(),
  ...jsnosqlcAutoConfiguration(),
  { Reference: SyncRepository,    name: 'syncRepository',    scope: 'singleton' },
  { Reference: SyncService,       name: 'syncService',       scope: 'singleton' },
  { Reference: ApplicationRegistry, name: 'applicationRegistry', scope: 'singleton',
    properties: [{ name: 'applications', path: 'applications' }] },
  { Reference: SchemaValidator,   name: 'schemaValidator',   scope: 'singleton',
    properties: [{ name: 'applications', path: 'applications' }] },
  // CORS must be first — applies to all routes including 401 responses
  { Reference: CorsMiddlewareRegistrar, name: 'corsMiddlewareRegistrar', scope: 'singleton' },
  // Google auth middleware before AppSyncController
  { Reference: GoogleIdTokenMiddlewareRegistrar, name: 'googleIdTokenMiddlewareRegistrar', scope: 'singleton',
    properties: [{ name: 'googleClientId', path: 'auth.google.clientId' }] },
  { Reference: AppSyncController, name: 'appSyncController', scope: 'singleton' },
]);

const appCtx = new ApplicationContext({ contexts: [context], config });

// ── start ─────────────────────────────────────────────────────────────────────

async function main() {
  await appCtx.start();   // calls HonoAdapter.run() — binds TCP port 8081
  await appCtx.get('nosqlClient').ready();
  console.log('\n  jsmdma local POC server running on http://127.0.0.1:8081');
  console.log('  Routes: GET /health, POST /year-planner/sync');
  console.log('  Auth: Google OIDC ID token verification');
  console.log('  Storage: in-memory (data lost on restart)\n');
  console.log('  Start the SPA: npx http-server site/ -p 8080 (in year-planner repo)');
  console.log('  Press Ctrl+C to stop.\n');
}

main().catch((err) => {
  console.error('\nFailed to start:', err.message);
  console.error(err.stack);
  process.exit(1);
});
```

- [ ] **Step 2: Verify server starts**

```bash
cd /Users/craig/src/github/alt-javascript/jsmdma
GOOGLE_CLIENT_ID=test-placeholder node packages/example-auth/run-local.js &
sleep 2
curl -s http://127.0.0.1:8081/health
```

Expected output from curl: `{"status":"ok"}`

Kill the background process after checking: `kill %1`

- [ ] **Step 3: Verify CORS preflight response**

```bash
GOOGLE_CLIENT_ID=test-placeholder node packages/example-auth/run-local.js &
sleep 2
curl -s -X OPTIONS http://127.0.0.1:8081/year-planner/sync \
  -H "Origin: http://localhost:8080" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Authorization, Content-Type" \
  -v 2>&1 | grep -E "< Access-Control|HTTP/"
kill %1
```

Expected: `< Access-Control-Allow-Origin: http://localhost:8080` and `HTTP/1.1 200`

- [ ] **Step 4: Commit**

```bash
cd /Users/craig/src/github/alt-javascript/jsmdma
git add packages/example-auth/run-local.js
git commit -m "feat(example-auth): add run-local.js for Phase 12 local POC

HTTP server on 127.0.0.1:8081 with Google OIDC auth, CORS for
localhost:8080, in-memory jsnosqlc, year-planner application.
Bypasses jsmdma JWT auth layer — for local POC only."
```

---

## Task 7: End-to-end UAT

This task is manual — no code changes. Follow these steps to verify the full sync flow before proceeding to Phase 13.

### Pre-flight checks

- [ ] **Check 1: Confirm auth-config.js has a real Google client ID**

```bash
grep -n "clientId" /Users/craig/src/github/alt-html/year-planner/site/js/config/auth-config.js
```

Expected: a line like `clientId: '123456789-abc.apps.googleusercontent.com'` (not empty).

- [ ] **Check 2: Confirm Google Cloud Console has localhost:8080 as authorized origin**

In Google Cloud Console → Credentials → your OAuth 2.0 Client ID → Authorized JavaScript origins — confirm `http://localhost:8080` appears.

### Start the servers

- [ ] **Step 1: Start the local jsmdma server**

```bash
cd /Users/craig/src/github/alt-javascript/jsmdma
GOOGLE_CLIENT_ID=$(grep clientId /Users/craig/src/github/alt-html/year-planner/site/js/config/auth-config.js | sed "s/.*'\(.*\)'.*/\1/") \
  node packages/example-auth/run-local.js
```

Expected: `jsmdma local POC server running on http://127.0.0.1:8081`

- [ ] **Step 2: Start the SPA** (in a new terminal)

```bash
cd /Users/craig/src/github/alt-html/year-planner
npx http-server site/ -p 8080 --cors
```

Expected: `Available on: http://localhost:8080`

### UAT scenarios

- [ ] **UAT-1: Offline behaviour preserved**

Open `http://localhost:8080` in a browser WITHOUT signing in.

Expected: planner loads, days are editable, no error messages. Sign-in status shows as signed out. Offline-first preserved.

- [ ] **UAT-2: Google sign-in completes**

Click "Sign in" → "Sign in with Google".

Expected: if One Tap is shown — complete it. If not (likely on localhost) — a Google-branded button renders in the modal below the "Sign in with Google" label. Click it. The Google sign-in popup opens. Sign in with your Google account.

Expected after sign-in: auth status updates, user name or email shown, no errors in console.

- [ ] **UAT-3: Sync fires after edit**

After signing in, open browser DevTools → Network tab. Edit a day entry (change the title or description of any day). Wait up to 2 seconds for the sync debounce.

Expected: a `POST http://127.0.0.1:8081/year-planner/sync` request appears in the Network tab with:
- Status: 200
- Request body: `{ "collection": "planners", "clientClock": "...", "changes": [{ "key": "...", "doc": {...}, "fieldRevs": {...}, "baseClock": "..." }] }`
- Response body: `{ "serverClock": "...", "serverChanges": [...] }`

- [ ] **UAT-4: Cross-session sync**

In an incognito/private window, open `http://localhost:8080`.

Sign in with the same Google account.

Expected: the edited day entry from UAT-3 is visible — data was retrieved from the server.

- [ ] **UAT-5: localStorage sync state written**

After a successful sync, open DevTools → Application → Local Storage.

Expected keys present: `sync:{uuid}` (serverClock string), `base:{uuid}` (JSON object with days data).

### UAT acceptance sign-off

All 5 UAT checks must pass before proceeding to Phase 13 (jsmdma npm publish).

If UAT-3 fails with 401: the Google ID token may be malformed or the client ID in `run-local.js` doesn't match `auth-config.js`. Check both use identical values.

If UAT-3 fails with 400: inspect the request body in DevTools. Confirm `collection` is `"planners"` and `changes[0].key` is a UUID string (not undefined).

If UAT-4 shows no data: check DevTools console for sync errors in the incognito window. Confirm `sync:{uuid}` is populated after UAT-3 (the server needs data before the second session can pull it).

---

## Self-review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| SPA loads offline without signing in | UAT-1 |
| Google Sign-In popup completes | UAT-2 |
| Editing fires POST /year-planner/sync with correct payload | Tasks 1 + UAT-3 |
| Server returns serverClock + serverChanges | UAT-3 |
| Sync state keys update in localStorage | UAT-5 |
| Second browser session retrieves same data | UAT-4 |

**Protocol alignment:** `AppSyncController.sync()` reads `body.collection`, `body.clientClock`, `changes[].key`, `changes[].baseClock` — all four are now sent by the updated `SyncClient.js`.

**Auth alignment:** `GoogleIdTokenMiddlewareRegistrar` sets `c.set('user', { sub: 'google:' + claims.sub })`. `AppSyncController.sync()` reads `userPayload.sub` — it receives `'google:1234567890'` as the userId. Storage is namespaced as `google:1234567890:year-planner:planners`. This is a local POC userId — Phase 14 introduces a proper provider-decoupled userId via `AuthService`.

**One Tap fallback:** `renderButton` is called synchronously when `prompt()` is suppressed. The container div `#google-signin-button` is present in the DOM (added to `auth.html` fragment, rebuilt into `site/index.html`). The same `callback` from `initialize()` handles both flows.
