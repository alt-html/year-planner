#!/usr/bin/env bash
# scripts/export-canonical-icon-matrix.sh
#
# Exports the deterministic cross-platform icon matrix from the canonical S02 winner lock.
#
# Reads:  mockups/icon-candidates/canonical.json
# Writes: site/icons/{9 PNGs}, site/icons/matrix.json
#
# Required tools:
#   rsvg-convert  (librsvg: brew install librsvg)
#   sips          (macOS built-in; dimension checks skipped if absent)
#   python3       (macOS built-in; JSON parsing and matrix.json authoring)
#
# Phase-tagged exit prefixes (stderr):
#   [tool-check]       missing required binary
#   [source-resolve]   canonical.json missing/invalid, unsafe path, or missing SVG
#   [rasterize]        rsvg-convert failure or zero-byte output
#   [dimension-check]  sips dimension mismatch or unreadable output
#
# Usage: bash scripts/export-canonical-icon-matrix.sh
# Exit:  0 = all 9 exports passed and matrix.json written; 1 = error (see above)

set -euo pipefail

# ── Tool checks ────────────────────────────────────────────────────────────────

if ! command -v rsvg-convert &>/dev/null; then
  echo "[tool-check] ERROR: rsvg-convert not installed or not on PATH." >&2
  echo "             Install: brew install librsvg" >&2
  exit 1
fi

if ! command -v python3 &>/dev/null; then
  echo "[tool-check] ERROR: python3 not found — required for JSON parsing." >&2
  exit 1
fi

HAVE_SIPS=true
if ! command -v sips &>/dev/null; then
  echo "[tool-check] WARNING: sips not found — dimension checks will be skipped." >&2
  HAVE_SIPS=false
fi

# ── Paths ─────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CANONICAL_JSON="${REPO_ROOT}/mockups/icon-candidates/canonical.json"
CANDIDATES_DIR="${REPO_ROOT}/mockups/icon-candidates"
OUTPUT_DIR="${REPO_ROOT}/site/icons"

# ── Parse and validate canonical.json ─────────────────────────────────────────

if [[ ! -f "${CANONICAL_JSON}" ]]; then
  echo "[source-resolve] ERROR: canonical.json not found: ${CANONICAL_JSON}" >&2
  exit 1
fi

PARSED=$(python3 -c "
import json, sys

canon = '${CANONICAL_JSON}'
try:
    with open(canon) as f:
        d = json.load(f)
except json.JSONDecodeError as e:
    sys.stderr.write('[source-resolve] ERROR: Invalid JSON in canonical.json: ' + str(e) + '\n')
    sys.exit(1)
except Exception as e:
    sys.stderr.write('[source-resolve] ERROR: Cannot read canonical.json: ' + str(e) + '\n')
    sys.exit(1)

def req(obj, key, ctx=''):
    v = obj.get(key)
    if v is None:
        field = (ctx + '.') if ctx else ''
        sys.stderr.write('[source-resolve] ERROR: Missing required field \"' + field + key + '\" in canonical.json\n')
        sys.exit(1)
    return v

cid    = req(d, 'candidateId')
folder = req(d, 'folder')
svgs   = req(d, 'svgSources')

icon_src = req(svgs, 'icon',       'svgSources')
mask_src = req(svgs, 'maskable',   'svgSources')
mono_src = req(svgs, 'monochrome', 'svgSources')

print(cid)
print(folder)
print(icon_src)
print(mask_src)
print(mono_src)
") || {
  echo "[source-resolve] FAIL: canonical.json validation failed — see above for details." >&2
  exit 1
}

CANDIDATE_ID=$(echo "${PARSED}"     | sed -n '1p')
CANDIDATE_FOLDER=$(echo "${PARSED}" | sed -n '2p')
SVG_ANY=$(echo "${PARSED}"          | sed -n '3p')
SVG_MASKABLE=$(echo "${PARSED}"     | sed -n '4p')
SVG_MONOCHROME=$(echo "${PARSED}"   | sed -n '5p')

# ── Path safety checks ────────────────────────────────────────────────────────

