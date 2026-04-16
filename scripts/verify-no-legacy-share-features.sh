#!/usr/bin/env bash
# verify-no-legacy-share-features.sh
#
# Enforces that share and feature-flag UI surfaces have been removed from
# compose fragments and Vue runtime code.
#
# Exit 0 = clean.
# Exit 1 = violations found (prints file:line matches).

set -euo pipefail

COMPOSE_FRAGMENTS=".compose/fragments"
SITE_VUE="site/js/vue"
SITE_CONFIG="site/js/config/contexts.js"

FOUND=0

run_check() {
    local label="$1"
    local pattern="$2"
    shift 2
    local result
    result=$(grep -rn -P "$pattern" "$@" 2>/dev/null || true)
    if [ -n "$result" ]; then
        echo "  [$label]"
        echo "$result" | sed 's/^/    /'
        FOUND=1
    fi
}

echo "Checking compose fragments and Vue runtime for forbidden share/feature surfaces..."
echo ""

# ── Compose fragment checks ───────────────────────────────────────────────────
run_check "share.html include"     "modals/share\.html"         "$COMPOSE_FRAGMENTS"
run_check "feature.html include"   "modals/feature\.html"       "$COMPOSE_FRAGMENTS"
run_check "sharePlanner call"      "sharePlanner\s*\("          "$COMPOSE_FRAGMENTS"
run_check "showFeatureModal frag"  "showFeatureModal"           "$COMPOSE_FRAGMENTS"
run_check "feature.debug frag"     "feature\.debug"             "$COMPOSE_FRAGMENTS"
run_check "feature.signin frag"    "feature\.signin"            "$COMPOSE_FRAGMENTS"

# ── Vue runtime checks ────────────────────────────────────────────────────────
run_check "shareModal vue"         "shareModal"                 "$SITE_VUE" "$SITE_CONFIG"
run_check "featureModal vue"       "featureModal"               "$SITE_VUE" "$SITE_CONFIG"
run_check "sharePlanner vue"       "sharePlanner\s*\("          "$SITE_VUE"
run_check "showFeatureModal vue"   "showFeatureModal"           "$SITE_VUE" "$SITE_CONFIG"
run_check "feature\. binding vue"  "feature\."                  "$SITE_VUE" "$SITE_CONFIG"
run_check "model-features import"  "model-features"             "$SITE_VUE" "$SITE_CONFIG"

# ── Fragment file existence ───────────────────────────────────────────────────
if [ -f "$COMPOSE_FRAGMENTS/modals/share.html" ]; then
    echo "  [share.html exists] $COMPOSE_FRAGMENTS/modals/share.html should have been deleted"
    FOUND=1
fi
if [ -f "$COMPOSE_FRAGMENTS/modals/feature.html" ]; then
    echo "  [feature.html exists] $COMPOSE_FRAGMENTS/modals/feature.html should have been deleted"
    FOUND=1
fi
if [ -f "site/js/vue/model-features.js" ]; then
    echo "  [model-features.js exists] site/js/vue/model-features.js should have been deleted"
    FOUND=1
fi

# ── Result ────────────────────────────────────────────────────────────────────
if [ "$FOUND" -eq 1 ]; then
    echo ""
    echo "❌ Forbidden share/feature surfaces found."
    exit 1
else
    echo "✅ No forbidden share/feature surfaces found."
    exit 0
fi
