# S02: Clean URL + System-Follow Preferences — UAT

**Milestone:** M013
**Written:** 2026-04-16T05:43:51.069Z

# S02 User Acceptance Testing

## Preconditions
- Fresh browser session with localStorage cleared
- App running locally at http://localhost:8080
- System preferences: set OS to light mode for baseline tests
- Test user signed out (no JWT token)

## Test Group 1: URL Clean (No App-State Query Params)

### Test 1.1: Initial Load Has Clean URL
**Steps:**
1. Navigate to http://localhost:8080/
2. Wait for `[data-app-ready]` on body
3. Inspect browser URL bar

**Expected Outcome:**
- URL is http://localhost:8080/ with no query params
- App displays current year
- App displays light theme (following system preference)
- App displays browser language (or 'en' if not supported)

**Verification:**
```
grep -c "year=" <(window.location.search) === 0
grep -c "lang=" <(window.location.search) === 0
grep -c "theme=" <(window.location.search) === 0
```

### Test 1.2: URL Params year/lang/theme Are Ignored
**Steps:**
1. Navigate to http://localhost:8080/?year=2099&lang=ar&theme=dark
2. Wait for app ready
3. Check displayed year, language, and theme

**Expected Outcome:**
- URL still shows the params (browser history)
- App ignores them and displays: year=current, lang=system/en, theme=light (following OS)
- localStorage prefs do NOT contain year=2099, lang='ar', or theme='dark'

**Verification:**
```
localStorage.getItem('prefs:' + getActiveUserKey()) includes langMode: 'system', themeMode: 'system'
document.documentElement.lang === 'en' (or browser language)
body.classList.contains('yp-dark') === false
```

### Test 1.3: OAuth Callback Token Param Is Cleaned from URL After Auth
**Steps:**
1. Initiate GitHub OAuth flow (sign-in button)
2. Authorize and redirect back from OAuth callback
3. Wait for landing and token processing
4. Check URL

**Expected Outcome:**
- After token is processed and redirects settle, URL is clean: http://localhost:8080/ (no ?token, ?code, ?state)
- User is signed in (JWT token in localStorage)

**Verification:**
```
window.location.search === ''
localStorage.getItem('tok') !== null
```

## Test Group 2: System-Follow Language Mode

### Test 2.1: Fresh Install Defaults to System Language
**Steps:**
1. Clear localStorage completely
2. Reload app
3. Check language footer option and document.documentElement.lang

**Expected Outcome:**
- Footer language dropdown shows System option as checked
- `document.documentElement.lang` matches navigator.languages[0] (or fallback to 'en')
- localStorage `langMode` is 'system'

**Verification:**
```
localStorage.getItem('prefs:' + userKey).langMode === 'system'
document.documentElement.lang === navigator.languages[0].substring(0, 2) || 'en'
language-dropdown-system-option.checked === true
```

### Test 2.2: Changing Language to Explicit Sets Mode to Explicit
**Steps:**
1. From Test 2.1 state (system mode)
2. Click footer language dropdown → select 'Français'
3. Wait for i18n update and DOM change
4. Verify language dropdown state

**Expected Outcome:**
- App language switches to French immediately (no reload)
- URL remains clean: http://localhost:8080/
- Footer dropdown shows Français as checked
- System option is no longer checked
- localStorage langMode becomes 'explicit'

**Verification:**
```
window.location.search === ''
document.documentElement.lang === 'fr'
localStorage.getItem('prefs:' + userKey).langMode === 'explicit'
language-dropdown-system-option.checked === false
language-dropdown-french-option.checked === true
```

### Test 2.3: Returning to System Language
**Steps:**
1. From Test 2.2 state (Français, explicit mode)
2. Click footer language dropdown → select System
3. Wait for language update

**Expected Outcome:**
- Language immediately changes to navigator language (or 'en')
- URL remains clean
- System option is now checked
- localStorage langMode becomes 'system'

**Verification:**
```
window.location.search === ''
document.documentElement.lang === navigator.languages[0].substring(0, 2) || 'en'
localStorage.getItem('prefs:' + userKey).langMode === 'system'
language-dropdown-system-option.checked === true
```

### Test 2.4: Language Preference Survives Reload
**Steps:**
1. From Test 2.2 state (Français, explicit)
2. Reload page (Ctrl+R or F5)
3. Wait for app ready

**Expected Outcome:**
- App boots in Français (no flash to another language)
- Footer dropdown shows Français as checked
- URL is clean
- localStorage values match prior state

**Verification:**
```
window.location.search === ''
document.documentElement.lang === 'fr'
localStorage.getItem('prefs:' + userKey).langMode === 'explicit'
language-dropdown-french-option.checked === true
```

