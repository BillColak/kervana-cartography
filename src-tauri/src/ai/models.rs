use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SubNicheSuggestion {
    pub label: String,
    pub description: String,
    pub pain_points: Vec<String>,
    pub audiences: Vec<String>,
    pub competition_level: String,
    pub keywords: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PainPointResult {
    pub frustration: String,
    pub user_quote: String,
    pub why_solutions_fail: String,
    pub severity: u8,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ValidationResult {
    pub market_depth: f64,
    pub competition_intensity: f64,
    pub pain_severity: f64,
    pub monetization_potential: f64,
    pub final_score: f64,
    pub summary: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ResearchJob {
    pub id: String,
    pub node_id: String,
    pub job_type: String,
    pub status: String,
    pub result_json: Option<String>,
    pub error_message: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExpandNodeResponse {
    pub suggestions: Vec<SubNicheSuggestion>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PainPointsResponse {
    pub pain_points: Vec<PainPointResult>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ValidateResponse {
    pub validation: ValidationResult,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatCompletionRequest {
    pub model: String,
    pub messages: Vec<ChatMessage>,
    pub temperature: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatCompletionChoice {
    pub message: ChatMessage,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatCompletionUsage {
    pub total_tokens: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatCompletionResponse {
    pub choices: Vec<ChatCompletionChoice>,
    pub usage: Option<ChatCompletionUsage>,
}
