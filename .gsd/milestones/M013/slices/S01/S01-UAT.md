# S01: Identity & Storage Contract Cleanup — UAT

**Milestone:** M013
**Written:** 2026-04-16T04:57:53.038Z

## User Acceptance Test (UAT) — S01: Identity & Storage Contract Cleanup

### Preconditions
- Local dev server running: `cd .tests && npx http-server ../site -p 8080 -c-1`
- Browser DevTools console and localStorage inspector open for validation
- Test data will be seeded via browser localStorage

### Test Suite 1: Fresh App Bootstrap (Device Identity)

**Scenario 1.1: App boots with no prior state — initializes device UUID and preferences under correct key**

**Steps:**
1. Open browser DevTools → Application → Storage → Local Storage
2. Clear all localStorage (`localStorage.clear()` in console)
3. Navigate to `http://localhost:8080/?year=2026`
4. Wait for app-ready (element `[data-app-ready]` appears on body)

**Expected Outcome:**
- localStorage contains `dev` key with a stable UUID value (e.g., `device-xxxxxxxx`)
- localStorage contains `prefs:${dev-uuid}` key with object containing `{ year: 2026, lang: 'en', theme: 'light' }`
- No `prefs:0`, `prefs:1`, or numeric uid keys exist
- planner document in `plnr:xxxxxxxx` has `meta.userKey` equal to the device UUID
- App displays year 2026 calendar

**Pass Criteria:**
- Preferences key name matches UUID format (`prefs:` + valid UUID)
- No numeric uid preference keys present
- Planner metadata contains `userKey` field
- App loads and renders without errors

---

**Scenario 1.2: Same device reloads app — reuses stored device UUID and preferences**

**Steps:**
1. Note the `dev` UUID and `prefs:${uuid}` key from Test 1.1
2. Reload the page (F5)
3. Check localStorage after app-ready

**Expected Outcome:**
- `dev` value is identical to the value from Test 1.1 (stable device identity)
- `prefs:${same-uuid}` is present with same preference values
- No new keys created; no duplicate prefs keys

**Pass Criteria:**
- Device UUID is stable across reloads
- Preference key remains consistent (same UUID key)

---

### Test Suite 2: Theme & Language Control (In-App State Mutations)

**Scenario 2.1: User toggles dark mode — theme changes in-app without URL param or reload**

**Steps:**
1. Open app at `http://localhost:8080/?year=2026` (no `?dark` or theme param)
2. Open DevTools Network tab and Console
3. Locate the dark mode toggle in the settings flyout
4. Click the dark mode toggle
5. Observe URL bar and localStorage

**Expected Outcome:**
- URL remains `http://localhost:8080/?year=2026` (no dark param added)
- No full page reload occurs (network requests do not include document request)
- DOM class `dark` applied to `<html>` element
- localStorage `prefs:${uuid}` contains `"theme": "dark"`
- Theme change is immediate (no flicker or lag)

**Pass Criteria:**
- URL does not change
- No page reload
- Dark styles applied instantly
- Preference persisted under correct key

---

**Scenario 2.2: User switches language — locale updates in-app without reload**

**Steps:**
1. App loaded at `http://localhost:8080/?year=2026&lang=en`
2. Open the language dropdown in the navbar
3. Select "中文 (Simplified)" or another supported language (e.g., `zh`)
4. Observe URL and UI

**Expected Outcome:**
- URL remains `http://localhost:8080/?year=2026` (no lang param added)
- No full page reload
- Page content translates to selected language immediately
- `document.documentElement.lang` attribute updates to language code (e.g., `zh`)
- localStorage `prefs:${uuid}` contains `"lang": "zh"`

**Pass Criteria:**
- URL clean (no lang param)
- Content translates without reload
- Preference persisted under correct key

---

**Scenario 2.3: User changes year via chevron — year display updates without URL param**

**Steps:**
1. App loaded at `http://localhost:8080/?year=2026`
2. Click the right chevron next to the year (next year button)
3. Observe URL and calendar display

**Expected Outcome:**
- URL remains `http://localhost:8080/?year=2026` (no change)
- Calendar grid shifts to year 2027
- localStorage `prefs:${uuid}` contains `"year": 2027`
- No page reload

**Pass Criteria:**
- URL unchanged
- Year display updates immediately
- Preference persisted
- No reload

---

### Test Suite 3: Multi-Planner Management (Document UUID, Not UID)

**Scenario 3.1: User creates and switches between planners — no uid query params, active planner UUID tracked**

**Steps:**
1. App loaded at `http://localhost:8080/?year=2026` with one planner present
2. Open the planner dropdown
3. Click "Create new planner" and name it "Work 2026"
4. Select the newly created planner from the dropdown
5. Switch back to the first planner
6. Check localStorage and URL

