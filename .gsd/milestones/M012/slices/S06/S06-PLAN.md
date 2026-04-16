# S06: Integrated Verification and Sign-off

**Goal:** Fulfil R006 by proving end-to-end icon integration with executable regression evidence from the existing Playwright flow and a repeatable visual sign-off artifact covering critical web/PWA and desktop surfaces.
**Demo:** Existing test flow passes with new assets and key visual spot checks at critical sizes/surfaces are recorded.

## Must-Haves

- Add a dedicated visual sign-off Playwright spec that reads `site/icons/matrix.json` and `site/icons/desktop-matrix.json`, renders a single review sheet for critical sizes/surfaces, and emits deterministic artifacts (`.html` + `.png`) for audit.
- Preserve and re-use existing smoke contracts from S04/S05 (`icon-live-wiring`, `icon-export-matrix`, `icon-desktop-packaging`) as the mechanical proof backbone for icon integration.
- Add a single integrated verification runner/checklist path so future agents can reproduce sign-off without rediscovering command order.
- Evidence capture includes critical size/surface coverage (16, 32, 180, 192, 512 + desktop packaging surfaces) and a recorded artifact path from the same run.

## Threat Surface

- **Abuse**: Mutable matrix path fields must be validated so sign-off generation cannot follow unsafe/unresolvable paths.
- **Data exposure**: None expected (public icon assets only).
- **Input trust**: Treat `site/icons/matrix.json` and `site/icons/desktop-matrix.json` as untrusted mutable inputs and fail closed on malformed shape/path values.

## Requirement Impact

- **Requirements touched**: `R006` (direct owner) with reconfirmation signals for `R004` and `R005` outputs.
- **Re-verify**: Existing icon smoke specs plus the full Playwright flow in one sign-off sequence.
- **Decisions revisited**: `D013` primary verification strategy, plus consumed contracts from `D017` and `D018`.

## Proof Level

- This slice proves: final-assembly
- Real runtime required: yes
- Human/UAT required: yes

## Verification

- `npm --prefix .tests run test -- --reporter=line verification/S06-visual-sign-off.spec.js`
- `bash scripts/verify-icon-integration-signoff.sh`
- `test -s .tests/test-results/icon-visual-signoff/S06-visual-sign-off-sheet.png && test -s .tests/test-results/icon-visual-signoff/S06-sign-off-report.json`

## Observability / Diagnostics

- Runtime signals: stage-level sign-off logs and structured JSON verdict output in `.tests/test-results/icon-visual-signoff/S06-sign-off-report.json`.
- Inspection surfaces: Playwright line reporter output, visual artifacts under `.tests/test-results/icon-visual-signoff/`, and runner exit code.
- Failure visibility: report captures failing stage/command and missing artifact path(s).
- Redaction constraints: none (no auth tokens, secrets, or PII in sign-off artifacts).

## Integration Closure

- Upstream surfaces consumed: `site/icons/matrix.json`, `site/icons/desktop-matrix.json`, `site/index.html`, `site/manifest.json`, `.tests/smoke/icon-export-matrix.spec.js`, `.tests/smoke/icon-live-wiring.spec.js`, `.tests/smoke/icon-desktop-packaging.spec.js`.
- New wiring introduced in this slice: verification-only assembly under `.tests/verification/` plus a reproducible sign-off runner script under `scripts/`.
- What remains before the milestone is truly usable end-to-end: nothing once the integrated runner passes and visual artifact/checklist are produced.

## Tasks

- [x] **T01: Build the visual sign-off sheet spec for critical icon sizes and desktop surfaces** `est:45m`
  - Skills expected: `test`, `best-practices`.
- Why: R006 needs explicit visual spot checks; existing smoke suites only prove structural integrity.
- Do: Add a Playwright verification spec that builds one labeled sign-off sheet from matrix contracts, validates required paths, and writes deterministic HTML/PNG evidence under `.tests/test-results/icon-visual-signoff/`.
- Done when: running the new spec creates both artifacts and fails loudly when any required surface/path is missing.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `site/icons/matrix.json` | Fail fast with missing purpose/size diagnostics. | N/A (local read) | Reject missing `entries`, invalid `size`, or unsafe output paths. |
| `site/icons/desktop-matrix.json` | Fail fast with missing desktop format diagnostics. | N/A (local read) | Reject missing `format`/`sizes` fields or malformed output paths. |
| Playwright screenshot step | Exit non-zero and stop sign-off generation. | Treat as verification failure. | Reject zero-byte artifacts and fail task. |

## Load Profile

- **Shared resources**: local filesystem reads for icon assets and writes under `.tests/test-results/icon-visual-signoff/`.
- **Per-operation cost**: one matrix parse + one HTML render + one screenshot.
- **10x breakpoint**: throughput is trivial; stale/missing files are the primary failure mode.

## Negative Tests

- **Malformed inputs**: missing required purpose-size entries or malformed desktop format rows.
- **Error paths**: missing icon file on disk fails with explicit path.
- **Boundary conditions**: required visual surfaces (16, 32, 180, 192, 512 + desktop rows) must exist in sign-off metadata.

## Steps

1. Create `.tests/verification/S06-visual-sign-off.spec.js` to load/validate required entries from both matrix contracts.
2. Generate deterministic sign-off HTML at `.tests/test-results/icon-visual-signoff/S06-visual-sign-off.html` with labeled cards for required web/PWA + desktop rows.
3. Open the generated sheet in Playwright and save `.tests/test-results/icon-visual-signoff/S06-visual-sign-off-sheet.png`.
4. Add negative assertions proving missing entries/files fail with actionable messages.

## Must-Haves

- [ ] New executable spec at `.tests/verification/S06-visual-sign-off.spec.js`.
- [ ] Deterministic sign-off artifacts under `.tests/test-results/icon-visual-signoff/`.
- [ ] Missing surface/path conditions fail with explicit diagnostics.
  - Files: `.tests/verification/S06-visual-sign-off.spec.js`, `site/icons/matrix.json`, `site/icons/desktop-matrix.json`, `.tests/test-results/icon-visual-signoff/S06-visual-sign-off-sheet.png`
  - Verify: npm --prefix .tests run test -- --reporter=line verification/S06-visual-sign-off.spec.js && test -s .tests/test-results/icon-visual-signoff/S06-visual-sign-off.html && test -s .tests/test-results/icon-visual-signoff/S06-visual-sign-off-sheet.png

- [x] **T02: Add an integrated sign-off runner and checklist that proves existing test flow + visual evidence** `est:55m`
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
  - Files: `scripts/verify-icon-integration-signoff.sh`, `.tests/package.json`, `.tests/verification/S06-sign-off-checklist.md`, `.tests/test-results/icon-visual-signoff/S06-sign-off-report.json`
  - Verify: bash scripts/verify-icon-integration-signoff.sh

## Files Likely Touched

- .tests/verification/S06-visual-sign-off.spec.js
- site/icons/matrix.json
- site/icons/desktop-matrix.json
- .tests/test-results/icon-visual-signoff/S06-visual-sign-off-sheet.png
- scripts/verify-icon-integration-signoff.sh
- .tests/package.json
- .tests/verification/S06-sign-off-checklist.md
- .tests/test-results/icon-visual-signoff/S06-sign-off-report.json
