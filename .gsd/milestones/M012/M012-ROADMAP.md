# M012: Brand/Icon System Overhaul

## Vision
Prepare 2–3 UI icon/logo mock sets, choose a stronger set, then ship live wiring plus full iOS/Android/browser/desktop variants, including Windows/macOS packaging assets for future Electron.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | S01 | high | — | ✅ | A side-by-side candidate gallery shows 2–3 complete icon/logo systems usable across small and large surfaces. |
| S02 | S02 | medium | — | ✅ | One winning set is explicitly selected and marked canonical; non-selected sets are archived as alternatives. |
| S03 | S03 | high | — | ✅ | Exported asset matrix exists for web/PWA, iOS, Android any/maskable/monochrome requirements. |
| S04 | S04 | medium | — | ⬜ | Year Planner serves and references the new selected assets in index.html and manifest.json. |
| S05 | Native Desktop Packaging Asset Pack | medium | S03 | ⬜ | `.ico` and `.icns` files are produced and validated for future Windows/macOS Electron bundling. |
| S06 | Integrated Verification and Sign-off | low | S04, S05 | ⬜ | Existing test flow passes with new assets and key visual spot checks at critical sizes/surfaces are recorded. |
