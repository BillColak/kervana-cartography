// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod ai;
pub mod db;
mod import;
pub mod seed;

use rusqlite::{Connection, Result as SqliteResult};
use std::sync::Mutex;
use tauri::State;

use db::{CreateNodeInput, MarketEdge, MarketNode, UpdateNodeInput};

pub struct AppState {
    pub db: Mutex<Connection>,
}

fn init_database() -> SqliteResult<Connection> {
    let conn = Connection::open("kervana.db")?;
    db::init_tables(&conn)?;
    seed::seed_database(&conn)?;
    Ok(conn)
}

#[tauri::command]
fn get_all_nodes(state: State<AppState>) -> Result<Vec<MarketNode>, String> {
    let conn = state.db.lock().unwrap();
    db::get_all_nodes(&conn)
}

#[tauri::command]
fn get_node(id: String, state: State<AppState>) -> Result<MarketNode, String> {
    let conn = state.db.lock().unwrap();
    db::get_node(&conn, &id)
}

#[tauri::command]
fn create_node(input: CreateNodeInput, state: State<AppState>) -> Result<MarketNode, String> {
    let conn = state.db.lock().unwrap();
    db::create_node(&conn, &input)
}

#[tauri::command]
fn update_node(id: String, input: UpdateNodeInput, state: State<AppState>) -> Result<MarketNode, String> {
    let conn = state.db.lock().unwrap();
    db::update_node(&conn, &id, &input)
}

#[tauri::command]
fn delete_node(id: String, state: State<AppState>) -> Result<(), String> {
    let conn = state.db.lock().unwrap();
    db::delete_node(&conn, &id)
}

#[tauri::command]
fn get_edges(state: State<AppState>) -> Result<Vec<MarketEdge>, String> {
    let conn = state.db.lock().unwrap();
    db::get_edges(&conn)
}

#[tauri::command]
fn create_edge(source_id: String, target_id: String, color: String, state: State<AppState>) -> Result<MarketEdge, String> {
    let conn = state.db.lock().unwrap();
    db::create_edge(&conn, &source_id, &target_id, &color)
}

#[tauri::command]
fn delete_edge(id: String, state: State<AppState>) -> Result<(), String> {
    let conn = state.db.lock().unwrap();
    db::delete_edge(&conn, &id)
}

#[tauri::command]
fn search_nodes(query: String, state: State<AppState>) -> Result<Vec<MarketNode>, String> {
    let conn = state.db.lock().unwrap();
    db::search_nodes(&conn, &query)
}

#[tauri::command]
async fn embed_node(node_id: String, state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let embed_service = ai::embeddings::EmbeddingService::new()?;

    // Get node data
    let (label, markdown, tags, pain_points, audiences, level, ancestors) = {
        let db = state.db.lock().unwrap();
        let node = db::get_node(&db, &node_id)?;
        let tags: Vec<String> = node.tags.clone();
        let pain_points: Vec<String> = node.pain_points.clone();
        let audiences: Vec<String> = node.audiences.clone();

        // Get ancestors
        let mut anc = Vec::new();
        let mut current_id = node.parent_id.clone();
        while let Some(pid) = current_id {
            if let Ok(parent) = db::get_node(&db, &pid) {
                anc.push(parent.label.clone());
                current_id = parent.parent_id.clone();
            } else {
                break;
            }
        }
        anc.reverse();

        (node.label, node.markdown, tags, pain_points, audiences, node.level, anc)
    };

    // Build text to embed
    let text = ai::embeddings::build_node_text(&label, &markdown, &tags, &pain_points, &audiences, &level, &ancestors);
    let hash = ai::embeddings::content_hash(&text);

    // Check if already embedded with same content
    {
        let db = state.db.lock().unwrap();
        if let Some(existing) = ai::embeddings::get_embedding(&db, &node_id) {
            if existing.content_hash == hash {
                return Ok(serde_json::json!({
                    "status": "cached",
                    "node_id": node_id,
                    "dimensions": existing.dimensions,
                }));
            }
        }
    }

    // Generate embedding
    let embedding = embed_service.embed(&text).await?;
    let dimensions = embedding.len();

    // Store
    {
        let db = state.db.lock().unwrap();
        ai::embeddings::store_embedding(&db, &ai::embeddings::NodeEmbedding {
            node_id: node_id.clone(),
            content_hash: hash,
            embedding,
            model: embed_service.provider_name().to_string(),
            dimensions,
            created_at: chrono::Utc::now().timestamp_millis(),
        })?;
    }

    Ok(serde_json::json!({
        "status": "embedded",
        "node_id": node_id,
        "dimensions": dimensions,
    }))
}

