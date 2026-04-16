# S04: Live Web/PWA Wiring — UAT

**Milestone:** M012
**Written:** 2026-04-15T23:54:38.828Z

# UAT: Live Web/PWA Wiring (S04)

## Preconditions
- S03 export task completed: `site/icons/matrix.json` exists with 9 canonical icon entries
- Compose system operational: `bash .compose/build.sh` produces valid `site/index.html`
- All icon PNG files exported to `site/icons/` directory

## Test Cases

### TC1: Head Icon Links Wiring
**Goal**: Verify that `site/index.html` contains canonical favicon and apple-touch-icon links

**Steps**:
1. Run `bash .compose/build.sh` to regenerate index.html from compose fragments
2. Grep for `<link rel="apple-touch-icon"` in `site/index.html`
3. Grep for `<link rel="icon" ... favicon-32x32.png` in `site/index.html`
4. Grep for `<link rel="icon" ... favicon-16x16.png` in `site/index.html`

**Expected Outcome**:
- All 3 links are present with `href="./icons/*"` paths (canonical prefix)
- No legacy root-level paths like `href="./apple-touch-icon.png"` or `href="./favicon.png"`
- All referenced files exist on disk

### TC2: Manifest Icon Entries Structure
**Goal**: Verify that `site/manifest.json` contains exactly 6 canonical icon entries with correct structure

**Steps**:
1. Parse `site/manifest.json` as JSON
2. Count `icons` array entries
3. For each entry, verify: `src`, `sizes`, `type`, `purpose` fields exist
4. Verify `purpose` values are one of: `any`, `maskable`, `monochrome`
5. Verify `sizes` values are one of: `192x192`, `512x512`

**Expected Outcome**:
- Exactly 6 entries (not more, not less)
- All entries have required fields
- All purpose values are valid tokens
- Three entries cover `any` purpose (2 sizes)
- Three entries cover `maskable` purpose (2 sizes)
- Three entries cover `monochrome` purpose (2 sizes)
- All canonical srcs: `./icons/pwa-{purpose}-{size}.png`

### TC3: Canonical Icon File Reachability
**Goal**: Verify all referenced icon files exist on disk

**Steps**:
1. Extract all `src` values from `site/manifest.json`
2. For each manifest src, verify the file exists at `site/{src}`
3. Extract all `href` values from favicon/apple-touch links in `site/index.html`
4. For each head link href, verify the file exists at `site/{href}`
5. For any missing file, report path and status code

**Expected Outcome**:
- All 6 manifest icon files exist (pwa-any-192/512, pwa-maskable-192/512, pwa-monochrome-192/512)
- All 3 head icon files exist (apple-touch-icon-180, favicon-32, favicon-16)
- No 404 errors or missing-file exceptions
- All PNG files are non-empty (size > 0)

### TC4: PWA Purpose×Size Coverage Matrix
**Goal**: Verify the PWA manifest covers all purpose and size combinations

**Steps**:
1. Build a set of (purpose, size) pairs from manifest entries
2. Verify set includes: (any, 192), (any, 512), (maskable, 192), (maskable, 512), (monochrome, 192), (monochrome, 512)

**Expected Outcome**:
- All 6 combinations are present
- No gaps in purpose or size coverage
- Duplicate combinations are rejected

### TC5: Stale Reference Guard (Negative Boundary)
**Goal**: Verify legacy icon paths are NOT present in wiring

**Steps**:
1. Search `site/index.html` for legacy patterns: `./favicon.png`, `./apple-touch-icon.png`, `./favicon-16.png` (without `icons/` prefix)
2. Search `site/manifest.json` for legacy patterns: `./android-chrome-192x192.png`, `./favicon.png`, root-level icons

**Expected Outcome**:
- No legacy root-level paths found in head links or manifest
- All references use canonical `./icons/` prefix
- Test fails if legacy paths are present (catches regression)

### TC6: Manifest Structural Integrity
**Goal**: Verify manifest.json is valid JSON and has required top-level fields

**Steps**:
1. Attempt to parse `site/manifest.json` as JSON
2. Verify top-level `icons` field is an array
3. Verify no stray or malformed entries

**Expected Outcome**:
- JSON parses without error
- `icons` field is an array type (not object, string, or null)
- No parsing exceptions

### TC7: Smoke Test Regression (Integration)
**Goal**: Verify all icon-related smoke tests pass together

**Steps**:
1. Run `npm --prefix .tests run test -- --reporter=line smoke/icon-live-wiring.spec.js smoke/compose.spec.js smoke/icon-export-matrix.spec.js`
2. Monitor all 57 tests passing

**Expected Outcome**:
- 57/57 tests pass (28 icon-live-wiring + 5 compose + 24 export-matrix)
- No flaky failures under parallel execution (3 workers)
- Exit code 0

### TC8: Compose Idempotency Check
**Goal**: Verify compose build is deterministic and idempotent

**Steps**:
1. Run `bash .compose/build.sh` and capture output
2. Run again and compare output
3. Verify `site/index.html` is identical both times

**Expected Outcome**:
- Both compose runs produce identical 695-line output
- No timestamp drift, no randomization
- `site/index.html` is deterministic

## Edge Cases & Negative Boundaries

### EC1: Manifest with Wrong Number of Entries
- Manifest with 5 entries: Test fails (count !== 6)
- Manifest with 7 entries: Test fails (count !== 6)
- Test catches accidental deletions or additions

### EC2: Invalid Purpose Token
- Entry with `purpose: "banner"` (not a valid PWA purpose): Test fails
- Entry with `purpose: null`: Test fails
- Only `any`, `maskable`, `monochrome` are accepted

### EC3: Missing Required Field
- Entry missing `purpose` field: Test fails with "required field check"
- Entry missing `sizes` field: Test fails
- All 4 fields (`src`, `sizes`, `type`, `purpose`) must be present

### EC4: Head Ref Missing Canonical Prefix
- Head link with `href="./favicon-32x32.png"` (no `icons/`): Test fails
- Head link with `href="/icons/favicon-32x32.png"` (absolute, not relative): Test fails
- Must match exactly `./icons/*` pattern

### EC5: Disk File Not Found
- Manifest lists `./icons/pwa-any-192x192.png` but file doesn't exist: Test fails
- File deleted from disk between compose and test: Test fails
- Provides early detection of missing export artifacts

## Pass/Fail Criteria

**All 7 test cases must pass**, including:
1. All 3 head link refs present and canonical
2. Manifest has exactly 6 entries with valid structure
3. All 9 canonical icon files exist on disk and are readable
4. All 6 purpose×size combinations present in manifest
5. No legacy root-level paths found
6. Manifest is valid JSON with correct structure
7. All 57 smoke tests pass without flaky failures
8. Compose output is deterministic and idempotent

**Failure of any test case blocks S04 closure.**
