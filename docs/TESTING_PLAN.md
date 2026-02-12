# Kervana Cartography — Testing Plan

## Overview

No tests exist yet. This plan covers unit, integration, and E2E testing for both the Rust backend and React frontend.

---

## 1. Rust Backend Tests (`src-tauri/`)

### 1.1 Database Layer (unit)

| Test | What it validates |
|------|-------------------|
| `test_create_tables` | Schema creation on fresh DB (nodes, edges, research_jobs, llm_cache, nodes_fts) |
| `test_seed_data` | 4 nodes + 3 edges seeded correctly, correct labels/levels/colors |
| `test_create_node` | Insert node, verify all fields including auto-generated id/timestamps |
| `test_update_node` | Partial updates (label, markdown, tags, score), verify `updated_at` changes |
| `test_delete_node` | Delete node, verify cascade deletes edges + FTS entries |
| `test_create_edge` | Edge creation with valid source/target |
| `test_create_edge_invalid_node` | Foreign key constraint on non-existent source/target |
| `test_delete_edge` | Edge deletion, nodes remain |
| `test_fts_search` | Insert nodes, search by label/markdown via FTS5 |
| `test_fts_search_partial` | Partial word matching behavior |
| `test_fts_search_empty` | Empty/whitespace query returns empty vec |

**Setup:** Use `rusqlite::Connection::open_in_memory()` for all unit tests — no disk I/O, instant teardown.

### 1.2 AI Module (unit)

| Test | What it validates |
|------|-------------------|
| `test_expand_prompt_with_ancestors` | Prompt includes full path "Root > Market > Niche" |
| `test_expand_prompt_no_ancestors` | Prompt works with empty ancestor list |
| `test_pain_points_prompt_with_context` | Context markdown included in user prompt |
| `test_pain_points_prompt_empty_context` | Graceful handling of empty markdown |
| `test_validate_prompt_with_data` | Pain points + audiences formatted correctly |
| `test_validate_prompt_empty_data` | "None identified yet" fallback text |
| `test_cache_key_deterministic` | Same inputs → same SHA256 hash |
| `test_cache_key_different_inputs` | Different inputs → different hashes |
| `test_cache_store_and_retrieve` | Store response, retrieve by hash |
| `test_cache_miss` | Returns None for unknown hash |

### 1.3 Research Jobs (unit)

| Test | What it validates |
|------|-------------------|
| `test_create_job` | Job created with QUEUED status, valid timestamps |
| `test_update_job_completed` | Status transition QUEUED → PROCESSING → COMPLETED with result_json |
| `test_update_job_failed` | Status transition to FAILED with error_message |
| `test_get_research_results_filters_completed` | Only returns COMPLETED jobs for a node |
| `test_cancel_queued_job` | Cancel sets FAILED + "Cancelled by user" |
| `test_cancel_completed_job_noop` | Cancel on completed job returns error |
| `test_invalid_job_type` | Rejects types other than EXPAND/PAIN_POINTS/VALIDATE |
| `test_get_node_ancestors` | Walks parent chain correctly for 3+ levels |
| `test_get_node_context` | Deserializes JSON pain_points/audiences from DB |

### 1.4 LLM Service (integration — needs mock)

| Test | What it validates |
|------|-------------------|
| `test_llm_service_missing_api_key` | Returns descriptive error when OPENAI_API_KEY unset |
| `test_llm_chat_success` | Mock HTTP server, verify request format (headers, body), parse response |
| `test_llm_chat_api_error` | Mock 500 response, verify error propagation |
| `test_llm_chat_invalid_json` | Mock malformed response body |
| `test_llm_chat_caches_response` | Second call with same prompts hits cache, no HTTP request |
| `test_llm_chat_empty_choices` | Response with empty choices array → "No response from LLM" error |

**Mock:** Use `mockito` or `wiremock` crate for HTTP mocking.

### 1.5 Rust Test File Structure

```
src-tauri/
  src/
    db_tests.rs          # 1.1 database tests
    ai/
      prompts_tests.rs   # 1.2 prompt generation
      service_tests.rs   # 1.4 LLM service with mocks
      research_tests.rs  # 1.3 research job lifecycle
```

**Run:** `cargo test --manifest-path src-tauri/Cargo.toml`

---

## 2. Frontend Tests (`src/`)

### Framework: Vitest + React Testing Library

### 2.1 Zustand Stores (unit)

#### `store.test.ts`

