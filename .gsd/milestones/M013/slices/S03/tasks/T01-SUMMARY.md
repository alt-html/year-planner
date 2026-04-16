---
id: T01
parent: S03
milestone: M013
key_files:
  - site/js/Application.js
  - site/js/service/Storage.js
  - site/js/vue/model/planner.js
  - site/js/vue/model/ui.js
  - site/js/vue/methods/planner.js
  - site/js/vue/methods/lifecycle.js
  - site/js/vue/methods/rail.js
key_decisions:
  - Removed exportPlannerToJSON and exportPlannerToBase64 from Storage.js as dead code (no callers anywhere) rather than leaving orphaned LZ-dependent methods
  - Removed closeShareModal from rail.js (not in T01 inputs list) because the verification grep scans site/js/vue/ and the method referenced showShareModal which was removed from ui.js
  - Left storage as Application constructor parameter since CDI injects it onto the model; removing it would only save one CDI injection with no real benefit
duration: 
verification_result: mixed
completed_at: 2026-04-16T06:06:00.347Z
blocker_discovered: false
---

# T01: Removed share URL/LZ runtime contract from Application bootstrap, Storage service, and Vue planner state/methods

**Removed share URL/LZ runtime contract from Application bootstrap, Storage service, and Vue planner state/methods**

## What Happened

Removed all legacy `?share=` ingestion and LZ import/export plumbing across 7 files:

1. **Application.js** — removed `share: urlParam('share')` from `url.parameters`, removed `this.model.share = ...` assignment, removed `this.storage.setModelFromImportString(this.model.share)` call. Updated comment to reflect only OAuth callback params and `name` are read from URL. The `storage` constructor parameter is retained as CDI injects it for the Vue layer.

2. **Storage.js** — removed LZString CDN import, `exportPlannerToJSON()`, `exportPlannerToBase64()` (dead code, no callers), `getExportString()`, and `setModelFromImportString()`. Only `download()` remains. The class is now lean with no external import dependencies.

3. **model/planner.js** — removed `shareUrl: window.location.origin`, `_pendingImport: null` (with its comment), and `share: ''` from planner state.

4. **model/ui.js** — removed `showShareModal: false` modal flag.

5. **methods/planner.js** — removed `sharePlanner()` and `copyUrl()` methods. The file now ends after `getPlannerYears()`.

6. **methods/lifecycle.js** — removed the `_pendingImport` consumption block from `refresh()` (lines that called `plannerStore.importDays` and cleared the field).

7. **methods/rail.js** — removed `closeShareModal()` dependent close handler (referenced `showShareModal` which was removed from ui.js; the verification grep scans `site/js/vue/` so this had to be cleaned up).

Compose build rerun confirmed `site/index.html` is still valid at 695 lines. The `bs5-migration.spec.js` MIG-04 test (share modal btn-close) now fails as expected — it will be updated in T03 to target a remaining modal.

## Verification

Ran T01 verification grep gate:
`bash -lc '! rg -n "urlParam('share')|\?share=|getExportString|setModelFromImportString|sharePlanner\(|showShareModal|shareUrl|_pendingImport" site/js/Application.js site/js/service/Storage.js site/js/vue site/js/config/contexts.js'`
→ Exit 0, no output (no forbidden symbols found in any scanned file).

Compose build: `bash .compose/build.sh` → exit 0, "site/index.html composed from .compose/ fragments (695 lines)".

Smoke tests: `npm --prefix .tests run test -- --reporter=line smoke/compose.spec.js` → 5/5 passed.

BS5 migration test partial: 3/4 passed; MIG-04 (share modal btn-close) fails as expected because shareModal UI will be removed in T02/T03. T03 owns updating that spec.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `bash -lc '! rg -n "urlParam..share.." site/js/Application.js site/js/service/Storage.js site/js/vue site/js/config/contexts.js'` | 0 | ✅ pass | 52ms |
| 2 | `bash .compose/build.sh` | 0 | ✅ pass | 800ms |
| 3 | `npm --prefix .tests run test -- --reporter=line smoke/compose.spec.js` | 0 | ✅ pass (5/5) | 2300ms |
| 4 | `npm --prefix .tests run test -- --reporter=line e2e/bs5-migration.spec.js` | 1 | ⚠️ partial (3/4 — MIG-04 share modal expected failure, T03 fixes) | 34000ms |

## Deviations

Removed rail.js:closeShareModal even though rail.js was not listed in T01 inputs. Required because the T01 verification grep scans `site/js/vue/` (which includes rail.js) and would have caught the showShareModal reference there. Also removed exportPlannerToJSON and exportPlannerToBase64 (dead code) from Storage.js since removing the LZString import would have broken exportPlannerToBase64 anyway.

## Known Issues

bs5-migration.spec.js MIG-04 test fails (share modal btn-close) — expected; T03 will update the spec to target a remaining modal.

## Files Created/Modified

- `site/js/Application.js`
- `site/js/service/Storage.js`
- `site/js/vue/model/planner.js`
- `site/js/vue/model/ui.js`
- `site/js/vue/methods/planner.js`
- `site/js/vue/methods/lifecycle.js`
- `site/js/vue/methods/rail.js`
