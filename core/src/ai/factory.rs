use crate::{ai::{AIProvider, AnthropicProvider, OpenAIProvider}, Config};
use std::sync::Arc;

/// Create an AI provider from Config.default_ai_provider.
/// Falls back to Anthropic when value is unrecognized.
pub fn from_config(cfg: &Config) -> Arc<dyn AIProvider> {
    match cfg.default_ai_provider.as_str() {
        "openai" => Arc::new(OpenAIProvider::new(cfg.openai_api_key.clone())),
        "anthropic" => Arc::new(AnthropicProvider::new(cfg.anthropic_api_key.clone())),
        _ => Arc::new(AnthropicProvider::new(cfg.anthropic_api_key.clone())),
    }
}

