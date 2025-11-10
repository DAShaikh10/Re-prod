#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

use reprod_core::{Config, RExecutor};
use std::sync::Arc;
use tokio::sync::Mutex;

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    // Initialize config from ~/.reprod/auth.json
    let config = Config::load().unwrap_or_default();

    // Initialize services
    let temp_dir = std::env::temp_dir().join("reprod");
    if let Err(e) = std::fs::create_dir_all(&temp_dir) {
        eprintln!("Failed to create temp directory: {}", e);
    }

    let r_executor = Arc::new(Mutex::new(RExecutor::new(temp_dir, config.r_path.clone())));

    let config_state = Arc::new(Mutex::new(config));

    tauri::Builder::default()
        .manage(r_executor)
        .manage(config_state)
        .invoke_handler(tauri::generate_handler![
            commands::execute_r_code,
            commands::send_ai_message,
            commands::get_api_key,
            commands::set_api_key,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
