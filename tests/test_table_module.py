"""PLT-080 — source-level contract tests for the pds-table module.

There is NO browser / JS runtime in CI, so the table behaviour contract
(docs/TABLE-CONTRACT.md) is asserted at the SOURCE level: we read the shipped
`pds-table.js` and the `docs/table.html` demo and assert the required tokens are
present (and that forbidden ones are absent). Mirrors the string/token-presence
style of tests/test_macros.py.
"""

import os

import pealton_design_system as pds

STATIC_DIR = pds.static_dir()
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MODULE_PATH = os.path.join(STATIC_DIR, "pds-table.js")
DEMO_PATH = os.path.join(REPO_ROOT, "docs", "table.html")


def _read(path):
    with open(path, encoding="utf-8") as fh:
        return fh.read()


# --- module: pds-table.js ---------------------------------------------------

def test_module_exists():
    assert os.path.isfile(MODULE_PATH), f"pds-table.js missing at {MODULE_PATH}"


def test_defines_createpdstable_and_globals():
    """The factory is defined and exposed both as a bare global and on PDS."""
    src = _read(MODULE_PATH)
    assert "function createPdsTable" in src, "createPdsTable not defined"
    assert "window.createPdsTable = createPdsTable" in src, "missing bare global"
    assert "window.PDS.createTable = createPdsTable" in src, "missing PDS.createTable"


def test_applies_theme_rtl_virtual_and_no_pagination():
    """DS theme class, RTL default, virtual scroll, and NO pagination option."""
    src = _read(MODULE_PATH)
    assert "pds-tabulator" in src, "does not add the pds-tabulator theme class"
    assert "textDirection" in src, "does not set RTL textDirection"
    assert "renderVertical" in src, "does not enable virtual vertical scroll"
    # progressive-scroll model: no `pagination:` option literal turns it on.
    assert "pagination:" not in src, "must not declare a pagination option (progressive scroll)"


def test_selection_payload_has_selectedids_and_clear():
    """onSelectionChange hands the caller {selectedIds, count, clear}."""
    src = _read(MODULE_PATH)
    assert "rowSelection" in src, "no rowSelection column/formatter"
    assert "onSelectionChange" in src, "no onSelectionChange hook"
    assert "selectedIds" in src, "selection payload missing selectedIds"
    assert "clear" in src, "selection payload missing clear affordance"
    # the built-in Hebrew count label — the only baked-in business string.
    assert "נבחרו" in src, "bulk-bar count label 'N נבחרו' missing"


def test_four_state_hooks_present():
    """skeleton/loading, empty, error+retry, and loading-more all render."""
    src = _read(MODULE_PATH)
    assert "setState" in src, "no setState controller method"
    assert "pds-table-overlay" in src, "no state overlay element"
    assert "pds-table-skeleton" in src, "no loading skeleton"
    assert "showEmpty" in src, "no empty state hook"
    assert "showError" in src or "onRetry" in src, "no error/retry hook"
    assert "loading-more" in src, "no loading-more (progressive) indicator"


def test_escape_helper_defined_and_used():
    """A single escapeHtml helper is defined AND used (definition + call sites)."""
    src = _read(MODULE_PATH)
    assert "function escapeHtml" in src, "escapeHtml helper not defined"
    assert src.count("escapeHtml") > 1, "escapeHtml defined but never used"


def test_no_external_url_or_hr_business_fields():
    """App-agnostic: no external URL and no hard-coded HR/candidate field names."""
    src = _read(MODULE_PATH)
    assert "http" not in src, "module pulled an external URL/http reference"
    for banned in ["candidate", "application_id", "/api/", "/hil/"]:
        assert banned not in src, f"HR business token leaked into the DS module: {banned!r}"


# --- demo: docs/table.html --------------------------------------------------

def test_demo_page_wires_module_states_and_bulkbar():
    """The demo loads the module, inits createPdsTable, demos the three visible
    states, and mounts a selection bulk bar."""
    html = _read(DEMO_PATH)
    assert "pds-table.js" in html, "demo does not load the module"
    assert "createPdsTable" in html, "demo does not init createPdsTable"
    for state in ["loading", "empty", "error"]:
        assert state in html, f"demo does not exercise the {state!r} state"
    assert "demo-bulkbar" in html, "demo has no bulk-bar mount"
    assert "נבחרו" in html, "demo bulk bar does not show the 'N נבחרו' count"
