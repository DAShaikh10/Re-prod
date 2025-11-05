use reprod_core::{ai, ChatMessage, Config, ExecutionRequest, ExecutionResult, RExecutor};
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;

#[tauri::command]
pub async fn execute_r_code(
    request: ExecutionRequest,
    executor: State<'_, Arc<Mutex<RExecutor>>>,
) -> Result<ExecutionResult, String> {
    let executor = executor.lock().await;
    executor.execute(request).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn send_ai_message(
    messages: Vec<ChatMessage>,
    config: State<'_, Arc<Mutex<Config>>>,
) -> Result<String, String> {
    let cfg = config.lock().await.clone();
    let provider = ai::from_config(&cfg);
    provider.send_message(messages).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_api_key(
    provider: String,
    config: State<'_, Arc<Mutex<Config>>>,
) -> Result<String, String> {
    let config = config.lock().await;

    match provider.as_str() {
        reprod_core::ai::PROVIDER_ANTHROPIC => config
            .anthropic_api_key
            .clone()
            .ok_or_else(|| "Anthropic API key not configured".to_string()),
        reprod_core::ai::PROVIDER_OPENAI => config
            .openai_api_key
            .clone()
            .ok_or_else(|| "OpenAI API key not configured".to_string()),
        _ => Err(format!("Unknown provider: {}", provider)),
    }
}

#[tauri::command]
pub async fn set_api_key(
    provider: String,
    api_key: String,
    config: State<'_, Arc<Mutex<Config>>>,
) -> Result<(), String> {
    let mut config = config.lock().await;

    match provider.as_str() {
        reprod_core::ai::PROVIDER_ANTHROPIC => config.anthropic_api_key = Some(api_key),
        reprod_core::ai::PROVIDER_OPENAI => config.openai_api_key = Some(api_key),
        _ => return Err(format!("Unknown provider: {}", provider)),
    }

    config.save().map_err(|e| e.to_string())?;

    Ok(())
}
