#!/usr/bin/env bash
# scripts/export-desktop-packaging-assets.sh
#
# Generates deterministic desktop packaging artifacts from the canonical S02 winner lock.
#
# Reads:  mockups/icon-candidates/canonical.json
# Writes: site/icons/desktop/year-planner.ico
#         site/icons/desktop/year-planner.icns
#         site/icons/desktop-matrix.json          (does NOT touch site/icons/matrix.json)
#
# Required tools:
#   rsvg-convert  (librsvg: brew install librsvg)
#   python3       (macOS built-in; JSON parsing + ICO packing via scripts/lib/pack-ico.py)
#   iconutil      (macOS built-in; ICNS packaging from .iconset directory)
#
# Phase-tagged exit prefixes (stderr):
#   [tool-check]      missing required binary or helper script
#   [source-resolve]  canonical.json missing/invalid, unsafe path, or missing SVG
#   [rasterize]       rsvg-convert failure or zero-byte output
#   [package]         ICO or ICNS packaging failure
#   [contract]        desktop-matrix.json write or validation failure
#
# Usage: bash scripts/export-desktop-packaging-assets.sh
# Exit:  0 = ICO, ICNS, and desktop-matrix.json written; 1 = error (see above)

set -euo pipefail

# ── Tool checks ────────────────────────────────────────────────────────────────

if ! command -v rsvg-convert &>/dev/null; then
  echo "[tool-check] ERROR: rsvg-convert not installed or not on PATH." >&2
  echo "             Install: brew install librsvg" >&2
  exit 1
fi

if ! command -v python3 &>/dev/null; then
  echo "[tool-check] ERROR: python3 not found — required for JSON parsing and ICO packing." >&2
  exit 1
fi

if ! command -v iconutil &>/dev/null; then
  echo "[tool-check] ERROR: iconutil not found — required for ICNS packaging." >&2
  echo "             iconutil is a macOS built-in; on non-macOS CI use a prebuilt .icns." >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
PACK_ICO="${SCRIPT_DIR}/lib/pack-ico.py"

if [[ ! -f "${PACK_ICO}" ]]; then
  echo "[tool-check] ERROR: ICO packer not found: ${PACK_ICO}" >&2
  echo "             Expected at scripts/lib/pack-ico.py in the repo root." >&2
  exit 1
fi

# ── Paths ─────────────────────────────────────────────────────────────────────

CANONICAL_JSON="${REPO_ROOT}/mockups/icon-candidates/canonical.json"
CANDIDATES_DIR="${REPO_ROOT}/mockups/icon-candidates"
DESKTOP_DIR="${REPO_ROOT}/site/icons/desktop"
STAGING_DIR=$(mktemp -d)

# Clean up staging on any exit
trap 'rm -rf "${STAGING_DIR}"' EXIT

# ── Parse and validate canonical.json ─────────────────────────────────────────

if [[ ! -f "${CANONICAL_JSON}" ]]; then
  echo "[source-resolve] ERROR: canonical.json not found: ${CANONICAL_JSON}" >&2
  exit 1
fi

PARSED=$(python3 - "${CANONICAL_JSON}" <<'PYEOF'
import json, sys

canon_path = sys.argv[1]
try:
    with open(canon_path) as f:
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
        sys.stderr.write('[source-resolve] ERROR: Missing required field "' + field + key + '" in canonical.json\n')
        sys.exit(1)
    return v

cid    = req(d, 'candidateId')
folder = req(d, 'folder')
svgs   = req(d, 'svgSources')
icon_src = req(svgs, 'icon', 'svgSources')
cname  = d.get('candidateName', folder)

print(cid)
print(folder)
print(icon_src)
print(cname)
PYEOF
) || {
  echo "[source-resolve] FAIL: canonical.json validation failed — see above for details." >&2
  exit 1
}

CANDIDATE_ID=$(    printf '%s\n' "${PARSED}" | sed -n '1p')
CANDIDATE_FOLDER=$(printf '%s\n' "${PARSED}" | sed -n '2p')
SVG_ICON=$(        printf '%s\n' "${PARSED}" | sed -n '3p')
CANDIDATE_NAME=$(  printf '%s\n' "${PARSED}" | sed -n '4p')

# ── Path safety checks ─────────────────────────────────────────────────────────

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

safe_path "${CANDIDATE_FOLDER}" "folder"
safe_path "${SVG_ICON}"         "svgSources.icon"

ABS_ICON="${CANDIDATES_DIR}/${SVG_ICON}"

if [[ ! -f "${ABS_ICON}" ]]; then
  echo "[source-resolve] ERROR: SVG source not found (svgSources.icon): ${ABS_ICON}" >&2
  exit 1
