# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.3 — jsmdma Sync

**Shipped:** 2026-04-13
**Phases:** 2 | **Plans:** 5

### What Was Built
- jsmdma HLC-based bidirectional sync protocol (SyncClient → PlannerStore + SyncClientAdapter + SyncScheduler)
- Per-field HLC write-path on every day entry edit
- Vertical rail migrated into Vue with flyout UI (planner selector, theme, auth)
- Contract tests against live jsmdma backend with signed JWT minting
- Code modernisation: StorageRemote deleted, SquareUp/lodash/donate flag removed, 7 orphan modals deleted

### What Worked
- **Wave-based parallel execution** — Phase 12's 2 plans ran in separate worktrees, merged cleanly
- **UAT-driven bug discovery** — User testing found 3 real issues (this.$el in Vue 3, CSS flyout visibility, hidden navbar menu) that automated tests missed
- **Audit before completion** — Milestone audit caught checkbox gaps and documented tech debt before archiving
- **Incremental architecture evolution** — SyncClient.js CDI singleton evolved naturally into PlannerStore-embedded SyncClientAdapter without requiring a rewrite phase

### What Was Inefficient
- **Phase 11 SUMMARY divergence** — Architecture descriptions in SUMMARYs became stale as Phase 12 evolved the sync layer. SUMMARYs should describe what shipped, not predict future architecture.
- **Phase 11 missing VERIFICATION.md** — Procedural gap; all requirements were validated through other sources but formal verification was skipped
- **Hidden navbar menu** — The planner selector was invisible in the old Bootstrap dropdown after jQuery removal; UAT was the only thing that caught this

### Patterns Established
- **`document.querySelector` over `this.$el.querySelector`** in Vue 3 — `this.$el` can be a text node with multiple root children
- **CSS `.open` class + `v-bind:class` for flyouts** — `v-show` alone is insufficient when CSS uses opacity/pointer-events transitions
- **Rail flyout pattern** — all submenus use `railFlyout` reactive property with `toggleFlyout(name)` method
- **Contract test JWT minting** — `crypto.createHmac('sha256', secret)` for test-only signed JWTs against run-local.js

### Key Lessons
1. **UAT catches UI integration bugs that E2E tests miss** — automated tests don't exercise visual discoverability
2. **Architecture evolves faster than documentation** — SUMMARYs should be treated as point-in-time records, not living architecture docs
3. **jQuery/Bootstrap JS removal must be paired with UI migration** — removing the bridge without moving menus into Vue leaves features invisible

### Cost Observations
- Model mix: predominantly opus for execution, sonnet for subagents
- Phase 11: 3 plans across 2 days
- Phase 12: 2 plans + 3 UAT fixes in 1 day

---

## Cross-Milestone Trends

| Milestone | Phases | Plans | Key Theme |
|-----------|--------|-------|-----------|
| v1.0 Foundation | 4 | 8 | m4 build, CDI, module split |
| v1.1 UX & Boot | 3 | 3 | UI polish, boot v3 upgrade |
| v1.2 Data Model | 3 | 5 | Day schema, localStorage redesign |
| v1.3 jsmdma Sync | 2 | 5 | HLC sync, rail Vue migration |
