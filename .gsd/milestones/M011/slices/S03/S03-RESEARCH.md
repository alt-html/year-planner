# S03: MOD Audit + Cleanup — Research

**Date:** 2026-04-10
**Researcher:** scout agent

---

## Summary

S03 is a housekeeping slice: audit MOD-05 through MOD-09, mark those already done in the codebase as validated, and resolve any genuinely pending items. The audit result is **four of five are done; one is deferred**. No functional code changes are needed. The task is purely DB/requirement bookkeeping and cleanup of dead orphan files in `.compose/fragments/modals/`.

---

## Audit Findings: MOD-05 through MOD-09

### IMPORTANT: Label discrepancy between M002 and M011

The M011 CONTEXT maps MOD labels differently from how M002 executed them. The table below uses the **M011 CONTEXT labels** (which is what S03 must resolve), cross-referenced with the M002 execution evidence.

---

### MOD-05 — Remove SquareUp ✅ DONE (M002/S04)

**Evidence:**
- `site/js/service/SquareUp.js` — does not exist (deleted)
- `grep -r "squareup|SquareUp|initPaymentForm|squarePayment|setDonation" site/js/` — zero results
- `grep -i "squareup|sqpaymentform" site/index.html` — zero results
- `site/js/vue/i18n/*.js` — retain `donate:` translation keys (dead keys, not referenced in any template) but this is cosmetic only; no UI or runtime impact

**Verdict: Already done. Mark validated. No code changes needed.**

**Note on i18n:** The `donate`, `give`, `donatespiel`, `donationaccepted`, `donationreceipt`, `donationSubject`, `donationBody`, `paymentfailed` i18n keys exist in 10 language files but are never referenced by any template (grep of `site/index.html` for `donate|payment` returns zero template uses). These are dead i18n keys. Cleaning them up is cosmetic and out of scope for S03 — they're harmless.

---

### MOD-06 — Clean feature flags ✅ DONE (M002/S04)

**Evidence (`site/js/vue/model-features.js`):**
```js
export const feature = {
    debug : false,
    signin : true,
    import : false,
    export : false,
};

export function ftoggle(fname) {
    feature[fname] = !feature[fname];
    return feature[fname];
}
```
- No `window.ftoggle` global — was removed in M002/S04
- No `donate` feature flag — was removed in M002/S04
- `ftoggle` exported as named ES6 function (not attached to `window`)
- `feature['signin']` and `feature['debug']` are the only flags used in templates (verified in index.html)

**Verdict: Already done. Mark validated. No code changes needed.**

---

### MOD-07 — Replace lodash ✅ DONE (M002/S04)

**Evidence:**
- `grep -r "lodash|_\." site/js/ --include="*.js"` — zero results
- `grep "lodash" site/index.html` — zero results (no lodash CDN tag)
- M002/S04 replaced all 8 lodash calls (`_.filter`, `_.find`, `_.findIndex`, `_.map`, `_.uniq`, `_.remove`) with native Array methods in `StorageLocal.js` and the then-existing `StorageRemote.js` (now deleted)

**Verdict: Already done. Mark validated. No code changes needed.**

---

### MOD-08 — Update template bindings ⚠️ DEFERRED

**What "Update template bindings" means in M011 context:**

The M002 execution for S02 (model restructuring) used a **flat spread merge** specifically to avoid updating template bindings. The comment in `S02-RESEARCH.md` says: "Template binding changes would cascade to ~75+ bindings across 18 fragments and all 5 method modules — massive risk for organizational benefit that can be achieved without it." The flat merge meant MOD-07 (template update) was satisfied by doing nothing — no binding paths changed.

The M011 CONTEXT recycles MOD-08 to mean template binding modernization: converting verbose `v-bind:` and `v-on:` syntax to Vue 3 shorthands (`:` and `@`). The current `index.html` has **41 `v-bind:` occurrences** and **27 `v-on:` occurrences** — all verbose. The `.compose/` fragments are the source of truth.

**Current state:**
- `site/index.html`: 41× `v-bind:`, 27× `v-on:` — all verbose style
- `.compose/fragments/nav.html`: 7× `v-bind:`, 8× `v-on:`
- `.compose/fragments/grid.html`: 18× `v-bind:`, 2× `v-on:`
- `.compose/fragments/footer.html`: 11× `v-bind:`, 0× `v-on:`
- `.compose/fragments/spinner.html`: 1× `v-bind:`
- Plus modals, rail (check individually)

**Why deferred:**
- Shorthand conversion is purely cosmetic (Vue 3 supports both forms identically)
- It requires modifying 6+ `.compose/` fragment files and recomposing
- If a fragment contains a mistake, the compose smoke test (`COMP-02`) will catch it, but it's unnecessary churn
- The change is purely aesthetic, does not fix any bug, does not affect any test, and has nonzero risk of introducing a typo in a template binding
- MOD-08 was intentionally not validated in M002 because the flat merge approach made template changes unnecessary
- **Recommended verdict: defer to a future cosmetic pass with explicit low-risk scope**

**Verdict: Deferred. Rationale documented here. No code changes in S03.**

---

### MOD-09 — Wire modules through CDI ✅ DONE (M002/S05 + M011/S01)

