---
phase: quick-260718-fwv
plan: 01
subsystem: design-system-icons
tags: [icons, jinja-macro, svg, docs, tests, PLT-068]
requires: [pealton_design_system/templates/pds.html, docs/index.html, tests/test_macros.py]
provides:
  - "icon(name, label, size, cls) Jinja macro + PDS_ICONS path data for 10 glyphs"
  - "static/icons.css additive .pds-icon sizing (currentColor, logical props)"
  - "docs Icons section rendering all 10 glyphs inline"
affects: []
tech-stack:
  added: []
  patterns: ["inline single-path SVG on 0 0 24 24 viewBox, currentColor, safe dict lookup"]
key-files:
  created:
    - pealton_design_system/static/icons.css
  modified:
    - pealton_design_system/templates/pds.html
    - docs/index.html
    - tests/test_macros.py
decisions:
  - "Top-level {% set PDS_ICONS %} referenced inside the macro (proven to work when imported)"
  - "Safe lookup via PDS_ICONS.get(name) + {% if %} guard so unknown name is empty, never KeyError"
  - "Zero external requests: every glyph inline; docs paths copied verbatim from the macro"
metrics:
  duration: ~15m
  completed: 2026-07-18
---

# Phase quick-260718-fwv Plan 01: Inline-SVG Icon Component Summary

A self-contained inline-SVG icon set for the Pealton Design System: a Jinja `icon(name)` macro carrying path data for 10 Monday-style glyphs, additive `.pds-icon` CSS, a docs Icons section, and macro tests — all with zero external requests (no CDN, no icon font).

## What was built

- **`icon(name, label="", size="", cls="")` macro** in `pds.html`, backed by a top-level `PDS_ICONS` dict mapping the 10 names (search, caret, close, add, document, star, warning, flag, back, forward) to single-path SVG `d` strings on a `0 0 24 24` viewBox with `fill="currentColor"`.
  - Safe lookup (`PDS_ICONS.get(name)` + `{% if %}` guard) → unknown name renders empty, never raises.
  - `label` non-empty → `role="img"` + autoescaped `aria-label`; otherwise `aria-hidden="true"`.
- **`static/icons.css`** (new, additive): `.pds-icon` sizing/alignment via CSS logical properties (`inline-size`/`block-size` 1.25em), `fill: currentColor`, plus `--sm`/`--lg` modifiers. Colour comes from `currentColor` only — no hex, no token edits.
- **`docs/index.html`**: local `icons.css` link + an Icons section rendering all 10 glyphs as literal inline `<svg>` (paths copied verbatim from the macro so docs and macro cannot drift). No external icon assets.
- **`tests/test_macros.py`**: three appended tests — render-per-name, unknown-name-safe, label-escaped.

## Deviations from Plan

None affecting code. One environment note: `pytest` was not installed in the sandbox. It is the project's own declared dev/test extra (`.[test]` in `pyproject.toml`), not a hallucinated/slopsquatted package, so this is not a Rule 3 package-legitimacy checkpoint. Installed it (`--break-system-packages`) purely to run the existing test suite; no source or dependency manifest was changed.

## Security / Threat coverage

- **T-fwv-01 (XSS via label):** mitigated — `label` echoed only through autoescaped `{{ }}`; `test_icon_label_is_escaped` proves `<script>` becomes `&lt;script&gt;`.
- **T-fwv-02 (render crash on unknown name):** mitigated — safe `.get()` lookup + guard; `test_icon_unknown_name_is_empty_and_safe`.
- **T-fwv-03 (external fetch):** mitigated — all glyphs inline; docs grep gate confirms no CDN/icon-font/external `<link>`/`<script>`.

## Verification output (actual)

```
1. pytest tests/test_macros.py -q
   .......                                    [100%]
   7 passed in 0.06s

2. grep -c 'class="pds-icon"' docs/index.html
   10        (>= 10 required)

3. grep -Ei 'fontawesome|material-icons|icomoon|glyphicon|cdnjs|href="https?://[^"]*icon' docs/index.html
   (no matches, exit 1)   — zero external icon assets

4. git diff --stat (HEAD~3..HEAD) — only the 4 intended files:
   docs/index.html                          | 16 ++
   pealton_design_system/static/icons.css   | 26 ++
   pealton_design_system/templates/pds.html | 36 ++
   tests/test_macros.py                     | 38 ++
   git diff components.css + tokens.css     | 0 bytes (unchanged)
```

## Commits

- `80987ae` feat: add inline-SVG icon macro + additive icons.css
- `a3657b5` feat: render all 10 icon glyphs inline on docs page
- `130109d` test: cover icon macro render + escape safety

## Known Stubs

None. All 10 glyphs carry real path data and render.

## Self-Check: PASSED

- FOUND: pealton_design_system/static/icons.css
- FOUND: pealton_design_system/templates/pds.html (PDS_ICONS + icon macro)
- FOUND: docs/index.html Icons section (10 inline .pds-icon)
- FOUND: tests/test_macros.py (3 icon tests)
- FOUND commits: 80987ae, a3657b5, 130109d
