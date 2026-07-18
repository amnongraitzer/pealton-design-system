# Requirements — Pealton Design System

Initialized 2026-07-18 from existing code (brownfield). The v1 requirements below
are **already shipped** — they were reverse-mapped from the package as it exists
at phase 6 (PLT-060), not newly proposed. Deferred items are documented in the
README but not yet built.

## v1 Requirements (delivered)

### Tokens
- [x] **TOK-01**: A single `:root` token layer defines colour, spacing, type,
  radius, z-index, and shadow using the Monday palette (light scale only).

### Typography
- [x] **FONT-01**: Rubik ships self-hosted inside the package (variable weight
  300–900, Hebrew + Latin subsets) and loads offline with no CDN.
- [x] **FONT-02**: Loading the DS removes the silent Segoe-UI / per-OS fallback
  both apps previously shipped.

### Components
- [x] **COMP-01**: Button component with primary / ghost / danger variants,
  sizes, and disabled state.
- [x] **COMP-02**: Chip component (default + primary variant).
- [x] **COMP-03**: The five signature status/stage pills (new, contacted,
  invited, rejected, hired), including a soft variant and dot.
- [x] **COMP-04**: Card component (hover + flush options).

### Forms & tables
- [x] **FORM-01**: Input, select, textarea, and checkbox controls.
- [x] **FORM-02**: Form field wrapper with label, help text, required marker,
  and an invalid state (`aria-invalid`, error message).
- [x] **TABLE-01**: Tabulator table theme matching the DS.

### Overlays
- [x] **OVL-01**: Modal and drawer built on the native `<dialog>` element, with
  `pds.js` open/close behaviour and `data-pds-close` hooks.

### Macros
- [x] **MACRO-01**: A Jinja macro exists for every component so apps call
  `pds.button(...)` etc. instead of copy-pasting markup.
- [x] **MACRO-02**: All macro text arguments (plain and `{% call %}` caller
  content) are HTML-escaped.

### Packaging & distribution
- [x] **DIST-01**: Installable Python package with zero runtime deps; ships
  static assets + templates as package data.
- [x] **DIST-02**: `static_dir()` / `templates_dir()` helpers let a FastAPI +
  Jinja app mount assets and import macros.
- [x] **DIST-03**: Installs directly from GitHub `@main` (float now, pin at launch).

### Documentation & tests
- [x] **DOCS-01**: `docs/index.html` showcases every component and token in
  Hebrew/RTL and verifies Rubik rendered.
- [x] **TEST-01**: `python -m pytest` renders every macro, checks the field
  invalid state, and verifies escaping.

## Deferred (documented in README, not yet built)

These are recorded so they are not "invented" later — they come from the
codebase's own roadmap notes, and are **not** in active scope.

- **DIST-04** (PLT-061): Distribution wired into both consuming apps.
- **PILOT-01** (PLT-062–067): HR pilot + legacy rollout across both apps.
- **ICON-01** (PLT-068–069): Icon set.

## Out of Scope

- **Dark mode** — light scale only until explicitly requested.
- **React / Vibe migration** — ruled out in Epic 0.
- **CDN font delivery** — self-hosted by design.
- **PyPI publishing** — distribution is direct-from-GitHub.

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TOK-01 | 1 — Tokens | ✅ Complete |
| FONT-01, FONT-02 | 2 — Typography | ✅ Complete |
| COMP-01…04 | 3 — Core components | ✅ Complete |
| FORM-01, FORM-02, TABLE-01 | 4 — Forms & tables | ✅ Complete |
| OVL-01 | 5 — Overlays | ✅ Complete |
| MACRO-01, MACRO-02, TEST-01 | 6 — Jinja macros | ✅ Complete |
| DIST-01…03, DOCS-01 | Cross-cutting (delivered across phases 1–6) | ✅ Complete |
| DIST-04, PILOT-01, ICON-01 | 7+ — Deferred | ◻ Not started |
