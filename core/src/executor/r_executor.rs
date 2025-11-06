use std::{
    path::{Path, PathBuf},
    sync::Arc,
    time::{Instant, SystemTime, UNIX_EPOCH},
};

use crate::{
    CodeBlockKind, CodeBlockMetadata, EnvironmentSnapshot, ExecutionContext, ExecutionEvent,
    ExecutionRequest, ExecutionResult, ExecutionSource, PlotInfo,
};
use anyhow::{anyhow, Result};
use async_trait::async_trait;
use base64::Engine;
use tokio::{fs, process::Command};
use uuid::Uuid;

use super::{segment_r_code, NoopTimeline, SegmentationInput, TimelineSink};

pub struct RExecutor {
    temp_dir: PathBuf,
    r_path: String,
    timeline: Arc<dyn TimelineSink>,
    command_runner: Arc<dyn CommandRunner>,
}

impl RExecutor {
    pub fn new(temp_dir: PathBuf, r_path: String) -> Self {
        Self {
            temp_dir,
            r_path,
            timeline: Arc::new(NoopTimeline),
            command_runner: Arc::new(ProcessCommandRunner),
        }
    }

    pub fn builder(temp_dir: PathBuf, r_path: String) -> RExecutorBuilder {
        RExecutorBuilder::new(temp_dir, r_path)
    }

    pub async fn execute(&self, request: ExecutionRequest) -> Result<ExecutionResult> {
        let (result, _) = self.execute_with_event(request).await?;
        Ok(result)
    }

    pub async fn execute_with_event(
        &self,
        request: ExecutionRequest,
    ) -> Result<(ExecutionResult, ExecutionEvent)> {
        let start = Instant::now();

        let mut blocks = ensure_blocks(&request);
        for (idx, block) in blocks.iter_mut().enumerate() {
            block.index = idx as u32;
            if block.label.is_none() {
                block.label = Some(format!("Block {}", idx + 1));
            }
        }

        let timestamp = Uuid::new_v4().to_string();
        let plot_prefix = format!("plot_{}", timestamp);
        let script_path = self.temp_dir.join(format!("script_{}.R", timestamp));

        let wrapped_code = self.wrap_code_with_plot_capture(&request.code, &plot_prefix);
        fs::write(&script_path, wrapped_code).await?;

        let command_output = self.command_runner.run(&self.r_path, &script_path).await?;

        let plots = self.collect_plots(&plot_prefix).await?;
        let _ = fs::remove_file(&script_path).await;

        let execution_time_ms = start.elapsed().as_millis() as u64;
        let stdout = String::from_utf8_lossy(&command_output.stdout).to_string();
        let stderr = String::from_utf8_lossy(&command_output.stderr).to_string();

        let result = ExecutionResult {
            success: command_output.success,
            output: stdout,
            error: if command_output.stderr.is_empty() {
                None
            } else {
                Some(stderr)
            },
            plots,
            execution_time_ms,
        };

        let environment = self.environment_snapshot();
        let event = build_event(&request, &result, environment.clone(), blocks.clone());
        self.timeline.record(event.clone()).await?;

        Ok((result, event))
    }

    fn wrap_code_with_plot_capture(&self, code: &str, plot_prefix: &str) -> String {
        let temp_dir_str = self.temp_dir.to_str().unwrap_or("");

        format!(
            r#"
# Auto-generated plot capture wrapper
.reprod_plot_dir <- "{temp_dir}"
.reprod_plot_prefix <- "{plot_prefix}"

# Open PNG device
.reprod_open_device <- function(index) {{
  filename <- sprintf("%s_%d.png", .reprod_plot_prefix, index)
  png(file.path(.reprod_plot_dir, filename), width = 800, height = 600)
}}

.reprod_open_device(1)

# User code
{code}

# Close device to save file
dev.off()
"#,
            temp_dir = temp_dir_str,
            plot_prefix = plot_prefix,
            code = code
        )
    }

