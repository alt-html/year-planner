---
status: complete
started: 2026-03-15
completed: 2026-03-16
---

# S01 Summary: Design Mockups

## What was delivered

Three self-contained HTML mockup pages in `/mockups/`:

- **A-ink-and-paper.html** — Warm serif theme with Playfair Display + Source Sans 3
- **B-nordic-clarity.html** — Clean sans-serif theme with DM Sans, dark header bar
- **C-verdant-studio.html** — Green-accented nature theme (not selected)
- **combined-themes.html** — Side-by-side preview with theme/dark toggle
- **icon-comparison.html** — Icon set comparison

## Design direction selected

User selected a hybrid of themes A (Ink & Paper) and B (Nordic Clarity / Crisp & Clear), implemented as two switchable themes via `data-theme="ink"` and `data-theme="nordic"` on `<body>`.

## What was applied to the app

The design mockups were applied to the live application through iterative style fixes:

- CSS custom properties for both themes (light + dark mode each)
- Grid header sizing, spacing, and border position matched to mockups
- Vertical column borders removed for clean grid appearance
- Themed Bootstrap tooltips (font, colors, dark mode inversion)
- Modal typography aligned to theme display/body fonts
- Floating controls repositioned above footer, rail toggle resized to match

## Key files changed

- `css/main.css` — All theme variables and grid/modal/tooltip styling
- `css/yp-dark.css` — Dark mode overrides for both themes