**Evidence (`site/js/config/contexts.js`):**
```js
import { Context, Singleton } from 'https://cdn.jsdelivr.net/npm/@alt-javascript/cdi@3/dist/alt-javascript-cdi-esm.js';

import Api from '../service/Api.js';
import Application from '../Application.js';
import AuthProvider from '../service/AuthProvider.js';
import Storage from '../service/Storage.js';
import StorageLocal from '../service/StorageLocal.js';
import SyncClient from '../service/SyncClient.js';
import { feature } from '../vue/model-features.js';
import { messages } from '../vue/i18n/messages.js';
import { model } from '../vue/model.js';
import { i18n } from '../vue/i18n.js';

export default new Context([
    new Singleton(Api),
    new Singleton(Application),
    new Singleton(AuthProvider),
    new Singleton(Storage),
    new Singleton(StorageLocal),
    new Singleton(SyncClient),     // ← added in M011/S01
    { name: 'feature',  Reference: feature },
    { name: 'messages', Reference: messages },
    { name: 'model',    Reference: model },
    { name: 'i18n',     Reference: i18n },
]);
```
- All current service modules registered
- `StorageRemote` removed (M011/S01)
- `SyncClient` added (M011/S01)
- M002/S05 validated original wiring; M011/S01 updated for new modules

**Verdict: Already done. Mark validated. No code changes needed.**

---

## Orphan Fragment Cleanup (bonus work)

The `.compose/fragments/modals/` directory contains 7 orphan files not included in the build:

| File | Status | Reason |
|------|--------|--------|
| `pay.html` | ORPHAN | Payment modal — SquareUp removed in M002/S04 |
| `signin.html` | ORPHAN | Old username/password auth form — replaced by `auth.html` in M004 |
| `register.html` | ORPHAN | Bespoke registration form — removed in M004 |
| `reset-password.html` | ORPHAN | Bespoke password reset — removed in M004 |
| `recover-username.html` | ORPHAN | Bespoke username recovery — removed in M004 |
| `cookie.html` | ORPHAN | Cookie consent modal — removed in M003 |
| `settings.html` | ORPHAN | Settings modal — removed/superseded |

These files are not included in `modals.html` → they are **not** compiled into `site/index.html` → they have **zero runtime impact**. However, they are dead code clutter that makes the `.compose/fragments/modals/` directory confusing.

**Recommendation:** Delete all 7 orphan files as a clean-up task. This is low-risk (files aren't used) and the `COMP-02` smoke test verifies the build still produces correct output after deletion. This is the most tangible "cleanup" action S03 can take.

---

## Verification Baseline

- **18/18 Playwright tests pass** (verified: `cd .tests && npx playwright test --reporter=line`)
- The `COMP-02` compose smoke test verifies `.compose/build.sh` produces identical `site/index.html`
- No code changes are needed for MOD-05, MOD-06, MOD-07, MOD-09 — just DB requirement status updates

---

## Implementation Landscape

S03 has **one task**:

### T01 — MOD audit: mark completed requirements as validated + delete orphan fragments

**What changes:**
1. Update REQUIREMENTS.md (via `gsd_requirement_update`):
   - MOD-05 → status: validated
   - MOD-06 → status: validated
   - MOD-07 → status: validated
   - MOD-08 → status: deferred (with rationale: shorthand-only cosmetic change, not worth the churn)
   - MOD-09 → status: validated
2. Delete 7 orphan `.compose/fragments/modals/` files:
   - `pay.html`, `signin.html`, `register.html`, `reset-password.html`, `recover-username.html`, `cookie.html`, `settings.html`
3. Re-run `.compose/build.sh` to verify no regression in composed output
4. Run all 18 Playwright tests to confirm no regressions

**Files touched:**
- `.gsd/REQUIREMENTS.md` (auto-regenerated by gsd_requirement_update calls)
- `.compose/fragments/modals/pay.html` (delete)
- `.compose/fragments/modals/signin.html` (delete)
- `.compose/fragments/modals/register.html` (delete)
- `.compose/fragments/modals/reset-password.html` (delete)
- `.compose/fragments/modals/recover-username.html` (delete)
- `.compose/fragments/modals/cookie.html` (delete)
- `.compose/fragments/modals/settings.html` (delete)

**Verification:**
```bash
# Confirm orphan fragments are gone
ls .compose/fragments/modals/
# Confirm build still works
bash .compose/build.sh
# Confirm all tests pass
cd .tests && npx playwright test --reporter=line
```

Expected: 5 fragment files remain (`auth.html`, `delete.html`, `entry.html`, `feature.html`, `share.html`), build outputs 1135 lines, 18/18 tests pass.

---

## What NOT to do

- **Do NOT attempt v-bind:→: shorthand conversion** — MOD-08 is deferred; any change here risks template regressions and is purely cosmetic
- **Do NOT modify i18n files** — dead `donate:` keys are harmless noise; cleaning them is out of scope
- **Do NOT touch any JS service files** — all services are correctly wired and tested; S03 scope is housekeeping only
- **Do NOT create new tests** — S03 acceptance criteria explicitly says "no new tests"

---

## Risk Assessment

**Low risk overall.** The audit confirms 4 of 5 MOD items were resolved in M002/M004 without their requirement status being updated. The only code change is deleting 7 orphan HTML fragments that are not compiled into the app. The compose smoke test provides automatic verification that the build still works.

The one potential gotcha: the `COMP-02` smoke test (`smoke/compose.spec.js`) checks that `build.sh` produces `site/index.html` identically — it will pass because the deleted files are not included in the build, so the output is unchanged.
