use rusqlite::Connection;
use tauri::State;

use super::models::ResearchJob;
use super::prompts;
use super::service::LlmService;
use crate::AppState;

fn get_node_label(db: &Connection, node_id: &str) -> Result<String, String> {
    db.query_row("SELECT label FROM nodes WHERE id = ?1", [node_id], |row| {
        row.get::<_, String>(0)
    })
    .map_err(|e| format!("Node not found: {}", e))
}

fn get_node_ancestors(db: &Connection, node_id: &str) -> Vec<String> {
    let mut ancestors = Vec::new();
    let mut current_id = node_id.to_string();

    loop {
        let result = db.query_row(
            "SELECT parent_id, label FROM nodes WHERE id = ?1",
            [&current_id],
            |row| {
                Ok((
                    row.get::<_, Option<String>>(0)?,
                    row.get::<_, String>(1)?,
                ))
            },
        );

        match result {
            Ok((Some(parent_id), _label)) => {
                // Get parent's label
                if let Ok(parent_label) = db.query_row(
                    "SELECT label FROM nodes WHERE id = ?1",
                    [&parent_id],
                    |row| row.get::<_, String>(0),
                ) {
                    ancestors.push(parent_label);
                }
                current_id = parent_id;
            }
            _ => break,
        }
    }

    ancestors.reverse();
    ancestors
}

fn get_node_context(db: &Connection, node_id: &str) -> (Vec<String>, Vec<String>, String) {
    let result = db.query_row(
        "SELECT pain_points, audiences, markdown FROM nodes WHERE id = ?1",
        [node_id],
        |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
            ))
        },
    );

    match result {
        Ok((pp, aud, md)) => {
            let pain_points: Vec<String> = serde_json::from_str(&pp).unwrap_or_default();
            let audiences: Vec<String> = serde_json::from_str(&aud).unwrap_or_default();
            (pain_points, audiences, md)
        }
        Err(_) => (Vec::new(), Vec::new(), String::new()),
    }
}

fn create_job(db: &Connection, node_id: &str, job_type: &str) -> Result<ResearchJob, String> {
    let id = format!("job_{}", chrono::Utc::now().timestamp_millis());
    let now = chrono::Utc::now().timestamp_millis();

    db.execute(
        "INSERT INTO research_jobs (id, node_id, job_type, status, created_at, updated_at)
         VALUES (?1, ?2, ?3, 'QUEUED', ?4, ?5)",
        rusqlite::params![&id, node_id, job_type, now, now],
    )
    .map_err(|e| format!("Failed to create job: {}", e))?;

    Ok(ResearchJob {
        id,
        node_id: node_id.to_string(),
        job_type: job_type.to_string(),
        status: "QUEUED".to_string(),
        result_json: None,
        error_message: None,
        created_at: now,
        updated_at: now,
    })
}

fn update_job_status(db: &Connection, job_id: &str, status: &str, result_json: Option<&str>, error: Option<&str>) {
    let now = chrono::Utc::now().timestamp_millis();
    let _ = db.execute(
        "UPDATE research_jobs SET status = ?1, result_json = ?2, error_message = ?3, updated_at = ?4 WHERE id = ?5",
        rusqlite::params![status, result_json, error, now, job_id],
    );
}

