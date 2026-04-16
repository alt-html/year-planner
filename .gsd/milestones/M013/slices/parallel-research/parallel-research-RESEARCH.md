# M013 Parallel Research

## Summary

Parallel research for milestone M013 completed and validated the sequence:
1. Remove URL-coupled runtime state.
2. Remove uid-dependent identity surfaces.
3. Add system-follow preference modes for language/theme with explicit override.
4. Preserve OAuth callback query handling only where protocol-required.

## Key Findings

- S01 should establish UUID userKey persistence and remove uid navigation coupling first.
- S02 should implement clean URL behavior plus system-follow language/theme using browser-native events (`matchMedia` and `languagechange`).
- Verification must include targeted E2E coverage for no hard navigation and live system-follow behavior.

## Recommended Order

1. Storage/runtime contract cleanup (S01)
2. System-follow preference implementation (S02)
3. Legacy share/feature-surface removal (S03)
4. Full regression and grep gates (S04)
