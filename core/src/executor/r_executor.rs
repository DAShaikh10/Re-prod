use reprod_protocol::{ExecutionResult, PlotInfo};
use std::path::PathBuf;
use std::sync::atomic::AtomicU32;
use std::time::Instant;
use tokio::process::Command;
use tokio::fs;
use uuid::Uuid;
use anyhow::Result;
use base64::Engine;

pub struct RExecutor {
    temp_dir: PathBuf,
    r_path: String,
    #[allow(dead_code)]
    plot_counter: AtomicU32,
}

impl RExecutor {
    pub fn new(temp_dir: PathBuf, r_path: String) -> Self {
        Self {
            temp_dir,
            r_path,
            plot_counter: AtomicU32::new(0),
        }
    }

    pub async fn execute(&self, code: String) -> Result<ExecutionResult> {
        let start = Instant::now();

        // Generate unique timestamp
        let timestamp = Uuid::new_v4().to_string();
        let plot_prefix = format!("plot_{}", timestamp);

        // Wrap code with plot capture
        let wrapped_code = self.wrap_code_with_plot_capture(&code, &plot_prefix);

        // Write R script to temp file
        let script_path = self.temp_dir.join(format!("script_{}.R", timestamp));
        fs::write(&script_path, wrapped_code).await?;

        // Execute R
        let output = Command::new(&self.r_path)
            .args(&["--vanilla", "--quiet", script_path.to_str().ok_or_else(|| anyhow::anyhow!("Invalid path"))?])
            .output()
            .await?;

        // Collect plots
        let plots = self.collect_plots(&plot_prefix).await?;

        // Clean up
        let _ = fs::remove_file(&script_path).await;

        let execution_time_ms = start.elapsed().as_millis() as u64;

        Ok(ExecutionResult {
            success: output.status.success(),
            output: String::from_utf8_lossy(&output.stdout).to_string(),
            error: if output.stderr.is_empty() {
                None
            } else {
                Some(String::from_utf8_lossy(&output.stderr).to_string())
            },
            plots,
            execution_time_ms,
        })
    }

    fn wrap_code_with_plot_capture(&self, code: &str, plot_prefix: &str) -> String {
        let temp_dir_str = self.temp_dir.to_str().unwrap_or("");
        let plot_file = format!("{}_{}.png", plot_prefix, 1);

        format!(
            r#"
# Auto-generated plot capture wrapper
.reprod_plot_file <- file.path("{}", "{}")

# Open PNG device
png(.reprod_plot_file, width = 800, height = 600)

# User code
{}

# Close device to save file
dev.off()
"#,
            temp_dir_str, plot_file, code
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

            // Clean up plot file
            let _ = fs::remove_file(&path).await;

            index += 1;
        }

        Ok(plots)
    }
}
