mod routes;
mod handlers;

use axum::{
    Router,
    routing::get,
};
use std::sync::Arc;
use tokio::sync::Mutex;
use tower_http::cors::{CorsLayer, Any};
use tower_http::trace::TraceLayer;
use reprod_core::{RExecutor, AnthropicProvider, Config};

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    // Load config
    let config = Config::load().unwrap_or_default();

    // Initialize services
    let temp_dir = std::env::temp_dir().join("reprod");
    if let Err(e) = std::fs::create_dir_all(&temp_dir) {
        eprintln!("Failed to create temp directory: {}", e);
    }

    let r_executor = Arc::new(Mutex::new(
        RExecutor::new(temp_dir, config.r_path.clone())
    ));

    let ai_provider = Arc::new(Mutex::new(
        AnthropicProvider::new(config.anthropic_api_key.clone())
    ));

    let config_state = Arc::new(Mutex::new(config));

    // Build application
    let app = Router::new()
        .route("/health", get(routes::health))
        .route("/api/execute", axum::routing::post(routes::execute_r_code))
        .route("/api/ai/message", axum::routing::post(routes::send_ai_message))
        .route("/api/config/key/:provider", get(routes::get_api_key))
        .route("/api/config/key/:provider", axum::routing::put(routes::set_api_key))
        .route("/ws", get(handlers::ws_handler))
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any)
        )
        .layer(TraceLayer::new_for_http())
        .with_state(handlers::AppState {
            r_executor,
            ai_provider,
            config: config_state,
        });

    let addr = "127.0.0.1:3001";
    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .unwrap_or_else(|e| panic!("Failed to bind to {}: {}", addr, e));

    tracing::info!("🚀 Re-prod server running on http://{}", addr);
    tracing::info!("📡 WebSocket available at ws://{}/ws", addr);

    axum::serve(listener, app)
        .await
        .unwrap_or_else(|e| panic!("Server error: {}", e));
}
