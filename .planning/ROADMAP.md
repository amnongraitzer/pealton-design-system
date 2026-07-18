# Roadmap: Pealton Design System

## Overview

The design system was built in six phases (PLT-055 → PLT-060), each adding one
layer of the shared visual language: tokens → font → components → forms/tables →
overlays → Jinja macros. All six are **complete and shipped in the package** as
of commit `b84c5a2`. This roadmap was reconstructed from git history and the
README during GSD initialization; it records delivered work as done, and lists
the README's future work as a not-started milestone (not active scope).

## Milestones

- ✅ **v1.0 Design System** — Phases 1–6 (shipped 2026-07-18, PLT-055→060)
- 📋 **v1.1 Adoption & polish** — Phases 7–9 (planned, from README notes)

## Phases

- [x] **Phase 1: Tokens** — canonical `:root` token layer (PLT-055)
- [x] **Phase 2: Typography** — self-hosted Rubik font (PLT-056)
- [x] **Phase 3: Core components** — button, chip, status pills, card (PLT-057)
- [x] **Phase 4: Forms & tables** — form controls + Tabulator theme (PLT-058)
- [x] **Phase 5: Overlays** — native `<dialog>` modal + drawer (PLT-059)
- [x] **Phase 6: Jinja macros** — shared markup + macro tests (PLT-060)
- [ ] **Phase 7: Distribution wiring** — wire the DS into both apps (PLT-061)
- [ ] **Phase 8: HR pilot + rollout** — pilot then legacy rollout (PLT-062–067)
- [ ] **Phase 9: Icons** — icon set (PLT-068–069)

## Phase Details

<details>
<summary>✅ v1.0 Design System (Phases 1–6) — SHIPPED 2026-07-18</summary>

### Phase 1: Tokens
**Goal**: One canonical token layer both apps can rely on.
**Requirements**: TOK-01
**Success Criteria** (what must be TRUE):
  1. A single `:root` defines colour, spacing, type, radius, z-index, shadow.
  2. Palette is Monday-inspired, light scale only.
**Plans**: 1 plan

Plans:
- [x] 01-01: Package skeleton + canonical token layer (PLT-055)

### Phase 2: Typography
**Goal**: Both apps render in Rubik, offline, with no silent OS fallback.
**Depends on**: Phase 1
**Requirements**: FONT-01, FONT-02
**Success Criteria**:
  1. Rubik ships self-hosted in the package (Hebrew+Latin, weight 300–900).
  2. No CDN; loads offline.
  3. The silent Segoe-UI fallback is removed.
**Plans**: 1 plan

Plans:
- [x] 02-01: Self-host Rubik `@font-face` + subsets (PLT-056)

### Phase 3: Core components
**Goal**: The signature Monday components exist as CSS.
**Depends on**: Phases 1–2
**Requirements**: COMP-01, COMP-02, COMP-03, COMP-04
**Success Criteria**:
  1. Button (primary/ghost/danger, sizes, disabled) renders.
  2. The five status/stage pills render, including soft variant.
  3. Chip and card render.
**Plans**: 1 plan

Plans:
- [x] 03-01: button, chip, status-pill, card (PLT-057)

### Phase 4: Forms & tables
**Goal**: Form controls and a themed data table.
**Depends on**: Phase 3
**Requirements**: FORM-01, FORM-02, TABLE-01
**Success Criteria**:
  1. Input/select/textarea/checkbox render.
  2. Field wrapper shows label, help, required marker, and invalid state.
  3. Tabulator tables match the DS theme.
**Plans**: 1 plan

Plans:
- [x] 04-01: form controls + Tabulator theme (PLT-058)

### Phase 5: Overlays
**Goal**: Modal and drawer without an overlay library.
**Depends on**: Phase 4
**Requirements**: OVL-01
**Success Criteria**:
  1. Modal and drawer built on native `<dialog>`.
  2. `pds.js` opens/closes them via `data-pds-*` hooks.
**Plans**: 1 plan

Plans:
- [x] 05-01: modal + drawer (native `<dialog>`) + pds.js (PLT-059)

### Phase 6: Jinja macros
**Goal**: Shared markup so apps stop copy-pasting component HTML.
**Depends on**: Phases 1–5
**Requirements**: MACRO-01, MACRO-02, TEST-01
**Success Criteria**:
  1. A macro exists for every component and emits the class its CSS styles.
  2. All macro text (plain + `{% call %}`) is HTML-escaped.
  3. `python -m pytest` renders every macro and passes.
**Plans**: 1 plan

Plans:
- [x] 06-01: Jinja macros + macro tests (PLT-060)

</details>

### 📋 v1.1 Adoption & polish (Planned)

**Milestone Goal:** Get the DS actually adopted by both apps, then round it out.
These phases come from the README's "later phases" note — recorded for
traceability, **not** active scope. Plan them with `/gsd-plan-phase` (or
`/gsd-quick`) when you choose to start.

#### Phase 7: Distribution wiring
**Goal**: The DS is wired into both consuming apps' templates and static mounts.
**Depends on**: Phase 6
**Requirements**: DIST-04
**Success Criteria**:
  1. Both apps load the DS stylesheets, font, and `pds.js`.
  2. Both apps import and use the Jinja macros.
**Plans**: TBD

#### Phase 8: HR pilot + rollout
**Goal**: Pilot the DS in the HR app, then roll it across legacy screens.
**Depends on**: Phase 7
**Requirements**: PILOT-01
**Success Criteria**:
  1. HR pilot screens use the DS end to end.
  2. Legacy screens migrated to DS components.
**Plans**: TBD

#### Phase 9: Icons
**Goal**: A shared icon set in the DS.
**Depends on**: Phase 7
**Requirements**: ICON-01
**Success Criteria**:
  1. Icons ship in the package and are usable via macro/markup.
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Tokens | v1.0 | 1/1 | Complete | 2026-07-18 |
| 2. Typography | v1.0 | 1/1 | Complete | 2026-07-18 |
| 3. Core components | v1.0 | 1/1 | Complete | 2026-07-18 |
| 4. Forms & tables | v1.0 | 1/1 | Complete | 2026-07-18 |
| 5. Overlays | v1.0 | 1/1 | Complete | 2026-07-18 |
| 6. Jinja macros | v1.0 | 1/1 | Complete | 2026-07-18 |
| 7. Distribution wiring | v1.1 | 0/TBD | Not started | - |
| 8. HR pilot + rollout | v1.1 | 0/TBD | Not started | - |
| 9. Icons | v1.1 | 0/TBD | Not started | - |