| Test | What it validates |
|------|-------------------|
| `setNodes replaces all nodes` | Full replacement, not append |
| `addNode appends to list` | New node at end, existing unchanged |
| `updateNode merges partial` | Only specified fields change |
| `removeNode cascades edges` | Removes node + connected edges + clears selection |
| `removeNode clears selection if selected` | selectedNodeId → null when that node deleted |
| `selectNode sets id` | Basic selection |
| `selectNode null deselects` | Clears selection |
| `toggleSidebar flips state` | true → false → true |
| `setView changes mode` | canvas → editor → split |

#### `research-store.test.ts`

| Test | What it validates |
|------|-------------------|
| `startNodeResearch creates job and starts polling` | Mock `startResearch`, verify activeJobs updated |
| `polling stops on COMPLETED` | Mock status sequence QUEUED → COMPLETED, verify interval cleared |
| `polling stops on FAILED` | Same for failure path |
| `isNodeResearching returns true during active job` | Check with QUEUED/PROCESSING status |
| `isNodeResearching returns false when idle` | No active jobs for node |
| `loadNodeResults populates results map` | Mock `getResearchResults` response |
| `autoCreateChildNodes creates nodes and edges` | Mock createNode/createEdge, verify store updated |
| `clearResults stops all polling` | All intervals cleared, state reset |

### 2.2 Actions / Tauri Bridge (unit)

Mock `@/lib/tauri` → `invokeCommand`. Verify each action calls the correct command name with correct args.

| Test | What it validates |
|------|-------------------|
| `getAllNodes calls get_all_nodes` | Command name + no args |
| `createNode passes input` | Correct `{ input }` payload |
| `updateNode passes id + input` | Both params forwarded |
| `deleteNode passes id` | Single param |
| `searchNodes passes query` | String forwarded |
| `createEdge passes sourceId, targetId, color` | Three params |
| `startResearch passes nodeId, jobType` | Both params |
| `cancelResearch passes jobId` | Single param |

### 2.3 Components (integration — React Testing Library)

#### Canvas

| Test | What it validates |
|------|-------------------|
| `MarketCanvas renders nodes from store` | Mock store with 4 nodes, verify rendered |
| `MarketCanvas renders edges between nodes` | Edge SVG paths exist |
| `MarketNode displays label and level badge` | Text content correct |
| `MarketNode click selects node` | selectNode called with id |
| `AddNodeDialog opens and creates node` | Fill form → submit → createNode action called |
| `AddNodeDialog validates required fields` | Empty label → no submission |
| `CanvasContextMenu shows AI options` | Right-click → Expand/Pain Points/Validate visible |

#### Sidebar

| Test | What it validates |
|------|-------------------|
| `AppSidebar renders node tree` | All 4 seed nodes listed |
| `AppSidebar shows node count` | "4 nodes, 0/4 researched" |
| `AppSidebar filter works` | Type "Health" → only Health visible |
| `AppSidebar click selects node` | selectNode called |
| `Sidebar toggle hides/shows` | toggleSidebar → content hidden |

#### Toolbar

| Test | What it validates |
|------|-------------------|
| `AppToolbar renders all buttons` | Add Node, Fit View, Auto Layout, Export, Research |
| `Search input filters nodes` | Calls searchNodes action |
| `View toggle switches canvas/split` | setView called correctly |
| `Dark mode toggle persists` | localStorage updated |

#### Editor

| Test | What it validates |
|------|-------------------|
| `NoteEditor loads markdown for selected node` | Plate.js initialized with node's markdown |
| `NoteEditor saves on change (debounced)` | updateNode called after debounce period |
| `PlateEditor renders formatting toolbar` | Bold/italic/heading buttons visible |
| `Markdown round-trip` | Write markdown → serialize → deserialize → same content |

#### Research Panel

| Test | What it validates |
|------|-------------------|
| `ResearchPanel shows tabs` | Sub-Niches, Pain Points, Validation tabs |
| `ResearchPanel shows empty state` | "No research yet" when no results |
| `ResearchPanel displays sub-niche cards` | Mock completed EXPAND job → cards rendered |
| `ResearchPanel displays pain point cards` | Mock completed PAIN_POINTS job → severity shown |
| `ResearchPanel displays validation score` | Mock completed VALIDATE job → score + summary |
| `Research button triggers startNodeResearch` | Click → action dispatched |
| `Loading state during research` | Progress indicator while PROCESSING |

#### Export

