---
id: T01
parent: S02
milestone: M002
provides:
  - 4 domain-grouped model sub-files under js/vue/model/
  - All 17 dynamic fields declared with initial values
  - Updated model.js with spread merge of sub-files
key_files:
  - js/vue/model/calendar.js
  - js/vue/model/planner.js
  - js/vue/model/auth.js
  - js/vue/model/ui.js
  - js/vue/model.js
key_decisions:
  - Flat spread merge preserves runtime model shape — no template or method changes needed
  - CDI fields (qualifier, logger, api, messages, storage, storageLocal) and feature kept in model.js
  - lang and theme placed in plannerState (part of planner identity/preferences context)
patterns_established:
  - Model sub-files export named const objects (calendarState, plannerState, authState, uiState)
  - model.js imports and spreads all sub-files flat alongside CDI fields
observability_surfaces:
  - none
duration: 10m
verification_result: passed
completed_at: 2026-03-14
blocker_discovered: false
---

# T01: Create 4 model sub-files and update model.js merge point

**Split monolithic model.js into 4 domain-grouped source files with flat spread merge**

## What Happened

Created `js/vue/model/` directory with 4 sub-files:
- `calendar.js` — 10 fields: DateTime, nyear, year, daysOfWeek, monthsOfYear, firstWeekdayOfMonth, daysInMonth, cyear, cmonth, cday
- `planner.js` — 12 fields: uid, month, day, entry, entryType, entryColour, shareUrl, planner, identities, preferences, updated, name, share, pageLoadTime, lang, theme
- `auth.js` — 17 fields: uuid, username, password, newpassword, peek, peeknp, rememberme, changeuser, changepass, email, emailverified, changeemail, mobile, mobileverified, donation, paymentSuccess, receiptUrl, registered, signedin
- `ui.js` — 9 fields: rename, changepass, error, warning, modalError, modalErrorTarget, modalWarning, modalSuccess, loaded, touch

All 17 dynamic fields (previously ghost fields only set by Application.js) now declared with initial values. model.js imports all 4 and spreads flat. No field duplicates.

## Verification

- `cd .tests && npx playwright test` — all 14 tests passed (15.8s)
- Sort/uniq duplicate check on all sub-file fields — no duplicates found

## Diagnostics

None needed — flat spread produces identical runtime model.

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `js/vue/model/calendar.js` — new, 10 calendar fields
- `js/vue/model/planner.js` — new, 12 planner fields (+ lang, theme)
- `js/vue/model/auth.js` — new, 17 auth fields
- `js/vue/model/ui.js` — new, 9 UI fields (+ rename, changepass)
- `js/vue/model.js` — rewritten to import sub-files and spread flat alongside CDI fields
