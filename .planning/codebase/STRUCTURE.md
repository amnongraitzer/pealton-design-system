# Codebase Structure — Pealton Design System

Mapped 2026-07-18 during GSD initialization. Reflects the repo as of commit
`b84c5a2` (phase 6 / PLT-060 merged).

## Repo layout

```
pealton_design_system/          # the installable Python package
  __init__.py                   # __version__ + static_dir() / templates_dir() helpers
  static/
    tokens.css                  # canonical token layer (:root vars) — phase 1
    fonts.css                   # self-hosted Rubik @font-face — phase 2
    fonts/
      rubik-hebrew.woff2        # Rubik subset (Hebrew)
      rubik-latin.woff2         # Rubik subset (Latin)
      OFL.txt                   # SIL Open Font License for Rubik
    components.css              # button, chip, status-pill, card — phase 3
    forms.css                   # input/select/textarea/checkbox — phase 4
    tabulator.css               # Tabulator table theme — phase 4
    overlays.css                # native <dialog> modal + drawer — phase 5
    pds.js                      # overlay open/close behaviour — phase 5
  templates/
    pds.html                    # Jinja macros for every component — phase 6
    .gitkeep
docs/
  index.html                    # component + token showcase (Hebrew, RTL)
  vendor/tabulator/             # vendored Tabulator CSS+JS (for the showcase only)
tests/
  test_macros.py                # renders every macro; checks invalid state + escaping
pyproject.toml                  # packaging; ships static/ + templates/ as package data
README.md                       # usage, decisions, distribution rules
.gitattributes                  # marks *.woff2 as binary (no line-ending mangling)
.gitignore                      # __pycache__, *.pyc, egg-info, build/, dist/, .venv/
```

## What each layer contributes

| File | Lines | Role |
|------|-------|------|
| `tokens.css` | 97 | One `:root` block — colour, spacing, type, radius, z-index, shadow. Light scale only. |
| `fonts.css` | 47 | `@font-face` for self-hosted Rubik (variable weight 300–900, Hebrew+Latin). |
| `components.css` | 198 | Button, chip, status-pill (the signature 5 stage pills), card. |
| `forms.css` | 103 | Input, select, textarea, checkbox — including the invalid state. |
| `tabulator.css` | 130 | Themes the third-party Tabulator table to match the DS. |
| `overlays.css` | 114 | Modal + drawer built on the native `<dialog>` element. |
| `pds.js` | 68 | Small vanilla-JS module that opens/closes overlays (`data-pds-*` hooks). |
| `pds.html` | 99 | 13 Jinja macros: button, chip, pill, card, input, textarea, select, checkbox, field, table, modal, drawer. |

## Entry points

- **Consuming app (runtime):** `pealton_design_system.static_dir()` → mount as
  static files; `pealton_design_system.templates_dir()` → add to the Jinja
  loader so `{% import "pds.html" as pds %}` works.
- **Showcase:** open `docs/index.html` directly in a browser.
- **Tests:** `python -m pytest`.

See [ARCHITECTURE.md](ARCHITECTURE.md) for how these fit together, and
[STACK.md](STACK.md) for the toolchain.
