# S04: HTML Composition — UAT

**Milestone:** M001
**Written:** 2026-03-12

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: HTML composition is a build-time tool that produces a static artifact (`index.html`). The test is whether the composed output is identical to the original. No runtime behaviour changes.

## Preconditions

- macOS or Linux with `m4` installed (standard on both)
- Node.js and Playwright installed in `.tests/`

## Smoke Test

Run `.compose/build.sh` and verify it exits cleanly with a line count message. Then run `diff` between the composed output and a known-good `index.html` — the diff should be empty.

## Test Cases

### 1. Composition produces identical output

1. Run `.compose/build.sh`
2. **Expected:** Exit code 0, prints "✓ index.html composed from .compose/ fragments (768 lines)"

### 2. Fragment directory structure is complete

1. List files in `.compose/fragments/` and `.compose/fragments/modals/`
2. **Expected:** 7 top-level fragments and 11 modal sub-fragments exist

### 3. Nesting is demonstrated

1. Read `.compose/fragments/modals.html`
2. **Expected:** Contains `m4_include` directives referencing files in `modals/` subdirectory

### 4. All existing tests pass against composed output

1. Run `cd .tests && npx playwright test`
2. **Expected:** All 14 tests pass (9 pre-existing + 5 new composition tests)

### 5. Build is idempotent

1. Run `.compose/build.sh` twice in succession
2. **Expected:** Second run produces identical output to first (no drift)

## Edge Cases

### Fragment with JavaScript substr()

1. Verify `grid.html` contains `.substr(0,20)` and `.substr(20)` calls
2. Run `.compose/build.sh`
3. **Expected:** `substr` is preserved in output (not eaten by m4), thanks to `-P` flag

## Failure Signals

- `.compose/build.sh` exits with non-zero status
- Composed `index.html` differs from expected (blank lines missing, content stripped)
- m4 warnings about "too few arguments to builtin" (indicates `-P` flag is missing)
- Any of the 14 Playwright tests fail

## Requirements Proved By This UAT

- COMP-01 — Research report exists at `.compose/RESEARCH.md` with all four candidates evaluated
- COMP-02 — Build script assembles `index.html` from fragments; nesting demonstrated via `modals.html` including `modals/*.html`
- COMP-03 — All E2E tests pass against composed output; Docker/Skaffold configs unchanged

## Not Proven By This UAT

- Docker image build and serve (requires Docker daemon — tested via existing `.docker/bin/build` and `.docker/bin/run`)
- Skaffold/Minikube deployment (requires Kubernetes cluster)
- That fragments are easier to maintain than the monolithic file (subjective, not automatable)

## Notes for Tester

- The `.compose/` directory follows the project's hidden-directory convention (`.docker/`, `.skaffold/`, `.tests/`).
- m4 is pre-installed on macOS (`/usr/bin/m4`) and all Linux distros — no npm dependency needed.
- The compose step is manual: run `.compose/build.sh` after editing any fragment. There is no file watcher.
