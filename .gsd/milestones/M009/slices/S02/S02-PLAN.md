# S02: StorageLocal full rewrite

**Goal:** Rewrite StorageLocal.js to use the new localStorage schema (plnr:uuid, rev:uuid, dev, prefs:uid etc.) and update entries.js and Storage.js to use new day field names (tp/tl/col/notes/emoji). All 15 tests must pass.
**Demo:** After this: After this: all 14 tests green. localStorage in browser shows plnr:uuid keys with readable day objects.

## Tasks
- [x] **T01: Rewrote StorageLocal.js to new M009 schema; updated entries.js and Storage.js field names; all 15 tests pass.** — Full rewrite of StorageLocal.js to new schema. Update entries.js day field accessors. Update Storage.js field accessors.
  - Estimate: 2h
  - Files: js/service/StorageLocal.js, js/vue/methods/entries.js, js/service/Storage.js
  - Verify: cd .tests && npx playwright test -- 15 passed
