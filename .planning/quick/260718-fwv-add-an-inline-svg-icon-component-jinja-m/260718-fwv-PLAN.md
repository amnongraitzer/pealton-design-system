---
phase: quick-260718-fwv
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - pealton_design_system/templates/pds.html
  - pealton_design_system/static/icons.css
  - docs/index.html
  - tests/test_macros.py
autonomous: true
requirements: [PLT-068]

must_haves:
  truths:
    - "A Jinja `icon(name)` macro renders inline <svg> for each of: search, caret, close, add, document, star, warning, flag, back, forward"
    - "The DS docs page (docs/index.html) shows every one of the 10 named glyphs as inline SVG"
    - "No external network request for icons: no CDN <link>/<script>, no icon font — every glyph is inline <svg>"
    - "The macro escapes untrusted input (autoescape stays on); malicious label/name cannot inject markup"
    - "No existing macro, CSS rule, or token is modified — additions only"
  artifacts:
    - path: "pealton_design_system/templates/pds.html"
      provides: "icon(name, ...) macro + inline-SVG path data for all 10 glyphs"
      contains: "macro icon"
    - path: "pealton_design_system/static/icons.css"
      provides: "additive .pds-icon sizing/alignment CSS (currentColor, logical props)"
      contains: ".pds-icon"
    - path: "docs/index.html"
      provides: "Icons section rendering all 10 glyphs inline + icons.css link"
      contains: "pds-icon"
    - path: "tests/test_macros.py"
      provides: "test asserting inline <svg> per name + HTML-escape safety"
      contains: "def test_icon"
  key_links:
    - from: "pealton_design_system/templates/pds.html (icon macro)"
      to: "pealton_design_system/static/icons.css (.pds-icon)"
      via: "shared pds-icon class name"
      pattern: "pds-icon"
    - from: "docs/index.html"
      to: "pealton_design_system/static/icons.css"
      via: "local <link rel=stylesheet>"
      pattern: "static/icons.css"
---

<objective>
Add a self-contained inline-SVG icon set to the Pealton Design System: a Jinja
`icon(name)` macro carrying the SVG path data for 10 glyphs, minimal additive CSS
for sizing/alignment, an "Icons" section on the docs page rendering every glyph
inline, and a macro test.

Purpose: Give both apps a single source for the Monday-style icons with zero
external requests (no CDN, no icon font) — matching the DS "one source of truth,
offline-safe" posture already used for the Rubik font and components.

Output:
- New `icon` macro in `pealton_design_system/templates/pds.html`
- New `pealton_design_system/static/icons.css` (additive; shipped by existing
  `static/*` package-data glob)
- "Icons" section + stylesheet link in `docs/index.html`
- `test_icon_*` in `tests/test_macros.py`

Scope guard (from issue #3 / PLT-068): glyphs are exactly search, caret, close,
add, document, star, warning, flag, back, forward. No new iconography, no changes
to existing components/tokens, no app adoption (that is phase 15).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@CLAUDE.md
@pealton_design_system/templates/pds.html
@pealton_design_system/static/components.css
@docs/index.html
@tests/test_macros.py

## Jinja scoping — VERIFIED, do not re-litigate
The constraint flagged a possible gotcha: is a top-level `{% set %}` dict reachable
from inside a macro when the template is consumed via `{% import "pds.html" as pds %}`?
This was tested empirically against jinja2>=3 (the pinned version):
- **Top-level `{% set PDS_ICONS = {...} %}` referenced inside the macro WORKS when
  imported.** This is the chosen approach — clean and proven.
- An in-macro dict also works and is the fallback if a future Jinja upgrade ever
  breaks the top-level form.
Do NOT rely on the *importing* template's context (that is the real Jinja
restriction, and it is not used here).

