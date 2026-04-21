# Medis

Medis is a family tree application built with React, Vite, TypeScript, React Flow, and Supabase.

It supports browsing and editing people, marriages, and parent-child relationships in a visual tree, with a custom genealogy-oriented layout engine based on `relatives-tree`.

## Features

- Interactive family tree view
- Person detail panel for editing records
- Relationship editing for parents, children, and spouses
- Supabase-backed data storage
- Session-based password gate with DB-enforced access policy
- Focus and highlight mode for lineage browsing
- Custom edge rendering for marriages and parent-child relationships
- Deterministic, stable layout — tree structure does not shift when relationships are added or removed
- Correct generational row assignment via topological sort of the parent→child DAG (spouses share a row; root couples are never displaced by in-law descendants)
- Family fork edges handle children that span multiple rows (e.g. a sibling who married into a different generation)

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
set app_password_hash = crypt('YOUR_STRONG_PASSWORD', gen_salt('bf')),
    updated_at = now()
where id = true;
```

The client sends the entered password via request header (`x-medis-password`), and RLS policies allow reads/writes only when `medis_is_authorized()` succeeds.

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
- The visual layout is custom and optimized for genealogy-specific constraints rather than generic graph layout.
- `relatives-tree` is used to derive initial X positions. Y (generational row) is fully overridden by a topological sort so that root couples always appear at row 0 and no child can appear at the same row as or above their parents.
- Family fork edges always extend their horizontal bar to include the couple's midpoint (`stemX`), so the stem is never left floating when all children are on one side of the couple.

## Architecture Docs

Detailed architecture and maintenance guidance is documented in:

- `docs/application-architecture.md`
