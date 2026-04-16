# M013: Legacy Alignment Cleanup

## Vision
Audit and clean legacy code paths that no longer align with updated jsmdma storage/remote architecture: remove redundant URL-state and uid mechanics, remove hidden feature/share legacy surfaces, and introduce system-follow language/theme behavior with explicit override.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | S01 | high | — | ✅ | After this: app identity/state surfaces operate without uid mechanics and still support multi-planner document flows. |
| S02 | S02 | high | — | ✅ | After this: year/lang/theme are controlled in-app with clean URLs, and language/theme can follow system live unless explicitly overridden. |
| S03 | S03 | medium | — | ✅ | After this: no legacy share or feature-flag surfaces remain in UI/runtime; no dead share or hidden feature controls are visible. |
| S04 | S04 | medium | — | ⬜ | After this: full smoke+e2e and new M013 gates pass, with explicit proof that legacy uid/query/share/feature contracts are gone. |
