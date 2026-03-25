# GSD State

**Active Milestone:** M007 — Boot v3 Uplift ✅ complete
**Active Slice:** none
**Phase:** complete

## Milestone Registry
- ✅ **M001:** Migration
- ✅ **M002:** JS Modularisation
- ✅ **M003:** Storage Modernisation
- ✅ **M004:** Auth & API Contract
- ✅ **M007:** Boot v3 Uplift

## Recent Decisions
- @alt-javascript v3.0.3 adopted across config/logger/cdi/common
- ProfileAwareConfig + BrowserProfileResolver replaces v2 WindowLocationSelectiveConfig URL-key pattern
- ProfileAwareConfig used directly (not wrapped in ConfigFactory.getConfig) — implements has()/get() natively
- Global boot root populated manually in main.js (Boot.boot() skipped — can't wrap ProfileAwareConfig in browser mode)
- Context/Singleton helpers from v3 cdi bundle replace bare class arrays in contexts.js
- loggerFactory/loggerCategoryCache removed from contexts.js — provided via global root, picked up by detectGlobalContextComponents()

## Blockers
- None

## Next Action
None queued. All milestones complete.
