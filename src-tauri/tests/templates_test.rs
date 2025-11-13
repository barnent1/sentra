#[cfg(test)]
mod templates_tests {
    use app_lib::templates::*;
    use std::fs;
    use tempfile::TempDir;

    /// Helper function to create a test directory
    fn create_test_dir() -> TempDir {
        tempfile::tempdir().expect("Failed to create temp directory")
    }

    #[test]
    fn test_get_templates_returns_all_templates() {
        // ARRANGE & ACT
        let templates = get_templates();

        // ASSERT
        assert!(templates.len() >= 3, "Should have at least 3 templates");

        let template_ids: Vec<String> = templates.iter().map(|t| t.id.clone()).collect();
        assert!(template_ids.contains(&"nextjs".to_string()));
        assert!(template_ids.contains(&"python".to_string()));
        assert!(template_ids.contains(&"react".to_string()));
    }

    #[test]
    fn test_get_template_by_id_nextjs() {
        // ARRANGE & ACT
        let template = get_template("nextjs");

        // ASSERT
        assert!(template.is_some());
        let template = template.unwrap();
        assert_eq!(template.id, "nextjs");
        assert_eq!(template.name, "Next.js");
        assert!(template.description.contains("React framework"));
    }

    #[test]
    fn test_get_template_by_id_python() {
        // ARRANGE & ACT
        let template = get_template("python");

        // ASSERT
        assert!(template.is_some());
        let template = template.unwrap();
        assert_eq!(template.id, "python");
        assert_eq!(template.name, "Python (FastAPI)");
        assert!(template.description.contains("FastAPI"));
    }

    #[test]
    fn test_get_template_by_id_react() {
        // ARRANGE & ACT
        let template = get_template("react");

        // ASSERT
        assert!(template.is_some());
        let template = template.unwrap();
        assert_eq!(template.id, "react");
        assert_eq!(template.name, "React (Vite)");
        assert!(template.description.contains("Vite"));
    }

    #[test]
    fn test_get_template_invalid_id() {
        // ARRANGE & ACT
        let template = get_template("invalid-template");

        // ASSERT
        assert!(template.is_none());
    }

    // ============================================================================
    // Python Template Tests
    // ============================================================================

    #[test]
    fn test_python_template_has_required_files() {
        // ARRANGE
        let template = get_template("python").expect("Python template should exist");

        // ACT
        let file_paths: Vec<String> = template.files.iter().map(|f| f.path.clone()).collect();

        // ASSERT - Core files
        assert!(file_paths.contains(&"README.md".to_string()));
        assert!(file_paths.contains(&".gitignore".to_string()));
        assert!(file_paths.contains(&"CLAUDE.md".to_string()));
        assert!(file_paths.contains(&"requirements.txt".to_string()));
        assert!(file_paths.contains(&"requirements-dev.txt".to_string()));

        // ASSERT - App files
        assert!(file_paths.contains(&"app/__init__.py".to_string()));
        assert!(file_paths.contains(&"app/main.py".to_string()));
        assert!(file_paths.contains(&"app/api/__init__.py".to_string()));
        assert!(file_paths.contains(&"app/models/__init__.py".to_string()));
        assert!(file_paths.contains(&"app/services/__init__.py".to_string()));

        // ASSERT - Test files
        assert!(file_paths.contains(&"tests/__init__.py".to_string()));
        assert!(file_paths.contains(&"tests/test_main.py".to_string()));
        assert!(file_paths.contains(&"pytest.ini".to_string()));
    }

    #[test]
    fn test_python_template_has_required_directories() {
        // ARRANGE
        let template = get_template("python").expect("Python template should exist");

        // ACT & ASSERT
        assert!(template.directories.contains(&"app".to_string()));
        assert!(template.directories.contains(&"app/api".to_string()));
        assert!(template.directories.contains(&"app/models".to_string()));
        assert!(template.directories.contains(&"app/services".to_string()));
        assert!(template.directories.contains(&"tests".to_string()));
        assert!(template.directories.contains(&"tests/unit".to_string()));
        assert!(template.directories.contains(&"tests/integration".to_string()));
    }

