# M008: 

## Vision
Extend the day data model with a tagline ('1', ≤32 chars), long-form notes ('3'), and a single emoji ('4'). Update cell display to show emoji + tagline prefix with ellipsis. Redesign the entry modal with distinct tagline, notes, and emoji fields. Add an emoji stamp mode to the rail — a tabbed picker flyout that lets users paint emoji onto cells by clicking or dragging, parallel to the colour marker mode.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | Data layer — extend day schema | low | — | ⬜ | After this: new getters work, all fields persist to localStorage, 14 E2E tests green. |
| S02 | Cell display + entry modal | low | S01 | ⬜ | After this: entry modal has three distinct fields; cells show emoji + tagline preview. |
| S03 | Emoji stamp rail mode | medium | S01, S02 | ⬜ | After this: full emoji stamp mode works end-to-end — pick, paint, persist. |
