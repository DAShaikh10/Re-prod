use serde::{Deserialize, Serialize};

/// Result of code execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionResult {
    pub success: bool,
    pub output: String,
    pub error: Option<String>,
    pub plots: Vec<PlotInfo>,
    pub execution_time_ms: u64,
}

/// Plot information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlotInfo {
    pub filename: String,
    pub base64_data: String,
    pub index: u32,
}

/// Chat message for AI communication
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

/// File change event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileChangeEvent {
    pub event_type: String,
    pub path: String,
}
