"""Pealton Design System — framework-free, Monday-inspired, shared by both apps.

Phase 1 (PLT-055) ships the canonical token layer only. Components (button,
status-pill, card, inputs, table theme, modal, drawer), the self-hosted Rubik
font, and the Jinja macros arrive in later phases (PLT-056+).

Usage in a FastAPI + Jinja app::

    from fastapi.staticfiles import StaticFiles
    from fastapi.templating import Jinja2Templates
    from jinja2 import ChoiceLoader, FileSystemLoader
    import pealton_design_system as pds

    app.mount("/pds", StaticFiles(directory=pds.static_dir()), name="pds")
    # then in a base template:  <link rel="stylesheet" href="/pds/tokens.css">

    # once macros exist (phase 6), add the DS template dir to the loader:
    templates = Jinja2Templates(directory="app/templates")
    templates.env.loader = ChoiceLoader([
        FileSystemLoader("app/templates"),
        FileSystemLoader(pds.templates_dir()),
    ])
"""
from __future__ import annotations

import os

__version__ = "0.1.0"

_HERE = os.path.dirname(os.path.abspath(__file__))


def static_dir() -> str:
    """Absolute path to the DS static assets (CSS, and later the Rubik font)."""
    return os.path.join(_HERE, "static")


def templates_dir() -> str:
    """Absolute path to the DS Jinja templates (macros land here in phase 6)."""
    return os.path.join(_HERE, "templates")