## Autoescape interaction with SVG (important)
Literal `<svg>`/`<path>` markup written inside the macro body is emitted as-is
(autoescape only escapes `{{ ... }}` expression output). SVG path data ("M12 2 L…")
contains no HTML-special characters, so echoing it through `{{ }}` is safe and
un-mangled. Untrusted string args (a caller-supplied accessible `label`) ARE
escaped — that is the escape-safety guarantee the test must prove.
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add the icon macro + additive icons.css</name>
  <files>pealton_design_system/templates/pds.html, pealton_design_system/static/icons.css</files>
  <behavior>
    - `pds.icon("search")` renders a single inline `<svg class="pds-icon" ...>` with a `<path>` and no external reference.
    - Each of the 10 names (search, caret, close, add, document, star, warning, flag, back, forward) returns its own distinct non-empty `<svg>`.
    - An unknown name (e.g. "nope") renders empty output (no `<svg>`, no exception) — use a safe lookup, not direct indexing.
    - `pds.icon("search", label="<script>alert(1)</script>")` renders `aria-label` with the label ESCAPED (`&lt;script&gt;`), never raw `<script>`.
    - With a `label`, the svg carries `role="img"` + `aria-label`; without one it carries `aria-hidden="true"`.
  </behavior>
  <action>
    In pds.html, APPEND (do not touch existing macros) a top-level
    `{% set PDS_ICONS = { ... } %}` mapping each of the 10 glyph names to its SVG
    path `d` string, followed by a `{% macro icon(name, label="", size="", cls="") %}`.
    Author 10 simple single-path glyphs on a `0 0 24 24` viewBox with
    `fill="currentColor"` so they inherit text color (per constraint). Suggested
    glyphs: search=magnifier, caret=down chevron, close=X, add=plus, document=page
    with folded corner, star=5-point star, warning=triangle-with-bang, flag=flag on
    pole, back=left chevron, forward=right chevron. Keep each path a plain string of
    move/line/arc commands (no `<`, `>`, `&`, or `"` characters inside path data).
    Macro rules: emit `<svg class="pds-icon{cls-modifier}{ size-modifier }" viewBox="0 0 24 24" fill="currentColor" ...><path d="{{ PDS_ICONS[name] }}"/></svg>`;
    resolve the path with a SAFE lookup so an unknown name yields empty output and
    never a KeyError (guard with an `{% if %}` on the looked-up value); when `label`
    is non-empty add `role="img" aria-label="{{ label }}"` (autoescaped), otherwise
    add `aria-hidden="true"`. Keep pds- prefix and HTML-escape safety; autoescape
    stays on. Do NOT place raw path data in the docs task by hand later — this macro
    is the single source; Task 2 mirrors these exact paths.
    Create NEW file pealton_design_system/static/icons.css with an additive
    `.pds-icon` rule only: `inline-size`/`block-size` ~1.25em, `fill: currentColor`,
    `vertical-align` middle, `flex: none`; optional `.pds-icon--sm` / `.pds-icon--lg`
    size modifiers. Use CSS logical properties (RTL-first). Colours must come from
    `currentColor` only — no raw hex, no token edits, no changes to any existing CSS
    file. The existing `static/*` package-data glob ships this file automatically.
  </action>
  <verify>
    <automated>cd /workspace && grep -q "macro icon" pealton_design_system/templates/pds.html && grep -q "PDS_ICONS" pealton_design_system/templates/pds.html && grep -q "currentColor" pealton_design_system/static/icons.css && python3 -c "import re,sys; t=open('pealton_design_system/templates/pds.html').read(); k=re.search(r'PDS_ICONS\s*=\s*\{(.*?)\}', t, re.S).group(1); names=['search','caret','close','add','document','star','warning','flag','back','forward']; missing=[n for n in names if n not in k]; sys.exit('MISSING: '+','.join(missing) if missing else 0)"</automated>
  </verify>
  <done>pds.html has a top-level PDS_ICONS dict with all 10 named keys and an `icon` macro; icons.css exists with a currentColor-based `.pds-icon` rule; no existing macro/CSS/token was modified.</done>
</task>

