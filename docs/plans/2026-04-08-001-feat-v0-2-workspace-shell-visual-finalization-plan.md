---
title: FerrumDB V0.2 Workspace Shell Visual Finalization
type: feat
status: completed
date: 2026-04-08
origin: docs/brainstorms/v0.2-requirements.md
---

# FerrumDB V0.2 Workspace Shell Visual Finalization

## Overview

This plan turns the existing FerrumDB shell and Connections screen into a more credible, disciplined workspace without expanding into real database session workflows. The implementation stays front-end focused, preserves the current connection-management backend, and treats honest affordances as part of the release goal rather than as a polish afterthought.

## Problem Frame

The current app already has a shell, search, connection cards, and modal CRUD flows, but the screen still presents more like a prototype management panel than a trustworthy database workspace. Some controls also imply navigation or actions that are not yet meaningfully implemented. This plan improves hierarchy, shell cohesion, and connection scanning while keeping product scope aligned with the origin document (`docs/brainstorms/v0.2-requirements.md`).

## Requirements Trace

- R1. Make the Connections experience feel like part of a coherent desktop workspace.
- R2. Add restrained workspace framing that improves orientation without depending on downstream modules.
- R3. Standardize the shell across sidebar, header, and content surfaces.
- R4. Improve hierarchy between page identity, controls, and the connection collection.
- R5. Reframe cards as workspace objects instead of form records.
- R6. Improve at-a-glance scanning for environment, host context, and database type.
- R7. Increase professionalism through disciplined interface decisions rather than added scope.
- R8. Avoid implying unbuilt workflows are functional.
- R9. Bring loading, empty, and no-results states into the same visual language.
- R10. Keep future-facing shell elements clearly inactive, non-primary, or non-committal.

## Scope Boundaries

- No new Tauri commands, storage schema changes, or backend connection lifecycle work.
- No routed multi-page application architecture for SQL Editor, Data Browser, ER Diagram, History, or Settings.
- No real query execution, session entry, or live connection-status flows.
- No rewrite of connection CRUD behavior beyond the UI affordances that expose it.

## Context & Research

### Relevant Code and Patterns

- `src/App.tsx` already owns page-level search state, modal orchestration, and the populated/empty/no-results branching for the Connections page.
- `src/components/layout/Layout.tsx` composes the shell from `Sidebar`, `Header`, and `MainContent`; its current local `activeNav` state creates misleading fake navigation for unbuilt modules.
- `src/components/layout/Header.tsx` currently includes static environment tabs and an action cluster; this is the main place where hierarchy and honest-affordance issues surface.
- `src/components/connections/ConnectionCard.tsx`, `ConnectionGrid.tsx`, `EnvironmentBadge.tsx`, and `EmptyState.tsx` already isolate the main card and state presentation layer, making V0.2 achievable without touching backend code.
- `tailwind.config.js`, `src/index.css`, `stitch/connections_dashboard/code.html`, and `stitch/syntactic_flux/DESIGN.md` define the existing design tokens and target visual direction to follow rather than reinvent.

### Institutional Learnings

- `docs/solutions/security-issues/connection-security-validation-fix-2026-04-08.md` reinforces that connection UIs should avoid exposing sensitive fields and should preserve clear, validated metadata boundaries. The V0.2 visual pass should not reintroduce password exposure or imply unsafe session behavior while improving card density.

### External References

- None. Local code patterns plus the existing `stitch/` design artifacts provide sufficient grounding for this plan.

## Key Technical Decisions

- Reuse the existing shell component structure instead of introducing a routing system or a new layout abstraction. This keeps V0.2 aligned with the “visual finalization” scope and avoids architecture churn.
- Treat “honest affordances” as a primary requirement. Controls that currently look active without meaningful behavior should either become real within the Connections page scope or become visibly non-primary/inactive.
- Implement real environment filtering if the filter control remains visible. A decorative filter chip row would undermine the trust goal more than omitting it.
- Keep page-specific controls page-owned. The shared `Header` shell should expose slots or props for Connections-specific framing/filter controls rather than hardcoding database-manager controls as a universal shell default.
- Remove or demote faux-primary card actions that imply session/query workflows. Until real workspace entry exists, card actions should bias toward management, inspection, and selection semantics.
- Remove the current hidden whole-card edit affordance. A card should not behave like an invisible edit button; any primary interaction must be explicit, non-destructive, and legible from the UI.
- Add a minimal frontend component-test harness as part of the plan. The repo currently has no frontend test setup, and V0.2 changes are almost entirely presentational-behavioral, so lightweight component coverage is the most reliable way to protect honest-affordance and state rules.
- Separate initial page bootstrap loading from mutation-in-flight UI. The current global `isLoading` model in `src/contexts/ConnectionsContext.tsx` would otherwise turn create, update, and delete actions into full-page loading regressions that fight the V0.2 trust goal.

