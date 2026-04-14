# Milestones

## v1.4 Bootstrap 5 & UI Generalisation (Shipped: 2026-04-14)

**Phases completed:** 3 phases (13-15), 4 plans

**Key accomplishments:**

- Bootstrap 4.3.1 to 5.3.8 CDN swap with SRI hashes; all data-toggle/dismiss/target renamed to data-bs-*; deprecated utility classes replaced (.no-gutters to .g-0, .close to .btn-close, .sr-only to .visually-hidden, .btn-block to .d-grid, directional .ml-* to .ms-*)
- Feature modal converted to Vue-reactive state — eliminates last Bootstrap JS dependency
- BS5 native data-bs-theme="dark" wired alongside .yp-dark class; redundant dark CSS overrides removed from yp-dark.css
- CSS generalisation — design-tokens.css, rail.css, dots.css extracted from main.css; 31 bare custom properties renamed to --yp-* namespace
- SRI integrity hashes added for Phosphor Icons CDN; hardcoded colours replaced with design tokens

---

## v1.3 jsmdma Sync (Shipped: 2026-04-13)

**Phases completed:** 2 phases (11-12), 5 plans

**Key accomplishments:**

- jsmdma HLC sync protocol implemented — SyncClient.js with markEdited/sync/prune, Api.js rewritten to POST /year-planner/sync, StorageRemote.js deleted
- Per-field HLC write-path wired — every day entry edit stamps dot-path HLC entries to rev:{uuid} in localStorage
- Code modernisation complete — SquareUp, lodash, donate flag removed; 7 orphan modal fragments deleted; CDI wiring audited
- Rail migrated into Vue — jQuery/Bootstrap JS bridge removed, flyout UI with planner selector and settings
- Contract tests against live jsmdma backend — signed JWT minting, run-local.js server lifecycle, SYNC-08 prune verification

**Tech debt accepted:** 4 items (see milestones/v1.3-MILESTONE-AUDIT.md)

---
