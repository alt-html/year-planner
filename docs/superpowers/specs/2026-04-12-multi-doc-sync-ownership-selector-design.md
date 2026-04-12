# Multi-Document Sync, Document Ownership, and Planner Selector

## Problem

The current architecture has three interrelated defects:

1. **Single-doc sync** — `SyncClientAdapter.sync()` sends one document per request. Other local documents are never pushed to the server. Foreign documents arriving from the server are stored locally but inaccessible to the user.

2. **No ownership model** — Anonymous (device-local) documents and authenticated (user) documents are treated identically. Sign-in triggers attempts to merge or adopt across document boundaries, producing orphan UUIDs, data loss, and brittle heuristics (`adoptIfEmpty`, `_mergeForeignDays`).

3. **No planner selector** — The legacy application had a planner switcher in the nav menu. It was dropped during redesign. Users cannot see, switch between, or manage multiple planners without URL manipulation.

## Goal

Establish a clean, reusable document ownership and multi-document sync architecture in the jsmdma-client package, then restore the planner selector in the year-planner application. Any jsmdma application with a different document schema should be able to reuse the ownership and sync mechanics without modification.

## Architecture

### Ownership Tiers

Every document has a `meta.userKey` that determines its ownership tier:

- **Device document** — `meta.userKey` is a device UUID (from `DeviceSession.getDeviceId()`). Local-only. Never included in sync payloads. Created when an anonymous user works without signing in.
- **User document** — `meta.userKey` is an authenticated user UUID (from `ClientAuthSession.getUserUuid()`). Sync-eligible. Included in sync payloads when the userKey matches the authenticated userId.

The sync rule: **only documents where `meta.userKey === authenticatedUserId` are sent to the server.** Everything else stays local.

### Transition: `takeOwnership(uuid, userId)`

A device document becomes a user document via an explicit `takeOwnership` call. This:

1. Updates `meta.userKey` from the device UUID to the authenticated user UUID.
2. Makes the document sync-eligible on the next sync cycle.

This is a user-initiated action (e.g., "Sync this planner" button in the selector). It is never automatic.

## Package Boundaries

### jsmdma-client (reusable)

#### SyncDocumentStore (new class)

Wraps `DocumentStore`. Adds ownership-aware operations:

- **`listSyncable(userId)`** — returns `[{uuid, doc}]` where `doc.meta.userKey === userId`. These are the documents that participate in sync.
- **`listLocal()`** — returns all documents in the store (device + user). Used by application UI (e.g., planner selector).
- **`takeOwnership(uuid, userId)`** — sets `doc.meta.userKey = userId` on the specified document. After this, the document appears in `listSyncable(userId)` results.
- **`get(uuid)`**, **`set(uuid, doc)`**, **`list()`**, **`delete(uuid)`**, **`find(predicate)`** — delegated to the underlying `DocumentStore`.

Constructor: `new SyncDocumentStore({ namespace })` — creates the underlying `DocumentStore` internally.

#### SyncClientAdapter.sync() (reworked)

Current signature: `sync(docId, doc, authHeaders, syncUrl)` — single document.

New signature: `sync(userId, authHeaders, syncUrl)`

Behavior:

1. Calls `this.syncDocumentStore.listSyncable(userId)` to get all sync-eligible documents.
2. For each document, reads its sync state (`sync:{uuid}`, `rev:{uuid}`, `base:{uuid}` from localStorage).
3. Builds a single HTTP request with all documents in the `changes` array.
4. Sends one POST request.
5. Processes `serverChanges`:
   - For each serverChange where `_key` matches a local doc: performs 3-way `merge2` as today.
   - For each serverChange where `_key` is unknown: stores via `syncDocumentStore.set(_key, serverDoc)` — these are docs from other devices.
6. Updates sync state for all documents.
7. Returns the merged results.

If `listSyncable` returns no documents (anonymous user, or signed-in user with only device docs), sync sends an empty `changes` array. The server still returns `serverChanges` for any docs in the user's namespace — this is the pull-only case (new device receiving existing planners).

Constructor change: receives `SyncDocumentStore` instead of `DocumentStore`.

#### DocumentStore (unchanged)

Generic namespace-based localStorage CRUD. No changes.

### jsmdma-server (no changes for this spec)

The server already:
- Accepts multiple documents in the `changes` array.
- Returns all documents newer than `clientClock` via `changesSince`.
- Has the dot-path fieldRevs merge fix (applied earlier today).

No server-side changes are required.

### year-planner application

#### PlannerStore (simplified)

Removes:
- `activateDoc(userKey, year)` — the auto-find/create pattern that produced orphan UUIDs.
- `adoptIfEmpty()` — workaround for missing selector.
- `_mergeForeignDays()` — workaround for missing multi-doc sync.
- Fetch interceptor debug logging in `syncActive()`.
- Inline tp/col normalization in `syncActive()` (move to `setDay` or a one-time migration).

Changes:
- **`activateDoc(uuid)`** — takes an explicit UUID (from the selector). Sets `_activeUuid`, calls `_syncModelDays()`. No searching, no creating.
- **`createDoc(userKey, year, name)`** — called explicitly from "New Planner" menu action. Returns the new UUID.
- **`sync(authHeaders)`** — delegates to `this._adapter.sync(userId, authHeaders, syncUrl)`. No per-doc logic.
- **`listPlanners()`** — already exists. Returns all local planners (device + user) for the selector.

