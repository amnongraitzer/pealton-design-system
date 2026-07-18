# Pealton Design System

## What This Is

A framework-free, Monday.com-inspired **design system** shared by the two Pealton
apps (an HR platform and a real-estate monitor). It ships CSS tokens, component
CSS, a self-hosted Rubik font, and Jinja macros — reproducing the Monday *look*
on the apps' existing **FastAPI + Jinja + vanilla-JS** stack, with no React and
no build step. It is distributed as a `pip`-installable package pulled straight
from GitHub.

## Core Value

**One source of truth for the Monday look across both apps** — change the design
system once and both apps pick it up, without per-app copy-paste or a framework
migration.

## Requirements

### Validated

<!-- Shipped and in the package as of phase 6 (PLT-060). -->

- ✓ **Canonical token layer** — one `:root` for colour/spacing/type/radius/
  z-index/shadow, Monday palette, light scale only — phase 1 (PLT-055)
- ✓ **Self-hosted Rubik font** — variable weight 300–900, Hebrew+Latin subsets,
  offline-safe, removes the silent Segoe-UI fallback — phase 2 (PLT-056)
- ✓ **Core components CSS** — button, chip, the five signature status/stage
  pills, card — phase 3 (PLT-057)
- ✓ **Form controls + Tabulator theme** — input/select/textarea/checkbox with an
  invalid state, plus a themed Tabulator table — phase 4 (PLT-058)
- ✓ **Overlays** — native `<dialog>` modal + drawer, with `pds.js` behaviour —
  phase 5 (PLT-059)
- ✓ **Jinja macros** — shared markup for every component, HTML-escaped, with
  render + escaping tests — phase 6 (PLT-060)
- ✓ **Installable package + distribution model** — `static_dir()` /
  `templates_dir()` helpers; installs from GitHub `@main`
- ✓ **Component showcase** — `docs/index.html` renders every component and token
  in Hebrew/RTL and verifies Rubik loaded

### Active

<!-- Nothing in flight. This repo was initialized into GSD to reflect existing
state, not to open new work. New scope is added deliberately via the roadmap. -->

(None in flight — initialized from existing code)

### Out of Scope

- **Dark mode / OS colour-scheme following** — deliberately light scale only
  until explicitly asked for.
- **React / Vibe migration** — ruled out in "Epic 0"; the DS must fit the
  existing FastAPI + Jinja + vanilla-JS stack.
- **CDN font delivery** — font is self-hosted inside the package to stay
  offline-safe.
- **Publishing to PyPI** — distribution is direct-from-GitHub by design.

## Context

- **Two consumers:** an HR platform and a real-estate monitor, both
  FastAPI + Jinja + vanilla-JS. The DS exists so they share one visual language.
- **Prior decisions** live in `Pealton/Project knowledge/PLT-EPIC2-unified-design-system.md`
  and in the README's "Design decisions (locked)" section.
- **Live prototype** the DS reproduces:
  https://claude.ai/code/artifact/d327b80e-3b96-4b89-9641-daede90db4ea
- **Codebase map:** `.planning/codebase/` (STRUCTURE, ARCHITECTURE, STACK, TESTING).
- The README documents later, not-yet-built work: distribution wired into both
  apps (PLT-061), HR pilot + legacy rollout (PLT-062–067), and icons
  (PLT-068–069). These are recorded in the roadmap as planned, not active.

## Constraints

- **Tech stack**: Plain CSS + vanilla JS + Jinja macros — no framework, no build
  step — because both consuming apps run FastAPI + Jinja + vanilla-JS.
- **Runtime deps**: The package must have **zero** runtime dependencies (it is
  static assets); Jinja is a dev/test-only extra.
- **RTL / Hebrew-first**: all components use CSS logical properties.
- **Security**: macros must HTML-escape all text; Jinja autoescape stays on.
- **Distribution**: FLOAT NOW, PIN AT LAUNCH — both apps track `@main` until
  either goes live to real users, then pin to a tag.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Framework-free (plain CSS/JS/Jinja) | Fit both apps' existing stack; avoid a React migration | ✓ Good |
| Self-host Rubik (not CDN, not Figtree) | Offline-safe; best Hebrew analogue to Monday's Figtree; kills silent Segoe-UI fallback | ✓ Good |
| Light scale only, no dark mode | Match Monday look; avoid scope creep | ✓ Good |
| Native `<dialog>` for overlays | No overlay library; modern, accessible | ✓ Good |
| Distribute from GitHub `@main`, pin at launch | One change reaches both apps pre-launch without version churn | ⚠️ Revisit — must pin when either app ships |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-18 after initialization (brownfield — mapped from existing code)*
