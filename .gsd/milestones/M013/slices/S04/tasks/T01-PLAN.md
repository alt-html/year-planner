---
estimated_steps: 28
estimated_files: 3
skills_used: []
---

# T01: Create unified M013 verification runner and wire it into CI

Why: S04’s core deliverable is a single, non-divergent verification entrypoint. Without it, local runs and CI can drift and allow partial proof to pass unnoticed.

## Skills Used
- `test`
- `github-workflows`

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `scripts/verify-no-legacy-uid.sh`, `scripts/verify-no-url-state-params.sh`, `scripts/verify-no-legacy-share-features.sh` | Halt immediately, mark stage `fail` in report, and return non-zero. | N/A (short local scripts) | Capture raw output in stage context and fail the run. |
| Playwright smoke+e2e command (`npm --prefix .tests run test -- --reporter=line e2e/ smoke/`) | Halt run, report failing stage/exit code, preserve earlier stage results. | Mark stage as timeout/fail and exit non-zero. | Fail stage if test runner output cannot be interpreted as pass/fail. |
| GitHub Actions workflow step in `.github/workflows/e2e.yml` | CI job fails loudly; no fallback path to partial verification. | CI timeout fails job and keeps verifier logs for triage. | Keep verifier invocation as a plain shell command to avoid YAML expression ambiguity. |

## Load Profile

- **Shared resources**: Playwright browser runtime and CI compute minutes.
- **Per-operation cost**: 3 grep gates + full smoke/e2e run + report write.
- **10x breakpoint**: test runtime duration before compute saturation; stage ordering should fail fast on grep gates before expensive browser tests.

## Negative Tests

- **Malformed inputs**: missing verifier script path or report directory should fail with explicit stage error.
- **Error paths**: any failing gate/test command must stop the pipeline and set `failedStage` in report JSON.
- **Boundary conditions**: all stages passing yields exit 0 and a non-empty JSON report artifact.

## Steps
1. Create `scripts/verify-m013-cleanup.sh` as an ordered stage runner: run the three existing grep gates first, then run full smoke+e2e Playwright command.
2. Add structured reporting in the script (`.tests/test-results/m013-cleanup/M013-cleanup-report.json`) including stage name, command, exit code, verdict, timestamp, and optional `failedStage`.
3. Ensure the script is executable and fails fast (non-zero) on first failing stage while still writing the report.
4. Add `.tests/package.json` script alias (for example `test:m013-cleanup`) that calls the new verifier.
5. Update `.github/workflows/e2e.yml` to invoke the unified verifier entrypoint instead of a raw Playwright-only command.

## Must-Haves
- [ ] Unified verifier covers all required M013 gates plus smoke+e2e in one command.
- [ ] JSON report artifact is always written and includes stage-level verdicts.
- [ ] CI runs the same verifier entrypoint used locally.

## Inputs

- `scripts/verify-no-legacy-uid.sh`
- `scripts/verify-no-url-state-params.sh`
- `scripts/verify-no-legacy-share-features.sh`
- `.github/workflows/e2e.yml`
- `.tests/package.json`

## Expected Output

- `scripts/verify-m013-cleanup.sh`
- `.github/workflows/e2e.yml`
- `.tests/package.json`

## Verification

bash -lc 'bash -n scripts/verify-m013-cleanup.sh && test -x scripts/verify-m013-cleanup.sh && rg -n "verify-m013-cleanup\\.sh|test:m013-cleanup" .tests/package.json .github/workflows/e2e.yml'

## Observability Impact

Stage-level JSON reporting is introduced for milestone verification runs; failures become inspectable via `failedStage` and per-stage exit codes.
