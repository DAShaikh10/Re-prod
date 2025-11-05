use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    response::Response,
};
use reprod_core::{
    ai,
    api::timeline::{TimelineQueryPayload, TimelineResponsePayload, TimelineStatsPayload},
    executor::timeline::SqliteTimeline,
    ChatMessage, Config, ExecutionRequest, ExecutionResult, RExecutor, ToolExecutor,
    ToolManifest, ToolRegistry,
};
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Clone)]
pub struct AppState {
    pub r_executor: Arc<Mutex<RExecutor>>,
    pub config: Arc<Mutex<Config>>,
    pub tool_registry: Arc<ToolRegistry>,
    pub tool_executor: Arc<ToolExecutor>,
    pub timeline: Arc<SqliteTimeline>,
}

pub async fn ws_handler(ws: WebSocketUpgrade, State(state): State<AppState>) -> Response {
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

async fn handle_socket(mut socket: WebSocket, state: AppState) {
    while let Some(msg) = socket.recv().await {
        match msg {
            Ok(Message::Text(text)) => {
                if let Ok(request) = serde_json::from_str::<WSRequest>(&text) {
                    let response = handle_ws_request(request, &state).await;

                    if let Ok(response_text) = serde_json::to_string(&response) {
                        if socket.send(Message::Text(response_text)).await.is_err() {
                            break;
                        }
                    }
                } else {
                    tracing::warn!("Failed to parse WebSocket request: {}", text);
                }
            }
            Ok(Message::Close(_)) => break,
            Err(_) => break,
            _ => {}
        }
    }
}

#[derive(serde::Deserialize)]
#[serde(tag = "type")]
enum WSRequest {
    #[serde(rename = "execute")]
    Execute { request: ExecutionRequest },
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
    #[serde(rename = "timeline_query")]
    TimelineQuery { query: TimelineQueryPayload },
    #[serde(rename = "timeline_stats_query")]
    TimelineStatsQuery,
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
    #[serde(rename = "timeline_response")]
    TimelineResponse { data: TimelineResponsePayload },
    #[serde(rename = "timeline_stats_response")]
    TimelineStatsResponse { stats: TimelineStatsPayload },
}

async fn handle_ws_request(request: WSRequest, state: &AppState) -> WSResponse {
    match request {
        WSRequest::Execute { request } => {
            let executor = state.r_executor.lock().await;
            match executor.execute(request).await {
                Ok(result) => WSResponse::ExecutionResult { result },
                Err(e) => WSResponse::Error {
                    message: e.to_string(),
                },
            }
        }
        WSRequest::AIMessage { messages } => {
            let cfg = state.config.lock().await.clone();
            let result = ai::send_message_with_config(&cfg, messages).await;

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
        WSRequest::TimelineQuery { query } => match query.into_domain() {
            Ok(timeline_query) => match state.timeline.query(timeline_query) {
                Ok(response) => WSResponse::TimelineResponse {
                    data: TimelineResponsePayload::from(response),
                },
                Err(e) => WSResponse::Error {
                    message: format!("Timeline query failed: {}", e),
                },
            },
            Err(e) => WSResponse::Error {
                message: format!("Invalid timeline query: {}", e),
            },
        },
        WSRequest::TimelineStatsQuery => match state.timeline.stats() {
            Ok(stats) => WSResponse::TimelineStatsResponse {
                stats: TimelineStatsPayload::from(stats),
            },
            Err(e) => WSResponse::Error {
                message: format!("Timeline stats query failed: {}", e),
            },
        },
    }
}
