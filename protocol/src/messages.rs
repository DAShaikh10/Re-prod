use serde::{Deserialize, Serialize};
use std::collections::HashMap;

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

/// Request to execute a tool capability
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolExecutionRequest {
    pub tool_id: String,
    pub capability_id: String,
    pub parameters: HashMap<String, serde_json::Value>,
}

/// Result of tool execution with provenance metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolExecutionResult {
    pub tool_id: String,
    pub capability_id: String,
    pub success: bool,
    pub stdout: Option<String>,
    pub stderr: Option<String>,
    pub artifacts: Vec<ArtifactInfo>,
    pub execution_time_ms: u64,
    pub error: Option<String>,
}

/// Artifact generated during tool execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArtifactInfo {
    pub path: String,
    pub artifact_type: String,
    pub label: Option<String>,
    pub record_as: String,
}
