use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;
use tauri::State;

use crate::AppState;

/// Obsidian canvas node format
#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct ObsidianNode {
    id: String,
    #[serde(rename = "type")]
    node_type: String,
    file: Option<String>,
    text: Option<String>,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
    color: Option<String>,
}

/// Obsidian canvas edge format
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
#[allow(dead_code)]
struct ObsidianEdge {
    id: String,
    from_node: String,
    to_node: String,
}

/// Obsidian canvas file format
#[derive(Debug, Deserialize)]
struct ObsidianCanvas {
    nodes: Vec<ObsidianNode>,
    edges: Vec<ObsidianEdge>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportResult {
    pub nodes_imported: usize,
    pub edges_imported: usize,
    pub files_read: usize,
    pub errors: Vec<String>,
}

/// Map Obsidian color codes to hex colors
fn obsidian_color_to_hex(color: &str) -> &str {
    match color {
        "1" => "#EF4444", // red
        "2" => "#F97316", // orange
        "3" => "#EAB308", // yellow
        "4" => "#22C55E", // green
        "5" => "#06B6D4", // cyan
        "6" => "#8B5CF6", // purple
        _ => "#6B7280",   // gray default
    }
}

/// Determine node level based on depth in the tree
fn determine_level(depth: usize) -> &'static str {
    match depth {
        0 => "root",
        1 => "core-market",
        2 => "submarket",
        3 => "niche",
        _ => "sub-niche",
    }
}

/// Read markdown content from a file path relative to vault root
fn read_markdown(vault_path: &Path, file_path: &str) -> Option<String> {
    let full_path = vault_path.join(file_path);
    std::fs::read_to_string(&full_path).ok()
}

/// Extract label from file path (filename without extension)
fn label_from_file(file_path: &str) -> String {
    Path::new(file_path)
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("Untitled")
        .to_string()
}

/// Build depth map from edges
fn build_depth_map(edges: &[ObsidianEdge], root_ids: &[String]) -> HashMap<String, usize> {
    let mut depths: HashMap<String, usize> = HashMap::new();
    let mut children_map: HashMap<String, Vec<String>> = HashMap::new();

    for edge in edges {
        children_map
            .entry(edge.from_node.clone())
            .or_default()
            .push(edge.to_node.clone());
    }

    // BFS from roots
    let mut queue: Vec<(String, usize)> = root_ids.iter().map(|id| (id.clone(), 0)).collect();

    while let Some((node_id, depth)) = queue.pop() {
        if depths.contains_key(&node_id) {
            continue;
        }
        depths.insert(node_id.clone(), depth);

        if let Some(children) = children_map.get(&node_id) {
            for child in children {
                if !depths.contains_key(child) {
                    queue.push((child.clone(), depth + 1));
                }
            }
        }
    }

    depths
}

/// Find parent of each node from edges
fn build_parent_map(edges: &[ObsidianEdge]) -> HashMap<String, String> {
    let mut parents = HashMap::new();
    for edge in edges {
        parents.insert(edge.to_node.clone(), edge.from_node.clone());
    }
    parents
}

