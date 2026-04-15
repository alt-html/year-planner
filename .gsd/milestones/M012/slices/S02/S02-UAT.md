# S02: S02: Winner Selection and Canonical Source Lock — UAT

**Milestone:** M012
**Written:** 2026-04-15T22:32:07.468Z

# S02 UAT: Winner Selection and Canonical Source Lock

## Preconditions
- S01 has been completed: three candidate folders (C1-ink-paper, C2-nordic-clarity, C3-verdant-studio) exist under `mockups/icon-candidates/` with complete SVG masters and 15 preview PNGs (5 sizes × 3 candidates)
- Test environment has Node.js 18+ and Playwright installed
- `cd .tests && npm install` has been run

## Test Cases

### TC-01: Metadata Files Exist and Are Valid JSON
**Steps:**
1. Verify `mockups/icon-candidates/canonical.json` exists
2. Verify `mockups/icon-candidates/alternatives.json` exists
3. Parse both as JSON and confirm no syntax errors

**Expected Outcome:**
- Both files are valid JSON
- canonical.json has top-level keys: schemaVersion, selectionStatus, candidateId, candidateName, folder, previews, svgSources

### TC-02: Winner Uniqueness
**Steps:**
1. Read canonical.json
2. Verify candidateId is exactly one of: C1, C2, C3
3. Verify selectionStatus is "winner"

**Expected Outcome:**
- candidateId = "C2"
- selectionStatus = "winner"

### TC-03: Archived Alternatives Completeness
**Steps:**
1. Read alternatives.json
2. Count archived-alternative entries
3. Extract candidateIds from both canonical.json and alternatives.json
4. Verify all three candidates (C1, C2, C3) are covered exactly once

**Expected Outcome:**
- alternatives.json contains exactly 2 entries
- Both have selectionStatus = "archived-alternative"
- candidateIds are C1 and C3
- Union of {C2 from canonical.json} + {C1, C3 from alternatives.json} = {C1, C2, C3} with no duplicates

### TC-04: Preview Paths Use Correct Naming Convention
**Steps:**
1. Read canonical.json previews object
2. Read alternatives.json previews from both entries
3. Verify all preview paths contain "preview-{size}.png" (not old "icon-{size}.png" naming)

**Expected Outcome:**
- All preview paths follow pattern: `{folder}/preview-{16,32,180,192,512}.png`
- No paths contain "icon-16.png", "icon-32.png", etc. (old naming)

### TC-05: Gallery Markers Match Metadata (data-selection-state Attributes)
**Steps:**
1. Open `mockups/icon-comparison.html` in browser
2. Inspect the 3 rationale cards (divs with class="rationale-card")
3. Verify data-selection-state attributes:
   - C2 card has data-selection-state="winner"
   - C1 card has data-selection-state="archived-alternative"
   - C3 card has data-selection-state="archived-alternative"
4. Inspect the 3 column headers in the gallery grid (divs with class="gh-cand")
5. Verify data-selection-state attributes match: C2="winner", C1 and C3="archived-alternative"
6. Spot-check 3 preview cells (at 16×16, 192×192, 512×512 rows):
   - C2 cells have data-selection-state="winner"
   - C1 and C3 cells have data-selection-state="archived-alternative"

**Expected Outcome:**
- All data-selection-state attributes present and correct
- Gallery visually shows winner (C2) prominently; alternatives (C1, C3) dimmed (opacity < 1.0)
- "Winner ✓" badge displayed on C2 rationale card and column header

### TC-06: Smoke Tests Pass
**Steps:**
1. Run: `cd .tests && npm run test -- --reporter=line smoke/icon-candidates-assets.spec.js`
2. Run: `cd .tests && npm run test -- --reporter=line smoke/icon-candidates-gallery.spec.js`
3. Run: `cd .tests && npm run test -- --reporter=line smoke/icon-candidates-selection.spec.js`
4. Verify all three suites exit with code 0

**Expected Outcome:**
- ✅ icon-candidates-assets.spec.js: all 14 tests pass
- ✅ icon-candidates-gallery.spec.js: all 36 tests pass
- ✅ icon-candidates-selection.spec.js: all 12 tests pass
- Total: 62 tests pass, 0 failures

### TC-07: README Contract Documentation
**Steps:**
1. Read `mockups/icon-candidates/README.md`
2. Verify sections exist:
   - "Winner Selection Metadata" section documents canonical.json and alternatives.json
   - "Machine-Checkable Contract" section lists selection smoke spec assertions
3. Verify README does not reference old "icon-{size}.png" naming

**Expected Outcome:**
- README clearly states "canonical.json is the authoritative winner selection"
- README documents alternatives.json as containing archived alternatives
- Selection smoke spec expectations are documented
- No references to outdated naming conventions

### TC-08: Decision D016 Recorded
**Steps:**
1. Read `.gsd/DECISIONS.md`
2. Find entry D016
3. Verify it documents the C2 selection with rationale

**Expected Outcome:**
- D016 exists in DECISIONS.md
- Records: candidateId=C2, decision rationale includes "small-size legibility" and "cross-size coherence"
- Marked as non-revisable ("No — locked as canonical for S03 export and production wiring")

## Edge Cases & Error Scenarios

### EC-01: Malformed canonical.json
**If this fails:** canonical.json is not valid JSON or is missing required fields → smoke test icon-candidates-selection.spec.js will fail with "canonical.json is not valid JSON"
**Recovery:** Verify canonical.json syntax; ensure schemaVersion, selectionStatus, candidateId, folder, previews, svgSources are all present

### EC-02: Duplicate Candidate IDs
**If this fails:** A candidate ID appears in both canonical.json and alternatives.json → selection smoke test will fail with "winner + two alternatives do not cover all three candidates"
**Recovery:** Verify canonical.json has exactly C2; verify alternatives.json has exactly C1 and C3

### EC-03: Gallery Marker Mismatch
**If this fails:** data-selection-state in HTML does not match JSON metadata → selection smoke test will fail with "gallery markers do not agree with JSON metadata"
**Recovery:** Manually inspect gallery HTML and re-sync data-selection-state attributes to match canonical/alternatives JSON

### EC-04: Missing SVG Sources
**If this fails:** canonical.json references SVG files that don't exist → S03 export will fail
**Recovery:** Verify mockups/icon-candidates/C2-nordic-clarity/icon.svg and logo.svg exist

## Sign-Off Criteria

S02 is complete when:
- ✅ All 8 test cases pass
- ✅ All 62 smoke tests pass (icon-candidates-assets + gallery + selection)
- ✅ README documents selection metadata
- ✅ D016 decision is recorded
- ✅ Gallery is visually inspected and C2 is clearly marked as winner across all five size rows
- ✅ No smoke test failures or warnings

