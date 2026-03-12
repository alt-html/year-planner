---
id: S04
parent: M001
milestone: M001
provides:
  - HTML composition pipeline via m4 — 768-line index.html decomposed into 18 fragment files
requires:
  - slice: S03
    provides: Hardened index.html with SRI hashes and XSS fixes
affects: []
key_files:
  - .compose/RESEARCH.md
  - .compose/build.sh
  - .compose/index.html.m4
  - .compose/fragments/modals.html
  - .tests/smoke/compose.spec.js
key_decisions:
  - "Selected m4 over PostHTML, Nunjucks, and nginx SSI — zero install cost, native nesting, POSIX-standard"
  - "Used m4 -P flag to prefix builtins, avoiding collisions with JavaScript's substr/len"
  - "Changed m4 quotes to [[[/]]] to avoid conflicts with backtick and apostrophe in HTML/JS"
  - "Fragments stored in .compose/ hidden directory, matching .docker/.skaffold/.tests/ convention"
patterns_established:
  - ".compose/ directory pattern for build-time HTML assembly"
  - "m4 -P with changequote([[[, ]]])  for safe HTML macro processing"
  - "Nested fragment composition — modals.html includes 11 sub-fragments"
observability_surfaces:
  - "build.sh prints line count of composed output"
  - "compose.spec.js verifies byte-identical output via Playwright test"
drill_down_paths: []
duration: ~20min
verification_result: passed
completed_at: 2026-03-12
---

# S04: HTML Composition

**768-line monolithic index.html decomposed into 18 maintainable fragments via m4, with byte-identical composed output verified by 5 new Playwright tests**

## What Happened

Researched four HTML composition approaches (PostHTML+posthtml-include, Nunjucks, nginx SSI, m4) for decomposing the 768-line `index.html` into manageable fragments. m4 was selected for its zero-dependency footprint (pre-installed on macOS and Linux), native nesting support, and alignment with the project's no-build philosophy.

The implementation uses m4's `-P` (prefix) mode to avoid builtin name collisions with JavaScript (e.g., `substr`), and `changequote([[[, ]])` to prevent m4 from misinterpreting backticks and apostrophes common in HTML/Vue templates.

The `index.html` was decomposed into a `.compose/` directory structure:
- Root template: `index.html.m4` — the composition entry point
- 7 top-level fragments: `head.html`, `spinner.html`, `nav.html`, `grid.html`, `modals.html`, `footer.html`, `scripts.html`
- 11 nested modal fragments in `modals/`: `cookie.html`, `entry.html`, `share.html`, `delete.html`, `settings.html`, `register.html`, `signin.html`, `reset-password.html`, `recover-username.html`, `pay.html`, `feature.html`
- Build script: `.compose/build.sh` — single shell command

The `modals.html` fragment demonstrates nesting: it includes all 11 individual modal fragments, which are assembled into the composed output.

The composed `index.html` is byte-identical to the original — zero changes to the runtime artefact. Docker and Skaffold configurations remain untouched.

## Verification

- **Byte-identical output**: `diff` confirms composed `index.html` matches the original exactly (768 lines)
- **5 new Playwright tests** in `smoke/compose.spec.js`:
  1. Build produces identical `index.html` (round-trip verification)
  2. Fragment directory structure exists with all expected files
  3. `build.sh` is executable
  4. `m4` is available on the system
  5. `modals.html` demonstrates nesting via `m4_include` directives
- **All 14 Playwright tests pass**: 9 pre-existing (E2E + smoke) + 5 new composition tests
- **Docker workflow**: `Dockerfile-nginx-16-alpine` copies project root unchanged
- **Skaffold workflow**: same Dockerfile references, no config changes needed

## Requirements Advanced

