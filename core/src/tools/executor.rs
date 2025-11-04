use anyhow::{anyhow, Context, Result};
use std::collections::HashMap;
use std::time::Instant;
use serde_json::Value;

use super::{CapabilityDescriptor, CapabilityKind, ToolManifest, ToolRegistry};
use crate::RExecutor;

/// Artifact generated during tool execution
#[derive(Debug, Clone)]
pub struct Artifact {
    pub path: String,
    pub artifact_type: String,
    pub label: Option<String>,
    pub record_as: String,
}

/// Result of tool execution
#[derive(Debug)]
pub struct ToolExecutionResult {
    pub tool_id: String,
    pub capability_id: String,
    pub success: bool,
    pub stdout: Option<String>,
    pub stderr: Option<String>,
    pub artifacts: Vec<Artifact>,
    pub execution_time_ms: u64,
    pub error: Option<String>,
}

/// Executes tool capabilities using the appropriate runtime
pub struct ToolExecutor {
    registry: std::sync::Arc<ToolRegistry>,
}

impl ToolExecutor {
    pub fn new(registry: std::sync::Arc<ToolRegistry>) -> Self {
        Self { registry }
    }

    /// Execute a tool capability with the given parameters
    pub async fn execute(
        &self,
        tool_id: &str,
        capability_id: &str,
        parameters: HashMap<String, Value>,
        r_executor: &mut RExecutor,
    ) -> Result<ToolExecutionResult> {
        let start_time = Instant::now();

        // Look up the capability
        let (manifest, capability) = self
            .registry
            .capability(capability_id)
            .ok_or_else(|| anyhow!("Capability {} not found", capability_id))?;

        // Verify tool_id matches
        if manifest.id != tool_id {
            return Err(anyhow!(
                "Tool ID mismatch: expected {}, got {}",
                manifest.id,
                tool_id
            ));
        }

        // Execute based on capability kind
        let result = match capability.kind {
            CapabilityKind::RFunction | CapabilityKind::RSnippet => {
                self.execute_r_capability(manifest, capability, parameters, r_executor)
                    .await?
            }
            CapabilityKind::CliCommand => {
                self.execute_cli_capability(manifest, capability, parameters)
                    .await?
            }
        };

        let execution_time_ms = start_time.elapsed().as_millis() as u64;

        Ok(ToolExecutionResult {
            tool_id: tool_id.to_string(),
            capability_id: capability_id.to_string(),
            execution_time_ms,
            ..result
        })
    }

    async fn execute_r_capability(
        &self,
        _manifest: &ToolManifest,
        capability: &CapabilityDescriptor,
        parameters: HashMap<String, Value>,
        r_executor: &mut RExecutor,
    ) -> Result<ToolExecutionResult> {
        // Generate R code from template
        let code = self.render_template(&capability.template, &parameters)?;

        // Execute via RExecutor
        let exec_result = r_executor
            .execute(code)
            .await
            .context("R execution failed")?;

        // TODO: Extract artifacts from R execution result
        let artifacts = vec![];

        Ok(ToolExecutionResult {
            tool_id: String::new(),
            capability_id: String::new(),
            success: exec_result.success,
            stdout: Some(exec_result.output),
            stderr: exec_result.error.clone(),
            artifacts,
            execution_time_ms: exec_result.execution_time_ms,
            error: exec_result.error,
        })
    }

    async fn execute_cli_capability(
        &self,
        _manifest: &ToolManifest,
        capability: &CapabilityDescriptor,
        parameters: HashMap<String, Value>,
    ) -> Result<ToolExecutionResult> {
        // Generate command from template
        let command = self.render_template(&capability.template, &parameters)?;

        if command.is_empty() {
            return Err(anyhow!("Empty command"));
        }

        // Execute CLI command via shell to support redirects and pipes
        // Use sh on Unix, cmd on Windows
        #[cfg(unix)]
        let output = tokio::process::Command::new("sh")
            .arg("-c")
            .arg(&command)
            .output()
            .await
            .context("Failed to execute CLI command")?;

        #[cfg(windows)]
        let output = tokio::process::Command::new("cmd")
            .args(&["/C", &command])
            .output()
            .await
            .context("Failed to execute CLI command")?;

        let success = output.status.success();
        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();

        // TODO: Extract artifacts based on output_spec
        let artifacts = vec![];

        Ok(ToolExecutionResult {
            tool_id: String::new(),
            capability_id: String::new(),
            success,
            stdout: Some(stdout),
            stderr: if stderr.is_empty() {
                None
            } else {
                Some(stderr.clone())
            },
            artifacts,
            execution_time_ms: 0,
            error: if !success {
                Some(format!("Command failed with exit code {:?}", output.status.code()))
            } else {
                None
            },
        })
    }

    fn render_template(
        &self,
        template: &Option<String>,
        parameters: &HashMap<String, Value>,
    ) -> Result<String> {
        let template_str = template
            .as_ref()
            .ok_or_else(|| anyhow!("No template provided"))?;

        let mut result = template_str.clone();

        // Simple template substitution: {{param_name}} -> value
        for (key, value) in parameters {
            let placeholder = format!("{{{{{}}}}}", key);
            let value_str = match value {
                Value::String(s) => s.clone(),
                Value::Number(n) => n.to_string(),
                Value::Bool(b) => b.to_string(),
                _ => value.to_string(),
            };
            result = result.replace(&placeholder, &value_str);
        }

        // Check for unresolved placeholders
        if result.contains("{{") {
            return Err(anyhow!("Unresolved template parameters in: {}", result));
        }

        Ok(result)
    }
}
