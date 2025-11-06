use reprod_core::tools::{ToolManifest, ToolRegistry};
use std::fs;
use std::path::PathBuf;

/// Test that all tool manifest files can be parsed without errors
#[test]
fn test_all_manifests_parse_successfully() {
    let tools_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("tools");

    assert!(
        tools_dir.exists(),
        "Tools directory should exist at {:?}",
        tools_dir
    );

    let entries = fs::read_dir(&tools_dir).expect("Failed to read tools directory");
    let mut manifest_count = 0;

    for entry in entries {
        let entry = entry.expect("Failed to read directory entry");
        let path = entry.path();

        if path.extension().and_then(|s| s.to_str()) == Some("toml") {
            manifest_count += 1;
            let contents = fs::read_to_string(&path)
                .unwrap_or_else(|_| panic!("Failed to read manifest file: {:?}", path));

            let result: Result<ToolManifest, toml::de::Error> = toml::from_str(&contents);

            assert!(
                result.is_ok(),
                "Failed to parse manifest {:?}: {}",
                path.file_name().unwrap(),
                result.unwrap_err()
            );
        }
    }

    assert!(
        manifest_count > 0,
        "Should have at least one tool manifest file"
    );
    println!("Successfully parsed {} tool manifests", manifest_count);
}

/// Test that the ToolRegistry can load all manifests
#[test]
fn test_registry_loads_all_manifests() {
    let tools_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("tools");

    let registry = ToolRegistry::load_from_dir(&tools_dir).expect("Failed to load tool registry");

    assert!(
        !registry.is_empty(),
        "Registry should contain at least one manifest"
    );

    println!(
        "Successfully loaded {} manifests into registry",
        registry.len()
    );
}

/// Test manifest structure and required fields for R packages
#[test]
fn test_r_package_manifest_structure() {
    let tools_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("tools");
    let registry = ToolRegistry::load_from_dir(&tools_dir).expect("Failed to load tool registry");

    for manifest in registry.iter() {
        // Check basic fields
        assert!(!manifest.id.is_empty(), "Tool ID should not be empty");
        assert!(
            !manifest.display_name.is_empty(),
            "Display name should not be empty for tool {}",
            manifest.id
        );
        assert!(
            !manifest.description.is_empty(),
            "Description should not be empty for tool {}",
            manifest.id
        );

        // Check capabilities
        assert!(
            !manifest.capabilities.is_empty(),
            "Tool {} should have at least one capability",
            manifest.id
        );

        for capability in &manifest.capabilities {
            assert!(
                !capability.id.is_empty(),
                "Capability ID should not be empty in tool {}",
                manifest.id
            );
            assert!(
                capability.id.starts_with(&format!("{}::", manifest.id)),
                "Capability ID '{}' should start with tool ID prefix '{}::'",
                capability.id,
                manifest.id
            );
            assert!(
                !capability.display_name.is_empty(),
                "Capability display_name should not be empty in tool {}",
                manifest.id
            );
            assert!(
                !capability.description.is_empty(),
                "Capability description should not be empty in tool {}",
                manifest.id
            );
            assert!(
                !capability.entrypoint.is_empty(),
                "Capability entrypoint should not be empty in tool {}",
                manifest.id
            );
        }
    }
}

/// Test that specific expected tools are present
#[test]
fn test_expected_tools_present() {
    let tools_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("tools");
    let registry = ToolRegistry::load_from_dir(&tools_dir).expect("Failed to load tool registry");

    let expected_tools = vec![
        "ape",
        "mafft",
        "biostrings",
        "seqinr",
        "phangorn",
        "ggtree",
        "blast",
        "samtools",
    ];

    for tool_id in expected_tools {
        assert!(
            registry.get(tool_id).is_some(),
            "Expected tool '{}' should be present in registry",
            tool_id
        );
    }
}

/// Test that each tool has valid validation configuration
#[test]
fn test_validation_configuration() {
    let tools_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("tools");
    let registry = ToolRegistry::load_from_dir(&tools_dir).expect("Failed to load tool registry");

    for manifest in registry.iter() {
        let validation = &manifest.validation;

        match manifest.kind {
            reprod_core::tools::ToolKind::RPackage => {
                assert!(
                    !validation.requires_packages.is_empty(),
                    "R package tool '{}' should specify required packages",
                    manifest.id
                );
                assert!(
                    validation.preflight_r.is_some(),
                    "R package tool '{}' should have preflight_r check",
                    manifest.id
                );
            }
            reprod_core::tools::ToolKind::Cli => {
                assert!(
                    !validation.requires_cli.is_empty(),
                    "CLI tool '{}' should specify required CLI tools",
                    manifest.id
                );
                assert!(
                    validation.preflight_cli.is_some(),
                    "CLI tool '{}' should have preflight_cli check",
                    manifest.id
                );
            }
        }
    }
}

