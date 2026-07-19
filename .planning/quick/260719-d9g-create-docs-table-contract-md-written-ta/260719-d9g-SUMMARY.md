---
phase: quick-260719-d9g
plan: 01
subsystem: docs
tags: [table-contract, tabulator, epic-3, specification]

# Dependency graph
requires: []
provides:
  - "docs/TABLE-CONTRACT.md — the single written GIVEN/WHEN/THEN behaviour spec for Epic 3 table adoption"
  - "8-surface table inventory mapped to adoption task ids PLT-084..088"
affects: [PLT-080, PLT-081, PLT-082, PLT-083, PLT-084, PLT-085, PLT-086, PLT-087, PLT-088, PLT-089]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "GIVEN/WHEN/THEN behaviour statements for spec documents (individually testable)"

key-files:
  created: [docs/TABLE-CONTRACT.md]
  modified: []

key-decisions:
  - "Contract drawn exclusively from INPUTS.md (PLT-077 decisions + current console.js) — no re-fetch of BACKLOG.md or console.js source"
  - "Stage field keeps its existing optimistic table.updateData sync as the documented exception to the wait-not-optimistic default for owner/role_title"
  - "0-exemption target for the 8-surface table inventory; legacy pages are kept and adopt pds-table rather than being retired"

patterns-established:
  - "Every behaviour statement in this document is phrased GIVEN/WHEN/THEN so it maps 1:1 to a test case"

requirements-completed: [PLT-079]

# Metrics
duration: 6min
completed: 2026-07-19
---

# Quick Task 260719-d9g: Table Behaviour Contract Summary

**Wrote docs/TABLE-CONTRACT.md — the authoritative GIVEN/WHEN/THEN behaviour spec for Epic 3's table rollout, mapping all 8 legacy/console table surfaces to adoption tasks PLT-084..088.**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-07-19T09:31:00Z (approx)
- **Completed:** 2026-07-19T09:37:07Z
- **Tasks:** 2 completed
- **Files modified:** 1 (created)

## Accomplishments
- Documented all 9 core behaviour sections (States, Keyboard, Selection, Inline edit,
  Bulk actions, Assign, Progressive loading + server search, Concurrency, Confirm ladder)
  as individually testable GIVEN/WHEN/THEN bullets.
- Recorded the stage-field optimistic-sync exception precisely: `stage` keeps its
  existing `table.updateData` optimistic sync; `owner`/`role_title` and everything
  else is wait-not-optimistic.
- Mapped all 8 known table surfaces to adoption task ids (PLT-084..088) with an
  explicit 0-exemption target and the "written reason required" rule for future
  exemptions.
- Added Table inventory, Changelog (dated 2026-07-19), and Open questions sections;
  ran the Definition-of-Done self-check from Task 2 against the finished document —
  every checklist item traces to a GIVEN/WHEN/THEN statement.
- Noted real-estate app tables as out of scope (future adopters only) and PLT-089 as
  the later close-out reconciler.

## Task Commits

Each task was written into the same file; both tasks were committed as a single
atomic commit since the deliverable is one cohesive document (no intermediate
partial state was meaningful to commit separately):

1. **Task 1 + Task 2: Full contract (behaviour sections + inventory/changelog/open questions)** - `a4f424d` (docs)

## Files Created/Modified
- `docs/TABLE-CONTRACT.md` - 244-line GIVEN/WHEN/THEN behaviour contract for Epic 3;
  covers States, Keyboard, Selection, Inline edit, Bulk actions, Assign, Progressive
  loading + server search, Concurrency, Confirm ladder, Table inventory, Changelog,
  Open questions.

## Decisions Made
- Combined Task 1 and Task 2 into a single commit — both tasks write to the same
  file and the document is only meaningful/reviewable as a complete whole; an
  intermediate commit with 9 of 12 sections would not be a coherent artifact.
- Followed INPUTS.md's exact inventory table and section list verbatim rather than
  reinterpreting; no new information was introduced beyond what the plan specified.

## Deviations from Plan

None - plan executed exactly as written. Both tasks' automated `<verify>` checks
pass, and the plan's overall `<verification>` block passes (deliverable exists,
`git status --porcelain` shows only `docs/TABLE-CONTRACT.md` as a tracked-file
change, all 12 section headings present, no code/build/dependency files touched).

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `docs/TABLE-CONTRACT.md` is now the single reference for all downstream Epic 3
  adoption tasks (PLT-080 through PLT-088) — implementers no longer need to
  re-derive behaviour decisions from BACKLOG.md or console.js.
- PLT-089 (close-out audit) has a concrete document to reconcile against once
  adoption tasks land.
- No blockers.

---
*Phase: quick-260719-d9g*
*Completed: 2026-07-19*
