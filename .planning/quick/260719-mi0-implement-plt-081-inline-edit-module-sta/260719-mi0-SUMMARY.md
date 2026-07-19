---
phase: quick-260719-mi0
plan: 01
subsystem: design-system / table / inline-edit
tags: [pds-field-editor, pds-table, epic-3, PLT-081, inline-edit, concurrency, rtl]
issue: 9
requires:
  - docs/TABLE-CONTRACT.md §Inline edit, §Concurrency, §Confirm ladder (normative)
  - pealton_design_system/static/pds-table.js (PLT-080 core, merged PR #8)
provides:
  - window.createFieldEditor / PDS.createFieldEditor — standalone per-field editor (drawer-ready)
  - one edit grammar: ✓/✕ + Enter/Esc(no-bubble) + validate + wait-not-optimistic busy + 409-conflict
  - pds-table editable-column seam (editable:{...} + onFieldSave) reusing the factory
  - tabulator.css inline-edit rules; docs/table.html editable-column demo (fake saver, all paths)
affects:
  - Epic 4 drawer task — consumes createFieldEditor as its edit grammar
  - Epic 3 adoption tasks PLT-084 — wire real HR fields onto this seam
tech-stack:
  added: []
  patterns: [vanilla-js-iife, single-escapehtml-sanitiser, tokens-only-css, css-logical-properties, node-domstub-behavioural-tests]
key-files:
  created:
    - pealton_design_system/static/pds-field-editor.js
    - tests/test_field_editor.py
    - tests/js/dom-stub.mjs
    - tests/js/field-editor.harness.mjs
  modified:
    - pealton_design_system/static/pds-table.js
    - pealton_design_system/static/tabulator.css
    - docs/table.html
gemini:
  plan: APPROVE (no findings)
  code: APPROVE (round 2 — round 1 REQUEST_CHANGES on the table seam, both findings fixed; one low advisory fixed)
decisions:
  - "Standalone factory is the primary deliverable; the table seam REUSES it (no second edit implementation) — one grammar in table + drawer."
  - "Table seam: once bootstrapped by cellClick the field editor OWNS the cell DOM; row data is synced by reference (not row.update) so a conflict notice is not wiped and a bubbled click cannot re-mount the editor."
  - "Behaviour is tested for real via a zero-dep Node + DOM-stub harness driven by pytest (skips if node absent), not just token-presence — genuine coverage of confirm/cancel/Esc-no-bubble/busy/conflict."
  - "wait-not-optimistic is the DS default; the contract's stage optimistic-sync exception is a consumer choice (its onSave), not baked into the DS."
metrics:
  completed: 2026-07-19
---

# Phase quick-260719-mi0 Plan 01: inline-edit module (PLT-081) Summary

Shipped the Pealton Design System inline-edit module — a framework-free,
zero-runtime-dep **standalone** per-field editor `createFieldEditor(mount,
options)` carrying the ONE edit grammar the DS defines (contract §Inline edit,
§Concurrency, §Confirm ladder rung 1): ✓ confirm / ✕ cancel, Enter=confirm,
Esc=cancel that does **not** bubble to an outer `<dialog>`, text/select/number
with a per-field validation hook, a wait-not-optimistic busy state that blocks
double-submit, and a 409-conflict path that refreshes to the server value with an
inline notice and never silently overwrites. The factory is consumable outside a
table (Epic 4's drawer reuses it) and is also wired into `pds-table` cells so a
table column edits with the identical grammar. Demo + tests included.

## What was built

| Task | Deliverable | Commit |
|------|-------------|--------|
| 1 | `createFieldEditor` factory — types/validate, ✓/✕ + Enter/Esc(no-bubble), busy, 409-conflict, escapeHtml, dual+Node export | `a6e44b8` |
| 2 | `pds-table` editable-column seam reusing the factory (editable + onFieldSave), re-entry-guarded, data synced by reference | `9f75f14` |
| 3 | `tabulator.css` inline-edit rules (tokens + logical props) + `docs/table.html` editable demo (fake saver: success/fail/conflict) | `8cc6e5b` |
| 4 | `tests/test_field_editor.py` + Node/DOM-stub behavioural harness + source-level assertions | `45f6032` |

## Verification

- `node --check` passes on both JS modules.
- `python3 -m pytest tests/ -q` — **26 passed** (baseline 15 + 11 new). Green.
- Behavioural harness runs under Node here: **28 assertions pass** covering
  confirm-applies, cancel-restores, Esc=cancel & NO-bubble, Enter=confirm, busy
  blocks double-submit, 409-conflict fires onConflict + shows the fresh value +
  no silent overwrite + re-openable, validate blocks, select commits. Skips
  cleanly where `node` is unavailable (a node-less CI stays green).
- `tabulator.css` additions use `--pds-*` tokens only (no new raw hex; grep
  confirmed) with CSS logical properties (RTL).
- Gemini: **plan APPROVE**; **code APPROVE** after fixing a round-1
  REQUEST_CHANGES on the table seam.

## Deviations from Plan

**Table-seam conflict/re-render handling (design refinement from Gemini code
review, round 1 → round 2).** The first cut called `row.update()` on
commit/conflict; Gemini correctly flagged that (a) clicks inside the active
editor bubble to `cellClick` and re-mount it, and (b) `row.update()` on conflict
re-renders the cell and wipes the inline notice. Fixed by having the field editor
**own the cell DOM** once bootstrapped (re-entry guarded by detecting an existing
`.pds-field-editor`) and syncing Tabulator's row data **by reference** on the
terminal events instead of `row.update()`. Known, documented limitation: after an
in-cell edit the cell shows the editor's plain-text display rather than the
column's Tabulator formatter — acceptable for PLT-081; adoption tasks (PLT-084+)
that need a formatter can trigger a table refresh. No contract behaviour lost.

Otherwise: plan executed as written.

## Security notes (threat model)

- **T-mi0-01 (XSS)** — mitigated: one `escapeHtml` routes every injected string
  (notice/error copy); dynamic values use `textContent`. Test asserts the helper
  is defined AND used.
- **T-mi0-02 (lost update / silent overwrite)** — mitigated: on
  `{conflict:true,current}` the editor adopts the SERVER value, shows a notice,
  fires `onConflict`, and never re-sends the stale edit. Behavioural test asserts
  the fresh value is shown and no overwrite occurs.
- **T-mi0-03 (double-write)** — mitigated: wait-not-optimistic busy lock disables
  the control + a second confirm while busy is a no-op. Behavioural test asserts
  a single `onSave` call.
- **T-mi0-04 (scope creep)** — mitigated: no HR endpoints/field names/business
  Hebrew baked into the module; denylist test blocks regressions.
- **T-mi0-SC (supply chain)** — accepted: no installs; the DOM stub is a
  test-only local file; zero new runtime deps.

## Known Stubs

None in the module. The `docs/table.html` saver is a deliberate **fake** async
saver (demo only) exercising success/failure/conflict — real HR endpoints are out
of scope (PLT-084). The formatter-loss note above is a documented limitation, not
a stub.

## Self-Check

- Files exist: pds-field-editor.js, pds-table.js (modified), tabulator.css
  (modified), docs/table.html (modified), tests/test_field_editor.py,
  tests/js/dom-stub.mjs, tests/js/field-editor.harness.mjs — verified.
- Commits exist: a6e44b8, 9f75f14, 8cc6e5b, 45f6032 — verified.
- Full suite green (26 passed); behavioural harness 28/28 under node.
