# Normative inputs for TABLE-CONTRACT.md (issue #5 / PLT-079)

Gathered by the fleet orchestrator from the two normative sources named in the
issue. These are the ONLY inputs the contract may draw on. Do NOT re-litigate
Amnon's decisions.

## Source A — PLT-077 epic (amnongraitzer/Pealton:BACKLOG.md), Amnon's grill-me
decisions (2026-07-19, all confirmed):

- **Tabulator everywhere** — every table becomes a DS `pds-table` (Tabulator) instance.
- **Legacy pages KEPT and adopt** the component (no retirement). Accepted cost:
  433 KB Tabulator lands on trivial read-only pages; duplicated console-vs-legacy
  surfaces stay alive.
- **Bulk bar = 4 actions**: branch-add (exists) + stage-change + take-ownership + branch-remove.
- **Inline row edit** for: `stage`, `owner`, `role_title`.
- **Per-field commit grammar** (✓ confirm / ✕ cancel / Esc) everywhere, shared table + drawer.
- **NO pagination** — progressive scroll loading with SERVER-SIDE search/filter +
  exact counts, so off-page candidates stay findable (dedicated `/api/candidates/counts`, option a, PLT-082).
- **Selection** persists across progressive loads AND filter/search changes; bar
  shows "N selected" incl. now-hidden rows; bulk applies to the FULL selection, never just visible rows.
- **Concurrency**: writes carry the row's `updated_at`; stale write → 409 → row
  refreshes + inline notice, user re-applies (no silent overwrite).
- **Confirm ladder**: normal = ✓/✕; destructive single = confirm dialog;
  destructive bulk (branch-remove, terminal-negative stage) = dialog with exact
  count + typed-count confirmation.
- **Partial failure** on bulk/multi-assign: per-item outcomes reported
  (done / already / skipped / failed); failures keep their rows selected.
- **States**: loading (skeleton), empty (per-view copy), error (retry affordance),
  partial (progressive-load in flight).
- **Keyboard**: row focus/arrow movement, Enter opens drawer, Esc rules,
  inline-edit keys (Enter = confirm, Esc = cancel).
- **Edit grammar**: inline + drawer share ONE grammar — per-field commit, explicit
  ✓/✕, busy state in-control, wait-not-optimistic EXCEPT stage's existing
  optimistic table sync (kept, documented).

### Assign semantics per table (inventoried in the epic):
- console / hil_queue = candidate→branch links (multi-select, UI max 4).
- admin_users = user→role + branches.
- merge_queue = person-pair merge decision (NOT an assign — bulk actions stay OFF it).

### Inventory — 8 table surfaces → adoption task ids:
| Surface | Kind | Adoption task |
|---|---|---|
| console (operator track) | candidate pool, full CRUD/assign | PLT-084 |
| console (מטה / mgmt track) | HQ candidate pool | PLT-084 |
| hil_queue | legacy assign queue | PLT-087 |
| mgmt_track | legacy | PLT-087 |
| branch_view | legacy read-mostly | PLT-087 |
| admin_users | legacy user→role+branches | PLT-088 |
| merge_queue (table 1) | legacy person-pair merge | PLT-088 |
| merge_queue (table 2) | legacy person-pair merge | PLT-088 |
Target: **0 exemptions**. Any exemption row needs a written reason.

Related tasks: PLT-080 pds-table core · PLT-081 inline-edit module · PLT-082
server progressive-load+search+counts · PLT-083 console client wiring · PLT-085
bulk endpoints · PLT-086 bulk bar UI · PLT-089 close-out audit (reconciles this
doc to as-built).

## Source B — current console behaviour (pealton-hr-platform app/static/console.js),
what EXISTS today and must be documented where it is kept:

- **Bulk branch-add three-outcome report** (`onBulkAdd`): server returns
  `added_ids` / `already_ids` / `skipped_ids`; UI reports them apart —
  "already linked" is the requested end-state, NOT a failure. This is the
  pattern PLT-079 generalizes to done/already/skipped/failed.
- **Bulk today is ADD-only by design** — a bulk REMOVE is called out as
  destructive at scale (mass manager lock-out, mass fallback to לשיוך). PLT-085/086
  add it behind the typed-count ladder.
- **Assign modal** (`openAssign`/`enforceMaxFour`/`submitAssign`): per-row for
  UNASSIGNED candidates only; max 4 branches (UI-enforced, disables extra
  checkboxes); ACTIVE branches only (endpoint rejects inactive); POST /hil/assign
  (303 redirect = success via redirect:"manual" opaque response; 400/409 → JSON error).
- **Selection**: Tabulator `selectableRows` + `rowSelection` column;
  `getSelectedData()` → `application_id`s; bulk bar shown only while rows selected
  (`rowSelectionChanged` → `refreshBulkBar`); "N נבחרו" count; bulk-clear = `deselectRow()`.
- **Row click** opens detail drawer — suppressed when the click is on the
  select checkbox or the assign button.
- **Stage change** (drawer `onStageChange` → POST /stage): keeps the table's stage
  column in sync via `table.updateData` WITHOUT full reload — this is the existing
  OPTIMISTIC sync that the contract explicitly keeps and documents.
- **Owner** = "take ownership" button (`onTakeOwner` → POST /owner) — wait, not optimistic.
- **Record edit** (drawer `enterRecordEdit`/`exitRecordEdit` → POST /fields):
  a per-field edit form; a silent background refresh must not yank an open edit
  form out mid-typing.
- **Load model today**: operator pool loaded ONCE client-side (GET /api/candidates);
  hunt = server-ranked (POST /api/hunt). Contract prescribes moving to progressive
  server-side loading (PLT-082/083) — document the target behaviour, note the
  current once-load as being replaced.
- **Counts** today derived from the full in-memory pool (`refreshCounts`);
  contract prescribes server exact-counts endpoint.
- All candidate text is HTML-escaped in formatters (external email-sourced data).
- **hunt double-fire** (Epic 0 flag #2): a known bug where Enter in a hunt field
  fires both the panel keydown AND the form submit — closes via console adoption (PLT-084),
  a listed verification case in the epic.

## Scope guardrails
- **Docs only.** No implementation. No code changes beyond creating docs/TABLE-CONTRACT.md.
- Out of scope: the real-estate app's tables (note as future adopters only).
- Every behaviour statement must be testable — phrased GIVEN/WHEN/THEN.
