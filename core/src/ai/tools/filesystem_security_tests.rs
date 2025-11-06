use super::*;
use tempfile::TempDir;
use tokio::fs;

#[tokio::test]
async fn test_absolute_path_attack() {
    let temp = TempDir::new().unwrap();
    let tool = FileSystemTool::new(temp.path().to_path_buf());

    // Try various absolute path attacks
    let attacks = vec![
        "/etc/passwd",
        "/etc/shadow",
        "/home/user/.ssh/id_rsa",
        "C:\\Windows\\System32\\config\\SAM",
        "/usr/bin/bash",
    ];

    for attack in attacks {
        let result = tool.validate_path(attack);
        assert!(
            result.is_err(),
            "Absolute path attack should be blocked: {}",
            attack
        );
        assert!(
            result
                .unwrap_err()
                .to_string()
                .contains("Absolute paths are not allowed"),
            "Wrong error message for: {}",
            attack
        );
    }
}

#[tokio::test]
async fn test_parent_directory_traversal_attacks() {
    let temp = TempDir::new().unwrap();
    let tool = FileSystemTool::new(temp.path().to_path_buf());

    let attacks = vec![
        "../../../etc/passwd",
        "../../etc/passwd",
        "../etc/passwd",
        "foo/../../../etc/passwd",
        "./../../etc/passwd",
        "..\\..\\..\\etc\\passwd",
        "foo\\..\\..\\..\\etc\\passwd",
        "data/../../../etc/passwd",
    ];

    for attack in attacks {
        let result = tool.validate_path(attack);
        assert!(
            result.is_err(),
            "Path traversal attack should be blocked: {}",
            attack
        );
        assert!(
            result
                .unwrap_err()
                .to_string()
                .contains("Parent directory references"),
            "Wrong error message for: {}",
            attack
        );
    }
}

#[tokio::test]
async fn test_symlink_escape_attack() {
    let temp = TempDir::new().unwrap();
    let workspace = temp.path();
    let tool = FileSystemTool::new(workspace.to_path_buf());

    // Create a directory outside workspace
    let outside_dir = TempDir::new().unwrap();
    let secret_file = outside_dir.path().join("secret.txt");
    fs::write(&secret_file, "SECRET DATA").await.unwrap();

    // Create a symlink in workspace pointing to outside file
    #[cfg(unix)]
    {
        let link_path = workspace.join("evil_link");
        std::os::unix::fs::symlink(&secret_file, &link_path).unwrap();

        let result = tool.validate_path("evil_link");
        assert!(result.is_err(), "Symlink escape attack should be blocked");
        assert!(
            result
                .unwrap_err()
                .to_string()
                .contains("outside workspace"),
            "Wrong error message for symlink escape"
        );
    }
}

#[tokio::test]
async fn test_null_byte_injection() {
    let temp = TempDir::new().unwrap();
    let tool = FileSystemTool::new(temp.path().to_path_buf());

    // Null byte injection attempts
    let attacks = vec!["file.txt\0.html", "data/file\0/etc/passwd", "test\0"];

    for attack in attacks {
        // These should either be blocked or sanitized
        // Rust's path handling typically rejects null bytes naturally
        let result = tool.validate_path(attack);
        // If validation passes, read should fail safely
        if result.is_ok() {
            let read_result = tool
                .read_file(ReadFileRequest {
                    path: attack.to_string(),
                })
                .await;
            assert!(
                read_result.is_err(),
                "Null byte injection should not succeed: {}",
                attack
            );
        }
    }
}

#[tokio::test]
async fn test_file_size_limit_enforcement() {
    let temp = TempDir::new().unwrap();
    let workspace = temp.path();
    let tool = FileSystemTool::new(workspace.to_path_buf());

    // Create a file larger than MAX_FILE_SIZE (10MB)
    let large_file = workspace.join("large.bin");
    let large_content = vec![0u8; (MAX_FILE_SIZE + 1) as usize];
    fs::write(&large_file, large_content).await.unwrap();

    // Try to read large file
    let result = tool
        .read_file(ReadFileRequest {
            path: "large.bin".to_string(),
        })
        .await;

    assert!(result.is_err(), "Large file read should be blocked");
    assert!(
        result.unwrap_err().to_string().contains("exceeds maximum"),
        "Wrong error message for large file"
    );
}

#[tokio::test]
async fn test_write_size_limit_enforcement() {
    let temp = TempDir::new().unwrap();
    let tool = FileSystemTool::new(temp.path().to_path_buf());

    // Try to write content larger than MAX_FILE_SIZE
    let large_content = "x".repeat((MAX_FILE_SIZE + 1) as usize);

    let result = tool
        .write_file(WriteFileRequest {
            path: "large.txt".to_string(),
            content: large_content,
        })
        .await;

    assert!(result.is_err(), "Large file write should be blocked");
    let err_msg = result.unwrap_err().to_string();
    assert!(
        err_msg.contains("exceeds maximum"),
        "Wrong error message for large write: {}",
        err_msg
    );
}

#[tokio::test]
async fn test_directory_traversal_with_encoded_characters() {
    let temp = TempDir::new().unwrap();
    let tool = FileSystemTool::new(temp.path().to_path_buf());

    // URL-encoded and other encoded traversal attempts
    let attacks = vec![
        "%2e%2e%2f%2e%2e%2fetc%2fpasswd", // URL encoded ../
        "..%2f..%2fetc%2fpasswd",
        "%2e%2e/etc/passwd",
    ];

    for attack in attacks {
        // Most of these will be caught by the ".." check
        let result = tool.validate_path(attack);
        // Either blocked at validation or would fail at file system level
        if result.is_ok() {
            let read_result = tool
                .read_file(ReadFileRequest {
                    path: attack.to_string(),
                })
                .await;
            assert!(
                read_result.is_err(),
                "Encoded traversal should not succeed: {}",
                attack
            );
        }
    }
}

