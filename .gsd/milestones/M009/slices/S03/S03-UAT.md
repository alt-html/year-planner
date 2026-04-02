# S03: One-time migration from old schema — UAT

**Milestone:** M009
**Written:** 2026-03-28T12:53:50.515Z

## UAT — S03: One-time migration\n\n### Manual check\n1. Open DevTools, set localStorage: `localStorage.setItem('0', '[{\"0\":1000000,\"1\":\"agent\",\"2\":0,\"3\":0}]')` and a month key `localStorage.setItem('1000000-20261', '{\"15\":{\"0\":0,\"1\":\"test\",\"2\":1}}')`\n2. Reload page\n3. Verify: `'0'` key gone, `dev` key present, `plnr:*` key present with `days['2026-01-15'].tl === 'test'`\n\n### Automated\n- `cd .tests && npx playwright test` — 16 passed"
