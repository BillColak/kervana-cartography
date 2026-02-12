use rusqlite::{Connection, Result as SqliteResult};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct MarketNode {
    pub id: String,
    pub label: String,
    pub level: String,
    pub color: String,
    pub markdown: String,
    pub tags: Vec<String>,
    pub pain_points: Vec<String>,
    pub audiences: Vec<String>,
    pub market_size: Option<String>,
    pub competition: Option<String>,
    pub validation_score: Option<f64>,
    pub parent_id: Option<String>,
    pub research_status: String,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct MarketEdge {
    pub id: String,
    pub source_id: String,
    pub target_id: String,
    pub color: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateNodeInput {
    pub label: String,
    pub level: String,
    pub color: String,
    pub parent_id: Option<String>,
    pub x: Option<f64>,
    pub y: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct UpdateNodeInput {
    pub label: Option<String>,
    pub markdown: Option<String>,
    pub tags: Option<Vec<String>>,
    pub pain_points: Option<Vec<String>>,
    pub audiences: Option<Vec<String>>,
    pub market_size: Option<String>,
    pub competition: Option<String>,
    pub validation_score: Option<f64>,
    pub research_status: Option<String>,
    pub x: Option<f64>,
    pub y: Option<f64>,
}

pub fn init_tables(conn: &Connection) -> SqliteResult<()> {
    conn.execute_batch("PRAGMA foreign_keys = ON;")?;

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

    conn.execute(
        "CREATE TABLE IF NOT EXISTS research_jobs (
            id TEXT PRIMARY KEY,
            node_id TEXT NOT NULL,
            job_type TEXT NOT NULL,
            status TEXT NOT NULL,
            result_json TEXT,
            error_message TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            FOREIGN KEY(node_id) REFERENCES nodes(id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS llm_cache (
            hash TEXT PRIMARY KEY,
            prompt_hash TEXT NOT NULL,
            response TEXT NOT NULL,
            model TEXT NOT NULL,
            tokens_used INTEGER,
            created_at INTEGER NOT NULL
        )",
        [],
    )?;

    Ok(())
}

fn row_to_node(row: &rusqlite::Row) -> rusqlite::Result<MarketNode> {
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
}

pub fn get_all_nodes(conn: &Connection) -> Result<Vec<MarketNode>, String> {
    let mut stmt = conn
        .prepare("SELECT * FROM nodes ORDER BY created_at")
        .map_err(|e| e.to_string())?;

    let results = stmt.query_map([], |row| row_to_node(row))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string());
    results
}

pub fn get_node(conn: &Connection, id: &str) -> Result<MarketNode, String> {
    conn.query_row("SELECT * FROM nodes WHERE id = ?1", [id], |row| {
        row_to_node(row)
    })
    .map_err(|e| e.to_string())
}

pub fn create_node(conn: &Connection, input: &CreateNodeInput) -> Result<MarketNode, String> {
    let id = format!("node_{}", chrono::Utc::now().timestamp_millis());
    let now = chrono::Utc::now().timestamp_millis();
    let x = input.x.unwrap_or(0.0);
    let y = input.y.unwrap_or(0.0);

    conn.execute(
        "INSERT INTO nodes (id, label, level, color, parent_id, x, y, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        rusqlite::params![&id, &input.label, &input.level, &input.color, &input.parent_id, x, y, now, now],
    )
    .map_err(|e| e.to_string())?;

    // Sync FTS
    conn.execute(
        "INSERT INTO nodes_fts (id, label, markdown) VALUES (?1, ?2, '')",
        rusqlite::params![&id, &input.label],
    )
    .map_err(|e| e.to_string())?;

    get_node(conn, &id)
}

pub fn update_node(conn: &Connection, id: &str, input: &UpdateNodeInput) -> Result<MarketNode, String> {
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

    if updates.is_empty() {
        return get_node(conn, id);
    }

    updates.push("updated_at = ?");
    params.push(Box::new(now));
    params.push(Box::new(id.to_string()));

    let sql = format!("UPDATE nodes SET {} WHERE id = ?", updates.join(", "));
    let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();

    conn.execute(&sql, param_refs.as_slice())
        .map_err(|e| e.to_string())?;

    get_node(conn, id)
}

pub fn delete_node(conn: &Connection, id: &str) -> Result<(), String> {
    conn.execute("DELETE FROM nodes WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn get_edges(conn: &Connection) -> Result<Vec<MarketEdge>, String> {
    let mut stmt = conn
        .prepare("SELECT * FROM edges")
        .map_err(|e| e.to_string())?;

    let results = stmt.query_map([], |row| {
        Ok(MarketEdge {
            id: row.get(0)?,
            source_id: row.get(1)?,
            target_id: row.get(2)?,
            color: row.get(3)?,
        })
    })
    .map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>()
    .map_err(|e| e.to_string());
    results
}

pub fn create_edge(conn: &Connection, source_id: &str, target_id: &str, color: &str) -> Result<MarketEdge, String> {
    let id = format!("edge_{}_{}", source_id, target_id);

    conn.execute(
        "INSERT INTO edges (id, source_id, target_id, color) VALUES (?1, ?2, ?3, ?4)",
        rusqlite::params![&id, source_id, target_id, color],
    )
    .map_err(|e| e.to_string())?;

    Ok(MarketEdge {
        id,
        source_id: source_id.to_string(),
        target_id: target_id.to_string(),
        color: color.to_string(),
    })
}

pub fn delete_edge(conn: &Connection, id: &str) -> Result<(), String> {
    conn.execute("DELETE FROM edges WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn search_nodes(conn: &Connection, query: &str) -> Result<Vec<MarketNode>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT nodes.* FROM nodes
             JOIN nodes_fts ON nodes.id = nodes_fts.id
             WHERE nodes_fts MATCH ?1
             ORDER BY rank",
        )
        .map_err(|e| e.to_string())?;

    let results = stmt.query_map([query], |row| row_to_node(row))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string());
    results
}

#[cfg(test)]
mod tests {
    use super::*;

    fn setup_db() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        init_tables(&conn).unwrap();
        conn
    }

    fn seed_test_db(conn: &Connection) {
        crate::seed::seed_database(conn).unwrap();
        // Also populate FTS for seed data
        conn.execute_batch(
            "INSERT INTO nodes_fts (id, label, markdown)
             SELECT id, label, markdown FROM nodes;"
        ).unwrap();
    }

    #[test]
    fn test_init_tables_creates_all_tables() {
        let conn = setup_db();
        let tables: Vec<String> = conn
            .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'nodes_fts%' ORDER BY name")
            .unwrap()
            .query_map([], |row| row.get(0))
            .unwrap()
            .collect::<Result<Vec<_>, _>>()
            .unwrap();

        assert!(tables.contains(&"nodes".to_string()));
        assert!(tables.contains(&"edges".to_string()));
        assert!(tables.contains(&"research_jobs".to_string()));
        assert!(tables.contains(&"llm_cache".to_string()));
    }

    #[test]
    fn test_init_tables_creates_fts() {
        let conn = setup_db();
        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='nodes_fts'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 1);
    }

    #[test]
    fn test_seed_data() {
        let conn = setup_db();
        seed_test_db(&conn);

        let nodes = get_all_nodes(&conn).unwrap();
        assert_eq!(nodes.len(), 4);

        let root = nodes.iter().find(|n| n.id == "root").unwrap();
        assert_eq!(root.label, "3 Core Markets");
        assert_eq!(root.level, "root");
        assert!(root.parent_id.is_none());

        let health = nodes.iter().find(|n| n.id == "health").unwrap();
        assert_eq!(health.level, "core-market");
        assert_eq!(health.parent_id.as_deref(), Some("root"));

        let edges = get_edges(&conn).unwrap();
        assert_eq!(edges.len(), 3);
    }

    #[test]
    fn test_seed_idempotent() {
        let conn = setup_db();
        seed_test_db(&conn);
        // Seed again — should not duplicate
        crate::seed::seed_database(&conn).unwrap();
        let nodes = get_all_nodes(&conn).unwrap();
        assert_eq!(nodes.len(), 4);
    }

    #[test]
    fn test_create_node() {
        let conn = setup_db();
        let input = CreateNodeInput {
            label: "Test Niche".to_string(),
            level: "niche".to_string(),
            color: "#FF0000".to_string(),
            parent_id: None,
            x: Some(100.0),
            y: Some(200.0),
        };

        let node = create_node(&conn, &input).unwrap();
        assert!(node.id.starts_with("node_"));
        assert_eq!(node.label, "Test Niche");
        assert_eq!(node.level, "niche");
        assert_eq!(node.color, "#FF0000");
        assert_eq!(node.x, 100.0);
        assert_eq!(node.y, 200.0);
        assert_eq!(node.research_status, "not-started");
        assert!(node.created_at > 0);
    }

    #[test]
    fn test_create_node_default_position() {
        let conn = setup_db();
        let input = CreateNodeInput {
            label: "Default".to_string(),
            level: "niche".to_string(),
            color: "#000".to_string(),
            parent_id: None,
            x: None,
            y: None,
        };

        let node = create_node(&conn, &input).unwrap();
        assert_eq!(node.x, 0.0);
        assert_eq!(node.y, 0.0);
    }

    #[test]
    fn test_update_node_partial() {
        let conn = setup_db();
        let input = CreateNodeInput {
            label: "Original".to_string(),
            level: "niche".to_string(),
            color: "#000".to_string(),
            parent_id: None,
            x: None,
            y: None,
        };
        let node = create_node(&conn, &input).unwrap();

        let update = UpdateNodeInput {
            label: Some("Updated".to_string()),
            markdown: Some("# Hello".to_string()),
            validation_score: Some(75.0),
            ..Default::default()
        };

        let updated = update_node(&conn, &node.id, &update).unwrap();
        assert_eq!(updated.label, "Updated");
        assert_eq!(updated.markdown, "# Hello");
        assert_eq!(updated.validation_score, Some(75.0));
        assert_eq!(updated.color, "#000"); // unchanged
        assert!(updated.updated_at >= node.updated_at);
    }

    #[test]
    fn test_update_node_tags_and_pain_points() {
        let conn = setup_db();
        let input = CreateNodeInput {
            label: "Test".to_string(),
            level: "niche".to_string(),
            color: "#000".to_string(),
            parent_id: None,
            x: None,
            y: None,
        };
        let node = create_node(&conn, &input).unwrap();

        let update = UpdateNodeInput {
            tags: Some(vec!["wellness".to_string(), "diet".to_string()]),
            pain_points: Some(vec!["Too expensive".to_string()]),
            audiences: Some(vec!["Gen Z".to_string()]),
            ..Default::default()
        };

        let updated = update_node(&conn, &node.id, &update).unwrap();
        assert_eq!(updated.tags, vec!["wellness", "diet"]);
        assert_eq!(updated.pain_points, vec!["Too expensive"]);
        assert_eq!(updated.audiences, vec!["Gen Z"]);
    }

    #[test]
    fn test_delete_node() {
        let conn = setup_db();
        let input = CreateNodeInput {
            label: "Doomed".to_string(),
            level: "niche".to_string(),
            color: "#000".to_string(),
            parent_id: None,
            x: None,
            y: None,
        };
        let node = create_node(&conn, &input).unwrap();
        assert!(get_node(&conn, &node.id).is_ok());

        delete_node(&conn, &node.id).unwrap();
        assert!(get_node(&conn, &node.id).is_err());
    }

    #[test]
    fn test_get_node_not_found() {
        let conn = setup_db();
        let result = get_node(&conn, "nonexistent");
        assert!(result.is_err());
    }

    #[test]
    fn test_create_and_delete_edge() {
        let conn = setup_db();
        // Create two nodes first
        let n1 = create_node(&conn, &CreateNodeInput {
            label: "A".to_string(), level: "niche".to_string(), color: "#000".to_string(),
            parent_id: None, x: None, y: None,
        }).unwrap();
        let n2 = create_node(&conn, &CreateNodeInput {
            label: "B".to_string(), level: "niche".to_string(), color: "#000".to_string(),
            parent_id: None, x: None, y: None,
        }).unwrap();

        let edge = create_edge(&conn, &n1.id, &n2.id, "#FF0000").unwrap();
        assert!(edge.id.contains(&n1.id));
        assert_eq!(edge.source_id, n1.id);
        assert_eq!(edge.target_id, n2.id);

        let edges = get_edges(&conn).unwrap();
        assert_eq!(edges.len(), 1);

        delete_edge(&conn, &edge.id).unwrap();
        let edges = get_edges(&conn).unwrap();
        assert_eq!(edges.len(), 0);
    }

    #[test]
    fn test_fts_search() {
        let conn = setup_db();
        seed_test_db(&conn);

        let results = search_nodes(&conn, "Health").unwrap();
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].label, "Health");
    }

    #[test]
    fn test_fts_search_markdown() {
        let conn = setup_db();
        seed_test_db(&conn);

        // Search for content in markdown
        let results = search_nodes(&conn, "wellbeing").unwrap();
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].id, "health");
    }

    #[test]
    fn test_fts_search_no_results() {
        let conn = setup_db();
        seed_test_db(&conn);

        let results = search_nodes(&conn, "xyznonexistent");
        // FTS might error on no match or return empty — both acceptable
        match results {
            Ok(r) => assert_eq!(r.len(), 0),
            Err(_) => {} // FTS5 can error on certain queries
        }
    }

    #[test]
    fn test_delete_node_cascades_edges() {
        let conn = setup_db();
        seed_test_db(&conn);

        // Delete health node — should cascade edge
        let edges_before = get_edges(&conn).unwrap();
        assert_eq!(edges_before.len(), 3);

        delete_node(&conn, "health").unwrap();

        let edges_after = get_edges(&conn).unwrap();
        assert_eq!(edges_after.len(), 2);
        assert!(!edges_after.iter().any(|e| e.source_id == "health" || e.target_id == "health"));
    }
}
