# Pealton Design System

Monday.com-**inspired**, **framework-free** design system shared by both Pealton
apps (HR platform + real-estate monitor). CSS tokens + component CSS + Jinja
macros — reproducing the Monday *look* on the apps' existing **FastAPI + Jinja +
vanilla-JS** stack. **No React, no Vibe** (that would be the stack migration
Epic 0 ruled out).

> Built by Epic 2 (PLT-054). Decisions: `Pealton/Project knowledge/PLT-EPIC2-unified-design-system.md`.
> Live prototype: https://claude.ai/code/artifact/d327b80e-3b96-4b89-9641-daede90db4ea

## Status — phase 6 (PLT-060)
- **Tokens** (PLT-055): `pealton_design_system/static/tokens.css` — one `:root`
  for colour / spacing / type / radius / z-index / shadow, Monday palette,
  **light scale only**.
- **Rubik, self-hosted** (PLT-056): `static/fonts.css` + `static/fonts/*.woff2`
  (SIL OFL, variable weight **300–900**, Hebrew + Latin subsets, ~44 KB). Ships
  **inside the package** — no CDN, offline-safe. This removes the silent
  Segoe-UI / per-OS fallback both apps shipped. Load `fonts.css` alongside
  `tokens.css`; the `--pds-font` token already lists Rubik first.

- **Components** (PLT-057–059): `components.css` (button, chip, status-pill,
  card), `forms.css` (input/select/textarea/checkbox), `tabulator.css` (table
  theme), `overlays.css` + `pds.js` (native-`<dialog>` modal + drawer).
- **Jinja macros** (PLT-060): `templates/pds.html` — shared markup for every
  component (see *Jinja macros* below). `python -m pytest` renders them all.

See it: open `docs/index.html` (every component + token in Hebrew; the banner
verifies Rubik rendered).

Later phases: distribution wired into both apps (061) · HR pilot + legacy
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
from jinja2 import ChoiceLoader, FileSystemLoader
import pealton_design_system as pds

# 1. serve the CSS/JS
app.mount("/pds", StaticFiles(directory=pds.static_dir()), name="pds")

# 2. make the macros importable in your templates
templates.env.loader = ChoiceLoader([
    FileSystemLoader("app/templates"),
    FileSystemLoader(pds.templates_dir()),
])
```
In your base template, load the stylesheets (and `pds.js` for overlays):
```html
<link rel="stylesheet" href="/pds/fonts.css">
<link rel="stylesheet" href="/pds/tokens.css">
<link rel="stylesheet" href="/pds/components.css">
<link rel="stylesheet" href="/pds/forms.css">
<link rel="stylesheet" href="/pds/overlays.css">
<!-- where you use a table: Tabulator's own CSS first, then -->
<link rel="stylesheet" href="/pds/tabulator.css">
<script src="/pds/pds.js" defer></script>
```

## Jinja macros — shared markup (phase 6)
Import once, then call the components instead of copy-pasting HTML:
```jinja
{% import "pds.html" as pds %}

{{ pds.button("שמור", variant="primary") }}
{{ pds.pill("זומן לראיון", "invited") }}
{{ pds.field("שם מלא", "name", required=true, error=errors.name) }}

{% call pds.card(hover=true) %}
  <h3>דנה כהן</h3>
{% endcall %}

{% call pds.modal("confirm", "אישור פעולה") %}
  <div class="pds-dialog__body">…</div>
  <div class="pds-dialog__footer">
    {{ pds.button("ביטול", variant="ghost", attrs='data-pds-close') }}
    {{ pds.button("אישור", variant="primary", attrs='data-pds-close') }}
  </div>
{% endcall %}
```
All text arguments are HTML-escaped — keep Jinja autoescape on. See
`pealton_design_system/templates/pds.html` for every macro and its arguments.

## Develop / test
```bash
pip install -e ".[test]"
python -m pytest        # renders every macro; checks the field invalid state + escaping
```

## Layout
```
pealton_design_system/
  __init__.py            # version + static_dir() / templates_dir() helpers
  static/tokens.css      # canonical token layer (phase 1)
  static/fonts.css       # self-hosted Rubik @font-face (phase 2)
  static/fonts/*.woff2   # Rubik subsets + OFL license
  static/components.css  # button, chip, status-pill, card (phase 3)
  static/forms.css       # input/select/textarea/checkbox (phase 4)
  static/tabulator.css   # Tabulator theme (phase 4)
  static/overlays.css    # modal + drawer (phase 5)
  static/pds.js          # overlay behaviour module (phase 5)
  templates/pds.html     # Jinja macros for every component (phase 6)
docs/index.html          # component + token showcase
tests/test_macros.py     # macro render + escaping tests
pyproject.toml           # installable; ships static/ + templates/ as package data
```
