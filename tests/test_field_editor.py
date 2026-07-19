"""PLT-081 — tests for the pds-field-editor inline-edit module.

Two layers:

1. **Behavioural** — the contract's inline-edit + concurrency behaviours are
   real JS behaviours, so we exercise the SHIPPED module under Node against a
   tiny hand-rolled DOM stub (tests/js/). If `node` is unavailable the test
   skips cleanly (a node-less CI stays green rather than erroring); where node
   exists (dev + this sandbox) it genuinely verifies confirm/cancel/Esc-no-
   bubble/Enter/busy/conflict/validate/select.

2. **Source-level** — structural guarantees asserted by reading the files, in
   the string/token-presence style of tests/test_table_module.py.
"""

import json
import os
import shutil
import subprocess

import pealton_design_system as pds

STATIC_DIR = pds.static_dir()
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MODULE_PATH = os.path.join(STATIC_DIR, "pds-field-editor.js")
TABLE_PATH = os.path.join(STATIC_DIR, "pds-table.js")
DEMO_PATH = os.path.join(REPO_ROOT, "docs", "table.html")
HARNESS_PATH = os.path.join(REPO_ROOT, "tests", "js", "field-editor.harness.mjs")


def _read(path):
    with open(path, encoding="utf-8") as fh:
        return fh.read()


# --- behavioural: run the module under node against the DOM stub -------------

def test_behaviour_via_node_harness():
    """Drive the shipped module through every inline-edit + concurrency
    behaviour under Node; skip if node is unavailable."""
    node = shutil.which("node")
    if node is None:
        import pytest

        pytest.skip("node not available — behavioural JS harness skipped")

    proc = subprocess.run(
        [node, HARNESS_PATH],
        capture_output=True,
        text=True,
        cwd=REPO_ROOT,
        timeout=60,
    )
    # The harness prints a JSON summary object on stdout (pretty-printed, so it
    # spans multiple lines) regardless of pass/fail.
    try:
        summary = json.loads(proc.stdout.strip() or "{}")
    except ValueError:
        summary = {}
    assert proc.returncode == 0, (
        "field-editor behavioural harness failed:\n"
        f"stdout:\n{proc.stdout}\nstderr:\n{proc.stderr}"
    )
    assert summary.get("failed", 1) == 0, f"harness reported failures: {proc.stdout}"
    assert summary.get("passed", 0) > 0, "harness ran no assertions"


# --- source-level: module structure -----------------------------------------

def test_module_exists():
    assert os.path.isfile(MODULE_PATH), f"pds-field-editor.js missing at {MODULE_PATH}"


def test_factory_defined_and_exposed():
    """createFieldEditor is defined and exposed as a global, on PDS, and as a
    Node export (so the drawer AND the harness can consume it)."""
    src = _read(MODULE_PATH)
    assert "function createFieldEditor" in src, "createFieldEditor not defined"
    assert "root.createFieldEditor = createFieldEditor" in src, "missing global export"
    assert "root.PDS.createFieldEditor = createFieldEditor" in src, "missing PDS.createFieldEditor"
    assert "module.exports" in src, "missing Node module.exports (needed by the drawer/harness)"


def test_edit_grammar_and_keys():
    """Explicit ✓/✕ plus Enter/Esc, and Esc must not bubble (stopPropagation)."""
    src = _read(MODULE_PATH)
    assert "✓" in src, "no ✓ confirm control"
    assert "✕" in src, "no ✕ cancel control"
    assert "Enter" in src, "no Enter handling"
    assert "Escape" in src, "no Escape handling"
    assert "stopPropagation" in src, "Esc must call stopPropagation so it does not close an outer dialog"


def test_wait_not_optimistic_busy_state():
    """Commit awaits onSave; the control is disabled in flight (busy lock)."""
    src = _read(MODULE_PATH)
    assert "onSave" in src, "no onSave commit callback"
    assert "setBusy" in src or "busy" in src, "no busy state"
    assert "disabled" in src, "control is not disabled in flight"


def test_conflict_path_present():
    """409-shaped rejection routes to a conflict path exposing onConflict + current."""
    src = _read(MODULE_PATH)
    assert "conflict" in src, "no conflict handling"
    assert "current" in src, "conflict path does not read the server 'current' value"
    assert "onConflict" in src, "no onConflict callback"


def test_editor_types_and_validation():
    src = _read(MODULE_PATH)
    for t in ["text", "select", "number"]:
        assert t in src, f"editor type {t!r} not supported"
    assert "validate" in src, "no per-field validation hook"


def test_escape_helper_defined_and_used():
    src = _read(MODULE_PATH)
    assert "function escapeHtml" in src, "escapeHtml helper not defined"
    assert src.count("escapeHtml") > 1, "escapeHtml defined but never used"


def test_no_external_url_or_hr_business_fields():
    """App-agnostic: no external URL, no hard-coded HR/candidate field names."""
    src = _read(MODULE_PATH)
    assert "http" not in src, "module pulled an external URL/http reference"
    for banned in ["candidate", "application_id", "/api/", "/hil/"]:
        assert banned not in src, f"HR business token leaked into the DS module: {banned!r}"


# --- source-level: pds-table reuse + demo ------------------------------------

def test_table_reuses_the_factory():
    """pds-table wires editable cells through the SAME factory (one grammar)."""
    src = _read(TABLE_PATH)
    assert "createFieldEditor" in src, "pds-table does not reuse createFieldEditor"
    assert "onFieldSave" in src, "pds-table has no onFieldSave commit seam"


def test_demo_wires_editor_with_all_paths():
    """The demo loads the factory and drives a fake saver over all three paths."""
    html = _read(DEMO_PATH)
    assert "pds-field-editor.js" in html, "demo does not load the field-editor module"
    assert "createFieldEditor" in html or "onFieldSave" in html, "demo does not wire the editor"
    for path in ["conflict", "current"]:
        assert path in html, f"demo does not exercise the {path!r} concurrency path"
