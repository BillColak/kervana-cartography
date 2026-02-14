use sha2::{Digest, Sha256};
use rusqlite::Connection;
use serde::{Deserialize, Serialize};

// ─── Embedding provider detection ───

#[derive(Debug, Clone, PartialEq)]
pub enum EmbeddingProvider {
    Gemini,
    OpenAi,
}

pub struct EmbeddingService {
    client: reqwest::Client,
    provider: EmbeddingProvider,
    api_key: String,
    model: String,
}

// ─── API types ───

#[derive(Serialize)]
struct GeminiEmbedRequest {
    model: String,
    content: GeminiEmbedContent,
}

#[derive(Serialize)]
struct GeminiEmbedContent {
    parts: Vec<GeminiEmbedPart>,
}

#[derive(Serialize)]
struct GeminiEmbedPart {
    text: String,
}

#[derive(Deserialize)]
struct GeminiEmbedResponse {
    embedding: GeminiEmbedValues,
}

#[derive(Deserialize)]
struct GeminiEmbedValues {
    values: Vec<f32>,
}

#[derive(Serialize)]
struct OpenAiEmbedRequest {
    model: String,
    input: String,
}

#[derive(Deserialize)]
struct OpenAiEmbedResponse {
    data: Vec<OpenAiEmbedData>,
}

#[derive(Deserialize)]
struct OpenAiEmbedData {
    embedding: Vec<f32>,
}

// ─── Stored embedding ───

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeEmbedding {
    pub node_id: String,
    pub content_hash: String,
    pub embedding: Vec<f32>,
    pub model: String,
    pub dimensions: usize,
    pub created_at: i64,
}

// ─── Retrieval result ───

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RetrievedContext {
    pub node_id: String,
    pub label: String,
    pub score: f64,
    pub content: String,
}

impl EmbeddingService {
    pub fn new() -> Result<Self, String> {
        // Prefer Gemini (free embedding API), fall back to OpenAI
        if let Ok(key) = std::env::var("GEMINI_API_KEY") {
            let model = std::env::var("GEMINI_EMBED_MODEL")
                .unwrap_or_else(|_| "text-embedding-004".to_string());
            return Ok(Self {
                client: reqwest::Client::new(),
                provider: EmbeddingProvider::Gemini,
                api_key: key,
                model,
            });
        }

        if let Ok(key) = std::env::var("OPENAI_API_KEY") {
            let model = std::env::var("OPENAI_EMBED_MODEL")
                .unwrap_or_else(|_| "text-embedding-3-small".to_string());
            return Ok(Self {
                client: reqwest::Client::new(),
                provider: EmbeddingProvider::OpenAi,
                api_key: key,
                model,
            });
        }

        Err("No embedding API key found. Set GEMINI_API_KEY or OPENAI_API_KEY".to_string())
    }

    pub fn provider_name(&self) -> &str {
        match self.provider {
            EmbeddingProvider::Gemini => "gemini",
            EmbeddingProvider::OpenAi => "openai",
        }
    }

    /// Generate embedding for a text string
    pub async fn embed(&self, text: &str) -> Result<Vec<f32>, String> {
        match self.provider {
            EmbeddingProvider::Gemini => self.embed_gemini(text).await,
            EmbeddingProvider::OpenAi => self.embed_openai(text).await,
        }
    }

