pub mod protocol;
pub mod error;
pub mod api;
pub mod ai;
pub mod config;
pub mod executor;
pub mod timeline;
pub mod tools;
pub mod export;

// Re-export protocol types (for API boundaries)
pub use protocol::*;
pub use error::*;

// Re-export core services
pub use ai::{AIProvider, AnthropicProvider, OpenAIProvider};
pub use config::Config;
pub use executor::{CommandOutput, CommandRunner, RExecutor, RExecutorBuilder};

// Re-export tools (excluding ToolExecutionResult to avoid conflict with protocol)
pub use tools::{
    executor::{Artifact as ToolArtifact, ToolExecutor},
    manifest::*,
    registry::ToolRegistry,
    validator::{ToolValidator, ValidationResult},
};
