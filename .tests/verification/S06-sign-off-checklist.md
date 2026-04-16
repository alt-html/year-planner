# S06 Icon Integration — Sign-off Checklist

**Milestone:** M012 — Icon Integration  
**Requirement:** R006 — Integrated verification with executable regression evidence  
**Runner:** `bash scripts/verify-icon-integration-signoff.sh`  
**npm alias:** `npm --prefix .tests run test:icon-signoff`

---

## How to run the integrated sign-off

From the repository root:

```bash
bash scripts/verify-icon-integration-signoff.sh
```

Exit code 0 = all stages green. Exit code 1 = a stage failed; see the JSON report for the
failing stage name and command.

---

## Required surfaces

### Web / PWA (verified via `site/icons/matrix.json`)

| Platform | Purpose    | Size | File                                 |
|----------|------------|------|--------------------------------------|
| web      | any        | 16   | `site/icons/favicon-16x16.png`       |
| web      | any        | 32   | `site/icons/favicon-32x32.png`       |
| ios      | any        | 180  | `site/icons/apple-touch-icon-180x180.png` |
| pwa      | any        | 192  | `site/icons/pwa-any-192x192.png`     |
| pwa      | any        | 512  | `site/icons/pwa-any-512x512.png`     |
| pwa      | maskable   | 192  | `site/icons/pwa-maskable-192x192.png` |
| pwa      | maskable   | 512  | `site/icons/pwa-maskable-512x512.png` |
| pwa      | monochrome | 192  | `site/icons/pwa-monochrome-192x192.png` |
| pwa      | monochrome | 512  | `site/icons/pwa-monochrome-512x512.png` |

### Desktop packaging (verified via `site/icons/desktop-matrix.json`)

| Platform | Format | File                                      |
|----------|--------|-------------------------------------------|
| windows  | ICO    | `site/icons/desktop/year-planner.ico`    |
| macOS    | ICNS   | `site/icons/desktop/year-planner.icns`   |

---

## Artifact locations

| Artifact                       | Path                                                                    |
|-------------------------------|-------------------------------------------------------------------------|
| Sign-off HTML sheet            | `.tests/test-results/icon-visual-signoff/S06-visual-sign-off.html`     |
| Sign-off PNG screenshot        | `.tests/test-results/icon-visual-signoff/S06-visual-sign-off-sheet.png` |
| Integrated sign-off report     | `.tests/test-results/icon-visual-signoff/S06-sign-off-report.json`      |

---

## Runner stages

The runner executes these eight stages in order. Any failure stops the run immediately.

| # | Stage name                       | Command / action                                                               |
|---|----------------------------------|--------------------------------------------------------------------------------|
| 1 | `export-canonical-icon-matrix`   | `bash scripts/export-canonical-icon-matrix.sh`                                 |
| 2 | `export-desktop-packaging-assets`| `bash scripts/export-desktop-packaging-assets.sh`                              |
| 3 | `smoke-icon-export-matrix`       | `npm --prefix .tests run test -- --reporter=line smoke/icon-export-matrix.spec.js` |
| 4 | `smoke-icon-live-wiring`         | `npm --prefix .tests run test -- --reporter=line smoke/icon-live-wiring.spec.js`   |
| 5 | `smoke-icon-desktop-packaging`   | `npm --prefix .tests run test -- --reporter=line smoke/icon-desktop-packaging.spec.js` |
| 6 | `s06-visual-sign-off`            | `npm --prefix .tests run test -- --reporter=line verification/S06-visual-sign-off.spec.js` |
| 7 | `full-playwright-suite`          | `npm --prefix .tests run test -- --reporter=line`                              |
| 8 | `artifact-assertions`            | Checks HTML, PNG, and JSON artifacts are present and non-zero byte             |

---

## Human review steps

After the runner exits 0, a reviewer should confirm:

1. **Open the sign-off HTML sheet** — `.tests/test-results/icon-visual-signoff/S06-visual-sign-off.html` — and visually verify that each icon card renders a recognisable icon at the labelled size.

2. **Inspect the PNG screenshot** — `.tests/test-results/icon-visual-signoff/S06-visual-sign-off-sheet.png` — to confirm the full sheet was captured and all surface labels are visible.

3. **Read the JSON report** — `.tests/test-results/icon-visual-signoff/S06-sign-off-report.json` — and confirm:
   - `verdict` is `"pass"`
   - All eight stage entries have `"verdict": "pass"` and `"exitCode": 0`
   - `artifacts.htmlOk` and `artifacts.screenshotOk` are both `true`

4. **Check desktop assets directly:**
   - `file site/icons/desktop/year-planner.ico` — should report a Windows icon file
   - `file site/icons/desktop/year-planner.icns` — should report an Apple Icon Image

5. **Mark R006 satisfied** once all of the above checks pass.

---

## Failure diagnosis

If the runner exits 1, read `.tests/test-results/icon-visual-signoff/S06-sign-off-report.json`:

- `failedStage` — name of the first stage that failed
- `stages[*].verdict` — per-stage pass/fail
- `stages[*].command` — exact command to re-run in isolation for debugging

Common failure causes:

| Symptom | Likely cause |
|---------|--------------|
| Stage 1 or 2 fails | `rsvg-convert` or `iconutil` not on PATH; run `brew install librsvg` |
| Smoke stage fails | Matrix or desktop-matrix JSON out of sync; re-run export scripts first |
| Stage 6 fails | Missing required surface in matrix.json; check `site/icons/*.json` |
| Stage 7 fails | App regression in non-icon tests; run full suite with `--headed` to inspect |
| Stage 8 fails | HTML/PNG artifacts not written; stage 6 likely failed silently |