    #[test]
    fn test_python_template_requirements_has_fastapi() {
        // ARRANGE
        let template = get_template("python").expect("Python template should exist");

        // ACT
        let requirements_file = template
            .files
            .iter()
            .find(|f| f.path == "requirements.txt")
            .expect("requirements.txt should exist");

        // ASSERT
        assert!(requirements_file.content.contains("fastapi"));
        assert!(requirements_file.content.contains("uvicorn"));
        assert!(requirements_file.content.contains("pydantic"));
    }

    #[test]
    fn test_python_template_dev_requirements_has_pytest() {
        // ARRANGE
        let template = get_template("python").expect("Python template should exist");

        // ACT
        let dev_requirements_file = template
            .files
            .iter()
            .find(|f| f.path == "requirements-dev.txt")
            .expect("requirements-dev.txt should exist");

        // ASSERT
        assert!(dev_requirements_file.content.contains("pytest"));
        assert!(dev_requirements_file.content.contains("pytest-cov"));
        assert!(dev_requirements_file.content.contains("black"));
        assert!(dev_requirements_file.content.contains("mypy"));
    }

    #[test]
    fn test_python_template_main_has_fastapi_app() {
        // ARRANGE
        let template = get_template("python").expect("Python template should exist");

        // ACT
        let main_file = template
            .files
            .iter()
            .find(|f| f.path == "app/main.py")
            .expect("app/main.py should exist");

        // ASSERT
        assert!(main_file.content.contains("from fastapi import FastAPI"));
        assert!(main_file.content.contains("app = FastAPI"));
        assert!(main_file.content.contains("@app.get"));
    }

