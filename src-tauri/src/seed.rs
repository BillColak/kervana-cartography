use rusqlite::Connection;

pub fn seed_database(conn: &Connection) -> rusqlite::Result<()> {
    // Check if already seeded
    let count: i64 = conn.query_row("SELECT COUNT(*) FROM nodes", [], |row| row.get(0))?;
    if count > 0 {
        return Ok(()); // Already seeded
    }

    let now = chrono::Utc::now().timestamp_millis();

    // Root node
    conn.execute(
        "INSERT INTO nodes (id, label, level, color, markdown, parent_id, x, y, width, height, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
        rusqlite::params![
            "root",
            "3 Core Markets",
            "root",
            "#6B7280",
            "The three fundamental human desires that drive all markets.",
            None::<String>,
            400.0,
            50.0,
            200.0,
            100.0,
            now,
            now
        ],
    )?;

    // Health market
    conn.execute(
        "INSERT INTO nodes (id, label, level, color, markdown, parent_id, x, y, width, height, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
        rusqlite::params![
            "health",
            "Health",
            "core-market",
            "#06B6D4",
            "Physical, mental, and emotional wellbeing.",
            "root",
            100.0,
            250.0,
            200.0,
            100.0,
            now,
            now
        ],
    )?;

    // Wealth market
    conn.execute(
        "INSERT INTO nodes (id, label, level, color, markdown, parent_id, x, y, width, height, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
        rusqlite::params![
            "wealth",
            "Wealth",
            "core-market",
            "#A855F7",
            "Financial security and prosperity.",
            "root",
            400.0,
            250.0,
            200.0,
            100.0,
            now,
            now
        ],
    )?;

    // Relationships market
    conn.execute(
        "INSERT INTO nodes (id, label, level, color, markdown, parent_id, x, y, width, height, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
        rusqlite::params![
            "relationships",
            "Relationships",
            "core-market",
            "#EF4444",
            "Love, connection, and social bonds.",
            "root",
            700.0,
            250.0,
            200.0,
            100.0,
            now,
            now
        ],
    )?;

    // Create edges
    conn.execute(
        "INSERT INTO edges (id, source_id, target_id, color) VALUES (?1, ?2, ?3, ?4)",
        rusqlite::params!["edge_root_health", "root", "health", "#06B6D4"],
    )?;

    conn.execute(
        "INSERT INTO edges (id, source_id, target_id, color) VALUES (?1, ?2, ?3, ?4)",
        rusqlite::params!["edge_root_wealth", "root", "wealth", "#A855F7"],
    )?;

    conn.execute(
        "INSERT INTO edges (id, source_id, target_id, color) VALUES (?1, ?2, ?3, ?4)",
        rusqlite::params!["edge_root_relationships", "root", "relationships", "#EF4444"],
    )?;

    Ok(())
}
