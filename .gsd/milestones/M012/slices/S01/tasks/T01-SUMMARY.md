---
id: T01
parent: S01
milestone: M012
key_files:
  - mockups/icon-candidates/README.md
  - mockups/icon-candidates/C1-ink-paper/icon.svg
  - mockups/icon-candidates/C1-ink-paper/logo.svg
  - mockups/icon-candidates/C2-nordic-clarity/icon.svg
  - mockups/icon-candidates/C2-nordic-clarity/logo.svg
  - mockups/icon-candidates/C3-verdant-studio/icon.svg
  - mockups/icon-candidates/C3-verdant-studio/logo.svg
  - .tests/smoke/icon-candidates-assets.spec.js
key_decisions:
  - C3 uses an arc-based year-cycle motif (path, not rects) giving it a structurally different shape language from C1/C2 at every scale
  - All SVGs use viewBox only (no width/height at root) to allow unconstrained browser scaling
  - Smoke spec uses @playwright/test directly (no CDN fixture) since all assertions are pure filesystem checks
duration: 
verification_result: passed
completed_at: 2026-04-15T21:16:15.550Z
blocker_discovered: false
---

# T01: Author three distinct SVG master systems (C1-ink-paper, C2-nordic-clarity, C3-verdant-studio) with icon.svg + logo.svg per candidate and a machine-checkable asset contract README and smoke spec

**Author three distinct SVG master systems (C1-ink-paper, C2-nordic-clarity, C3-verdant-studio) with icon.svg + logo.svg per candidate and a machine-checkable asset contract README and smoke spec**

## What Happened

Folder contract and three canonical SVG master systems were created from scratch. The icon-candidates/ directory already had the three sub-folders but no files; all eight required files were written.

**C1 — Ink & Paper**: Warm parchment rounded square (rx=96) with a terracotta header band (#D4663A), amber accent stripe (#E8A838), two oval ring-binding pins, and a 7×5 grid of warm paper cells (ink outlines) with one amber "today" cell containing a gold circle indicator. Entry-highlight cells show soft rose and sage fills. The logo uses a scaled-down icon replica left, a terracotta divider, serif "Year" wordmark in terracotta, and sans "PLANNER" letterspacing in ink-mid.

**C2 — Nordic Clarity**: Near-white ground (rx=80) dominated by a bold dark-slate header band (#1A1D23) occupying the top 35%. A thin electric-blue accent line (#2563EB) underscores the header. Seven white dot markers in the header suggest weekday labels. The grid below uses white cells on the near-white ground with light borders; one cell in electric blue marks today, one in coral (#F06050 /  #FFE0E0) marks an entry. At 16×16 this reads as dark-top / white-bottom / blue-dot — immediately distinct from C1. The logo uses the same dark-header mini-icon, an electric-blue vertical divider, bold all-caps "YEAR" in dark, and "PLANNER" in blue.

**C3 — Verdant Studio**: Deep forest green ground (rx=128, organically rounded) with a thick cream arc (#EDE8DF, stroke-width=44) tracing 270° of an annual-cycle motif from the bottom of the circle counterclockwise through left/top to end at the right, leaving the gap in the lower-right quadrant. A rust circle (#C85A28) marks the arc's leading edge. A secondary inner mid-green arc and small cream centre dot complete the detail. The logo echoes this with a scaled arc+dot mini-icon, a muted green divider, serif "Year" in forest green, and "PLANNER" in mid-green with a rust corner accent dot.

The README defines the full per-candidate folder contract: required files (icon.svg, logo.svg, previews/), size matrix (16/32/180/192/512), naming rules, SVG master requirements, and the machine-checkable invariants enforced by the smoke spec.

The smoke spec (.tests/smoke/icon-candidates-assets.spec.js) runs 23 pure-filesystem assertions with no browser dependency: exactly-3-candidates check, presence of icon.svg + logo.svg per candidate, non-empty content, viewBox attribute presence, canonical viewBox value checks (icon=0 0 512 512, logo=0 0 480 120), and title-element presence. All 23 passed (2.7 s).

## Verification

Ran: npm --prefix .tests run test -- --reporter=line smoke/icon-candidates-assets.spec.js --grep "candidate SVG masters"
Result: 23 passed in 2.7s. All per-candidate folder presence, icon.svg + logo.svg existence, non-empty content, viewBox attribute, canonical viewBox value, and title element assertions passed for C1, C2, and C3.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm --prefix .tests run test -- --reporter=line smoke/icon-candidates-assets.spec.js --grep "candidate SVG masters"` | 0 | ✅ pass — 23/23 tests passed | 2700ms |

## Deviations

None — all outputs match the expected file list in the task plan exactly.

## Known Issues

None — system fonts only (no embedded web fonts); Playfair Display / DM Sans / Fraunces will fall back to Georgia/Arial/Helvetica in SVG-only contexts. This is acceptable for mockup-stage masters; real type rendering occurs in the gallery HTML (T03).

## Files Created/Modified

- `mockups/icon-candidates/README.md`
- `mockups/icon-candidates/C1-ink-paper/icon.svg`
- `mockups/icon-candidates/C1-ink-paper/logo.svg`
- `mockups/icon-candidates/C2-nordic-clarity/icon.svg`
- `mockups/icon-candidates/C2-nordic-clarity/logo.svg`
- `mockups/icon-candidates/C3-verdant-studio/icon.svg`
- `mockups/icon-candidates/C3-verdant-studio/logo.svg`
- `.tests/smoke/icon-candidates-assets.spec.js`