| Test | What it validates |
|------|-------------------|
| `exportMarkdown generates correct format` | Tree hierarchy in markdown with headers |
| `exportMarkdown includes metadata` | Tags, pain points, audiences, scores |
| `exportMarkdown handles empty tree` | No crash, minimal output |

### 2.4 Hooks (unit)

| Test | What it validates |
|------|-------------------|
| `useDarkMode reads localStorage` | Initializes from persisted preference |
| `useDarkMode toggles class on document` | `dark` class added/removed |
| `useKeyboardShortcuts Ctrl+N opens dialog` | Event handler fires |
| `useKeyboardShortcuts Escape deselects` | selectNode(null) called |
| `useKeyboardShortcuts Delete removes node` | removeNode called for selected |

### 2.5 Frontend Test File Structure

```
src/
  lib/
    __tests__/
      store.test.ts
      research-store.test.ts
  actions/
    __tests__/
      nodes.test.ts
      edges.test.ts
      research.test.ts
  features/
    canvas/
      __tests__/
        market-canvas.test.tsx
        market-node.test.tsx
        add-node-dialog.test.tsx
        canvas-context-menu.test.tsx
        auto-layout.test.ts
    sidebar/
      __tests__/
        app-sidebar.test.tsx
    toolbar/
      __tests__/
        app-toolbar.test.tsx
    editor/
      __tests__/
        note-editor.test.tsx
        plate-editor.test.tsx
        markdown-roundtrip.test.ts
    research/
      __tests__/
        research-panel.test.tsx
    export/
      __tests__/
        export-markdown.test.ts
  hooks/
    __tests__/
      use-dark-mode.test.ts
      use-keyboard-shortcuts.test.ts
```

---

## 3. E2E Tests (Tauri + WebDriver)

### Framework: Playwright or WebdriverIO with Tauri driver

These require the full app running. Lower priority — implement after unit/integration coverage is solid.

| Test | What it validates |
|------|-------------------|
| `App launches with seed data` | Window opens, 4 nodes visible on canvas |
| `Create node flow` | Ctrl+N → dialog → fill form → node appears on canvas + sidebar |
| `Edit node notes` | Click node → editor opens → type text → auto-saves → reopen → text persists |
| `Delete node` | Select → Delete key → node + edges removed → sidebar updated |
| `Search nodes` | Type in search → results filter → click result → node selected |
| `Auto layout` | Click Auto Layout → nodes rearranged in tree |
| `Dark mode toggle` | Toggle → all elements switch theme → refresh → persists |
| `Export markdown` | Click Export → file dialog → valid markdown file |
| `Canvas zoom/pan` | Scroll to zoom, drag to pan, minimap updates |
| `Context menu AI research` | Right-click node → Expand → (mock LLM) → child nodes created |
| `Research panel shows results` | After AI research → panel shows sub-niches/pain points/validation |

---

## 4. Implementation Priority

### Phase 1 — Foundation (do first)
1. Install test deps: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`
2. Add `vitest.config.ts` with path aliases matching `vite.config.ts`
3. Add Rust `dev-dependencies`: `mockito` (HTTP mocking)
4. Write Zustand store tests (fastest ROI — pure logic, no DOM)
5. Write Rust DB tests (in-memory SQLite, no external deps)

### Phase 2 — Core Logic
6. Prompt generation tests (pure functions, easy to test)
7. Action layer tests (mock Tauri bridge)
8. Research store tests (async polling logic — high bug potential)
9. LLM service tests with HTTP mocks

### Phase 3 — UI Components
10. Component rendering tests (React Testing Library)
11. Editor markdown round-trip tests
12. Hook tests

### Phase 4 — E2E (later)
13. Tauri WebDriver setup
14. Core user flows

---

## 5. Running Tests

```bash
# Frontend
bun run test              # vitest watch mode
bun run test:run          # single run (CI)
bun run test:coverage     # with coverage report

# Backend
cd src-tauri && cargo test

# All
bun run test:all          # script that runs both
```

---

## 6. CI (GitHub Actions)

```yaml
# .github/workflows/test.yml
jobs:
  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun run test:run

  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - run: cargo test --manifest-path src-tauri/Cargo.toml
```

---

## Test Count Summary

| Layer | Tests |
|-------|-------|
| Rust DB | 11 |
| Rust AI/Prompts | 10 |
| Rust Research Jobs | 9 |
| Rust LLM Service | 6 |
| Frontend Stores | 17 |
| Frontend Actions | 8 |
| Frontend Components | ~25 |
| Frontend Hooks | 5 |
| E2E | 11 |
| **Total** | **~102** |