#[tauri::command]
async fn embed_all_nodes(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let embed_service = ai::embeddings::EmbeddingService::new()?;

    let nodes = {
        let db = state.db.lock().unwrap();
        db::get_all_nodes(&db)?
    };

    let mut embedded = 0;
    let mut skipped = 0;
    let mut errors = 0;

    for node in &nodes {
        // Get ancestors
        let ancestors = {
            let db = state.db.lock().unwrap();
            let mut anc = Vec::new();
            let mut current_id = node.parent_id.clone();
            while let Some(pid) = current_id {
                if let Ok(parent) = db::get_node(&db, &pid) {
                    anc.push(parent.label.clone());
                    current_id = parent.parent_id.clone();
                } else {
                    break;
                }
            }
            anc.reverse();
            anc
        };

        let text = ai::embeddings::build_node_text(
            &node.label, &node.markdown, &node.tags, &node.pain_points, &node.audiences, &node.level, &ancestors,
        );
        let hash = ai::embeddings::content_hash(&text);

        // Check cache
        let needs_embed = {
            let db = state.db.lock().unwrap();
            match ai::embeddings::get_embedding(&db, &node.id) {
                Some(existing) => existing.content_hash != hash,
                None => true,
            }
        };

        if !needs_embed {
            skipped += 1;
            continue;
        }

        match embed_service.embed(&text).await {
            Ok(embedding) => {
                let dimensions = embedding.len();
                let db = state.db.lock().unwrap();
                let _ = ai::embeddings::store_embedding(&db, &ai::embeddings::NodeEmbedding {
                    node_id: node.id.clone(),
                    content_hash: hash,
                    embedding,
                    model: embed_service.provider_name().to_string(),
                    dimensions,
                    created_at: chrono::Utc::now().timestamp_millis(),
                });
                embedded += 1;
            }
            Err(_) => {
                errors += 1;
            }
        }
    }

    Ok(serde_json::json!({
        "total": nodes.len(),
        "embedded": embedded,
        "skipped": skipped,
        "errors": errors,
    }))
}

#[tauri::command]
fn get_embedding_status(state: State<AppState>) -> Result<serde_json::Value, String> {
    let db = state.db.lock().unwrap();
    let (embedded, total) = ai::embeddings::get_embedding_stats(&db);

    let provider_available = ai::embeddings::EmbeddingService::new().is_ok();

    Ok(serde_json::json!({
        "embeddedNodes": embedded,
        "totalNodes": total,
        "coverage": if total > 0 { (embedded as f64 / total as f64 * 100.0).round() } else { 0.0 },
        "providerAvailable": provider_available,
    }))
}

#[tauri::command]
fn find_similar_nodes(node_id: String, top_k: Option<usize>, state: State<AppState>) -> Result<Vec<serde_json::Value>, String> {
    let db = state.db.lock().unwrap();

    let node_emb = ai::embeddings::get_embedding(&db, &node_id)
        .ok_or_else(|| "Node has no embedding. Run 'Embed All' first.".to_string())?;

    let k = top_k.unwrap_or(5);
    let similar = ai::embeddings::find_similar(&db, &node_emb.embedding, &node_id, k);

    let results: Vec<serde_json::Value> = similar
        .into_iter()
        .filter_map(|(nid, score)| {
            db::get_node(&db, &nid).ok().map(|node| {
                serde_json::json!({
                    "nodeId": node.id,
                    "label": node.label,
                    "level": node.level,
                    "similarity": (score * 100.0).round() / 100.0,
                })
            })
        })
        .collect();

    Ok(results)
}

#[tauri::command]
fn get_ai_provider() -> Result<serde_json::Value, String> {
    match ai::service::LlmService::new() {
        Ok(service) => Ok(serde_json::json!({
            "provider": service.provider_name(),
            "available": true,
        })),
        Err(_) => Ok(serde_json::json!({
            "provider": null,
            "available": false,
            "hint": "Set ANTHROPIC_API_KEY or GEMINI_API_KEY"
        })),
    }
}

fn main() {
    // Load .env from project root (two levels up from src-tauri binary)
    dotenvy::dotenv().ok();

    let conn = init_database().expect("Failed to initialize database");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(AppState {
            db: Mutex::new(conn),
        })
        .invoke_handler(tauri::generate_handler![
            get_all_nodes,
            get_node,
            create_node,
            update_node,
            delete_node,
            get_edges,
            create_edge,
            delete_edge,
            search_nodes,
            ai::research::start_research,
            ai::research::get_research_status,
            ai::research::get_research_results,
            ai::research::cancel_research,
            import::import_obsidian_canvas,
            get_ai_provider,
            embed_node,
            embed_all_nodes,
            get_embedding_status,
            find_similar_nodes
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
