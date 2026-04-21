# Medis

Medis is a family tree application built with React, Vite, TypeScript, React Flow, and Supabase.

It supports browsing and editing people, marriages, and parent-child relationships in a visual tree, with a custom genealogy-oriented layout engine based on `relatives-tree`.

## Features

- Interactive family tree view
- Person detail panel for editing records
- Relationship editing for parents, children, and spouses
- Create-person modal can link parents and children immediately on first save
- Supabase-backed data storage
- Session-based password gate with DB-enforced access policy
- Progressive login cooldown after failed attempts (anti-guessing throttle)
- Focus and highlight mode for lineage browsing
- Custom edge rendering for marriages and parent-child relationships
- Former partner relationships (divorced/widowed) rendered as faint dotted links with a center marker
- Tree controls (zoom/fit) pinned to top-left on desktop and mobile
- Family list modal (`Sąrašas`) with sortable columns and export to CSV/PDF
- Deterministic, stable layout — tree structure does not shift when relationships are added or removed
- Correct generational row assignment via topological sort of the parent→child DAG
- Child-to-couple fork attachment selects the visually closest valid parent pair in complex/divorce graphs
- Co-parents are grouped horizontally even without an explicit marriage record
- Row spacing distinguishes active couples from former/co-parent-only pairs

## Tech Stack

- React 19
- Vite
- TypeScript
- `@xyflow/react`
- `relatives-tree`
- Supabase

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in your values.

Required variables:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key-here
```

### 3. Apply Supabase migration and set the app password hash

Run `supabase/migration.sql` in Supabase SQL Editor.

Then set your real app password hash in `app_settings` (replace `YOUR_STRONG_PASSWORD`):

```sql
update app_settings
set app_password_hash = extensions.crypt('YOUR_STRONG_PASSWORD', extensions.gen_salt('bf')),
    updated_at = now()
where id = true;
```

The client sends the entered password via request header (`x-medis-password`), and RLS policies allow reads/writes only when `medis_is_authorized()` succeeds.

For an already populated database, run `supabase/data-quality-hardening-existing-db.sql` in Supabase SQL Editor.

This script:

- adds guardrails for date formats and key text-field lengths without deleting existing rows
- adds and backfills `marriages.relationship_status` for existing data

Accepted partial date values:

- `YYYY`
- `YYYY-MM`
- `YYYY-MM-DD`
- blank value (stored as unknown)

### 4. Start the development server

```bash
npm run dev
```

### 5. Build for production

```bash
npm run build
```

### 6. Preview the production build

```bash
npm run preview
```

## Data Model

The app works with three main Supabase tables:

- `people`
- `marriages`
- `parent_child`

`marriages.relationship_status` supports:

- `married`
- `divorced`
- `widowed`

The client loads all three datasets on startup and keeps a local in-memory view for layout and UI interactions.

## Project Structure

```text
src/
  components/
    common/
    layout/
    person/
    tree/
  hooks/
  lib/
  locales/
  providers/
  types/
```

Important files:

- `src/components/tree/useTreeLayout.ts`: family tree layout and edge preparation
- `src/components/tree/TreeView.tsx`: React Flow wrapper and interaction handling
- `src/components/layout/AppLayout.tsx`: app-level selection, focus, and panel state
- `src/providers/TreeDataProvider.tsx`: Supabase loading and mutations

## Notes

- Authentication is intentionally lightweight and uses a session password gate in the browser.
- Login attempts are progressively throttled client-side after failed attempts (exponential cooldown with cap).
- Person inputs are normalized before save (trimming/empty normalization/date normalization).
- The visual layout is custom and optimized for genealogy-specific constraints rather than generic graph layout.
- `relatives-tree` is used to derive initial X positions.
- Y (generational row) is overridden by parent→child generation logic so no child appears above a parent.

## Architecture Docs

Detailed architecture and maintenance guidance is documented in:

- `docs/application-architecture.md`
