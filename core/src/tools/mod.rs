//! Tool registry primitives shared between the desktop and server runtimes.

pub mod executor;
pub mod manifest;
pub mod registry;
pub mod validator;

pub use executor::{Artifact, ToolExecutionResult, ToolExecutor};
pub use manifest::*;
pub use registry::ToolRegistry;
pub use validator::{ToolValidator, ValidationResult};
