#!/usr/bin/env bash
# verify-m013-cleanup.sh — Unified M013 legacy cleanup verification runner.
#
# Runs three legacy grep gates in order, then full Playwright smoke+e2e.
# Exits non-zero on the first failing stage and always writes a JSON report
# recording stage-level verdicts for fast post-run diagnosis.
#
# Report: .tests/test-results/m013-cleanup/M013-cleanup-report.json
#
# Usage: bash scripts/verify-m013-cleanup.sh

# No set -e: exit codes are captured manually to control fail-fast behavior.
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPORT_DIR="$REPO_ROOT/.tests/test-results/m013-cleanup"
REPORT="$REPORT_DIR/M013-cleanup-report.json"
SCRIPTS_DIR="$REPO_ROOT/scripts"

mkdir -p "$REPORT_DIR"

STAGES_JSON=""
FAILED_STAGE=""
OVERALL_EXIT=0
REPORT_WRITTEN=0

# ── write_report ──────────────────────────────────────────────────────────────
# Writes the JSON report artifact. Idempotent: no-op after first write.
write_report() {
    [[ $REPORT_WRITTEN -eq 1 ]] && return 0
    REPORT_WRITTEN=1

    local failed_json="null"
    [[ -n "$FAILED_STAGE" ]] && failed_json="\"${FAILED_STAGE}\""

    local overall="pass"
    [[ $OVERALL_EXIT -ne 0 ]] && overall="fail"

    local ts
    ts=$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || printf "unknown")

    # Playwright clears test-results/ during its run; re-create the output directory.
    mkdir -p "$REPORT_DIR"

    printf '{"runTimestamp":"%s","overall":"%s","failedStage":%s,"stages":[%s]}\n' \
        "$ts" "$overall" "$failed_json" "$STAGES_JSON" \
        > "$REPORT"
}

# Always write the report on exit, even on unexpected abort.
trap 'write_report' EXIT

# ── run_stage <name> <cmd...> ─────────────────────────────────────────────────
# Executes the command, records stage result in STAGES_JSON, and halts on failure.
# The first positional arg is the stage name; remaining args are the command.
run_stage() {
    local name="$1"; shift
    local display="$*"

    local ts
    ts=$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || printf "unknown")

    printf '\n── Stage: %s\n' "$name"
    printf '   command: %s\n\n' "$display"

    local exit_code=0
    "$@" || exit_code=$?

    local verdict="pass"
    [[ $exit_code -ne 0 ]] && verdict="fail"

    # JSON-escape backslashes and double-quotes in display command.
    local cmd_esc="${display//\\/\\\\}"
    cmd_esc="${cmd_esc//\"/\\\"}"

    local entry
    entry=$(printf '{"stage":"%s","command":"%s","exitCode":%d,"verdict":"%s","timestamp":"%s"}' \
        "$name" "$cmd_esc" "$exit_code" "$verdict" "$ts")

    if [[ -z "$STAGES_JSON" ]]; then
        STAGES_JSON="$entry"
    else
        STAGES_JSON="${STAGES_JSON},${entry}"
    fi

    if [[ $exit_code -ne 0 ]]; then
        FAILED_STAGE="$name"
        OVERALL_EXIT=$exit_code
        printf '\n=== FAIL: Stage "%s" exited %d — halting M013 verification ===\n' \
            "$name" "$exit_code"
        write_report
        exit "$exit_code"
    fi

    printf '\n   ✓ Stage "%s" passed\n' "$name"
}

# ── Preflight: dependency scripts must exist ──────────────────────────────────
for dep_script in \
    "$SCRIPTS_DIR/verify-no-legacy-uid.sh" \
    "$SCRIPTS_DIR/verify-no-url-state-params.sh" \
    "$SCRIPTS_DIR/verify-no-legacy-share-features.sh"; do
    if [[ ! -f "$dep_script" ]]; then
        printf '=== FAIL: Required gate script not found: %s ===\n' "$dep_script"
        FAILED_STAGE="preflight"
        OVERALL_EXIT=1
        STAGES_JSON=$(printf \
            '{"stage":"preflight","command":"script-existence-check","exitCode":1,"verdict":"fail","timestamp":"%s"}' \
            "$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || printf "unknown")")
        write_report
        exit 1
    fi
done

printf '=== M013 Verification Run: %s ===\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# ── Stage 1: uid navigation surface gate ──────────────────────────────────────
run_stage "verify-no-legacy-uid" \
    bash "$SCRIPTS_DIR/verify-no-legacy-uid.sh"

# ── Stage 2: URL state query-param gate ───────────────────────────────────────
run_stage "verify-no-url-state-params" \
    bash "$SCRIPTS_DIR/verify-no-url-state-params.sh"

# ── Stage 3: legacy share/feature surfaces gate ───────────────────────────────
run_stage "verify-no-legacy-share-features" \
    bash "$SCRIPTS_DIR/verify-no-legacy-share-features.sh"

# ── Stage 4: Playwright smoke + e2e ───────────────────────────────────────────
run_stage "playwright-smoke-e2e" \
    npm --prefix "$REPO_ROOT/.tests" run test -- --reporter=line e2e/ smoke/

# ── All stages passed ─────────────────────────────────────────────────────────
write_report
printf '\n=== M013 Verification PASS: all stages completed successfully ===\n'
printf '=== Report: %s ===\n' "$REPORT"
exit 0
