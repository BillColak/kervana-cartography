# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kervana Cartography is an AI-powered market research and niche discovery desktop app. It visualizes market hierarchies as an interactive node graph, with AI-assisted research to expand markets, identify pain points, and validate opportunities.

## Development Commands

```bash
# Frontend dev server (Vite)
bun dev

# Run Tauri desktop app (full stack)
bun run tauri

# Build
bun run build              # TypeScript + Vite
bun run tauri:build        # Full desktop build

# Lint & Format
bun lint                   # Biome check + fix
bun format                 # Biome format

# Testing
bun test                   # Watch mode
bun test:run               # Single run
bun test:run <pattern>     # Run specific test file(s)
bun test:coverage          # With coverage report

# Rust backend
cargo check --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml
cargo test --manifest-path src-tauri/Cargo.toml
```

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS 3 + shadcn/ui
- **Desktop**: Tauri v2 (Rust backend)
- **Canvas**: ReactFlow (@xyflow/react) for node graph
- **Editor**: Plate.js (rich text with markdown serialization)
- **State**: Zustand (2 stores: `lib/store.ts` for UI, `lib/research-store.ts` for AI jobs)
- **Layout**: Dagre for auto tree layout
- **Database**: SQLite via rusqlite with FTS5 full-text search
- **AI**: OpenAI-compatible API with SHA256 response caching

## Architecture

### Data Flow

1. **UI → Tauri**: React components call functions in `src/actions/` (nodes.ts, edges.ts, research.ts)
2. **Actions → IPC**: Actions use `lib/tauri.ts` wrapper to invoke Rust commands
3. **Rust → SQLite**: Tauri commands in `src-tauri/src/main.rs` interact with SQLite
4. **State Sync**: After IPC calls, components update Zustand stores which re-render the UI

### Key Directories

- `src/features/` — Feature modules (canvas, editor, research, sidebar, toolbar, export)
- `src/actions/` — Tauri IPC wrappers (all backend communication goes through here)
- `src/lib/store.ts` — Main Zustand store (nodes, edges, selection, view state)
- `src/lib/research-store.ts` — AI research job state (polling, auto-expand)
- `src/components/ui/` — shadcn/ui primitives (don't modify directly)
- `src-tauri/src/ai/` — AI service (prompts.rs, service.rs with LLM caching, research.rs)

### Database Tables

- `nodes` — Market tree nodes with all metadata
- `edges` — Parent-child connections
- `nodes_fts` — FTS5 virtual table for search
- `research_jobs` — Async AI job tracking
- `llm_cache` — SHA256-keyed response cache

### Core Types (src/types/market.ts)

- **MarketNodeData**: Complete node data including label, level, markdown, tags, painPoints, audiences, marketSize, competition, validationScore
- **NodeLevel**: "root" | "core-market" | "submarket" | "niche" | "sub-niche"
- **ResearchStatus**: "not-started" | "in-progress" | "complete"

## Code Style

- Use **bun** (not npm/yarn)
- Path alias: `@/` → `src/`
- Biome for linting (double quotes, semicolons, 2-space indent, 100 char line width)
- Feature-based directory structure
- Functional React components with hooks
- Tauri IPC always through `src/actions/` wrappers

## Environment Variables

- `OPENAI_API_KEY` — Required for AI features
- `OPENAI_API_BASE` — Custom base URL (default: https://api.openai.com/v1)
- `OPENAI_MODEL` — Model name (default: gpt-4o)