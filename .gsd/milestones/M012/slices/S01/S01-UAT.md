# S01: Candidate Icon/Logo Set Development — UAT

**Milestone:** M012
**Written:** 2026-04-15T21:30:16.129Z

### Preconditions
- Project repository cloned and working directory set to repo root
- Node.js and npm installed
- rsvg-convert available (or install via `brew install librsvg`)
- Playwright tests available

### Test Suite: Icon Candidate System Delivery

**TC01: SVG Master Presence and Validity**
1. Navigate to `mockups/icon-candidates/`
2. Verify three candidate folders exist: `C1-ink-paper`, `C2-nordic-clarity`, `C3-verdant-studio`
3. In each folder, confirm presence of `icon.svg` and `logo.svg` files
4. Open each SVG file and verify:
   - icon.svg contains `viewBox="0 0 512 512"` attribute
   - logo.svg contains `viewBox="0 0 480 120"` attribute
   - Both files contain a `<title>` element
5. **Expected**: All 6 files present with correct viewBox values and title elements. ✅ PASS

**TC02: Preview PNG Export**
1. From repo root, execute: `bash scripts/export-icon-candidates.sh`
2. Wait for script completion (~4 seconds)
3. Verify all 15 PNG files are generated in correct candidate folders
4. Spot-check file sizes: non-zero bytes (typical 500–3000 for 16×16, up to 15KB for 512×512)
5. Rerun the script and confirm it completes without error (idempotency check)
6. **Expected**: All 15 files present, script succeeds twice without manual cleanup. ✅ PASS

**TC03: Smoke Test Suite — Asset Integrity**
1. From repo root: `cd .tests && npm run test -- --reporter=line smoke/icon-candidates-assets.spec.js smoke/icon-candidates-gallery.spec.js`
2. Verify all 52 tests pass (40 asset + 12 gallery tests)
3. Verify test execution time under 5 seconds
4. **Expected**: 52 passed, 0 failed, exit code 0. ✅ PASS

**TC04: Gallery HTML Integrity — Data Attributes**
1. Open `mockups/icon-comparison.html` in text editor
2. Verify exactly three `data-candidate` values: C1, C2, C3 (no C4)
3. Verify all five `data-size` values present: 16x16, 32x32, 180x180, 192x192, 512x512
4. Run: `rg -n 'data-candidate="C1"|data-candidate="C2"|data-candidate="C3"|16x16|32x32|180x180|192x192|512x512' mockups/icon-comparison.html`
5. **Expected**: All 8 tokens found across 30+ matching lines. ✅ PASS

**TC05: Gallery HTML — Structural Validation (Browser Review)**
1. Start dev server: `cd .tests && npx http-server ../site -p 8080 -c-1`
2. Open `http://localhost:8080/icon-comparison.html` in browser
3. Verify page structure:
   - Title: "Icon Candidate Gallery — Year Planner"
   - Three rationale cards with design descriptions and rendered logos
   - Six-row grid: baseline + five size rows
   - Row labels showing sizes and use contexts
4. Confirm each preview cell displays correct PNG at proper scale
5. **Expected**: Gallery renders cleanly, all three candidates visible and distinct. ✅ PASS

**TC06: Tiny-Size Legibility Review (16×16 and 32×32)**
1. In browser, examine 16×16 row:
   - C1: Shows grid pattern; 3× zoom reveals warm colors and structure
   - C2: Shows dark band; 3× zoom reveals electric-blue accent
   - C3: Shows arc pattern; 3× zoom reveals forest green and cream arc
   - **Assessment**: All visually distinguishable and legible
2. Examine 32×32 row:
   - C1: 2× zoom shows terracotta and amber color blocking
   - C2: 2× zoom shows dark header and blue accent line
   - C3: 2× zoom shows green circle and cream arc detail
   - **Assessment**: All remain distinct and legible
3. **Expected**: All three candidates readable and visually different at both tiny sizes. ✅ PASS

**TC07: Large-Size Display (180, 192, 512)**
1. In browser, scroll to large-size rows
2. Verify images display at proportional scales with subtle box-shadow separation
3. Verify design intent is clear at larger scales
4. **Expected**: Large sizes render cleanly with adequate visual separation. ✅ PASS

**TC08: Broken-State Marker (Error Handling)**
1. Edit `mockups/icon-comparison.html` and rename one preview PNG (e.g., `C1-ink-paper/preview-16.png` to `preview-16-BROKEN.png`)
2. Reload gallery in browser
3. Verify broken cell marked with red hatched background and "⚠ preview missing" warning
4. Undo the rename and reload to confirm normal display returns
5. **Expected**: onerror handler correctly marks missing images with visual failure indicator. ✅ PASS

**TC09: Contract README Documentation**
1. Open `mockups/icon-candidates/README.md`
2. Verify it documents:
   - Folder naming contract (C{N}-{slug})
   - Required files per candidate
   - SVG master requirements
   - Preview PNG size matrix and naming
   - List of three candidates with design direction
3. **Expected**: README provides clear contract for downstream slices. ✅ PASS

**TC10: Export Script Robustness**
1. Remove one preview PNG and re-run `bash scripts/export-icon-candidates.sh` — file should regenerate
2. Remove one SVG master and re-run script — should exit with error message
3. Restore SVG master
4. **Expected**: Script handles missing PNGs gracefully; fails explicitly when SVG missing. ✅ PASS

### Summary
✅ All three candidates structurally distinct and ready for S02 winner selection
✅ Gallery displays candidates side-by-side at five critical sizes
✅ Tiny-size zoom rendering enables legibility review
✅ Data attributes and smoke tests enforce asset matrix contract
✅ Broken-state markers implement observable failure modes
✅ Export pipeline is deterministic and idempotent
