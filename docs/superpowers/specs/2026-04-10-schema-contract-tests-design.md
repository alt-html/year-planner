# Year Planner — Schema Contract Test Suite — Design Spec

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** A TDD test suite that proves the year-planner client never sends invalid data to the jsmdma sync server, and that all UI state round-trips correctly through the backend schema. Tests are written first; they fail on the current codebase; they pass once fixes and the auth/identity refactor are complete.

**Architecture:** Playwright E2E tests intercept outgoing sync POST requests, capture the payload, and assert it against the backend JSON schema. No mock server needed for schema validation — the schema is imported directly into the test. A subset of tests also run with a live local server to verify full round-trip correctness.

**Tech Stack:** Playwright, AJV (JSON Schema validator), `@alt-javascript/jsmdma` server schemas (`planner.json`, `preferences.json`), existing `.tests/` infrastructure.

**Steering directive:** These tests guard the contract between year-planner and the jsmdma server schema. Any failure is a client-side bug; the schema is the source of truth.

---

## What We Are Testing

The backend schema (`planner.json`) defines:

| Field | Type | Constraints | Client risk |
|-------|------|-------------|-------------|
| `meta.name` | string | minLength 1, maxLength 64 | Could be empty string |
| `meta.year` | integer | 1900–2100 | Could be string or float |
| `meta.lang` | string | maxLength 10 | Fine |
| `meta.theme` | string | (none) | Fine |
| `meta.dark` | boolean | (none) | Could be 0/1 instead of boolean |
| `meta.uid` | any | (none) | Fine — any type accepted |
| `meta.created` | string | (none) | Fine |
| `days` | object | sparse map, ISO date keys | Key format must match `^[0-9]{4}-[0-9]{2}-[0-9]{2}$` |
| `days.*.tp` | integer | 0–9 | **KNOWN BUG: sent as empty string** |
| `days.*.tl` | string | maxLength 32 | Could overflow |
| `days.*.col` | integer | 0–8 | **KNOWN BUG: sent as empty string** |
| `days.*.notes` | string | maxLength 4096 | Could overflow |
| `days.*.emoji` | string | maxLength 8 | Could overflow |
| `additionalProperties` | false | (strict) | Any extra field causes 400 |

---

## Test File Structure

```
.tests/e2e/
  schema-contract/
    day-entry-schema.spec.js       — All day field types and constraints
    meta-schema.spec.js            — All meta field types
    preferences-schema.spec.js     — Preferences collection document
  round-trip/
    theme-dark-roundtrip.spec.js   — Theme + dark mode persist and sync
    multipler-planner-roundtrip.spec.js — Create/switch/delete planners
    new-device-adoption.spec.js    — Fresh sign-in, adopt last-active planner
    signout-wipe.spec.js           — Sign-out clears all state
```

---

## Schema Validation Helper

All schema tests use a shared helper that:
1. Intercepts the outgoing `POST /year-planner/sync` request
2. Extracts `changes[0].doc` from the payload
3. Validates it against AJV + `planner.json`

```js
// .tests/helpers/schema-validator.js
import Ajv from 'ajv';
import plannerSchema from '../../path/to/jsmdma/packages/server/schemas/planner.json' assert { type: 'json' };

const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(plannerSchema);

export function expectValidPlanner(doc) {
    const valid = validate(doc);
    if (!valid) {
        throw new Error(
            'Schema validation failed:\n' +
            validate.errors.map(e => `  ${e.instancePath} ${e.message}`).join('\n')
        );
    }
}

export async function captureAndValidateSyncPayload(page) {
    let captured = null;
    await page.route('**/year-planner/sync', async route => {
        const body = JSON.parse(route.request().postData());
        captured = body.changes?.[0]?.doc ?? null;
        await route.continue();
    });
    return () => {
        if (!captured) throw new Error('No sync request was captured');
        expectValidPlanner(captured);
        return captured;
    };
}
```

---

## Test Specs

### `day-entry-schema.spec.js`

Tests every combination of day entry field types that the UI can produce.