safe_path() {
  local value="$1" label="$2"
  if [[ "${value}" == /* ]]; then
    echo "[source-resolve] ERROR: Absolute path rejected in canonical.json ${label}: ${value}" >&2
    exit 1
  fi
  if [[ "${value}" == *..* ]]; then
    echo "[source-resolve] ERROR: Path traversal (..) rejected in canonical.json ${label}: ${value}" >&2
    exit 1
  fi
}

safe_path "${CANDIDATE_FOLDER}"  "folder"
safe_path "${SVG_ANY}"           "svgSources.icon"
safe_path "${SVG_MASKABLE}"      "svgSources.maskable"
safe_path "${SVG_MONOCHROME}"    "svgSources.monochrome"

# Resolve to absolute paths (SVG values are relative to CANDIDATES_DIR)
ABS_ANY="${CANDIDATES_DIR}/${SVG_ANY}"
ABS_MASKABLE="${CANDIDATES_DIR}/${SVG_MASKABLE}"
ABS_MONOCHROME="${CANDIDATES_DIR}/${SVG_MONOCHROME}"

# Verify each SVG source exists and is non-empty
for entry in \
  "${ABS_ANY}:svgSources.icon" \
  "${ABS_MASKABLE}:svgSources.maskable" \
  "${ABS_MONOCHROME}:svgSources.monochrome"
do
  svg_file="${entry%%:*}"
  svg_label="${entry##*:}"
  if [[ ! -f "${svg_file}" ]]; then
    echo "[source-resolve] ERROR: SVG source not found (${svg_label}): ${svg_file}" >&2
    exit 1
  fi
  if [[ ! -s "${svg_file}" ]]; then
    echo "[source-resolve] ERROR: SVG source is zero bytes (${svg_label}): ${svg_file}" >&2
    exit 1
  fi
done

# ── Export matrix definition ──────────────────────────────────────────────────
#
# Each row: platform|purpose|size|abs_source_path|output_filename
# The 9 entries cover all required surfaces for web, iOS, and PWA (any/maskable/monochrome).

MATRIX=(
  "web|any|16|${ABS_ANY}|favicon-16x16.png"
  "web|any|32|${ABS_ANY}|favicon-32x32.png"
  "ios|any|180|${ABS_ANY}|apple-touch-icon-180x180.png"
  "pwa|any|192|${ABS_ANY}|pwa-any-192x192.png"
  "pwa|any|512|${ABS_ANY}|pwa-any-512x512.png"
  "pwa|maskable|192|${ABS_MASKABLE}|pwa-maskable-192x192.png"
  "pwa|maskable|512|${ABS_MASKABLE}|pwa-maskable-512x512.png"
  "pwa|monochrome|192|${ABS_MONOCHROME}|pwa-monochrome-192x192.png"
  "pwa|monochrome|512|${ABS_MONOCHROME}|pwa-monochrome-512x512.png"
)

mkdir -p "${OUTPUT_DIR}"

echo "Exporting canonical icon matrix for ${CANDIDATE_ID} (${CANDIDATE_FOLDER})..."
echo ""

ERRORS=0
MATRIX_DATA_FILE=$(mktemp)
GENERATED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Clean up temp file on any exit
trap 'rm -f "${MATRIX_DATA_FILE}"' EXIT

# ── Export loop ───────────────────────────────────────────────────────────────

for entry in "${MATRIX[@]}"; do
  IFS='|' read -r platform purpose size src_abs output_name <<< "${entry}"
  output_abs="${OUTPUT_DIR}/${output_name}"
  output_rel="site/icons/${output_name}"

  # Rasterize SVG → PNG
  if ! rsvg-convert \
      --width="${size}" \
      --height="${size}" \
      --keep-aspect-ratio \
      --output="${output_abs}" \
      "${src_abs}" 2>&1; then
    echo "[rasterize] ERROR: rsvg-convert failed for ${output_name} (${size}x${size})" >&2
    ERRORS=$((ERRORS + 1))
    continue
  fi

  # Non-zero-byte guard
  if [[ ! -s "${output_abs}" ]]; then
    echo "[rasterize] ERROR: Output PNG is zero bytes: ${output_abs}" >&2
    ERRORS=$((ERRORS + 1))
    continue
  fi

  # Dimension verification via sips
  if [[ "${HAVE_SIPS}" == "true" ]]; then
    actual_w=$(sips --getProperty pixelWidth  "${output_abs}" 2>/dev/null | awk '/pixelWidth/{print $2}')
    actual_h=$(sips --getProperty pixelHeight "${output_abs}" 2>/dev/null | awk '/pixelHeight/{print $2}')

    if [[ -z "${actual_w}" || -z "${actual_h}" ]]; then
      echo "[dimension-check] ERROR: Could not read dimensions from ${output_abs}" >&2
      ERRORS=$((ERRORS + 1))
      continue
    fi

    if [[ "${actual_w}" != "${size}" || "${actual_h}" != "${size}" ]]; then
      echo "[dimension-check] ERROR: ${output_name}: expected ${size}x${size}, got ${actual_w}x${actual_h}" >&2
      ERRORS=$((ERRORS + 1))
      continue
    fi
  fi

  # Record entry for matrix.json (pipe-delimited for reliable parsing)
  src_rel="mockups/icon-candidates/${src_abs#${CANDIDATES_DIR}/}"
  printf '%s|%s|%s|%s|%s|%s\n' \
    "${CANDIDATE_ID}" "${platform}" "${purpose}" "${size}" "${src_rel}" "${output_rel}" \
    >> "${MATRIX_DATA_FILE}"

  echo "  ✓  candidateId=${CANDIDATE_ID} purpose=${purpose} size=${size}x${size} output=${output_rel}"
done

# ── Fail-fast if any export failed ───────────────────────────────────────────

if [[ "${ERRORS}" -gt 0 ]]; then
  echo ""
  echo "[rasterize] FAIL: ${ERRORS} error(s) — matrix.json was NOT written. See above." >&2
  exit 1
fi

# ── Write matrix.json ─────────────────────────────────────────────────────────

MATRIX_JSON="${OUTPUT_DIR}/matrix.json"
MATRIX_DATA_PATH="${MATRIX_DATA_FILE}"
CAND_ID="${CANDIDATE_ID}"
CAND_FOLDER="${CANDIDATE_FOLDER}"
GEN_AT="${GENERATED_AT}"

python3 << PYEOF
import json, sys

entries = []
with open('${MATRIX_DATA_PATH}') as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        cid, platform, purpose, size, src, output = line.split('|')
        entries.append({
            'candidateId': cid,
            'platform':    platform,
            'purpose':     purpose,
            'size':        int(size),
            'src':         src,
            'output':      output,
        })

matrix = {
    'schemaVersion': '1.0',
    'candidateId':   '${CAND_ID}',
    'candidateName': '${CAND_FOLDER}',
    'generatedAt':   '${GEN_AT}',
    'entries':       entries,
}

with open('${MATRIX_JSON}', 'w') as f:
    json.dump(matrix, f, indent=2)
    f.write('\n')
PYEOF

echo ""
echo "OK: 9 canonical PNGs exported and site/icons/matrix.json written."
