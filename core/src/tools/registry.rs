use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

use anyhow::{Context, Result};

use super::{CapabilityDescriptor, ToolManifest};

/// In-memory registry for tool manifests and capabilities.
#[derive(Debug, Default)]
pub struct ToolRegistry {
    manifests: HashMap<String, ToolManifest>,
    source_dir: Option<PathBuf>,
}

impl ToolRegistry {
    /// Creates an empty registry.
    pub fn new() -> Self {
        Self {
            manifests: HashMap::new(),
            source_dir: None,
        }
    }

    /// Loads all manifests from the given directory. Non-existent directories are treated as empty.
    pub fn load_from_dir<P: AsRef<Path>>(path: P) -> Result<Self> {
        let directory = path.as_ref();
        let mut registry = Self {
            manifests: HashMap::new(),
            source_dir: Some(directory.to_path_buf()),
        };

        if !directory.exists() {
            tracing::debug!(
                "tool manifest directory {} missing; starting with empty registry",
                directory.display()
            );
            return Ok(registry);
        }

        for entry in fs::read_dir(directory).with_context(|| {
            format!(
                "failed to enumerate tool manifests under {}",
                directory.display()
            )
        })? {
            let entry = entry.with_context(|| {
                format!(
                    "failed to access entry under tool manifest directory {}",
                    directory.display()
                )
            })?;

            let file_path = entry.path();
            if !entry
                .file_type()
                .with_context(|| format!("failed to inspect {}", file_path.display()))?
                .is_file()
            {
                continue;
            }

            if !is_toml_file(&file_path) {
                continue;
            }

            let contents = fs::read_to_string(&file_path)
                .with_context(|| format!("failed to read tool manifest {}", file_path.display()))?;

            let manifest: ToolManifest = toml::from_str(&contents).with_context(|| {
                format!("failed to parse tool manifest {}", file_path.display())
            })?;

            registry.register(manifest);
        }

        Ok(registry)
    }

    /// Returns the directory the registry was loaded from, if any.
    pub fn source_dir(&self) -> Option<&Path> {
        self.source_dir.as_deref()
    }

    /// Registers or replaces a manifest.
    pub fn register(&mut self, manifest: ToolManifest) -> Option<ToolManifest> {
        self.manifests.insert(manifest.id.clone(), manifest)
    }

    /// Returns the manifest for a given tool id.
    pub fn get(&self, tool_id: &str) -> Option<&ToolManifest> {
        self.manifests.get(tool_id)
    }

    /// Returns an iterator over all manifests.
    pub fn iter(&self) -> impl Iterator<Item = &ToolManifest> {
        self.manifests.values()
    }

    /// Resolves a capability descriptor by id and returns both the descriptor and its parent manifest.
    pub fn capability(
        &self,
        capability_id: &str,
    ) -> Option<(&ToolManifest, &CapabilityDescriptor)> {
        self.manifests.values().find_map(|manifest| {
            manifest
                .capabilities
                .iter()
                .find(|capability| capability.id == capability_id)
                .map(|capability| (manifest, capability))
        })
    }

    /// Number of registered manifests.
    pub fn len(&self) -> usize {
        self.manifests.len()
    }

    /// Returns true if no manifests are registered.
    pub fn is_empty(&self) -> bool {
        self.manifests.is_empty()
    }
}

fn is_toml_file(path: &Path) -> bool {
    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| ext.eq_ignore_ascii_case("toml"))
        .unwrap_or(false)
}