```
describe('Day entry schema contract', () => {

  test('tp field: entry type 0 (none) sends integer 0, not empty string')
    → open calendar, click a day, leave type as default, save
    → capture sync payload
    → assert doc.days['2026-XX-XX'].tp === 0 (integer)
    → assert schema valid

  test('tp field: entry type 1 (reminder) sends integer 1')
    → select type "reminder", save
    → assert doc.days['...'].tp === 1 (integer)

  test('tp field: all types 0-6 send valid integers')
    → for each type in [0,1,2,3,4,5,6]: set type, save, capture, assert integer

  test('col field: colour 0 (none) sends integer 0, not empty string')
    → leave colour default, save
    → assert doc.days['...'].col === 0 (integer)

  test('col field: all colours 0-8 send valid integers')
    → for each col in [0,1,2,3,4,5,6,7,8]: set colour, save, capture, assert integer

  test('tl field: tagline sends string within maxLength 32')
    → enter "Test entry", save
    → assert typeof doc.days['...'].tl === 'string'
    → assert doc.days['...'].tl.length <= 32

  test('notes field: sends string within maxLength 4096')
    → enter notes text, save
    → assert typeof doc.days['...'].notes === 'string'

  test('emoji field: sends string within maxLength 8')
    → enter emoji, save
    → assert typeof doc.days['...'].emoji === 'string'

  test('empty day entry is NOT included in days map')
    → clear all fields for a day, save
    → assert no key for that date in doc.days

  test('additionalProperties: no extra fields on day entry')
    → save any entry
    → assert Object.keys(doc.days['...']).every(k => ['tp','tl','col','notes','emoji'].includes(k))

  test('ISO date key format: all keys match YYYY-MM-DD')
    → enter entries for multiple dates, save
    → assert all keys in doc.days match /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/
})
```

### `meta-schema.spec.js`

```
describe('Meta field schema contract', () => {

  test('meta.year is an integer, not a string')
    → sync any planner
    → assert Number.isInteger(doc.meta.year)
    → assert doc.meta.year >= 1900 && doc.meta.year <= 2100

  test('meta.name is a non-empty string within 64 chars')
    → assert typeof doc.meta.name === 'string'
    → assert doc.meta.name.length >= 1

  test('meta.dark is a boolean, not 0/1')
    → toggle dark mode, sync
    → assert typeof doc.meta.dark === 'boolean'

  test('meta.theme is a string')
    → switch theme, sync
    → assert typeof doc.meta.theme === 'string'

  test('meta.lang is a string within 10 chars')
    → assert typeof doc.meta.lang === 'string'
    → assert doc.meta.lang.length <= 10

  test('no additionalProperties in meta')
    → assert Object.keys(doc.meta).every(k =>
        ['name','year','lang','theme','dark','uid','created'].includes(k))
})
```

### `preferences-schema.spec.js`

```
describe('Preferences collection schema contract', () => {

  test('preferences sync document has correct key format: <uuid>:year-planner')
    → sign in, change theme, trigger preferences sync
    → capture /year-planner/sync for preferences collection
    → assert changes[0].key matches /^[0-9a-f-]{36}:year-planner$/

  test('preferences doc contains theme, dark, lang as correct types')
    → assert typeof doc.theme === 'string'
    → assert typeof doc.dark === 'boolean'
    → assert typeof doc.lang === 'string'
})
```

### `theme-dark-roundtrip.spec.js`

```
describe('Theme and dark mode round-trip', () => {

  test('switching to dark mode: syncs, reloads, stays dark')
    → toggle dark mode
    → assert body has class yp-dark
    → assert sync payload doc.meta.dark === true
    → reload page
    → assert body still has class yp-dark (localStorage restore)

  test('switching theme "ink" → "crisp": syncs, reloads, theme persists')
    → switch to crisp theme
    → assert sync payload doc.meta.theme === 'crisp'
    → reload
    → assert body has data-theme="crisp"

  test('dark mode preference survives sign-out and re-sign-in')
    → enable dark mode, sign out
    → assert dark mode preference wiped (body loses yp-dark)
    → sign in
    → assert dark mode restored from remote preferences sync
})
```

### `multipler-planner-roundtrip.spec.js`

```
describe('Multi-planner round-trip', () => {

  test('create second planner: both appear in switcher, both produce valid sync payloads')
    → create new planner "Holiday 2026"
    → assert two planners in switcher
    → add entry to new planner, save
    → capture sync payload for new planner
    → assert schema valid
    → assert payload is for the new planner UUID (not the first)

  test('switch planner: correct planner data shown')
    → switch to first planner
    → assert first planner entry visible
    → switch to second planner
    → assert second planner entry visible

  test('delete planner: switches to remaining planner, deleted planner sync state wiped')
    → delete second planner
    → assert only one planner in switcher
    → assert no localStorage keys for deleted planner UUID

  test('each planner UUID is a valid UUID (not a timestamp)')
    → for each planner in switcher: get UUID from localStorage
    → assert UUID matches /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
})
```

