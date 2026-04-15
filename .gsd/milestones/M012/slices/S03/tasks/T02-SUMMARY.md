---
id: T02
parent: S03
milestone: M012
key_files:
  - site/icons/matrix.json
  - .tests/smoke/icon-export-matrix.spec.js
key_decisions:
  - PNG IHDR dimensions read directly via readUInt32BE(16)/readUInt32BE(20) on a 24-byte header buffer — avoids any external imaging library dependency
  - Negative-path tests use in-spec simulation (fake arrays/objects) rather than mutating real files on disk — keeps the test suite idempotent and safe to run in any order
duration: 
verification_result: passed
completed_at: 2026-04-15T23:23:51.970Z
blocker_discovered: false
---

# T02: Add icon-export-matrix smoke spec with 24 assertions covering structural contract, PNG integrity, purpose coverage, and negative-path malformed-matrix detection; all 104 candidate + matrix smoke tests pass

**Add icon-export-matrix smoke spec with 24 assertions covering structural contract, PNG integrity, purpose coverage, and negative-path malformed-matrix detection; all 104 candidate + matrix smoke tests pass**

## What Happened

Created `.tests/smoke/icon-export-matrix.spec.js` — a pure Node.js filesystem spec (no browser) that enforces the complete export matrix contract across six test suites:

1. **matrix.json structural contract** — file exists, valid JSON, `entries` array present, exactly 9 entries, every entry has all required fields (`candidateId`, `platform`, `purpose`, `size`, `src`, `output`), all purpose tokens are valid (`any`/`maskable`/`monochrome`), all 3 purpose buckets are present, no duplicate `platform/purpose/size` triple, `schemaVersion` and `generatedAt` fields present.

2. **PWA purpose coverage** — parameterised over `[192, 512]`: confirms all 3 purposes appear at each size in the `pwa` platform bucket.

3. **Exported PNG file existence** — every `entry.output` path resolves on disk and is non-zero bytes.

4. **PNG integrity** — every exported file starts with the 8-byte PNG magic (`89 50 4E 47 0D 0A 1A 0A`) and the IHDR chunk dimensions (`buf.readUInt32BE(16)` width, `buf.readUInt32BE(20)` height) match the declared `entry.size` exactly.

5. **matrix.json ↔ disk consistency** — all output paths are unique, all `src` SVG paths referenced in the matrix exist on disk.

6. **Negative-path assertions** — seven boundary tests verify the guards are sensitive: missing `purpose` field, duplicate `platform/purpose/size` triple, invalid purpose tokens (`any-plus`, `mask`, empty string, etc.), stale/non-existent output path, 8-entry undershoot, 10-entry overshoot, and missing purpose bucket (`monochrome` absent).

All assertion messages name the exact `purpose`, `size`, and `output` path at the point of failure so downstream debugging requires no secondary investigation.

After writing the spec, ran `bash scripts/export-canonical-icon-matrix.sh` (9 exports, clean), then ran the combined suite of all 4 smoke specs together. Result: 104/104 passed in 2.6 s.

## Verification

Ran `bash scripts/export-canonical-icon-matrix.sh` — 9 exports, exit 0. Ran `npm --prefix .tests run test -- --reporter=line smoke/icon-export-matrix.spec.js smoke/icon-candidates-assets.spec.js smoke/icon-candidates-gallery.spec.js smoke/icon-candidates-selection.spec.js` — 104 passed, 0 failed. Ran `node -e "const fs=require('fs');const m=JSON.parse(fs.readFileSync('site/icons/matrix.json','utf8'));if(!Array.isArray(m.entries)||m.entries.length!==9){process.exit(1)}"` — exit 0. Ran `find site/icons -maxdepth 1 -type f | sort` — 10 files (9 PNGs + matrix.json).

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash scripts/export-canonical-icon-matrix.sh` | 0 | ✅ pass — 9 PNGs exported, matrix.json written | 4100ms |
| 2 | `npm --prefix .tests run test -- --reporter=line smoke/icon-export-matrix.spec.js smoke/icon-candidates-assets.spec.js smoke/icon-candidates-gallery.spec.js smoke/icon-candidates-selection.spec.js` | 0 | ✅ pass — 104/104 | 2600ms |
| 3 | `node -e "const fs=require('fs');const m=JSON.parse(fs.readFileSync('site/icons/matrix.json','utf8'));if(!Array.isArray(m.entries)||m.entries.length!==9){process.exit(1)}"` | 0 | ✅ pass — 9 entries confirmed | 80ms |
| 4 | `find site/icons -maxdepth 1 -type f | sort` | 0 | ✅ pass — 10 files (9 PNGs + matrix.json) | 30ms |

## Deviations

none

## Known Issues

none

## Files Created/Modified

- `site/icons/matrix.json`
- `.tests/smoke/icon-export-matrix.spec.js`
