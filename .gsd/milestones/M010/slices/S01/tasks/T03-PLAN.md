---
estimated_steps: 3
estimated_files: 1
skills_used: []
---

# T03: Verify smoke tests pass against site/

1. Run full Playwright suite from .tests/
2. Confirm all tests pass
3. Confirm no web-serving files remain at root

## Inputs

- `site/index.html`
- `site/css/`
- `site/js/`
- `.tests/playwright.config.js`

## Expected Output

- `All smoke tests green`
- `Full E2E suite green`

## Verification

cd .tests && npx playwright test smoke/ --reporter=line
