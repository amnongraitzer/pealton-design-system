# Pealton Design System

Monday.com-**inspired**, **framework-free** design system shared by both Pealton
apps (HR platform + real-estate monitor). CSS tokens + component CSS + Jinja
macros — reproducing the Monday *look* on the apps' existing **FastAPI + Jinja +
vanilla-JS** stack. **No React, no Vibe** (that would be the stack migration
Epic 0 ruled out).

> Built by Epic 2 (PLT-054). Decisions: `Pealton/Project knowledge/PLT-EPIC2-unified-design-system.md`.
> Live prototype: https://claude.ai/code/artifact/d327b80e-3b96-4b89-9641-daede90db4ea

## Status — phase 1 (PLT-055)
The **canonical token layer** only: `pealton_design_system/static/tokens.css`
(one `:root` for colour / spacing / type / radius / z-index / shadow, Monday
palette, **light scale only**). See it: open `docs/index.html`.

Later phases: Rubik self-host (PLT-056) · components (057–059) · macros +
docs (060) · distribution wired into both apps (061) · HR pilot + legacy
rollout (062–067) · icons (068–069).

## Design decisions (locked)
- **Look:** Monday-inspired; primary `#6161FF`, the five colored **stage pills**
  are the signature element.
- **Ground:** light scale only (`--pds-bg: #F0F3FF`). The DS deliberately does
  **not** follow OS dark mode. Dark mode is out of scope until asked for.
- **Type:** self-hosted **Rubik** (SIL OFL) — closest Hebrew analogue to
  Monday's Figtree, and it removes the silent Segoe-UI fallback both apps ship
  today. Figtree rejected (weak Hebrew). Self-hosting ≠ CDN: the font ships in
  this package, so the apps stay offline-safe.
- **RTL:** all components use CSS logical properties.

## Distribution — FLOAT NOW, PIN AT LAUNCH
Both apps install this straight from GitHub. While neither serves real users
they track **`@main`**, so one DS change reaches **both** apps on their next
deploy — no per-app version bump:

```bash
pip install "pealton-design-system @ git+https://github.com/amnongraitzer/pealton-design-system@main"
```

**Switch both apps to a pinned tag** (e.g. `@v1.0.0`) the moment **either** app
goes live to real users. That is the one distribution rule to remember.

## Use it in a FastAPI + Jinja app
```python
from fastapi.staticfiles import StaticFiles
import pealton_design_system as pds

app.mount("/pds", StaticFiles(directory=pds.static_dir()), name="pds")
# base template:  <link rel="stylesheet" href="/pds/tokens.css">
```
Once macros exist (phase 6), add `pds.templates_dir()` to the Jinja loader.

## Layout
```
pealton_design_system/
  __init__.py        # version + static_dir() / templates_dir() helpers
  static/tokens.css  # the canonical token layer (phase 1)
  templates/         # Jinja macros (phase 6+)
docs/index.html      # token showcase
pyproject.toml       # installable; ships static/ + templates/ as package data
```
