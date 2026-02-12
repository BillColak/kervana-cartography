use sha2::{Digest, Sha256};
use std::sync::Mutex;

use rusqlite::Connection;

use super::models::{ChatCompletionRequest, ChatCompletionResponse, ChatMessage};

pub struct LlmService {
    client: reqwest::Client,
    api_key: String,
    api_base: String,
    model: String,
}

impl LlmService {
    pub fn new() -> Result<Self, String> {
        let api_key = std::env::var("OPENAI_API_KEY")
            .map_err(|_| "OPENAI_API_KEY environment variable not set".to_string())?;

        let api_base = std::env::var("OPENAI_API_BASE")
            .unwrap_or_else(|_| "https://api.openai.com".to_string());

        let model =
            std::env::var("OPENAI_MODEL").unwrap_or_else(|_| "gpt-4o-mini".to_string());

        Ok(Self {
            client: reqwest::Client::new(),
            api_key,
            api_base,
            model,
        })
    }

    fn cache_key(system: &str, user: &str, model: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(system.as_bytes());
        hasher.update(user.as_bytes());
        hasher.update(model.as_bytes());
        format!("{:x}", hasher.finalize())
    }

    fn check_cache(db: &Connection, hash: &str) -> Option<String> {
        db.query_row(
            "SELECT response FROM llm_cache WHERE hash = ?1",
            [hash],
            |row| row.get::<_, String>(0),
        )
        .ok()
    }

    fn store_cache(
        db: &Connection,
        hash: &str,
        prompt_hash: &str,
        response: &str,
        model: &str,
        tokens: Option<u32>,
    ) {
        let now = chrono::Utc::now().timestamp_millis();
        let _ = db.execute(
            "INSERT OR REPLACE INTO llm_cache (hash, prompt_hash, response, model, tokens_used, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            rusqlite::params![hash, prompt_hash, response, model, tokens, now],
        );
    }

    pub async fn chat(
        &self,
        system_prompt: &str,
        user_prompt: &str,
        db: &Mutex<Connection>,
    ) -> Result<String, String> {
        let hash = Self::cache_key(system_prompt, user_prompt, &self.model);

        // Check cache
        {
            let conn = db.lock().unwrap();
            if let Some(cached) = Self::check_cache(&conn, &hash) {
                return Ok(cached);
            }
        }

        let url = format!("{}/v1/chat/completions", self.api_base);

        let request = ChatCompletionRequest {
            model: self.model.clone(),
            messages: vec![
                ChatMessage {
                    role: "system".to_string(),
                    content: system_prompt.to_string(),
                },
                ChatMessage {
                    role: "user".to_string(),
                    content: user_prompt.to_string(),
                },
            ],
            temperature: 0.7,
        };

        let response = self
            .client
            .post(&url)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&request)
            .send()
            .await
            .map_err(|e| format!("HTTP request failed: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response
                .text()
                .await
                .unwrap_or_else(|_| "unknown error".to_string());
            return Err(format!("LLM API error ({}): {}", status, body));
        }

        let completion: ChatCompletionResponse = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse LLM response: {}", e))?;

        let content = completion
            .choices
            .first()
            .map(|c| c.message.content.clone())
            .ok_or_else(|| "No response from LLM".to_string())?;

        let tokens = completion.usage.and_then(|u| u.total_tokens);

        // Store in cache
        {
            let conn = db.lock().unwrap();
            let prompt_hash = Self::cache_key(system_prompt, user_prompt, "");
            Self::store_cache(&conn, &hash, &prompt_hash, &content, &self.model, tokens);
        }

        Ok(content)
    }
}
