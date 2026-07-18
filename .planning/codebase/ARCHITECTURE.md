# Architecture — Pealton Design System

Mapped 2026-07-18 during GSD initialization.

## What it is

A **framework-free design system** distributed as a Python package. It is not an
app — it has no server, no runtime dependencies, no build step. It ships three
kinds of static assets that two other Pealton apps (an HR platform and a
real-estate monitor) consume:

1. **CSS tokens + component CSS** — the visual layer.
2. **A self-hosted web font** (Rubik) — so both apps render identically offline.
3. **Jinja macros** — shared HTML markup, so apps call `pds.button(...)` instead
   of copy-pasting component markup.

The goal: reproduce the Monday.com *look* on the apps' existing
**FastAPI + Jinja + vanilla-JS** stack, without a React/Vibe migration (that
migration was ruled out in "Epic 0").

## How the pieces relate

```
      ┌─────────────────────────────────────────────┐
      │  pealton-design-system (this repo)           │
      │                                              │
      │  tokens.css ──┐                              │
      │  fonts.css ───┤ visual layer (cascade)       │
      │  components/forms/tabulator/overlays.css ─┘  │
      │  pds.js ........ overlay behaviour           │
      │  pds.html ...... Jinja macros emit the       │
      │                  classes the CSS styles      │
      └───────────────┬──────────────────────────────┘
                      │ pip install from GitHub @main
        ┌─────────────┴─────────────┐
        ▼                           ▼
   HR platform app          Real-estate monitor app
   (FastAPI+Jinja)          (FastAPI+Jinja)
```

**Contract between macro and CSS:** each Jinja macro emits a specific class
(e.g. `pds-btn pds-btn--primary`), and the matching CSS file styles that class.
`tests/test_macros.py` asserts every macro emits its expected class — that test
is the guardrail that keeps markup and styling in sync.

## Key design decisions (locked, from README)

- **Look:** Monday-inspired; primary `#6161FF`; the five coloured **stage pills**
  are the signature element.
- **Light scale only:** `--pds-bg: #F0F3FF`. Deliberately does **not** follow OS
  dark mode. Dark mode is out of scope until asked for.
- **Type:** self-hosted **Rubik** (SIL OFL) — best Hebrew analogue to Monday's
  Figtree; removes the silent Segoe-UI fallback both apps shipped. Self-hosting ≠
  CDN — the font ships in the package, keeping apps offline-safe.
- **RTL:** all components use CSS **logical properties** (Hebrew-first).
- **Overlays:** built on the **native `<dialog>`** element — no overlay library.

## Distribution model — FLOAT NOW, PIN AT LAUNCH

Both apps install straight from GitHub tracking **`@main`**, so one DS change
reaches both on their next deploy — no per-app version bump. **The rule:** switch
both apps to a pinned tag (e.g. `@v1.0.0`) the moment *either* app goes live to
real users. Until then, `@main` is intentional.

## Security posture

- Macros HTML-escape all text arguments; Jinja autoescape must stay on.
  `tests/test_macros.py` verifies escaping for both plain args and `{% call %}`
  caller content. This is the main injection surface, and it is covered.
