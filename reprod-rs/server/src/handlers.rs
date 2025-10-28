use axum::{
    extract::{
        ws::{WebSocket, WebSocketUpgrade, Message},
        State,
    },
    response::Response,
};
use std::sync::Arc;
use tokio::sync::Mutex;
use reprod_core::{RExecutor, AnthropicProvider, Config, AIProvider};
use reprod_protocol::{ExecutionResult, ChatMessage};

#[derive(Clone)]
pub struct AppState {
    pub r_executor: Arc<Mutex<RExecutor>>,
    pub ai_provider: Arc<Mutex<AnthropicProvider>>,
    pub config: Arc<Mutex<Config>>,
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
}

async fn handle_ws_request(request: WSRequest, state: &AppState) -> WSResponse {
    match request {
        WSRequest::Execute { code } => {
            let executor = state.r_executor.lock().await;
            match executor.execute(code).await {
                Ok(result) => WSResponse::ExecutionResult { result },
                Err(e) => WSResponse::Error { message: e.to_string() },
            }
        }
        WSRequest::AIMessage { messages } => {
            let ai_provider = state.ai_provider.lock().await;
            match ai_provider.send_message(messages).await {
                Ok(response) => WSResponse::AIResponse { response },
                Err(e) => WSResponse::Error { message: e.to_string() },
            }
        }
    }
}