/// Test that capability templates contain valid placeholders
#[test]
fn test_capability_templates() {
    let tools_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("tools");
    let registry = ToolRegistry::load_from_dir(&tools_dir).expect("Failed to load tool registry");

    for manifest in registry.iter() {
        for capability in &manifest.capabilities {
            if let Some(template) = &capability.template {
                // Find all placeholders in template
                let placeholders: Vec<&str> = template
                    .split("{{")
                    .skip(1)
                    .filter_map(|s| s.split("}}").next())
                    .collect();

                // Check that each placeholder corresponds to an input parameter
                for placeholder in &placeholders {
                    let found = capability
                        .input_spec
                        .iter()
                        .any(|param| param.name == *placeholder);

                    assert!(
                        found,
                        "Template placeholder '{{{{{}}}}}' in capability '{}' should have a corresponding input parameter",
                        placeholder,
                        capability.id
                    );
                }

                // Check that all required input parameters appear in template
                for param in &capability.input_spec {
                    if param.default.is_none() && param.role.as_deref() != Some("generated") {
                        let placeholder = format!("{{{{{}}}}}", param.name);
                        assert!(
                            template.contains(&placeholder),
                            "Required parameter '{}' should appear in template for capability '{}'",
                            param.name,
                            capability.id
                        );
                    }
                }
            }
        }
    }
}

/// Test that tools have appropriate tags
#[test]
fn test_tool_tags() {
    let tools_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("tools");
    let registry = ToolRegistry::load_from_dir(&tools_dir).expect("Failed to load tool registry");

    for manifest in registry.iter() {
        assert!(
            !manifest.tags.is_empty(),
            "Tool '{}' should have at least one tag",
            manifest.id
        );

        // Check that tags are lowercase and use hyphens (numbers allowed)
        for tag in &manifest.tags {
            assert!(
                tag.chars()
                    .all(|c| c.is_lowercase() || c == '-' || c.is_numeric()),
                "Tag '{}' in tool '{}' should be lowercase with hyphens and numbers only",
                tag,
                manifest.id
            );
        }
    }
}

/// Test that capability lookups work correctly
#[test]
fn test_capability_lookup() {
    let tools_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("tools");
    let registry = ToolRegistry::load_from_dir(&tools_dir).expect("Failed to load tool registry");

    // Test a specific capability lookup
    if let Some(_ape_manifest) = registry.get("ape") {
        let result = registry.capability("ape::read_alignment");
        assert!(
            result.is_some(),
            "Should be able to lookup ape::read_alignment capability"
        );

        let (manifest, capability) = result.unwrap();
        assert_eq!(manifest.id, "ape");
        assert_eq!(capability.id, "ape::read_alignment");
    }
}

/// Test that input parameter types are valid
#[test]
fn test_input_parameter_types() {
    let tools_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("tools");
    let registry = ToolRegistry::load_from_dir(&tools_dir).expect("Failed to load tool registry");

    for manifest in registry.iter() {
        for capability in &manifest.capabilities {
            for param in &capability.input_spec {
                // Check that enum parameters have options
                if matches!(param.kind, reprod_core::tools::ParameterType::Enum) {
                    assert!(
                        !param.options.is_empty(),
                        "Enum parameter '{}' in capability '{}' should have options",
                        param.name,
                        capability.id
                    );
                }

                // Check that numeric parameters with min/max are valid
                if let (Some(min), Some(max)) = (param.min, param.max) {
                    assert!(
                        min < max,
                        "Parameter '{}' in capability '{}' should have min < max",
                        param.name,
                        capability.id
                    );
                }
            }
        }
    }
}

/// Test that output specifications are valid
#[test]
fn test_output_specifications() {
    let tools_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("tools");
    let registry = ToolRegistry::load_from_dir(&tools_dir).expect("Failed to load tool registry");

    for manifest in registry.iter() {
        for capability in &manifest.capabilities {
            assert!(
                !capability.output_spec.is_empty(),
                "Capability '{}' should have at least one output specification",
                capability.id
            );

            for output in &capability.output_spec {
                // File outputs should have a path
                if matches!(output.kind, reprod_core::tools::OutputType::File) {
                    assert!(
                        output.path.is_some(),
                        "File output in capability '{}' should specify a path",
                        capability.id
                    );
                }

                // R object outputs should have a class
                if matches!(output.kind, reprod_core::tools::OutputType::RObject) {
                    assert!(
                        output.class.is_some(),
                        "R object output in capability '{}' should specify a class",
                        capability.id
                    );
                }
            }
        }
    }
}
