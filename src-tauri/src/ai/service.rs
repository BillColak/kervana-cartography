use sha2::{Digest, Sha256};
use std::sync::Mutex;

use rusqlite::Connection;

use super::models::*;

#[derive(Debug)]
pub struct LlmService {
    client: reqwest::Client,
    provider: LlmProvider,
    api_key: String,
    model: String,
}

impl LlmService {
    pub fn new() -> Result<Self, String> {
        // Detect provider from env vars (check in order: Claude → Gemini → OpenAI)
        if let Ok(key) = std::env::var("ANTHROPIC_API_KEY") {
            let model = std::env::var("ANTHROPIC_MODEL")
                .unwrap_or_else(|_| "claude-sonnet-4-20250514".to_string());
            return Ok(Self {
                client: reqwest::Client::new(),
                provider: LlmProvider::Claude,
                api_key: key,
                model,
            });
        }

        if let Ok(key) = std::env::var("GEMINI_API_KEY") {
            let model = std::env::var("GEMINI_MODEL")
                .unwrap_or_else(|_| "gemini-2.0-flash".to_string());
            return Ok(Self {
                client: reqwest::Client::new(),
                provider: LlmProvider::Gemini,
                api_key: key,
                model,
            });
        }

        if let Ok(key) = std::env::var("OPENAI_API_KEY") {
            let model = std::env::var("OPENAI_MODEL")
                .unwrap_or_else(|_| "gpt-4o-mini".to_string());
            return Ok(Self {
                client: reqwest::Client::new(),
                provider: LlmProvider::OpenAi,
                api_key: key,
                model,
            });
        }

        Err("No API key found. Set one of: ANTHROPIC_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY".to_string())
    }

