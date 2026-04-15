---
id: T01
parent: S02
milestone: M011
key_files:
  - site/js/vue/methods/entries.js
key_decisions:
  - markEdited runs unconditionally regardless of syncToRemote — HLC tracking on every edit not just when signed in
  - plannerId computed once and reused for both markEdited loop and api.sync()
duration: 
verification_result: passed
completed_at: 2026-04-09T20:05:43.652Z
blocker_discovered: false
---

# T01: Wire syncClient.markEdited() into entries.js updateEntry() for all 5 day fields so every edit stamps a per-field HLC dot-path into rev:{uuid}

**Wire syncClient.markEdited() into entries.js updateEntry() for all 5 day fields so every edit stamps a per-field HLC dot-path into rev:{uuid}**

## What Happened

model.js already had syncClient:null and StorageLocal.js had _updateRev removed (both from S01). The only edit was entries.js: in updateEntry(), after updateLocalEntry(), compute the ISO date, call getActivePlnrUuid once, then loop over ['tp','tl','col','notes','emoji'] calling syncClient.markEdited(plannerId, `days.${isoDate}.${field}`) for each. Guard with if (plannerId && this.syncClient). Consolidated the plannerId reuse to eliminate the duplicate getActivePlnrUuid call in the syncToRemote block.

## Verification

Three grep checks all pass. Full Playwright suite passes 17/17 with --workers=1. Parallel run shows 16/17 with tooltip-xss failing due to pre-existing localStorage state-pollution flakiness (passes in isolation).

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `grep -q 'syncClient' site/js/vue/model.js && echo OK` | 0 | ✅ pass | 50ms |
| 2 | `grep -q '_updateRev' site/js/service/StorageLocal.js && echo FAIL || echo OK` | 0 | ✅ pass | 50ms |
| 3 | `grep -q 'markEdited' site/js/vue/methods/entries.js && echo OK` | 0 | ✅ pass | 50ms |
| 4 | `cd .tests && npx playwright test --reporter=line --workers=1` | 0 | ✅ pass (17/17) | 18400ms |

## Deviations

model.js and StorageLocal.js were already in the required state from S01 — only entries.js required editing. No plan-level deviation.

## Known Issues

tooltip-xss.spec.js is flaky in parallel mode (pre-existing); passes when run alone or with --workers=1

## Files Created/Modified

- `site/js/vue/methods/entries.js`