## Open Questions

### Resolved During Planning

- What is the smallest shell framing set that improves credibility without creating interaction debt?
  Resolution: add restrained workspace framing inside the existing page and header structure, limited to contextual page identity and clearly non-committal future-facing chrome rather than new navigable workflows.
- Which current card actions should stay prominent, be demoted, or be reframed?
  Resolution: demote CRUD controls to clearly secondary management affordances and avoid a primary button that suggests real session/query capability before that flow exists.
- Which component patterns should be standardized first?
  Resolution: standardize shell spacing, control emphasis, and page hierarchy in `Layout`, `Header`, `Sidebar`, and `App` before refining card styling, so the screen reads as one product.

### Deferred to Implementation

- Exact copy, icon treatment, and spacing values should be finalized against live screenshots during implementation, not locked in by the plan.
- If a small amount of command-palette or workspace-path chrome still feels too suggestive in the live build, implementation should bias toward removing it rather than preserving decorative depth.

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

| Surface | Current issue | V0.2 direction |
|---|---|---|
| Sidebar | Non-Connections modules can be clicked and highlighted despite no page transition | Keep Connections as the only clearly active destination; render future modules as visually present but non-primary and non-misleading |
| Header controls | Search, tabs, and action cluster compete for attention; some controls are decorative | Keep only controls that are real or clearly passive; organize them around page identity, real filtering, and a single primary action |
| Page intro | The screen jumps straight from shell chrome into cards | Add a restrained page-intro layer that improves workspace orientation and scan order |
| Connection cards | Cards read as CRUD records and include a faux-primary “Execute” action | Reframe cards around trustworthy metadata, clearer hierarchy, and honest secondary management affordances |
| Empty/loading/no-results states | These states feel separate from the main visual language | Align them with the same shell and page hierarchy so state changes feel intentional rather than fallback-like |

## Implementation Units

- [x] **Unit 1: Add Frontend UI Verification Harness**

**Goal:** Establish minimal frontend test infrastructure so V0.2 component and page-state behavior can be verified without inventing a large testing platform.

**Requirements:** Supports R7, R8, R9, R10

**Dependencies:** None

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Modify: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/test/mocks/tauri.ts`
- Create: `src/test/render.tsx`

**Approach:**
- Add the smallest viable React component-testing setup, focused on behavior and affordance states rather than snapshot-heavy visual testing.
- Keep the setup narrow: enough to test shell honesty, page state transitions, and card affordances without introducing a broad testing abstraction layer.
- Include a reusable mock path for `@tauri-apps/api/core` calls so App-level and context-aware tests can exercise `ConnectionsProvider` behavior without ad hoc per-test runtime shims.

**Patterns to follow:**
- Existing Vite + React project configuration in `vite.config.ts`
- Current path alias convention already used across `src/`

**Test scenarios:**
- Test expectation: none -- this unit creates the harness that later feature-bearing units will use.

**Verification:**
- The repo can host component/page tests for `src/` without changing application runtime behavior.

- [x] **Unit 2: Make The Shell Honest And Cohesive**

**Goal:** Refine the shared shell so it feels consistent and stops implying functionality that does not exist yet.

**Requirements:** R1, R2, R3, R7, R8, R10

**Dependencies:** Unit 1

**Files:**
- Modify: `src/components/layout/Layout.tsx`
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/components/layout/MainContent.tsx`
- Modify: `src/index.css`
- Test: `src/components/layout/__tests__/Sidebar.test.tsx`
- Test: `src/components/layout/__tests__/Header.test.tsx`

