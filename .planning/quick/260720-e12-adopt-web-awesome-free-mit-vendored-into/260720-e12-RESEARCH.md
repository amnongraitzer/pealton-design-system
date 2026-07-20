# Quick Task 260720-e12 — Research / Proven Vendoring Recipe

**Author:** fleet execution agent (pre-verified in-sandbox before planning)
**Task:** Vendor Web Awesome Free (MIT) into the DS, mirror the self-hosted Tabulator pattern.
**Issue:** #11 / PLT-099 (Epic 5 phase 1) · risk:medium

## Key facts (verified against the live npm package)

- Package: `@awesome.me/webawesome@3.10.0`, **license MIT** (confirmed in package metadata + `LICENSE.md`).
  Successor to Shoelace. Web components built on Lit.
- Components are ES modules that **self-register** their custom element on import (side effect).
  We only need: `select` (`<wa-select>`), `option` (`<wa-option>`), `dialog` (`<wa-dialog>`),
  plus `input` (`<wa-input>`) and `button` (`<wa-button>`) used by the demo.
- The dist uses a **shared-chunk graph** + bare npm deps (lit, @floating-ui/dom, etc.), so a single
  component file is NOT self-contained. We therefore **bundle once** with esbuild into ONE
  self-contained file — exactly mirroring how Tabulator ships one `tabulator.min.js`.
- **`<wa-select>` has `multiple` but NO built-in search/filter attribute** in WA Free 3.10.
  Slots include `label`, `start`, `end`. Parts include `listbox`, `combobox`, `display-input`.
  → To satisfy the issue's "searchable multi-select", the DS adds a THIN filter layer (a `<wa-input>`
  search box whose input toggles `hidden` on non-matching `<wa-option>` elements). This is DS glue
  over vendored WA parts, analogous to `pds-table.js` being glue over Tabulator. **Flag as an assumption.**
- Runtime render is a **MANUAL** check (no headless browser in sandbox, per the issue). Source-level
  pytest is the automated gate — same philosophy as `tests/test_table_module.py`.

## Proven build recipe (run from repo root; produces the two vendored artifacts)

```bash
# 1. Temp build dir (NOT committed). Network is available in-sandbox.
BUILD=$(mktemp -d)
cd "$BUILD"
npm init -y >/dev/null
npm install @awesome.me/webawesome@3.10.0 esbuild >/dev/null 2>&1

# 2. Bundle ONLY the needed components into one self-contained ESM file (~220KB).
cat > entry.js <<'EOF'
// Vendored Web Awesome bundle — registers ONLY the components Epic 5 needs.
// Importing a component module has the side effect of defining its custom element.
import '@awesome.me/webawesome/dist/components/select/select.js';
import '@awesome.me/webawesome/dist/components/option/option.js';
import '@awesome.me/webawesome/dist/components/dialog/dialog.js';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
EOF
./node_modules/.bin/esbuild entry.js --bundle --format=esm --minify \
  --outfile=webawesome.bundle.js

# 3. Bundle the WA base theme tokens (default light theme) into one self-contained CSS (~56KB).
#    This resolves the @import chain (layers.css + color palette) into a single file.
./node_modules/.bin/esbuild \
  ./node_modules/@awesome.me/webawesome/dist/styles/themes/default.css \
  --bundle --loader:.css=css --outfile=webawesome.base.css

# 4. Copy artifacts + license into the repo, then clean up.
cp webawesome.bundle.js  /workspace/pealton_design_system/static/webawesome.bundle.js
cp webawesome.base.css   /workspace/pealton_design_system/static/webawesome.base.css
cp ./node_modules/@awesome.me/webawesome/LICENSE.md \
   /workspace/pealton_design_system/static/webawesome.LICENSE.md
cd /workspace && rm -rf "$BUILD"
```

Verified outputs in-sandbox: `webawesome.bundle.js` ≈ 220 KB, `webawesome.base.css` ≈ 56 KB,
both self-contained (no remaining `@import`, no bare imports, no CDN URL).

## Theme mapping (`webawesome.css` — the DS theme layer, hand-written)

WA reads design decisions from `--wa-*` custom properties that cascade (incl. through shadow DOM).
Load order on any page/app: **`webawesome.base.css` FIRST** (defines all `--wa-*` defaults),
**then `webawesome.css`** (DS layer that re-points the key ones at `--pds-*`). Map at minimum:

- Brand: `--wa-color-brand-fill-loud: var(--pds-primary)`, `-fill-normal`/`-fill-quiet` to
  `--pds-primary` / `--pds-primary-wash`; `--wa-color-brand-on-loud: white`;
  border/link brand tokens → `--pds-primary` / `--pds-primary-ink`.
- Surfaces/text/lines: `--wa-color-surface-*` → `--pds-panel`/`--pds-panel-2`;
  `--wa-color-text-normal/quiet` → `--pds-ink`/`--pds-ink-soft`; borders → `--pds-line`.
- Type: `--wa-font-family-body/heading` → `var(--pds-font)`; font sizes → `--pds-fs-*` where sensible.
- Radius: `--wa-border-radius-m/s/l` → `--pds-r`/`--pds-r-sm`/`--pds-r-lg`; pill → `--pds-r-pill`.
- Focus: `--wa-color-focus` → `var(--pds-primary)`.
Use ONLY `--pds-*` tokens or the keyword `white` — no raw hex (matches `tabulator.css` convention).

## RTL

WA components honor the ancestor `dir` attribute (logical properties internally). Setting
`<html dir="rtl">` — already the DS demo convention — is sufficient; no per-component wiring.
Note this in the doc.

## Consumer-app loading (document in docs/WEB-AWESOME.md)

Same mechanism as `tokens.css` / `pds-table.js` — served from `pds.static_dir()`:
```html
<link rel="stylesheet" href="/pds/webawesome.base.css">   <!-- WA token defaults -->
<link rel="stylesheet" href="/pds/webawesome.css">        <!-- DS theme layer (after base) -->
<script type="module" src="/pds/webawesome.bundle.js"></script>  <!-- registers the elements -->
```
No CDN, no autoloader, zero runtime deps — consistent with the DS constraints.
