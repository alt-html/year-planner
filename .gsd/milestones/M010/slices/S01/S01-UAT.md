# S01: Move assets to site/ and update tooling — UAT

**Milestone:** M010
**Written:** 2026-04-02T22:50:00.266Z

## UAT — S01: Move assets to site/\n\n### Verify dev server\n1. `cd .tests && npx http-server ../site -p 8080 -c-1`\n2. Open http://localhost:8080 — year planner loads, grid renders 12 months\n\n### Verify compose pipeline\n1. `.compose/build.sh` — output line says `site/index.html composed`\n2. Confirm `site/index.html` exists and `index.html` does not exist at project root\n\n### Verify root is clean\n- No `*.html`, `*.png`, `*.ico`, or `manifest.json` at project root\n- `ls site/` shows css/, js/, manifest.json, favicon*, android-chrome*, apple-touch-icon.png, index.html
