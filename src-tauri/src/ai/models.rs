use serde::{Deserialize, Serialize};

// ─── Domain models ───

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

// ─── OpenAI-compatible (legacy) ───

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

// ─── Anthropic Claude ───

#[derive(Debug, Serialize)]
pub struct AnthropicRequest {
    pub model: String,
    pub max_tokens: u32,
    pub system: String,
    pub messages: Vec<AnthropicMessage>,
    pub temperature: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AnthropicMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Deserialize)]
pub struct AnthropicResponse {
    pub content: Vec<AnthropicContent>,
    pub usage: Option<AnthropicUsage>,
}

#[derive(Debug, Deserialize)]
pub struct AnthropicContent {
    #[serde(rename = "type")]
    pub content_type: String,
    pub text: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AnthropicUsage {
    pub input_tokens: Option<u32>,
    pub output_tokens: Option<u32>,
}

// ─── Google Gemini ───

#[derive(Debug, Serialize)]
pub struct GeminiRequest {
    pub contents: Vec<GeminiContent>,
    #[serde(rename = "systemInstruction", skip_serializing_if = "Option::is_none")]
    pub system_instruction: Option<GeminiContent>,
    #[serde(rename = "generationConfig", skip_serializing_if = "Option::is_none")]
    pub generation_config: Option<GeminiGenerationConfig>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GeminiContent {
    pub role: Option<String>,
    pub parts: Vec<GeminiPart>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GeminiPart {
    pub text: String,
}

#[derive(Debug, Serialize)]
pub struct GeminiGenerationConfig {
    pub temperature: f64,
    #[serde(rename = "maxOutputTokens")]
    pub max_output_tokens: u32,
}

#[derive(Debug, Deserialize)]
pub struct GeminiResponse {
    pub candidates: Option<Vec<GeminiCandidate>>,
    #[serde(rename = "usageMetadata")]
    pub usage_metadata: Option<GeminiUsageMetadata>,
}

#[derive(Debug, Deserialize)]
pub struct GeminiCandidate {
    pub content: GeminiContent,
}

#[derive(Debug, Deserialize)]
pub struct GeminiUsageMetadata {
    #[serde(rename = "totalTokenCount")]
    pub total_token_count: Option<u32>,
}

// ─── Provider enum ───

#[derive(Debug, Clone, PartialEq)]
pub enum LlmProvider {
    Claude,
    Gemini,
    OpenAi, // legacy / OpenRouter compatible
}
