# M012/S05 — Research

**Date:** 2026-04-16

## Summary

S05 should attach at the existing S03 export seam, not create a parallel icon-selection path. S03 already gives deterministic canonical inputs (`mockups/icon-candidates/canonical.json`) and a stable PNG contract (`site/icons/matrix.json`) for the C2 winner. The clean extension point for R005 is a dedicated desktop-packaging exporter that consumes the same canonical source set and emits `.ico`/`.icns` plus a desktop-specific contract file.

Current repo/tooling supports this direction with minimal change: `rsvg-convert`, `python3`, `sips`, and `iconutil` are available locally; `magick`, `convert`, `icotool`, and `png2icns` are not. CI runs on `ubuntu-latest` (`.github/workflows/e2e.yml`), so macOS-only `iconutil` cannot be assumed in CI. That means `.icns` generation is deterministic on macOS developers’ machines, while CI should verify produced artifacts rather than requiring runtime `.icns` generation.

For downstream R006, the right output is not just binary files but a machine-checkable contract (desktop matrix) and smoke assertions that prove format integrity, size coverage, and path stability.

## Recommendation

Implement S05 as a **new script** (recommended: `scripts/export-desktop-packaging-assets.sh`) that reuses the canonical source contract and writes desktop outputs under a dedicated path:

- `site/icons/desktop/year-planner.ico`
- `site/icons/desktop/year-planner.icns`
- `site/icons/desktop-matrix.json` (new contract for desktop assets)

Keep `site/icons/matrix.json` unchanged (still 9 PNG entries for R003) to avoid invalidating existing S03 smoke assumptions (`exactly 9 entries`). Desktop packaging should have its own contract file rather than mutating the R003 matrix schema/count.

For portability, use a hybrid toolchain:
- `.icns`: `iconutil` from a generated `.iconset` (macOS-only, deterministic with fixed inputs/order).
- `.ico`: generate deterministic multi-size ICO from PNG payloads via a small in-repo Python pack step (no external ImageMagick/icotool dependency).

## Implementation Landscape

### Key Files

- `scripts/export-canonical-icon-matrix.sh` — existing canonical export seam; keeps winner resolution/path safety checks that S05 should mirror.
- `mockups/icon-candidates/canonical.json` — authoritative winner + svgSources; S05 should consume this, not hardcode `C2-*` paths.
- `site/icons/matrix.json` — current R003 contract (9 PNG entries); treat as stable and unmodified for S05.
- `.github/workflows/e2e.yml` — confirms CI is Ubuntu; informs `.icns` portability strategy.
- `.tests/smoke/icon-export-matrix.spec.js` — existing contract-test style to replicate for desktop artifact checks.
- `scripts/export-desktop-packaging-assets.sh` (new) — recommended S05 entrypoint for deterministic desktop outputs.
- `site/icons/desktop-matrix.json` (new) — recommended downstream contract for R006/S06 checks.
- `.tests/smoke/icon-desktop-packaging.spec.js` (new) — smoke verification for `.ico`/`.icns` integrity and contract agreement.

### Build Order

1. **Regenerate canonical PNG baseline first**
   - Run `bash scripts/export-canonical-icon-matrix.sh`.
   - This ensures desktop packaging starts from a known-good canonical winner state.

2. **Generate deterministic desktop intermediates**
   - From canonical SVG source, render fixed size ladders:
     - ICO sizes: `16,24,32,48,64,128,256`
     - ICNS iconset sizes: `16,32,64,128,256,512,1024` mapped to `icon_*.png`/`@2x` naming.

3. **Package final binaries**
   - Build `.ico` from generated PNG payloads (Python packer, deterministic entry order).
   - Build `.icns` via `iconutil -c icns <iconset-dir> -o site/icons/desktop/year-planner.icns` on macOS.

4. **Write desktop contract**
   - Emit `site/icons/desktop-matrix.json` with: `schemaVersion`, `candidateId`, `generatedAt`, and entries for windows/macOS outputs including source path + size inventory.

5. **Run smoke verification**
   - Verify both binary signatures and declared size coverage against the new desktop matrix.

### Verification Approach

- Canonical pre-step:
  - `bash scripts/export-canonical-icon-matrix.sh`

- Desktop generation:
  - `bash scripts/export-desktop-packaging-assets.sh`

- File/contract verification:
  - `npm --prefix .tests run test -- --reporter=line smoke/icon-desktop-packaging.spec.js`

- Suggested checks inside the new smoke suite:
  - `.ico` header is valid (`00 00 01 00`) and directory contains expected sizes including 256.
  - `.icns` magic is valid (`icns`) and required icon chunks (or expected iconset-derived coverage) exist.
  - `site/icons/desktop-matrix.json` is valid JSON and points to existing files.
  - `candidateId` in desktop matrix matches canonical winner.

- Regression checks to keep R003 stable:
  - `npm --prefix .tests run test -- --reporter=line smoke/icon-export-matrix.spec.js`

## Constraints

- Static-file repo: outputs must be committed as files under `site/` (no runtime bundler step).
- CI portability: Ubuntu runners cannot execute macOS `iconutil`; S05 must not require runtime `.icns` creation in CI.
- Existing S03 smoke enforces 9-entry `site/icons/matrix.json`; S05 should not break this contract.
- No ImageMagick/icotool/png2icns currently available in repo environment.

## Common Pitfalls

- **Mutating `site/icons/matrix.json` for desktop entries** — this breaks the locked S03 count/contract checks; keep desktop contract separate.
- **Relying on mac-only tools for all packaging** — causes CI-only failures; split generation (mac local) from artifact verification (cross-platform).
- **Single-size ICO** — many consumers expect multi-resolution ICO; include full desktop ladder.
- **Implicit winner path assumptions** — always resolve from `canonical.json` to avoid drift if winner changes later.

## Open Risks

- `.icns` reproducibility depends on macOS toolchain availability/version (`iconutil`).
- If future CI requires fresh `.icns` regeneration, a non-mac build path/tool will be needed (currently absent).
- Windows shell rendering quality can vary if ICO payload order/size coverage is incomplete; smoke checks must validate size set explicitly.
