---
id: T01
parent: S04
milestone: M012
key_files:
  - .compose/fragments/head.html
  - site/manifest.json
  - site/index.html
  - .tests/smoke/icon-live-wiring.spec.js
key_decisions:
  - Edit source fragment .compose/fragments/head.html (not generated site/index.html) for head icon wiring, as required by compose contract
  - Use relative ./icons/ prefix matching manifest.json serving context (same directory as manifest)
  - Replace entire manifest icons[] block rather than patching — old android-chrome entries have no canonical path and no purpose field
duration: 
verification_result: passed
completed_at: 2026-04-15T23:48:50.958Z
blocker_discovered: false
---

# T01: Wire canonical icon matrix outputs into composed head links and manifest.json, adding 28-assertion smoke spec for live wiring coverage

**Wire canonical icon matrix outputs into composed head links and manifest.json, adding 28-assertion smoke spec for live wiring coverage**

## What Happened

Read `site/icons/matrix.json` to confirm all 9 canonical icon files exist on disk before touching any wiring. Updated `.compose/fragments/head.html` to replace legacy root-level hrefs (`./apple-touch-icon.png`, `./favicon-32x32.png`, `./favicon-16x16.png`) with canonical `./icons/` paths (`apple-touch-icon-180x180.png`, `favicon-32x32.png`, `favicon-16x16.png`). Rewrote `site/manifest.json` `icons[]` from the stale 2-entry `android-chrome-*` block to the full 6-entry canonical PWA set covering `any`/`maskable`/`monochrome` at `192x192` and `512x512` with explicit `purpose`, `sizes`, and `type` fields per entry. Ran `bash .compose/build.sh` to regenerate `site/index.html` from compose fragments (695 lines). Ran inline structural validation confirming all 3 head refs and all 6 manifest src paths are present. Created `.tests/smoke/icon-live-wiring.spec.js` (28 tests) covering: head ref presence, stale-ref guard, manifest structural contract (6 entries, required fields, valid purposes, all 3 purpose buckets, all 6 canonical srcs), PWA purpose×size matrix (6 parameterised checks), disk file existence for both manifest and head icons, and 6 negative-boundary assertions.

## Verification

Ran `bash .compose/build.sh` — succeeded (695-line output, exit 0). Ran inline node verification command checking all 3 head refs and all 6 manifest srcs — exit 0, printed \"all checks pass\". Ran `node -e \"...manifest icon count check...\"` — 6 entries confirmed. Ran `npm --prefix .tests run test -- --reporter=line smoke/icon-live-wiring.spec.js` — 28 passed. Ran `npm --prefix .tests run test -- --reporter=line smoke/compose.spec.js smoke/icon-export-matrix.spec.js` — 29 passed (no regressions).

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash .compose/build.sh` | 0 | ✅ pass | 500ms |
| 2 | `node -e "inline T01 verification (3 head refs + 6 manifest srcs)"` | 0 | ✅ pass | 50ms |
| 3 | `node -e "manifest icon count === 6"` | 0 | ✅ pass | 30ms |
| 4 | `npm --prefix .tests run test -- --reporter=line smoke/icon-live-wiring.spec.js` | 0 | ✅ pass — 28/28 | 2400ms |
| 5 | `npm --prefix .tests run test -- --reporter=line smoke/compose.spec.js smoke/icon-export-matrix.spec.js` | 0 | ✅ pass — 29/29 | 2000ms |

## Deviations

none

## Known Issues

none

## Files Created/Modified

- `.compose/fragments/head.html`
- `site/manifest.json`
- `site/index.html`
- `.tests/smoke/icon-live-wiring.spec.js`
