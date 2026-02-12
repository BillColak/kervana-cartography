# Kervana Cartography

A desktop application for market research and validation, built with Tauri v2 + Vite + React + TypeScript.

## Project Overview

Kervana is a visual market research tool that uses a tree/graph structure to organize and validate market opportunities. It's inspired by the "3 Core Markets" framework (Health, Wealth, Relationships) and helps users drill down from broad markets into specific niches.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Desktop**: Tauri v2
- **UI**: Tailwind CSS 3 + shadcn/ui components
- **State**: Zustand
- **Canvas**: ReactFlow (for node graph visualization)
- **Database**: SQLite (via Rust/rusqlite) with FTS5 for search
- **Linting**: Biome + Ultracite preset

## Architecture

### Directory Structure

The project follows a **feature-based** structure for better LLM navigation:

```
src/
├── app/                     # App entry, providers, global styles
├── features/
│   ├── canvas/              # ReactFlow market tree canvas
│   ├── editor/              # Note editor (stub textarea for now)
│   ├── sidebar/             # Tree navigation sidebar
│   ├── research/            # AI research panel (stub)
│   └── settings/            # Settings dialog (stub)
├── components/ui/           # shadcn/ui primitives
├── actions/                 # Tauri IPC command wrappers
├── db/                      # Database schema (future Drizzle)
├── hooks/                   # Shared React hooks
├── lib/                     # Utilities (store, cn, tauri invoke)
└── types/                   # Shared TypeScript types
```

### Core Types (src/types/market.ts)

- **MarketNodeData**: Represents a node in the market tree (id, label, level, color, markdown, tags, painPoints, audiences, marketSize, competition, validationScore, parentId, researchStatus, position, timestamps)
- **MarketEdgeData**: Connects nodes (id, sourceId, targetId, color)
- **NodeLevel**: "root" | "core-market" | "submarket" | "niche" | "sub-niche"
- **ResearchStatus**: "not-started" | "in-progress" | "complete"
- **CompetitionLevel**: "low" | "medium" | "high"

### Backend (src-tauri/)

- **Database**: SQLite with tables `nodes`, `edges`, `nodes_fts` (FTS5 virtual table)
- **Tauri Commands**:
  - `get_all_nodes`, `get_node`, `create_node`, `update_node`, `delete_node`
  - `get_edges`, `create_edge`, `delete_edge`
  - `search_nodes` (full-text search)
- **Seed Data**: Pre-populated with "3 Core Markets" root structure (Health, Wealth, Relationships)

### Frontend State (src/lib/store.ts)

Zustand store manages:
- `nodes: MarketNodeData[]`
- `edges: MarketEdgeData[]`
- `selectedNodeId: string | null`
- `view: ViewMode` ("canvas" | "editor" | "split")
- `sidebarOpen: boolean`
- Actions: setNodes, addNode, updateNode, removeNode, setEdges, addEdge, removeEdge, selectNode, setView, toggleSidebar

### UI Layout

- **Left**: Sidebar with tree navigation (collapsible)
- **Center**: ReactFlow canvas (default view)
- **Right**: Editor panel (slides in when a node is selected)
- **Bottom** (future): Toolbar with Add Node, Expand (AI), Research, Export, Settings

### ReactFlow Canvas

- Custom `MarketNode` component with:
  - Color-coded borders based on `level`
  - Research status indicator (colored dot)
  - Label and level badge
- Click node → select it (opens editor panel)
- Drag node → updates position in database
- Right-click context menu (future): Expand, Research, Delete, Change Color
- Auto-layout option (future: dagre/elkjs for tree layout)

## Development Commands

- `bun dev` - Run Vite dev server
- `bun run build` - Build frontend (TypeScript + Vite)
- `bun run tauri` - Run Tauri desktop app in dev mode
- `bun run tauri:build` - Build Tauri desktop app for production
- `bun lint` - Run Biome linter
- `source $HOME/.cargo/env && cargo check --manifest-path src-tauri/Cargo.toml` - Check Rust code

## Known Limitations

- **Editor**: Currently a stub textarea. Plate.js rich text editor to be added later.
- **Research Panel**: Stub only. AI-powered research feature planned.
- **Auto-layout**: Not yet implemented. Nodes are manually positioned.
- **Context Menu**: Not yet implemented for right-click node operations.
- **Settings**: Stub dialog only.

## Code Style

- Use **bun** (not npm/yarn)
- TypeScript strict mode enabled
- Biome with Ultracite preset for linting/formatting
- Feature-based directory structure
- Path alias `@/` maps to `src/`
- Prefer functional React components with hooks
- Use Zustand for global state
- Use Tauri IPC commands via `src/actions/` wrappers

## Future Features

- Plate.js rich text editor for markdown notes
- AI-powered market research (OpenAI/Anthropic integration)
- Export to PDF/Markdown
- Auto-layout with dagre/elkjs
- Validation scoring system
- Pain point and audience tracking
- Market size estimation
- Competition analysis
