# S03: API Layer Modularisation and Fetch Migration — Research

**Date:** 2026-03-14

## Summary

S03 splits the monolithic 350-line `Api.js` (19 methods mixing sync, auth, profile, payment, and email concerns) into 3 focused service modules plus a shared utility module, and replaces all `superagent` HTTP calls with native `fetch`. The superagent CDN script tag and `window.request = superagent` global are removed.

The critical technical risk is fetch error semantics: superagent rejects on HTTP 4xx/5xx errors with `err.status`, while fetch resolves with `response.ok === false`. A shared `fetchJSON` helper that throws on non-OK responses preserves the existing `.catch(err => { if (err.status == ...) })` error handling pattern.

CDI still wires a single `Api` class. The split modules are internal implementation — `SyncApi`, `AuthApi`, `ProfileApi` are imported by `Api` and their methods delegated. S05 will update CDI wiring to register the sub-modules directly.

## Recommendation

**Approach: Internal split with Api facade + fetch migration**

1. Create `js/service/api-utils.js` — `fetchJSON(url, options)` helper that returns `response.json()` on success or throws error with `.status` on failure
2. Create `js/service/SyncApi.js` — `synchroniseToRemote()`, `synchroniseToLocal()` using `fetchJSON`
3. Create `js/service/AuthApi.js` — `register()`, `signin()`, `deleteRegistration()` using `fetchJSON`
4. Create `js/service/ProfileApi.js` — `setUsername()`, `setPassword()`, `setEmail()`, `setMobile()`, `sendVerificationEmail()`, `verifyEmailToken()`, `sendRecoverPasswordEmail()`, `sendRecoverUsernameEmail()`, `email()`, `squarePayment()`, `setDonation()` using `fetchJSON`
5. Refactor `Api.js` to import sub-modules and delegate — keeps CDI wiring unchanged
6. Remove superagent script tag from `.compose/fragments/head.html`
7. Remove `window.request = superagent;` from `Application.js`
8. Run `.compose/build.sh` to recompose `index.html`
9. Verify all 14 E2E tests pass

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| HTTP client | `fetch` (built-in) | Native, no CDN dependency, supports same-origin and CORS |
| Error status extraction | custom `fetchJSON` helper | Normalises fetch's non-throwing behaviour to match superagent's pattern |
| CDN SRI hash generation | `generate-sri.mjs` | Use if any CDN URL changes (not needed for removal) |

## Existing Code and Patterns

- `js/service/Api.js` — 350 lines, 19 methods. Constructor receives `model, storageLocal, storageRemote, i18n` via CDI. Uses `request` global (superagent). All methods follow pattern: `request.METHOD(url).send(data).set(headers).then(res => {...}).catch(err => { if (err.status == ...) ... })`.
- `js/Application.js` — `init()` sets `window.request = superagent;` on line 35. Must be removed.
- `.compose/fragments/head.html` — superagent CDN script tag on line 32-33. Must be removed.
- `js/vue/methods/auth.js` — calls `this.api.register()`, `this.api.signin()`. Unchanged.
- `js/vue/methods/lifecycle.js` — calls `this.api.synchroniseToLocal()`. Unchanged.
- `js/vue/methods/planner.js` — calls `this.api.synchroniseToRemote()`, `this.api.synchroniseToLocal()`. Unchanged.
- `js/vue/methods/entries.js` — calls `this.api.synchroniseToRemote()`, `this.api.synchroniseToLocal()`. Unchanged.

## Api Method Grouping

### SyncApi (2 methods)
- `synchroniseToRemote()` — POST to `/api/planner/{sessionId}` with cookies data
- `synchroniseToLocal(syncPrefs)` — GET `/api/planner/{sessionId}` with Bearer auth

### AuthApi (3 methods)
- `register(username, password, email, mobile)` — PUT `/api/planner`
- `signin(username, password, rememberme)` — GET `/api/planner` with Basic auth
- `deleteRegistration()` — DELETE `/api/planner/{sessionId}`