    async fn collect_plots(&self, plot_prefix: &str) -> Result<Vec<PlotInfo>> {
        let mut plots = Vec::new();
        let mut index = 1u32;

        loop {
            let filename = format!("{}_{}.png", plot_prefix, index);
            let path = self.temp_dir.join(&filename);

            if !path.exists() {
                break;
            }

            let data = fs::read(&path).await?;
            let base64_data = base64::engine::general_purpose::STANDARD.encode(&data);

            plots.push(PlotInfo {
                filename,
                base64_data,
                index,
            });

            let _ = fs::remove_file(&path).await;

            index += 1;
        }

        Ok(plots)
    }

    fn environment_snapshot(&self) -> EnvironmentSnapshot {
        EnvironmentSnapshot {
            r_path: self.r_path.clone(),
            working_dir: std::env::current_dir()
                .unwrap_or_else(|_| PathBuf::from("."))
                .to_string_lossy()
                .into_owned(),
            temp_dir: self.temp_dir.to_string_lossy().into_owned(),
        }
    }

    fn now_ms() -> u64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as u64
    }
}

pub struct RExecutorBuilder {
    temp_dir: PathBuf,
    r_path: String,
    timeline: Arc<dyn TimelineSink>,
    command_runner: Arc<dyn CommandRunner>,
}

impl RExecutorBuilder {
    fn new(temp_dir: PathBuf, r_path: String) -> Self {
        Self {
            temp_dir,
            r_path,
            timeline: Arc::new(NoopTimeline),
            command_runner: Arc::new(ProcessCommandRunner),
        }
    }

    pub fn with_timeline<T>(mut self, timeline: T) -> Self
    where
        T: TimelineSink + 'static,
    {
        self.timeline = Arc::new(timeline);
        self
    }

    pub fn with_shared_timeline(mut self, timeline: Arc<dyn TimelineSink>) -> Self {
        self.timeline = timeline;
        self
    }

    pub fn with_command_runner<T>(mut self, runner: T) -> Self
    where
        T: CommandRunner + 'static,
    {
        self.command_runner = Arc::new(runner);
        self
    }

    pub fn build(self) -> RExecutor {
        RExecutor {
            temp_dir: self.temp_dir,
            r_path: self.r_path,
            timeline: self.timeline,
            command_runner: self.command_runner,
        }
    }
}

#[async_trait]
pub trait CommandRunner: Send + Sync {
    async fn run(&self, r_path: &str, script_path: &Path) -> Result<CommandOutput>;
}

#[derive(Debug, Clone)]
pub struct CommandOutput {
    pub success: bool,
    pub stdout: Vec<u8>,
    pub stderr: Vec<u8>,
}

struct ProcessCommandRunner;

#[async_trait]
impl CommandRunner for ProcessCommandRunner {
    async fn run(&self, r_path: &str, script_path: &Path) -> Result<CommandOutput> {
        let script_str = script_path
            .to_str()
            .ok_or_else(|| anyhow!("Invalid path"))?;

        let output = Command::new(r_path)
            .args(["--vanilla", "--quiet", script_str])
            .output()
            .await?;

        Ok(CommandOutput {
            success: output.status.success(),
            stdout: output.stdout,
            stderr: output.stderr,
        })
    }
}

fn ensure_blocks(request: &ExecutionRequest) -> Vec<CodeBlockMetadata> {
    if !request.blocks.is_empty() {
        return request.blocks.clone();
    }

    if matches!(request.context.source, ExecutionSource::Selection) {
        let line_count = request.code.lines().count().max(1) as u32;
        return vec![CodeBlockMetadata {
            id: Uuid::new_v4().to_string(),
            index: 0,
            kind: CodeBlockKind::Selection,
            label: Some("Selection".into()),
            start_line: 1,
            end_line: line_count,
            code: request.code.clone(),
        }];
    }

    let filename = request.context.document_path.as_deref();
    let mut blocks = segment_r_code(SegmentationInput {
        content: &request.code,
        filename,
    });

    if blocks.is_empty() {
        let line_count = request.code.lines().count().max(1) as u32;
        blocks.push(CodeBlockMetadata {
            id: Uuid::new_v4().to_string(),
            index: 0,
            kind: CodeBlockKind::Document,
            label: Some("Document".into()),
            start_line: 1,
            end_line: line_count,
            code: request.code.clone(),
        });
    }

    blocks
}