fi
if [[ ! -s "${ABS_ICON}" ]]; then
  echo "[source-resolve] ERROR: SVG source is zero bytes (svgSources.icon): ${ABS_ICON}" >&2
  exit 1
fi

mkdir -p "${DESKTOP_DIR}"

echo "Desktop packaging for ${CANDIDATE_ID} (${CANDIDATE_NAME})..."
echo ""

# ── Render ICO PNG ladder ──────────────────────────────────────────────────────
# Sizes: 16 24 32 48 64 128 256

ICO_SIZES=(16 24 32 48 64 128 256)
ICO_STAGING="${STAGING_DIR}/ico"
mkdir -p "${ICO_STAGING}"

echo "[rasterize] ICO PNG ladder..."
ICO_PNG_LIST=()
for size in "${ICO_SIZES[@]}"; do
  out="${ICO_STAGING}/${size}.png"
  if ! rsvg-convert \
      --width="${size}" \
      --height="${size}" \
      --keep-aspect-ratio \
      --output="${out}" \
      "${ABS_ICON}" 2>&1; then
    echo "[rasterize] ERROR: rsvg-convert failed for ICO frame ${size}x${size}" >&2
    exit 1
  fi
  if [[ ! -s "${out}" ]]; then
    echo "[rasterize] ERROR: ICO frame PNG is zero bytes: ${out}" >&2
    exit 1
  fi
  ICO_PNG_LIST+=("${out}")
  echo "  ✓  ${size}x${size} → ${ICO_STAGING}/${size}.png"
done

# ── Pack ICO ──────────────────────────────────────────────────────────────────

ICO_OUT="${DESKTOP_DIR}/year-planner.ico"
echo ""
echo "[package] Packing ICO (${#ICO_PNG_LIST[@]} frames: ${ICO_SIZES[*]})..."
if ! python3 "${PACK_ICO}" --output "${ICO_OUT}" "${ICO_PNG_LIST[@]}"; then
  echo "[package] ERROR: ICO packing failed — see above for details." >&2
  exit 1
fi

echo "  ✓  platform=windows  format=ico  output=site/icons/desktop/year-planner.ico"

# ── Render ICNS iconset ────────────────────────────────────────────────────────
#
# iconutil requires an .iconset directory containing files with these exact names:
#
#   icon_16x16.png       (16×16 px)
#   icon_16x16@2x.png    (32×32 px — the retina variant of the 16 pt slot)
#   icon_32x32.png       (32×32 px)
#   icon_32x32@2x.png    (64×64 px)
#   icon_128x128.png     (128×128 px)
#   icon_128x128@2x.png  (256×256 px)
#   icon_256x256.png     (256×256 px)
#   icon_256x256@2x.png  (512×512 px)
#   icon_512x512.png     (512×512 px)
#   icon_512x512@2x.png  (1024×1024 px)
#
# Unique pixel sizes to rasterize: 16 32 64 128 256 512 1024

ICNS_UNIQUE_SIZES=(16 32 64 128 256 512 1024)
ICONSET="${STAGING_DIR}/year-planner.iconset"
mkdir -p "${ICONSET}"

echo ""
echo "[rasterize] ICNS iconset..."
for px in "${ICNS_UNIQUE_SIZES[@]}"; do
  out="${STAGING_DIR}/icns_${px}.png"
  if ! rsvg-convert \
      --width="${px}" \
      --height="${px}" \
      --keep-aspect-ratio \
      --output="${out}" \
      "${ABS_ICON}" 2>&1; then
    echo "[rasterize] ERROR: rsvg-convert failed for ICNS ${px}x${px}" >&2
    exit 1
  fi
  if [[ ! -s "${out}" ]]; then
    echo "[rasterize] ERROR: ICNS PNG is zero bytes: ${out}" >&2
    exit 1
  fi
  echo "  ✓  ${px}x${px} → icns_${px}.png"
done

# Populate iconset directory (copying; iconutil does not follow symlinks)
cp "${STAGING_DIR}/icns_16.png"   "${ICONSET}/icon_16x16.png"
cp "${STAGING_DIR}/icns_32.png"   "${ICONSET}/icon_16x16@2x.png"
cp "${STAGING_DIR}/icns_32.png"   "${ICONSET}/icon_32x32.png"
cp "${STAGING_DIR}/icns_64.png"   "${ICONSET}/icon_32x32@2x.png"
cp "${STAGING_DIR}/icns_128.png"  "${ICONSET}/icon_128x128.png"
cp "${STAGING_DIR}/icns_256.png"  "${ICONSET}/icon_128x128@2x.png"
cp "${STAGING_DIR}/icns_256.png"  "${ICONSET}/icon_256x256.png"
cp "${STAGING_DIR}/icns_512.png"  "${ICONSET}/icon_256x256@2x.png"
cp "${STAGING_DIR}/icns_512.png"  "${ICONSET}/icon_512x512.png"
cp "${STAGING_DIR}/icns_1024.png" "${ICONSET}/icon_512x512@2x.png"

