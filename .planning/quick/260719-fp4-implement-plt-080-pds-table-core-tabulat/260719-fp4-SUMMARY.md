---
phase: quick-260719-fp4
plan: 01
subsystem: design-system / table
tags: [pds-table, tabulator, epic-3, PLT-080, rtl, states, selection]
requires:
  - docs/TABLE-CONTRACT.md (normative behaviour contract, PLT-079)
  - global Tabulator (caller-provided at runtime; vendored for docs)
provides:
  - window.createPdsTable / window.PDS.createTable — themed Tabulator wrapper
  - controller: selection API {selectedIds, count, clear} + setState/show* states
  - tabulator.css state/overlay/skeleton/spinner/bulk-bar rules
  - docs/table.html live demo
affects:
  - future Epic 3 adoption tasks PLT-084..088 (wire behaviour, not rebuild)
tech-stack:
  added: []
  patterns: [vanilla-js-iife, single-escapehtml-sanitiser, tokens-only-css, css-logical-properties]
key-files:
  created:
    - pealton_design_system/static/pds-table.js
    - docs/table.html
    - tests/test_table_module.py
  modified:
    - pealton_design_system/static/tabulator.css
decisions:
  - "Force no pagination by stripping/omitting the option (Tabulator default off) rather than declaring a pagination key — matches progressive-scroll contract."
  - "Single escapeHtml helper is the only path text becomes HTML; every injected string routes through it."
  - "DS provides ONLY the bulk-bar mount + 'N נבחרו' count + clear; consumers render their own action buttons."
metrics:
  duration: ~15m
  completed: 2026-07-19
---

# Phase quick-260719-fp4 Plan 01: pds-table core (PLT-080) Summary

Shipped the Pealton Design System `pds-table` core — a framework-free,
zero-runtime-dep Tabulator wrapper `createPdsTable(el, options)` that applies the
DS theme, defaults to RTL with virtual scroll and no pagination, renders the four
contract states via one overlay (skeleton / per-view empty / error+retry /
loading-more), and exposes a selection + bulk-bar API whose count label renders
"N נבחרו". Backed by appended `tabulator.css`, a live `docs/table.html` demo, and
source-level contract tests.

## What was built

| Task | Deliverable | Commit |
|------|-------------|--------|
| 1 | `createPdsTable` core — escapeHtml, theme + RTL + virtual + no-pagination, rowSelection + bulk-bar mount, dual global exposure | `27a065a` |
| 2 | State overlay — `setState` + `show*` for skeleton/empty/error+retry/loading-more | `a40b334` |
| 3 | `tabulator.css` state/overlay/skeleton/spinner/bulk-bar rules (tokens only, logical properties) + `docs/table.html` demo | `26aa81f` |
| 4 | `tests/test_table_module.py` source-level contract assertions | `793f340` |

## Verification

- `node --check pealton_design_system/static/pds-table.js` — passes.
- `python3 -m pytest tests/ -q` — **15 passed** (baseline 7 + 8 new). Green.
- `tabulator.css` uses `--pds-*` tokens + `white` only; no raw hex introduced
  (grep confirmed); CSS logical properties throughout.
- `docs/table.html` verified DOM-structurally via the test file (no headless
  browser in-sandbox — stated honestly in an HTML comment on the page).

## Deviations from Plan

**Pagination handling (Task 1 wording clarification, not a behaviour change).**
The plan said both "do NOT set any pagination option" and "force pagination off".
Resolved by omitting the `pagination:` option literal (Tabulator v6 defaults to
off) and `delete`-stripping any pagination keys a caller merges in. This forces
progressive-scroll while satisfying the "no pagination option key" test assertion.
No functional deviation from the contract.

Otherwise: plan executed as written.

## Security notes (threat model)

- **T-fp4-01 (XSS)** — mitigated: one `escapeHtml` helper escapes all five HTML
  metachars; every injected string (empty copy, error copy) routes through it.
  Task 4 asserts the helper is defined AND used (>1 occurrence).
- **T-fp4-02 (scope creep)** — mitigated: no HR endpoints/field names/business
  Hebrew baked in except the "N נבחרו" count label. Task 4 denylist test blocks
  `candidate` / `application_id` / `/api/` / `/hil/` and any external `http` URL.
- **T-fp4-SC (supply chain)** — accepted: no package installs; Tabulator is a
  caller-provided global / docs-vendored copy. Zero new runtime deps.

## Known Stubs

None. The wrapper is intentionally app-agnostic — data fetching, inline-edit,
and real endpoints are out of scope (PLT-081/082/083). This is the reusable core
Epic 3 adoption tasks build on, not a stub.

## Self-Check

- Files exist: pds-table.js, docs/table.html, tests/test_table_module.py, tabulator.css — verified.
- Commits exist: 27a065a, a40b334, 26aa81f, 793f340 — verified.