- COMP-01 — Research report written at `.compose/RESEARCH.md` with comparison matrix and clear recommendation
- COMP-02 — m4 composition implemented with `.compose/` fragments, build script, and nesting demonstrated through `modals.html` → `modals/*.html`
- COMP-03 — Docker and Skaffold workflows verified unchanged; composed `index.html` is the only runtime artefact

## Requirements Validated

- COMP-01 — Research report covers all four candidates with setup cost, nesting, dev workflow, and no-build alignment criteria
- COMP-02 — 5 Playwright tests verify fragment structure, build idempotency, and nesting
- COMP-03 — All 14 tests pass against composed output; Docker/Skaffold configs untouched

## New Requirements Surfaced

- none

## Requirements Invalidated or Re-scoped

- none

## Deviations

Used m4's `-P` flag (prefix mode) instead of bare `changequote` alone. The original research anticipated only two one-line directives, but JavaScript's `substr()` in Vue templates collided with m4's `substr` builtin. The `-P` flag prefixes all builtins with `m4_`, eliminating all name collisions cleanly.

## Known Limitations

- m4 quote characters `[[[` and `]]]` must not appear literally in any fragment — unlikely but worth noting
- The composition is a manual step: developers must run `.compose/build.sh` after editing fragments; there is no file watcher
- The Playwright test verifies idempotency (build produces same output) but does not enforce that `index.html` was generated from fragments rather than hand-edited

## Follow-ups

- none

## Files Created/Modified

- `.compose/RESEARCH.md` — comparison report of four composition tools
- `.compose/build.sh` — shell script that runs `m4 -P` to compose `index.html`
- `.compose/index.html.m4` — root m4 template with include directives
- `.compose/fragments/head.html` — `<head>` section (meta, CSS, CDN scripts)
- `.compose/fragments/spinner.html` — loading spinner
- `.compose/fragments/nav.html` — navbar with dropdowns and buttons
- `.compose/fragments/grid.html` — year grid / calendar `<main>` section
- `.compose/fragments/modals.html` — composite fragment that includes 11 modal sub-fragments (nesting)
- `.compose/fragments/modals/cookie.html` — cookie consent modal
- `.compose/fragments/modals/entry.html` — entry editing modal
- `.compose/fragments/modals/share.html` — share URL modal
- `.compose/fragments/modals/delete.html` — delete planner confirmation modal
- `.compose/fragments/modals/settings.html` — profile/settings modal
- `.compose/fragments/modals/register.html` — registration modal
- `.compose/fragments/modals/signin.html` — sign-in modal
- `.compose/fragments/modals/reset-password.html` — password reset modal
- `.compose/fragments/modals/recover-username.html` — username recovery modal
- `.compose/fragments/modals/pay.html` — donation/payment modal
- `.compose/fragments/modals/feature.html` — feature toggles modal
- `.compose/fragments/footer.html` — footer with language selector and credits
- `.compose/fragments/scripts.html` — bottom script tags (jQuery, Popper, Bootstrap, main.js)
- `.tests/smoke/compose.spec.js` — 5 Playwright tests verifying composition

## Forward Intelligence

### What the next slice should know
- The `.compose/` directory is a build-time concern only. The committed `index.html` at the project root is the runtime artefact — Docker/Skaffold/http-server all serve it directly.
- m4 requires the `-P` flag to avoid JavaScript builtin name collisions. Never run without it.

### What's fragile
- The `changequote([[[, ]]])` directive — if any future HTML content contains literal `[[[` or `]]]`, m4 will misinterpret it. This is extremely unlikely but worth noting.
- Fragment ordering in `modals.html` matters for the diff — reordering will change the composed output.

### Authoritative diagnostics
- `.compose/build.sh` output — prints line count, confirming assembly worked
- `npx playwright test smoke/compose.spec.js` — the composition round-trip test is the single authoritative signal

### What assumptions changed
- Originally assumed `changequote` alone would suffice — JavaScript's `substr()` proved that `-P` prefix mode is essential for safe m4 processing of HTML with embedded JS.