    async fn embed_gemini(&self, text: &str) -> Result<Vec<f32>, String> {
        let url = format!(
            "https://generativelanguage.googleapis.com/v1beta/models/{}:embedContent?key={}",
            self.model, self.api_key
        );

        let request = GeminiEmbedRequest {
            model: format!("models/{}", self.model),
            content: GeminiEmbedContent {
                parts: vec![GeminiEmbedPart {
                    text: text.to_string(),
                }],
            },
        };

        let response = self
            .client
            .post(&url)
            .json(&request)
            .send()
            .await
            .map_err(|e| format!("Gemini embed request failed: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            return Err(format!("Gemini embed API error ({}): {}", status, body));
        }

        let result: GeminiEmbedResponse = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse Gemini embed response: {}", e))?;

        Ok(result.embedding.values)
    }

    async fn embed_openai(&self, text: &str) -> Result<Vec<f32>, String> {
        let api_base = std::env::var("OPENAI_API_BASE")
            .unwrap_or_else(|_| "https://api.openai.com".to_string());

        let url = format!("{}/v1/embeddings", api_base);

        let request = OpenAiEmbedRequest {
            model: self.model.clone(),
            input: text.to_string(),
        };

        let response = self
            .client
            .post(&url)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .json(&request)
            .send()
            .await
            .map_err(|e| format!("OpenAI embed request failed: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            return Err(format!("OpenAI embed API error ({}): {}", status, body));
        }

        let result: OpenAiEmbedResponse = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse OpenAI embed response: {}", e))?;

        result
            .data
            .first()
            .map(|d| d.embedding.clone())
            .ok_or_else(|| "No embedding in OpenAI response".to_string())
    }
}

// ─── Content hashing (to skip re-embedding unchanged nodes) ───

pub fn content_hash(text: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(text.as_bytes());
    format!("{:x}", hasher.finalize())
}

/// Build the embeddable text for a node — combines all meaningful fields
pub fn build_node_text(
    label: &str,
    markdown: &str,
    tags: &[String],
    pain_points: &[String],
    audiences: &[String],
    level: &str,
    ancestors: &[String],
) -> String {
    let mut parts = Vec::new();

    // Ancestry path
    if !ancestors.is_empty() {
        parts.push(format!("Path: {} > {}", ancestors.join(" > "), label));
    } else {
        parts.push(format!("Market: {}", label));
    }

    parts.push(format!("Level: {}", level));

    if !markdown.is_empty() {
        parts.push(format!("Notes: {}", markdown));
    }

    if !tags.is_empty() {
        parts.push(format!("Tags: {}", tags.join(", ")));
    }

    if !pain_points.is_empty() {
        parts.push(format!("Pain points: {}", pain_points.join("; ")));
    }

    if !audiences.is_empty() {
        parts.push(format!("Audiences: {}", audiences.join(", ")));
    }

    parts.join("\n")
}

// ─── Vector math ───

pub fn cosine_similarity(a: &[f32], b: &[f32]) -> f64 {
    if a.len() != b.len() || a.is_empty() {
        return 0.0;
    }

    let mut dot = 0.0f64;
    let mut norm_a = 0.0f64;
    let mut norm_b = 0.0f64;

    for i in 0..a.len() {
        let ai = a[i] as f64;
        let bi = b[i] as f64;
        dot += ai * bi;
        norm_a += ai * ai;
        norm_b += bi * bi;
    }

    let denom = norm_a.sqrt() * norm_b.sqrt();
    if denom == 0.0 {
        0.0
    } else {
        dot / denom
    }
}

// ─── DB operations ───

pub fn store_embedding(conn: &Connection, emb: &NodeEmbedding) -> Result<(), String> {
    let embedding_json = serde_json::to_string(&emb.embedding)
        .map_err(|e| format!("Failed to serialize embedding: {}", e))?;

    conn.execute(
        "INSERT OR REPLACE INTO node_embeddings (node_id, content_hash, embedding, model, dimensions, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        rusqlite::params![
            emb.node_id,
            emb.content_hash,
            embedding_json,
            emb.model,
            emb.dimensions,
            emb.created_at,
        ],
    )
    .map_err(|e| format!("Failed to store embedding: {}", e))?;

    Ok(())
}

pub fn get_embedding(conn: &Connection, node_id: &str) -> Option<NodeEmbedding> {
    conn.query_row(
        "SELECT node_id, content_hash, embedding, model, dimensions, created_at FROM node_embeddings WHERE node_id = ?1",
        [node_id],
        |row| {
            let embedding_json: String = row.get(2)?;
            let embedding: Vec<f32> = serde_json::from_str(&embedding_json).unwrap_or_default();
            Ok(NodeEmbedding {
                node_id: row.get(0)?,
                content_hash: row.get(1)?,
                embedding,
                model: row.get(3)?,
                dimensions: row.get::<_, i64>(4)? as usize,
                created_at: row.get(5)?,
            })
        },
    )
    .ok()
}

pub fn get_all_embeddings(conn: &Connection) -> Vec<NodeEmbedding> {
    let mut stmt = conn
        .prepare("SELECT node_id, content_hash, embedding, model, dimensions, created_at FROM node_embeddings")
        .unwrap();

    stmt.query_map([], |row| {
        let embedding_json: String = row.get(2)?;
        let embedding: Vec<f32> = serde_json::from_str(&embedding_json).unwrap_or_default();
        Ok(NodeEmbedding {
            node_id: row.get(0)?,
            content_hash: row.get(1)?,
            embedding,
            model: row.get(3)?,
            dimensions: row.get::<_, i64>(4)? as usize,
            created_at: row.get(5)?,
        })
    })
    .unwrap()
    .filter_map(|r| r.ok())
    .collect()
}

pub fn delete_embedding(conn: &Connection, node_id: &str) -> Result<(), String> {
    conn.execute(
        "DELETE FROM node_embeddings WHERE node_id = ?1",
        [node_id],
    )
    .map_err(|e| format!("Failed to delete embedding: {}", e))?;
    Ok(())
}

pub fn get_embedding_stats(conn: &Connection) -> (usize, usize) {
    let total_nodes: usize = conn
        .query_row("SELECT COUNT(*) FROM nodes", [], |row| row.get(0))
        .unwrap_or(0);

    let embedded_nodes: usize = conn
        .query_row("SELECT COUNT(*) FROM node_embeddings", [], |row| row.get(0))
        .unwrap_or(0);

    (embedded_nodes, total_nodes)
}

/// Find top-K most similar nodes to a query embedding, excluding a specific node
pub fn find_similar(
    conn: &Connection,
    query_embedding: &[f32],
    exclude_node_id: &str,
    top_k: usize,
) -> Vec<(String, f64)> {
    let all = get_all_embeddings(conn);

    let mut scored: Vec<(String, f64)> = all
        .iter()
        .filter(|e| e.node_id != exclude_node_id)
        .map(|e| {
            let sim = cosine_similarity(query_embedding, &e.embedding);
            (e.node_id.clone(), sim)
        })
        .collect();

    scored.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
    scored.truncate(top_k);
    scored
}

/// Retrieve context for RAG: embed query, find similar nodes, return their content
pub fn retrieve_context(
    conn: &Connection,
    query_embedding: &[f32],
    exclude_node_id: &str,
    top_k: usize,
    min_score: f64,
) -> Vec<RetrievedContext> {
    let similar = find_similar(conn, query_embedding, exclude_node_id, top_k);

    similar
        .into_iter()
        .filter(|(_, score)| *score >= min_score)
        .filter_map(|(node_id, score)| {
            conn.query_row(
                "SELECT label, markdown, tags, pain_points, audiences FROM nodes WHERE id = ?1",
                [&node_id],
                |row| {
                    let label: String = row.get(0)?;
                    let markdown: String = row.get(1)?;
                    let tags_json: String = row.get(2)?;
                    let pains_json: String = row.get(3)?;
                    let auds_json: String = row.get(4)?;

                    let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();
                    let pains: Vec<String> = serde_json::from_str(&pains_json).unwrap_or_default();
                    let auds: Vec<String> = serde_json::from_str(&auds_json).unwrap_or_default();

                    let mut content = format!("## {}\n", label);
                    if !markdown.is_empty() {
                        content.push_str(&format!("{}\n", markdown));
                    }
                    if !tags.is_empty() {
                        content.push_str(&format!("Tags: {}\n", tags.join(", ")));
                    }
                    if !pains.is_empty() {
                        content.push_str(&format!("Pain points: {}\n", pains.join("; ")));
                    }
                    if !auds.is_empty() {
                        content.push_str(&format!("Audiences: {}\n", auds.join(", ")));
                    }

                    Ok(RetrievedContext {
                        node_id: node_id.clone(),
                        label,
                        score,
                        content,
                    })
                },
            )
            .ok()
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db;

    #[test]
    fn test_cosine_similarity_identical() {
        let a = vec![1.0, 0.0, 0.0];
        let b = vec![1.0, 0.0, 0.0];
        let sim = cosine_similarity(&a, &b);
        assert!((sim - 1.0).abs() < 1e-6);
    }

    #[test]
    fn test_cosine_similarity_orthogonal() {
        let a = vec![1.0, 0.0, 0.0];
        let b = vec![0.0, 1.0, 0.0];
        let sim = cosine_similarity(&a, &b);
        assert!(sim.abs() < 1e-6);
    }

    #[test]
    fn test_cosine_similarity_opposite() {
        let a = vec![1.0, 0.0];
        let b = vec![-1.0, 0.0];
        let sim = cosine_similarity(&a, &b);
        assert!((sim - (-1.0)).abs() < 1e-6);
    }

    #[test]
    fn test_cosine_similarity_real_vectors() {
        let a = vec![0.1, 0.3, 0.5, 0.7];
        let b = vec![0.2, 0.4, 0.6, 0.8];
        let sim = cosine_similarity(&a, &b);
        assert!(sim > 0.99); // Very similar vectors
    }

    #[test]
    fn test_cosine_similarity_empty() {
        let sim = cosine_similarity(&[], &[]);
        assert_eq!(sim, 0.0);
    }

    #[test]
    fn test_cosine_similarity_different_lengths() {
        let a = vec![1.0, 2.0];
        let b = vec![1.0, 2.0, 3.0];
        let sim = cosine_similarity(&a, &b);
        assert_eq!(sim, 0.0);
    }

    #[test]
    fn test_content_hash_deterministic() {
        let h1 = content_hash("hello world");
        let h2 = content_hash("hello world");
        assert_eq!(h1, h2);
    }

    #[test]
    fn test_content_hash_different() {
        let h1 = content_hash("hello");
        let h2 = content_hash("world");
        assert_ne!(h1, h2);
    }

    #[test]
    fn test_build_node_text() {
        let text = build_node_text(
            "Fitness",
            "Notes about fitness",
            &["health".to_string(), "exercise".to_string()],
            &["Expensive gyms".to_string()],
            &["Adults 25-45".to_string()],
            "niche",
            &["Health".to_string()],
        );
        assert!(text.contains("Health > Fitness"));
        assert!(text.contains("Notes about fitness"));
        assert!(text.contains("health, exercise"));
        assert!(text.contains("Expensive gyms"));
        assert!(text.contains("Adults 25-45"));
    }

    #[test]
    fn test_build_node_text_no_ancestors() {
        let text = build_node_text("Health", "", &[], &[], &[], "core-market", &[]);
        assert!(text.contains("Market: Health"));
        assert!(!text.contains(" > "));
    }

    #[test]
    fn test_store_and_get_embedding() {
        let conn = Connection::open_in_memory().unwrap();
        db::init_tables(&conn).unwrap();

        // Create a test node first
        let now = chrono::Utc::now().timestamp_millis();
        conn.execute(
            "INSERT INTO nodes (id, label, level, color, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            rusqlite::params!["node1", "Test", "niche", "#000", now, now],
        ).unwrap();

        let emb = NodeEmbedding {
            node_id: "node1".to_string(),
            content_hash: "abc123".to_string(),
            embedding: vec![0.1, 0.2, 0.3, 0.4, 0.5],
            model: "test-model".to_string(),
            dimensions: 5,
            created_at: now,
        };

        store_embedding(&conn, &emb).unwrap();

        let retrieved = get_embedding(&conn, "node1");
        assert!(retrieved.is_some());
        let r = retrieved.unwrap();
        assert_eq!(r.node_id, "node1");
        assert_eq!(r.embedding.len(), 5);
        assert!((r.embedding[0] - 0.1).abs() < 1e-6);
    }

    #[test]
    fn test_embedding_miss() {
        let conn = Connection::open_in_memory().unwrap();
        db::init_tables(&conn).unwrap();
        assert!(get_embedding(&conn, "nonexistent").is_none());
    }

    #[test]
    fn test_find_similar() {
        let conn = Connection::open_in_memory().unwrap();
        db::init_tables(&conn).unwrap();

        let now = chrono::Utc::now().timestamp_millis();
        for (id, label) in &[("n1", "A"), ("n2", "B"), ("n3", "C")] {
            conn.execute(
                "INSERT INTO nodes (id, label, level, color, created_at, updated_at) VALUES (?1, ?2, 'niche', '#000', ?3, ?4)",
                rusqlite::params![id, label, now, now],
            ).unwrap();
        }

        // Store embeddings: n1 and n2 are similar, n3 is different
        store_embedding(&conn, &NodeEmbedding {
            node_id: "n1".to_string(),
            content_hash: "h1".to_string(),
            embedding: vec![1.0, 0.0, 0.0],
            model: "test".to_string(),
            dimensions: 3,
            created_at: now,
        }).unwrap();

        store_embedding(&conn, &NodeEmbedding {
            node_id: "n2".to_string(),
            content_hash: "h2".to_string(),
            embedding: vec![0.9, 0.1, 0.0],
            model: "test".to_string(),
            dimensions: 3,
            created_at: now,
        }).unwrap();

        store_embedding(&conn, &NodeEmbedding {
            node_id: "n3".to_string(),
            content_hash: "h3".to_string(),
            embedding: vec![0.0, 0.0, 1.0],
            model: "test".to_string(),
            dimensions: 3,
            created_at: now,
        }).unwrap();

        // Query similar to n1's embedding, excluding n1
        let results = find_similar(&conn, &[1.0, 0.0, 0.0], "n1", 2);
        assert_eq!(results.len(), 2);
        assert_eq!(results[0].0, "n2"); // n2 is most similar
        assert!(results[0].1 > results[1].1); // n2 score > n3 score
    }

    #[test]
    fn test_embedding_stats() {
        let conn = Connection::open_in_memory().unwrap();
        db::init_tables(&conn).unwrap();

        let now = chrono::Utc::now().timestamp_millis();
        conn.execute(
            "INSERT INTO nodes (id, label, level, color, created_at, updated_at) VALUES ('n1', 'A', 'niche', '#000', ?1, ?2)",
            rusqlite::params![now, now],
        ).unwrap();
        conn.execute(
            "INSERT INTO nodes (id, label, level, color, created_at, updated_at) VALUES ('n2', 'B', 'niche', '#000', ?1, ?2)",
            rusqlite::params![now, now],
        ).unwrap();

        let (embedded, total) = get_embedding_stats(&conn);
        assert_eq!(embedded, 0);
        assert_eq!(total, 2);

        store_embedding(&conn, &NodeEmbedding {
            node_id: "n1".to_string(),
            content_hash: "h".to_string(),
            embedding: vec![1.0],
            model: "t".to_string(),
            dimensions: 1,
            created_at: now,
        }).unwrap();

        let (embedded, total) = get_embedding_stats(&conn);
        assert_eq!(embedded, 1);
        assert_eq!(total, 2);
    }

    #[test]
    fn test_delete_embedding() {
        let conn = Connection::open_in_memory().unwrap();
        db::init_tables(&conn).unwrap();

        let now = chrono::Utc::now().timestamp_millis();
        conn.execute(
            "INSERT INTO nodes (id, label, level, color, created_at, updated_at) VALUES ('n1', 'A', 'niche', '#000', ?1, ?2)",
            rusqlite::params![now, now],
        ).unwrap();

        store_embedding(&conn, &NodeEmbedding {
            node_id: "n1".to_string(),
            content_hash: "h".to_string(),
            embedding: vec![1.0, 2.0],
            model: "t".to_string(),
            dimensions: 2,
            created_at: now,
        }).unwrap();

        assert!(get_embedding(&conn, "n1").is_some());
        delete_embedding(&conn, "n1").unwrap();
        assert!(get_embedding(&conn, "n1").is_none());
    }

    #[test]
    fn test_provider_detection_no_keys() {
        std::env::remove_var("GEMINI_API_KEY");
        std::env::remove_var("OPENAI_API_KEY");
        let result = EmbeddingService::new();
        assert!(result.is_err());
    }
}
