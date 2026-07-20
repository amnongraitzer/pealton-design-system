"""PLT-099 — source-level tests for the vendored Web Awesome assets.

There is NO browser / JS runtime in CI, so — mirroring tests/test_table_module.py
— the acceptance is asserted at the SOURCE level: we read the vendored bundle,
the base theme, the DS theme layer, the demo page and the consumer doc, and
assert the vendored assets are present + wired and that the theme maps DS tokens.

The live "zero console errors / it renders" check is explicitly MANUAL (open
docs/webawesome.html in a real browser); see the note in that page.
"""

import os

import pealton_design_system as pds

STATIC_DIR = pds.static_dir()
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

BUNDLE_PATH = os.path.join(STATIC_DIR, "webawesome.bundle.js")
BASE_CSS_PATH = os.path.join(STATIC_DIR, "webawesome.base.css")
THEME_CSS_PATH = os.path.join(STATIC_DIR, "webawesome.css")
LICENSE_PATH = os.path.join(STATIC_DIR, "webawesome.LICENSE.md")
DEMO_PATH = os.path.join(REPO_ROOT, "docs", "webawesome.html")
DOC_PATH = os.path.join(REPO_ROOT, "docs", "WEB-AWESOME.md")


def _read(path):
    with open(path, encoding="utf-8") as fh:
        return fh.read()


# --- vendored assets present + non-trivial ----------------------------------

def test_vendored_assets_exist_and_are_nontrivial():
    """The three vendored artifacts + license ship and are non-trivial in size."""
    assert os.path.getsize(BUNDLE_PATH) > 100_000, "bundle missing or too small"
    assert os.path.getsize(BASE_CSS_PATH) > 20_000, "base css missing or too small"
    assert os.path.getsize(THEME_CSS_PATH) > 500, "DS theme layer missing or empty"
    assert os.path.isfile(LICENSE_PATH), "vendored WA LICENSE.md missing"
    assert "MIT" in _read(LICENSE_PATH), "vendored license is not the MIT license"


def test_bundle_registers_the_needed_elements():
    """The bundle self-registers the five elements Epic 5 needs."""
    src = _read(BUNDLE_PATH)
    for tag in ["wa-select", "wa-option", "wa-dialog", "wa-input", "wa-button"]:
        assert tag in src, f"bundle does not register {tag!r}"


def test_bundle_has_no_autoloader_and_no_unresolved_import():
    """VENDORED means self-contained: no CDN autoloader, no un-inlined bare import.

    (We do NOT do a naive 'no https://' grep — the bundle legitimately contains
    SVG xmlns URLs, MIT-license/backlink comments, and a DORMANT Font Awesome kit
    resolver that is unreachable for this set: every internal <wa-icon> hardcodes
    library="system" — offline inline SVG. See docs/WEB-AWESOME.md.)
    """
    src = _read(BUNDLE_PATH)
    assert "autoloader" not in src, "bundle references an autoloader"
    # esbuild inlines every dependency; a surviving bare import means it failed.
    assert 'from"@awesome.me' not in src, "bundle has an un-inlined bare import"
    assert 'from "@awesome.me' not in src, "bundle has an un-inlined bare import"
    # the components' own chrome uses the offline icon library, not the CDN one.
    assert 'library="system"' in src, "components not using the offline icon set"


def test_base_css_is_self_contained():
    """The base theme flattened its @import chain and pulls no CDN URL."""
    css = _read(BASE_CSS_PATH)
    assert "@import" not in css, "base css still has an unresolved @import"
    assert "http://" not in css and "https://" not in css, "base css pulls a URL"
    assert "--wa-color-brand-fill-loud" in css, "base css missing WA brand tokens"


# --- DS theme layer maps --wa-* onto --pds-* --------------------------------

def test_theme_layer_maps_wa_tokens_onto_pds_tokens():
    """webawesome.css remaps WA brand/surface/text/radius/focus onto --pds-*."""
    css = _read(THEME_CSS_PATH)
    assert "--wa-color-brand-fill-loud" in css, "theme does not map WA brand fill"
    assert "var(--pds-primary)" in css, "brand not pointed at the DS primary token"
    assert "--wa-color-focus" in css, "theme does not map the WA focus token"
    assert "--wa-border-radius-m" in css, "theme does not map WA radius"
    assert "var(--pds-panel)" in css, "surfaces not pointed at DS panel token"
    # every mapped WA token must resolve to a --pds-* var (or the keyword white).
    assert css.count("var(--pds-") >= 15, "too few --pds-* references to be a real map"


def test_theme_layer_has_no_raw_hex():
    """Colour comes from tokens only — no raw hex literal (mirrors tabulator.css)."""
    import re
    css = _read(THEME_CSS_PATH)
    assert not re.search(r"#[0-9a-fA-F]{3,8}\b", css), "raw hex colour in the theme layer"


def test_theme_layer_names_exist_in_base_css():
    """Guard against typos: every --wa-* the theme SETS must exist in the base."""
    import re
    theme = _read(THEME_CSS_PATH)
    base = _read(BASE_CSS_PATH)
    # names on the left of a `:` inside the theme's :root are the ones we override.
    set_names = set(re.findall(r"(--wa-[a-z0-9-]+)\s*:", theme))
    assert set_names, "theme layer sets no --wa-* variables"
    missing = [n for n in set_names if n not in base]
    assert not missing, f"theme sets --wa-* names absent from the base css: {missing}"


# --- demo page: RTL, load order, the two proven controls --------------------

def test_demo_is_rtl_and_loads_vendored_assets_in_order():
    """Demo is RTL and loads base -> DS-theme -> bundle in the correct order."""
    html = _read(DEMO_PATH)
    assert 'dir="rtl"' in html, "demo is not RTL"
    base_i = html.find("webawesome.base.css")
    theme_i = html.find("webawesome.css\"")  # the DS layer link (not .base.css)
    bundle_i = html.find("webawesome.bundle.js")
    assert base_i != -1 and theme_i != -1 and bundle_i != -1, "demo missing an asset"
    assert base_i < theme_i, "DS theme must load AFTER the WA base theme"
    assert theme_i < bundle_i, "bundle must load after the stylesheets"


def test_demo_renders_searchable_multiselect_and_dialog():
    """Demo proves the two Epic-5 controls: searchable multi-select + dialog."""
    html = _read(DEMO_PATH)
    assert "<wa-select" in html and "multiple" in html, "no multi-select"
    assert "<wa-option" in html, "multi-select has no options"
    assert "<wa-input" in html, "no search input for the 'searchable' layer"
    assert "hidden" in html, "no hidden-toggle filter glue for the search layer"
    assert "<wa-dialog" in html, "no dialog"
    assert "<wa-button" in html, "no button to open the dialog"


# --- consumer doc -----------------------------------------------------------

def test_consumer_doc_covers_load_order_mapping_and_rtl():
    """docs/WEB-AWESOME.md documents load order, the token mapping, and RTL."""
    doc = _read(DOC_PATH)
    assert "webawesome.base.css" in doc and "webawesome.bundle.js" in doc, "doc misses the asset names"
    assert "order" in doc.lower(), "doc does not explain the load order"
    assert "--pds-" in doc, "doc does not show the token mapping"
    assert "RTL" in doc or "rtl" in doc, "doc has no RTL note"
