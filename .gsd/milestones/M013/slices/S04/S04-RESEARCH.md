# S04: Verification Hardening & Requirement Closure — Research

**Date:** 2026-04-16

## Summary

This slice provides the final verification gate for the M013 milestone, ensuring all legacy cleanup is proven and closing out the remaining requirements. The implementation path is straightforward, consisting of consolidating and running existing verification scripts and tests created in slices S01, S02, and S03.

The primary outcome is a single, repeatable verification process that proves the milestone's success criteria have been met, specifically providing the "strict regression proof" required by R109 and closing the legacy requirement debt tracked in R007.

## Recommendation

This is a light research task. The work is well-defined and low-risk. The planner should create tasks to:
1.  Create a master verification script (`scripts/verify-m013-cleanup.sh`) that runs all existing grep gates and the full E2E/smoke test suite.
2.  Run the master script to generate final verification evidence.
3.  Update requirements R109 and R007 to `validated` status, citing the successful verification run as evidence.

## Implementation Landscape

### Key Files

-   `scripts/verify-m013-cleanup.sh` (new) — This script will be the primary deliverable, orchestrating all other verification steps.
-   `scripts/verify-no-legacy-uid.sh` — The grep gate proving `uid` removal (from S01).
-   `scripts/verify-no-url-state-params.sh` — The grep gate proving URL-state removal (from S02).
-   `scripts/verify-no-legacy-share-features.sh` — The grep gate proving share/feature removal (from S03).
-   `.github/workflows/test.yml` (optional) — The planner might consider adding the new master script to the CI pipeline to prevent regressions.
-   `.gsd/REQUIREMENTS.md` — This file will be updated by the `gsd_requirement_update` tool to close R109 and R007.

### Build Order

1.  **Create the master verification script first.** This script aggregates all the individual checks and forms the core of the slice's proof. It should be designed to exit non-zero if any individual check fails.
2.  **Run the script** to confirm it passes and to generate the evidence needed for requirement closure.
3.  **Update the requirements** as the final step, using the output from the script run as the validation proof.

### Verification Approach

The verification for this slice *is* the slice's primary output. The master script should execute the following:
1.  Run the three grep-gate scripts (`verify-no-legacy-uid.sh`, `verify-no-url-state-params.sh`, `verify-no-legacy-share-features.sh`).
2.  Run the full Playwright test suite (`npm --prefix .tests test`).
3.  The script's success (exit code 0) and its log output will serve as the definitive proof of completion for R109.

For R007, the validation will be a note stating that M013's comprehensive cleanup resolves all prior legacy requirement debt, as no references to "MOD-09" exist in the current codebase.
