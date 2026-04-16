---
id: T02
parent: S05
milestone: M012
key_files:
  - .tests/smoke/icon-desktop-packaging.spec.js
  - site/icons/desktop-matrix.json
  - site/icons/desktop/year-planner.ico
  - site/icons/desktop/year-planner.icns
key_decisions:
  - T01 created the full icon-desktop-packaging.spec.js on the first task per auto-mode slice convention; T02 verified coverage was complete without requiring extension — no duplicate spec work needed
duration: 
verification_result: passed
completed_at: 2026-04-16T00:11:58.814Z
blocker_discovered: false
---

# T02: Run desktop packaging smoke contract and icon regression suite — 86/86 tests pass across icon-desktop-packaging, icon-export-matrix, and icon-live-wiring specs

**Run desktop packaging smoke contract and icon regression suite — 86/86 tests pass across icon-desktop-packaging, icon-export-matrix, and icon-live-wiring specs**

## What Happened

T01 had already created the full `.tests/smoke/icon-desktop-packaging.spec.js` spec (34 assertions) as part of its slice-first-task obligation. T02's contract was to verify and extend that spec, then confirm the full combined regression suite passes.

**Spec review:** The existing spec fully satisfies all T02 must-haves:
- ICO binary assertions: magic bytes `00 00 01 00`, directory entry count = 7, required size ladder `16/24/32/48/64/128/256`, valid frame data offsets, PNG magic in every frame.
- ICNS binary assertions: file magic `icns`, file-length field vs actual size, non-empty chunk table, known iconutil OSType chunk types (`icp4/icp5/icp6/ic07/ic08/ic09/ic10`), ≥5 distinct chunk types for full size coverage.
- Contract-to-disk consistency: all declared output paths exist and are non-zero bytes.
- candidateId alignment: desktop-matrix.json top-level and per-entry candidateId matches canonical.json; output paths don't contaminate site/icons/matrix.json.
- web/PWA isolation: matrix.json still has exactly 9 entries.
- 7 negative-boundary assertions: missing format field, invalid format token, mismatched candidateId, wrong ICO magic, wrong ICNS magic, missing size from ladder, stale output path.

**Verification runs:**
1. `bash scripts/export-desktop-packaging-assets.sh` — ICO (7 frames), ICNS (iconset → iconutil), desktop-matrix.json all re-generated cleanly (exit 0).
2. `bash scripts/export-canonical-icon-matrix.sh` — 9 canonical PNGs + matrix.json written (exit 0).
3. Combined regression: `npm --prefix .tests run test -- --reporter=line smoke/icon-desktop-packaging.spec.js smoke/icon-export-matrix.spec.js smoke/icon-live-wiring.spec.js` — 86/86 passed in 2.6s.
4. Node candidateId alignment check — candidateId=C2 confirmed.

No extensions were needed — the spec coverage from T01 was complete and correct against the actual binary artifacts.

## Verification

1. `bash scripts/export-desktop-packaging-assets.sh` — all phases passed, desktop-matrix.json written (exit 0).
2. `bash scripts/export-canonical-icon-matrix.sh` — 9 PNGs exported, matrix.json written (exit 0).
3. `npm --prefix .tests run test -- --reporter=line smoke/icon-desktop-packaging.spec.js smoke/icon-export-matrix.spec.js smoke/icon-live-wiring.spec.js` — 86 passed (34 desktop + 24 export-matrix + 18 live-wiring + 10 combined negative) in 2.6s.
4. `node -e "candidateId alignment check"` — candidateId=C2 confirmed (exit 0).

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash scripts/export-desktop-packaging-assets.sh` | 0 | ✅ pass | 3900ms |
| 2 | `bash scripts/export-canonical-icon-matrix.sh` | 0 | ✅ pass | 1100ms |
| 3 | `npm --prefix .tests run test -- --reporter=line smoke/icon-desktop-packaging.spec.js smoke/icon-export-matrix.spec.js smoke/icon-live-wiring.spec.js` | 0 | ✅ pass — 86/86 | 2600ms |
| 4 | `node -e "candidateId alignment check"` | 0 | ✅ pass | 80ms |

## Deviations

The smoke spec was created in T01 (auto-mode first-task obligation). T02 reviewed the spec, confirmed it satisfies all must-haves, ran the combined suite to verify no regressions, and recorded the final verification evidence.

## Known Issues

none

## Files Created/Modified

- `.tests/smoke/icon-desktop-packaging.spec.js`
- `site/icons/desktop-matrix.json`
- `site/icons/desktop/year-planner.ico`
- `site/icons/desktop/year-planner.icns`
