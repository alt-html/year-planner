#!/usr/bin/env bash
# verify-no-url-state-params.sh
#
# Enforces that app-state query params (year / lang / theme) are not read from
# the URL in runtime code. OAuth callback params (token, code, state,
# code_verifier) and planner share params (name, share) are exempt.
#
# Exit 0 = clean.
# Exit 1 = violations found (prints file:line matches).

set -euo pipefail

SITE_JS="site/js"

# Guard: directory must exist
if [ ! -d "$SITE_JS" ]; then
    echo "❌ Runtime source directory not found: $SITE_JS"
    exit 1
fi

FOUND=0

# ── Pattern checks ──────────────────────────────────────────────────────────────
# Each grep uses -n (line numbers) and -P (Perl-compatible regex) for precision.
# Patterns cover the two access styles in this codebase:
#   1. urlParam('year') — direct call to the utility function
#   2. searchParams.get('year') — Web API access
# Both single and double quotes are covered.

run_check() {
    local label="$1"
    local pattern="$2"
    local result
    result=$(grep -rn --include="*.js" -P "$pattern" "$SITE_JS" 2>/dev/null || true)
    if [ -n "$result" ]; then
        echo "  [$label]"
        echo "$result" | sed 's/^/    /'
        FOUND=1
    fi
}

echo "Checking runtime code for forbidden app-state query-param surfaces..."
echo ""

run_check "urlParam year"        "urlParam\s*\(\s*['\"]year['\"]"
run_check "urlParam lang"        "urlParam\s*\(\s*['\"]lang['\"]"
run_check "urlParam theme"       "urlParam\s*\(\s*['\"]theme['\"]"
run_check "searchParams year"    "searchParams\.get\s*\(\s*['\"]year['\"]"
run_check "searchParams lang"    "searchParams\.get\s*\(\s*['\"]lang['\"]"
run_check "searchParams theme"   "searchParams\.get\s*\(\s*['\"]theme['\"]"
run_check "url.parameters year"  "url\.parameters\s*\.\s*year"
run_check "url.parameters lang"  "url\.parameters\s*\.\s*lang"
run_check "url.parameters theme" "url\.parameters\s*\.\s*theme"

# ── Result ──────────────────────────────────────────────────────────────────────
if [ "$FOUND" -eq 1 ]; then
    echo ""
    echo "❌ Forbidden app-state query-param surfaces found in runtime code."
    echo "   Use stored preferences (prefs:{userKey}) instead of URL params for"
    echo "   year, lang, and theme. OAuth params (token, code, state) are exempt."
    exit 1
else
    echo "✅ No forbidden app-state query-param surfaces found in runtime code."
    exit 0
fi
