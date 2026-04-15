#!/usr/bin/env bash
# scripts/export-icon-candidates.sh
#
# Generates preview-{16,32,180,192,512}.png for each icon candidate from its icon.svg master.
# Outputs land in mockups/icon-candidates/{CX-*}/preview-{size}.png.
#
# Requirements:
#   rsvg-convert  (from librsvg, e.g. `brew install librsvg`)
#   sips          (macOS built-in, used for dimension spot-checks)
#
# Usage:
#   bash scripts/export-icon-candidates.sh
#
# Exit codes:
#   0  All exports and checks passed.
#   1  Missing tool, missing source SVG, or a dimension check failed.

set -euo pipefail

# ── Tool checks ────────────────────────────────────────────────────────────────

if ! command -v rsvg-convert &>/dev/null; then
  echo "ERROR: rsvg-convert is not installed or not on PATH." >&2
  echo "       Install it with: brew install librsvg" >&2
  exit 1
fi

# sips is macOS-only; warn but still allow dimension checks to be skipped gracefully
HAVE_SIPS=true
if ! command -v sips &>/dev/null; then
  echo "WARNING: sips not found — dimension spot-checks will be skipped." >&2
  HAVE_SIPS=false
fi

# ── Paths ─────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CANDIDATES_DIR="${REPO_ROOT}/mockups/icon-candidates"

CANDIDATES=(
  "C1-ink-paper"
  "C2-nordic-clarity"
  "C3-verdant-studio"
)

SIZES=(16 32 180 192 512)

# ── Export loop ───────────────────────────────────────────────────────────────

ERRORS=0

for CANDIDATE in "${CANDIDATES[@]}"; do
  CANDIDATE_DIR="${CANDIDATES_DIR}/${CANDIDATE}"
  SOURCE_SVG="${CANDIDATE_DIR}/icon.svg"

  # Validate candidate folder
  if [[ ! -d "${CANDIDATE_DIR}" ]]; then
    echo "ERROR: Candidate folder not found: mockups/icon-candidates/${CANDIDATE}" >&2
    ERRORS=$((ERRORS + 1))
    continue
  fi

  # Validate source SVG
  if [[ ! -f "${SOURCE_SVG}" ]]; then
    echo "ERROR: Missing source SVG for ${CANDIDATE}: ${SOURCE_SVG}" >&2
    ERRORS=$((ERRORS + 1))
    continue
  fi

  # Reject zero-byte SVG
  if [[ ! -s "${SOURCE_SVG}" ]]; then
    echo "ERROR: icon.svg for ${CANDIDATE} is zero bytes — refusing export." >&2
    ERRORS=$((ERRORS + 1))
    continue
  fi

  # Quick SVG validity check — rsvg-convert will error on malformed XML
  echo "Exporting ${CANDIDATE}..."

  for SIZE in "${SIZES[@]}"; do
    OUTPUT="${CANDIDATE_DIR}/preview-${SIZE}.png"

    if ! rsvg-convert \
        --width="${SIZE}" \
        --height="${SIZE}" \
        --keep-aspect-ratio \
        --output="${OUTPUT}" \
        "${SOURCE_SVG}" 2>&1; then
      echo "ERROR: rsvg-convert failed for ${CANDIDATE} at ${SIZE}x${SIZE}" >&2
      ERRORS=$((ERRORS + 1))
      continue
    fi

    # Verify output is non-zero-byte
    if [[ ! -s "${OUTPUT}" ]]; then
      echo "ERROR: Output PNG is zero bytes: ${OUTPUT}" >&2
      ERRORS=$((ERRORS + 1))
      continue
    fi

    # Dimension spot-check with sips
    if [[ "${HAVE_SIPS}" == "true" ]]; then
      # sips outputs lines like "      pixelWidth: 16"
      ACTUAL_W=$(sips --getProperty pixelWidth "${OUTPUT}" 2>/dev/null | awk '/pixelWidth/{print $2}')
      ACTUAL_H=$(sips --getProperty pixelHeight "${OUTPUT}" 2>/dev/null | awk '/pixelHeight/{print $2}')

      if [[ -z "${ACTUAL_W}" || -z "${ACTUAL_H}" ]]; then
        echo "WARNING: Could not read dimensions for ${OUTPUT} — skipping dimension check." >&2
        ERRORS=$((ERRORS + 1))
        continue
      fi

      if [[ "${ACTUAL_W}" != "${SIZE}" || "${ACTUAL_H}" != "${SIZE}" ]]; then
        echo "ERROR: Dimension mismatch for ${OUTPUT}: expected ${SIZE}x${SIZE}, got ${ACTUAL_W}x${ACTUAL_H}" >&2
        ERRORS=$((ERRORS + 1))
        continue
      fi
    fi

    echo "  ✓  preview-${SIZE}.png  (${SIZE}x${SIZE})"
  done
done

# ── Summary ───────────────────────────────────────────────────────────────────

TOTAL=$((${#CANDIDATES[@]} * ${#SIZES[@]}))

if [[ "${ERRORS}" -gt 0 ]]; then
  echo ""
  echo "FAIL: ${ERRORS} error(s) encountered during export. See above for details." >&2
  exit 1
fi

echo ""
echo "OK: All ${TOTAL} preview PNGs exported successfully."
