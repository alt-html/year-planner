#!/usr/bin/env bash
# scripts/verify-icon-integration-signoff.sh
#
# Integrated sign-off runner for M012/S06 — R006 verification.
#
# Executes eight ordered stages; halts at the first failure and writes
# a structured JSON verdict so the failing stage is always identifiable.
#
# Stages:
#   1. export-canonical-icon-matrix   — refresh site/icons PNG matrix
#   2. export-desktop-packaging       — refresh ICO/ICNS desktop assets
#   3. smoke-icon-export-matrix       — Playwright smoke: icon matrix contracts
#   4. smoke-icon-live-wiring         — Playwright smoke: head/manifest wiring
#   5. smoke-icon-desktop-packaging   — Playwright smoke: desktop packaging contracts
#   6. s06-visual-sign-off            — visual sign-off spec (writes HTML + PNG)
#   7. full-playwright-suite          — full Playwright test suite
#   8. artifact-assertions            — required artifacts present and non-zero byte
#
# Writes:
#   .tests/test-results/icon-visual-signoff/S06-sign-off-report.json
#
# Exit codes:
#   0 — all stages passed and all required artifacts present
#   1 — one or more stages failed (report captures failing stage/command)
#
# Phase-tagged log prefixes (stdout):
#   [stage]     stage begin/end
#   [artifact]  artifact assertion result
#   [report]    JSON report write confirmation

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
TESTS_DIR="${REPO_ROOT}/.tests"
REPORT_DIR="${TESTS_DIR}/test-results/icon-visual-signoff"
REPORT_JSON="${REPORT_DIR}/S06-sign-off-report.json"
STAGE_LOG=$(mktemp)
GENERATED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
FIRST_FAIL=""
OVERALL_VERDICT="pass"

mkdir -p "${REPORT_DIR}"

# Remove temp stage log on any exit (REPORT_JSON is kept as the durable artifact).
trap 'rm -f "${STAGE_LOG}"' EXIT

# ── Helpers ────────────────────────────────────────────────────────────────────

# run_stage NAME CMD
# Runs CMD via `bash -c`. Records name/command/exitCode/verdict in STAGE_LOG.
# Prints phase-tagged progress to stdout. Returns 1 on failure.
run_stage() {
  local name="$1"
  local cmd="$2"

  echo ""
  echo "══════════════════════════════════════════════════════════════════"
  printf "[stage] START: %s\n" "${name}"
  printf "[stage] CMD:   %s\n" "${cmd}"
  echo "══════════════════════════════════════════════════════════════════"
  echo ""

  local exit_code=0
  bash -c "${cmd}" || exit_code=$?

  local verdict="pass"
  if [[ "${exit_code}" -ne 0 ]]; then
    verdict="fail"
    OVERALL_VERDICT="fail"
    if [[ -z "${FIRST_FAIL}" ]]; then
      FIRST_FAIL="${name}"
    fi
  fi

  # TSV record: name\tcmd\texitCode\tverdict
  printf '%s\t%s\t%d\t%s\n' "${name}" "${cmd}" "${exit_code}" "${verdict}" \
    >> "${STAGE_LOG}"

  if [[ "${exit_code}" -ne 0 ]]; then
    echo ""
    echo "[stage] FAIL: ${name} — exit ${exit_code}"
    return 1
  fi

  echo ""
  echo "[stage] PASS: ${name}"
  return 0
}

# check_artifacts
# Verifies each required output artifact is present and non-zero byte.
# Appends an artifact-assertions TSV record to STAGE_LOG.
# Returns 1 if any artifact is missing or empty.
check_artifacts() {
  echo ""
  echo "══════════════════════════════════════════════════════════════════"
  echo "[stage] START: artifact-assertions"
  echo "══════════════════════════════════════════════════════════════════"
  echo ""

  local all_ok=true

  local -a required_artifacts=(
    "${REPORT_DIR}/S06-visual-sign-off.html"
    "${REPORT_DIR}/S06-visual-sign-off-sheet.png"
    "${REPORT_DIR}/S06-sign-off-report.json"
  )

  for artifact in "${required_artifacts[@]}"; do
    if [[ -s "${artifact}" ]]; then
      printf "[artifact] ✓  present: %s\n" "${artifact}"
    else
      printf "[artifact] ✗  MISSING or empty: %s\n" "${artifact}"
      all_ok=false
    fi
  done

  local stage_verdict="pass"
  local stage_exit=0
  if [[ "${all_ok}" == "false" ]]; then
    stage_verdict="fail"
    stage_exit=1
    OVERALL_VERDICT="fail"
    if [[ -z "${FIRST_FAIL}" ]]; then
      FIRST_FAIL="artifact-assertions"
    fi
  fi

  printf '%s\t%s\t%d\t%s\n' \
    "artifact-assertions" "check required sign-off artifacts" \
    "${stage_exit}" "${stage_verdict}" \
    >> "${STAGE_LOG}"

  if [[ "${all_ok}" == "false" ]]; then
    echo ""
    echo "[stage] FAIL: artifact-assertions — one or more required artifacts missing or empty"
    return 1
  fi

  echo ""
  echo "[stage] PASS: artifact-assertions"
  return 0
}

