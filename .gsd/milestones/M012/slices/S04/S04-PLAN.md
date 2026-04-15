# S04: Live Web/PWA Wiring

**Goal:** Fulfil R004 by wiring S03’s canonical icon exports into live web/PWA entrypoints (`site/index.html` via compose and `site/manifest.json`) with deterministic smoke-proof that every referenced icon resolves on disk.
**Demo:** Year Planner serves and references the new selected assets in index.html and manifest.json.

## Must-Haves

- `.compose/fragments/head.html` references `./icons/favicon-16x16.png`, `./icons/favicon-32x32.png`, and `./icons/apple-touch-icon-180x180.png`.
- `site/index.html` is regenerated via `bash .compose/build.sh` (no hand edits) and contains the canonical `./icons/*` links.
- `site/manifest.json` `icons[]` is rewired to canonical `./icons/pwa-{any,maskable,monochrome}-{192x192,512x512}.png` entries with correct `purpose` coverage.
- A new smoke contract test (`.tests/smoke/icon-live-wiring.spec.js`) verifies production references and on-disk reachability for all linked icon assets.
- Regression checks stay green for compose parity and export matrix contract (`smoke/compose.spec.js`, `smoke/icon-export-matrix.spec.js`).

## Threat Surface

- **Abuse**: Main abuse path is path regression/tampering (reintroducing legacy root icon paths or malformed manifest entries) that can silently ship stale branding.
- **Data exposure**: None; only public static icon paths are handled, with no credentials, PII, or tokens.
- **Input trust**: Treat `site/icons/matrix.json`, `.compose/fragments/head.html`, and `site/manifest.json` as mutable repo inputs; verification must fail closed when expected canonical paths are absent or unresolved.

## Requirement Impact

- **Requirements touched**: `R004` (direct owner) and supporting evidence surface for `R006`.
- **Re-verify**: `smoke/icon-live-wiring.spec.js`, `smoke/compose.spec.js`, and `smoke/icon-export-matrix.spec.js` must pass together after rewiring.
- **Decisions revisited**: `D017` contract is consumed directly (matrix output paths become production references); no new architectural decision is introduced.

## Proof Level

- This slice proves: integration

## Integration Closure

- Upstream surfaces consumed: `site/icons/matrix.json`, `.compose/fragments/head.html`, `site/manifest.json`, and S03 export outputs under `site/icons/`.
- New wiring introduced in this slice: production head-tag icon links and manifest icon registry now point to canonical `./icons/*` assets.
- What remains before end-to-end milestone closure: S05 desktop packaging (`.ico`/`.icns`) and S06 integrated verification/visual spot checks.

## Verification

- `bash .compose/build.sh`
- `npm --prefix .tests run test -- --reporter=line smoke/icon-live-wiring.spec.js`
- `npm --prefix .tests run test -- --reporter=line smoke/compose.spec.js smoke/icon-export-matrix.spec.js`
- `node -e "const fs=require('fs');const m=JSON.parse(fs.readFileSync('site/manifest.json','utf8'));if(!Array.isArray(m.icons)||m.icons.length!==6)process.exit(1);"`

## Tasks

- [x] **T01: Wire composed head + manifest to canonical icon matrix outputs** `est:45m`
  Why: This is the core R004 integration step. Do: rewire compose head links and manifest icon entries to canonical `./icons/*` outputs from `site/icons/matrix.json`, then regenerate composed HTML and validate structural coverage. Done when: `site/index.html` (from compose) and `site/manifest.json` contain the full canonical mapping (head 3 links + manifest 6 purpose entries).

## Steps

1. Update `.compose/fragments/head.html` icon tags (`apple-touch-icon`, favicon 32/16) to canonical `./icons/*` targets published by S03.
2. Update `site/manifest.json` `icons[]` to the six canonical PWA outputs (`any`, `maskable`, `monochrome` × `192/512`) with explicit `purpose` values.
3. Regenerate `site/index.html` using `bash .compose/build.sh` and confirm no manual generated-file drift.
4. Run a structural validation command that checks expected canonical tokens in both `site/index.html` and `site/manifest.json`.

## Must-Haves

- [ ] Compose source (`.compose/fragments/head.html`) — not generated `site/index.html` — is the edit point for head icon wiring.
- [ ] `site/manifest.json` contains six canonical icon entries with full `any`/`maskable`/`monochrome` coverage at `192x192` and `512x512`.
  - Files: `.compose/fragments/head.html`, `site/manifest.json`, `.compose/build.sh`, `site/index.html`, `site/icons/matrix.json`
  - Verify: bash .compose/build.sh && node -e "const fs=require('fs');const index=fs.readFileSync('site/index.html','utf8');['./icons/apple-touch-icon-180x180.png','./icons/favicon-32x32.png','./icons/favicon-16x16.png'].forEach(p=>{if(!index.includes(p))throw new Error('missing index ref '+p)});const m=JSON.parse(fs.readFileSync('site/manifest.json','utf8'));const expected=['./icons/pwa-any-192x192.png','./icons/pwa-any-512x512.png','./icons/pwa-maskable-192x192.png','./icons/pwa-maskable-512x512.png','./icons/pwa-monochrome-192x192.png','./icons/pwa-monochrome-512x512.png'];expected.forEach(src=>{if(!m.icons.some(i=>i.src===src))throw new Error('missing manifest ref '+src)});"

- [x] **T02: Add live wiring smoke contract and run targeted regression checks** `est:55m`
  Why: Wiring is only complete when tests prove production references are correct and every referenced icon is reachable. Do: add a dedicated smoke contract for canonical-path assertions, file reachability, purpose coverage, and legacy-path regression guards, then run targeted regressions. Done when: the new smoke spec and compose/export regressions pass together and failures pinpoint exact missing/stale paths.

## Steps

1. Create `.tests/smoke/icon-live-wiring.spec.js` to assert canonical icon references in `site/index.html` and `site/manifest.json`.
2. In the same test file, assert each referenced icon path exists on disk and that manifest purpose coverage includes `any`, `maskable`, and `monochrome` at `192` and `512`.
3. Add negative-boundary checks that fail if legacy root-level icon paths are reintroduced for head links or manifest entries.
4. Run the new smoke test with `smoke/compose.spec.js` and `smoke/icon-export-matrix.spec.js` to prove wiring + compose parity + upstream export contract remain intact.

## Must-Haves

- [ ] `.tests/smoke/icon-live-wiring.spec.js` exists with real assertions over `site/index.html`, `site/manifest.json`, and referenced-file existence.
- [ ] The spec fails on legacy paths (e.g. `./favicon-32x32.png`, `/android-chrome-192x192.png`) and passes with canonical `./icons/*` wiring.
  - Files: `.tests/smoke/icon-live-wiring.spec.js`, `site/index.html`, `site/manifest.json`, `.tests/smoke/compose.spec.js`, `.tests/smoke/icon-export-matrix.spec.js`, `site/icons/matrix.json`
  - Verify: npm --prefix .tests run test -- --reporter=line smoke/icon-live-wiring.spec.js smoke/compose.spec.js smoke/icon-export-matrix.spec.js

## Files Likely Touched

- .compose/fragments/head.html
- site/manifest.json
- .compose/build.sh
- site/index.html
- site/icons/matrix.json
- .tests/smoke/icon-live-wiring.spec.js
- .tests/smoke/compose.spec.js
- .tests/smoke/icon-export-matrix.spec.js
