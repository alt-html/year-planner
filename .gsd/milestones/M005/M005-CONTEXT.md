# M005: UI/UX Design Research — Context

**Gathered:** 2026-03-14
**Status:** Active

## Project Description

The Year Planner uses Bootstrap 4 with minimal customization — Roboto font, whitesmoke backgrounds, aliceblue weekends, a flat sticky navbar with grey icon buttons. The result is described as "tired", "muddy", "generic", and "business-like". Bootstrap's normalizing design philosophy flattens visual character unless the author actively counteracts it.

## Why This Milestone

User feedback: the app feels generic and business-like. The colour choices are washed out. The styling lacks energy and personality. Before implementing changes, we need to research options and present 2-3 concrete visual alternatives for selection.

## User-Visible Outcome

### When this milestone is complete, the user can:

- View 2-3 self-contained HTML mockup pages showing different design directions
- Compare fresher, punchier colour palettes and typography
- See nav alternatives that "get out of the way" (e.g. collapsing the top-left nav elements)
- Choose a direction for implementation in the next milestone

## Current Design Problems

1. **Muddy colours** — whitesmoke (#f5f5f5), aliceblue (#f0f8ff), #6c757d grey. No contrast, no energy.
2. **Generic typography** — Roboto 300/400/600 is the default "safe" font. No personality.
3. **Flat navbar** — White background, grey icon buttons, no visual hierarchy. Title + Year dropdown + icons all compete for attention at the same elevation.
4. **Bootstrap 4 defaults** — Default borders, default modal styling, default button colors. Nothing says "this was designed".
5. **No spatial distinction** — Header row, data grid, and footer all share the same visual weight.
6. **Dark mode is an afterthought** — Just colour inversions (#2B2B2B, #8C8C8C), no atmosphere.
7. **Weekend/today/past highlighting** — aliceblue, lightyellow, #f0f0f0 are barely distinguishable.

## Constraints

- Must stay on Bootstrap 4 (CDN loaded, no build step)
- Customization via CSS overrides only — no Bootstrap SCSS compilation
- Must work with the existing 12-month grid layout
- Must preserve Vue template bindings
- Must support both light and dark themes
- Mockups are static HTML — not wired to Vue, just visual fidelity

## Scope

### In Scope

- 2-3 static HTML mockup pages in `/mockups/`
- Each mockup shows the year grid, nav, and footer with a distinct design direction
- Custom CSS showcasing the proposed palette, typography, spacing, and nav treatment
- Brief design rationale for each option

### Out of Scope

- Implementing the chosen design (next milestone)
- Functional Vue interactivity in mockups
- Mobile responsive breakpoints (desktop fidelity only)
