# Testing — Pealton Design System

Mapped 2026-07-18 during GSD initialization.

## Framework

- **pytest** (dev extra `.[test]`, needs `jinja2>=3`).
- Run: `python -m pytest`.

## Coverage today

One test file — `tests/test_macros.py` — covering the Jinja macro layer, which
is the only layer with logic. The CSS/font/JS layers have no automated tests
(they are static assets; verified visually via `docs/index.html`).

| Test | What it guards |
|------|----------------|
| `test_every_macro_renders_and_emits_its_class` | Every macro renders without error and emits the exact class its CSS styles (the macro↔CSS contract). Exercises all 13 macros, including `{% call %}` for card/modal/drawer. |
| `test_field_invalid_state` | `field(error=...)` flips the input to `aria-invalid="true"`, adds `pds-input--invalid`, and shows the message. |
| `test_plain_arg_is_escaped` | A `<script>` passed as a plain macro arg is HTML-escaped. |
| `test_caller_content_is_escaped` | A `<script>` passed via `{% call %}` caller content is also escaped (distinct render path). |

## Gaps / notes

- **No visual regression / rendering tests** for the CSS itself — intentional for
  now; the showcase page is the manual check.
- **No JS unit tests** for `pds.js` overlay behaviour.
- The escaping tests are the security guardrail — keep them green and keep
  Jinja autoescape on in any consuming app.