**Approach:**
- Remove or reframe local shell interactions that produce fake navigation states, especially the ability to highlight non-Connections modules with no content change.
- Tighten shell-level typography, spacing, border, and surface rules so sidebar, header, and content read as one composed application.
- Refactor `Header` toward page-provided controls so Connections-specific filters and framing do not become permanent shell defaults for future modules.
- Keep any future-facing controls visually restrained and explicitly secondary so the shell suggests product depth without faking shipped workflows.

**Patterns to follow:**
- Existing shell composition in `src/components/layout/Layout.tsx`
- Design direction from `stitch/connections_dashboard/code.html`
- Token and typography guidance in `stitch/syntactic_flux/DESIGN.md`

**Test scenarios:**
- Happy path: rendering the shell shows Connections as the only clearly active primary destination.
- Edge case: non-Connections navigation items remain visible but do not create misleading active-page state when interacted with.
- Edge case: header utility chrome that is intentionally passive is styled in a way that does not match the primary action affordance.
- Integration: rendering the shell around the Connections page preserves current page content while applying the refined header/sidebar structure.

**Verification:**
- A reviewer can distinguish active, passive, and future-facing shell elements without guessing which modules are implemented.
- The shared header can host Connections-specific controls without implying that the same control set belongs to every future module.

- [x] **Unit 3: Rebuild Connections Page Hierarchy And Real Filters**

**Goal:** Establish a clearer Connections page scan path from page context to controls to inventory, while ensuring any visible filters are real within V0.2 scope.

**Requirements:** R2, R4, R6, R7, R8

