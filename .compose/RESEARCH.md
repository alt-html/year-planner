# HTML Composition Research Report

**Date:** 2026-03-12
**Requirement:** COMP-01
**Goal:** Compare tools for composing `index.html` from nested fragments — covering setup cost, nesting capability, dev workflow impact, and alignment with the no-build philosophy.

## Candidates

### 1. PostHTML + posthtml-include

**What it is:** A Node.js-based HTML post-processing tool. The `posthtml-include` plugin adds `<include>` tags that are resolved at build time.

| Criterion | Assessment |
|---|---|
| Setup cost | Requires `npm install posthtml posthtml-include` (~50 MB node_modules), a `posthtml.config.js`, and an npm script |
| Nesting | Supported — included files can themselves contain `<include>` tags |
| Dev workflow impact | Adds an npm build step; fragments are not valid HTML on their own |
| No-build alignment | **Poor** — introduces an npm dependency chain into the build path |

**Verdict:** Over-engineered for this use case. The project explicitly avoids npm at the project root. Adding PostHTML would either pollute `.tests/package.json` with production build concerns or require a second `package.json`.

### 2. Nunjucks

**What it is:** Mozilla's JavaScript templating engine. Supports `{% include %}`, template inheritance, macros, and filters.

| Criterion | Assessment |
|---|---|
| Setup cost | Requires `npm install nunjucks` (~2 MB), a render script, and template files with `.njk` extension |
| Nesting | Full — `{% include %}`, `{% extends %}`, `{% block %}` |
| Dev workflow impact | Templates use Nunjucks syntax (`{% %}`) which breaks HTML editor support; fragments are not valid HTML |
| No-build alignment | **Poor** — introduces a runtime dependency and templating language foreign to the project |

**Verdict:** Too heavyweight. The templating features (inheritance, macros, filters) are unnecessary for simple file inclusion. The `{% %}` syntax breaks HTML editor highlighting.

### 3. nginx SSI (Server Side Includes)

**What it is:** nginx's built-in `<!--#include file="..." -->` directive, processed at request time.

| Criterion | Assessment |
|---|---|
| Setup cost | Zero npm dependencies; requires `ssi on;` in nginx config |
| Nesting | Supported — included files can contain their own `<!--#include -->` directives |
| Dev workflow impact | Fragments are composed at serve-time, not build-time; the committed `index.html` would need to be the SSI source, not the assembled output |
| No-build alignment | **Mixed** — no build step, but the runtime artefact changes: nginx assembles on every request |

**Verdict:** Conceptually appealing but violates COMP-03. The composed `index.html` at the project root would no longer be the single runtime artefact — nginx would need to assemble it. Docker and Skaffold workflows would change. Also doesn't work with `http-server` used in the test harness.

### 4. m4 (GNU macro processor)

**What it is:** A POSIX-standard macro processor pre-installed on macOS and Linux. The `include()` directive inserts file contents.

| Criterion | Assessment |
|---|---|
| Setup cost | **Zero** — pre-installed on macOS (`/usr/bin/m4`) and all Linux distros; no npm, no config file |
| Nesting | Supported — included files can contain their own `include()` directives |
| Dev workflow impact | A single shell command (`m4 ... > index.html`) composes fragments; fragments are plain HTML with one-line `include()` markers |
| No-build alignment | **Excellent** — uses a system utility, not a project dependency; the build is a single shell command |

**Caveats:**
- m4 interprets backtick-quote pairs (`` ` `` and `'`) as quoting — must be neutralised with `changequote` at the top of the source
- m4 has builtins (`substr`, `len`, etc.) that clash with JavaScript — the `-P` flag prefixes all builtins with `m4_`, eliminating collisions
- `m4_dnl` (delete-to-newline) comments prevent blank-line artefacts from include directives
- Despite the caveats, these are two one-line directives at the top of the root template plus a `-P` flag

**Verdict:** Best fit. Zero dependencies, native nesting, trivial build command, fragments are plain HTML.

## Recommendation

**Use m4.**

Rationale:
1. **Zero install** — already on the system, no npm dependency
2. **Native nesting** — `include()` within included files works automatically
3. **Minimal syntax** — two setup directives (`changequote`, `dnl`) plus `include()` markers
4. **Committed output** — the build script generates `index.html` at the project root; Docker/Skaffold serve it unchanged
5. **Shell script** — `.compose/build.sh` is a single-command script, consistent with `.docker/bin/build` and `.docker/bin/run`

## Implementation Plan

```
.compose/
├── build.sh              # Shell script: m4 → index.html
├── index.html.m4         # Root template with include() directives
└── fragments/
    ├── head.html          # <head> content (meta, CSS, CDN scripts)
    ├── nav.html           # Navbar
    ├── grid.html          # Year grid / calendar body
    ├── modals.html        # All modal dialogs (includes sub-fragments)
    ├── modals/
    │   ├── cookie.html
    │   ├── entry.html
    │   ├── share.html
    │   ├── delete.html
    │   ├── settings.html
    │   ├── register.html
    │   ├── signin.html
    │   ├── reset-password.html
    │   ├── recover-username.html
    │   ├── pay.html
    │   └── feature.html
    ├── footer.html        # Footer
    └── scripts.html       # Bottom scripts (jQuery, Popper, Bootstrap, main.js)
```

This decomposition nests `modals/*.html` inside `modals.html`, demonstrating the required nesting capability (COMP-02).
