# Year Planner — Auth & Identity Lifecycle — Design Spec

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor year-planner to consume jsmdma's auth and client SDK infrastructure, replacing all bespoke session/storage/auth code with the platform layer, and deliver correct identity lifecycle behaviour: stable UUID from first touch, sign-in modal pester, sign-out full wipe, new-device planner adoption.

**Architecture:** Year-planner becomes a thin app layer over jsmdma. `StorageLocal.js` shrinks to planner-specific transforms. `SyncClient.js` is deleted. `AuthProvider.js` is deleted. Identity is a stable internal UUID in `jwt.sub` — never a timestamp, never a provider sub. Auth is a credential layer; it does not change the user's identity.

**Tech Stack:** Vue 3, jsmdma-client (DocumentStore, SyncClientAdapter, HttpClient), jsmdma-auth-client (DeviceSession, ClientAuthSession, AuthProvider, IdentityStore, PreferencesStore), Bootstrap modal, Playwright E2E tests.

**Prerequisite specs:** jsmdma Spec A (Auth Stack Completion) and jsmdma Spec B (Client SDK) must be complete before this spec is implemented.

**Steering directive:** If a change is not specific to the year planner calendar domain, it belongs in a jsmdma spec, not here.

---

## Scope

**In scope:**
- Replace `AuthProvider.js` with `jsmdma-auth-client/AuthProvider`
- Replace `SyncClient.js` with `jsmdma-auth-client/SyncClientAdapter`
- Reduce `StorageLocal.js` to planner-specific concerns only (delegates to jsmdma-client)
- Replace `Api.js` HTTP boilerplate with `jsmdma-client/HttpClient`
- Remove timestamp `uid` fallback — `model.uid` is always a stable UUID
- Sign-in modal: auto-show on init when not signed in, always dismissible, pester on every page load
- Sign-out: full wipe via jsmdma-auth-client, new anon UUID on next visit
- Rail: "Sign In" ↔ "Sign Out" toggle (restoring removed feature)
- New-device sign-in: adopt last-active remote planner for `meta.year === currentYear` (highest `_rev`)
- Anon-with-data + sign-in: anon planner uploaded as own slot in switcher, no auto-merge
- Wire jsmdma `preferences` sync collection for user preferences (theme, dark, lang)
- Update `contexts.js` CDI wiring to use jsmdma-client services

**Out of scope:**
- Calendar rendering, day entry CRUD, planner create/rename/delete/share UI — no changes
- Import/export (LZString share URL) — no changes
- Multi-language support — no changes
- Theme/dark mode CSS — no changes

---

## Identity Model

### Before (current state)
```
model.uid = URL ?uid param
         || localStorage legacy uid
         || Math.floor(Date.now() / 1000)   ← timestamp, not a UUID
```

### After (target state)
```
model.uid = ClientAuthSession.getUserUuid()   ← jwt.sub (stable internal UUID, issued by jsmdma AuthService)
         || DeviceSession.getOrCreateAnonUid() ← crypto.randomUUID(), persisted as anon_uid
```

**Key invariant:** `model.uid` never changes during a session. Sign-in does not change it — it replaces the anon UUID with the server-issued stable UUID. The planner's `meta.uid` is always in sync with `model.uid`.

### Sign-in transition
```
Before sign-in:
  model.uid = "a1b2c3d4-..."  (anon UUID from DeviceSession)
  planner meta.uid = "a1b2c3d4-..."

After sign-in:
  model.uid = "550e8400-..."  (stable UUID from jwt.sub)
  planner meta.uid updated to "550e8400-..."
  anon_uid localStorage key cleared
```

### Sign-out
```
ClientAuthSession.clear()      ← wipe token
DeviceSession.clear()          ← wipe anon_uid and dev keys
IdentityStore.clear()          ← wipe identities
PreferencesStore.clear(uid)    ← wipe preferences
DocumentStore.clear()          ← wipe all plnr:* documents
SyncClientAdapter.pruneAll()   ← wipe all rev:*, base:*, sync:* keys
→ DeviceSession.getOrCreateAnonUid()  ← generate fresh anon UUID
→ show sign-in modal
```

---

## Sign-in Modal Behaviour

### Auto-show on init
In `app.js` `mounted()`:
```js
mounted() {
    this.refresh();
    if (!this.storageLocal.signedin()) {
        $('#authModal').modal('show');   // pester — every page load if not signed in
    }
    window.jQuery('#authModal').on('shown.bs.modal', () => {
        this.authProvider.renderSignInButtons();
    });
}
```

### Dismissible
The modal has a close button. Dismissing drops to anonymous mode. The pester shows again on the next page load — that is intentional.