**Expected Outcome:**
- New planner document created with UUID (e.g., `plnr:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
- New planner metadata contains `meta.userKey` (device UUID)
- URL never changes to include `?uid=` or `?id=` params
- Switching planners updates `active-planner` key in localStorage to correct UUID
- Each planner's days/entries are isolated and correct when selected

**Pass Criteria:**
- Planner UUIDs are valid format (not numeric uid)
- No query params added to URL
- Active planner correctly tracked by UUID
- Planner content isolation maintained

---

**Scenario 3.2: User deletes a planner — deletion works via UUID, not uid**

**Steps:**
1. Create two planners named "Work 2026" and "Personal 2026"
2. Select "Personal 2026"
3. Open planner dropdown and click delete on "Work 2026"
4. Confirm deletion in modal
5. Check localStorage

**Expected Outcome:**
- "Work 2026" planner document is removed from localStorage
- `plnr:${uuid}` key for Work 2026 is deleted
- Active planner remains on "Personal 2026"
- URL does not change
- No `?uid=` or `?year=` params in URL during delete operation

**Pass Criteria:**
- Correct planner deleted by UUID
- No query params used
- Active planner unchanged

---

### Test Suite 4: Data Migration (Legacy Schema → M009)

**Scenario 4.1: User has legacy numeric-uid prefs — app migrates to UUID-keyed prefs**

**Steps:**
1. Clear localStorage and seed legacy data:
   ```javascript
   localStorage.setItem('0', 'device-uuid-value');
   localStorage.setItem('prefs:12345', JSON.stringify({ year: 2025, lang: 'en', theme: 'light' }));
   localStorage.setItem('plnr:abc-123', JSON.stringify({ meta: { uid: 12345, year: 2025 }, days: {} }));
   ```
2. Navigate to `http://localhost:8080/?year=2026`
3. Wait for app-ready
4. Check localStorage

**Expected Outcome:**
- App boots without errors (migration runs automatically)
- `dev` key is created with stable device UUID
- Legacy `prefs:12345` key is still present (preserved for backward compat) OR migrated to `prefs:${deviceUUID}`
- New preferences written under `prefs:${deviceUUID}` on any preference change
- Planner document still loads and displays correctly
- User can interact normally (year/theme/lang controls work)

**Pass Criteria:**
- App boots successfully with legacy data
- Preferences accessible under new UUID key
- No errors in console
- Planner content loads and is functional

---

### Test Suite 5: Regression (No UID Navigation Surfaces)

**Scenario 5.1: Grep gate confirms no uid query params or id param syntax in runtime code**

**Steps:**
1. Run `bash scripts/verify-no-legacy-uid.sh` from project root
2. Check exit code and output

**Expected Outcome:**
- Script exits with code 0 (success)
- Output: "PASS: no uid navigation surfaces found in runtime source"
- No file:line matches returned

**Pass Criteria:**
- Exit code is 0
- PASS output shown
- Zero matches for `\?uid=` and `[?&]id=` patterns in site/index.html and site/js/**

---

**Scenario 5.2: All regression test suites pass — behavior preserved under new contract**

**Steps:**
1. Run full regression pack:
   ```bash
   npm --prefix .tests run test -- --reporter=line \
     e2e/identity-storage-contract.spec.js \
     e2e/clean-url-navigation.spec.js \
     e2e/migration.spec.js \
     e2e/planner-management.spec.js \
     e2e/cross-profile-sync.spec.js \
     e2e/sync-payload.spec.js
   ```
2. Check exit code and test count

**Expected Outcome:**
- All 25+ tests pass
- No skipped tests
- Exit code 0
- No test failures or timeouts

**Pass Criteria:**
- Exit code is 0
- All test pass (no failures)
- No regressions in existing behavior

---

### Boundary/Edge Cases

**Edge Case 5.1: Malformed year input (non-numeric)**

**Steps:**
1. Open app at `http://localhost:8080/?year=2026`
2. Attempt to navigate year by typing/pasting non-numeric value (e.g., "abc")
3. Check app state

**Expected Outcome:**
- Input is ignored or coerced to safe default
- App does not crash
- Year display remains on current valid year
- No error in console

**Pass Criteria:**
- App remains stable
- No JavaScript errors

---

**Edge Case 5.2: Empty localStorage (first time ever)**

**Steps:**
1. Clear all localStorage
2. Close and reopen browser tab
3. Navigate to `http://localhost:8080/`
4. Wait for app-ready

**Expected Outcome:**
- App boots successfully
- Device UUID created
- Preferences initialized under correct UUID key
- Default year and settings applied
- One empty planner created or ready for content

**Pass Criteria:**
- App fully functional on first boot
- Correct keys created
- No errors

---

### Test Completion Checklist

- [ ] Scenario 1.1: Fresh bootstrap creates UUID device and preferences
- [ ] Scenario 1.2: Device UUID stable across reloads
- [ ] Scenario 2.1: Dark toggle in-app, no URL change
- [ ] Scenario 2.2: Language switch in-app, no URL change
- [ ] Scenario 2.3: Year change in-app, no URL change
- [ ] Scenario 3.1: Planner CRUD uses UUIDs, not uids
- [ ] Scenario 3.2: Planner delete via UUID
- [ ] Scenario 4.1: Migration from legacy schema works
- [ ] Scenario 5.1: Grep gate PASS (no uid surfaces)
- [ ] Scenario 5.2: All 25+ regression tests pass
- [ ] Edge Case 5.1: Malformed input ignored
- [ ] Edge Case 5.2: First-time boot succeeds
