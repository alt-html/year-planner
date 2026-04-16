# S04: Verification Hardening & Requirement Closure

**Goal:** Harden milestone-level regression proof into one repeatable gate, then close remaining requirement debt with explicit evidence that uid/query/share/feature legacy contracts are gone.
**Demo:** After this: full smoke+e2e and new M013 gates pass, with explicit proof that legacy uid/query/share/feature contracts are gone.

## Must-Haves

- A single repo-level verifier (`scripts/verify-m013-cleanup.sh`) runs all three legacy grep gates plus full Playwright smoke+e2e coverage and exits non-zero on the first failing stage.
- Verification emits a durable artifact (`.tests/test-results/m013-cleanup/M013-cleanup-report.json`) that records stage verdicts and failing stage context for fast diagnosis.
- CI uses the same verifier entrypoint so local and CI proof paths cannot drift.
- R007 is moved from `active` to `validated` with concrete closure evidence; R109 validation text is refreshed to include final S04 integrated proof.
- **Threat Surface — Abuse**: a contributor could try to bypass one gate by running only partial tests; mitigation is a single orchestrator script used in both local and CI paths.
- **Threat Surface — Data exposure**: no new user data surfaces are introduced; artifacts contain only command/stage metadata and test verdicts.
- **Threat Surface — Input trust**: script consumes repository source and test output only; both are treated as untrusted and surfaced as plain text diagnostics.
- **Requirement Impact — Requirements touched**: `R007` (primary close-out), `R109` (final proof hardening), with integrated re-verification of `R103`-`R108`.
- **Requirement Impact — Re-verify**: all smoke+e2e specs plus `verify-no-legacy-uid.sh`, `verify-no-url-state-params.sh`, and `verify-no-legacy-share-features.sh` in one run.
- **Requirement Impact — Decisions revisited**: `D021`, `D022`, `D023`, `D024`, `D025` stay in force; this slice verifies they remain true in runtime behavior.
- **Slice verification commands**: `bash scripts/verify-m013-cleanup.sh`; `test -s .tests/test-results/m013-cleanup/M013-cleanup-report.json`; `rg -n "### R007|### R109|Status: validated|verify-m013-cleanup.sh" .gsd/REQUIREMENTS.md`.

## Proof Level

- This slice proves: final-assembly

## Integration Closure

- Upstream surfaces consumed: `scripts/verify-no-legacy-uid.sh`, `scripts/verify-no-url-state-params.sh`, `scripts/verify-no-legacy-share-features.sh`, Playwright suites under `.tests/e2e` and `.tests/smoke`, and current CI workflow `.github/workflows/e2e.yml`.
- New wiring introduced in this slice: one orchestrator verification script and CI workflow invocation path that standardizes milestone proof execution.
- What remains before the milestone is truly usable end-to-end: nothing; this is the milestone closure slice once gates and requirement updates are complete.

## Verification

- Runtime signals: stage-level pass/fail entries and `failedStage` in the JSON verification report.
- Inspection surfaces: verifier stdout, `.tests/test-results/m013-cleanup/M013-cleanup-report.json`, CI job logs, and `.gsd/REQUIREMENTS.md` status lines for R007/R109.
- Failure visibility: first failing command and exit code are captured explicitly, avoiding ambiguous partial-run failures.
- Redaction constraints: report must never print auth tokens or localStorage payload contents; only gate/test metadata is allowed.

## Tasks

- [x] **T01: Create unified M013 verification runner and wire it into CI** `est:1h10m`
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
  - Files: `scripts/verify-m013-cleanup.sh`, `.github/workflows/e2e.yml`, `.tests/package.json`
  - Verify: bash -lc 'bash -n scripts/verify-m013-cleanup.sh && test -x scripts/verify-m013-cleanup.sh && rg -n "verify-m013-cleanup\\.sh|test:m013-cleanup" .tests/package.json .github/workflows/e2e.yml'

- [ ] **T02: Run integrated gate and close requirement debt (R007/R109 evidence refresh)** `est:55m`
  Why: The slice is not complete until integrated proof is green and requirement debt is formally closed in the registry with concrete, reproducible evidence.

## Skills Used
- `test`
- `technical-writing`

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `scripts/verify-m013-cleanup.sh` full run | Treat as blocker, inspect `failedStage`, fix only verification-path issues, and rerun. | Treat as failed verification and record timeout stage in report before retrying. | Fail run if report JSON is incomplete/invalid, then fix report writer logic before closure updates. |
| Playwright smoke+e2e execution environment | Keep failure artifacts/logs and rerun after stabilizing the affected spec or command wiring. | Fail fast and preserve logs; do not mark requirements validated on partial execution. | Any malformed test output must still surface non-zero verifier exit. |
| Requirement registry updates (`gsd_requirement_update`) | Do not hand-edit requirement IDs; rerun tool with correct IDs and evidence text. | N/A | Reject ambiguous validation text; require explicit command + artifact references. |

## Load Profile

- **Shared resources**: full Playwright suite runtime and local machine resources.
- **Per-operation cost**: one integrated verification run + two requirement update operations.
- **10x breakpoint**: repeated reruns can become expensive; triage by `failedStage` before retrying full run.

## Negative Tests

- **Malformed inputs**: invalid requirement ID or empty validation note must fail update command and block closure.
- **Error paths**: failed integrated gate must keep R007 active and prevent closure.
- **Boundary conditions**: passing integrated gate plus valid evidence updates both requirements without changing unrelated entries.

## Steps
1. Run `bash scripts/verify-m013-cleanup.sh` and confirm all stages pass.
2. Confirm report artifact exists and is non-empty at `.tests/test-results/m013-cleanup/M013-cleanup-report.json`.
3. Update requirement `R007` to `validated` with explicit closure evidence referencing the integrated verifier and report artifact.
4. Refresh requirement `R109` validation text so it cites final S04 integrated proof (all three grep gates + full smoke/e2e + unified runner artifact).
5. Re-read `.gsd/REQUIREMENTS.md` to confirm statuses/evidence are correct and no active M013 debt remains.

## Must-Haves
- [ ] Integrated verifier exits 0 and report artifact exists.
- [ ] `R007` status is `validated` with concrete S04 evidence.
- [ ] `R109` validation text includes final integrated proof, not only earlier slice evidence.
  - Files: `scripts/verify-m013-cleanup.sh`, `.tests/test-results/m013-cleanup/M013-cleanup-report.json`, `.gsd/REQUIREMENTS.md`
  - Verify: bash -lc 'bash scripts/verify-m013-cleanup.sh && test -s .tests/test-results/m013-cleanup/M013-cleanup-report.json && rg -n "### R007|### R109|Status: validated|verify-m013-cleanup.sh" .gsd/REQUIREMENTS.md'

## Files Likely Touched

- scripts/verify-m013-cleanup.sh
- .github/workflows/e2e.yml
- .tests/package.json
- .tests/test-results/m013-cleanup/M013-cleanup-report.json
- .gsd/REQUIREMENTS.md
