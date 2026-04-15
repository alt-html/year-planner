---
estimated_steps: 9
estimated_files: 5
skills_used:
  - best-practices
  - test
---

# T01: Wire composed head + manifest to canonical icon matrix outputs

Why: This is the core R004 integration step. Do: rewire compose head links and manifest icon entries to canonical `./icons/*` outputs from `site/icons/matrix.json`, then regenerate composed HTML and validate structural coverage. Done when: `site/index.html` (from compose) and `site/manifest.json` contain the full canonical mapping (head 3 links + manifest 6 purpose entries).

## Steps

1. Update `.compose/fragments/head.html` icon tags (`apple-touch-icon`, favicon 32/16) to canonical `./icons/*` targets published by S03.
2. Update `site/manifest.json` `icons[]` to the six canonical PWA outputs (`any`, `maskable`, `monochrome` × `192/512`) with explicit `purpose` values.
3. Regenerate `site/index.html` using `bash .compose/build.sh` and confirm no manual generated-file drift.
4. Run a structural validation command that checks expected canonical tokens in both `site/index.html` and `site/manifest.json`.

## Must-Haves

- [ ] Compose source (`.compose/fragments/head.html`) — not generated `site/index.html` — is the edit point for head icon wiring.
- [ ] `site/manifest.json` contains six canonical icon entries with full `any`/`maskable`/`monochrome` coverage at `192x192` and `512x512`.

## Inputs

- `site/icons/matrix.json`
- `.compose/fragments/head.html`
- `site/manifest.json`
- `.compose/build.sh`
- `.gsd/REQUIREMENTS.md`
- `.gsd/DECISIONS.md`

## Expected Output

- `.compose/fragments/head.html`
- `site/manifest.json`
- `site/index.html`

## Verification

bash .compose/build.sh && node -e "const fs=require('fs');const index=fs.readFileSync('site/index.html','utf8');['./icons/apple-touch-icon-180x180.png','./icons/favicon-32x32.png','./icons/favicon-16x16.png'].forEach(p=>{if(!index.includes(p))throw new Error('missing index ref '+p)});const m=JSON.parse(fs.readFileSync('site/manifest.json','utf8'));const expected=['./icons/pwa-any-192x192.png','./icons/pwa-any-512x512.png','./icons/pwa-maskable-192x192.png','./icons/pwa-maskable-512x512.png','./icons/pwa-monochrome-192x192.png','./icons/pwa-monochrome-512x512.png'];expected.forEach(src=>{if(!m.icons.some(i=>i.src===src))throw new Error('missing manifest ref '+src)});"

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `.compose/build.sh` / `m4` compose pipeline | Fail task immediately; fix compose syntax/path refs before proceeding. | N/A (local command); treat hangs as infra issue and stop. | N/A |
| `site/icons/matrix.json` canonical contract | Do not guess filenames; block wiring until matrix paths are readable and explicit. | N/A | Reject missing/invalid entries and fail with actionable message listing missing icon mapping(s). |
| `site/manifest.json` JSON structure | Fail fast on parse/shape errors. | N/A | Reject icons entries lacking required `src/sizes/type/purpose` tokens for PWA variants. |

## Load Profile

- **Shared resources**: local filesystem writes to `site/index.html` and `site/manifest.json`; compose subprocess execution.
- **Per-operation cost**: one compose run plus static JSON/HTML validation checks.
- **10x breakpoint**: failure risk comes from path drift, not throughput; repeated runs increase CI time but not complexity.

## Negative Tests

- **Malformed inputs**: detect missing required canonical href/src tokens in generated `site/index.html` and `site/manifest.json`.
- **Error paths**: fail if compose does not regenerate output or if manifest JSON is invalid.
- **Boundary conditions**: assert exactly six manifest icon entries for any/maskable/monochrome across 192/512, with no required entry missing.
