# M006: UI/UX Polish & Finalisation — Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

## Project Description

The Year Planner app now has two switchable themes (Ink & Paper / Crisp & Clear) with light and dark modes, applied from design mockups created in M005. This milestone polishes remaining visual gaps between the mockups and the live application, and ensures responsive, consistent behaviour across all breakpoints and user flows.

## Why This Milestone

M005 produced excellent design mockups and the core theme system was applied to the app. However, iterative styling revealed that many details need fine-tuning: grid spacing, typography consistency, responsive behaviour, and visual polish across all interactive elements. This milestone systematically addresses those gaps.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Use the Year Planner with both themes and both light/dark modes and find no visual inconsistencies
- View the planner across desktop, tablet, and mobile breakpoints with consistent, clean layout
- Interact with all modals, tooltips, controls, and navigation with typography and colours that follow the active theme

### Entry point / environment

- Entry point: http://localhost:8080
- Environment: browser (desktop + mobile viewports)
- Live dependencies involved: none (CDN fonts loaded at runtime)

## Completion Class

- Contract complete means: all E2E tests pass, compose build is identical, visual spot-checks pass
- Integration complete means: both themes × both modes render correctly at desktop/tablet/mobile
- Operational complete means: none (static site)

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- Both themes (ink, nordic) in both modes (light, dark) render the grid, modals, tooltips, nav, footer, and controls consistently with the mockup design language
- The planner is usable and visually clean at mobile (375px), tablet (768px), and desktop (1280px+) widths

## Risks and Unknowns

- Bootstrap 4 specificity conflicts — some Bootstrap default styles may override theme CSS in edge cases
- Responsive grid at small breakpoints — the 12-month grid uses complex Bootstrap column classes that may need per-breakpoint tuning

## Existing Codebase / Prior Art

- `css/main.css` — All theme variables, grid, modal, tooltip, and control styling
- `css/yp-dark.css` — Dark mode overrides
- `mockups/combined-themes.html` — Reference mockup with both themes
- `.compose/fragments/` — HTML fragments for grid, modals, nav, footer, rail

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions.

## Scope

### In Scope

- Visual polish: typography, spacing, colours, borders across all components
- Responsive layout: ensure grid, nav, footer, modals, rail work at all breakpoints
- Theme consistency: verify every interactive element follows theme variables
- Dark mode completeness: ensure no un-themed Bootstrap defaults leak through

### Out of Scope / Non-Goals

- New features or functionality
- New themes beyond Ink & Paper and Crisp & Clear
- JavaScript behaviour changes (beyond tooltip re-init if needed)
- API or backend changes

## Technical Constraints

- No build step — CSS changes only, served directly by nginx
- Bootstrap 4 loaded from CDN — cannot modify Bootstrap source, only override
- m4 compose pipeline must remain in sync (`build.sh` produces identical `index.html`)
