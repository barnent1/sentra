use serde::{Deserialize, Serialize};
use std::process::Command;

/// Represents a single active AI agent working on a GitHub issue
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AgentInfo {
    pub id: String,
    pub project: String,
    pub issue: u32,
    pub title: String,
    pub description: String,
    pub phase: String,
    pub elapsed_minutes: u32,
    pub cost: f64,
    pub status: String, // "running", "completed", "failed"
}

/// GitHub Actions workflow run data
#[derive(Debug, Clone, Deserialize)]
struct WorkflowRun {
    #[allow(dead_code)] // Used for deserialization
    id: u64,
    name: String,
    status: String,
    created_at: String,
    #[serde(default)]
    conclusion: Option<String>,
}

/// Get active agents from GitHub Actions API
/// Returns a list of agents currently running on GitHub Actions workflows
#[tauri::command]
pub fn get_active_agents() -> Result<Vec<AgentInfo>, String> {
    // Try to get workflow runs from GitHub
    match get_github_workflow_runs() {
        Ok(agents) => Ok(agents),
        Err(e) => {
            // If GitHub API fails, return empty array (graceful degradation)
            log::warn!("Failed to get active agents from GitHub: {}", e);
            Ok(vec![])
        }
    }
}

/// Query GitHub Actions API for in-progress workflow runs
fn get_github_workflow_runs() -> Result<Vec<AgentInfo>, String> {
    // Use gh CLI to query workflow runs
    // gh run list --status in_progress --json id,name,status,createdAt,conclusion
    let output = Command::new("gh")
        .args(&[
            "run",
            "list",
            "--status",
            "in_progress",
            "--json",
            "id,name,status,createdAt,conclusion",
        ])
        .output()
        .map_err(|e| format!("Failed to execute gh command: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("gh run list failed: {}", stderr));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);

    // Parse JSON response
    let runs: Vec<WorkflowRun> = serde_json::from_str(&stdout)
        .map_err(|e| format!("Failed to parse workflow runs: {}", e))?;

    // Convert workflow runs to agent info
    let agents: Vec<AgentInfo> = runs
        .into_iter()
        .filter_map(|run| parse_workflow_run(run).ok())
        .collect();

    Ok(agents)
}

/// Parse a GitHub workflow run into AgentInfo
/// Expected workflow name format: "AI Agent - ProjectName - Issue #123"
fn parse_workflow_run(run: WorkflowRun) -> Result<AgentInfo, String> {
    // Extract project and issue number from workflow name
    // Format: "AI Agent - ProjectName - Issue #123"
    let parts: Vec<&str> = run.name.split(" - ").collect();

    if parts.len() < 3 {
        return Err(format!("Invalid workflow name format: {}", run.name));
    }

    let project = parts[1].trim().to_string();

    // Extract issue number from "Issue #123"
    let issue_str = parts[2].trim();
    let issue_number = if issue_str.starts_with("Issue #") {
        issue_str.trim_start_matches("Issue #")
            .parse::<u32>()
            .map_err(|_| format!("Invalid issue number in: {}", issue_str))?
    } else {
        return Err(format!("Invalid issue format: {}", issue_str));
    };

    // Calculate elapsed time
    let elapsed_minutes = calculate_elapsed_minutes(&run.created_at)?;

    // Estimate cost ($0.20 per minute - rough estimate for Claude API usage)
    let cost = (elapsed_minutes as f64) * 0.20;

    // Determine status
    let status = match run.status.as_str() {
        "in_progress" => "running",
        "completed" if run.conclusion.as_deref() == Some("success") => "completed",
        "completed" => "failed",
        _ => "running",
    }.to_string();

    Ok(AgentInfo {
        id: format!("{}-{}", project.to_lowercase(), issue_number),
        project: project.clone(),
        issue: issue_number,
        title: format!("Issue #{}", issue_number), // Default title, can be enhanced
        description: String::new(), // Can be fetched from GitHub issue if needed
        phase: "Running".to_string(), // Can be enhanced with actual phase tracking
        elapsed_minutes,
        cost,
        status,
    })
}

/// Calculate elapsed minutes since a timestamp
/// Timestamp format: "2025-11-13T12:34:56Z"
fn calculate_elapsed_minutes(created_at: &str) -> Result<u32, String> {
    let created = chrono::DateTime::parse_from_rfc3339(created_at)
        .map_err(|e| format!("Invalid timestamp format: {}", e))?;

    let now = chrono::Utc::now();
    let duration = now.signed_duration_since(created);

    Ok(duration.num_minutes().max(0) as u32)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_workflow_run_valid() {
        // ARRANGE: Create a valid workflow run
        let run = WorkflowRun {
            id: 12345,
            name: "AI Agent - sentra - Issue #42".to_string(),
            status: "in_progress".to_string(),
            created_at: "2025-11-13T12:00:00Z".to_string(),
            conclusion: None,
        };

        // ACT: Parse the workflow run
        let result = parse_workflow_run(run);

        // ASSERT: Should successfully parse
        assert!(result.is_ok());
        let agent = result.unwrap();
        assert_eq!(agent.project, "sentra");
        assert_eq!(agent.issue, 42);
        assert_eq!(agent.id, "sentra-42");
        assert_eq!(agent.status, "running");
    }

    #[test]
    fn test_parse_workflow_run_with_multi_word_project() {
        // ARRANGE: Workflow with multi-word project name
        let run = WorkflowRun {
            id: 12345,
            name: "AI Agent - claude-code-base - Issue #10".to_string(),
            status: "in_progress".to_string(),
            created_at: "2025-11-13T12:00:00Z".to_string(),
            conclusion: None,
        };

        // ACT
        let result = parse_workflow_run(run);

        // ASSERT
        assert!(result.is_ok());
        let agent = result.unwrap();
        assert_eq!(agent.project, "claude-code-base");
        assert_eq!(agent.issue, 10);
    }

    #[test]
    fn test_parse_workflow_run_completed_success() {
        // ARRANGE: Completed workflow with success
        let run = WorkflowRun {
            id: 12345,
            name: "AI Agent - aidio - Issue #5".to_string(),
            status: "completed".to_string(),
            created_at: "2025-11-13T11:00:00Z".to_string(),
            conclusion: Some("success".to_string()),
        };

        // ACT
        let result = parse_workflow_run(run);

        // ASSERT
        assert!(result.is_ok());
        let agent = result.unwrap();
        assert_eq!(agent.status, "completed");
    }

    #[test]
    fn test_parse_workflow_run_completed_failure() {
        // ARRANGE: Completed workflow with failure
        let run = WorkflowRun {
            id: 12345,
            name: "AI Agent - workcell - Issue #8".to_string(),
            status: "completed".to_string(),
            created_at: "2025-11-13T10:00:00Z".to_string(),
            conclusion: Some("failure".to_string()),
        };

        // ACT
        let result = parse_workflow_run(run);

        // ASSERT
        assert!(result.is_ok());
        let agent = result.unwrap();
        assert_eq!(agent.status, "failed");
    }

    #[test]
    fn test_parse_workflow_run_invalid_format() {
        // ARRANGE: Invalid workflow name (missing parts)
        let run = WorkflowRun {
            id: 12345,
            name: "Invalid Format".to_string(),
            status: "in_progress".to_string(),
            created_at: "2025-11-13T12:00:00Z".to_string(),
            conclusion: None,
        };

        // ACT
        let result = parse_workflow_run(run);

        // ASSERT: Should fail
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Invalid workflow name format"));
    }

    #[test]
    fn test_parse_workflow_run_invalid_issue_number() {
        // ARRANGE: Invalid issue number format
        let run = WorkflowRun {
            id: 12345,
            name: "AI Agent - sentra - Issue #abc".to_string(),
            status: "in_progress".to_string(),
            created_at: "2025-11-13T12:00:00Z".to_string(),
            conclusion: None,
        };

        // ACT
        let result = parse_workflow_run(run);

        // ASSERT: Should fail
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Invalid issue number"));
    }

    #[test]
    fn test_parse_workflow_run_missing_issue_prefix() {
        // ARRANGE: Missing "Issue #" prefix
        let run = WorkflowRun {
            id: 12345,
            name: "AI Agent - sentra - 42".to_string(),
            status: "in_progress".to_string(),
            created_at: "2025-11-13T12:00:00Z".to_string(),
            conclusion: None,
        };

        // ACT
        let result = parse_workflow_run(run);

        // ASSERT: Should fail
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Invalid issue format"));
    }

    #[test]
    fn test_calculate_elapsed_minutes_recent() {
        // ARRANGE: Timestamp from 30 minutes ago
        let thirty_mins_ago = chrono::Utc::now() - chrono::Duration::minutes(30);
        let timestamp = thirty_mins_ago.to_rfc3339();

        // ACT
        let result = calculate_elapsed_minutes(&timestamp);

        // ASSERT: Should be around 30 minutes (allow some variance for test execution time)
        assert!(result.is_ok());
        let elapsed = result.unwrap();
        assert!(elapsed >= 29 && elapsed <= 31, "Expected ~30 minutes, got {}", elapsed);
    }

    #[test]
    fn test_calculate_elapsed_minutes_invalid_format() {
        // ARRANGE: Invalid timestamp format
        let timestamp = "invalid-timestamp";

        // ACT
        let result = calculate_elapsed_minutes(timestamp);

        // ASSERT: Should fail
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Invalid timestamp format"));
    }

    #[test]
    fn test_calculate_elapsed_minutes_zero() {
        // ARRANGE: Current timestamp
        let now = chrono::Utc::now();
        let timestamp = now.to_rfc3339();

        // ACT
        let result = calculate_elapsed_minutes(&timestamp);

        // ASSERT: Should be 0 or very close to 0
        assert!(result.is_ok());
        let elapsed = result.unwrap();
        assert!(elapsed <= 1, "Expected 0-1 minutes for current time, got {}", elapsed);
    }

    #[test]
    fn test_agent_info_cost_calculation() {
        // ARRANGE: Create a workflow run
        let run = WorkflowRun {
            id: 12345,
            name: "AI Agent - sentra - Issue #42".to_string(),
            status: "in_progress".to_string(),
            created_at: "2025-11-13T12:00:00Z".to_string(),
            conclusion: None,
        };

        // ACT
        let agent = parse_workflow_run(run).unwrap();

        // ASSERT: Cost should be elapsed_minutes * 0.20
        let expected_cost = (agent.elapsed_minutes as f64) * 0.20;
        assert_eq!(agent.cost, expected_cost);
    }

    #[test]
    fn test_get_active_agents_handles_error_gracefully() {
        // ARRANGE: This test verifies that get_active_agents returns empty array on error
        // We can't easily mock the gh CLI, but we can verify the function signature

        // ACT: Call get_active_agents (will likely fail if gh not configured)
        let result = get_active_agents();

        // ASSERT: Should always return Ok, never Err
        assert!(result.is_ok());
        // Result might be empty if gh CLI fails, which is expected graceful degradation
    }
}