<task type="auto">
  <name>Task 2: Render all 10 glyphs inline on the docs page</name>
  <files>docs/index.html</files>
  <action>
    docs/index.html is a STATIC page (served as-is, not Jinja-rendered), so the
    icons must be pasted as LITERAL inline `<svg>` markup that mirrors the macro's
    output exactly — same `viewBox="0 0 24 24"`, same `fill="currentColor"`, same
    `<path d="...">` values authored in Task 1 (copy each path verbatim from
    PDS_ICONS so docs and macro cannot drift).
    Add `<link rel="stylesheet" href="../pealton_design_system/static/icons.css">`
    in the <head> alongside the other DS stylesheet links (local relative path —
    NOT an external/CDN URL). Add a new `<h2>Icons</h2>` section (place it near the
    other component demos) containing all 10 inline `<svg class="pds-icon">` glyphs,
    each with a small caption showing its name, in a `.demo-row`/`.grid` layout that
    already exists. Do NOT add any `<link>`/`<script>` pointing at an icon font, a
    CDN, or any `http(s)://` icon asset. Do not alter existing sections.
  </action>
  <verify>
    <automated>cd /workspace && test $(grep -c 'class="pds-icon"' docs/index.html) -ge 10 && grep -q 'static/icons.css' docs/index.html && ! grep -Eiq 'fontawesome|material-icons|icomoon|glyphicon|cdnjs|<link[^>]*href="https?://[^"]*icon' docs/index.html && echo OK</automated>
  </verify>
  <done>docs/index.html has an Icons section with 10+ inline `.pds-icon` SVGs, links the local icons.css, and introduces zero external icon assets (grep confirms no CDN/icon-font).</done>
</task>

<task type="auto">
  <name>Task 3: Test the icon macro (render + escape safety)</name>
  <files>tests/test_macros.py</files>
  <action>
    APPEND new tests to tests/test_macros.py (reuse the existing `render` helper and
    autoescape `env` — do not modify existing tests). Add `test_icon_renders_inline_svg_for_every_name`:
    loop the 10 names, render `{% import "pds.html" as pds %}{{ pds.icon(name) }}`,
    assert each output contains `<svg` and `pds-icon` and a `<path` and no
    `http` / external reference. Add `test_icon_unknown_name_is_empty_and_safe`:
    an unknown name renders without raising and produces no `<svg`. Add
    `test_icon_label_is_escaped`: render `pds.icon("search", label="<script>alert(1)</script>")`
    and assert `"<script>"` NOT in output and `"&lt;script&gt;"` IS in output and
    `aria-label` present. Keep assertions specific with helpful messages.
  </action>
  <verify>
    <automated>cd /workspace && PYTHONPATH=/workspace python3 -m pytest tests/test_macros.py -q 2>&1 | tail -5</automated>
  </verify>
  <done>All tests in tests/test_macros.py pass, including the three new icon tests (render-per-name, unknown-name-safe, label-escaped).</done>
</task>

</tasks>

<threat_model>
Only untrusted surface is caller-supplied text into the macro. STRIDE:
| Threat ID | Category | Component | Disposition | Mitigation |
|-----------|----------|-----------|-------------|------------|
| T-fwv-01 | Tampering/Injection (XSS) | `icon(name, label=...)` macro output | mitigate | `label` echoed only through autoescaped `{{ }}`; Task 3 test_icon_label_is_escaped proves `<script>` is neutralised; autoescape stays on |
| T-fwv-02 | Denial (render crash) | unknown `name` lookup | mitigate | safe lookup + `{% if %}` guard → empty output, never KeyError; covered by test_icon_unknown_name_is_empty_and_safe |
| T-fwv-03 | Supply-chain / external fetch | docs icon assets | mitigate | all glyphs inline; grep gate in Task 2 blocks any CDN/icon-font/external icon `<link>`/`<script>` |
No package installs introduced → no package-legitimacy checkpoint needed.
</threat_model>

<verification>
Phase-level checks (run from /workspace):
1. `PYTHONPATH=/workspace python3 -m pytest tests/test_macros.py -q` → all pass.
2. `grep -c 'class="pds-icon"' docs/index.html` → ≥ 10.
3. `grep -Ei 'fontawesome|material-icons|icomoon|glyphicon|cdnjs|href="https?://[^"]*icon' docs/index.html` → no matches (no external icon assets).
4. `git diff --stat` shows only the 4 intended files; existing macros/CSS/tokens unchanged (`git diff pealton_design_system/static/components.css pealton_design_system/static/tokens.css` empty).
</verification>

<success_criteria>
- `icon(name)` macro renders inline `<svg>` for all 10 named glyphs; unknown name is safe/empty.
- Macro escapes untrusted `label`; autoescape unaffected.
- docs/index.html renders all 10 glyphs inline with a local icons.css link and zero external icon requests.
- New icons.css is additive (currentColor + logical props); no existing macro/CSS/token modified.
- tests/test_macros.py green.
</success_criteria>

<output>
Create `.planning/quick/260718-fwv-add-an-inline-svg-icon-component-jinja-m/260718-fwv-SUMMARY.md` when done.
</output>
