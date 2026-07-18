# Stack — Pealton Design System

Mapped 2026-07-18 during GSD initialization.

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

```bash
pip install -e ".[test]"
python -m pytest        # renders every macro; checks invalid state + escaping
```

## Consuming-app stack (context)

Both downstream apps run **FastAPI + Jinja + vanilla-JS**. The DS is designed to
drop into that stack with no new framework:

```python
app.mount("/pds", StaticFiles(directory=pds.static_dir()), name="pds")
templates.env.loader = ChoiceLoader([
    FileSystemLoader("app/templates"),
    FileSystemLoader(pds.templates_dir()),
])
```

## Distribution

Installed directly from GitHub (not PyPI):

```bash
pip install "pealton-design-system @ git+https://github.com/amnongraitzer/pealton-design-system@main"
```

`@main` while neither app serves real users; pin to a tag at launch.

## Deliberately absent

No React, no Vibe, no Node build, no CSS preprocessor, no CDN, no dark-mode
theme. Each of these is an explicit decision, not an omission (see
[ARCHITECTURE.md](ARCHITECTURE.md)).