### ProfileApi (11 methods)
- `setUsername(username)` — POST `/api/profile/{uuid}/username`
- `setPassword(password, newpassword)` — POST `/api/profile/{uuid}/password`
- `setEmail(email)` — POST `/api/profile/{uuid}/email`
- `setMobile(mobile)` — POST `/api/profile/{uuid}/mobile`
- `sendVerificationEmail()` — POST `/api/verify/{uuid}`
- `verifyEmailToken(token, model)` — POST `/api/verify/email/{token}`
- `sendRecoverPasswordEmail(username)` — POST `/api/verify/{uuid}`
- `sendRecoverUsernameEmail(email)` — POST `/api/verify/{uuid}`
- `email(to, subject, bodyText)` — POST `/api/email`
- `squarePayment(nonce, idempotency_key)` — POST `/api/payment`
- `setDonation(receipt_url)` — POST `/api/profile/{uuid}/donation`

### Shared (2 helpers, stay on Api or move to api-utils)
- `modalErr(target, err)` — sets model.modalErrorTarget[target]. Used by Api methods and template-bound methods.
- `getData()` — unused/incomplete. Delete.

## Fetch vs Superagent Semantics

| Aspect | superagent | fetch |
|--------|-----------|-------|
| HTTP errors | Rejects promise with `err.status` | Resolves with `response.ok === false` |
| Response body | `response.body` (auto-parsed JSON) | `response.json()` (returns Promise) |
| Basic auth | `.auth(user, pass)` | `headers: {'Authorization': 'Basic ' + btoa(user+':'+pass)}` |
| Bearer auth | `.set('Authorization', 'Bearer '+token)` | `headers: {'Authorization': 'Bearer '+token}` |
| Send JSON | `.send(obj)` (auto-serialises) | `body: JSON.stringify(obj), headers: {'Content-Type': 'application/json'}` |

### fetchJSON helper pattern
```js
async function fetchJSON(url, options = {}) {
    const response = await fetch(url, {
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', ...options.headers },
        ...options,
    });
    if (!response.ok) {
        const err = new Error(`HTTP ${response.status}`);
        err.status = response.status;
        throw err;
    }
    const text = await response.text();
    return text ? JSON.parse(text) : {};
}
```

## Constraints

- **No build step** — Pure ES6 modules. Sub-modules must use `export default class` or `export function`.
- **CDI wiring unchanged in S03** — Api class stays registered in contexts.js. Sub-modules are internal to Api.
- **Template-bound Api methods** — `setUsername`, `setPassword`, `setEmail`, `sendVerificationEmail`, `sendRecoverPasswordEmail`, `sendRecoverUsernameEmail` are called from templates without `api.` prefix. These are likely already broken at runtime. S03 should NOT fix template bindings — that's deferred to S04/S05.
- **Playwright route intercept** — The sync-error test uses `page.route()` to intercept `/api/planner/**`. This works with both superagent (XHR) and fetch equally.
- **`window.request` removal** — After removing `window.request = superagent`, no code should reference the `request` global.

## Common Pitfalls

- **fetch doesn't reject on HTTP errors** — The `fetchJSON` helper MUST check `response.ok` and throw, or all error handling breaks silently.
- **Response body timing** — `response.json()` returns a Promise, not a value. Must `await` or `.then()`.
- **Empty response bodies** — Some API responses (204 No Content) have no body. Use `response.text()` then conditionally parse.
- **superagent `request` global leaking** — Must verify no other file references the `request` global after removal.

## Open Risks

- **Negligible** — fetch is a standard API. The semantic difference is well-understood and handled by the `fetchJSON` wrapper.

## Sources

- Api.js source (350 lines, 19 methods)
- sync-error.spec.js test (intercepts API calls, expects error alert)
- MDN fetch API documentation (standard)
