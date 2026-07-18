"""PLT-060 — every DS Jinja macro must render without error (the postcondition),
emit the class its CSS styles, keep the field invalid-state contract, and escape
untrusted text (both plain args and {% call %} caller content)."""

import pealton_design_system as pds
from jinja2 import Environment, FileSystemLoader, select_autoescape

env = Environment(
    loader=FileSystemLoader(pds.templates_dir()),
    autoescape=select_autoescape(["html", "xml"]),
)


def render(src, **ctx):
    return env.from_string(src).render(**ctx)


# Exercises EVERY macro, including {% call %} for card / modal / drawer.
ALL_MACROS = """{% import "pds.html" as pds %}
{{ pds.button("שמור", variant="primary") }}
{{ pds.button("ביטול", variant="ghost", size="sm") }}
{{ pds.button("מחק", variant="danger", disabled=true) }}
{{ pds.button("רגיל") }}
{{ pds.chip("42 מועמדים") }}
{{ pds.chip("מסונן", variant="primary") }}
{{ pds.pill("חדש", "new") }}
{{ pds.pill("פניתי", "contacted") }}
{{ pds.pill("זומן", "invited") }}
{{ pds.pill("לא רלוונטי", "rejected") }}
{{ pds.pill("התקבל", "hired", soft=true) }}
{% call pds.card(hover=true) %}<p>תוכן כרטיס</p>{% endcall %}
{{ pds.input("full_name", placeholder="שם מלא") }}
{{ pds.textarea("notes", placeholder="הערות") }}
{{ pds.select("role", ["מפתח", "מעצב", "מוצר"], selected="מעצב") }}
{{ pds.checkbox("מועמד פעיל", "active", checked=true) }}
{{ pds.field("שם", "name", required=true, help="כפי שבתעודת הזהות") }}
{{ pds.table("candidates-table") }}
{% call pds.modal("confirm", "אישור פעולה") %}<div class="pds-dialog__body">גוף</div><div class="pds-dialog__footer">כפתורים</div>{% endcall %}
{% call pds.drawer("detail", "דנה כהן") %}<div class="pds-dialog__body">גוף</div>{% endcall %}
"""


def test_every_macro_renders_and_emits_its_class():
    html = render(ALL_MACROS)
    for token in [
        'class="pds-btn pds-btn--primary"',
        "pds-btn--ghost", "pds-btn--sm",
        "pds-btn--danger", "disabled",
        "pds-chip", "pds-chip--primary",
        "pds-pill pds-pill--new", "pds-pill__dot",
        "pds-pill--soft pds-pill--hired",
        "pds-card pds-card--hover",
        'class="pds-input"', 'name="full_name"',
        "pds-textarea", "pds-select", "<option selected>מעצב</option>",
        "pds-checkbox", "checked",
        "pds-field", "pds-label", "pds-req",
        'class="pds-tabulator" id="candidates-table"',
        'class="pds-modal" id="confirm"', 'aria-labelledby="confirm-title"',
        'class="pds-drawer" id="detail"', "data-pds-close", 'aria-label="Close"',
    ]:
        assert token in html, f"macro output missing: {token}"


def test_field_invalid_state():
    """Passing `error` must flip the input to the invalid state and show the message."""
    src = '{% import "pds.html" as pds %}{{ pds.field(lbl, "email", type="email", error=err) }}'
    html = render(src, lbl="אימייל", err="כתובת לא תקינה")
    assert 'aria-invalid="true"' in html
    assert "pds-input--invalid" in html
    assert 'class="pds-error"' in html
    assert "כתובת לא תקינה" in html


def test_plain_arg_is_escaped():
    html = render('{% import "pds.html" as pds %}{{ pds.button(evil) }}', evil="<script>alert(1)</script>")
    assert "<script>alert(1)</script>" not in html
    assert "&lt;script&gt;" in html


def test_caller_content_is_escaped():
    """Content passed via {% call %} goes through a distinct render path; autoescape
    must still neutralise it."""
    src = "{% import \"pds.html\" as pds %}{% call pds.card() %}{{ evil }}{% endcall %}"
    html = render(src, evil="<script>alert(2)</script>")
    assert "<script>alert(2)</script>" not in html
    assert "&lt;script&gt;" in html


# --- Icons (PLT-068) --------------------------------------------------------

ICON_NAMES = [
    "search", "caret", "close", "add", "document",
    "star", "warning", "flag", "back", "forward",
]


def test_icon_renders_inline_svg_for_every_name():
    """Each named glyph renders a self-contained inline <svg> with a <path>, the
    pds-icon class, and NO external reference."""
    for name in ICON_NAMES:
        html = render('{% import "pds.html" as pds %}{{ pds.icon(name) }}', name=name)
        assert "<svg" in html, f"icon '{name}' rendered no <svg>: {html!r}"
        assert "pds-icon" in html, f"icon '{name}' missing pds-icon class: {html!r}"
        assert "<path" in html, f"icon '{name}' has no <path>: {html!r}"
        assert "http" not in html, f"icon '{name}' pulled an external reference: {html!r}"


def test_icon_unknown_name_is_empty_and_safe():
    """An unknown name must not raise and must produce no <svg> (safe lookup)."""
    html = render('{% import "pds.html" as pds %}{{ pds.icon("nope") }}')
    assert "<svg" not in html, f"unknown icon name leaked markup: {html!r}"
    assert html.strip() == "", f"unknown icon name should be empty, got: {html!r}"


def test_icon_label_is_escaped():
    """A caller-supplied label is echoed only through autoescaped {{ }} — a
    <script> payload must be neutralised, and aria-label must be present."""
    html = render(
        '{% import "pds.html" as pds %}{{ pds.icon("search", label=evil) }}',
        evil="<script>alert(1)</script>",
    )
    assert "<script>" not in html, f"label was not escaped: {html!r}"
    assert "&lt;script&gt;" in html, f"escaped label missing: {html!r}"
    assert "aria-label" in html, f"labelled icon missing aria-label: {html!r}"
