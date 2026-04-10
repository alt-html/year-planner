# Year Planner — Deployment to Completion

**Date:** 2026-04-10
**Status:** Approved for planning

## Goal

Take Year Planner from a locally-wired sync POC to a fully deployed, publicly accessible PWA with live Google sign-in and bidirectional HLC sync against a cloud backend. Backend is designed as a reusable jsmdma instance that can host additional SPA backends in future.

---

## Stack (locked)

| Layer | Choice | Rationale |
|---|---|---|
| SPA hosting | GitHub Pages (`craigparra.github.io/year-planner`) | Clean URL, zero-ops, push-to-deploy |
| Backend HTTP | AWS API Gateway HTTP API | Battle-tested SAM templates, CORS in one place, 1M req/month free tier |
| Compute | AWS Lambda (Node 20) | 200–600ms cold start invisible for fire-and-forget sync; full Node runtime, no Workers constraints |
| Storage | AWS DynamoDB (`jsmdma-apps` table, PAY_PER_REQUEST) | jsnosqlc-dynamodb adapter already written and published |
| Auth | Google OAuth (OIDC ID token, popup flow) | Fully client-side token delivery; backend verifies against Google JWKS; no server-side redirect needed |
| IaC | AWS SAM (`template.yaml`) | Minimal, declarative, `sam deploy` deployable from GitHub Actions |
| CI/CD | GitHub Actions | Two workflows: SPA → GitHub Pages, backend → SAM deploy |

---

## Repositories

### `alt-html/year-planner` (existing)

Changes required:
- `site/js/config/auth-config.js` — populate `google.clientId` (from Google Cloud Console)
- `site/js/config/api-config.js` — new file; exports `syncBaseUrl` (localhost in dev, API GW URL in prod)
- `site/js/service/Api.js` — read sync URL from `api-config.js` instead of hardcoded value
- `.github/workflows/pages.yml` — deploy `site/` to GitHub Pages on push to `main`

No structural changes to the SPA. Offline-first behaviour is preserved — auth and sync remain additive.

### `alt-javascript/jsmdma-apps` (new)

The dedicated jsmdma instance. Hosts `year-planner` as its first configured application. Future SPAs register in `ApplicationRegistry` config — no code changes needed to add a new app.

```
jsmdma-apps/
├── template.yaml               # SAM: API GW HTTP API + Lambda + DynamoDB table
├── package.json                # deps: @alt-javascript/jsmdma-* (from npm, post-publish)
├── src/
│   ├── app.js                  # Lambda handler entry; Hono + boot-hono CDI bootstrap
│   ├── contexts.js             # CDI registrations: SyncRepository, AuthService, DynamoClient
│   └── config/
│       └── default.json        # CDI config: table name, Google issuer, app registry
├── .github/
│   └── workflows/
│       └── deploy.yml          # sam build && sam deploy on push to main
└── README.md
```

---

## SAM Template (`template.yaml`)

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: jsmdma-apps — multi-app sync backend

Parameters:
  GoogleClientId:
    Type: String
    Description: Google OAuth 2.0 client ID for token verification

Globals:
  Function:
    Runtime: nodejs20.x
    Timeout: 10
    MemorySize: 256

Resources:

  JsmdmaAppsApi:
    Type: AWS::Serverless::HttpApi
    Properties:
      CorsConfiguration:
        AllowOrigins:
          - https://craigparra.github.io
          - http://localhost:8080
        AllowMethods:
          - POST
          - DELETE
          - OPTIONS
        AllowHeaders:
          - Authorization
          - Content-Type
        MaxAge: 300

  JsmdmaAppsFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: src/app.handler
      Environment:
        Variables:
          GOOGLE_CLIENT_ID: !Ref GoogleClientId
          DYNAMODB_TABLE: jsmdma-apps
          NODE_ENV: production
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref JsmdmaAppsTable
      Events:
        ApiProxy:
          Type: HttpApi
          Properties:
            ApiId: !Ref JsmdmaAppsApi
            Path: /{proxy+}
            Method: ANY

  JsmdmaAppsTable:
    Type: AWS::DynamoDB::Table
    DeletionPolicy: Retain
    Properties:
      TableName: jsmdma-apps
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: pk
          AttributeType: S
        - AttributeName: sk
          AttributeType: S
      KeySchema:
        - AttributeName: pk
          KeyType: HASH
        - AttributeName: sk
          KeyType: RANGE

