---
id: T02
parent: S01
milestone: M012
key_files:
  - scripts/export-icon-candidates.sh
  - .tests/smoke/icon-candidates-assets.spec.js
  - mockups/icon-candidates/C1-ink-paper/preview-16.png
  - mockups/icon-candidates/C1-ink-paper/preview-32.png
  - mockups/icon-candidates/C1-ink-paper/preview-180.png
  - mockups/icon-candidates/C1-ink-paper/preview-192.png
  - mockups/icon-candidates/C1-ink-paper/preview-512.png
  - mockups/icon-candidates/C2-nordic-clarity/preview-16.png
  - mockups/icon-candidates/C2-nordic-clarity/preview-32.png
  - mockups/icon-candidates/C2-nordic-clarity/preview-180.png
  - mockups/icon-candidates/C2-nordic-clarity/preview-192.png
  - mockups/icon-candidates/C2-nordic-clarity/preview-512.png
  - mockups/icon-candidates/C3-verdant-studio/preview-16.png
  - mockups/icon-candidates/C3-verdant-studio/preview-32.png
  - mockups/icon-candidates/C3-verdant-studio/preview-180.png
  - mockups/icon-candidates/C3-verdant-studio/preview-192.png
  - mockups/icon-candidates/C3-verdant-studio/preview-512.png
key_decisions:
  - rsvg-convert chosen as primary exporter (already available at /opt/homebrew/bin/rsvg-convert); sips used only for dimension spot-checks as it is macOS built-in
  - Script treats missing sips as a warning (non-fatal) to remain portable to Linux CI where sips is absent
  - PNG magic-byte check added to smoke spec as an extra validity layer beyond existence + size checks
duration: 
verification_result: passed
completed_at: 2026-04-15T21:18:38.012Z
blocker_discovered: false
---

# T02: Add scripts/export-icon-candidates.sh to generate all 15 preview PNGs (3 candidates × 5 sizes) via rsvg-convert with sips dimension checks, and extend the smoke spec with a 17-test preview-matrix suite

**Add scripts/export-icon-candidates.sh to generate all 15 preview PNGs (3 candidates × 5 sizes) via rsvg-convert with sips dimension checks, and extend the smoke spec with a 17-test preview-matrix suite**

## What Happened

The scripts/ directory was created from scratch and export-icon-candidates.sh was written to iterate all three candidate folders (C1-ink-paper, C2-nordic-clarity, C3-verdant-studio) and export preview-{16,32,180,192,512}.png from each icon.svg master using rsvg-convert.

Script design decisions:
- Uses `set -euo pipefail` for fail-fast semantics.
- Checks for rsvg-convert at startup; exits with an explicit install message if missing.
- Warns (non-fatal) if sips is absent, but still proceeds without dimension checks.
- Rejects zero-byte source SVGs before invoking rsvg-convert.
- Verifies each output is non-zero-byte immediately after export.
- Runs a sips dimension spot-check per PNG and fails on mismatch.
- Fully idempotent: reruns overwrite outputs in-place.

All 15 PNGs were generated and dimension-verified (each matches its target size exactly) on first run.

The smoke spec (icon-candidates-assets.spec.js) was extended with a new `preview matrix` describe block containing 17 tests: one aggregate "all 15 exist" assertion, 15 per-file non-empty checks, and one PNG magic-byte validation that reads the first 4 bytes of every output to confirm valid PNG format. Each failure message includes the exact file path and the suggestion to re-run the export script.

The previously existing `candidate SVG masters` suite (23 tests) was unmodified. Combined run: 40 tests, all passed in 2.0s.

The slice-level rg check on mockups/icon-comparison.html returned no output (file does not exist yet) — this is expected as the comparison gallery is T03's deliverable.

## Verification

Ran: `bash scripts/export-icon-candidates.sh` — all 15 PNGs exported and sips-verified, exit 0.
Ran: `npm --prefix .tests run test -- --reporter=line smoke/icon-candidates-assets.spec.js --grep "preview matrix"` — 17/17 passed in 2.3s.
Ran: `npm --prefix .tests run test -- --reporter=line smoke/icon-candidates-assets.spec.js smoke/icon-candidates-gallery.spec.js` — 40/40 passed in 2.0s (includes the full existing SVG-master suite).

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash scripts/export-icon-candidates.sh` | 0 | ✅ pass — 15/15 PNGs exported and dimension-verified | 4200ms |
| 2 | `npm --prefix .tests run test -- --reporter=line smoke/icon-candidates-assets.spec.js --grep "preview matrix"` | 0 | ✅ pass — 17/17 tests passed | 2300ms |
| 3 | `npm --prefix .tests run test -- --reporter=line smoke/icon-candidates-assets.spec.js smoke/icon-candidates-gallery.spec.js` | 0 | ✅ pass — 40/40 tests passed | 2000ms |

## Deviations

None — all outputs match the expected file list in the task plan exactly. The slice-level rg check on icon-comparison.html correctly returns no output (T03 delivers that file).

## Known Issues

None.

## Files Created/Modified

- `scripts/export-icon-candidates.sh`
- `.tests/smoke/icon-candidates-assets.spec.js`
- `mockups/icon-candidates/C1-ink-paper/preview-16.png`
- `mockups/icon-candidates/C1-ink-paper/preview-32.png`
- `mockups/icon-candidates/C1-ink-paper/preview-180.png`
- `mockups/icon-candidates/C1-ink-paper/preview-192.png`
- `mockups/icon-candidates/C1-ink-paper/preview-512.png`
- `mockups/icon-candidates/C2-nordic-clarity/preview-16.png`
- `mockups/icon-candidates/C2-nordic-clarity/preview-32.png`
- `mockups/icon-candidates/C2-nordic-clarity/preview-180.png`
- `mockups/icon-candidates/C2-nordic-clarity/preview-192.png`
- `mockups/icon-candidates/C2-nordic-clarity/preview-512.png`
- `mockups/icon-candidates/C3-verdant-studio/preview-16.png`
- `mockups/icon-candidates/C3-verdant-studio/preview-32.png`
- `mockups/icon-candidates/C3-verdant-studio/preview-180.png`
- `mockups/icon-candidates/C3-verdant-studio/preview-192.png`
- `mockups/icon-candidates/C3-verdant-studio/preview-512.png`
