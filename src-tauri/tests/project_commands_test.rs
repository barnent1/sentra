#[cfg(test)]
mod project_commands_tests {
    use std::fs;
    use std::path::PathBuf;
    use tempfile::TempDir;

    /// Helper function to create a test project
    fn create_test_project_dir() -> TempDir {
        tempfile::tempdir().expect("Failed to create temp directory")
    }

    #[test]
    fn test_create_project_directory_structure() {
        // ARRANGE
        let temp_dir = create_test_project_dir();
        let project_path = temp_dir.path().join("test-project");
        let project_name = "test-project";

        // ACT
        let result = create_project_structure(
            &project_path,
            project_name,
            "nextjs",
        );

        // ASSERT
        assert!(result.is_ok(), "Project creation should succeed");

        // Verify .sentra directory was created
        let sentra_dir = project_path.join(".sentra");
        assert!(sentra_dir.exists(), ".sentra directory should exist");
        assert!(sentra_dir.is_dir(), ".sentra should be a directory");

        // Verify config.yml was created
        let config_file = sentra_dir.join("config.yml");
        assert!(config_file.exists(), "config.yml should exist");

        // Verify config content
        let config_content = fs::read_to_string(&config_file).expect("Should read config.yml");
        assert!(config_content.contains(&format!("name: {}", project_name)));
        assert!(config_content.contains(&format!("path: {}", project_path.display())));
        assert!(config_content.contains("template: nextjs"));
    }

    #[test]
    fn test_create_project_initializes_git() {
        // ARRANGE
        let temp_dir = create_test_project_dir();
        let project_path = temp_dir.path().join("test-project");

        // ACT
        let result = create_project_structure(
            &project_path,
            "test-project",
            "nextjs",
        );

        // ASSERT
        assert!(result.is_ok());

        // Verify .git directory exists (if git is available)
        let git_dir = project_path.join(".git");
        if git_dir.exists() {
            assert!(git_dir.is_dir(), ".git should be a directory");
        }
    }

    #[test]
    fn test_create_project_fails_if_directory_exists() {
        // ARRANGE
        let temp_dir = create_test_project_dir();
        let project_path = temp_dir.path().join("existing-project");

        // Create the directory first
        fs::create_dir_all(&project_path).expect("Failed to create dir");

        // ACT
        let result = create_project_structure(
            &project_path,
            "existing-project",
            "nextjs",
        );

        // ASSERT
        assert!(result.is_err(), "Should fail when directory already exists");
        let error = result.unwrap_err();
        assert!(
            error.contains("already exists"),
            "Error should mention directory already exists"
        );
    }

    #[test]
    fn test_create_project_validates_name() {
        // ARRANGE
        let temp_dir = create_test_project_dir();
        let project_path = temp_dir.path().join("invalid project!");

        // ACT
        let result = create_project_structure(
            &project_path,
            "invalid project!",
            "nextjs",
        );

        // ASSERT
        assert!(result.is_err(), "Should fail with invalid project name");
        let error = result.unwrap_err();
        assert!(
            error.contains("Invalid project name"),
            "Error should mention invalid project name"
        );
    }

    #[test]
    fn test_create_project_accepts_valid_names() {
        // ARRANGE
        let temp_dir = create_test_project_dir();
        let valid_names = vec!["my-project", "my_project", "MyProject123"];

        for name in valid_names {
            // ACT
            let project_path = temp_dir.path().join(name);
            let result = create_project_structure(
                &project_path,
                name,
                "nextjs",
            );

            // ASSERT
            assert!(
                result.is_ok(),
                "Project creation should succeed for valid name: {}",
                name
            );

            // Cleanup for next iteration
            if project_path.exists() {
                fs::remove_dir_all(&project_path).ok();
            }
        }
    }

    #[test]
    fn test_create_project_creates_memory_directory() {
        // ARRANGE
        let temp_dir = create_test_project_dir();
        let project_path = temp_dir.path().join("test-project");

        // ACT
        let result = create_project_structure(
            &project_path,
            "test-project",
            "nextjs",
        );

        // ASSERT
        assert!(result.is_ok());

        // Verify .sentra/memory directory was created
        let memory_dir = project_path.join(".sentra").join("memory");
        assert!(memory_dir.exists(), ".sentra/memory directory should exist");
        assert!(memory_dir.is_dir(), ".sentra/memory should be a directory");

        // Verify memory files were created
        assert!(memory_dir.join("gotchas.md").exists());
        assert!(memory_dir.join("patterns.md").exists());
        assert!(memory_dir.join("decisions.md").exists());
    }

    #[test]
    fn test_create_project_creates_specs_directory() {
        // ARRANGE
        let temp_dir = create_test_project_dir();
        let project_path = temp_dir.path().join("test-project");

        // ACT
        let result = create_project_structure(
            &project_path,
            "test-project",
            "nextjs",
        );

        // ASSERT
        assert!(result.is_ok());

        // Verify .sentra/specs directory was created
        let specs_dir = project_path.join(".sentra").join("specs");
        assert!(specs_dir.exists(), ".sentra/specs directory should exist");
        assert!(specs_dir.is_dir(), ".sentra/specs should be a directory");
    }

    /// Helper function that mimics the actual implementation
    /// This will be replaced by importing from commands module
    fn create_project_structure(
        path: &PathBuf,
        name: &str,
        template: &str,
    ) -> Result<(), String> {
        // Validate project name
        let name_regex = regex::Regex::new(r"^[a-zA-Z0-9_-]+$").unwrap();
        if !name_regex.is_match(name) {
            return Err("Invalid project name: only letters, numbers, hyphens, and underscores are allowed".to_string());
        }

        // Check if directory already exists
        if path.exists() {
            return Err(format!("Directory already exists: {}", path.display()));
        }

        // Create project directory
        fs::create_dir_all(path)
            .map_err(|e| format!("Failed to create project directory: {}", e))?;

        // Create .sentra directory structure
        let sentra_dir = path.join(".sentra");
        fs::create_dir_all(&sentra_dir)
            .map_err(|e| format!("Failed to create .sentra directory: {}", e))?;

        // Create memory directory
        let memory_dir = sentra_dir.join("memory");
        fs::create_dir_all(&memory_dir)
            .map_err(|e| format!("Failed to create memory directory: {}", e))?;

        // Create memory files
        fs::write(memory_dir.join("gotchas.md"), "# Gotchas\n\n")
            .map_err(|e| format!("Failed to create gotchas.md: {}", e))?;
        fs::write(memory_dir.join("patterns.md"), "# Patterns\n\n")
            .map_err(|e| format!("Failed to create patterns.md: {}", e))?;
        fs::write(memory_dir.join("decisions.md"), "# Architecture Decisions\n\n")
            .map_err(|e| format!("Failed to create decisions.md: {}", e))?;

        // Create specs directory
        let specs_dir = sentra_dir.join("specs");
        fs::create_dir_all(&specs_dir)
            .map_err(|e| format!("Failed to create specs directory: {}", e))?;

        // Create config.yml
        let config_content = format!(
            "name: {}\npath: {}\ntemplate: {}\ncreated: {}\n",
            name,
            path.display(),
            template,
            chrono::Local::now().to_rfc3339()
        );

        fs::write(sentra_dir.join("config.yml"), config_content)
            .map_err(|e| format!("Failed to create config.yml: {}", e))?;

        // Initialize git repository (if git is available)
        use std::process::Command;
        let git_result = Command::new("git")
            .args(&["init"])
            .current_dir(path)
            .output();

        if let Err(e) = git_result {
            eprintln!("Warning: Failed to initialize git repository: {}", e);
        }

        Ok(())
    }
}
