---
estimated_steps: 28
estimated_files: 3
skills_used: []
---

# T02: Run integrated gate and close requirement debt (R007/R109 evidence refresh)

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

## Inputs

- `scripts/verify-m013-cleanup.sh`
- `.tests/test-results/m013-cleanup/M013-cleanup-report.json`
- `.gsd/REQUIREMENTS.md`

## Expected Output

- `.tests/test-results/m013-cleanup/M013-cleanup-report.json`
- `.gsd/REQUIREMENTS.md`

## Verification

bash -lc 'bash scripts/verify-m013-cleanup.sh && test -s .tests/test-results/m013-cleanup/M013-cleanup-report.json && rg -n "### R007|### R109|Status: validated|verify-m013-cleanup.sh" .gsd/REQUIREMENTS.md'

## Observability Impact

Requirement-level closure evidence points to a concrete integrated verifier artifact, making milestone regression status inspectable from one report path.