Unchanged:
- `setDay(isoDate, dayObj)` — operates on `_activeUuid`.
- `getDay(isoDate)` — operates on `_activeUuid`.
- `deletePlanner(uuid)` — deletes by UUID (signature change from `userKey, year` to `uuid`).

#### Planner Selector UI

Location: nav dropdown (`.nav-settings`), "My Planners" section above existing New/Rename/Delete items.

Behavior:
- Lists all planners from `listPlanners()`, sorted by year descending then name.
- Each entry shows: planner name (or "Untitled {year}" fallback), year, and ownership indicator (local-only icon vs synced/cloud icon).
- Active planner is visually highlighted.
- Clicking a planner calls `activateDoc(uuid)` — no page navigation, swaps `model.days` in place.
- When signed in, device-local planners show a "Sync to cloud" action. This calls `takeOwnership(uuid, userId)`.

#### Active Planner Persistence

The active planner UUID is stored in localStorage (a simple key, e.g., `active-planner`). On page load:
1. Read the stored UUID.
2. If the UUID exists in the local store, activate it.
3. If not (deleted, first visit, new device after sync), open the selector automatically.

#### lifecycle.js changes

`refresh()` simplified:
1. Restore active UUID from localStorage.
2. If valid, activate it and schedule sync.
3. If not valid (or first visit), show the planner selector. After first sync completes, the selector populates with server docs.

No `activateDoc(userKey, year)`. No `adoptIfEmpty`. No implicit doc creation.

## Flows

### Anonymous user, fresh device

1. User lands on page. No auth token.
2. No active UUID in localStorage. Selector opens (empty).
3. User clicks "New Planner" — `createDoc(deviceId, 2026, '')`. Selector shows it with local-only indicator.
4. User selects it. Edits happily. All local, no sync.

### Anonymous user signs in

1. User has been editing a device-local planner.
2. Signs in. Page reloads with JWT.
3. Sync fires: `listSyncable(userId)` returns nothing (anon doc has deviceId). Empty changes sent. Server returns any existing user docs.
4. Server docs stored locally.
5. Selector now shows: the device-local planner (local-only badge) + any user planners from server (cloud badge).
6. User can "Sync to cloud" on the device planner — `takeOwnership(uuid, userId)`. Next sync uploads it.
7. Or user ignores the device planner and selects a server planner.

### Signed-in user, new device

1. User signs in on new device. No local docs.
2. Sync fires: empty changes, server returns all user docs.
3. Stored locally. Selector populates. User picks one.

### Two devices, same account, concurrent edits

1. Device A edits planner (UUID-X) day Jan 1. Syncs. Server has Jan 1.
2. Device B has UUID-X locally (from previous sync). Edits day Mar 5. Syncs.
3. Sync sends UUID-X with Mar 5. Server merges (Jan 1 from server + Mar 5 from client — the object sub-key merge handles non-colliding days). Returns merged doc.
4. Device B now has Jan 1 + Mar 5.
5. Device A syncs again. Gets merged doc with both days.

Both devices operate on the same UUID. The server-side dot-path-aware merge (fixed earlier today) handles non-colliding day entries correctly.

## Testing Strategy

### jsmdma-client unit tests (TDD)

**SyncDocumentStore:**
- `listSyncable(userId)` returns only docs with matching `meta.userKey`
- `listSyncable(userId)` excludes device-owned docs
- `listLocal()` returns all docs regardless of userKey
- `takeOwnership(uuid, userId)` updates `meta.userKey`
- `takeOwnership(uuid, userId)` makes doc appear in `listSyncable`
- Delegation: `get`, `set`, `delete`, `list`, `find` pass through to DocumentStore

**SyncClientAdapter.sync():**
- Sends all syncable docs in one request
- Empty `changes` when no syncable docs (pull-only)
- Merges matching `_key` serverChanges via `merge2`
- Stores foreign `_key` serverChanges via `set()`
- Updates sync state (`sync:`, `rev:`, `base:`) for all synced docs
- Clears `rev:` after successful sync

### year-planner E2E tests

**Planner selector:**
- Selector lists all local planners
- Clicking a planner switches `model.days`
- Active planner is persisted across page reload
- "New Planner" creates and activates
- Delete removes from list

**Cross-profile sync (update existing test):**
- Profile A creates planner, adds data, syncs
- Profile B signs in (same account), syncs, sees Profile A's planner in selector
- Profile B selects it, edits a different day, syncs
- Profile A syncs, sees both days

**Anonymous to signed-in:**
- Anon user creates planner, adds data
- Signs in, sync fires
- Selector shows device planner (local badge) + any server planners
- "Sync to cloud" on device planner, next sync uploads it
- New device signs in, sees the planner

## Cleanup

The following are removed as part of this work:
- `PlannerStore.adoptIfEmpty()`
- `PlannerStore._mergeForeignDays()`
- `PlannerStore.activateDoc(userKey, year)` (replaced by `activateDoc(uuid)`)
- `PlannerStore._findDoc(userKey, year)` (no longer needed)
- Fetch interceptor debug logging in `syncActive()`
- The `adoptIfEmpty` call in `lifecycle.js refresh()`
- `cross-profile-sync.spec.js` tests rewritten for the new selector-based flow
