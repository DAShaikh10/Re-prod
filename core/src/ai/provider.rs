use async_trait::async_trait;
use reprod_common::ReprodError;
use reprod_protocol::ChatMessage;

/// Trait for AI provider implementations
#[async_trait]
pub trait AIProvider: Send + Sync {
    /// Send messages and get response
    async fn send_message(&self, messages: Vec<ChatMessage>) -> Result<String, ReprodError>;

    /// Get provider name
    fn name(&self) -> &str;

    /// Check if provider is configured
    fn is_configured(&self) -> bool;
}
