# Medis Application Architecture

This document explains the app's core parts, how they connect, and what must stay true when making future changes.

## Purpose

Medis is a browser-based family tree app that:

- loads people and relationship data from Supabase,
- builds a dynamic visual genealogy graph,
- allows editing people and relationships,
- keeps data consistent when multiple sessions/users make changes.

## High-Level Composition

The runtime structure is:

1. `src/App.tsx`

- Root composition.
- Wraps the app with `AuthGate` and `TreeDataProvider`.

2. `src/components/common/AuthGate.tsx`

- Handles app-level authentication gate.
- Stores authenticated state in session storage.
- Validates password through Supabase RPC (`medis_is_authorized`) before unlocking UI.
- Applies progressive cooldown after failed attempts to slow password guessing.

3. `src/providers/TreeDataProvider.tsx`

- Central data layer and mutation API for UI components.
- Loads and stores `people`, `marriages`, `parent_child` in React state.
- Exposes mutation methods (`addPerson`, `updatePerson`, `deletePerson`, etc.).
- Performs conflict-safe updates and refreshes.
- Subscribes to realtime DB changes and refreshes local cache.
- Applies stale-session guard (reload after long inactivity).

4. `src/components/layout/AppLayout.tsx`

- Main shell and state orchestration (selection/focus/highlight/modal visibility).
- Connects top-level UI controls to tree and side panel behavior.

5. `src/components/tree/TreeView.tsx`

- React Flow surface.
- Receives nodes/edges from `useTreeLayout` and handles viewport interactions.
- Keeps zoom/fit controls pinned to top-left across desktop and mobile.

6. `src/components/tree/useTreeLayout.ts`

- Core dynamic tree builder.
- Converts domain entities (people, marriages, parent-child edges) into positioned graph nodes/edges.
- Handles sorting, grouping, generation layering, collision resolution, and fallback placement.

7. `src/components/person/*`

- Person editing and relationship editing UI.
- `PersonPanel` + details form + relationship management controls.
- Create modal can establish parent/child links immediately at person creation.
- Relationship editor supports spouse status (`married`, `divorced`, `widowed`).

8. `src/components/common/FamilyMembersModal.tsx`

- Tabular family overview.
- Sortable columns and quick edit entry point.
- Full export actions (CSV/PDF) including person core fields and associated relationships.

9. `src/lib/supabase.ts`

- Supabase client factory.
- Attaches request-level auth header (`x-medis-password`) from authenticated session.

10. `src/lib/inputValidation.ts`

- Shared input normalization and validation utilities.
- Enforces accepted partial date formats and normalizes blank/unknown date semantics.

11. `supabase/migration.sql`

- Schema and policy baseline.
- Includes app auth function and RLS policies tied to request header validation.

12. `supabase/data-quality-hardening-existing-db.sql`

- Non-destructive constraints for existing populated databases (`NOT VALID` checks).

## Data Model

Primary tables:

- `people`
- `marriages`
- `parent_child`

Marriage semantics:

- `marriages.relationship_status` indicates current/former relationship type.
- `divorce_date` can still hold historical date details when relevant.

Graph semantics:

- Person node = one `people` row.
- Marriage = spouse link between two people.
- Parent-child = directional genealogical edge.

## Dynamic Tree Build (Critical)

This is the most important architecture rule for future changes.

The tree must always be built from current live data, never from hardcoded assumptions or static placements.

### Required invariants

1. Every person in loaded data must end up with a visible node position.

- No hidden or silently dropped person nodes.
- If primary layout logic misses a node, fallback placement must still place it.

2. Layout must be deterministic from input data.

- Same input => same node ordering/positions (within algorithm rules).
- Deterministic sorting is required before layout operations.

3. Relationship edits must immediately affect visual topology.

- Adding/removing parent-child or marriage links must trigger rebuild and produce correct graph updates.

4. Multi-component families must be handled.

- Isolated or weakly connected subgraphs must still render in a reasonable anchored location.

5. Collision avoidance is mandatory.

- Nodes in same generation row cannot overlap.
- Family clusters must preserve readability.

6. Generation consistency must be preserved.

- Parent-child direction determines vertical generation levels.
- Spousal groups should stay aligned by generation rules.

7. Horizontal intent cues must stay readable.

- Current couples should remain visually tighter than former/co-parent-only pairings.
- Former partner links should remain visible but de-emphasized.

### Practical guidance for future code changes

When changing `useTreeLayout`:

- Do not remove fallback position safety logic unless replaced with something equivalent or stronger.
- Keep sorting and grouping deterministic.
- Validate behavior with:
  - single isolated person,
  - person connected only through one relationship,
  - multi-root families connected by marriage,
  - missing/partial relationship sets,
  - large sibling groups.
  - divorced/widowed co-parent scenarios where one parent is added later.

When changing custom edge rendering:

- Keep active marriages and former relationships visually distinct.
- Preserve low visual prominence for former links so active family structures remain primary.

## Data Safety and Concurrency

Current protections:

1. Optimistic concurrency on person updates

- Updates include previous `updated_at` check.
- If row changed elsewhere, update fails safely and cache refreshes.

2. Realtime refresh

- Provider listens for DB changes and refreshes data.

3. Session staleness guard

- On return after long inactivity, app reloads to avoid editing stale state.

4. RLS authorization boundary

- DB policies require successful app authorization signal (`medis_is_authorized`).

5. Progressive login throttling

- Failed UI auth attempts trigger exponentially increasing cooldown (capped), persisted in local storage.

6. Input consistency guardrails

- UI and provider normalize text/date fields before writes.
- Database constraints enforce supported date formats and key length limits.

## Security Notes

Important caveat: app-password-based protection is stronger than UI-only gating but is still not equivalent to full user authentication/authorization.

For higher assurance in future:

- migrate to Supabase Auth (real users),
- move sensitive checks into server-side trusted functions,
- rotate secrets regularly,
- add rate-limiting and anomaly monitoring.

## UI Interaction Flow

Typical edit flow:

1. User authenticates in `AuthGate`.
2. `TreeDataProvider` loads data.
3. `TreeView` renders nodes/edges from `useTreeLayout`.
4. User edits person/relationships via side panel or modal.
5. Provider mutation runs.
6. Local state updates and realtime refresh keeps other sessions synced.

## Change Checklist (Use Before Merging)

Before shipping code that touches tree, data, or auth:

1. Does every person still render on the graph?
2. Did any change reduce deterministic layout behavior?
3. Do relationship changes always update visualization correctly?
4. Do conflict paths fail safely and refresh data?
5. Does unauthorized access fail at DB policy level, not only in UI?
6. Does build pass (`npm run build`)?

## Related Files

- `src/App.tsx`
- `src/components/common/AuthGate.tsx`
- `src/providers/TreeDataProvider.tsx`
- `src/components/tree/TreeView.tsx`
- `src/components/tree/useTreeLayout.ts`
- `src/components/common/FamilyMembersModal.tsx`
- `src/lib/supabase.ts`
- `supabase/migration.sql`
