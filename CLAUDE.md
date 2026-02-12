# Kervana Cartography

AI-powered market cartography and niche discovery platform. Built with Tauri v2 + Vite + React + TypeScript.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Desktop**: Tauri v2
- **UI**: Tailwind CSS 3 + shadcn/ui + lucide-react icons
- **State**: Zustand (2 stores: main + research)
- **Canvas**: ReactFlow (node graph visualization)
- **Editor**: Plate.js (rich text with markdown serialization)
- **Layout**: Dagre (auto tree layout)
- **Database**: SQLite (via Rust/rusqlite) with FTS5 for search
- **AI**: OpenAI-compatible API with response caching
- **Linting**: Biome

## Architecture

### Directory Structure

```
src/
├── app/                          # App entry, providers, global styles
├── features/
│   ├── canvas/                   # ReactFlow market tree canvas
│   │   ├── market-canvas.tsx     # Main canvas component
│   │   ├── add-node-dialog.tsx   # Create node dialog
│   │   ├── canvas-context-menu.tsx # Right-click menu (edit, AI research, delete)
│   │   ├── auto-layout.ts       # Dagre tree layout
│   │   └── nodes/               # Custom ReactFlow node renderers
│   ├── editor/                   # Plate.js rich text editor
│   │   ├── note-editor.tsx       # Main editor with metadata panel
│   │   ├── plate-editor.tsx      # Plate.js editor wrapper
│   │   ├── editor-toolbar.tsx    # Floating selection toolbar
│   │   ├── kits/                 # Plate.js plugin kits
│   │   └── nodes/                # Plate.js node renderers
│   ├── research/                 # AI research panel
│   │   └── research-panel.tsx    # Tabs: Sub-Niches, Pain Points, Validation
│   ├── sidebar/                  # Tree navigation sidebar
│   ├── toolbar/                  # Top toolbar (add, layout, search, export, dark mode)
│   └── export/                   # Markdown/JSON export
├── actions/                      # Tauri IPC command wrappers
│   ├── nodes.ts                  # Node CRUD + search
│   ├── edges.ts                  # Edge CRUD
│   └── research.ts               # AI research commands
├── components/ui/                # shadcn/ui primitives
├── hooks/                        # Shared hooks (keyboard shortcuts, dark mode)
├── lib/
│   ├── store.ts                  # Main Zustand store (nodes, edges, UI state)
│   ├── research-store.ts         # Research Zustand store (jobs, polling, auto-expand)
│   ├── tauri.ts                  # Tauri invoke wrapper
│   └── utils.ts                  # cn() utility
└── types/
    └── market.ts                 # MarketNodeData, NodeLevel, etc.
```

### Backend (src-tauri/)

```
src-tauri/src/
├── main.rs                       # Tauri setup, DB init, command registration
├── seed.rs                       # Initial "3 Core Markets" seed data
└── ai/
    ├── mod.rs                    # Module exports
    ├── models.rs                 # Rust types (SubNiche, PainPoint, Validation, ResearchJob)
    ├── prompts.rs                # Prompt templates for expand/pain/validate
    ├── service.rs                # LLM HTTP client with SHA256 response caching
    └── research.rs               # Research job Tauri commands
```

### Database Tables

- `nodes` — Market tree nodes with metadata
- `edges` — Parent-child connections
- `nodes_fts` — FTS5 virtual table for full-text search
- `research_jobs` — Async AI research job tracking
- `llm_cache` — SHA256-keyed LLM response cache

### Tauri Commands

**Node CRUD**: `get_all_nodes`, `get_node`, `create_node`, `update_node`, `delete_node`, `search_nodes`
**Edge CRUD**: `get_edges`, `create_edge`, `delete_edge`
**AI Research**: `start_research`, `get_research_status`, `get_research_results`, `cancel_research`

### Core Types (src/types/market.ts)

- **MarketNodeData**: id, label, level, color, markdown, tags, painPoints, audiences, marketSize, competition, validationScore, parentId, researchStatus, position, timestamps
- **NodeLevel**: "root" | "core-market" | "submarket" | "niche" | "sub-niche"
- **ResearchStatus**: "not-started" | "in-progress" | "complete"

## Features

- **Visual Market Tree**: ReactFlow canvas with color-coded, draggable nodes
- **Rich Text Editor**: Plate.js with headings, lists, bold/italic, links, markdown shortcuts
- **AI Research**: Right-click → Expand with AI / Pain Points / Validate (via OpenAI-compatible API)
- **Auto-Expand**: AI suggests sub-niches, auto-creates child nodes on canvas
- **Validation Scoring**: 0-100 score based on market depth, competition, pain severity, monetization
- **Auto-Layout**: Dagre tree layout with one click
- **Full-Text Search**: SQLite FTS5 search across node labels and content
- **Markdown Export**: Structured document with all metadata
- **Dark Mode**: Toggle with localStorage persistence
- **Keyboard Shortcuts**: Ctrl+N (add), Ctrl+E (editor), Ctrl+F (search), Ctrl+L (layout), Ctrl+R (research), Ctrl+\\ (sidebar), Esc (deselect), Delete (remove)
- **Auto-Save**: 500ms debounced save for all editor fields

## Development

```bash
bun dev                # Vite dev server
bun run build          # TypeScript + Vite build
bun run tauri          # Run Tauri desktop app
bun lint               # Biome linter

source $HOME/.cargo/env
cargo check --manifest-path src-tauri/Cargo.toml    # Check Rust
cargo clippy --manifest-path src-tauri/Cargo.toml   # Rust linting
```

## Environment Variables

- `OPENAI_API_KEY` — API key for LLM service
- `OPENAI_API_BASE` — Base URL (default: https://api.openai.com/v1)
- `OPENAI_MODEL` — Model name (default: gpt-4o)

## Code Style

- **bun** (not npm/yarn)
- TypeScript strict mode
- Biome for linting/formatting
- Feature-based directory structure
- Path alias `@/` → `src/`
- Functional React components with hooks
- Zustand for global state
- Tauri IPC via `src/actions/` wrappers
