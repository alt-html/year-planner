# External Integrations

**Analysis Date:** 2026-03-11

## APIs & External Services

**Backend API:**
- Custom Year Planner API - Manages user registration, authentication, and planner synchronization
  - Base URL: `http://127.0.0.1:8081/` (configurable via `js/config/config.js`)
  - Endpoints documented in `js/service/Api.js`:
    - `PUT /api/planner` - Register new user
    - `GET /api/planner` - Sign in (basic auth)
    - `POST /api/planner/{uid}` - Synchronize planner to remote
    - `GET /api/planner/{uid}` - Fetch planner from remote
    - `DELETE /api/planner/{uid}` - Delete user registration
    - `POST /api/profile/{uuid}/username` - Update username
    - `POST /api/profile/{uuid}/password` - Update password
    - `POST /api/profile/{uuid}/email` - Update email
    - `POST /api/profile/{uuid}/mobile` - Update mobile
    - `POST /api/profile/{uuid}/donation` - Record donation
    - `POST /api/payment` - Process payment
    - `POST /api/verify/{uuid}` - Send verification email
    - `POST /api/verify/email/{token}` - Verify email token
    - `POST /api/email` - Send email
  - SDK/Client: SuperAgent (HTTP library)
  - Auth: Basic auth for sign-in, Bearer token (`{uuid}.{token}`) for authenticated endpoints
  - Implemented in: `js/service/Api.js`

**Font Loading:**
- Google Fonts - Roboto font family (300, 400, 600 weights)
  - URL: `https://fonts.googleapis.com/css?family=Roboto%3A300%2C400%2C600`

**Icon Library:**
- Font Awesome Kit - Icon library (kit id: 10808f8e76)
  - URL: `https://kit.fontawesome.com/10808f8e76.js`

## Data Storage

**Databases:**
- Not applicable - Frontend application uses client-side storage only
- Unregistered users: All data stored locally in browser cookies/localStorage
- Registered users: Data synchronized to backend API server storage (via custom API endpoints)

**Client-side Storage:**
- Browser Cookies - Primary storage mechanism for persistence
  - Client: `@alt-javascript/cookies` service
  - Compression: LZ-String (data compressed to Base64)
  - Location: `js/service/StorageLocal.js`
  - Storage keys:
    - `'0'` - Compressed local identities array
    - `{uid}` - Compressed user preferences
    - `{uid}-{year}-{type}` - Compressed planner data by year
  - SameSite policy: `Strict` (default) or `None; Secure` (localhost)

**File Storage:**
- Local filesystem only - No external file storage service
- Shared planners exported as URL parameters with compressed payload in `share` parameter

**Caching:**
- No explicit caching service
- Browser HTTP caching via Cache-Control headers on CDN assets

## Authentication & Identity

**Auth Provider:**
- Custom - User registration and authentication handled by backend API
- Implementation: Username/password registration and basic HTTP authentication
- Session management: Bearer token stored in cookies (format: `{uuid}.{token}`)
- Related files: `js/service/Api.js` (register, signin methods), `js/service/StorageLocal.js` (session management)

**Identity Management:**
- Local identities stored as array of identity objects: `[uid, userAgent, timestamp1, timestamp2]`
- Unique user ID (uid) generated from timestamp or provided via URL parameter
- UUID (universally unique) assigned by backend on registration
- Sessions extend automatically on API calls via `extendLocalSession()`

## Monitoring & Observability

**Error Tracking:**
- Not detected - No external error tracking service integrated

**Logs:**
- @alt-javascript/logger - In-browser logging framework
  - Configuration: `js/config/config.js`
  - Default level: `warn` at root, `info` at configured modules
  - Formatters: Text format (configurable)
  - Log categories configured in `LoggerCategoryCache`
  - No external log aggregation

## CI/CD & Deployment

**Hosting:**
- Primary: Amazon CloudFront (CDN) - `https://d1uamxeylh4qir.cloudfront.net/`
- Development: Docker containers via Skaffold
- Kubernetes: Minikube support with port forwarding (local:8080 → pod:80)

**Deployment Pipeline:**
- Skaffold (v2beta24) orchestrates local development and Kubernetes deployment
- Profiles:
  - `local` - Activated on Minikube context
  - `node` - Node.js development server with http-server
- Container images: Nginx 1.16.0-alpine (production) or Node 16-alpine (development)
- Port forwarding: Local port 8080 → Pod port 80 (HTTP)

**CI Pipeline:**
- Not detected - No integrated CI/CD configuration (GitHub Actions, GitLab CI, etc.)

## Environment Configuration

**Required env vars:**
- No environment variables in use
- All configuration through `js/config/config.js` static file
- Backend API URL is hardcoded or configured via config file

**Secrets location:**
- No secret management detected
- Square Payment Form Application ID embedded in `js/service/SquareUp.js` (hardcoded: `sq0idp-sO7EOg5ctbH8jq-X_o6ytw`)
- Production Square location ID embedded in `js/service/Api.js` (hardcoded: `L15E6C1JAT7BD`)

## Webhooks & Callbacks

**Incoming:**
- Email verification callbacks - Token-based verification flow
  - Endpoint: `/api/verify/email/{token}` (verified via `verifyEmailToken()`)
  - Usage: Email verification during registration or profile changes

**Outgoing:**
- Email notifications - Sent by backend API
  - Triggers: Registration verification, password recovery, username recovery, donation confirmation
  - Subjects and body text composed in `js/service/Api.js`
  - Recipient: User's email address
- Payment receipts - Square payment confirmation
  - Receipt URL stored and optionally sent via email
  - Related to donation tracking in user profile

## Payment Processing

**Provider:**
- Square (Live environment)
  - Application ID: `sq0idp-sO7EOg5ctbH8jq-X_o6ytw` (embedded in `js/service/SquareUp.js`)
  - Location ID: `L15E6C1JAT7BD` (embedded in `js/service/Api.js`)
  - Form: SqPaymentForm v2 (legacy, sourced from `https://js.squareup.com/v2/paymentform`)
  - Flow: Nonce generation → Backend payment API call → Receipt URL capture
  - Implementation: `js/service/SquareUp.js` (form init, nonce handling), `js/service/Api.js` (squarePayment, setDonation methods)

## Third-party CDNs

**Content Delivery:**
- jsDelivr - Primary CDN for library distribution
  - Libraries: Vue.js, Luxon, Lodash-ES, LZ-String, UUID, @alt-javascript/* modules
- unpkg - Vue-i18n CDN source
- Polyfill.io - Browser polyfill service
- cdnjs - Popper.js CDN
- stackpath/Bootstrap CDN - Bootstrap CSS and JS
- Google Fonts CDN - Roboto font family
- Font Awesome CDN - Icon library via kit

---

*Integration audit: 2026-03-11*