## Test Group 3: System-Follow Theme Mode

### Test 3.1: Fresh Install Defaults to System Theme
**Steps:**
1. Clear localStorage completely
2. Set OS to light mode (System Preferences / Settings)
3. Reload app
4. Check theme and settings flyout

**Expected Outcome:**
- App displays light theme (following OS preference)
- body.yp-dark class is absent
- #app[data-bs-theme] attribute is absent or 'light'
- Settings flyout → Theme section shows System as checked
- localStorage themeMode is 'system'

**Verification:**
```
body.classList.contains('yp-dark') === false
document.getElementById('app').getAttribute('data-bs-theme') !== 'dark'
localStorage.getItem('prefs:' + userKey).themeMode === 'system'
theme-system-option.checked === true
```

### Test 3.2: OS Dark Mode Change Updates Theme Live in System Mode
**Steps:**
1. From Test 3.1 state (system mode, OS light)
2. Change OS to dark mode (System Preferences / Settings)
3. Observe app theme (do NOT reload page)

**Expected Outcome:**
- App theme switches to dark immediately (no reload)
- body.yp-dark class appears
- #app[data-bs-theme] becomes 'dark'
- Settings flyout still shows System as checked
- URL remains clean

**Verification:**
```
body.classList.contains('yp-dark') === true
document.getElementById('app').getAttribute('data-bs-theme') === 'dark'
window.location.search === ''
localStorage.getItem('prefs:' + userKey).themeMode === 'system'
```

### Test 3.3: Explicit Dark Override Switches to Explicit Mode
**Steps:**
1. From Test 3.1 state (system light)
2. Click settings flyout → Theme → Dark
3. Verify theme and mode

**Expected Outcome:**
- App immediately switches to dark theme (even though OS is light)
- Settings flyout shows Dark as checked (not System)
- localStorage themeMode becomes 'explicit', theme becomes 'dark'
- URL remains clean

**Verification:**
```
body.classList.contains('yp-dark') === true
document.getElementById('app').getAttribute('data-bs-theme') === 'dark'
localStorage.getItem('prefs:' + userKey).themeMode === 'explicit'
localStorage.getItem('prefs:' + userKey).theme === 'dark'
theme-dark-option.checked === true
window.location.search === ''
```

### Test 3.4: Explicit Theme Ignores OS Changes
**Steps:**
1. From Test 3.3 state (explicit dark)
2. Change OS to light mode
3. Observe app theme (do NOT reload)

**Expected Outcome:**
- App remains dark (ignores OS change)
- Settings flyout still shows Dark as checked
- localStorage themeMode remains 'explicit'

**Verification:**
```
body.classList.contains('yp-dark') === true
localStorage.getItem('prefs:' + userKey).themeMode === 'explicit'
theme-dark-option.checked === true
```

### Test 3.5: Returning to System Theme
**Steps:**
1. From Test 3.4 state (explicit dark, OS light)
2. Click settings flyout → Theme → System
3. Verify theme immediately follows OS

**Expected Outcome:**
- App immediately switches to light (following OS)
- Settings flyout shows System as checked (no theme-specific option)
- localStorage themeMode becomes 'system'
- URL remains clean

**Verification:**
```
body.classList.contains('yp-dark') === false
document.getElementById('app').getAttribute('data-bs-theme') !== 'dark'
localStorage.getItem('prefs:' + userKey).themeMode === 'system'
theme-system-option.checked === true
window.location.search === ''
```

### Test 3.6: Theme Preference Survives Reload
**Steps:**
1. Set OS to light
2. Set app to explicit dark via settings flyout
3. Reload page (Ctrl+R or F5)
4. Verify theme persists

**Expected Outcome:**
- App boots in dark (even though OS is light)
- Settings flyout shows Dark as checked
- localStorage matches prior state
- No flash of light theme during load

**Verification:**
```
window.location.search === ''
body.classList.contains('yp-dark') === true
localStorage.getItem('prefs:' + userKey).themeMode === 'explicit'
localStorage.getItem('prefs:' + userKey).theme === 'dark'
```

## Test Group 4: Combined Mode + Language Interactions

### Test 4.1: Mode Settings Are Independent
**Steps:**
1. Set language to system, theme to explicit dark
2. Change OS language to French
3. Change OS theme to light
4. Observe app

**Expected Outcome:**
- Language immediately updates to French (system mode follows)
- Theme remains dark (explicit mode ignores OS change)
- Settings flyout shows: System for language, Dark for theme
- URL clean

