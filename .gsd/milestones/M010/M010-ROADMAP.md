# M010: 

## Vision
Relocate all web-serving assets (index.html, css/, js/, manifest.json, icons/favicons) into a site/ subdirectory so the project root is tooling/config only. Update the .compose build pipeline, Playwright test harness, and Docker image build to target site/ instead of the root.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | Move assets to site/ and update tooling | low | — | ✅ | After this: .compose/build.sh writes site/index.html, all Playwright smoke tests pass served from site/. |
