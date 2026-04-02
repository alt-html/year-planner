# S02: StorageLocal full rewrite — UAT

**Milestone:** M009
**Written:** 2026-03-28T12:28:35.912Z

## UAT — S02: StorageLocal full rewrite\n\n### Manual checks\n1. Open app, create an entry on a day — inspect localStorage in DevTools\n   - Expected: key `plnr:{uuid}` exists with `{ meta: {...}, days: { 'YYYY-MM-DD': { tp, tl, col, notes, emoji } } }`\n   - Expected: key `rev:{uuid}` exists with dot-path HLC entries\n   - Expected: no keys like `1234567890-20261` (old schema)\n2. Create a second planner — two `plnr:*` keys should exist\n3. Reload page — all entries preserved\n\n### Automated\n- `cd .tests && npx playwright test` — 15 passed"
