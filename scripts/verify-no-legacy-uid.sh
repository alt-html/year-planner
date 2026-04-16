#!/usr/bin/env bash
# verify-no-legacy-uid.sh — uid navigation surface grep gate.
#
# Fails (exit 1) if any runtime source file reintroduces uid-based URL
# navigation parameters that were eliminated in M013/S01.
#
# Checked patterns:
#   \?uid=   — URL query param ?uid= in JS strings or HTML attributes
#   [?&]id=  — URL query param ?id= or &id= (former language-switch param)
#
# Excluded paths:
#   site/js/vendor/**  — third-party libraries (may have unrelated uid refs)
#   .tests/**          — test fixtures intentionally seed legacy shapes
#   .gsd/**            — project management artifacts
#
# Usage:
#   bash scripts/verify-no-legacy-uid.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SITE_DIR="$REPO_ROOT/site"
ERRORS=0

echo "=== uid navigation surface scan (site/index.html + site/js/**) ==="

# Pattern 1: URL query param ?uid= (navigation-based uid)
PAT1='\?uid='
RESULTS1=$(rg \
    --glob '!**/vendor/**' \
    --glob '**/*.{js,html}' \
    --line-number \
    "$PAT1" \
    "$SITE_DIR" 2>/dev/null || true)

if [[ -n "$RESULTS1" ]]; then
    echo ""
    echo "FAIL: '?uid=' found in runtime source (pattern: $PAT1):"
    echo "$RESULTS1"
    ERRORS=$((ERRORS + 1))
fi

# Pattern 2: URL query param ?id= or &id= (former language-switch param)
PAT2='[?&]id='
RESULTS2=$(rg \
    --glob '!**/vendor/**' \
    --glob '**/*.{js,html}' \
    --line-number \
    "$PAT2" \
    "$SITE_DIR" 2>/dev/null || true)

if [[ -n "$RESULTS2" ]]; then
    echo ""
    echo "FAIL: '[?&]id=' found in runtime source (pattern: $PAT2):"
    echo "$RESULTS2"
    ERRORS=$((ERRORS + 1))
fi

echo ""
if [[ $ERRORS -gt 0 ]]; then
    echo "=== FAIL: $ERRORS uid navigation surface(s) found — clean before shipping ==="
    exit 1
else
    echo "=== PASS: no uid navigation surfaces found in runtime source ==="
    exit 0
fi
