use super::AIProvider;
use async_trait::async_trait;
use reprod_protocol::ChatMessage;
use reprod_common::ReprodError;
use reqwest::Client;
use serde_json::json;

pub struct OpenAIProvider {
    api_key: Option<String>,
    base_url: String,
    model: String,
    client: Client,
}

impl OpenAIProvider {
    pub fn new(api_key: Option<String>) -> Self {
        Self {
            api_key,
            base_url: "https://api.openai.com/v1/chat/completions".to_string(),
            model: "gpt-4o".to_string(),
            client: Client::new(),
        }
    }

    pub fn from_env() -> Self {
        let api_key = std::env::var("OPENAI_API_KEY").ok();
        Self::new(api_key)
    }

    pub fn with_model(mut self, model: String) -> Self {
        self.model = model;
        self
    }
}

#[async_trait]
impl AIProvider for OpenAIProvider {
    async fn send_message(&self, messages: Vec<ChatMessage>) -> Result<String, ReprodError> {
        let api_key = self.api_key.as_ref()
            .ok_or_else(|| ReprodError::AIError("OpenAI API key not configured".to_string()))?;

        let response = self.client
            .post(&self.base_url)
            .header("Authorization", format!("Bearer {}", api_key))
            .header("Content-Type", "application/json")
            .json(&json!({
                "model": self.model,
                "messages": messages,
                "max_tokens": 4096,
                "temperature": 0.7,
            }))
            .timeout(std::time::Duration::from_secs(120))
            .send()
            .await
            .map_err(|e| ReprodError::AIError(format!("Request failed: {}", e)))?;

        let status = response.status();
        if !status.is_success() {
            let error_text = response.text().await
                .unwrap_or_else(|_| "Unknown error".to_string());
            return Err(ReprodError::AIError(format!(
                "OpenAI API error ({}): {}",
                status,
                error_text
            )));
        }

        let data: serde_json::Value = response.json().await
            .map_err(|e| ReprodError::AIError(format!("Invalid response: {}", e)))?;

        data["choices"][0]["message"]["content"]
            .as_str()
            .ok_or_else(|| ReprodError::AIError("Missing content in response".to_string()))
            .map(|s| s.to_string())
    }

    fn name(&self) -> &str {
        "OpenAI"
    }

    fn is_configured(&self) -> bool {
        self.api_key.is_some()
    }
}
