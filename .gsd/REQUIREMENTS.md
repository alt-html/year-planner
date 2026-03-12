# Requirements

## Active

## Validated

### TEST-01 — Playwright test harness configured in `.tests/` (hidden directory, follows `.docker/` / `.skaffold/` convention), with its own `package.json` — no root-level `package.json` introduced

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S01

### TEST-02 — Playwright `webServer` config auto-starts `http-server` serving the project root before tests run; port aligns with existing Docker/Skaffold port (8080)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S01

### TEST-03 — Vue app emits a `data-app-ready` attribute on mount (added to `Application.js` or `app.js`) so tests can wait for CDI initialisation before interacting

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S01

### TEST-04 — `beforeEach` helper clears browser storage and accepts the cookie consent modal, establishing a clean test baseline for every spec

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S01

### E2E-01 — App boot smoke test — page loads, year grid renders with correct month columns and day rows for the current year

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S02

### E2E-02 — Entry CRUD — user can click a calendar cell, type an entry, save it, see it persist on the grid, edit it, and delete it

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S02

### E2E-03 — Planner management — user can create a new named planner, rename it, switch between planners, and delete one

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S02

### SEC-01 — `polyfill.io` script tag removed from `index.html` (supply-chain risk; all polyfilled features natively supported in modern browsers)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S03

### SEC-02 — Remaining feasible CDN `<script>` and `<link>` tags pinned to exact patch versions and annotated with `integrity` + `crossorigin` SRI attributes; a `generate-sri.mjs` script in `.tests/` or `.scripts/` automates hash regeneration when versions change

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S03

### SEC-03 — Bootstrap tooltip XSS fixed — `data-html="true"` + user entry text in `data-original-title` removed or sanitised; entry text rendered via text-only tooltip attribute or moved out of `v-html` context

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S03

### SEC-04 — Network and sync errors surfaced to the user via visible UI feedback (e.g. toast or inline message) rather than silent promise rejection

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S03

### COMP-01 — Research report comparing PostHTML+posthtml-include, Nunjucks, nginx SSI, and m4 for composing `index.html` from nested fragments — covering setup cost, nesting capability, dev workflow impact, and alignment with the no-build philosophy

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S04

Research report written at `.compose/RESEARCH.md`. m4 recommended and selected due to zero install cost, native nesting, and alignment with no-build philosophy.

### COMP-02 — Chosen composition tool implemented: `index.html` decomposed into a `.compose/` fragment directory; a build script (or npm script in `.tests/`) assembles them into the committed `index.html`; nesting (one fragment including another) demonstrated

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S04

m4 with `-P` flag implemented. `.compose/build.sh` assembles fragments. `modals.html` includes 11 sub-fragments in `.compose/fragments/modals/`, demonstrating nesting. Composed output is byte-identical to the original `index.html`. Verified by Playwright tests.

### COMP-03 — Existing Docker and Skaffold workflows unchanged — the composed `index.html` at the project root continues to be the single runtime artefact

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S04

The composed `index.html` at the project root is the only runtime artefact. Docker and Skaffold configurations are untouched. All 14 Playwright tests pass against the composed output.

## Deferred

## Out of Scope
