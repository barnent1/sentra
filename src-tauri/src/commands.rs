use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use crate::specs::{list_specs, SpecInfo};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub name: String,
    pub path: String,
    pub active_agents: u32,
    pub total_issues: u32,
    pub completed_issues: u32,
    pub monthly_cost: f64,
    pub status: String,
    pub pending_spec: Option<String>,
    pub specs: Option<Vec<SpecInfo>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Agent {
    pub id: String,
    pub project: String,
    pub issue: u32,
    pub title: String,
    pub description: String,
    pub phase: String,
    pub elapsed_minutes: u32,
    pub cost: f64,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DashboardStats {
    pub active_agents: u32,
    pub total_projects: u32,
    pub today_cost: f64,
    pub monthly_budget: f64,
    pub success_rate: u32,
}

/// Get all tracked projects
#[tauri::command]
pub fn get_projects() -> Result<Vec<Project>, String> {
    let home = dirs::home_dir().ok_or("Could not find home directory")?;
    let tracked_file = home.join(".claude/tracked-projects.txt");

    if !tracked_file.exists() {
        // Return demo projects for testing
        return Ok(vec![
            Project {
                name: "sentra".to_string(),
                path: "~/Projects/claude-code-base/sentra".to_string(),
                active_agents: 0,
                total_issues: 0,
                completed_issues: 0,
                monthly_cost: 0.0,
                status: "idle".to_string(),
                pending_spec: None,
                specs: None,
            },
            Project {
                name: "aidio".to_string(),
                path: "~/projects/aidio".to_string(),
                active_agents: 1,
                total_issues: 42,
                completed_issues: 12,
                monthly_cost: 45.20,
                status: "active".to_string(),
                pending_spec: None,
                specs: None,
            },
            Project {
                name: "workcell".to_string(),
                path: "~/projects/workcell".to_string(),
                active_agents: 0,
                total_issues: 23,
                completed_issues: 8,
                monthly_cost: 28.60,
                status: "idle".to_string(),
                pending_spec: None,
                specs: None,
            },
        ]);
    }

    let content = fs::read_to_string(&tracked_file)
        .map_err(|e| format!("Failed to read tracked projects: {}", e))?;

    let projects: Vec<Project> = content
        .lines()
        .filter(|line| !line.trim().is_empty())
        .filter_map(|line| {
            let path = PathBuf::from(line.trim());
            path.file_name().and_then(|name| {
                let project_name = name.to_string_lossy().to_string();
                let project_path = path.to_string_lossy().to_string();

                // Check for old pending spec (for backward compatibility)
                let spec_path = path.join(".sentra/specs/pending-spec.md");
                let pending_spec = if spec_path.exists() {
                    fs::read_to_string(&spec_path).ok()
                } else {
                    None
                };

                // Load new versioned specs
                let specs = list_specs(project_name.clone(), project_path.clone()).ok();

                Some(Project {
                    name: project_name,
                    path: project_path,
                    active_agents: 0, // TODO: Calculate from actual agents
                    total_issues: 0,  // TODO: Read from telemetry
                    completed_issues: 0,
                    monthly_cost: 0.0,
                    status: "idle".to_string(),
                    pending_spec,
                    specs,
                })
            })
        })
        .collect();

    Ok(projects)
}

// Note: get_active_agents is now implemented in agents.rs module

/// Get dashboard statistics
#[tauri::command]
pub fn get_dashboard_stats() -> Result<DashboardStats, String> {
    let projects = get_projects()?;

    Ok(DashboardStats {
        active_agents: 0,
        total_projects: projects.len() as u32,
        today_cost: 0.0,
        monthly_budget: 100.0,
        success_rate: 0,
    })
}

/// Get telemetry logs for a project
#[tauri::command]
pub fn get_telemetry_logs(project: String, lines: usize) -> Result<Vec<String>, String> {
    let home = dirs::home_dir().ok_or("Could not find home directory")?;
    let log_file = home.join(".claude/telemetry/agents.log");

    if !log_file.exists() {
        return Ok(vec![]);
    }

    let content = fs::read_to_string(&log_file)
        .map_err(|e| format!("Failed to read telemetry log: {}", e))?;

    let project_logs: Vec<String> = content
        .lines()
        .filter(|line| line.contains(&project))
        .rev()
        .take(lines)
        .map(|s| s.to_string())
        .collect();

    Ok(project_logs)
}

/// Get project memory/learnings
#[tauri::command]
pub fn get_project_memory(project: String) -> Result<serde_json::Value, String> {
    let home = dirs::home_dir().ok_or("Could not find home directory")?;
    let tracked_file = home.join(".claude/tracked-projects.txt");

    if !tracked_file.exists() {
        return Err("No tracked projects found".to_string());
    }

    let content = fs::read_to_string(&tracked_file)
        .map_err(|e| format!("Failed to read tracked projects: {}", e))?;

    let project_path = content
        .lines()
        .find(|line| line.contains(&project))
        .ok_or("Project not found")?;

    let memory_dir = PathBuf::from(project_path).join(".claude/memory");

    let mut memory = serde_json::json!({
        "gotchas": "",
        "patterns": "",
        "decisions": ""
    });

    if memory_dir.exists() {
        if let Ok(gotchas) = fs::read_to_string(memory_dir.join("gotchas.md")) {
            memory["gotchas"] = serde_json::Value::String(gotchas);
        }
        if let Ok(patterns) = fs::read_to_string(memory_dir.join("patterns.md")) {
            memory["patterns"] = serde_json::Value::String(patterns);
        }
        if let Ok(decisions) = fs::read_to_string(memory_dir.join("decisions.md")) {
            memory["decisions"] = serde_json::Value::String(decisions);
        }
    }

    Ok(memory)
}

/// Stop an agent (placeholder)
#[tauri::command]
pub fn stop_agent(agent_id: String) -> Result<(), String> {
    // TODO: Implement agent stopping logic
    println!("Stopping agent: {}", agent_id);
    Ok(())
}

/// Get project context for AI conversations
#[tauri::command]
pub fn get_project_context(project_path: String) -> Result<String, String> {
    let path = PathBuf::from(shellexpand::tilde(&project_path).to_string());

    let mut context = String::new();

    // Read package.json if it exists (Node/JS project)
    let package_json_path = path.join("package.json");
    if package_json_path.exists() {
        if let Ok(content) = fs::read_to_string(&package_json_path) {
            context.push_str("## package.json\n");
            context.push_str(&content);
            context.push_str("\n\n");
        }
    }

    // Read Cargo.toml if it exists (Rust project)
    let cargo_toml_path = path.join("Cargo.toml");
    if cargo_toml_path.exists() {
        if let Ok(content) = fs::read_to_string(&cargo_toml_path) {
            context.push_str("## Cargo.toml\n");
            context.push_str(&content);
            context.push_str("\n\n");
        }
    }

    // Read README if it exists
    let readme_paths = vec![
        path.join("README.md"),
        path.join("README"),
        path.join("readme.md"),
    ];

    for readme_path in readme_paths {
        if readme_path.exists() {
            if let Ok(content) = fs::read_to_string(&readme_path) {
                context.push_str("## README\n");
                context.push_str(&content);
                context.push_str("\n\n");
                break;
            }
        }
    }

    // Read .claude/memory files if they exist
    let memory_dir = path.join(".claude/memory");
    if memory_dir.exists() {
        if let Ok(gotchas) = fs::read_to_string(memory_dir.join("gotchas.md")) {
            context.push_str("## Project Gotchas\n");
            context.push_str(&gotchas);
            context.push_str("\n\n");
        }
        if let Ok(patterns) = fs::read_to_string(memory_dir.join("patterns.md")) {
            context.push_str("## Project Patterns\n");
            context.push_str(&patterns);
            context.push_str("\n\n");
        }
        if let Ok(decisions) = fs::read_to_string(memory_dir.join("decisions.md")) {
            context.push_str("## Architecture Decisions\n");
            context.push_str(&decisions);
            context.push_str("\n\n");
        }
    }

    // Get directory structure (top 2 levels)
    if let Ok(entries) = fs::read_dir(&path) {
        context.push_str("## Project Structure\n");
        for entry in entries.flatten() {
            if let Ok(file_name) = entry.file_name().into_string() {
                // Skip common ignored directories
                if file_name.starts_with('.') || file_name == "node_modules" || file_name == "target" {
                    continue;
                }
                context.push_str(&format!("- {}\n", file_name));
            }
        }
        context.push_str("\n");
    }

    Ok(context)
}

/// Save a pending spec for a project
#[tauri::command]
pub fn save_pending_spec(project_name: String, project_path: String, spec: String) -> Result<(), String> {
    let path = PathBuf::from(shellexpand::tilde(&project_path).to_string());
    let specs_dir = path.join(".sentra/specs");
    let spec_path = specs_dir.join("pending-spec.md");

    // Create .sentra/specs directory if it doesn't exist
    fs::create_dir_all(&specs_dir)
        .map_err(|e| format!("Failed to create .sentra/specs directory: {}", e))?;

    // Write the spec
    fs::write(&spec_path, spec)
        .map_err(|e| format!("Failed to write spec: {}", e))?;

    Ok(())
}

/// Approve a spec and archive it with timestamp
#[tauri::command]
pub fn approve_spec(project_name: String, project_path: String) -> Result<(), String> {
    let path = PathBuf::from(shellexpand::tilde(&project_path).to_string());
    let spec_path = path.join(".sentra/specs/pending-spec.md");
    let archive_dir = path.join(".sentra/specs/archive");

    // Create archive directory if it doesn't exist
    fs::create_dir_all(&archive_dir)
        .map_err(|e| format!("Failed to create archive directory: {}", e))?;

    // Move pending spec to archive with timestamp
    if spec_path.exists() {
        // Generate timestamp
        let timestamp = chrono::Local::now().format("%Y-%m-%d-%H-%M").to_string();
        let archive_path = archive_dir.join(format!("{}.md", timestamp));

        fs::rename(&spec_path, &archive_path)
            .map_err(|e| format!("Failed to archive spec: {}", e))?;
    }

    Ok(())
}

/// Reject a spec and remove it
#[tauri::command]
pub fn reject_spec(_project_name: String, project_path: String) -> Result<(), String> {
    let path = PathBuf::from(shellexpand::tilde(&project_path).to_string());
    let spec_path = path.join(".sentra/specs/pending-spec.md");

    // Delete pending spec
    if spec_path.exists() {
        fs::remove_file(&spec_path)
            .map_err(|e| format!("Failed to reject spec: {}", e))?;
    }

    Ok(())
}

/// Create a GitHub issue from a spec using gh CLI
#[tauri::command]
pub fn create_github_issue(
    spec_title: String,
    spec_body: String,
    labels: Vec<String>,
) -> Result<String, String> {
    use std::process::Command;

    // Build the labels argument
    let labels_arg = labels.join(",");

    // Create the issue using gh CLI
    let output = Command::new("gh")
        .args(&[
            "issue",
            "create",
            "--title",
            &spec_title,
            "--body",
            &spec_body,
            "--label",
            &labels_arg,
        ])
        .output()
        .map_err(|e| format!("Failed to execute gh command: {}. Make sure gh CLI is installed and authenticated.", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("gh issue create failed: {}", stderr));
    }

    // gh issue create returns the issue URL
    let issue_url = String::from_utf8_lossy(&output.stdout)
        .trim()
        .to_string();

    if issue_url.is_empty() {
        return Err("gh command succeeded but returned no URL".to_string());
    }

    Ok(issue_url)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CostData {
    pub calls: Vec<serde_json::Value>,
    pub exported_at: String,
}

/// Get cost tracking data from localStorage
/// Returns cost data stored by the frontend cost tracker
#[tauri::command]
pub fn get_costs(_project_id: Option<String>) -> Result<CostData, String> {
    // This command returns a placeholder since cost data is stored in browser localStorage
    // The actual cost tracking happens in the frontend via the CostTracker service
    // This command is here for future backend integration if needed

    Ok(CostData {
        calls: vec![],
        exported_at: chrono::Local::now().to_rfc3339(),
    })
}

// ============================================================================
// Project Management Commands
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateProjectParams {
    pub name: String,
    pub path: String,
    pub template: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatedProject {
    pub name: String,
    pub path: String,
}

/// Create a new project with Sentra configuration
#[tauri::command]
pub fn create_project(params: CreateProjectParams) -> Result<CreatedProject, String> {
    use std::path::PathBuf;
    use crate::templates;

    // Validate project name
    let name_regex = regex::Regex::new(r"^[a-zA-Z0-9_-]+$")
        .map_err(|e| format!("Regex error: {}", e))?;

    if !name_regex.is_match(&params.name) {
        return Err("Invalid project name: only letters, numbers, hyphens, and underscores are allowed".to_string());
    }

    let path = PathBuf::from(&params.path);

    // Check if directory already exists
    if path.exists() {
        return Err(format!("Directory already exists: {}", path.display()));
    }

    // Create project directory
    fs::create_dir_all(&path)
        .map_err(|e| format!("Failed to create project directory: {}", e))?;

    // Get and apply template
    let template = templates::get_template(&params.template)
        .ok_or_else(|| format!("Template not found: {}", params.template))?;

    templates::apply_template(&template, &path)?;

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
        params.name,
        path.display(),
        params.template,
        chrono::Local::now().to_rfc3339()
    );

    fs::write(sentra_dir.join("config.yml"), config_content)
        .map_err(|e| format!("Failed to create config.yml: {}", e))?;

    // Initialize git repository (if git is available)
    use std::process::Command;
    let git_result = Command::new("git")
        .args(&["init"])
        .current_dir(&path)
        .output();

    if let Err(e) = git_result {
        eprintln!("Warning: Failed to initialize git repository: {}", e);
    }

    // Add project to tracked projects list
    let home = dirs::home_dir().ok_or("Could not find home directory")?;
    let tracked_file = home.join(".claude/tracked-projects.txt");

    // Ensure .claude directory exists
    if let Some(parent) = tracked_file.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create .claude directory: {}", e))?;
    }

    // Read existing content
    let mut tracked_projects = if tracked_file.exists() {
        fs::read_to_string(&tracked_file)
            .map_err(|e| format!("Failed to read tracked projects: {}", e))?
    } else {
        String::new()
    };

    // Add new project if not already tracked
    let project_path_str = path.to_string_lossy().to_string();
    if !tracked_projects.contains(&project_path_str) {
        if !tracked_projects.is_empty() && !tracked_projects.ends_with('\n') {
            tracked_projects.push('\n');
        }
        tracked_projects.push_str(&project_path_str);
        tracked_projects.push('\n');

        fs::write(&tracked_file, tracked_projects)
            .map_err(|e| format!("Failed to update tracked projects: {}", e))?;
    }

    Ok(CreatedProject {
        name: params.name,
        path: params.path,
    })
}

/// Open a directory picker dialog
/// Note: In Tauri 2.x, file dialogs are handled from the frontend using @tauri-apps/plugin-dialog
/// This command is kept for backwards compatibility but should be called from the frontend
#[tauri::command]
pub fn select_directory() -> Result<Option<String>, String> {
    // In Tauri 2.x, the dialog API is handled from the frontend
    // See: https://v2.tauri.app/plugin/dialog/
    Err("select_directory should be called from frontend using @tauri-apps/plugin-dialog".to_string())
}

/// Set the muted state for a project
#[tauri::command]
pub fn set_project_muted(project_name: String, muted: bool) -> Result<(), String> {
    // For now, just return Ok - mute state is managed in frontend
    // In the future, this could persist to a configuration file
    println!("Project '{}' muted state set to: {}", project_name, muted);
    Ok(())
}

