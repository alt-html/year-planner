# M006: UI/UX Polish & Finalisation

**Vision:** Systematically close remaining visual gaps between the design mockups and the live application, ensuring both themes render consistently across all components, modes, and breakpoints.

## Success Criteria

- Both themes (Ink & Paper, Crisp & Clear) visually match the mockups at desktop width for grid, nav, and footer
- All interactive elements (modals, dropdowns, tooltips, buttons) follow theme variables in both light and dark modes
- The planner is usable and visually clean at mobile (375px), tablet (768px), and desktop (1280px+) breakpoints
- No Bootstrap default colours or fonts leak through un-themed in any mode

## Key Risks / Unknowns

- Bootstrap 4 specificity — some edge-case components may need `!important` overrides
- Responsive grid breakpoints — the 12-month column layout uses complex Bootstrap responsive classes

## Verification Classes

- Contract verification: 14 existing E2E tests + compose build identity check
- Integration verification: visual spot-check of both themes × both modes at 3 breakpoints
- Operational verification: none (static site)
- UAT / human verification: user confirms visual quality matches design intent

## Milestone Definition of Done

This milestone is complete only when all are true:

- All slices completed and verified
- Both themes × both modes visually audited at desktop, tablet, and mobile
- All 14 E2E tests pass
- User confirms visual polish meets expectations

## Slices

- [ ] **S01: Grid & typography polish** `risk:medium` `depends:[]`
  > After this: grid cells, day column, weekend/today highlighting, and row spacing match the mockup for both themes
- [ ] **S02: Dark mode completeness audit** `risk:medium` `depends:[S01]`
  > After this: every Bootstrap component (dropdowns, modals, form controls, buttons) is fully themed in dark mode with no default leaks
- [ ] **S03: Responsive layout polish** `risk:low` `depends:[S01]`
  > After this: grid, nav, footer, modals, rail, and floating controls render cleanly at mobile (375px), tablet (768px), and desktop (1280px+)
