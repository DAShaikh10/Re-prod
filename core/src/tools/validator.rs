use anyhow::{anyhow, Result};
use std::collections::HashMap;

use super::{ToolKind, ToolManifest};
use crate::RExecutor;

/// Validation result for a tool
#[derive(Debug)]
pub struct ValidationResult {
    pub tool_id: String,
    pub is_valid: bool,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
}

/// Validates tool availability and prerequisites
pub struct ToolValidator;

impl ToolValidator {
    pub fn new() -> Self {
        Self
    }

    /// Validate all manifests in a registry
    /// Note: R executor validation is not supported in batch mode due to ownership constraints
    pub async fn validate_all(manifests: &[&ToolManifest]) -> HashMap<String, ValidationResult> {
        let mut results = HashMap::new();

        for manifest in manifests {
            let result = Self::validate_manifest(manifest, None).await;
            results.insert(manifest.id.clone(), result);
        }

        results
    }

    /// Validate a single manifest
    pub async fn validate_manifest(
        manifest: &ToolManifest,
        r_executor: Option<&mut RExecutor>,
    ) -> ValidationResult {
        let mut errors = Vec::new();
        let mut warnings = Vec::new();

        match manifest.kind {
            ToolKind::RPackage => {
                // Validate R package availability
                if let Some(executor) = r_executor {
                    if let Err(e) = Self::validate_r_package(manifest, executor).await {
                        errors.push(e.to_string());
                    }
                } else {
                    warnings.push("No R executor available for validation".to_string());
                }
            }
            ToolKind::Cli => {
                // Validate CLI tool availability
                if let Err(e) = Self::validate_cli_tool(manifest).await {
                    errors.push(e.to_string());
                }
            }
        }

        ValidationResult {
            tool_id: manifest.id.clone(),
            is_valid: errors.is_empty(),
            errors,
            warnings,
        }
    }

    async fn validate_r_package(
        manifest: &ToolManifest,
        r_executor: &mut RExecutor,
    ) -> Result<()> {
        let validation = &manifest.validation;

        // Check required packages
        for package in &validation.requires_packages {
            let check_code = format!(
                "if (!requireNamespace('{}', quietly = TRUE)) stop('Package {} not found')",
                package, package
            );

            let result = r_executor.execute(check_code).await?;
            if !result.success {
                return Err(anyhow!("R package '{}' not available", package));
            }
        }

        // Run preflight check if provided
        if let Some(preflight) = &validation.preflight_r {
            let result = r_executor.execute(preflight.to_string()).await?;
            if !result.success {
                return Err(anyhow!(
                    "Preflight check failed: {}",
                    result.error.unwrap_or_default()
                ));
            }
        }

        Ok(())
    }

    async fn validate_cli_tool(manifest: &ToolManifest) -> Result<()> {
        let validation = &manifest.validation;

        // Check required CLI tools
        for cli_tool in &validation.requires_cli {
            if !Self::check_cli_available(cli_tool).await? {
                return Err(anyhow!("CLI tool '{}' not found in PATH", cli_tool));
            }
        }

        // Run preflight check if provided
        if let Some(preflight) = &validation.preflight_cli {
            let parts: Vec<&str> = preflight.split_whitespace().collect();
            if parts.is_empty() {
                return Ok(());
            }

            let output = tokio::process::Command::new(parts[0])
                .args(&parts[1..])
                .output()
                .await?;

            if !output.status.success() {
                return Err(anyhow!(
                    "CLI preflight check failed: {}",
                    String::from_utf8_lossy(&output.stderr)
                ));
            }
        }

        Ok(())
    }

    async fn check_cli_available(tool_name: &str) -> Result<bool> {
        // Use 'which' on Unix-like systems, 'where' on Windows
        #[cfg(unix)]
        let check_command = "which";
        #[cfg(windows)]
        let check_command = "where";

        let output = tokio::process::Command::new(check_command)
            .arg(tool_name)
            .output()
            .await?;

        Ok(output.status.success())
    }
}

impl Default for ToolValidator {
    fn default() -> Self {
        Self::new()
    }
}
