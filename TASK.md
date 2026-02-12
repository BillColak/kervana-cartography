# Task: Build Core MVP Interaction Loop

## Context
Kervana is a Tauri v2 desktop app for visual market research. The scaffold is complete with ReactFlow canvas, Zustand store, SQLite backend, and Tauri IPC commands. The frontend needs the core interaction features to make it actually usable.

## What Exists
- ReactFlow canvas showing market nodes with color-coded borders
- Sidebar with tree view (flat render, no collapse)
- Editor panel with textarea (manual save button)
- Tauri commands: CRUD for nodes/edges, full-text search
- Zustand store with nodes, edges, selectedNodeId, view mode
- Seed data: 3 Core Markets (Health, Wealth, Relationships) with submarkets

## Tasks (Priority Order)

### 1. Add Node Dialog
- Create `src/features/canvas/add-node-dialog.tsx`
- Trigger: button in toolbar OR double-click empty canvas area
- When a node is selected, "Add Child" creates a child node linked to it
- Fields: label, level (auto-set based on parent), color (inherit or pick)
- After creation: auto-create edge from parent to child, position child below parent
- Update store + call createNode and createEdge IPC actions

### 2. Collapsible Tree Sidebar
- Add expand/collapse toggles for nodes with children
- Show node count badges
- Add "+" button next to each node to add a child
- Show research status dot (colored circle like the canvas nodes)
- Right-click context menu: Rename, Delete, Add Child, Change Color

### 3. Enhanced Editor Panel
- Add metadata section above the textarea showing:
  - Tags (editable chips)
  - Pain Points (editable list)
  - Audiences (editable list)  
  - Research Status selector (dropdown)
  - Competition level selector
  - Validation score (0-100 slider)
- Auto-save with debounce (500ms) instead of manual save button
- Keep the close button

### 4. Toolbar
- Create `src/features/toolbar/app-toolbar.tsx`
- Place at the top of the canvas area
- Buttons: Add Node, Fit View, Toggle Sidebar, View Mode (Canvas/Split)
- Search input that calls searchNodes IPC command
- Show selected node breadcrumb (Root > Core Market > Submarket > ...)

### 5. Better Market Nodes
- Show tag count badge
- Show pain point count
- Truncated first line of markdown as preview
- Hover tooltip with full details
- Double-click to open editor (set view to split)

### 6. Canvas Context Menu
- Right-click node: Edit, Add Child, Delete, Change Color, Set Research Status
- Right-click canvas: Add Root Node, Fit View
- Create `src/features/canvas/context-menu.tsx`

### 7. Delete Node Confirmation
- When deleting a node, confirm if it has children
- Cascade delete children + their edges
- The backend already handles edge cleanup via ON DELETE CASCADE

## Technical Notes
- Use shadcn/ui components (already have Button, add Dialog, DropdownMenu, Input, Select, Slider, Badge, Tooltip, ContextMenu as needed)
- Run `bunx shadcn@latest add <component>` to add new shadcn components
- Path alias `@/` maps to `src/`
- Store is at `@/lib/store` (Zustand)
- IPC wrappers at `@/actions/nodes` and `@/actions/edges`
- Use `bun` not npm
- After all changes: run `bun run build` to verify TypeScript compilation
- Biome + Ultracite for linting (run `bun lint` to check)

## Definition of Done
- Can add new nodes as children of existing nodes
- Can edit node metadata (tags, pain points, audiences, status)
- Auto-save works
- Sidebar tree is collapsible with context menu
- Toolbar with search and navigation
- Canvas context menu for node operations
- `bun run build` passes with zero errors
- `bun lint` passes (Biome/Ultracite)
- **Rename project to `kervana-cartography`** in package.json, Cargo.toml, tauri.conf.json, README, CLAUDE.md
- Create GitHub repo `kervana-cartography` and push: `gh repo create BillColak/kervana-cartography --public --source . --push`
- Commit all changes with descriptive messages