### Sign-in modal content (no change to existing)
- Google sign-in button rendered in `#google-signin-button`
- Apple and Microsoft buttons if configured
- Close/dismiss button

---

## Rail Toggle: Sign In ↔ Sign Out

The rail currently has a "Sign In" button but no "Sign Out". This restores the feature.

### HTML change (in rail template)
```html
<!-- Replace existing sign-in button with v-if toggle -->
<button v-if="!signedin" class="rail-btn" @click="showSignin()">
    <i class="ph ph-sign-in"></i>
    <span>{{ messages['nav.signin'] }}</span>
</button>
<button v-if="signedin" class="rail-btn" @click="signout()">
    <i class="ph ph-sign-out"></i>
    <span>{{ messages['nav.signout'] }}</span>
</button>
```

### i18n keys needed (all languages)
- `nav.signin` — existing key (verify present in all 10 language files)
- `nav.signout` — new key (add to all 10 language files)

### `signout()` method (in `methods/auth.js`)
```js
async signout() {
    // Full wipe via jsmdma-auth-client
    this.authProvider.signOut();           // clears token, provider
    this.storageLocal.wipeAll();           // clears planners, prefs, identities, sync state
    DeviceSession.clear();                 // clears dev + anon_uid
    // Reset model
    this.signedin = false;
    this.uid = DeviceSession.getOrCreateAnonUid();
    this.planner = Array.from({ length: 12 }, () => ({}));
    this.identities = [];
    // Show sign-in modal (pester)
    $('#authModal').modal('show');
}
```

---

## New-Device Sign-In: Planner Adoption

### Problem
On a new device with no local planners, `getActivePlnrUuid(uid, year)` returns `null`. `api.sync(null)` returns early. The user's remote data is never fetched.

### Solution
`Api.sync()` handles the `null` plannerId case: if signed in and no local planner exists for this uid+year, create an empty placeholder planner, sync it, and let `SyncClientAdapter`'s foreign document handling populate it from the server response.

```js
async sync(plannerId) {
    if (!this.storageLocal.signedin()) return;

    // New device: create placeholder planner to trigger sync
    if (!plannerId) {
        plannerId = this.storageLocal.createEmptyPlanner(this.model.uid, this.model.year);
    }

    try {
        const doc = this.storageLocal._getPlnrDoc(plannerId);
        const merged = await this.syncClient.sync(plannerId, doc, this._authHeaders());
        // ... existing merge handling
    }
}
```

### Adoption logic (in `SyncClientAdapter.sync()`, generic)
When server returns planners with `_key !== plannerId`:
1. Store each as a foreign document via `DocumentStore.set(foreignKey, foreignDoc)`
2. Return the foreign document with the most recent `_rev` for `meta.year === currentYear` if own planner is empty — this is the "last active planner" adoption

The year-planner `Api.sync()` detects adoption: if merged doc is the adopted foreign planner, update `model.uid` and URL to reflect the adopted planner's UUID.

### Post-adoption URL update
```js
// After sync, if the active planner UUID changed (adoption occurred):
if (mergedPlannerId !== originalPlannerId) {
    const url = new URL(window.location);
    url.searchParams.set('uid', this.model.uid);
    window.history.replaceState({}, '', url);
}
```

---

## Preferences via jsmdma `preferences` Collection

User preferences (theme, dark, lang) are now stored and synced as a jsmdma `preferences` document:

```json
{
  "key": "<userUUID>:year-planner",
  "doc": {
    "theme": "ink",
    "dark": false,
    "lang": "en"
  }
}
```

`PreferencesStore.get(userUuid)` reads from localStorage. On sync, the preferences document is synced alongside planners — same pipeline, same 3-way merge.

**Early-apply on page load (no flash):** `index.html` already has an early-apply script that reads localStorage and applies the theme class before Vue mounts. This still reads from `prefs:<uuid>` localStorage — `PreferencesStore` writes to the same key, so the early-apply script continues to work unchanged.

---

## StorageLocal.js After Refactor

Target: ~200 lines (down from ~630). Retains only planner-specific methods:

```
StorageLocal (planner-specific only):
  _docToMonthArray(doc): months[]        ← days → runtime array
  _monthArrayToDays(year, months): days  ← runtime array → days (with integer coercion)
  _getPlnrDoc(uuid): doc                 ← delegates to DocumentStore.get()
  _setPlnrDoc(uuid, doc): void           ← delegates to DocumentStore.set()
  _findPlnrUuid(uid, year): uuid|null    ← delegates to DocumentStore.find()
  createEmptyPlanner(uid, year): uuid    ← creates { meta, days:{} }, returns UUID
  getActivePlnrUuid(uid, year): uuid|null
  updateLocalEntry(...)                  ← planner entry mutation
  getLocalPlanner(uuid, year): months[]
  setLocalPlanner(uuid, year, months)
  getLocalPlannerYears(): {uid:[years]}
  importLocalPlanner(...)                ← import/share
  deletePlannerByYear(uid, year)
  deleteLocalPlanner(uuid)
  migrate()                              ← delegates to DocumentStore.migrate()
  signedin(): bool                       ← delegates to ClientAuthSession.isSignedIn()
  wipeAll(): void                        ← coordinates full wipe on sign-out
```