fn build_event(
    request: &ExecutionRequest,
    result: &ExecutionResult,
    environment: EnvironmentSnapshot,
    blocks: Vec<CodeBlockMetadata>,
) -> ExecutionEvent {
    ExecutionEvent {
        event_id: Uuid::new_v4().to_string(),
        context: ExecutionContext {
            source: request.context.source.clone(),
            document_path: request.context.document_path.clone(),
            cell_index: request.context.cell_index,
            triggered_at_ms: request.context.triggered_at_ms,
            actor: request.context.actor.clone(),
        },
        blocks,
        result: result.clone(),
        environment,
        created_at_ms: RExecutor::now_ms(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::executor::InMemoryTimeline;
    use crate::{ExecutionActor, ExecutionContext};
    use anyhow::Result;
    use tokio::sync::Mutex;

    struct MockRunner {
        output: Mutex<CommandOutput>,
    }

    #[async_trait]
    impl CommandRunner for MockRunner {
        async fn run(&self, _r_path: &str, _script_path: &Path) -> Result<CommandOutput> {
            let output = self.output.lock().await;
            Ok(CommandOutput {
                success: output.success,
                stdout: output.stdout.clone(),
                stderr: output.stderr.clone(),
            })
        }
    }

    #[tokio::test]
    async fn records_event_with_provided_blocks() {
        let temp_dir = tempfile::tempdir().expect("temp dir");
        let timeline = InMemoryTimeline::new();
        let runner = MockRunner {
            output: Mutex::new(CommandOutput {
                success: true,
                stdout: b"hello".to_vec(),
                stderr: Vec::new(),
            }),
        };

        let executor = RExecutor::builder(temp_dir.path().to_path_buf(), "Rscript".into())
            .with_timeline(timeline.clone())
            .with_command_runner(runner)
            .build();

        let request = ExecutionRequest {
            code: "print('hello')".into(),
            context: ExecutionContext {
                source: ExecutionSource::Cell,
                document_path: Some("analysis.R".into()),
                cell_index: Some(0),
                triggered_at_ms: 1,
                actor: ExecutionActor::User,
            },
            blocks: vec![CodeBlockMetadata {
                id: "block-1".into(),
                index: 0,
                kind: CodeBlockKind::Section,
                label: Some("Setup".into()),
                start_line: 1,
                end_line: 2,
                code: "print('hello')".into(),
            }],
        };

        let result = executor.execute(request.clone()).await;
        assert!(result.is_ok());

        let events = timeline.events();
        assert_eq!(events.len(), 1);
        let event = &events[0];
        assert_eq!(event.context.source, ExecutionSource::Cell);
        assert_eq!(event.blocks.len(), 1);
        assert_eq!(event.blocks[0].id, "block-1");
        assert_eq!(event.result.output, "hello");
        assert!(event.result.error.is_none());
    }

    #[tokio::test]
    async fn segments_blocks_when_not_provided() {
        let temp_dir = tempfile::tempdir().expect("temp dir");
        let timeline = InMemoryTimeline::new();
        let runner = MockRunner {
            output: Mutex::new(CommandOutput {
                success: false,
                stdout: b"".to_vec(),
                stderr: b"error".to_vec(),
            }),
        };

        let executor = RExecutor::builder(temp_dir.path().to_path_buf(), "Rscript".into())
            .with_timeline(timeline.clone())
            .with_command_runner(runner)
            .build();

        let request = ExecutionRequest {
            code: "# Step ----\nprint('x')".into(),
            context: ExecutionContext {
                source: ExecutionSource::WholeDocument,
                document_path: Some("analysis.R".into()),
                cell_index: None,
                triggered_at_ms: 2,
                actor: ExecutionActor::User,
            },
            blocks: Vec::new(),
        };

        let result = executor.execute(request).await.expect("execution");
        assert!(!result.success);
        assert_eq!(result.error.as_deref(), Some("error"));

        let events = timeline.events();
        assert_eq!(events.len(), 1);
        let event = &events[0];
        assert_eq!(event.blocks.len(), 1);
        let block = &event.blocks[0];
        assert_eq!(block.kind, CodeBlockKind::Section);
        assert!(block.code.contains("print('x')"));
        assert!(event.environment.r_path.contains("Rscript"));
    }
}
