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

fn main() {
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
            import::import_obsidian_canvas
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
