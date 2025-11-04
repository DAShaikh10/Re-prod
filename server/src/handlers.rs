use axum::{
    extract::{
        ws::{WebSocket, WebSocketUpgrade, Message},
        State,
    },
    response::Response,
};
use std::sync::Arc;
use tokio::sync::Mutex;
use reprod_core::{
    AIProvider, AnthropicProvider, Config, OpenAIProvider, RExecutor, ToolExecutor, ToolManifest,
    ToolRegistry,
};
use reprod_protocol::{ChatMessage, ExecutionResult};

#[derive(Clone)]
pub struct AppState {
    pub r_executor: Arc<Mutex<RExecutor>>,
    pub anthropic_provider: Arc<Mutex<AnthropicProvider>>,
    pub openai_provider: Arc<Mutex<OpenAIProvider>>,
    pub config: Arc<Mutex<Config>>,
    pub tool_registry: Arc<ToolRegistry>,
    pub tool_executor: Arc<ToolExecutor>,
}

pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
) -> Response {
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

async fn handle_socket(mut socket: WebSocket, state: AppState) {
    tracing::info!("WebSocket connection established");

    while let Some(msg) = socket.recv().await {
        match msg {
            Ok(Message::Text(text)) => {
                tracing::debug!("Received text message: {}", text);

                // Parse and handle message
                if let Ok(request) = serde_json::from_str::<WSRequest>(&text) {
                    let response = handle_ws_request(request, &state).await;

                    if let Ok(response_text) = serde_json::to_string(&response) {
                        if socket.send(Message::Text(response_text)).await.is_err() {
                            break;
                        }
                    }
                }
            }
            Ok(Message::Close(_)) => {
                tracing::info!("WebSocket connection closed");
                break;
            }
            Err(e) => {
                tracing::error!("WebSocket error: {}", e);
                break;
            }
            _ => {}
        }
    }
}

#[derive(serde::Deserialize)]
#[serde(tag = "type")]
enum WSRequest {
    #[serde(rename = "execute")]
    Execute { code: String },
    #[serde(rename = "ai_message")]
    AIMessage { messages: Vec<ChatMessage> },
    #[serde(rename = "list_tools")]
    ListTools,
    #[serde(rename = "execute_tool")]
    ExecuteTool {
        tool_id: String,
        capability_id: String,
        parameters: std::collections::HashMap<String, serde_json::Value>,
    },
}

#[derive(serde::Serialize)]
#[serde(tag = "type")]
enum WSResponse {
    #[serde(rename = "execution_result")]
    ExecutionResult { result: ExecutionResult },
    #[serde(rename = "ai_response")]
    AIResponse { response: String },
    #[serde(rename = "error")]
    Error { message: String },
    #[serde(rename = "tools")]
    Tools { tools: Vec<ToolManifest> },
    #[serde(rename = "tool_execution_result")]
    ToolExecutionResult {
        tool_id: String,
        capability_id: String,
        success: bool,
        stdout: Option<String>,
        stderr: Option<String>,
        execution_time_ms: u64,
        error: Option<String>,
    },
}

async fn handle_ws_request(request: WSRequest, state: &AppState) -> WSResponse {
    match request {
        WSRequest::Execute { code } => {
            let executor = state.r_executor.lock().await;
            match executor.execute(code).await {
                Ok(result) => WSResponse::ExecutionResult { result },
                Err(e) => WSResponse::Error {
                    message: e.to_string(),
                },
            }
        }
        WSRequest::AIMessage { messages } => {
            let config = state.config.lock().await;
            let provider_name = config.default_ai_provider.clone();
            drop(config);

            let result = match provider_name.as_str() {
                "openai" => {
                    let provider = state.openai_provider.lock().await;
                    provider.send_message(messages).await
                }
                "anthropic" => {
                    let provider = state.anthropic_provider.lock().await;
                    provider.send_message(messages).await
                }
                _ => {
                    return WSResponse::Error {
                        message: format!("Unknown AI provider: {}", provider_name),
                    }
                }
            };

            match result {
                Ok(response) => WSResponse::AIResponse { response },
                Err(e) => WSResponse::Error {
                    message: e.to_string(),
                },
            }
        }
        WSRequest::ListTools => {
            let tools = state.tool_registry.iter().cloned().collect();
            WSResponse::Tools { tools }
        }
        WSRequest::ExecuteTool {
            tool_id,
            capability_id,
            parameters,
        } => {
            let mut r_executor = state.r_executor.lock().await;
            match state
                .tool_executor
                .execute(&tool_id, &capability_id, parameters, &mut r_executor)
                .await
            {
                Ok(result) => WSResponse::ToolExecutionResult {
                    tool_id: result.tool_id,
                    capability_id: result.capability_id,
                    success: result.success,
                    stdout: result.stdout,
                    stderr: result.stderr,
                    execution_time_ms: result.execution_time_ms,
                    error: result.error,
                },
                Err(e) => WSResponse::Error {
                    message: e.to_string(),
                },
            }
        }
    }
}