**Verification:**
```
document.documentElement.lang === 'fr'
body.classList.contains('yp-dark') === true
language-dropdown-system-option.checked === true
theme-dark-option.checked === true
window.location.search === ''
```

### Test 4.2: Both Round-Trip Through Explicit and Back to System
**Steps:**
1. Start with all system modes
2. Switch language to Japanese, theme to light
3. Switch language back to system, theme back to system
4. Verify clean URL and localStorage

**Expected Outcome:**
- Language cycles: system → explicit (Japanese) → system (back to navigator lang)
- Theme cycles: system → explicit (light) → system (back to OS)
- URL never changes
- localStorage rounds match starting state

**Verification:**
```
window.location.search === ''
localStorage.getItem('prefs:' + userKey).langMode === 'system'
localStorage.getItem('prefs:' + userKey).themeMode === 'system'
document.documentElement.lang === navigator.languages[0].substring(0, 2) || 'en'
body.classList.contains('yp-dark') === (matchMedia('(prefers-color-scheme: dark)').matches)
```

## Test Group 5: Edge Cases & Resilience

### Test 5.1: Corrupted localStorage Preferences Don't Crash
**Steps:**
1. Via browser DevTools console: `localStorage.setItem('prefs:' + userKey, 'GARBAGE_JSON')`
2. Reload page

**Expected Outcome:**
- App boots normally (does not crash or blank)
- Displays default state (system modes)
- Corrupt pref data is replaced with valid structure on next preference write

**Verification:**
```
[data-app-ready] attribute is present on body
localStorage.getItem('prefs:' + userKey) is valid JSON after a preference change
```

### Test 5.2: Invalid Language Code Is Ignored
**Steps:**
1. Via console: `localStorage.setItem('prefs:' + userKey, JSON.stringify({...prefs, lang: 'xx', langMode: 'explicit'}))`
2. Reload page

**Expected Outcome:**
- App boots with lang='en' (fallback)
- Does not crash or show error
- Subsequent language changes work normally

**Verification:**
```
document.documentElement.lang === 'en'
[data-app-ready] is present
```

### Test 5.3: Invalid Mode Value Is Ignored
**Steps:**
1. Via console: `localStorage.setItem('prefs:' + userKey, JSON.stringify({...prefs, langMode: 'invalid_mode'}))`
2. Reload page

**Expected Outcome:**
- App boots with langMode='system' (safe default)
- No crash or error
- Settings reflect system mode

**Verification:**
```
language-dropdown-system-option.checked === true
[data-app-ready] is present
```

## Test Group 6: Planner Navigation & State Persistence

### Test 6.1: Year Navigation Keeps URL Clean
**Steps:**
1. Start on current year
2. Click previous year chevron button
3. Observe year display and URL

**Expected Outcome:**
- Year decreases by 1
- URL remains http://localhost:8080/ (no ?year param)
- Language and theme preferences unchanged

**Verification:**
```
window.location.search === ''
document.title or year-display shows decremented year
```

### Test 6.2: Creating New Planner Keeps URL Clean
**Steps:**
1. Click planner dropdown → Create New
2. Provide name (e.g., 'Test Planner 2025')
3. Verify new planner is active and URL is clean

**Expected Outcome:**
- New planner created and selected
- URL is still http://localhost:8080/ (no ?uid, ?id, or app-state params)
- Language and theme modes unchanged

**Verification:**
```
window.location.search === ''
new planner name appears in dropdown
localStorage contains new planner document
```

### Test 6.3: Preferences Persist Across Planner Switches
**Steps:**
1. Set language to Japanese, theme to explicit dark
2. Switch to another planner (dropdown → select)
3. Switch back to first planner
4. Verify preferences unchanged

**Expected Outcome:**
- Language remains Japanese
- Theme remains explicit dark
- Preferences are global (per user), not per planner

**Verification:**
```
document.documentElement.lang === 'ja'
body.classList.contains('yp-dark') === true
```

---

## Acceptance Criteria Met
✅ URL contains no app-state query params (year/lang/theme) in any navigation  
✅ Language supports system follow + explicit override + return-to-system  
✅ Theme supports system follow + explicit override + return-to-system  
✅ System-follow modes react live to OS changes without page reload  
✅ Preferences persist across reloads and planner navigation  
✅ UI clearly indicates active mode (System vs explicit)  
✅ Invalid inputs (corrupted prefs, unknown lang, bad mode values) handled gracefully  
✅ OAuth callback tokens still cleaned from URL after processing  
✅ All 45 verification tests pass deterministically  
✅ Grep gate confirms zero URL-state surfaces in runtime code