Removed from StorageLocal (moved to jsmdma):
- `getDevId()` → `DeviceSession.getDeviceId()`
- `getLocalSession/setLocalSession/deleteLocalSession/extendLocalSession` → `ClientAuthSession`
- `getLocalIdentities/setLocalIdentities/registerRemoteIdentity/getRemoteIdentities` → `IdentityStore`
- `getLocalPreferences/setLocalPreferences` → `PreferencesStore`
- All `KEY_DEV`, `KEY_TOK`, `KEY_IDS` constants → owned by jsmdma-auth-client

---

## SyncClient.js Deletion

`SyncClient.js` is deleted entirely. Year-planner wires `SyncClientAdapter` from `jsmdma-client` in `contexts.js`:

```js
// contexts.js
import SyncClientAdapter from '../vendor/jsmdma-client.esm.js';
// ...
container.register('syncClient', new SyncClientAdapter(documentStore));
```

`entries.js` `updateEntry()` continues to call `this.syncClient.markEdited(plannerId, dotPath)` — same interface.

---

## AuthProvider.js Deletion

`AuthProvider.js` is deleted. Year-planner imports `AuthProvider` from `jsmdma-auth-client`:

```js
// contexts.js
import { AuthProvider } from '../vendor/jsmdma-auth-client.esm.js';
import { authConfig } from '../config/auth-config.js';

const authProvider = new AuthProvider(authConfig);
container.register('authProvider', authProvider);
```

`auth-config.js` is unchanged — still defines `{ google: { clientId }, apple: { clientId }, microsoft: { clientId } }`.

---

## CDI Wiring Changes (contexts.js)

```js
import { DocumentStore, SyncClientAdapter, HttpClient } from '../vendor/jsmdma-client.esm.js';
import { AuthProvider, ClientAuthSession, DeviceSession, IdentityStore, PreferencesStore }
    from '../vendor/jsmdma-auth-client.esm.js';
import { authConfig } from '../config/auth-config.js';
import StorageLocal from './service/StorageLocal.js';
import Api from './service/Api.js';
// SyncClient.js import REMOVED
// AuthProvider.js import REMOVED

const documentStore = new DocumentStore({ namespace: 'plnr', migrations: plannerMigrations });
const syncClientAdapter = new SyncClientAdapter(documentStore);
const httpClient = new HttpClient({
    getToken: () => ClientAuthSession.getToken(),
    onTokenRefresh: (t) => ClientAuthSession.store(t),
});
const authProvider = new AuthProvider(authConfig);
const storageLocal = new StorageLocal(model, documentStore, syncClientAdapter);
const api = new Api(model, storageLocal, syncClientAdapter, authProvider, httpClient);
```

---

## Testing

All tests are Playwright E2E (existing `.tests/` infrastructure):

- `identity-lifecycle.spec.js`:
  - Fresh visit: anon UUID assigned, sign-in modal shown
  - Dismiss modal: anon mode, UUID persists on reload
  - Sign-in: `model.uid` becomes `jwt.sub`, planner `meta.uid` updated
  - Sign-out: all localStorage cleared, new anon UUID, modal shown
  - Rail shows "Sign Out" when signed in, "Sign In" when not
- `new-device-adoption.spec.js`:
  - Sign in with no local planners: remote planner adopted as active
  - Multiple remote planners same year: highest `_rev` adopted
  - Anon planner with data + sign-in: both planner slots appear in switcher
- `preferences-sync.spec.js`:
  - Theme change: persisted in `PreferencesStore`, synced as `preferences` collection document
  - Dark mode: same round-trip
  - Reload: theme restored without flash

---

## Success Criteria

- `model.uid` is always a UUID — never a timestamp integer, never a provider sub
- Changing auth provider (sign out, sign in with different provider) does not change user data
- Sign-out wipes ALL local state — verify by inspecting localStorage after wipe
- New device sign-in surfaces the last-active planner for the current year
- Rail sign-out button is present and functional
- Sign-in modal appears on every page load when not signed in
- `StorageLocal.js` is ≤ 200 lines
- `SyncClient.js` does not exist
- `AuthProvider.js` does not exist
- All existing E2E tests continue to pass
