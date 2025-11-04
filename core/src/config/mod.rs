use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub r_path: String,
    pub anthropic_api_key: Option<String>,
    pub openai_api_key: Option<String>,
    #[serde(default = "default_ai_provider")]
    pub default_ai_provider: String,
}

fn default_ai_provider() -> String {
    "openai".to_string()
}

impl Config {
    /// Load config from ~/.reprod/auth.json (Codex pattern)
    pub fn load() -> Result<Self> {
        let config_path = Self::config_path()?;

        if !config_path.exists() {
            return Ok(Self::default());
        }

        let content = std::fs::read_to_string(config_path)?;
        let config = serde_json::from_str(&content)?;
        Ok(config)
    }

    /// Save config to ~/.reprod/auth.json
    pub fn save(&self) -> Result<()> {
        let config_path = Self::config_path()?;

        // Ensure parent directory exists
        if let Some(parent) = config_path.parent() {
            std::fs::create_dir_all(parent)?;
        }

        let content = serde_json::to_string_pretty(self)?;
        std::fs::write(config_path, content)?;
        Ok(())
    }

    /// Get config path: ~/.reprod/auth.json
    fn config_path() -> Result<PathBuf> {
        let home = dirs::home_dir()
            .ok_or_else(|| anyhow::anyhow!("Could not find home directory"))?;
        Ok(home.join(".reprod").join("auth.json"))
    }
}

impl Default for Config {
    fn default() -> Self {
        Self {
            r_path: "/usr/local/bin/R".to_string(),
            anthropic_api_key: std::env::var("ANTHROPIC_API_KEY").ok(),
            openai_api_key: std::env::var("OPENAI_API_KEY").ok(),
            default_ai_provider: default_ai_provider(),
        }
    }
}
