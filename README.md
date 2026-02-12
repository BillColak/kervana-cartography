# Kervana

A desktop application for market research and validation, built with Tauri v2 + Vite + React + TypeScript.

## Quick Start

```bash
# Install dependencies
bun install

# Run development server (frontend only)
bun run dev

# Run Tauri desktop app
bun run tauri

# Build for production
bun run build
bun run tauri:build
```

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Desktop**: Tauri v2
- **UI**: Tailwind CSS 3 + shadcn/ui components
- **State**: Zustand
- **Canvas**: ReactFlow (for node graph visualization)
- **Database**: SQLite (via Rust/rusqlite) with FTS5 for search
- **Linting**: Biome + Ultracite preset

## Project Structure

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
├── lib/                     # Utilities (store, cn, tauri invoke)
└── types/                   # Shared TypeScript types

src-tauri/
├── src/
│   ├── main.rs              # Tauri backend with SQLite + commands
│   └── seed.rs              # Seed data (3 Core Markets)
└── tauri.conf.json          # Tauri configuration
```

## Features

- **Market Tree Visualization**: ReactFlow canvas with custom nodes
- **3 Core Markets**: Pre-populated with Health, Wealth, Relationships
- **Hierarchical Navigation**: Sidebar tree view
- **Node Editor**: Select nodes to edit markdown notes
- **Search**: Full-text search (FTS5) across all nodes
- **Persistent Storage**: SQLite database

## Development

See [CLAUDE.md](./CLAUDE.md) for detailed architecture and development guidelines.

## Database Schema

- **nodes**: Market nodes (id, label, level, color, markdown, tags, painPoints, audiences, marketSize, competition, validationScore, parentId, researchStatus, position, timestamps)
- **edges**: Connections between nodes (id, sourceId, targetId, color)
- **nodes_fts**: FTS5 virtual table for full-text search

## Tauri Commands

- `get_all_nodes()` - Get all nodes
- `get_node(id)` - Get single node
- `create_node(input)` - Create new node
- `update_node(id, input)` - Update node
- `delete_node(id)` - Delete node
- `get_edges()` - Get all edges
- `create_edge(sourceId, targetId, color)` - Create edge
- `delete_edge(id)` - Delete edge
- `search_nodes(query)` - Full-text search

## License

MIT
