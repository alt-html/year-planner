# M012 parallel-research handoff (captured for S04 planning)

S03 already exported canonical icon assets and `site/icons/matrix.json`.

For S04, wire production references only (no redesign/regeneration):
- Update `.compose/fragments/head.html` icon links to canonical `./icons/*` paths.
- Rebuild `site/index.html` via `bash .compose/build.sh`.
- Update `site/manifest.json` icons to canonical `./icons/pwa-{any,maskable,monochrome}-{192x192,512x512}.png` with explicit `purpose` coverage.
- Add smoke proof that `index.html` + `manifest.json` references are canonical and each referenced file exists.

Recommended verification:
- `npm --prefix .tests run test -- --reporter=line smoke/icon-live-wiring.spec.js`
- `npm --prefix .tests run test -- --reporter=line smoke/compose.spec.js`
- `npm --prefix .tests run test -- --reporter=line smoke/icon-export-matrix.spec.js`
