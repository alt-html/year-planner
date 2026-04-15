# M012/S04 — Research

**Date:** 2026-04-16

## Summary

S03 already delivered the canonical C2 export set and deterministic mapping contract in `site/icons/matrix.json` (9 entries covering web favicon, iOS touch icon, and PWA any/maskable/monochrome variants). The wiring gap for S04 is now explicit: production app surfaces still reference legacy root-level assets, not the canonical exported paths.

Current live references are in `.compose/fragments/head.html` (composed into `site/index.html`) and `site/manifest.json`. Both currently point to legacy root files (`./favicon-*.png`, `./apple-touch-icon.png`, `/android-chrome-*.png`). Exported canonical files exist under `site/icons/*` and are already validated by `icon-export-matrix` smoke tests, but no test currently proves that app surfaces (`index.html` + `manifest.json`) actually reference those exported files.

Primary recommendation: implement S04 as pure wiring (no asset redesign/regeneration logic changes), with compose-source edits first, manifest update second, and a new smoke test that validates production references and on-disk reachability against the exported asset set.

## Recommendation

Wire `index.html` and `manifest.json` directly to `site/icons/*` outputs from `site/icons/matrix.json`, preserving the static-file model and existing test harness style (filesystem-first smoke tests).

Concretely:
- Update `.compose/fragments/head.html` icon links to `./icons/favicon-16x16.png`, `./icons/favicon-32x32.png`, `./icons/apple-touch-icon-180x180.png`.
- Recompose `site/index.html` via `.compose/build.sh` (do not hand-edit generated output).
- Update `site/manifest.json` `icons[]` to point at `./icons/pwa-...` entries, including explicit `purpose` values (`any`, `maskable`, `monochrome`) for 192/512.
- Add a focused smoke spec to verify:
  1) production references are correct,
  2) every referenced file exists,
  3) manifest purpose coverage matches expected tokens.

This keeps S04 scoped to R004 wiring and gives S06/R006 a stable verification surface without introducing new infra.

## Implementation Landscape

### Key Files

- `site/icons/matrix.json` — canonical source-of-truth for exported file locations from S03; use for mapping, not hardcoded guesses.
- `.compose/fragments/head.html` — source-of-truth for icon link tags in page head; must be edited instead of `site/index.html` directly.
- `.compose/build.sh` — composes `site/index.html`; required step after head fragment changes.
- `site/index.html` — generated production artifact consumed by deployment; should only change via compose build.
- `site/manifest.json` — PWA icon registry; currently legacy `/android-chrome-*` references with no purpose metadata.
- `.tests/smoke/icon-export-matrix.spec.js` — existing S03 proof that exported files are structurally valid; keep unchanged as upstream contract.
- `.tests/smoke/compose.spec.js` — protects compose contract (`site/index.html` must match compose output).
- `mockups/icon-comparison.html` — contains legacy “current shipped” root favicon references for mockup comparison only; non-production surface.

### Build Order

1. **Confirm export contract is present and stable**
   - Verify `site/icons/matrix.json` and `site/icons/*` files exist (from S03).
   - Optional refresh: run exporter once if asset freshness is uncertain.

2. **Update compose source for head icon wiring**
   - Edit `.compose/fragments/head.html` icon link hrefs to canonical `./icons/*` targets.

3. **Regenerate production HTML**
   - Run `.compose/build.sh` to regenerate `site/index.html`.
   - Avoid direct edits to generated HTML to keep `compose.spec` green.

4. **Update manifest icon entries**
   - Replace legacy `/android-chrome-*` entries with canonical `./icons/pwa-...` entries.
   - Include both sizes (192, 512) across all required purposes (`any`, `maskable`, `monochrome`).

5. **Add focused wiring/reachability smoke coverage**
   - New smoke test should parse `site/index.html` + `site/manifest.json` and assert referenced icon files exist on disk.

6. **Run targeted verification + smoke regression**
   - Run new wiring test, matrix contract test, and compose smoke test together.

### Verification Approach

**Commands**

- Export contract sanity (if needed):
  - `bash scripts/export-canonical-icon-matrix.sh`
- Focused S04 wiring verification:
  - `cd .tests && npx playwright test smoke/icon-live-wiring.spec.js --reporter=line`
- Compose integrity check:
  - `cd .tests && npx playwright test smoke/compose.spec.js --reporter=line`
- Upstream matrix contract check (S03 regression guard):
  - `cd .tests && npx playwright test smoke/icon-export-matrix.spec.js --reporter=line`
- Optional boot sanity after rewiring:
  - `cd .tests && npx playwright test smoke/harness.spec.js --reporter=line`

**Observable checks**

- `site/index.html` contains only canonical icon hrefs under `./icons/` for apple-touch + 16/32 favicon links.
- `site/manifest.json` `icons[]` references canonical `./icons/pwa-*` files with correct size and purpose coverage.
- Every referenced icon path resolves to an existing file under `site/icons/`.
- No compose drift: `compose.spec` remains green after rewiring.

## Constraints

- Static-file deployment model: no bundler/runtime asset rewriting; paths must be correct at rest in `site/`.
- `site/index.html` is generated from `.compose/`; direct edits create guaranteed drift/failure.
- S04 scope is wiring only; icon redesign/regeneration strategy changes are out of scope.
- Existing harness preference in this repo is filesystem-first smoke assertions for asset contracts.

## Common Pitfalls

- **Editing `site/index.html` directly** — will fail compose parity and invite drift; edit `.compose/fragments/head.html` then rebuild.
- **Partial wiring (head updated, manifest not updated)** — leads to mixed legacy/canonical surfaces and incomplete R004 closure.
- **Manifest purpose under-specification** — omitting `maskable`/`monochrome` defeats S03 purpose-specific exports and weakens R006 evidence.
- **Assuming export tests imply live wiring** — `icon-export-matrix.spec.js` validates exports only; add explicit wiring checks for production references.

## Open Risks

- Legacy root icon files (`site/favicon-*.png`, `site/apple-touch-icon.png`, `site/android-chrome-*.png`) will still exist unless explicitly cleaned or replaced; this can hide stale usage if tests check only file existence and not reference paths.
- Browser fallback request to `/favicon.ico` may still surface legacy branding on some surfaces until S05 introduces canonical `.ico` packaging path.