### `new-device-adoption.spec.js`

```
describe('New-device sign-in planner adoption', () => {

  test('sign in with no local planners: remote planner adopted as active')
    → seed remote server with planner for test user (year=currentYear, some entries)
    → clear localStorage completely
    → sign in
    → assert planner entries visible in calendar
    → assert model.uid is uuid from jwt.sub

  test('multiple remote planners same year: highest _rev adopted')
    → seed server with two planners for same year, different _rev values
    → clear localStorage, sign in
    → assert the planner with the higher _rev is shown

  test('anon planner with data + sign in: both slots in switcher')
    → enter entries in anon mode
    → sign in (remote has existing planner)
    → assert two planners in switcher (anon planner + remote planner)
})
```

### `signout-wipe.spec.js`

```
describe('Sign-out full wipe', () => {

  test('sign-out wipes all planner localStorage keys')
    → sign in, create entries, sync
    → sign out
    → assert localStorage has no keys matching: plnr:*, rev:*, base:*, sync:*, prefs:*, ids, auth_token, auth_provider, auth_time, anon_uid
    → assert sign-in modal visible

  test('sign-out then new visit: fresh anon UUID, empty calendar, modal shown')
    → sign out
    → reload page
    → assert calendar is empty
    → assert sign-in modal shown
    → assert new anon_uid in localStorage is a UUID (not the previous one)

  test('sign-out does not leave data from previous session accessible')
    → sign in as user A, add entries
    → sign out
    → sign in as user B (different account)
    → assert user A entries NOT visible
})
```

---

## Test Infrastructure Notes

### AJV import in Playwright
Install AJV in `.tests/`:
```json
// .tests/package.json — add dependency
"ajv": "^8.17.1"
```

### Schema path
The schema is imported directly from jsmdma:
```js
import plannerSchema from '../../../../../../jsmdma/packages/server/schemas/planner.json'
    assert { type: 'json' };
```

### Live server requirement
`new-device-adoption.spec.js` and `signout-wipe.spec.js` (sign-in with remote assertions) require both the local HTTP server AND the jsmdma sync server running. Mark these tests with `@live` tag and run separately:
```
npx playwright test --grep @live
```

Offline schema validation tests (schema-contract/) run with CDN route interception as per existing test infrastructure — no live server needed.

### Seed data helper

`testToken(userId)` produces a signed HS256 JWT matching jsmdma's `JwtSession` format, using the test server's JWT secret (read from `.env.test` or a fixed test secret `'test-secret'` configured in the local server).

```js
// .tests/helpers/seed-server.js
import { SignJWT } from 'jose';

const TEST_JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
const HLC_ZERO = '0000000000000-000000-00000000';

async function testToken(userId) {
    const secret = new TextEncoder().encode(TEST_JWT_SECRET);
    const now = Math.floor(Date.now() / 1000);
    return new SignJWT({ sub: userId, providers: ['test'], email: 'test@example.com', iat_session: now })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt(now)
        .sign(secret);
}

export async function seedPlanner(userId, planner) {
    const token = await testToken(userId);
    const res = await fetch('http://127.0.0.1:8081/year-planner/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
            collection: 'planners',
            clientClock: HLC_ZERO,
            changes: [{ key: planner.uuid, doc: planner.doc, fieldRevs: {}, baseClock: HLC_ZERO }],
        }),
    });
    if (!res.ok) throw new Error(`Seed failed: ${res.status}`);
}
```

---

## Success Criteria

- All `schema-contract/` tests pass without a live server (offline mode, CDN interception)
- `tp` and `col` are always integers in the sync payload — never empty string, never null
- `meta.year` is always an integer
- `meta.dark` is always a boolean
- No `additionalProperties` violations
- `theme-dark-roundtrip` tests pass — theme and dark mode survive reload and sign-in cycle
- `multipler-planner-roundtrip` tests pass — all planner UUIDs are real UUIDs
- `new-device-adoption` tests pass with live server
- `signout-wipe` confirms zero data leakage between sessions
- All existing `.tests/e2e/` tests continue to pass (no regressions)