#[tokio::test]
async fn test_valid_paths_allowed() {
    let temp = TempDir::new().unwrap();
    let workspace = temp.path();
    let tool = FileSystemTool::new(workspace.to_path_buf());

    // Create test files
    fs::write(workspace.join("test.txt"), "content")
        .await
        .unwrap();
    fs::create_dir_all(workspace.join("data")).await.unwrap();
    fs::write(workspace.join("data/file.csv"), "a,b,c")
        .await
        .unwrap();

    // These should all be allowed
    let valid_paths = vec!["test.txt", "data/file.csv", "./test.txt", "data/./file.csv"];

    for path in valid_paths {
        let result = tool.validate_path(path);
        assert!(
            result.is_ok(),
            "Valid path should be allowed: {} - error: {:?}",
            path,
            result.err()
        );
    }
}

#[tokio::test]
async fn test_concurrent_file_operations() {
    let temp = TempDir::new().unwrap();
    let workspace = temp.path();
    let tool = std::sync::Arc::new(FileSystemTool::new(workspace.to_path_buf()));

    // Test concurrent writes
    let mut handles = vec![];
    for i in 0..10 {
        let tool_clone = tool.clone();
        let handle = tokio::spawn(async move {
            tool_clone
                .write_file(WriteFileRequest {
                    path: format!("file_{}.txt", i),
                    content: format!("content {}", i),
                })
                .await
        });
        handles.push(handle);
    }

    // All should succeed
    for handle in handles {
        let result = handle.await.unwrap();
        assert!(result.is_ok(), "Concurrent write should succeed");
    }

    // Verify all files exist
    for i in 0..10 {
        let content = fs::read_to_string(workspace.join(format!("file_{}.txt", i)))
            .await
            .unwrap();
        assert_eq!(content, format!("content {}", i));
    }
}

#[tokio::test]
async fn test_special_characters_in_filenames() {
    let temp = TempDir::new().unwrap();
    let workspace = temp.path();
    let tool = FileSystemTool::new(workspace.to_path_buf());

    // Valid special characters that should work
    let valid_names = vec![
        "file-name.txt",
        "file_name.txt",
        "file.name.txt",
        "file name.txt",
    ];

    for name in valid_names {
        let result = tool
            .write_file(WriteFileRequest {
                path: name.to_string(),
                content: "test".to_string(),
            })
            .await;

        assert!(result.is_ok(), "Valid filename should be allowed: {}", name);
    }
}

#[tokio::test]
async fn test_case_sensitivity() {
    let temp = TempDir::new().unwrap();
    let workspace = temp.path();
    let tool = FileSystemTool::new(workspace.to_path_buf());

    // Write file with specific case
    tool.write_file(WriteFileRequest {
        path: "TestFile.txt".to_string(),
        content: "content".to_string(),
    })
    .await
    .unwrap();

    // On case-sensitive systems, different case = different file
    // On case-insensitive systems (macOS, Windows), same file
    #[cfg(target_os = "linux")]
    {
        let result = tool
            .read_file(ReadFileRequest {
                path: "testfile.txt".to_string(),
            })
            .await;
        assert!(result.is_err(), "Case should matter on Linux");
    }

    // Original case should always work
    let result = tool
        .read_file(ReadFileRequest {
            path: "TestFile.txt".to_string(),
        })
        .await;
    assert!(result.is_ok(), "Original case should work");
}

#[tokio::test]
async fn test_workspace_boundary_with_nested_dirs() {
    let temp = TempDir::new().unwrap();
    let workspace = temp.path();
    let tool = FileSystemTool::new(workspace.to_path_buf());

    // Create nested structure
    fs::create_dir_all(workspace.join("a/b/c")).await.unwrap();
    fs::write(workspace.join("a/b/c/file.txt"), "deep")
        .await
        .unwrap();

    // Should be able to access deeply nested files
    let result = tool
        .read_file(ReadFileRequest {
            path: "a/b/c/file.txt".to_string(),
        })
        .await;

    assert!(result.is_ok(), "Deep nesting should be allowed");
    assert_eq!(result.unwrap(), "deep");
}

#[tokio::test]
async fn test_list_files_security() {
    let temp = TempDir::new().unwrap();
    let workspace = temp.path();
    let tool = FileSystemTool::new(workspace.to_path_buf());

    // Try to list directories outside workspace
    let result = tool
        .list_files(ListFilesRequest {
            path: Some("../../etc".to_string()),
        })
        .await;

    assert!(
        result.is_err(),
        "Listing outside workspace should be blocked"
    );
}

#[tokio::test]
async fn test_write_creates_parent_directories_safely() {
    let temp = TempDir::new().unwrap();
    let workspace = temp.path();
    let tool = FileSystemTool::new(workspace.to_path_buf());

    // Write to nested path that doesn't exist
    let result = tool
        .write_file(WriteFileRequest {
            path: "new/nested/dir/file.txt".to_string(),
            content: "created".to_string(),
        })
        .await;

    assert!(result.is_ok(), "Creating parent dirs should work");

    // Verify file was created
    let content = fs::read_to_string(workspace.join("new/nested/dir/file.txt"))
        .await
        .unwrap();
    assert_eq!(content, "created");

    // Verify all parent dirs are within workspace
    assert!(workspace.join("new").exists());
    assert!(workspace.join("new/nested").exists());
    assert!(workspace.join("new/nested/dir").exists());
}
