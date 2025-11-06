use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    response::Response,
};
use reprod_core::{
    ai::{
        self,
        tools::{get_filesystem_tools, get_r_context_tools, FileSystemTool, RContextTool},
    },
    api::timeline::{
        ExportRMarkdownRequest, ExportRMarkdownResponse, TimelineQueryPayload,
        TimelineResponsePayload, TimelineStatsPayload,
    },
    executor::timeline::JsonTimeline,
    export::{BundleMetadata, RMarkdownGenerator, ReproductionBundle},
    AIResponse, ChatMessage, Config, ExecutionEvent, ExecutionRequest, ExecutionResult, RExecutor,
    ToolExecutor, ToolManifest, ToolRegistry,
};
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Clone)]
pub struct AppState {
    pub r_executor: Arc<Mutex<RExecutor>>,
    pub config: Arc<Mutex<Config>>,
    pub tool_registry: Arc<ToolRegistry>,
    pub tool_executor: Arc<ToolExecutor>,
    pub timeline: Arc<JsonTimeline>,
    pub filesystem_tool: Arc<FileSystemTool>,
    pub r_context_tool: Arc<RContextTool>,
}

pub async fn ws_handler(ws: WebSocketUpgrade, State(state): State<AppState>) -> Response {
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

async fn handle_socket(mut socket: WebSocket, state: AppState) {
    while let Some(msg) = socket.recv().await {
        match msg {
            Ok(Message::Text(text)) => {
                if let Ok(request) = serde_json::from_str::<WSRequest>(&text) {
                    let responses = handle_ws_request(request, &state).await;

                    for response in responses {
                        if let Ok(response_text) = serde_json::to_string(&response) {
                            if socket.send(Message::Text(response_text)).await.is_err() {
                                return;
                            }
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
    AIMessage {
        messages: Vec<ChatMessage>,
        #[serde(default)]
        enable_tools: bool,
    },
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
    #[serde(rename = "export_rmarkdown")]
    ExportRMarkdown { request: ExportRMarkdownRequest },
}

#[derive(serde::Serialize)]
#[serde(tag = "type")]
enum WSResponse {
    #[serde(rename = "execution_result")]
    ExecutionResult { result: ExecutionResult },
    #[serde(rename = "ai_response")]
    AIResponse { response: String },
    #[serde(rename = "ai_response_with_tools")]
    AIResponseWithTools { response: AIResponse },
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
    #[serde(rename = "timeline_event_added")]
    TimelineEventAdded { event: ExecutionEvent },
    #[serde(rename = "export_rmarkdown_response")]
    ExportRMarkdownResponse { response: ExportRMarkdownResponse },
}

async fn handle_ws_request(request: WSRequest, state: &AppState) -> Vec<WSResponse> {
    match request {
        WSRequest::Execute { request } => {
            let executor = state.r_executor.lock().await;
            match executor.execute_with_event(request).await {
                Ok((result, event)) => vec![
                    WSResponse::ExecutionResult { result },
                    WSResponse::TimelineEventAdded { event },
                ],
                Err(e) => vec![WSResponse::Error {
                    message: e.to_string(),
                }],
            }
        }
        WSRequest::AIMessage {
            messages,
            enable_tools,
        } => {
            let cfg = state.config.lock().await.clone();
            let provider = ai::from_config(&cfg);

            if enable_tools {
                // Combine all AI tools
                let mut tools = get_filesystem_tools();
                tools.extend(get_r_context_tools());

                // First API call to get tool calls
                let result = provider
                    .send_message_with_tools(messages.clone(), tools.clone())
                    .await;

                match result {
                    Ok(response) => {
                        // Execute tool calls if present
                        if let Some(ref tool_calls) = response.tool_calls {
                            let mut tool_results = Vec::new();

                            for tool_call in tool_calls {
                                let tool_result = execute_ai_tool_call(tool_call, &state).await;

                                // Log tool execution result
                                tracing::info!(
                                    "Tool {} executed: {:?}",
                                    tool_call.name,
                                    tool_result
                                );

                                // Collect tool results
                                let result_content = match tool_result {
                                    Ok(content) => content,
                                    Err(e) => format!("Error: {}", e),
                                };
                                tool_results.push((tool_call.id.clone(), result_content));
                            }

                            // Build follow-up messages with tool results
                            let mut follow_up_messages = messages.clone();

                            // Add assistant's message (simplified for now)
                            follow_up_messages.push(ChatMessage {
                                role: "assistant".to_string(),
                                content: response.content.clone(),
                            });

                            // Add tool results as user messages
                            for (tool_id, result) in tool_results {
                                follow_up_messages.push(ChatMessage {
                                    role: "user".to_string(),
                                    content: format!("Tool '{}' result: {}", tool_id, result),
                                });
                            }

                            // Get final response from AI with tool results
                            tracing::info!("Sending tool results back to AI for final response");
                            match provider.send_message(follow_up_messages).await {
                                Ok(final_response) => {
                                    tracing::info!("Received final response from AI");
                                    vec![WSResponse::AIResponse {
                                        response: final_response,
                                    }]
                                }
                                Err(e) => {
                                    tracing::error!("Failed to get final response: {}", e);
                                    vec![WSResponse::Error {
                                        message: format!("Failed to get final response: {}", e),
                                    }]
                                }
                            }
                        } else {
                            // No tool calls, return original response
                            vec![WSResponse::AIResponseWithTools { response }]
                        }
                    }
                    Err(e) => vec![WSResponse::Error {
                        message: e.to_string(),
                    }],
                }
            } else {
                // Legacy mode without tools
                let result = provider.send_message(messages).await;

                match result {
                    Ok(response) => vec![WSResponse::AIResponse { response }],
                    Err(e) => vec![WSResponse::Error {
                        message: e.to_string(),
                    }],
                }
            }
        }
        WSRequest::ListTools => {
            let tools = state.tool_registry.iter().cloned().collect();
            vec![WSResponse::Tools { tools }]
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
                Ok(result) => vec![WSResponse::ToolExecutionResult {
                    tool_id: result.tool_id,
                    capability_id: result.capability_id,
                    success: result.success,
                    stdout: result.stdout,
                    stderr: result.stderr,
                    execution_time_ms: result.execution_time_ms,
                    error: result.error,
                }],
                Err(e) => vec![WSResponse::Error {
                    message: e.to_string(),
                }],
            }
        }
        WSRequest::TimelineQuery { query } => match query.into_domain() {
            Ok(timeline_query) => match state.timeline.query(timeline_query) {
                Ok(response) => vec![WSResponse::TimelineResponse {
                    data: TimelineResponsePayload::from(response),
                }],
                Err(e) => vec![WSResponse::Error {
                    message: format!("Timeline query failed: {}", e),
                }],
            },
            Err(e) => vec![WSResponse::Error {
                message: format!("Invalid timeline query: {}", e),
            }],
        },
        WSRequest::TimelineStatsQuery => match state.timeline.stats() {
            Ok(stats) => vec![WSResponse::TimelineStatsResponse {
                stats: TimelineStatsPayload::from(stats),
            }],
            Err(e) => vec![WSResponse::Error {
                message: format!("Timeline stats query failed: {}", e),
            }],
        },
        WSRequest::ExportRMarkdown { request } => {
            eprintln!("[handlers] Processing export_rmarkdown request: mode={:?}", request.mode());
            match handle_export_rmarkdown(request, &state).await {
                Ok(response) => {
                    eprintln!("[handlers] Export successful: {}", response.output_path());
                    vec![WSResponse::ExportRMarkdownResponse { response }]
                }
                Err(e) => {
                    eprintln!("[handlers] Export failed: {}", e);
                    vec![WSResponse::Error {
                        message: format!("RMarkdown export failed: {}", e),
                    }]
                }
            }
        }
    }
}

async fn execute_ai_tool_call(
    tool_call: &reprod_core::ToolCall,
    state: &AppState,
) -> Result<String, String> {
    use reprod_core::ai::tools::*;

    match tool_call.name.as_str() {
        "read_file" => {
            let request: ReadFileRequest = serde_json::from_value(tool_call.input.clone())
                .map_err(|e| format!("Invalid request: {}", e))?;

            state
                .filesystem_tool
                .read_file(request)
                .await
                .map_err(|e| e.to_string())
        }
        "write_file" => {
            let request: WriteFileRequest = serde_json::from_value(tool_call.input.clone())
                .map_err(|e| format!("Invalid request: {}", e))?;

            state
                .filesystem_tool
                .write_file(request)
                .await
                .map(|_| "File written successfully".to_string())
                .map_err(|e| e.to_string())
        }
        "list_files" => {
            let request: ListFilesRequest = serde_json::from_value(tool_call.input.clone())
                .map_err(|e| format!("Invalid request: {}", e))?;

            state
                .filesystem_tool
                .list_files(request)
                .await
                .and_then(|files| {
                    serde_json::to_string(&files)
                        .map_err(|e| reprod_core::ReprodError::IOError(e.to_string()))
                })
                .map_err(|e| e.to_string())
        }
        "get_r_variables" => {
            let request: GetVariablesRequest = serde_json::from_value(tool_call.input.clone())
                .map_err(|e| format!("Invalid request: {}", e))?;

            let mut executor = state.r_executor.lock().await;
            state
                .r_context_tool
                .get_variables(request, &mut executor)
                .await
                .and_then(|vars| {
                    serde_json::to_string(&vars)
                        .map_err(|e| reprod_core::ReprodError::IOError(e.to_string()))
                })
                .map_err(|e| e.to_string())
        }
        "get_working_directory" => {
            let request: GetWorkingDirRequest = serde_json::from_value(tool_call.input.clone())
                .map_err(|e| format!("Invalid request: {}", e))?;

            let mut executor = state.r_executor.lock().await;
            state
                .r_context_tool
                .get_working_dir(request, &mut executor)
                .await
                .map_err(|e| e.to_string())
        }
        "get_installed_packages" => {
            let request: GetInstalledPackagesRequest =
                serde_json::from_value(tool_call.input.clone())
                    .map_err(|e| format!("Invalid request: {}", e))?;

            let mut executor = state.r_executor.lock().await;
            state
                .r_context_tool
                .get_installed_packages(request, &mut executor)
                .await
                .and_then(|pkgs| {
                    serde_json::to_string(&pkgs)
                        .map_err(|e| reprod_core::ReprodError::IOError(e.to_string()))
                })
                .map_err(|e| e.to_string())
        }
        _ => Err(format!("Unknown tool: {}", tool_call.name)),
    }
}

async fn handle_export_rmarkdown(
    request: ExportRMarkdownRequest,
    state: &AppState,
) -> Result<ExportRMarkdownResponse, String> {
    // Get document path before consuming request
    let document_path = request.document_path();

    // Parse request into options
    let (mode, options, output_path) = request
        .into_options()
        .map_err(|e| format!("Invalid export options: {}", e))?;

    // Create generator
    let generator = RMarkdownGenerator::new(options);

    // Generate RMarkdown content based on mode
    let content = match mode {
        reprod_core::export::ExportMode::Timeline => {
            // Query all events from timeline
            let query = reprod_core::executor::timeline::TimelineQuery {
                filters: None,
                sort: Some(reprod_core::executor::timeline::SortOrder::Asc),
                limit: Some(10000), // Large limit to get all events
                offset: None,
            };

            let response = state
                .timeline
                .query(query)
                .map_err(|e| format!("Failed to query timeline: {}", e))?;

            // Create bundle from events
            let bundle = ReproductionBundle::from_events(response.events);

            // Generate RMarkdown
            generator.from_timeline(&bundle)
        }
        reprod_core::export::ExportMode::Document => {
            // Get document path (required for document mode)
            let doc_path = document_path.ok_or("Document path is required for document mode")?;

            // Read document content
            let doc_content = tokio::fs::read_to_string(&doc_path)
                .await
                .map_err(|e| format!("Failed to read document: {}", e))?;

            // Create metadata with simple timestamp-based ID
            let timestamp = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs();
            let metadata = BundleMetadata::new(format!("export-{}", timestamp));

            // Generate RMarkdown
            generator.from_document(&doc_path, &doc_content, &metadata)
        }
    };

    // Write to file
    tokio::fs::write(&output_path, content)
        .await
        .map_err(|e| format!("Failed to write RMarkdown file: {}", e))?;

    Ok(ExportRMarkdownResponse::success(output_path))
}
