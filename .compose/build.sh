#!/bin/bash
# Compose index.html from fragments using m4
# Usage: .compose/build.sh
#
# The changequote directive in index.html.m4 switches m4's quote characters
# from the default backtick/apostrophe to {{{{ and }}}} — a sequence that
# never appears in the HTML/Vue templates. This prevents m4 from
# misinterpreting JavaScript template literals and apostrophes.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

m4 -P .compose/index.html.m4 > site/index.html

echo "✓ site/index.html composed from .compose/ fragments ($(wc -l < site/index.html | tr -d ' ') lines)"
