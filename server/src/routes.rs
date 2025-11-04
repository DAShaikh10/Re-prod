use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use reprod_core::{AIProvider, ToolManifest};
use reprod_protocol::{ChatMessage, ExecutionResult, ToolExecutionRequest, ToolExecutionResult};
use crate::handlers::AppState;

pub async fn health() -> &'static str {
    "OK"
}

pub async fn execute_r_code(
    State(state): State<AppState>,
    Json(payload): Json<ExecuteRequest>,
) -> Result<Json<ExecutionResult>, (StatusCode, String)> {
    let executor = state.r_executor.lock().await;

    executor
        .execute(payload.code)
        .await
        .map(Json)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
}

pub async fn send_ai_message(
    State(state): State<AppState>,
    Json(payload): Json<AIMessageRequest>,
) -> Result<Json<AIMessageResponse>, (StatusCode, String)> {
    let ai_provider = state.ai_provider.lock().await;

    ai_provider
        .send_message(payload.messages)
        .await
        .map(|response| Json(AIMessageResponse { response }))
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
}

pub async fn get_api_key(
    Path(provider): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<ApiKeyResponse>, (StatusCode, String)> {
    let config = state.config.lock().await;

    let api_key = match provider.as_str() {
        "anthropic" => config.anthropic_api_key.clone(),
        _ => return Err((StatusCode::BAD_REQUEST, format!("Unknown provider: {}", provider))),
    };

    api_key
        .map(|key| Json(ApiKeyResponse { api_key: key }))
        .ok_or_else(|| (StatusCode::NOT_FOUND, "API key not configured".to_string()))
}

pub async fn set_api_key(
    Path(provider): Path<String>,
    State(state): State<AppState>,
    Json(payload): Json<SetApiKeyRequest>,
) -> Result<StatusCode, (StatusCode, String)> {
    let mut config = state.config.lock().await;

    match provider.as_str() {
        "anthropic" => config.anthropic_api_key = Some(payload.api_key),
        _ => return Err((StatusCode::BAD_REQUEST, format!("Unknown provider: {}", provider))),
    }

    config
        .save()
        .map(|_| StatusCode::OK)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
}

pub async fn list_tools(State(state): State<AppState>) -> Json<Vec<ToolManifest>> {
    let manifests = state.tool_registry.iter().cloned().collect();
    Json(manifests)
}

pub async fn execute_tool(
    State(state): State<AppState>,
    Json(request): Json<ToolExecutionRequest>,
) -> Result<Json<ToolExecutionResult>, (StatusCode, String)> {
    let mut r_executor = state.r_executor.lock().await;

    state
        .tool_executor
        .execute(
            &request.tool_id,
            &request.capability_id,
            request.parameters,
            &mut r_executor,
        )
        .await
        .map(|result| {
            Json(ToolExecutionResult {
                tool_id: result.tool_id,
                capability_id: result.capability_id,
                success: result.success,
                stdout: result.stdout,
                stderr: result.stderr,
                artifacts: result
                    .artifacts
                    .into_iter()
                    .map(|a| reprod_protocol::ArtifactInfo {
                        path: a.path,
                        artifact_type: a.artifact_type,
                        label: a.label,
                        record_as: a.record_as,
                    })
                    .collect(),
                execution_time_ms: result.execution_time_ms,
                error: result.error,
            })
        })
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
}

// Request/Response types
#[derive(serde::Deserialize)]
pub struct ExecuteRequest {
    pub code: String,
}

#[derive(serde::Deserialize)]
pub struct AIMessageRequest {
    pub messages: Vec<ChatMessage>,
}

#[derive(serde::Serialize)]
pub struct AIMessageResponse {
    pub response: String,
}

#[derive(serde::Serialize)]
pub struct ApiKeyResponse {
    pub api_key: String,
}

#[derive(serde::Deserialize)]
pub struct SetApiKeyRequest {
    pub api_key: String,
}
