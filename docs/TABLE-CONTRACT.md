# Table Behaviour Contract (Epic 3 / PLT-079)

This is the single written behaviour contract for Epic 3 — the rollout of the
DS `pds-table` (Tabulator) component across every Pealton HR table surface.

It draws **only** on the normative sources gathered for issue #5 / PLT-079:

- Source A — the PLT-077 epic, Amnon's grill-me decisions (2026-07-19, all
  confirmed).
- Source B — current `console.js` behaviour (pealton-hr-platform app), which
  documents what already exists today and must be preserved or explicitly
  replaced.

Every behaviour statement below is phrased **GIVEN / WHEN / THEN** and is
individually spot-checkable — an implementer should be able to read one
bullet, build one test case, and know whether it passes.

**Scope note:** the real-estate app's tables are **out of scope** — they are
future adopters only, not covered by this contract. **PLT-089** (close-out
audit) later reconciles this document to the as-built system once adoption
tasks PLT-080..088 land.

**Rendering safety (cross-cutting, applies to every section below):**

- GIVEN a table cell renders candidate text (name, role, notes, branch names,
  or any field sourced from external email/ingest), WHEN a formatter produces
  cell HTML, THEN that text is **HTML-escaped** before insertion — a Tabulator
  formatter that returns a string inserts it as HTML, so every value (not only
  chips/phones) is escaped. This upholds the project security posture (macros
  and formatters HTML-escape all text; no unescaped external data reaches the
  DOM), and is a mandatory acceptance check for every adoption task.

---

## States

- GIVEN a table is fetching its first page of data, WHEN no rows have arrived
  yet, THEN the table shows a loading **skeleton** in place of rows.
- GIVEN a table's query returns zero rows, WHEN the empty state renders, THEN
  it shows **per-view copy** (the empty message is specific to that view, not
  a generic "no data").
- GIVEN a table request fails, WHEN the error state renders, THEN it shows a
  **retry affordance** the user can activate to re-run the request.
- GIVEN progressive loading is in flight (more rows are being fetched below
  the current scroll position), WHEN the user is scrolled near the loaded
  edge, THEN the table shows a **partial** / in-flight indicator rather than
  looking finished.

## Keyboard

- GIVEN a table has focus, WHEN the user presses the arrow keys, THEN row
  focus moves up/down between rows (row focus/arrow movement).
- GIVEN a row has focus, WHEN the user presses **Enter**, THEN the detail
  drawer opens for that row.
- GIVEN a row is clicked with the pointer, WHEN the click lands on the row
  body, THEN the detail drawer opens; WHEN the click lands on the **row-select
  checkbox** or an in-row **action button** (e.g. the assign button), THEN the
  drawer does **NOT** open — the control's own action fires instead (existing
  console.js suppression rule, carried forward).
- GIVEN any open drawer or inline-edit control, WHEN the user presses **Esc**,
  THEN the control closes/cancels without committing a change (Esc rules
  apply uniformly to drawer and inline edit).
- GIVEN an inline-edit field is active, WHEN the user presses **Enter**, THEN
  the field commits (equivalent to clicking ✓); WHEN the user presses **Esc**,
  THEN the field cancels (equivalent to clicking ✕).

## Selection

- GIVEN rows are selected, WHEN more rows load progressively (scroll-triggered
  fetch), THEN the existing selection **persists** — previously selected rows
  stay selected.
- GIVEN rows are selected, WHEN the user changes a filter or search term such
  that some selected rows are no longer visible, THEN the selection
  **persists across the filter/search change** — hidden rows stay selected.
- GIVEN one or more rows are selected (including rows now hidden by
  filter/search or not yet scrolled into view), WHEN the selection bar
  renders, THEN it shows **"N נבחרו"** (N selected) counting the FULL
  selection, not just the currently visible rows.
- GIVEN the selection bar is showing, WHEN the user activates the clear
  affordance, THEN the full selection is cleared (today's console.js basis:
  `deselectRow()`).
- GIVEN a bulk action is triggered, WHEN it executes, THEN it applies to the
  **full selection** — never only the rows currently visible/rendered.