# write_report
# Reads STAGE_LOG and writes S06-sign-off-report.json via Python3.
# Overwrites any previous version of the file (including the T01 spec's version).
write_report() {
  python3 - \
    "${STAGE_LOG}" \
    "${REPORT_JSON}" \
    "${GENERATED_AT}" \
    "${OVERALL_VERDICT}" \
    "${FIRST_FAIL}" \
    "${REPORT_DIR}" \
    <<'PYEOF'
import json, os, sys

stage_log, report_path, generated_at, verdict, first_fail, report_dir = sys.argv[1:7]

stages = []
with open(stage_log) as f:
    for line in f:
        line = line.rstrip('\n')
        if not line:
            continue
        parts = line.split('\t')
        if len(parts) < 4:
            continue
        stages.append({
            'name':     parts[0],
            'command':  parts[1],
            'exitCode': int(parts[2]),
            'verdict':  parts[3],
        })

html_path = os.path.join(report_dir, 'S06-visual-sign-off.html')
png_path  = os.path.join(report_dir, 'S06-visual-sign-off-sheet.png')

report = {
    'spec':        'scripts/verify-icon-integration-signoff.sh',
    'generatedAt': generated_at,
    'verdict':     verdict,
    'stages':      stages,
    'artifacts': {
        'html':         html_path,
        'screenshot':   png_path,
        'report':       report_path,
        'htmlOk':       os.path.isfile(html_path) and os.path.getsize(html_path) > 0,
        'screenshotOk': os.path.isfile(png_path)  and os.path.getsize(png_path)  > 0,
    },
}

if first_fail:
    report['failedStage'] = first_fail

os.makedirs(os.path.dirname(report_path), exist_ok=True)
with open(report_path, 'w') as f:
    json.dump(report, f, indent=2)
    f.write('\n')

sys.stdout.write('[report] Written: ' + report_path + '\n')
PYEOF
}

# ── Main ───────────────────────────────────────────────────────────────────────

echo ""
echo "┌──────────────────────────────────────────────────────────────────┐"
echo "│  S06 Integrated Sign-off Runner                                  │"
echo "│  M012: Icon Integration — R006 verification                      │"
echo "└──────────────────────────────────────────────────────────────────┘"

# Run from repo root so all relative paths resolve correctly.
cd "${REPO_ROOT}"

# ── Stage 1: refresh PNG icon matrix ──────────────────────────────────────────
run_stage "export-canonical-icon-matrix" \
  "bash scripts/export-canonical-icon-matrix.sh" \
  || { write_report; exit 1; }

# ── Stage 2: refresh ICO/ICNS desktop assets ──────────────────────────────────
run_stage "export-desktop-packaging-assets" \
  "bash scripts/export-desktop-packaging-assets.sh" \
  || { write_report; exit 1; }

# ── Stage 3: icon matrix smoke contracts ──────────────────────────────────────
run_stage "smoke-icon-export-matrix" \
  "npm --prefix .tests run test -- --reporter=line smoke/icon-export-matrix.spec.js" \
  || { write_report; exit 1; }

# ── Stage 4: live wiring smoke contracts ──────────────────────────────────────
run_stage "smoke-icon-live-wiring" \
  "npm --prefix .tests run test -- --reporter=line smoke/icon-live-wiring.spec.js" \
  || { write_report; exit 1; }

# ── Stage 5: desktop packaging smoke contracts ────────────────────────────────
run_stage "smoke-icon-desktop-packaging" \
  "npm --prefix .tests run test -- --reporter=line smoke/icon-desktop-packaging.spec.js" \
  || { write_report; exit 1; }

# ── Stage 6: S06 visual sign-off spec ─────────────────────────────────────────
run_stage "s06-visual-sign-off" \
  "npm --prefix .tests run test -- --reporter=line verification/S06-visual-sign-off.spec.js" \
  || { write_report; exit 1; }

# ── Stage 7: full Playwright suite ────────────────────────────────────────────
run_stage "full-playwright-suite" \
  "npm --prefix .tests run test -- --reporter=line" \
  || { write_report; exit 1; }

# ── Stage 8: artifact assertions ─────────────────────────────────────────────
check_artifacts \
  || { write_report; exit 1; }

# ── All stages passed — write final integrated report ─────────────────────────
write_report

echo ""
echo "┌──────────────────────────────────────────────────────────────────┐"
echo "│  ✓  Sign-off PASSED — all stages green                           │"
echo "│  Report: .tests/test-results/icon-visual-signoff/                │"
echo "│          S06-sign-off-report.json                                │"
echo "└──────────────────────────────────────────────────────────────────┘"
echo ""

exit 0