Outputs:
  ApiUrl:
    Description: API Gateway endpoint — set this as syncBaseUrl in year-planner api-config.js
    Value: !Sub 'https://${JsmdmaAppsApi}.execute-api.${AWS::Region}.amazonaws.com'
```

---

## DynamoDB Table Design

**Table:** `jsmdma-apps` (single table, all apps, PAY_PER_REQUEST)

| Key | Pattern | Example |
|---|---|---|
| `pk` (partition) | `{app}#{userId}` | `year-planner#usr_a1b2c3d4` |
| `sk` (sort) | `{docId}` | `planner-uuid-here` |
| `doc` | JSON object — the planner document | `{ "meta": {...}, "days": {...} }` |
| `fieldRevs` | JSON object — dot-path HLC stamps | `{ "days.2026-04-10.tl": "00001-..." }` |
| `serverClock` | HLC string | `00001a2b3c4d-000001-abcd1234` |
| `updatedAt` | ISO 8601 | `2026-04-10T17:00:00.000Z` |

The `DeletionPolicy: Retain` on the table prevents accidental data loss on stack deletion.

**userId is provider-decoupled.** The `userId` in the pk is an internal identifier assigned by `AuthService` on first login — not the OIDC subject claim. The AuthService maps provider identity (`google:1234567890`, `apple:xyz`, etc.) to a stable internal `userId` (e.g. `usr_a1b2c3d4`). This allows a user to link or switch auth providers without losing their data — the pk never changes even if the provider does.

> **Verify during Phase 14:** The `pk`/`sk` key names above are assumed based on common jsnosqlc patterns. Confirm the actual attribute names expected by `jsnosqlc-dynamodb` before provisioning the table — check `DynamoCollection.js` in the jsnoslqc repo. The key schema in `template.yaml` must match exactly.

---

## Google OAuth Setup

**One-time steps (Google Cloud Console):**

1. Create project (or reuse existing) → APIs & Services → Credentials
2. Create **OAuth 2.0 Client ID** → type: **Web application**
3. **Authorized JavaScript origins:**
   - `http://localhost:8080` (local POC)
   - `https://craigparra.github.io` (production)
4. Copy the **Client ID** — it goes in two places:
   - `site/js/config/auth-config.js` → `google.clientId` (SPA, client-side)
   - GitHub Actions secret `GOOGLE_CLIENT_ID` (backend, token verification)

No client secret needed in the SPA. The backend verifies ID tokens using Google's public JWKS endpoint — no secret required there either.

---

## GitHub Actions Workflows

### SPA — `.github/workflows/pages.yml` (in `alt-html/year-planner`)

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
permissions:
  pages: write
  id-token: write
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deploy.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: site/
      - id: deploy
        uses: actions/deploy-pages@v4
```

### Backend — `.github/workflows/deploy.yml` (in `alt-javascript/jsmdma-apps`)

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - uses: aws-actions/setup-sam@v2
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-southeast-2
      - run: npm ci
      - run: sam build
      - run: |
          sam deploy \
            --stack-name jsmdma-apps \
            --no-confirm-changeset \
            --no-fail-on-empty-changeset \
            --capabilities CAPABILITY_IAM \
            --parameter-overrides GoogleClientId=${{ secrets.GOOGLE_CLIENT_ID }}
```