- **Today's basis (kept, extended):** console.js selection is built on
  Tabulator `selectableRows` + a `rowSelection` column; `getSelectedData()`
  reads `application_id`s; the bulk bar is shown only while rows are selected
  via a `rowSelectionChanged → refreshBulkBar` listener. This contract keeps
  that mechanism and extends it to persist across progressive loads and
  filter/search changes (which the once-load-only current model does not yet
  need to handle).

## Inline edit

Inline-editable fields: **`stage`**, **`owner`**, **`role_title`**.

- GIVEN a field is inline-editable, WHEN the user edits it either inline in
  the table OR in the drawer, THEN the SAME commit grammar applies in both
  places: an explicit **✓ confirm / ✕ cancel**, per field (not per row, not
  per form) — inline and drawer share ONE grammar.
- GIVEN a field commit is in flight, WHEN the request is pending, THEN the
  control shows a **busy state in place** (in-control busy indicator, not a
  full-table spinner).
- GIVEN a field commit succeeds, WHEN the response returns, THEN the UI
  **waits for the server response before updating** (wait-not-optimistic) —
  **EXCEPT** for `stage`, which is the one documented exception below.
- GIVEN the `stage` field is changed via the drawer, WHEN the change is
  submitted (`onStageChange → POST /stage`), THEN the table's stage column is
  updated **optimistically** via `table.updateData` **without a full reload**
  — this existing optimistic sync is explicitly **kept and documented**, not
  replaced by wait-not-optimistic.
- GIVEN a background refresh occurs silently (e.g. a poll or a sibling
  update), WHEN an edit form (inline or drawer) is currently open with
  unsaved keystrokes, THEN the refresh must **NOT** yank the open edit form
  out from under the user mid-typing (existing console.js rule, carried
  forward).
- **Today's basis:** `owner` = "take ownership" (`onTakeOwner → POST /owner`)
  is wait-not-optimistic already. Record edit (`enterRecordEdit`/
  `exitRecordEdit → POST /fields`) is a per-field edit form; the mid-typing
  protection above applies to it directly.

## Bulk actions

The bulk bar exposes exactly **4 actions**:

1. **branch-add** (exists today)
2. **stage-change** (new)
3. **take-ownership** (new)
4. **branch-remove** (new, destructive)

- GIVEN the bulk bar is visible, WHEN the user activates **branch-add**, THEN
  it behaves as it does today: **add-only**, reporting a three-outcome result
  — `added` / `already` / `skipped` — where "already linked" is treated as
  the requested end-state, NOT a failure.
- GIVEN the bulk bar is visible, WHEN the user activates **branch-remove**,
  THEN it is treated as the **new destructive action**, gated by the confirm
  ladder (see Confirm ladder below; adoption tied to PLT-085/086 in the Table
  inventory).
- GIVEN any bulk/multi-item action executes, WHEN the server responds, THEN
  per-item outcomes are reported as one of **done / already / skipped /
  failed**.
- GIVEN a bulk action partially fails, WHEN the outcome report renders, THEN
  **failed** items **keep their rows selected** (so the user can retry just
  the failures) — items in `done`/`already`/`skipped` states are not forced
  to stay selected.
- **Generalization note:** this done/already/skipped/failed pattern
  generalizes the existing bulk-add three-outcome pattern
  (`added_ids`/`already_ids`/`skipped_ids`) from console.js's `onBulkAdd`,
  extended with a `failed` outcome for the new destructive/multi-field
  actions.

## Assign

Assign has **three distinct semantics** depending on the table — they are not
interchangeable:

- GIVEN the table is **console** or **hil_queue**, WHEN a user assigns, THEN
  it is a **candidate → branch** link: multi-select, **UI max 4** branches
  (extra checkboxes disabled once 4 are picked), **ACTIVE branches only**
  (endpoint rejects inactive branches), and today scoped to **UNASSIGNED
  candidates** only.
  - **Today's basis:** `openAssign`/`enforceMaxFour`/`submitAssign` →
    `POST /hil/assign`; a 303 redirect (via `redirect:"manual"` opaque
    response) means success; 400/409 return a JSON error.
- GIVEN the table is **admin_users**, WHEN a user assigns, THEN it is a
  **user → role + branches** assignment — a different shape than
  candidate→branch, not to be confused with it.
