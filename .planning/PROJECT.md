# Year Planner

## What This Is

A multi-lingual, responsive Progressive Web App (PWA) for personal and student year planning. Users create named planners with tweet-sized diary entries on a year-grid calendar, stored first in browser cookies/localStorage with optional cloud sync for registered users. Built as a no-build, CDN-first vanilla ES6 + Vue 3 application.

## Core Value

A user can open the app in any browser, create a planner, and start filling in their year — no account, no install, no setup required.

## Requirements

### Validated

- ✓ Year-grid calendar view (weeks × months matrix, responsive collapse) — existing
- ✓ Named planners with unique timestamp identifiers — existing
- ✓ Local storage via browser cookies (offline-first, no account required) — existing
- ✓ Remote sync for registered users (cloud storage via REST API) — existing
- ✓ User registration, signin, profile management, password recovery — existing
- ✓ 10-language i18n (EN, ZH, HI, AR, ES, PT, FR, RU, ID, JA) — existing
- ✓ Light and dark themes — existing
- ✓ Share planners via compressed URL — existing
- ✓ Donation via Square payment gateway — existing
- ✓ CDI-based dependency injection (alt-javascript ecosystem) — existing

### Active

- [ ] E2E test suite (Playwright) stored unobtrusively in a hidden tooling directory (e.g. `.tests/` or `.playwright/`)
- [ ] Research and decision on lightweight HTML composition — evaluate options for assembling `index.html` from modular fragments without heavy node-first tooling
- [ ] Implement chosen HTML composition approach (if suitable option found)
- [ ] SRI (Subresource Integrity) hashes on all CDN-loaded scripts in `index.html`
- [ ] XSS audit — verify user-supplied entry text is consistently escaped in Vue templates
- [ ] User-visible error feedback for network/sync failures (no more silent failures)
- [ ] Input validation at the client boundary (entry text length, auth form fields)

### Out of Scope

- Full webpack/Vite/npm-first rewrite — contrary to the CDN-first, no-build spirit
- Unit test framework for existing services — E2E covers this implicitly; complex logic goes into separate CDN-delivered `@alt-javascript` modules with their own test suites
- Real-time sync / conflict resolution — last-write-wins is acceptable for now
- Mobile native app — web PWA only
- Semester/term views (4×13, 2×26) — backlog, not this milestone

## Context

The no-build architecture was a deliberate first principle: avoid npm/node heaviness, keep the runtime simple, deliver via CDN. The monolithic `index.html` (761 lines of inline Vue templates) is a natural consequence of this. The author also maintains the `@alt-javascript` ecosystem (CDI, logger, config, cookies) as CDN-delivered modules — complex extracted logic follows that pattern.

The codebase has no testing infrastructure whatsoever. The preferred testing philosophy is E2E-first: browser-level tests cover feature goals and implicitly exercise controller/service logic. Playwright is the primary candidate.

For HTML composition research: the goal is finding something that feels like a natural extension of the existing workflow — possibly a shell script, a Makefile, or a minimal tool — rather than adopting a full build pipeline.

## Constraints

- **Architecture**: CDN-first runtime — no bundler at runtime; build tooling is dev-only if introduced at all
- **Testing location**: Tests must be unobtrusive — stored in a hidden directory (like `.docker/`, `.skaffold/`), not polluting the project root
- **Module extraction**: Complex logic modules follow the `@alt-javascript` CDN pattern if extracted
- **Browser compatibility**: Must work in modern browsers without transpilation

## Key Decisions

| Decision | Rationale | Outcome |
|---|---|---|
| No-build CDN-first runtime | Simplicity, directness, no node_modules in production | ✓ Good — retained |
| Cookies for local storage | Works offline, no IndexedDB complexity | ⚠️ Revisit — 4KB limit causes silent data loss at scale |
| Inline Vue templates in index.html | No build step means no SFC compilation | ⚠️ Revisit — HTML composition research this milestone |
| E2E-first testing | Covers feature goals implicitly, avoids mocking complexity | — Pending |

---
*Last updated: 2026-03-11 after initialization*
