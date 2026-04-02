---
estimated_steps: 5
estimated_files: 4
skills_used: []
---

# T02: Update tooling references to site/

1. Edit .compose/build.sh: change output from index.html to site/index.html
2. Edit .tests/playwright.config.js: change http-server root from .. to ../site
3. Edit .docker/Dockerfile-nginx-16-alpine: change COPY source from . to site/
4. Edit AGENTS.md: update dev server command
5. Run .compose/build.sh to confirm it writes site/index.html cleanly

## Inputs

- `site/index.html`
- `.compose/build.sh`
- `.tests/playwright.config.js`
- `.docker/Dockerfile-nginx-16-alpine`
- `AGENTS.md`

## Expected Output

- `.compose/build.sh updated`
- `.tests/playwright.config.js updated`
- `.docker/Dockerfile-nginx-16-alpine updated`
- `AGENTS.md updated`
- `site/index.html recomposed`

## Verification

grep 'site/' .compose/build.sh && grep 'site' .tests/playwright.config.js && grep 'site/' .docker/Dockerfile-nginx-16-alpine && ls site/index.html