#[tauri::command]
pub async fn start_research(
    node_id: String,
    job_type: String,
    state: State<'_, AppState>,
) -> Result<ResearchJob, String> {
    // Validate job_type
    if !["EXPAND", "PAIN_POINTS", "VALIDATE"].contains(&job_type.as_str()) {
        return Err(format!("Invalid job type: {}. Must be EXPAND, PAIN_POINTS, or VALIDATE", job_type));
    }

    // Create the job
    let job = {
        let db = state.db.lock().unwrap();
        create_job(&db, &node_id, &job_type)?
    };

    let job_id = job.id.clone();

    // Update status to PROCESSING
    {
        let db = state.db.lock().unwrap();
        update_job_status(&db, &job_id, "PROCESSING", None, None);
    }

    // Build prompts based on job type
    let (system_prompt, user_prompt) = {
        let db = state.db.lock().unwrap();
        let label = get_node_label(&db, &node_id)?;

        match job_type.as_str() {
            "EXPAND" => {
                let ancestors = get_node_ancestors(&db, &node_id);
                (
                    prompts::expand_node_system(),
                    prompts::expand_node_user(&label, &ancestors),
                )
            }
            "PAIN_POINTS" => {
                let (_, _, markdown) = get_node_context(&db, &node_id);
                (
                    prompts::pain_points_system(),
                    prompts::pain_points_user(&label, &markdown),
                )
            }
            "VALIDATE" => {
                let (pain_points, audiences, _) = get_node_context(&db, &node_id);
                (
                    prompts::validate_niche_system(),
                    prompts::validate_niche_user(&label, &pain_points, &audiences),
                )
            }
            _ => return Err("Invalid job type".to_string()),
        }
    };

    // Call LLM
    let service = LlmService::new()?;
    let result = service.chat(&system_prompt, &user_prompt, &state.db).await;

    // Update job with result
    let db = state.db.lock().unwrap();
    match result {
        Ok(response) => {
            update_job_status(&db, &job_id, "COMPLETED", Some(&response), None);
            let mut completed_job = job;
            completed_job.status = "COMPLETED".to_string();
            completed_job.result_json = Some(response);
            completed_job.updated_at = chrono::Utc::now().timestamp_millis();
            Ok(completed_job)
        }
        Err(err) => {
            update_job_status(&db, &job_id, "FAILED", None, Some(&err));
            let mut failed_job = job;
            failed_job.status = "FAILED".to_string();
            failed_job.error_message = Some(err);
            failed_job.updated_at = chrono::Utc::now().timestamp_millis();
            Ok(failed_job)
        }
    }
}

#[tauri::command]
pub fn get_research_status(job_id: String, state: State<AppState>) -> Result<ResearchJob, String> {
    let db = state.db.lock().unwrap();
    db.query_row(
        "SELECT id, node_id, job_type, status, result_json, error_message, created_at, updated_at FROM research_jobs WHERE id = ?1",
        [&job_id],
        |row| {
            Ok(ResearchJob {
                id: row.get(0)?,
                node_id: row.get(1)?,
                job_type: row.get(2)?,
                status: row.get(3)?,
                result_json: row.get(4)?,
                error_message: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        },
    )
    .map_err(|e| format!("Job not found: {}", e))
}

#[tauri::command]
pub fn get_research_results(
    node_id: String,
    state: State<AppState>,
) -> Result<Vec<ResearchJob>, String> {
    let db = state.db.lock().unwrap();
    let mut stmt = db
        .prepare(
            "SELECT id, node_id, job_type, status, result_json, error_message, created_at, updated_at
             FROM research_jobs WHERE node_id = ?1 AND status = 'COMPLETED' ORDER BY created_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let jobs = stmt
        .query_map([&node_id], |row| {
            Ok(ResearchJob {
                id: row.get(0)?,
                node_id: row.get(1)?,
                job_type: row.get(2)?,
                status: row.get(3)?,
                result_json: row.get(4)?,
                error_message: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(jobs)
}

#[tauri::command]
pub fn cancel_research(job_id: String, state: State<AppState>) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let now = chrono::Utc::now().timestamp_millis();
    let affected = db
        .execute(
            "UPDATE research_jobs SET status = 'FAILED', error_message = 'Cancelled by user', updated_at = ?1
             WHERE id = ?2 AND status IN ('QUEUED', 'PROCESSING')",
            rusqlite::params![now, &job_id],
        )
        .map_err(|e| e.to_string())?;

    if affected == 0 {
        return Err("Job not found or already completed".to_string());
    }

    Ok(())
}
