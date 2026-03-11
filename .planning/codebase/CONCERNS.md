# CONCERNS.md — Technical Debt & Known Issues

## Tech Debt

### Monolithic Files
- `js/service/Api.js` (475 lines) handles all backend concerns: auth, profile, planner sync, donations. Should be split into domain-focused clients.
- `index.html` (761 lines) contains all Vue templates inline — hard to navigate and maintain.
- `js/vue/controller.js` (302 lines) mixes planner management, entry editing, navigation, and auth UI concerns.

### Unsafe Data Structures
- Planner data indexed by numeric timestamp strings (e.g. `"1234567890"`). Index collisions are possible at second-precision granularity across shared planners.
- No schema validation on data read from cookies/localStorage — deserialization failures are silent.

### No Build Tooling
- No linter, formatter, or type checker. Code style is inconsistent across files (semicolons, quote styles).
- All libraries loaded from CDN with no Subresource Integrity (SRI) hashes — supply chain risk if CDN is compromised.
- Library versions not pinned beyond CDN URL — unexpected breaking changes possible.

## Security Issues

### Authentication
- Passwords handled as plain strings in memory and passed directly in POST body. No client-side hashing.
- JWT/session tokens stored in cookies without explicit HttpOnly or Secure flags enforced at the JS layer (relies entirely on server configuration).
- Auth tokens not cleared from memory on logout — only cookie/storage cleared.

### XSS Risk
- User-supplied diary entry text rendered via Vue's v-html or direct interpolation in some places. If not consistently escaped, XSS is possible.
- urlparam.js uses window.location.href with a regex — decoded URL parameters passed into the app without sanitization.

### Hardcoded / Exposed Credentials
- Square payment form integration in js/service/SquareUp.js may reference an application ID in client-side code. Square application IDs are semi-public but should be environment-configurable.

### CDN Dependency Trust
- No SRI hashes on CDN-loaded scripts (Vue, Bootstrap, Luxon, Superagent, etc.) in index.html. A compromised CDN could inject malicious code.

## Performance Concerns

### Cookie Storage Limits
- Cookie storage is limited to ~4KB per cookie and ~20 cookies per domain. Multi-planner users with large planners may silently lose data when limits are exceeded.
- Cookie parsing on every storage read is O(n) over all cookies with no caching.

### No Code Splitting
- All JS modules loaded upfront. For a vanilla ES6 project this is acceptable, but CDN round-trips for 8+ libraries add latency on first load.

## Fragile Areas

### CDI Initialization Order
- js/main.js bootstraps the CDI container synchronously. If any bound class fails to instantiate (missing dependency, config error), the entire app silently fails to mount with no error boundary.

### Date/Time Handling
- Uses Luxon for date math, but locale-specific week start (Sunday vs Monday) and timezone edge cases are not thoroughly covered. Year boundary navigation may have off-by-one errors.

### State Synchronization
- Remote sync (StorageRemote) is manual (user-triggered). No conflict resolution if the same planner is edited on two devices between syncs — last-write-wins with no merge.

### Missing getCookie Reference
- Reported missing getCookie reference in one code path — may cause a runtime error in specific flows.

## Missing Infrastructure

- No error boundaries — unhandled promise rejections in Vue methods surface as silent failures
- No input validation — diary entry text length, username format, email format validated only server-side
- No offline detection — network errors during sync not clearly communicated to user
- No automated tests — see TESTING.md
- No CI/CD pipeline — deployments are manual Docker builds

## Dependencies at Risk

| Dependency | Concern |
|---|---|
| Square SqPaymentForm | Legacy API; Square has moved to Web Payments SDK |
| Superagent | Loaded from CDN without version pinning |
| document.execCommand | Deprecated in modern browsers; used for clipboard operations |
| Bootstrap 4 | EOL — Bootstrap 5 is current |