- GIVEN the table is **merge_queue**, WHEN a user acts on a row, THEN that
  action is a **person-pair merge decision**, NOT an assign — bulk actions
  stay **OFF** for `merge_queue` (no bulk bar on this table).

## Progressive loading + server search

- GIVEN a table view loads, WHEN the user scrolls, THEN there is **NO
  pagination** — rows load via **progressive scroll loading** instead.
- GIVEN the user searches or filters, WHEN the query changes, THEN
  search/filter is executed **server-side** (not client in-memory), so
  off-page/off-screen candidates stay findable.
- GIVEN counts are displayed (e.g. per-stage totals), WHEN they render, THEN
  they come from a **dedicated exact-counts endpoint**
  (`/api/candidates/counts`, PLT-082) rather than being derived client-side.
- **Replacement note:** today the operator pool loads **once** client-side
  (`GET /api/candidates`) and counts are derived from the full in-memory pool
  (`refreshCounts`); this once-load model is being **REPLACED** by the
  server-side progressive load + server counts described above (PLT-082 for
  the server endpoint, PLT-083 for console client wiring). Hunt
  (`POST /api/hunt`) is already server-ranked today and is unaffected by this
  replacement.

## Concurrency

- GIVEN a user submits a write to a row, WHEN the request is sent, THEN it
  carries the row's `updated_at` value.
- GIVEN the server detects the row's `updated_at` is stale (someone else
  wrote to it first), WHEN it rejects the write, THEN it returns **409**,
  the row **refreshes** to the latest server state, and an **inline notice**
  tells the user to re-apply their change.
- GIVEN a stale write is rejected, WHEN the row refreshes, THEN there is
  **no silent overwrite** — the user's rejected change is never silently
  discarded without the inline notice, and the server's data is never
  silently overwritten by the stale client write.

## Confirm ladder

Three rungs, by destructiveness:

1. **Normal edit** → explicit **✓ / ✕** (see Inline edit).
2. **Destructive single-row action** → a **confirm dialog**.
3. **Destructive bulk action** (`branch-remove`, terminal-negative `stage`
   changes) → a dialog that shows the **exact count** of affected rows AND
   requires **typed-count confirmation** (the user types the number to
   proceed) before the action executes.

- GIVEN a normal (non-destructive) edit, WHEN the user commits it, THEN it
  takes effect on the explicit **✓** with no extra dialog (rung 1).
- GIVEN a destructive **single-row** action, WHEN the user triggers it, THEN a
  **confirm dialog** appears and the action executes only on confirm (rung 2).
- GIVEN a destructive bulk action targets N rows, WHEN the confirm dialog
  opens, THEN it displays the exact count N and blocks submission until the
  user types N to confirm (rung 3).

---

## Table inventory (adopt/exempt)

All 8 known table surfaces, mapped to their adoption task id:

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

**Target: 0 exemptions.** Legacy pages are **kept and adopt** the `pds-table`
component rather than being retired — the accepted cost is that Tabulator
(433 KB) lands on trivial read-only pages, and duplicated console-vs-legacy
surfaces stay alive. Any exemption row added in the future requires a written
reason in this table; there are currently **none**.

Related implementation tasks (for traceability, not adoption targets
themselves): PLT-080 pds-table core · PLT-081 inline-edit module · PLT-082
server progressive-load + search + counts · PLT-083 console client wiring ·
PLT-085 bulk endpoints · PLT-086 bulk bar UI · **PLT-089** close-out audit
(reconciles this document to as-built once PLT-080..088 land).

## Changelog

| Date | Change |
|---|---|
| 2026-07-19 | Initial contract authored from PLT-077 decisions + current `console.js` behaviour (PLT-079). PLT-089 will reconcile this document to as-built once adoption tasks land. |

## Open questions

None open — all PLT-077 decisions confirmed 2026-07-19.

The **hunt double-fire bug** (Epic 0 flag #2 — Enter in a hunt field fires
both the panel keydown AND the form submit) is a known bug, not an open
decision: it closes via console adoption (PLT-084) and is tracked there as a
verification case.