#[tauri::command]
pub fn import_obsidian_canvas(
    canvas_path: String,
    vault_path: String,
    clear_existing: bool,
    state: State<AppState>,
) -> Result<ImportResult, String> {
    let canvas_content = std::fs::read_to_string(&canvas_path)
        .map_err(|e| format!("Failed to read canvas file: {}", e))?;

    let canvas: ObsidianCanvas = serde_json::from_str(&canvas_content)
        .map_err(|e| format!("Failed to parse canvas JSON: {}", e))?;

    let vault = Path::new(&vault_path);
    let conn = state.db.lock().unwrap();

    // Optionally clear existing data
    if clear_existing {
        conn.execute_batch(
            "DELETE FROM research_jobs; DELETE FROM edges; DELETE FROM nodes; DELETE FROM nodes_fts;",
        )
        .map_err(|e| e.to_string())?;
    }

    let mut errors = Vec::new();
    let mut nodes_imported = 0;
    let mut edges_imported = 0;
    let mut files_read = 0;

    // Find root nodes (nodes that are not targets of any edge)
    let child_ids: std::collections::HashSet<String> = canvas.edges.iter().map(|e| e.to_node.clone()).collect();
    let root_ids: Vec<String> = canvas
        .nodes
        .iter()
        .filter(|n| !child_ids.contains(&n.id))
        .map(|n| n.id.clone())
        .collect();

    let depth_map = build_depth_map(&canvas.edges, &root_ids);
    let parent_map = build_parent_map(&canvas.edges);

    // Map obsidian IDs to new IDs
    let mut id_map: HashMap<String, String> = HashMap::new();
    let now = chrono::Utc::now().timestamp_millis();

    // Import nodes
    for node in &canvas.nodes {
        let label = if let Some(file) = &node.file {
            label_from_file(file)
        } else if let Some(text) = &node.text {
            text.lines().next().unwrap_or("Untitled").to_string()
        } else {
            "Untitled".to_string()
        };

        let color = node
            .color
            .as_deref()
            .map(obsidian_color_to_hex)
            .unwrap_or("#6B7280");

        let depth = depth_map.get(&node.id).copied().unwrap_or(0);
        let level = determine_level(depth);

        let new_id = if clear_existing {
            node.id.clone() // Preserve original IDs when clearing
        } else {
            format!("obs_{}_{}", node.id, now)
        };

        let parent_id = parent_map.get(&node.id).and_then(|pid| {
            if clear_existing {
                Some(pid.clone())
            } else {
                id_map.get(pid).cloned()
            }
        });

        // Read markdown from file
        let mut markdown = String::new();
        if let Some(file) = &node.file {
            if let Some(content) = read_markdown(vault, file) {
                markdown = content;
                files_read += 1;
            } else {
                errors.push(format!("Could not read: {}", file));
            }
        } else if let Some(text) = &node.text {
            markdown = text.clone();
        }

        let result = conn.execute(
            "INSERT OR REPLACE INTO nodes (id, label, level, color, markdown, parent_id, x, y, width, height, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
            rusqlite::params![
                &new_id, &label, level, color, &markdown,
                &parent_id,
                node.x, node.y, node.width, node.height,
                now, now
            ],
        );

        match result {
            Ok(_) => {
                // Update FTS
                let _ = conn.execute(
                    "INSERT OR REPLACE INTO nodes_fts (id, label, markdown) VALUES (?1, ?2, ?3)",
                    rusqlite::params![&new_id, &label, &markdown],
                );
                id_map.insert(node.id.clone(), new_id);
                nodes_imported += 1;
            }
            Err(e) => {
                errors.push(format!("Failed to import node '{}': {}", label, e));
            }
        }
    }

    // Import edges
    for edge in &canvas.edges {
        let source = if clear_existing {
            Some(edge.from_node.clone())
        } else {
            id_map.get(&edge.from_node).cloned()
        };

        let target = if clear_existing {
            Some(edge.to_node.clone())
        } else {
            id_map.get(&edge.to_node).cloned()
        };

        if let (Some(source_id), Some(target_id)) = (source, target) {
            // Get color from source node
            let source_node = canvas.nodes.iter().find(|n| n.id == edge.from_node);
            let color = source_node
                .and_then(|n| n.color.as_deref())
                .map(obsidian_color_to_hex)
                .unwrap_or("#6B7280");

            let edge_id = if clear_existing {
                format!("edge_{}_{}", source_id, target_id)
            } else {
                format!("edge_{}_{}_{}", source_id, target_id, now)
            };

            let result = conn.execute(
                "INSERT OR REPLACE INTO edges (id, source_id, target_id, color) VALUES (?1, ?2, ?3, ?4)",
                rusqlite::params![&edge_id, &source_id, &target_id, color],
            );

            match result {
                Ok(_) => edges_imported += 1,
                Err(e) => errors.push(format!("Failed to import edge: {}", e)),
            }
        }
    }

    Ok(ImportResult {
        nodes_imported,
        edges_imported,
        files_read,
        errors,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_obsidian_color_mapping() {
        assert_eq!(obsidian_color_to_hex("1"), "#EF4444");
        assert_eq!(obsidian_color_to_hex("4"), "#22C55E");
        assert_eq!(obsidian_color_to_hex("6"), "#8B5CF6");
        assert_eq!(obsidian_color_to_hex("99"), "#6B7280");
    }

    #[test]
    fn test_determine_level() {
        assert_eq!(determine_level(0), "root");
        assert_eq!(determine_level(1), "core-market");
        assert_eq!(determine_level(2), "submarket");
        assert_eq!(determine_level(3), "niche");
        assert_eq!(determine_level(4), "sub-niche");
        assert_eq!(determine_level(10), "sub-niche");
    }

    #[test]
    fn test_label_from_file() {
        assert_eq!(label_from_file("path/to/Health.md"), "Health");
        assert_eq!(label_from_file("Sleep Optimization.md"), "Sleep Optimization");
        assert_eq!(label_from_file("file"), "file");
    }

    #[test]
    fn test_build_parent_map() {
        let edges = vec![
            ObsidianEdge { id: "e1".into(), from_node: "root".into(), to_node: "child1".into() },
            ObsidianEdge { id: "e2".into(), from_node: "root".into(), to_node: "child2".into() },
            ObsidianEdge { id: "e3".into(), from_node: "child1".into(), to_node: "grandchild".into() },
        ];
        let parents = build_parent_map(&edges);
        assert_eq!(parents.get("child1").unwrap(), "root");
        assert_eq!(parents.get("child2").unwrap(), "root");
        assert_eq!(parents.get("grandchild").unwrap(), "child1");
        assert!(parents.get("root").is_none());
    }

    #[test]
    fn test_build_depth_map() {
        let edges = vec![
            ObsidianEdge { id: "e1".into(), from_node: "root".into(), to_node: "child".into() },
            ObsidianEdge { id: "e2".into(), from_node: "child".into(), to_node: "grandchild".into() },
        ];
        let depths = build_depth_map(&edges, &["root".to_string()]);
        assert_eq!(depths.get("root"), Some(&0));
        assert_eq!(depths.get("child"), Some(&1));
        assert_eq!(depths.get("grandchild"), Some(&2));
    }

    #[test]
    fn test_parse_obsidian_canvas() {
        let json = r#"{
            "nodes": [
                {"id": "root", "type": "file", "file": "test/Root.md", "x": 0, "y": 0, "width": 200, "height": 100, "color": "6"},
                {"id": "child", "type": "text", "text": "A text node", "x": 100, "y": 200, "width": 150, "height": 80}
            ],
            "edges": [
                {"id": "e1", "fromNode": "root", "toNode": "child"}
            ]
        }"#;

        let canvas: ObsidianCanvas = serde_json::from_str(json).unwrap();
        assert_eq!(canvas.nodes.len(), 2);
        assert_eq!(canvas.edges.len(), 1);
        assert_eq!(canvas.nodes[0].file.as_deref(), Some("test/Root.md"));
        assert_eq!(canvas.nodes[1].text.as_deref(), Some("A text node"));
        assert_eq!(canvas.edges[0].from_node, "root");
    }
}
