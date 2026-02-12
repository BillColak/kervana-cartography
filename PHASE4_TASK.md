# Phase 4: Polish, Auto-Layout & Export

## Context
Phases 1-3 are complete. The app has a ReactFlow canvas, Plate.js editor, and AI research backend. This phase adds polish, auto-layout, and export capabilities.

## Tasks

### 1. Auto-Layout with Dagre
Install `@dagrejs/dagre` and create auto-layout functionality:
- Create `src/features/canvas/auto-layout.ts`
- Function `autoLayoutNodes(nodes, edges)` that:
  - Builds a dagre graph from nodes and edges
  - Computes layout (direction: top-to-bottom)
  - Returns new positions for each node
- Add "Auto Layout" button to toolbar
- When clicked, animate nodes to new positions and save to database
- Use `rankdir: 'TB'`, `nodesep: 80`, `ranksep: 120`

### 2. Export to Markdown
Create `src/features/export/export-markdown.ts`:
- Export entire market tree as a structured markdown document
- Hierarchical format with headings matching node levels
- Include node metadata (tags, pain points, audiences, validation score)
- Include research results if available
- Create a Tauri command to save file (or use Tauri's save dialog)
- Add "Export" button to toolbar with dropdown: "Export as Markdown"

### 3. Export to JSON
- Export the full tree (nodes + edges + research results) as JSON
- Useful for backup/restore
- Add to export dropdown

### 4. Dark Mode
- Add dark mode toggle to toolbar/settings
- Use Tailwind's `dark:` variants
- Store preference in localStorage
- Apply `dark` class to root element

### 5. Keyboard Shortcuts
Create `src/hooks/use-keyboard-shortcuts.ts`:
- `Ctrl+N` — Add new node
- `Ctrl+S` — Force save current node (even if not changed)
- `Ctrl+F` — Focus search in toolbar
- `Ctrl+L` — Toggle auto-layout
- `Ctrl+E` — Toggle editor panel
- `Ctrl+\` — Toggle sidebar
- `Delete` — Delete selected node (with confirmation)
- `Escape` — Deselect node

### 6. Node Statistics Dashboard
Create `src/features/dashboard/stats-dashboard.tsx`:
- Overview panel showing:
  - Total nodes by level (pie chart or bar)
  - Research completion rate
  - Average validation score
  - Top pain points across all niches
- Toggle from toolbar or as a view mode

### 7. Improved Canvas Styling
- Smoother edge animations
- Node grouping (color-coded backgrounds for different branches)
- Minimap shows node colors
- Better zoom controls

## Technical Notes
- Install: `bun add @dagrejs/dagre @types/dagre`
- Use `bun` not npm
- After changes: `bun run build` must pass
- Run `./node_modules/.bin/biome check --write src/` for linting
- Git commit and push

## Definition of Done
- Auto-layout works and animates
- Markdown and JSON export functional
- Dark mode toggle
- Keyboard shortcuts working
- Build + lint pass
- Committed and pushed
