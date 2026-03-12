# S04: HTML Composition

**Goal:** unit tests prove HTML Composition works
**Demo:** unit tests prove HTML Composition works

## Must-Haves

- COMP-01: Research report comparing PostHTML, Nunjucks, nginx SSI, and m4
- COMP-02: Chosen tool implemented with `.compose/` fragments and nesting demonstrated
- COMP-03: Docker and Skaffold workflows unchanged

## Tasks

1. Write research report comparing composition tools
2. Implement m4-based composition with `.compose/` directory
3. Decompose `index.html` into fragment files
4. Write build script
5. Verify byte-identical output
6. Add Playwright composition tests
7. Run full test suite

## Files Likely Touched

- `.compose/` — new directory with fragments and build script
- `.tests/smoke/compose.spec.js` — new composition tests
- `.gsd/` — milestone tracking files
