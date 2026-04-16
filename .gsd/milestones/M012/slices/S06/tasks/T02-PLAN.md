---
estimated_steps: 8
estimated_files: 4
skills_used:
  - test
  - technical-writing
---

# T02: Add an integrated sign-off runner and checklist that proves existing test flow + visual evidence

- Skills expected: `test`, `technical-writing`.
- Why: R006 is only complete when existing verification and visual evidence run together from one reproducible command.
- Do: Add a runner script (plus npm alias) that executes export preconditions, icon smoke contracts, the S06 visual spec, and full Playwright flow, then writes a structured report + checklist.
- Done when: one command runs end-to-end, emits report/checklist artifacts, and exits non-zero on regression.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `scripts/export-canonical-icon-matrix.sh` / `scripts/export-desktop-packaging-assets.sh` | Stop runner and report failing prerequisite stage. | Abort stage and mark sign-off incomplete. | Fail if expected matrix outputs are missing after export. |
| Playwright smoke/full-suite commands | Stop at first failing suite and record failing command/spec path. | Abort stage and mark report failed. | N/A (plain text runner output). |
| Visual/report artifacts from T01 | Fail sign-off if required artifacts are absent/zero-byte. | N/A | Reject malformed report payload before final write. |

## Load Profile

- **Shared resources**: Playwright workers and local filesystem reads/writes.
- **Per-operation cost**: export refresh + icon smoke run + visual spec run + full Playwright run.
- **10x breakpoint**: runtime grows with full suite; stage boundaries must remain explicit for diagnosis.

## Negative Tests

- **Malformed inputs**: invalid report/checklist path or malformed report payload fails write step.
- **Error paths**: failing smoke/full-suite command must stop downstream stages.
- **Boundary conditions**: missing visual artifact still fails the sign-off gate even when tests pass.

## Steps

1. Create `scripts/verify-icon-integration-signoff.sh` with staged execution: export refresh, icon smoke contracts, S06 visual spec, full Playwright run, artifact assertions, JSON report write.
2. Add `.tests/package.json` script alias (e.g. `test:icon-signoff`) invoking the runner.
3. Add `.tests/verification/S06-sign-off-checklist.md` with required surfaces, artifact locations, and review steps.
4. Ensure the runner writes `.tests/test-results/icon-visual-signoff/S06-sign-off-report.json` with stage verdicts and artifact paths.

## Must-Haves

- [ ] One reproducible command runs integrated sign-off end-to-end.
- [ ] Runner enforces test-flow success + visual artifact existence before success.
- [ ] Checklist/report paths stay stable for audit.

## Inputs

- `scripts/export-canonical-icon-matrix.sh`
- `scripts/export-desktop-packaging-assets.sh`
- `.tests/verification/S06-visual-sign-off.spec.js`
- `.tests/smoke/icon-export-matrix.spec.js`
- `.tests/smoke/icon-live-wiring.spec.js`
- `.tests/smoke/icon-desktop-packaging.spec.js`

## Expected Output

- `scripts/verify-icon-integration-signoff.sh`
- `.tests/package.json`
- `.tests/verification/S06-sign-off-checklist.md`
- `.tests/test-results/icon-visual-signoff/S06-sign-off-report.json`

## Verification

bash scripts/verify-icon-integration-signoff.sh

## Observability Impact

- Signals added/changed: stage-based sign-off logs and structured JSON stage verdicts.
- How a future agent inspects this: run `bash scripts/verify-icon-integration-signoff.sh` and read `.tests/test-results/icon-visual-signoff/S06-sign-off-report.json`.
- Failure state exposed: report captures failing stage name/command and missing artifact references.