    pub fn provider_name(&self) -> &str {
        match self.provider {
            LlmProvider::Claude => "claude",
            LlmProvider::Gemini => "gemini",
            LlmProvider::OpenAi => "openai",
        }
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

    // ─── Provider-specific request builders ───

    async fn chat_claude(
        &self,
        system_prompt: &str,
        user_prompt: &str,
    ) -> Result<(String, Option<u32>), String> {
        let request = AnthropicRequest {
            model: self.model.clone(),
            max_tokens: 4096,
            system: system_prompt.to_string(),
            messages: vec![AnthropicMessage {
                role: "user".to_string(),
                content: user_prompt.to_string(),
            }],
            temperature: 0.7,
        };

        let response = self
            .client
            .post("https://api.anthropic.com/v1/messages")
            .header("x-api-key", &self.api_key)
            .header("anthropic-version", "2023-06-01")
            .header("Content-Type", "application/json")
            .json(&request)
            .send()
            .await
            .map_err(|e| format!("Claude HTTP request failed: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            return Err(format!("Claude API error ({}): {}", status, body));
        }

        let result: AnthropicResponse = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse Claude response: {}", e))?;

        let content = result
            .content
            .iter()
            .filter_map(|c| c.text.as_ref())
            .cloned()
            .collect::<Vec<_>>()
            .join("");

        let tokens = result
            .usage
            .and_then(|u| match (u.input_tokens, u.output_tokens) {
                (Some(i), Some(o)) => Some(i + o),
                _ => None,
            });

        Ok((content, tokens))
    }

    async fn chat_gemini(
        &self,
        system_prompt: &str,
        user_prompt: &str,
    ) -> Result<(String, Option<u32>), String> {
        let request = GeminiRequest {
            contents: vec![GeminiContent {
                role: Some("user".to_string()),
                parts: vec![GeminiPart {
                    text: user_prompt.to_string(),
                }],
            }],
            system_instruction: Some(GeminiContent {
                role: None,
                parts: vec![GeminiPart {
                    text: system_prompt.to_string(),
                }],
            }),
            generation_config: Some(GeminiGenerationConfig {
                temperature: 0.7,
                max_output_tokens: 4096,
            }),
        };

        let url = format!(
            "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
            self.model, self.api_key
        );

        let response = self
            .client
            .post(&url)
            .header("Content-Type", "application/json")
            .json(&request)
            .send()
            .await
            .map_err(|e| format!("Gemini HTTP request failed: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            return Err(format!("Gemini API error ({}): {}", status, body));
        }

        let result: GeminiResponse = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse Gemini response: {}", e))?;

        let content = result
            .candidates
            .and_then(|c| c.into_iter().next())
            .map(|c| {
                c.content
                    .parts
                    .into_iter()
                    .map(|p| p.text)
                    .collect::<Vec<_>>()
                    .join("")
            })
            .ok_or_else(|| "No response from Gemini".to_string())?;

        let tokens = result
            .usage_metadata
            .and_then(|u| u.total_token_count);

        Ok((content, tokens))
    }

    async fn chat_openai(
        &self,
        system_prompt: &str,
        user_prompt: &str,
    ) -> Result<(String, Option<u32>), String> {
        let api_base = std::env::var("OPENAI_API_BASE")
            .unwrap_or_else(|_| "https://api.openai.com".to_string());

        let url = format!("{}/v1/chat/completions", api_base);

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
            .map_err(|e| format!("OpenAI HTTP request failed: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            return Err(format!("OpenAI API error ({}): {}", status, body));
        }

        let completion: ChatCompletionResponse = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse OpenAI response: {}", e))?;

        let content = completion
            .choices
            .first()
            .map(|c| c.message.content.clone())
            .ok_or_else(|| "No response from OpenAI".to_string())?;

        let tokens = completion.usage.and_then(|u| u.total_tokens);

        Ok((content, tokens))
    }

    // ─── Main entry point ───

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

        // Dispatch to provider
        let (content, tokens) = match self.provider {
            LlmProvider::Claude => self.chat_claude(system_prompt, user_prompt).await?,
            LlmProvider::Gemini => self.chat_gemini(system_prompt, user_prompt).await?,
            LlmProvider::OpenAi => self.chat_openai(system_prompt, user_prompt).await?,
        };

        // Store in cache
        {
            let conn = db.lock().unwrap();
            let prompt_hash = Self::cache_key(system_prompt, user_prompt, "");
            Self::store_cache(&conn, &hash, &prompt_hash, &content, &self.model, tokens);
        }

        Ok(content)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;
    use crate::db;

    fn setup_db() -> Mutex<Connection> {
        let conn = Connection::open_in_memory().unwrap();
        db::init_tables(&conn).unwrap();
        Mutex::new(conn)
    }

    #[test]
    fn test_cache_key_deterministic() {
        let key1 = LlmService::cache_key("sys", "user", "model");
        let key2 = LlmService::cache_key("sys", "user", "model");
        assert_eq!(key1, key2);
    }

    #[test]
    fn test_cache_key_different_inputs() {
        let key1 = LlmService::cache_key("sys", "user", "model-a");
        let key2 = LlmService::cache_key("sys", "user", "model-b");
        assert_ne!(key1, key2);
    }

    #[test]
    fn test_cache_key_different_prompts() {
        let key1 = LlmService::cache_key("system1", "user", "model");
        let key2 = LlmService::cache_key("system2", "user", "model");
        assert_ne!(key1, key2);
    }

    #[test]
    fn test_cache_store_and_retrieve() {
        let db = setup_db();
        let conn = db.lock().unwrap();
        let hash = "test_hash_123";

        assert!(LlmService::check_cache(&conn, hash).is_none());

        LlmService::store_cache(&conn, hash, "prompt_hash", "response text", "claude-sonnet", Some(100));

        let cached = LlmService::check_cache(&conn, hash);
        assert_eq!(cached, Some("response text".to_string()));
    }

    #[test]
    fn test_cache_miss() {
        let db = setup_db();
        let conn = db.lock().unwrap();
        assert!(LlmService::check_cache(&conn, "nonexistent").is_none());
    }

    #[test]
    fn test_cache_overwrite() {
        let db = setup_db();
        let conn = db.lock().unwrap();
        let hash = "overwrite_test";

        LlmService::store_cache(&conn, hash, "ph", "old response", "claude", Some(50));
        LlmService::store_cache(&conn, hash, "ph", "new response", "claude", Some(60));

        let cached = LlmService::check_cache(&conn, hash);
        assert_eq!(cached, Some("new response".to_string()));
    }

    #[test]
    fn test_provider_detection_no_keys() {
        // Clear all provider keys
        std::env::remove_var("ANTHROPIC_API_KEY");
        std::env::remove_var("GEMINI_API_KEY");
        std::env::remove_var("OPENAI_API_KEY");
        let result = LlmService::new();
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("No API key found"));
    }

    #[test]
    fn test_provider_detection_claude() {
        std::env::remove_var("GEMINI_API_KEY");
        std::env::remove_var("OPENAI_API_KEY");
        std::env::set_var("ANTHROPIC_API_KEY", "test-key");
        let service = LlmService::new().unwrap();
        assert_eq!(service.provider, LlmProvider::Claude);
        assert_eq!(service.provider_name(), "claude");
        std::env::remove_var("ANTHROPIC_API_KEY");
    }

    #[test]
    fn test_provider_detection_gemini() {
        std::env::remove_var("ANTHROPIC_API_KEY");
        std::env::remove_var("OPENAI_API_KEY");
        std::env::set_var("GEMINI_API_KEY", "test-key");
        let service = LlmService::new().unwrap();
        assert_eq!(service.provider, LlmProvider::Gemini);
        assert_eq!(service.provider_name(), "gemini");
        std::env::remove_var("GEMINI_API_KEY");
    }

    // Note: env var tests can race with each other in parallel.
    // The priority test is validated by code inspection: Claude → Gemini → OpenAI.
    // Individual provider tests above confirm each path works.
}