# ── Package ICNS via iconutil ─────────────────────────────────────────────────

ICNS_OUT="${DESKTOP_DIR}/year-planner.icns"
echo ""
echo "[package] Packaging ICNS via iconutil..."
if ! iconutil --convert icns --output "${ICNS_OUT}" "${ICONSET}"; then
  echo "[package] ERROR: iconutil failed — see above for details." >&2
  exit 1
fi

if [[ ! -s "${ICNS_OUT}" ]]; then
  echo "[package] ERROR: ICNS output is zero bytes: ${ICNS_OUT}" >&2
  exit 1
fi

echo "  ✓  platform=macos  format=icns  output=site/icons/desktop/year-planner.icns"

# ── Emit desktop-matrix.json ──────────────────────────────────────────────────
# Writes site/icons/desktop-matrix.json; does NOT touch site/icons/matrix.json.

DESKTOP_MATRIX_JSON="${REPO_ROOT}/site/icons/desktop-matrix.json"
GENERATED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
SVG_SRC_REL="mockups/icon-candidates/${SVG_ICON}"
ICO_OUT_REL="site/icons/desktop/year-planner.ico"
ICNS_OUT_REL="site/icons/desktop/year-planner.icns"

echo ""
echo "[contract] Writing desktop-matrix.json..."

python3 - \
  "${DESKTOP_MATRIX_JSON}" \
  "${CANDIDATE_ID}" \
  "${CANDIDATE_NAME}" \
  "${GENERATED_AT}" \
  "${SVG_SRC_REL}" \
  "${ICO_OUT_REL}" \
  "${ICNS_OUT_REL}" <<'PYEOF'
import json, sys

out_path, cand_id, cand_name, gen_at, svg_src, ico_out, icns_out = sys.argv[1:8]

sizes_ico  = [16, 24, 32, 48, 64, 128, 256]
sizes_icns = [16, 32, 64, 128, 256, 512, 1024]

entries = [
    {
        'platform':    'windows',
        'format':      'ico',
        'candidateId': cand_id,
        'src':         svg_src,
        'output':      ico_out,
        'sizes':       sizes_ico,
    },
    {
        'platform':    'macos',
        'format':      'icns',
        'candidateId': cand_id,
        'src':         svg_src,
        'output':      icns_out,
        'sizes':       sizes_icns,
    },
]

desktop_matrix = {
    'schemaVersion': '1.0',
    'candidateId':   cand_id,
    'candidateName': cand_name,
    'generatedAt':   gen_at,
    'entries':       entries,
}

with open(out_path, 'w') as f:
    json.dump(desktop_matrix, f, indent=2)
    f.write('\n')
PYEOF

if [[ $? -ne 0 ]]; then
  echo "[contract] ERROR: Failed to write desktop-matrix.json." >&2
  exit 1
fi

# Validate contract-to-disk consistency
node - "${DESKTOP_MATRIX_JSON}" "${REPO_ROOT}" <<'JSEOF'
const fs   = require('fs');
const path = require('path');
const [,, matrixPath, repoRoot] = process.argv;

let matrix;
try {
  matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));
} catch (e) {
  process.stderr.write('[contract] ERROR: desktop-matrix.json is not valid JSON: ' + e.message + '\n');
  process.exit(1);
}

const missing = [];
for (const entry of matrix.entries) {
  const abs = path.join(repoRoot, entry.output);
  if (!fs.existsSync(abs)) missing.push(entry.output);
}
if (missing.length > 0) {
  process.stderr.write('[contract] ERROR: desktop-matrix.json references missing files:\n');
  for (const p of missing) process.stderr.write('  ' + p + '\n');
  process.exit(1);
}
JSEOF

if [[ $? -ne 0 ]]; then
  echo "[contract] FAIL: post-write consistency check failed — see above." >&2
  exit 1
fi

echo "  ✓  contract=site/icons/desktop-matrix.json  candidateId=${CANDIDATE_ID}"
echo ""
echo "OK: Desktop packaging complete for ${CANDIDATE_ID} (${CANDIDATE_NAME})."
echo "    ICO:      site/icons/desktop/year-planner.ico   (${#ICO_PNG_LIST[@]} frames: ${ICO_SIZES[*]})"
echo "    ICNS:     site/icons/desktop/year-planner.icns  (iconset: ${ICNS_UNIQUE_SIZES[*]})"
echo "    Contract: site/icons/desktop-matrix.json"