    #[test]
    fn test_python_template_has_health_endpoints() {
        // ARRANGE
        let template = get_template("python").expect("Python template should exist");

        // ACT
        let main_file = template
            .files
            .iter()
            .find(|f| f.path == "app/main.py")
            .expect("app/main.py should exist");

        // ASSERT
        assert!(main_file.content.contains(r#"@app.get("/")"#));
        assert!(main_file.content.contains(r#"@app.get("/health")"#));
    }

    #[test]
    fn test_python_template_test_file_has_tests() {
        // ARRANGE
        let template = get_template("python").expect("Python template should exist");

        // ACT
        let test_file = template
            .files
            .iter()
            .find(|f| f.path == "tests/test_main.py")
            .expect("tests/test_main.py should exist");

        // ASSERT
        assert!(test_file.content.contains("def test_root_endpoint"));
        assert!(test_file.content.contains("def test_health_endpoint"));
        assert!(test_file.content.contains("TestClient"));
    }

    // ============================================================================
    // React Template Tests
    // ============================================================================

    #[test]
    fn test_react_template_has_required_files() {
        // ARRANGE
        let template = get_template("react").expect("React template should exist");

        // ACT
        let file_paths: Vec<String> = template.files.iter().map(|f| f.path.clone()).collect();

        // ASSERT - Core files
        assert!(file_paths.contains(&"README.md".to_string()));
        assert!(file_paths.contains(&".gitignore".to_string()));
        assert!(file_paths.contains(&"CLAUDE.md".to_string()));
        assert!(file_paths.contains(&"package.json".to_string()));
        assert!(file_paths.contains(&"tsconfig.json".to_string()));
        assert!(file_paths.contains(&"vite.config.ts".to_string()));
        assert!(file_paths.contains(&"index.html".to_string()));

        // ASSERT - Source files
        assert!(file_paths.contains(&"src/main.tsx".to_string()));
        assert!(file_paths.contains(&"src/App.tsx".to_string()));
        assert!(file_paths.contains(&"src/index.css".to_string()));

        // ASSERT - Config files
        assert!(file_paths.contains(&"tailwind.config.js".to_string()));
        assert!(file_paths.contains(&"postcss.config.js".to_string()));
    }

    #[test]
    fn test_react_template_has_required_directories() {
        // ARRANGE
        let template = get_template("react").expect("React template should exist");

        // ACT & ASSERT
        assert!(template.directories.contains(&"src".to_string()));
        assert!(template.directories.contains(&"src/components".to_string()));
        assert!(template.directories.contains(&"src/hooks".to_string()));
        assert!(template.directories.contains(&"src/utils".to_string()));
        assert!(template.directories.contains(&"public".to_string()));
    }

    #[test]
    fn test_react_template_package_json_has_vite() {
        // ARRANGE
        let template = get_template("react").expect("React template should exist");

        // ACT
        let package_json = template
            .files
            .iter()
            .find(|f| f.path == "package.json")
            .expect("package.json should exist");

        // ASSERT
        assert!(package_json.content.contains("\"vite\""));
        assert!(package_json.content.contains("\"react\""));
        assert!(package_json.content.contains("\"typescript\""));
        assert!(package_json.content.contains("\"tailwindcss\""));
        assert!(package_json.content.contains("\"vitest\""));
    }

    #[test]
    fn test_react_template_has_test_scripts() {
        // ARRANGE
        let template = get_template("react").expect("React template should exist");

        // ACT
        let package_json = template
            .files
            .iter()
            .find(|f| f.path == "package.json")
            .expect("package.json should exist");

        // ASSERT
        assert!(package_json.content.contains(r#""test": "vitest""#));
        assert!(package_json.content.contains(r#""test:run": "vitest run""#));
        assert!(package_json.content.contains(r#""test:coverage""#));
    }

    #[test]
    fn test_react_template_tsconfig_is_strict() {
        // ARRANGE
        let template = get_template("react").expect("React template should exist");

        // ACT
        let tsconfig = template
            .files
            .iter()
            .find(|f| f.path == "tsconfig.json")
            .expect("tsconfig.json should exist");

        // ASSERT
        assert!(tsconfig.content.contains(r#""strict": true"#));
        assert!(tsconfig.content.contains("noUnusedLocals"));
        assert!(tsconfig.content.contains("noUnusedParameters"));
    }

    #[test]
    fn test_react_template_app_tsx_exists() {
        // ARRANGE
        let template = get_template("react").expect("React template should exist");

        // ACT
        let app_tsx = template
            .files
            .iter()
            .find(|f| f.path == "src/App.tsx")
            .expect("src/App.tsx should exist");

        // ASSERT
        assert!(app_tsx.content.contains("function App"));
        assert!(app_tsx.content.contains("useState"));
    }

    // ============================================================================
    // Next.js Template Tests
    // ============================================================================

    #[test]
    fn test_nextjs_template_has_required_files() {
        // ARRANGE
        let template = get_template("nextjs").expect("Next.js template should exist");

        // ACT
        let file_paths: Vec<String> = template.files.iter().map(|f| f.path.clone()).collect();

        // ASSERT
        assert!(file_paths.contains(&"README.md".to_string()));
        assert!(file_paths.contains(&".gitignore".to_string()));
        assert!(file_paths.contains(&"CLAUDE.md".to_string()));
        assert!(file_paths.contains(&"package.json".to_string()));
        assert!(file_paths.contains(&"tsconfig.json".to_string()));
    }

    #[test]
    fn test_nextjs_template_package_json_has_next() {
        // ARRANGE
        let template = get_template("nextjs").expect("Next.js template should exist");

        // ACT
        let package_json = template
            .files
            .iter()
            .find(|f| f.path == "package.json")
            .expect("package.json should exist");

        // ASSERT
        assert!(package_json.content.contains("\"next\""));
        assert!(package_json.content.contains("\"react\""));
        assert!(package_json.content.contains("\"typescript\""));
    }

    // ============================================================================
    // Template Application Tests
    // ============================================================================

    #[test]
    fn test_apply_template_creates_directories() {
        // ARRANGE
        let temp_dir = create_test_dir();
        let project_path = temp_dir.path().join("test-project");
        fs::create_dir_all(&project_path).expect("Failed to create project dir");

        let template = get_template("python").expect("Python template should exist");

        // ACT
        let result = apply_template(&template, &project_path);

        // ASSERT
        assert!(result.is_ok());

        // Verify directories were created
        assert!(project_path.join("app").exists());
        assert!(project_path.join("app/api").exists());
        assert!(project_path.join("tests").exists());
    }

    #[test]
    fn test_apply_template_creates_files() {
        // ARRANGE
        let temp_dir = create_test_dir();
        let project_path = temp_dir.path().join("test-project");
        fs::create_dir_all(&project_path).expect("Failed to create project dir");

        let template = get_template("python").expect("Python template should exist");

        // ACT
        let result = apply_template(&template, &project_path);

        // ASSERT
        assert!(result.is_ok());

        // Verify files were created
        assert!(project_path.join("README.md").exists());
        assert!(project_path.join("requirements.txt").exists());
        assert!(project_path.join("app/main.py").exists());

        // Verify file content
        let readme_content = fs::read_to_string(project_path.join("README.md"))
            .expect("Should read README.md");
        assert!(readme_content.contains("FastAPI"));
    }

    #[test]
    fn test_apply_template_creates_nested_files() {
        // ARRANGE
        let temp_dir = create_test_dir();
        let project_path = temp_dir.path().join("test-project");
        fs::create_dir_all(&project_path).expect("Failed to create project dir");

        let template = get_template("python").expect("Python template should exist");

        // ACT
        let result = apply_template(&template, &project_path);

        // ASSERT
        assert!(result.is_ok());

        // Verify nested files were created
        assert!(project_path.join("app/__init__.py").exists());
        assert!(project_path.join("app/api/__init__.py").exists());
        assert!(project_path.join("tests/test_main.py").exists());
    }

    #[test]
    fn test_apply_react_template() {
        // ARRANGE
        let temp_dir = create_test_dir();
        let project_path = temp_dir.path().join("react-project");
        fs::create_dir_all(&project_path).expect("Failed to create project dir");

        let template = get_template("react").expect("React template should exist");

        // ACT
        let result = apply_template(&template, &project_path);

        // ASSERT
        assert!(result.is_ok());

        // Verify React-specific files
        assert!(project_path.join("index.html").exists());
        assert!(project_path.join("vite.config.ts").exists());
        assert!(project_path.join("src/App.tsx").exists());
        assert!(project_path.join("tailwind.config.js").exists());
    }

    #[test]
    fn test_apply_nextjs_template() {
        // ARRANGE
        let temp_dir = create_test_dir();
        let project_path = temp_dir.path().join("nextjs-project");
        fs::create_dir_all(&project_path).expect("Failed to create project dir");

        let template = get_template("nextjs").expect("Next.js template should exist");

        // ACT
        let result = apply_template(&template, &project_path);

        // ASSERT
        assert!(result.is_ok());

        // Verify Next.js-specific directories
        assert!(project_path.join("src").exists());
        assert!(project_path.join("src/app").exists());
        assert!(project_path.join("public").exists());
    }

    #[test]
    fn test_all_templates_have_claude_md() {
        // ARRANGE
        let templates = get_templates();

        // ACT & ASSERT
        for template in templates {
            let has_claude_md = template
                .files
                .iter()
                .any(|f| f.path == "CLAUDE.md");

            assert!(
                has_claude_md,
                "Template {} should have CLAUDE.md file",
                template.id
            );

            // Verify CLAUDE.md content
            let claude_md = template
                .files
                .iter()
                .find(|f| f.path == "CLAUDE.md")
                .unwrap();

            assert!(
                claude_md.content.contains("# Project Context"),
                "CLAUDE.md should have Project Context header"
            );
            assert!(
                claude_md.content.contains("Tech Stack"),
                "CLAUDE.md should describe tech stack"
            );
            assert!(
                claude_md.content.contains("Development Standards"),
                "CLAUDE.md should have development standards"
            );
        }
    }

    #[test]
    fn test_all_templates_have_gitignore() {
        // ARRANGE
        let templates = get_templates();

        // ACT & ASSERT
        for template in templates {
            let has_gitignore = template
                .files
                .iter()
                .any(|f| f.path == ".gitignore");

            assert!(
                has_gitignore,
                "Template {} should have .gitignore file",
                template.id
            );
        }
    }

    #[test]
    fn test_all_templates_have_readme() {
        // ARRANGE
        let templates = get_templates();

        // ACT & ASSERT
        for template in templates {
            let has_readme = template
                .files
                .iter()
                .any(|f| f.path == "README.md");

            assert!(
                has_readme,
                "Template {} should have README.md file",
                template.id
            );

            // Verify README mentions Sentra
            let readme = template
                .files
                .iter()
                .find(|f| f.path == "README.md")
                .unwrap();

            assert!(
                readme.content.contains("Sentra"),
                "README should mention Sentra"
            );
        }
    }
}
