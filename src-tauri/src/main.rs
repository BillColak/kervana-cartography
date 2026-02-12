// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod seed;

use rusqlite::{Connection, Result as SqliteResult};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct MarketNode {
    id: String,
    label: String,
    level: String,
    color: String,
    markdown: String,
    tags: Vec<String>,
    pain_points: Vec<String>,
    audiences: Vec<String>,
    market_size: Option<String>,
    competition: Option<String>,
    validation_score: Option<f64>,
    parent_id: Option<String>,
    research_status: String,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
    created_at: i64,
    updated_at: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct MarketEdge {
    id: String,
    source_id: String,
    target_id: String,
    color: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateNodeInput {
    label: String,
    level: String,
    color: String,
    parent_id: Option<String>,
    x: Option<f64>,
    y: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct UpdateNodeInput {
    label: Option<String>,
    markdown: Option<String>,
    tags: Option<Vec<String>>,
    pain_points: Option<Vec<String>>,
    audiences: Option<Vec<String>>,
    market_size: Option<String>,
    competition: Option<String>,
    validation_score: Option<f64>,
    research_status: Option<String>,
    x: Option<f64>,
    y: Option<f64>,
}

struct AppState {
    db: Mutex<Connection>,
}

fn init_database() -> SqliteResult<Connection> {
    let conn = Connection::open("kervana.db")?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS nodes (
            id TEXT PRIMARY KEY,
            label TEXT NOT NULL,
            level TEXT NOT NULL,
            color TEXT NOT NULL,
            markdown TEXT DEFAULT '',
            tags TEXT DEFAULT '[]',
            pain_points TEXT DEFAULT '[]',
            audiences TEXT DEFAULT '[]',
            market_size TEXT,
            competition TEXT,
            validation_score REAL,
            parent_id TEXT,
            research_status TEXT DEFAULT 'not-started',
            x REAL DEFAULT 0,
            y REAL DEFAULT 0,
            width REAL DEFAULT 200,
            height REAL DEFAULT 100,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS edges (
            id TEXT PRIMARY KEY,
            source_id TEXT NOT NULL,
            target_id TEXT NOT NULL,
            color TEXT NOT NULL,
            FOREIGN KEY(source_id) REFERENCES nodes(id) ON DELETE CASCADE,
            FOREIGN KEY(target_id) REFERENCES nodes(id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE VIRTUAL TABLE IF NOT EXISTS nodes_fts USING fts5(
            id UNINDEXED,
            label,
            markdown,
            content='nodes',
            content_rowid='rowid'
        )",
        [],
    )?;

    // Seed with initial data
    seed::seed_database(&conn)?;

    Ok(conn)
}

#[tauri::command]
fn get_all_nodes(state: State<AppState>) -> Result<Vec<MarketNode>, String> {
    let db = state.db.lock().unwrap();
    let mut stmt = db
        .prepare("SELECT * FROM nodes ORDER BY created_at")
        .map_err(|e| e.to_string())?;

    let nodes = stmt
        .query_map([], |row| {
            Ok(MarketNode {
                id: row.get(0)?,
                label: row.get(1)?,
                level: row.get(2)?,
                color: row.get(3)?,
                markdown: row.get(4)?,
                tags: serde_json::from_str(&row.get::<_, String>(5)?).unwrap_or_default(),
                pain_points: serde_json::from_str(&row.get::<_, String>(6)?).unwrap_or_default(),
                audiences: serde_json::from_str(&row.get::<_, String>(7)?).unwrap_or_default(),
                market_size: row.get(8)?,
                competition: row.get(9)?,
                validation_score: row.get(10)?,
                parent_id: row.get(11)?,
                research_status: row.get(12)?,
                x: row.get(13)?,
                y: row.get(14)?,
                width: row.get(15)?,
                height: row.get(16)?,
                created_at: row.get(17)?,
                updated_at: row.get(18)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(nodes)
}

#[tauri::command]
fn get_node(id: String, state: State<AppState>) -> Result<MarketNode, String> {
    let db = state.db.lock().unwrap();
    let mut stmt = db
        .prepare("SELECT * FROM nodes WHERE id = ?1")
        .map_err(|e| e.to_string())?;

    let node = stmt
        .query_row([&id], |row| {
            Ok(MarketNode {
                id: row.get(0)?,
                label: row.get(1)?,
                level: row.get(2)?,
                color: row.get(3)?,
                markdown: row.get(4)?,
                tags: serde_json::from_str(&row.get::<_, String>(5)?).unwrap_or_default(),
                pain_points: serde_json::from_str(&row.get::<_, String>(6)?).unwrap_or_default(),
                audiences: serde_json::from_str(&row.get::<_, String>(7)?).unwrap_or_default(),
                market_size: row.get(8)?,
                competition: row.get(9)?,
                validation_score: row.get(10)?,
                parent_id: row.get(11)?,
                research_status: row.get(12)?,
                x: row.get(13)?,
                y: row.get(14)?,
                width: row.get(15)?,
                height: row.get(16)?,
                created_at: row.get(17)?,
                updated_at: row.get(18)?,
            })
        })
        .map_err(|e| e.to_string())?;

    Ok(node)
}

#[tauri::command]
fn create_node(input: CreateNodeInput, state: State<AppState>) -> Result<MarketNode, String> {
    let id = format!("node_{}", chrono::Utc::now().timestamp_millis());
    let now = chrono::Utc::now().timestamp_millis();
    let x = input.x.unwrap_or(0.0);
    let y = input.y.unwrap_or(0.0);

    {
        let db = state.db.lock().unwrap();
        db.execute(
            "INSERT INTO nodes (id, label, level, color, parent_id, x, y, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            rusqlite::params![
                &id,
                &input.label,
                &input.level,
                &input.color,
                &input.parent_id,
                x,
                y,
                now,
                now
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    get_node(id, state)
}

#[tauri::command]
fn update_node(
    id: String,
    input: UpdateNodeInput,
    state: State<AppState>,
) -> Result<MarketNode, String> {
    let now = chrono::Utc::now().timestamp_millis();

    let mut updates = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(label) = &input.label {
        updates.push("label = ?");
        params.push(Box::new(label.clone()));
    }
    if let Some(markdown) = &input.markdown {
        updates.push("markdown = ?");
        params.push(Box::new(markdown.clone()));
    }
    if let Some(tags) = &input.tags {
        updates.push("tags = ?");
        params.push(Box::new(serde_json::to_string(tags).unwrap()));
    }
    if let Some(pain_points) = &input.pain_points {
        updates.push("pain_points = ?");
        params.push(Box::new(serde_json::to_string(pain_points).unwrap()));
    }
    if let Some(audiences) = &input.audiences {
        updates.push("audiences = ?");
        params.push(Box::new(serde_json::to_string(audiences).unwrap()));
    }
    if let Some(market_size) = &input.market_size {
        updates.push("market_size = ?");
        params.push(Box::new(market_size.clone()));
    }
    if let Some(competition) = &input.competition {
        updates.push("competition = ?");
        params.push(Box::new(competition.clone()));
    }
    if let Some(validation_score) = input.validation_score {
        updates.push("validation_score = ?");
        params.push(Box::new(validation_score));
    }
    if let Some(research_status) = &input.research_status {
        updates.push("research_status = ?");
        params.push(Box::new(research_status.clone()));
    }
    if let Some(x) = input.x {
        updates.push("x = ?");
        params.push(Box::new(x));
    }
    if let Some(y) = input.y {
        updates.push("y = ?");
        params.push(Box::new(y));
    }

    updates.push("updated_at = ?");
    params.push(Box::new(now));
    params.push(Box::new(id.clone()));

    let sql = format!("UPDATE nodes SET {} WHERE id = ?", updates.join(", "));
    let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();

    {
        let db = state.db.lock().unwrap();
        db.execute(&sql, param_refs.as_slice())
            .map_err(|e| e.to_string())?;
    }

    get_node(id, state)
}

#[tauri::command]
fn delete_node(id: String, state: State<AppState>) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    db.execute("DELETE FROM nodes WHERE id = ?1", [&id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn get_edges(state: State<AppState>) -> Result<Vec<MarketEdge>, String> {
    let db = state.db.lock().unwrap();
    let mut stmt = db
        .prepare("SELECT * FROM edges")
        .map_err(|e| e.to_string())?;

    let edges = stmt
        .query_map([], |row| {
            Ok(MarketEdge {
                id: row.get(0)?,
                source_id: row.get(1)?,
                target_id: row.get(2)?,
                color: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(edges)
}

#[tauri::command]
fn create_edge(
    source_id: String,
    target_id: String,
    color: String,
    state: State<AppState>,
) -> Result<MarketEdge, String> {
    let db = state.db.lock().unwrap();
    let id = format!("edge_{}_{}", source_id, target_id);

    db.execute(
        "INSERT INTO edges (id, source_id, target_id, color) VALUES (?1, ?2, ?3, ?4)",
        rusqlite::params![&id, &source_id, &target_id, &color],
    )
    .map_err(|e| e.to_string())?;

    Ok(MarketEdge {
        id,
        source_id,
        target_id,
        color,
    })
}

#[tauri::command]
fn delete_edge(id: String, state: State<AppState>) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    db.execute("DELETE FROM edges WHERE id = ?1", [&id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn search_nodes(query: String, state: State<AppState>) -> Result<Vec<MarketNode>, String> {
    let db = state.db.lock().unwrap();
    let mut stmt = db
        .prepare(
            "SELECT nodes.* FROM nodes
             JOIN nodes_fts ON nodes.id = nodes_fts.id
             WHERE nodes_fts MATCH ?1
             ORDER BY rank",
        )
        .map_err(|e| e.to_string())?;

    let nodes = stmt
        .query_map([&query], |row| {
            Ok(MarketNode {
                id: row.get(0)?,
                label: row.get(1)?,
                level: row.get(2)?,
                color: row.get(3)?,
                markdown: row.get(4)?,
                tags: serde_json::from_str(&row.get::<_, String>(5)?).unwrap_or_default(),
                pain_points: serde_json::from_str(&row.get::<_, String>(6)?).unwrap_or_default(),
                audiences: serde_json::from_str(&row.get::<_, String>(7)?).unwrap_or_default(),
                market_size: row.get(8)?,
                competition: row.get(9)?,
                validation_score: row.get(10)?,
                parent_id: row.get(11)?,
                research_status: row.get(12)?,
                x: row.get(13)?,
                y: row.get(14)?,
                width: row.get(15)?,
                height: row.get(16)?,
                created_at: row.get(17)?,
                updated_at: row.get(18)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(nodes)
}

fn main() {
    let conn = init_database().expect("Failed to initialize database");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(AppState { db: Mutex::new(conn) })
        .invoke_handler(tauri::generate_handler![
            get_all_nodes,
            get_node,
            create_node,
            update_node,
            delete_node,
            get_edges,
            create_edge,
            delete_edge,
            search_nodes
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
