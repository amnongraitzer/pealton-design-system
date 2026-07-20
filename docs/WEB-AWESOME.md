# Web Awesome in the Pealton Design System

**Status:** Epic 5 phase 1 (PLT-099). Vendored, DS-themed, RTL-ready.

The DS ships a small, **vendored** slice of [Web Awesome Free](https://webawesome.com)
(MIT — the successor to Shoelace) so both Pealton apps get richer interactive
controls — a searchable multi-select and a dialog to start — without a framework
or a build step. The assets are self-hosted exactly like `tokens.css` and
`pds-table.js`: **no runtime CDN, no autoloader, zero runtime dependencies.**

Proven live in [`docs/webawesome.html`](./webawesome.html).

## What's vendored

| File (under `pds.static_dir()`) | What it is |
|---|---|
| `webawesome.bundle.js` | Self-contained ES-module bundle (~220 KB) that registers the five elements Epic 5 needs: `wa-select`, `wa-option`, `wa-dialog`, `wa-input`, `wa-button`. Importing it self-registers the custom elements. |
| `webawesome.base.css` | Web Awesome's own light-theme `--wa-*` token defaults (~57 KB), with its `@import` chain flattened into one file. |
| `webawesome.css` | The **DS theme layer** — re-points the key `--wa-*` variables at `--pds-*` tokens so the components inherit the Monday-inspired Pealton look. |
| `webawesome.LICENSE.md` | Web Awesome's MIT license (attribution for the vendored code). |

These were produced by a **one-time** `esbuild` step (see the phase RESEARCH
recipe) — the same way Tabulator ships one `tabulator.min.js`. A consuming app
never runs that step; it just serves the static files.

## How a consumer app loads it

Serve `pds.static_dir()` as you already do for `tokens.css`, then add three tags
in **this order**:

```html
<!-- 1. Web Awesome's own --wa-* defaults -->
<link rel="stylesheet" href="/pds/webawesome.base.css">
<!-- 2. DS theme layer — MUST come after base so its overrides win -->
<link rel="stylesheet" href="/pds/webawesome.css">
<!-- 3. Register the elements (module script) -->
<script type="module" src="/pds/webawesome.bundle.js"></script>
```

**Order matters.** `webawesome.base.css` defines every `--wa-*` default;
`webawesome.css` then re-points the important ones at `--pds-*`. Load the DS
layer first and the base defaults would overwrite it.

`tokens.css` must also be present on the page (it defines the `--pds-*` values
the theme layer references) — it already is in every DS page via the shared base.

## Theme-token mapping

The theme layer maps Web Awesome's variables onto DS tokens. Summary:

| Web Awesome `--wa-*` | DS token `--pds-*` |
|---|---|
| `--wa-color-brand-fill-loud` / `-normal` | `--pds-primary` |
| `--wa-color-brand-fill-quiet` | `--pds-primary-wash` |
| `--wa-color-brand-on-loud` | `white` |
| `--wa-color-surface-default` / `-raised` | `--pds-panel` |
| `--wa-color-surface-lowered` | `--pds-panel-2` |
| `--wa-color-surface-border` | `--pds-line` |
| `--wa-color-text-normal` / `-quiet` | `--pds-ink` / `--pds-ink-soft` |
| `--wa-color-text-link` | `--pds-primary` |
| `--wa-color-focus` | `--pds-primary` |
| `--wa-font-family-body` / `-heading` | `--pds-font` |
| `--wa-border-radius-s` / `-m` / `-l` / `-pill` | `--pds-r-sm` / `--pds-r` / `--pds-r-lg` / `--pds-r-pill` |
| `--wa-form-control-*` | `--pds-panel` / `--pds-line` / `--pds-r` / `--pds-ink` … |

Every value is a `var(--pds-*)` reference or the keyword `white` — no raw hex,
matching the `tabulator.css` convention. To theme a newly-added component, add
its `--wa-*` reads to `webawesome.css` (all names must exist in
`webawesome.base.css`).

## RTL

Web Awesome components use CSS logical properties internally and honour the
ancestor `dir` attribute. Setting `<html dir="rtl">` — already the DS convention
— is enough; no per-component wiring.

## Searchable multi-select — a note

Web Awesome Free 3.10 gives `<wa-select multiple>` but has **no built-in
search/filter**. The DS adds a *thin* filter in the demo: a `<wa-input>` whose
`input` event toggles the `hidden` attribute on non-matching `<wa-option>`
elements. This is DS glue over vendored WA parts (analogous to `pds-table.js`
being glue over Tabulator), not a WA feature — copy the pattern from
`docs/webawesome.html` when you build the real לשיוך control.

## A note on the bundled icon resolver

The bundle carries a dormant Font Awesome **kit** URL builder
(`ka-f.fontawesome.com` / `ka-p.fontawesome.com`), inherited from Web Awesome's
shared component base chunk. It is **unreachable for this vendored set**: every
internal icon the five components render for their own chrome (the select caret,
the dialog close affordance, the input clear/reveal icons) hardcodes
`library="system"` — Web Awesome's **offline, inline-SVG** icon set. No code path
here requests the `default` (CDN) family, so nothing is fetched at runtime.

It **would** activate only if a consumer adds a bare `<wa-icon>` without a
library. If you do add icons yourself, pass `library="system"` (or register a
custom offline resolver) to keep the no-CDN guarantee.
