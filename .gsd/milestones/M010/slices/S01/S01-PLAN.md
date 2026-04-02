# S01: Move assets to site/ and update tooling

**Goal:** Move index.html, css/, js/, manifest.json, and all icon/favicon files into site/. Update .compose/build.sh output target, Playwright webServer root, Docker COPY source, and AGENTS.md dev server command. Verify with smoke tests.
**Demo:** After this: After this: .compose/build.sh writes site/index.html, all Playwright smoke tests pass served from site/.

## Tasks
- [x] **T01: Created site/ and moved all web assets (index.html, css/, js/, manifest.json, 6 icon/favicon files) via git mv** — 1. mkdir site/
2. git mv index.html site/index.html
3. git mv css site/css
4. git mv js site/js
5. git mv manifest.json site/manifest.json
6. git mv android-chrome-192x192.png site/
7. git mv android-chrome-512x512.png site/
8. git mv apple-touch-icon.png site/
9. git mv favicon-16x16.png site/
10. git mv favicon-32x32.png site/
11. git mv favicon.ico site/
12. Confirm site/ tree looks correct
  - Estimate: 5min
  - Files: site/
  - Verify: find site/ -maxdepth 2 | sort
- [x] **T02: Updated .compose/build.sh, playwright.config.js, Dockerfile, AGENTS.md, and compose.spec.js to target site/** — 1. Edit .compose/build.sh: change output from index.html to site/index.html
2. Edit .tests/playwright.config.js: change http-server root from .. to ../site
3. Edit .docker/Dockerfile-nginx-16-alpine: change COPY source from . to site/
4. Edit AGENTS.md: update dev server command
5. Run .compose/build.sh to confirm it writes site/index.html cleanly
  - Estimate: 5min
  - Files: .compose/build.sh, .tests/playwright.config.js, .docker/Dockerfile-nginx-16-alpine, AGENTS.md
  - Verify: grep 'site/' .compose/build.sh && grep 'site' .tests/playwright.config.js && grep 'site/' .docker/Dockerfile-nginx-16-alpine && ls site/index.html
- [x] **T03: All 16 Playwright tests pass with app served from site/** — 1. Run full Playwright suite from .tests/
2. Confirm all tests pass
3. Confirm no web-serving files remain at root
  - Estimate: 5min
  - Files: .tests/
  - Verify: cd .tests && npx playwright test smoke/ --reporter=line
