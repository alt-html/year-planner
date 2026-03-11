# TESTING.md — Test Structure & Practices

## Current State

**No testing infrastructure exists in this project.**

- No test runner configured (no Jest, Vitest, Mocha, etc.)
- No test files anywhere in the codebase
- No `package.json` (vanilla JS with CDN libraries — no npm ecosystem)
- No CI pipeline for automated tests

## What Would Need Testing

If tests were added, the highest-value areas are:

### Unit Tests
- `js/service/StorageLocal.js` — cookie/localStorage serialization and deserialization logic
- `js/vue/controller.js` — planner CRUD operations, entry editing, year navigation
- `js/service/Api.js` — HTTP response handling (status codes, error paths)
- `js/util/urlparam.js` — URL parameter parsing and share link encoding/decoding

### Integration Tests
- Auth flow: register → signin → sync → signout
- Storage round-trip: create planner locally → register → sync to remote → fetch back
- Share link: encode planner → decode via URL param → render correctly

### E2E / Browser Tests
- Calendar rendering for a given year (correct days, months, weeks)
- Entry creation, editing, and deletion
- Theme switching (light/dark)
- Multi-planner management (create, rename, delete, switch)
- Language switching (i18n)

## Adding Tests

To add tests to this project, a build step would need to be introduced (e.g., Vitest with native ES module support), or tests written as browser-runnable scripts. The CDI dependency injection pattern makes unit testing feasible if dependencies are manually constructed rather than resolved by the container.
