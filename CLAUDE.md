<!-- GSD:project-start source:PROJECT.md -->
## Project

**Pealton Design System**

A framework-free, Monday.com-inspired **design system** shared by the two Pealton
apps (an HR platform and a real-estate monitor). It ships CSS tokens, component
CSS, a self-hosted Rubik font, and Jinja macros — reproducing the Monday *look*
on the apps' existing **FastAPI + Jinja + vanilla-JS** stack, with no React and
no build step. It is distributed as a `pip`-installable package pulled straight
from GitHub.

**Core Value:** **One source of truth for the Monday look across both apps** — change the design
system once and both apps pick it up, without per-app copy-paste or a framework
migration.

### Constraints

- **Tech stack**: Plain CSS + vanilla JS + Jinja macros — no framework, no build
  step — because both consuming apps run FastAPI + Jinja + vanilla-JS.
- **Runtime deps**: The package must have **zero** runtime dependencies (it is
  static assets); Jinja is a dev/test-only extra.
- **RTL / Hebrew-first**: all components use CSS logical properties.
- **Security**: macros must HTML-escape all text; Jinja autoescape stays on.
- **Distribution**: FLOAT NOW, PIN AT LAUNCH — both apps track `@main` until
  either goes live to real users, then pin to a tag.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages & assets
| Layer | Tech | Notes |
|-------|------|-------|
| Styling | **Plain CSS** (custom properties) | No preprocessor, no PostCSS, no build. |
| Behaviour | **Vanilla JS** (`pds.js`) | One small module, no framework, no bundler. |
| Markup | **Jinja2** macros (`pds.html`) | Rendered by the consuming app or by tests. |
| Font | **Rubik** self-hosted `.woff2` | SIL OFL, variable weight 300–900, Hebrew+Latin subsets (~44 KB). |
| Packaging | **Python** package (setuptools) | Ships CSS/JS/fonts/templates as package data. |
## Toolchain
- **Python** ≥ 3.11 (`requires-python` in `pyproject.toml`).
- **Build backend:** `setuptools>=68` (`build_meta`).
- **Runtime dependencies:** **none** — the package is pure static assets.
- **Dev/test extra** (`.[test]`): `jinja2>=3`, `pytest>=7`.
## Install & test
## Consuming-app stack (context)
## Distribution
## Deliberately absent
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## What it is
## How the pieces relate
```
```
## Key design decisions (locked, from README)
- **Look:** Monday-inspired; primary `#6161FF`; the five coloured **stage pills**
- **Light scale only:** `--pds-bg: #F0F3FF`. Deliberately does **not** follow OS
- **Type:** self-hosted **Rubik** (SIL OFL) — best Hebrew analogue to Monday's
- **RTL:** all components use CSS **logical properties** (Hebrew-first).
- **Overlays:** built on the **native `<dialog>`** element — no overlay library.
## Distribution model — FLOAT NOW, PIN AT LAUNCH
## Security posture
- Macros HTML-escape all text arguments; Jinja autoescape must stay on.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