> **Note:** After the first successful deploy, commit the generated `samconfig.toml` to the repo. Subsequent runs will use it and the explicit flags above become optional.
```

**GitHub secrets required** (in `jsmdma-apps` repo settings):
- `AWS_ACCESS_KEY_ID` — IAM user with CloudFormation + Lambda + DynamoDB + API GW permissions
- `AWS_SECRET_ACCESS_KEY`
- `GOOGLE_CLIENT_ID`

---

## Work Sequence

### Phase 12 — Local POC (year-planner repo)

**Goal:** End-to-end sync working locally with real Google auth. UAT passes before any deployment.

Steps:
1. Run local jsmdma Hono server (from `jsmdma/packages/example-auth/run.js` or a minimal equivalent) using in-memory jsnosqlc store
2. Configure Google OAuth client ID in `site/js/config/auth-config.js`
3. Add `site/js/config/api-config.js` pointing at `http://localhost:{port}`
4. Wire `Api.js` to read sync URL from `api-config.js`
5. Run SPA: `npx http-server site/ -p 8080`
6. Sign in with Google → edit day entry → verify POST /year-planner/sync fires with HLC payload
7. Open second browser/incognito → sign in → verify data pulled from server

**UAT acceptance criteria:**
- SPA loads and works offline without signing in (offline-first preserved)
- Google Sign-In popup completes successfully
- Editing a day entry fires `POST /year-planner/sync` with `{ clientClock, deviceId, changes[] }`
- Server returns `{ serverClock, serverChanges }` and sync state keys update in localStorage
- Second browser session retrieves same data after sign-in

### Phase 13 — jsmdma publish (jsmdma repo)

**Goal:** All 6 packages published to npm under `@alt-javascript` org in lock-step. Backend can install from npm.

All packages publish together as a single versioned release:

```bash
npm publish --workspaces --access public
```

Packages: `jsmdma-core`, `jsmdma-auth-core`, `jsmdma-server`, `jsmdma-auth-server`, `jsmdma-hono`, `jsmdma-auth-hono`.

The workspace interdependencies use `"*"` version ranges, so all packages must be published at the same version before any consumer can install cleanly.

### Phase 14 — Backend instance project (new jsmdma-apps repo)

**Goal:** `alt-javascript/jsmdma-apps` deployed to AWS. DynamoDB table provisioned. API GW URL known.

Steps:
1. Create `alt-javascript/jsmdma-apps` repo
2. Write `package.json` with `@alt-javascript/jsmdma-*` dependencies (from npm)
3. Write `src/app.js` — Lambda handler, Hono + CDI bootstrap using `boot-hono`
4. Write `src/contexts.js` — wire SyncRepository, AuthService (Google), DynamoClient
5. Write `src/config/default.json` — app registry entry for `year-planner`, table name, Google issuer URL
6. Write `template.yaml` (SAM — see above)
7. Write `.github/workflows/deploy.yml`
8. Add GitHub secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `GOOGLE_CLIENT_ID`
9. Push to `main` → GitHub Actions runs `sam build && sam deploy`
10. Capture `ApiUrl` output from CloudFormation stack

### Phase 15 — SPA deployment (year-planner repo)

**Goal:** Year Planner live at `craigparra.github.io/year-planner`, syncing to deployed backend.

Steps:
1. Update `site/js/config/api-config.js` — set `syncBaseUrl` to Phase 14 API GW URL
2. Update Google OAuth client — add `https://craigparra.github.io` as authorized origin
3. Write `.github/workflows/pages.yml` (see above)
4. Push to `main` → GitHub Actions deploys `site/` to GitHub Pages
5. Smoke test: load `https://craigparra.github.io/year-planner`, sign in, edit, verify sync

---

## jsmdma Ergonomics Review Checklist (Phase 13 prerequisite)

Before publishing, review each package for:
- Constructor parameter names match CDI registration names (camelCase class name rule)
- All public methods documented with JSDoc
- Error messages are user-actionable (not internal stack references)
- No `console.log` left in production paths
- `package.json` `exports` field correctly maps to `index.js`
- `engines.node` set to `>=20` across all packages

---

## Open Questions (resolved)

| Question | Answer |
|---|---|
| SPA hosting | GitHub Pages |
| Backend HTTP trigger | API Gateway HTTP API |
| Storage | DynamoDB, single table `jsmdma-apps` |
| Auth provider | Google OAuth (OIDC popup) |
| Backend repo name | `alt-javascript/jsmdma-apps` |
| IaC tooling | AWS SAM + GitHub Actions |
| Mock auth strategy | Real Google auth from day one, localhost origin |
| jsmdma publish timing | After local POC UAT passes |
