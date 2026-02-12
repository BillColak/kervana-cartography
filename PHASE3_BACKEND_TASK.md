# Phase 3 Backend: AI Research Infrastructure (Rust)

## Context
Kervana-cartography's Rust backend needs AI research infrastructure. The design doc is at `docs/AI_INTEGRATION_DESIGN.md`. This task focuses on the Rust backend only — no frontend changes.

## Tasks

### 1. Add Database Tables
Add to `init_database()` in `src-tauri/src/main.rs`:

```sql
CREATE TABLE IF NOT EXISTS research_jobs (
    id TEXT PRIMARY KEY,
    node_id TEXT NOT NULL,
    job_type TEXT NOT NULL,    -- 'EXPAND' | 'PAIN_POINTS' | 'VALIDATE'
    status TEXT NOT NULL,      -- 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
    result_json TEXT,
    error_message TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(node_id) REFERENCES nodes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS llm_cache (
    hash TEXT PRIMARY KEY,
    prompt_hash TEXT NOT NULL,
    response TEXT NOT NULL,
    model TEXT NOT NULL,
    tokens_used INTEGER,
    created_at INTEGER NOT NULL
);
```

### 2. Create AI Module Structure
```
src-tauri/src/
├── main.rs
├── seed.rs
└── ai/
    ├── mod.rs          -- Module exports
    ├── models.rs       -- Rust types for AI requests/responses
    ├── prompts.rs      -- Prompt templates
    ├── service.rs      -- LLM API client (reqwest + OpenAI-compatible)
    └── research.rs     -- Research job orchestration
```

### 3. AI Models (models.rs)
```rust
pub struct SubNicheSuggestion {
    pub label: String,
    pub description: String,
    pub pain_points: Vec<String>,
    pub audiences: Vec<String>,
    pub competition_level: String,
    pub keywords: Vec<String>,
}

pub struct PainPointResult {
    pub frustration: String,
    pub user_quote: String,
    pub why_solutions_fail: String,
    pub severity: u8,  // 1-10
}

pub struct ValidationResult {
    pub market_depth: f64,
    pub competition_intensity: f64,
    pub pain_severity: f64,
    pub monetization_potential: f64,
    pub final_score: f64,  // 0-100
    pub summary: String,
}

pub struct ResearchJob {
    pub id: String,
    pub node_id: String,
    pub job_type: String,
    pub status: String,
    pub result_json: Option<String>,
    pub error_message: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}
```

### 4. Prompt Templates (prompts.rs)
Create structured prompt templates for:
- **expand_node**: Given node path (ancestors), generate 3-5 sub-niches with structured JSON output
- **discover_pain_points**: Given niche name + context, identify 3-5 pain points with user quotes
- **validate_niche**: Given niche + pain points + audiences, score market viability

Each prompt should return JSON. Use explicit JSON schema in the system prompt.

### 5. LLM Service (service.rs)
- Use `reqwest` for HTTP calls
- Support OpenAI-compatible API (`/v1/chat/completions`)
- Read API key from environment variable `OPENAI_API_KEY` or from a config file
- Implement response caching: hash(system_prompt + user_prompt + model) → cache lookup
- Parse JSON responses with serde
- Error handling with custom error types

### 6. Research Job Commands (research.rs)
New Tauri commands:
- `start_research(node_id, job_type)` → Creates job, returns job ID
- `get_research_status(job_id)` → Returns job status
- `get_research_results(node_id)` → Returns all completed results for a node
- `cancel_research(job_id)` → Cancels a queued/running job

For now, research runs synchronously in the command handler (we'll add async workers later).

### 7. Register New Commands
Add all new commands to `tauri::generate_handler![]` in main.rs.

## Technical Notes
- Cargo.toml needs: `reqwest = { version = "0.12", features = ["json"] }`, `sha2 = "0.10"`
- `source "$HOME/.cargo/env"` before any cargo commands
- Run `cargo check --manifest-path src-tauri/Cargo.toml` to verify
- Run `cargo clippy --manifest-path src-tauri/Cargo.toml` for linting
- Don't modify any frontend files
- Git commit with descriptive message
- Push to origin/master

## Definition of Done
- Database tables created on app start
- AI module structure in place
- Prompt templates defined for all 3 research types
- LLM service with caching
- Tauri commands registered and callable
- `cargo check` passes
- Committed and pushed
