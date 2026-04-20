# Medis

Medis is a family tree application built with React, Vite, TypeScript, React Flow, and Supabase.

It supports browsing and editing people, marriages, and parent-child relationships in a visual tree, with a custom genealogy-oriented layout engine based on `relatives-tree`.

## Features

- Interactive family tree view
- Person detail panel for editing records
- Relationship editing for parents, children, and spouses
- Supabase-backed data storage
- Session-based password gate for the UI
- Focus and highlight mode for lineage browsing
- Custom edge rendering for marriages and parent-child relationships

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
VITE_APP_PASSWORD=your-password-here
```

### 3. Start the development server

```bash
npm run dev
```

### 4. Build for production

```bash
npm run build
```

### 5. Preview the production build

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
- Current work has focused on improving branch separation, generational correctness, and avoiding misleading parent-child placement.
