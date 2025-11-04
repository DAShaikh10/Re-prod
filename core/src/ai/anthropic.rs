use super::AIProvider;
use async_trait::async_trait;
use reprod_common::ReprodError;
use reprod_protocol::ChatMessage;
use reqwest::Client;
use serde_json::json;

pub struct AnthropicProvider {
    api_key: Option<String>,
    base_url: String,
    client: Client,
}

impl AnthropicProvider {
    pub fn new(api_key: Option<String>) -> Self {
        Self {
            api_key,
            base_url: "https://api.anthropic.com/v1/messages".to_string(),
            client: Client::new(),
        }
    }

    pub fn from_env() -> Self {
        let api_key = std::env::var("ANTHROPIC_API_KEY").ok();
        Self::new(api_key)
    }
}

#[async_trait]
impl AIProvider for AnthropicProvider {
    async fn send_message(&self, messages: Vec<ChatMessage>) -> Result<String, ReprodError> {
        let api_key = self
            .api_key
            .as_ref()
            .ok_or_else(|| ReprodError::AIError("Anthropic API key not configured".to_string()))?;

        let response = self
            .client
            .post(&self.base_url)
            .header("x-api-key", api_key)
            .header("anthropic-version", "2023-06-01")
            .header("content-type", "application/json")
            .json(&json!({
                "model": "claude-sonnet-4-5-20250929",
                "messages": messages,
                "max_tokens": 4096,
            }))
            .timeout(std::time::Duration::from_secs(120))
            .send()
            .await
            .map_err(|e| ReprodError::AIError(format!("Request failed: {}", e)))?;

        let data: serde_json::Value = response
            .json()
            .await
            .map_err(|e| ReprodError::AIError(format!("Invalid response: {}", e)))?;

        data["content"][0]["text"]
            .as_str()
            .ok_or_else(|| ReprodError::AIError("Missing content in response".to_string()))
            .map(|s| s.to_string())
    }

    fn name(&self) -> &str {
        "Anthropic"
    }

    fn is_configured(&self) -> bool {
        self.api_key.is_some()
    }
}
