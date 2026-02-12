# Kervana AI Integration Design Document

## 1. Overview
**Goal**: Transform Kervana from a manual mapping tool into an active research assistant. The AI will autonomously expand market branches, discover hidden pain points, validate niche viability, and enable semantic search across user notes.

**Core Philosophy**: "AI as a plugin, not a wrapper." The core data structure (Market Tree) remains the source of truth, stored in SQLite. AI features enrich this structure non-destructively.

## 2. Architecture

### 2.1 Hybrid Architecture (Tauri Pattern)
* **Frontend (React/Zustand)**: Handles UI state, optimistic updates, and rendering the node graph. It does *not* call LLMs directly.
* **Backend (Rust)**:
  * **AI Service**: Centralized module for LLM orchestration.
  * **Task Queue**: Manages long-running research jobs (to avoid freezing the UI).
  * **Local Vector Store**: Runs a local embedding model (via `ort`) for privacy-preserving, zero-cost semantic search.
* **Database (SQLite)**: Stores the market tree, research cache, and vector embeddings.

### 2.2 Data Flow
`UI Action` → `Rust Command` → `Job Queue (SQLite)` → `Background Worker` → `LLM API` → `SQLite Update` → `Event Emit` → `UI Refresh`

---

## 3. Feature Specifications

### 3.1 Auto-Expand Nodes
**Trigger**: User right-clicks a niche node → "Expand with AI".
**Logic**: The system analyzes the parent path (e.g., "Health" → "Home Gym") and the current node ("Small Spaces") to generate contextual sub-niches.

**Prompt Strategy (Structured Output)**:
Use **JSON Mode** (available in OpenAI/Anthropic) to guarantee type safety.

**Prompt Template**:
```text
Role: Expert Market Cartographer.
Context: Parent Market = "{{parent_market}}", Current Niche = "{{current_niche}}".
Task: Identify 3-5 distinct, viable sub-niches within this niche.
Constraints:
- Sub-niches must be specific enough to have a dedicated audience.
- Avoid generic categories.
Output Format: JSON object with key "sub_niches".
```

**TypeScript Interface**:
```typescript
interface SubNicheSuggestion {
  label: string;
  description: string; // One sentence summary
  estimated_audience_size: 'Small' | 'Medium' | 'Large';
  keywords: string[];
}
```

### 3.2 Pain Point Discovery
**Goal**: Surface "hidden" frustrations that aren't obvious.

**Data Source Strategy**:
Instead of generic questions, use **Persona Simulation**. LLMs have ingested Reddit, Quora, and forums. We prompt them to *roleplay* distinct personas in that niche to surface specific complaints.

**Prompt Template**:
```text
Analyze the niche: "{{niche_name}}".
Simulate a discussion on a dedicated forum for this topic.
Identify 3 recurring "hair-on-fire" pain points that users complain about regarding current solutions.
For each pain point, provide:
1. The Core Frustration.
2. A hypothetical "User Quote" that perfectly captures the emotion.
3. Why existing solutions fail here.
```

### 3.3 Validation Scoring (0-100)
**Algorithm**: Hybrid AI-Rule System.
AI provides the *qualitative* assessment (1-10 scales), and a deterministic formula calculates the final score. This allows tuning the weights without re-running expensive prompts.

**Scoring Factors (AI inputs)**:
1. **Market Depth (D)**: 1-10 (Is there enough to sell?)
2. **Competition Intensity (C)**: 1-10 (10 = saturated)
3. **Pain Severity (P)**: 1-10 (Do people *need* this?)
4. **Monetization Potential (M)**: 1-10 (Can you sell high-ticket items?)

**Formula**:
```rust
let competition_score = 10.0 - competition_intensity; // Invert: Low competition is good
let final_score = (market_depth * 0.2)
                + (competition_score * 0.35)
                + (pain_severity * 0.35)
                + (monetization_potential * 0.1);
// Result is 0-10. Multiply by 10 for 0-100 scale.
```

### 3.4 Research Status Pipeline
**Problem**: Research takes 10-60 seconds. We cannot block the main thread.
**Solution**: Polling / Event-driven Queue.

1. **Status Enum**: `Idle` | `Queued` | `Researching` | `AnalysisComplete` | `Error`.
2. **Visual Feedback**:
   * **Node**: Shows a small "beaker" icon that bubbles (animates) during `Researching`.
   * **Sidebar**: "Research Queue" panel showing active jobs.

**Rust Implementation**:
Use `tokio::spawn` to run a background worker that watches a `research_queue` table in SQLite. When a job completes, it emits a Tauri event `research-complete` with the `node_id`.

### 3.5 API Architecture & Cost Management
**Provider Choice**:
* **OpenAI (GPT-4o)**: Best for complex reasoning (Validation, Pain Points).
* **OpenAI (GPT-4o-mini)**: Best for simple Expansion (fast, cheap).
* *Note: Anthropic is excellent but OpenAI's JSON mode is currently more "fire-and-forget" for structured data.*

**Caching Strategy (Critical)**:
Implement a `llm_cache` table.
* **Key**: SHA256 hash of `(system_prompt + user_prompt + model_params)`.
* **Value**: The raw JSON response.
* **TTL**: 30 days (Market data doesn't change *that* fast).
* *Benefit*: Re-clicking "Expand" on the same node is instant and free.

### 3.6 RAG for Notes
**Requirement**: Semantic search across user-written markdown notes.

**Implementation**:
1. **Model**: `all-MiniLM-L6-v2` (quantized).
2. **Runtime**: **ORT (ONNX Runtime)** running directly in the Rust backend.
   * *Pros*: No API costs, works offline, data stays local.
3. **Storage**:
   * Store embeddings as `BLOB` (binary serialized `Vec<f32>`) in SQLite.
   * Use a simple cosine similarity function in Rust (brute-force is fine for <10k notes) or compile `sqlite-vss` if scaling is needed.

---

## 4. Technical Implementation Details

### 4.1 Rust Backend Types

```rust
// src-tauri/src/ai/models.rs

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SubNiche {
    pub label: String,
    pub description: String,
    pub competition_level: CompetitionLevel,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ResearchResult {
    pub node_id: String,
    pub sub_niches: Vec<SubNiche>,
    pub pain_points: Vec<PainPoint>,
    pub validation_score: f32,
}

#[derive(Debug)]
pub enum ResearchStatus {
    Queued,
    Processing,
    Completed,
    Failed(String),
}
```

### 4.2 Database Schema

```sql
-- Track async research jobs
CREATE TABLE research_jobs (
    id TEXT PRIMARY KEY,
    node_id TEXT NOT NULL,
    job_type TEXT NOT NULL,    -- 'EXPAND' | 'DEEP_DIVE'
    status TEXT NOT NULL,      -- 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
    result_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Cache LLM responses
CREATE TABLE llm_cache (
    hash TEXT PRIMARY KEY,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    model_used TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Store embeddings for RAG
CREATE TABLE note_embeddings (
    note_id TEXT PRIMARY KEY,
    embedding BLOB NOT NULL,   -- 384-dimension vector (f32)
    FOREIGN KEY(note_id) REFERENCES notes(id) ON DELETE CASCADE
);
```

### 4.3 Frontend Integration (Zustand)

```typescript
// src/store/researchStore.ts

interface ResearchState {
  jobs: Record<string, ResearchJob>;
  startResearch: (nodeId: string) => Promise<void>;
  pollStatus: () => void;
}
```

---

*Generated by Gemini · Feb 12, 2026*
