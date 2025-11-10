use crate::handlers::AppState;
use crate::http::{err_400, err_404, err_500, HttpError, Resp};
use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use reprod_core::{
    ai, ChatMessage, ExecutionRequest, ExecutionResult, ToolExecutionRequest, ToolExecutionResult,
    ToolManifest,
};

pub async fn health() -> &'static str {
    "OK"
}

pub async fn execute_r_code(
    State(state): State<AppState>,
    Json(payload): Json<ExecutionRequest>,
) -> Resp<ExecutionResult> {
    let executor = state.r_executor.lock().await;

    executor.execute(payload).await.map(Json).map_err(err_500)
}

pub async fn send_ai_message(
    State(state): State<AppState>,
    Json(payload): Json<AIMessageRequest>,
) -> Resp<AIMessageResponse> {
    let cfg = state.config.lock().await.clone();
    let provider = ai::from_config(&cfg);

    provider
        .send_message(payload.messages)
        .await
        .map(|response| Json(AIMessageResponse { response }))
        .map_err(err_500)
}

pub async fn get_api_key(
    Path(provider): Path<String>,
    State(state): State<AppState>,
) -> Resp<ApiKeyResponse> {
    let config = state.config.lock().await;

    let api_key = match provider.as_str() {
        ai::PROVIDER_ANTHROPIC => config.anthropic_api_key.clone(),
        ai::PROVIDER_OPENAI => config.openai_api_key.clone(),
        _ => return Err(err_400(format!("Unknown provider: {}", provider))),
    };

    api_key
        .map(|key| Json(ApiKeyResponse { api_key: key }))
        .ok_or_else(|| err_404("API key not configured"))
}

pub async fn set_api_key(
    Path(provider): Path<String>,
    State(state): State<AppState>,
    Json(payload): Json<SetApiKeyRequest>,
) -> Result<StatusCode, HttpError> {
    let mut config = state.config.lock().await;

    match provider.as_str() {
        ai::PROVIDER_ANTHROPIC => config.anthropic_api_key = Some(payload.api_key),
        ai::PROVIDER_OPENAI => config.openai_api_key = Some(payload.api_key),
        _ => return Err(err_400(format!("Unknown provider: {}", provider))),
    }

    config.save().map(|_| StatusCode::OK).map_err(err_500)
}

pub async fn list_tools(State(state): State<AppState>) -> Json<Vec<ToolManifest>> {
    let manifests = state.tool_registry.iter().cloned().collect();
    Json(manifests)
}

pub async fn get_provider(State(state): State<AppState>) -> Resp<GetProviderResponse> {
    let config = state.config.lock().await;
    Ok(Json(GetProviderResponse {
        provider: config.default_ai_provider.clone(),
    }))
}

pub async fn set_provider(
    State(state): State<AppState>,
    Json(payload): Json<SetProviderRequest>,
) -> Result<StatusCode, HttpError> {
    if payload.provider != ai::PROVIDER_OPENAI && payload.provider != ai::PROVIDER_ANTHROPIC {
        return Err(err_400(format!(
            "Invalid provider: {}. Must be 'openai' or 'anthropic'",
            payload.provider
        )));
    }

    let mut config = state.config.lock().await;
    config.default_ai_provider = payload.provider;

    config.save().map(|_| StatusCode::OK).map_err(err_500)
}

pub async fn execute_tool(
    State(state): State<AppState>,
    Json(request): Json<ToolExecutionRequest>,
) -> Resp<ToolExecutionResult> {
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
        .map(|result| Json(crate::conversions::to_proto_tool_result(result)))
        .map_err(err_500)
}

// Request/Response types
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

#[derive(serde::Deserialize)]
pub struct SetProviderRequest {
    pub provider: String,
}

#[derive(serde::Serialize)]
pub struct GetProviderResponse {
    pub provider: String,
}