**Dependencies:** Unit 2

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/layout/MainContent.tsx`
- Test: `src/__tests__/App.connections-page.test.tsx`

**Approach:**
- Introduce a restrained page-intro layer for workspace context and section identity inside the Connections screen.
- Either wire the existing environment filter affordance to actual connection filtering or remove it; the preferred path is to make it real because the data already exists in `Connection.environment`.
- Keep search, filter, and primary action ordering stable so no-results behavior reflects the active control state rather than feeling disconnected.

**Execution note:** Implement the page-state tests first so filter and no-results behavior stay honest while the hierarchy is being reworked.

**Patterns to follow:**
- Existing search-state ownership in `src/App.tsx`
- Connection data shape in `src/types/connection.ts`
- Current modal/control orchestration in `src/App.tsx`

**Test scenarios:**
- Happy path: with mixed environments present, selecting a filter shows only matching connections while preserving the page header and primary action.
- Happy path: typing a search query filters by name, host, database, or tag within the currently visible inventory.
- Edge case: connections with `environment` unset remain visible in the default inventory and are not silently dropped when environment filters are introduced.
- Edge case: selecting a filter with no matches shows a no-results state that references the active filter/search context rather than falling back to the empty-state copy.
- Edge case: clearing search and filter state restores the full inventory without breaking modal open flows.
- Integration: the page intro, search input, filter controls, and connection grid render in a consistent order across loading and populated states.

**Verification:**
- The Connections screen has a clear visual and interaction hierarchy, and every visible filtering control changes the displayed inventory or is intentionally absent.

- [x] **Unit 4: Reframe Connection Cards And State Surfaces**

**Goal:** Make cards, grid density, and page states feel like part of a trustworthy workspace instead of a raw CRUD dashboard.

**Requirements:** R5, R6, R7, R8, R9, R10

**Dependencies:** Unit 3

**Files:**
- Modify: `src/components/connections/ConnectionCard.tsx`
- Modify: `src/components/connections/ConnectionGrid.tsx`
- Modify: `src/components/connections/EnvironmentBadge.tsx`
- Modify: `src/components/connections/EmptyState.tsx`
- Modify: `src/App.tsx`
- Modify: `src/contexts/ConnectionsContext.tsx`
- Test: `src/__tests__/App.connections-states.test.tsx`
- Test: `src/components/connections/__tests__/ConnectionCard.test.tsx`
- Test: `src/components/connections/__tests__/ConnectionGrid.test.tsx`
- Test: `src/components/connections/__tests__/EmptyState.test.tsx`
- Test: `src/contexts/__tests__/ConnectionsContext.test.tsx`

**Approach:**
- Shift card emphasis toward stable operational metadata: name, host context, database type, and environment.
- Remove or visually demote actions that imply unbuilt workflows, while keeping connection management actions accessible and clearly secondary.
- Make the card's primary interaction explicit; avoid a full-card hidden edit action unless the UI visibly labels the surface as inspect/select rather than edit.
- Bring error, loading, empty, and no-results states into the same surface language so the screen keeps its composure when the data set changes.
- Refine loading state ownership so initial page bootstrap can still use a page-level loading treatment while create/update/delete mutations keep the existing shell and inventory visible, with pending feedback localized to the active modal or action surface.

**Patterns to follow:**
- Existing card composition in `src/components/connections/ConnectionCard.tsx`
- Existing environment semantics in `src/components/connections/EnvironmentBadge.tsx`
- Design cues from `stitch/connections_dashboard/code.html`

**Test scenarios:**
- Happy path: a production connection card visually emphasizes environment and host metadata without exposing sensitive fields.
- Happy path: a connection card shows database type and management affordances in a way that does not present an unimplemented primary workflow.
- Edge case: clicking the body of a card does not trigger a hidden destructive or management action unless the UI explicitly presents that behavior.
- Edge case: long connection names or host values truncate cleanly without collapsing card alignment.
- Edge case: connections without optional database names still render a stable card layout.
- Error path: an initial `list_connections` failure renders a trustworthy error state rather than falling back to the generic empty-state experience.
- Error path: when `ConnectionsContext` is loading, the page uses a composed loading presentation rather than a detached spinner-only experience.
- Integration: creating, updating, or deleting a connection keeps the page shell and current inventory visible while pending UI remains localized to the active modal or confirmation surface.
- Integration: empty inventory, filtered no-results, and populated grid states all preserve the same overall page hierarchy and tone.

**Verification:**
- Card scanning is calmer and faster, and state transitions no longer make the screen feel like it dropped into a fallback UI.

## System-Wide Impact

- **Interaction graph:** `src/App.tsx` remains the owner of search/filter/modal state; layout components become more presentationally truthful, while connection components stay data-driven from `ConnectionsContext`.
- **Error propagation:** No new backend error surfaces are introduced, but the UI must distinguish bootstrap load failures from a genuinely empty inventory. UI-only state changes should continue to fail locally without changing Tauri command behavior.
- **State lifecycle risks:** Search, environment filters, modal open state, bootstrap loading, and mutation-pending branches must not produce contradictory page states. In particular, filter and search resets should not desynchronize the grid from the page header, and create/update/delete flows should not collapse the page into a bootstrap-style loading state.
- **API surface parity:** Tauri commands in `src-tauri/src/commands/connection.rs` and storage semantics remain unchanged; V0.2 should not require response-shape changes.
- **Integration coverage:** Render-level tests should cover mixed-environment inventories, passive shell controls, filtered no-results states, initial load failure presentation, and the absence of faux-primary or hidden card actions.
- **Unchanged invariants:** Connection CRUD remains driven by `ConnectionsContext`; password masking and validation guarantees from the existing connection-management flow remain intact.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| The design pass could drift into fake depth by preserving decorative controls that look actionable | Prefer removal or passive treatment over decorative interactivity; cover honest-affordance rules in component tests |
| Matching the `stitch/` aesthetic too literally could reduce clarity in the live app | Use the design files as direction for hierarchy and tone, while preserving working search/modal flows already present in `src/App.tsx` |
| Adding test infrastructure could become disproportionate to the feature | Keep the harness minimal and scoped to React component behavior only |
| Card changes could accidentally weaken current management flows | Preserve edit/delete access paths and verify modal orchestration still works after card/action reframing |

## Documentation / Operational Notes

- Update any visible version or release-label copy only if it can be done consistently in one place; avoid scattering version strings during implementation.
- If the final visual pass establishes durable shell rules, capture them later in a follow-up design-system or solution document rather than bloating the implementation PR.

## Sources & References

- Origin document: `docs/brainstorms/v0.2-requirements.md`
- Roadmap context: `version-plan.md`
- Related code: `src/App.tsx`
- Related code: `src/components/layout/Layout.tsx`
- Related code: `src/components/layout/Header.tsx`
- Related code: `src/components/layout/Sidebar.tsx`
- Related code: `src/components/connections/ConnectionCard.tsx`
- Design reference: `stitch/connections_dashboard/code.html`
- Design reference: `stitch/syntactic_flux/DESIGN.md`
- Institutional learning: `docs/solutions/security-issues/connection-security-validation-fix-2026-04-08.md`
