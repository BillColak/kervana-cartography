# Phase 3 Frontend: AI Research UI

## Context
The Rust backend now has AI research infrastructure (start_research, get_research_status, get_research_results, cancel_research commands). We need frontend components to wire it all up.

## Existing Files to Know
- `src/actions/nodes.ts` — Tauri IPC wrappers for node CRUD
- `src/actions/edges.ts` — Tauri IPC wrappers for edge CRUD
- `src/lib/store.ts` — Zustand store (nodes, edges, selectedNodeId, view, sidebarOpen)
- `src/lib/tauri.ts` — invokeCommand helper
- `src/types/market.ts` — MarketNodeData, MarketEdgeData, NodeLevel types
- `src/features/canvas/canvas-context-menu.tsx` — right-click menu on nodes
- `src/features/canvas/market-canvas.tsx` — ReactFlow canvas
- `src/features/canvas/add-node-dialog.tsx` — dialog for adding nodes

## Tasks

### 1. Research Actions (src/actions/research.ts)
Create Tauri IPC wrappers:
```typescript
import { invokeCommand } from "@/lib/tauri";

interface ResearchJob {
  id: string;
  nodeId: string;
  jobType: string;
  status: string;
  resultJson: string | null;
  errorMessage: string | null;
  createdAt: number;
  updatedAt: number;
}

export async function startResearch(nodeId: string, jobType: string): Promise<ResearchJob> {
  return invokeCommand<ResearchJob>("start_research", { nodeId, jobType });
}

export async function getResearchStatus(jobId: string): Promise<ResearchJob> {
  return invokeCommand<ResearchJob>("get_research_status", { jobId });
}

export async function getResearchResults(nodeId: string): Promise<ResearchJob[]> {
  return invokeCommand<ResearchJob[]>("get_research_results", { nodeId });
}

export async function cancelResearch(jobId: string): Promise<void> {
  return invokeCommand<void>("cancel_research", { jobId });
}
```

### 2. Research Store (src/lib/research-store.ts)
Zustand store for research state:
- `activeJobs: Record<string, ResearchJob>` — keyed by job ID
- `results: Record<string, ResearchJob[]>` — keyed by node ID
- `startNodeResearch(nodeId, jobType)` — calls startResearch, adds to activeJobs, starts polling
- `pollJob(jobId)` — polls getResearchStatus every 2s until complete/failed
- `loadNodeResults(nodeId)` — loads all results for a node
- When a job completes with type EXPAND and has resultJson, parse the sub-niches and auto-create child nodes

### 3. Research Panel (src/features/research/research-panel.tsx)
Side panel that shows when a node is selected (add a tab or section below the editor):
- Three sections: "Sub-Niches", "Pain Points", "Validation"
- Each section shows results if available, or a "Run AI Research" button
- Show loading spinner when research is in progress
- Display parsed results nicely:
  - Sub-niches: cards with label, description, competition badge
  - Pain points: cards with frustration, user quote (italic), why solutions fail
  - Validation: score card with 0-100 gauge and factor breakdown
- Use shadcn Card, Badge, Button, Tabs components

### 4. Wire Context Menu
Update `src/features/canvas/canvas-context-menu.tsx`:
- Add "Expand with AI" option that calls `startNodeResearch(nodeId, "EXPAND")`
- Add "Analyze Pain Points" option
- Add "Validate Niche" option
- Show spinner/disabled state while research is running

### 5. Auto-Create Nodes from Expansion
When an EXPAND research job completes:
- Parse resultJson (array of sub-niche suggestions)
- For each suggestion, call createNode with:
  - label from suggestion
  - level = next level down from parent
  - parentId = the expanded node
  - Position below parent (spread horizontally)
- Auto-create edges from parent to each new child
- Refresh the canvas

### 6. Update App Layout
Update `src/app/App.tsx` to include the research panel:
- When a node is selected, show editor + research panel
- Research panel can be a tab alongside the editor, or below it
- Keep the split view working

## Technical Notes
- Use `bun` not npm
- Use shadcn/ui: may need to add Card, Tabs, Progress components (`bunx shadcn@latest add card tabs progress`)
- Path alias `@/` maps to `src/`
- After changes: `bun run build` must pass
- Run `./node_modules/.bin/biome check --write src/` for linting
- Git commit and push

## Definition of Done
- Research actions wired to Tauri backend
- Research store with polling
- Research panel showing results
- Context menu triggers AI research
- Auto-node creation from expansion results
- Build + lint pass
- Committed and pushed
