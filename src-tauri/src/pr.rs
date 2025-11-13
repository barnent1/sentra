use serde::{Deserialize, Serialize};
use std::process::Command;

/// Represents a pull request from GitHub
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PullRequest {
    pub number: u32,
    pub title: String,
    pub body: String,
    pub state: String, // "open", "closed", "merged"
    pub author: String,
    pub created_at: String,
    pub updated_at: String,
    pub head_branch: String,
    pub base_branch: String,
    pub mergeable: bool,
    pub url: String,
    pub checks_status: String, // "pending", "success", "failure"
}

/// Represents a review comment on a PR
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReviewComment {
    pub id: u64,
    pub author: String,
    pub body: String,
    pub created_at: String,
    pub path: Option<String>,
    pub line: Option<u32>,
}

/// Represents the full PR data including comments
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PullRequestData {
    pub pr: PullRequest,
    pub comments: Vec<ReviewComment>,
}

/// Get pull request data using gh CLI
#[tauri::command]
pub fn get_pull_request(owner: String, repo: String, pr_number: u32) -> Result<PullRequestData, String> {
    // Get PR metadata
    let pr_output = Command::new("gh")
        .args(&[
            "pr",
            "view",
            &pr_number.to_string(),
            "--repo",
            &format!("{}/{}", owner, repo),
            "--json",
            "number,title,body,state,author,createdAt,updatedAt,headRefName,baseRefName,mergeable,url,statusCheckRollup",
        ])
        .output()
        .map_err(|e| format!("Failed to execute gh CLI: {}", e))?;

    if !pr_output.status.success() {
        let error = String::from_utf8_lossy(&pr_output.stderr);
        return Err(format!("gh CLI error: {}", error));
    }

    let pr_json: serde_json::Value = serde_json::from_slice(&pr_output.stdout)
        .map_err(|e| format!("Failed to parse PR JSON: {}", e))?;

    // Parse checks status
    let checks_status = if let Some(checks) = pr_json.get("statusCheckRollup").and_then(|v| v.as_array()) {
        if checks.is_empty() {
            "success".to_string()
        } else {
            let all_success = checks.iter().all(|check| {
                check.get("state").and_then(|s| s.as_str()) == Some("SUCCESS")
            });
            if all_success {
                "success".to_string()
            } else {
                let any_failure = checks.iter().any(|check| {
                    check.get("state").and_then(|s| s.as_str()) == Some("FAILURE")
                });
                if any_failure {
                    "failure".to_string()
                } else {
                    "pending".to_string()
                }
            }
        }
    } else {
        "success".to_string()
    };

    let pr = PullRequest {
        number: pr_json.get("number").and_then(|v| v.as_u64()).unwrap_or(0) as u32,
        title: pr_json.get("title").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        body: pr_json.get("body").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        state: pr_json.get("state").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        author: pr_json.get("author")
            .and_then(|a| a.get("login"))
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        created_at: pr_json.get("createdAt").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        updated_at: pr_json.get("updatedAt").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        head_branch: pr_json.get("headRefName").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        base_branch: pr_json.get("baseRefName").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        mergeable: pr_json.get("mergeable").and_then(|v| v.as_str()) == Some("MERGEABLE"),
        url: pr_json.get("url").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        checks_status,
    };

    // Get review comments
    let comments_output = Command::new("gh")
        .args(&[
            "pr",
            "view",
            &pr_number.to_string(),
            "--repo",
            &format!("{}/{}", owner, repo),
            "--json",
            "reviews",
        ])
        .output()
        .map_err(|e| format!("Failed to get PR reviews: {}", e))?;

    let mut comments = Vec::new();

    if comments_output.status.success() {
        if let Ok(reviews_json) = serde_json::from_slice::<serde_json::Value>(&comments_output.stdout) {
            if let Some(reviews) = reviews_json.get("reviews").and_then(|v| v.as_array()) {
                for review in reviews {
                    if let Some(body) = review.get("body").and_then(|v| v.as_str()) {
                        if !body.is_empty() {
                            comments.push(ReviewComment {
                                id: review.get("id").and_then(|v| v.as_u64()).unwrap_or(0),
                                author: review.get("author")
                                    .and_then(|a| a.get("login"))
                                    .and_then(|v| v.as_str())
                                    .unwrap_or("")
                                    .to_string(),
                                body: body.to_string(),
                                created_at: review.get("submittedAt").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                                path: None,
                                line: None,
                            });
                        }
                    }
                }
            }
        }
    }

    Ok(PullRequestData { pr, comments })
}

/// Get PR diff using gh CLI
#[tauri::command]
pub fn get_pr_diff(owner: String, repo: String, pr_number: u32) -> Result<String, String> {
    let output = Command::new("gh")
        .args(&[
            "pr",
            "diff",
            &pr_number.to_string(),
            "--repo",
            &format!("{}/{}", owner, repo),
        ])
        .output()
        .map_err(|e| format!("Failed to execute gh CLI: {}", e))?;

    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        return Err(format!("gh CLI error: {}", error));
    }

    let diff = String::from_utf8(output.stdout)
        .map_err(|e| format!("Failed to parse diff output: {}", e))?;

    Ok(diff)
}

/// Approve a pull request using gh CLI
#[tauri::command]
pub fn approve_pull_request(owner: String, repo: String, pr_number: u32, comment: Option<String>) -> Result<(), String> {
    let pr_num_str = pr_number.to_string();
    let repo_str = format!("{}/{}", owner, repo);

    let mut args = vec![
        "pr",
        "review",
        pr_num_str.as_str(),
        "--repo",
        repo_str.as_str(),
        "--approve",
    ];

    if let Some(c) = &comment {
        args.push("--body");
        args.push(c.as_str());
    }

    let output = Command::new("gh")
        .args(&args)
        .output()
        .map_err(|e| format!("Failed to execute gh CLI: {}", e))?;

    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        return Err(format!("gh CLI error: {}", error));
    }

    Ok(())
}

/// Request changes on a pull request using gh CLI
#[tauri::command]
pub fn request_changes_pull_request(owner: String, repo: String, pr_number: u32, comment: String) -> Result<(), String> {
    let output = Command::new("gh")
        .args(&[
            "pr",
            "review",
            &pr_number.to_string(),
            "--repo",
            &format!("{}/{}", owner, repo),
            "--request-changes",
            "--body",
            &comment,
        ])
        .output()
        .map_err(|e| format!("Failed to execute gh CLI: {}", e))?;

    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        return Err(format!("gh CLI error: {}", error));
    }

    Ok(())
}

/// Merge a pull request using gh CLI
#[tauri::command]
pub fn merge_pull_request(owner: String, repo: String, pr_number: u32, merge_method: String) -> Result<(), String> {
    let method_flag = match merge_method.as_str() {
        "squash" => "--squash",
        "rebase" => "--rebase",
        "merge" => "--merge",
        _ => return Err(format!("Invalid merge method: {}", merge_method)),
    };

    let output = Command::new("gh")
        .args(&[
            "pr",
            "merge",
            &pr_number.to_string(),
            "--repo",
            &format!("{}/{}", owner, repo),
            method_flag,
        ])
        .output()
        .map_err(|e| format!("Failed to execute gh CLI: {}", e))?;

    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        return Err(format!("gh CLI error: {}", error));
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pull_request_serialization() {
        // ARRANGE: Create a PullRequest struct
        let pr = PullRequest {
            number: 123,
            title: "Add new feature".to_string(),
            body: "This PR adds a new feature".to_string(),
            state: "open".to_string(),
            author: "testuser".to_string(),
            created_at: "2025-11-13T10:00:00Z".to_string(),
            updated_at: "2025-11-13T11:00:00Z".to_string(),
            head_branch: "feature/new-feature".to_string(),
            base_branch: "main".to_string(),
            mergeable: true,
            url: "https://github.com/owner/repo/pull/123".to_string(),
            checks_status: "success".to_string(),
        };

        // ACT: Serialize to JSON
        let json = serde_json::to_string(&pr).unwrap();

        // ASSERT: Should serialize successfully with camelCase
        assert!(json.contains("\"number\":123"));
        assert!(json.contains("\"headBranch\":\"feature/new-feature\""));
        assert!(json.contains("\"baseBranch\":\"main\""));
        assert!(json.contains("\"checksStatus\":\"success\""));
    }

    #[test]
    fn test_review_comment_serialization() {
        // ARRANGE: Create a ReviewComment struct
        let comment = ReviewComment {
            id: 456,
            author: "reviewer".to_string(),
            body: "Looks good!".to_string(),
            created_at: "2025-11-13T12:00:00Z".to_string(),
            path: Some("src/main.rs".to_string()),
            line: Some(42),
        };

        // ACT: Serialize to JSON
        let json = serde_json::to_string(&comment).unwrap();

        // ASSERT: Should serialize successfully with camelCase
        assert!(json.contains("\"createdAt\":"));
    }

    #[test]
    fn test_pull_request_data_structure() {
        // ARRANGE: Create a complete PullRequestData struct
        let pr_data = PullRequestData {
            pr: PullRequest {
                number: 123,
                title: "Test PR".to_string(),
                body: "Test body".to_string(),
                state: "open".to_string(),
                author: "testuser".to_string(),
                created_at: "2025-11-13T10:00:00Z".to_string(),
                updated_at: "2025-11-13T11:00:00Z".to_string(),
                head_branch: "test".to_string(),
                base_branch: "main".to_string(),
                mergeable: true,
                url: "https://github.com/test/test/pull/123".to_string(),
                checks_status: "success".to_string(),
            },
            comments: vec![
                ReviewComment {
                    id: 1,
                    author: "reviewer1".to_string(),
                    body: "LGTM".to_string(),
                    created_at: "2025-11-13T12:00:00Z".to_string(),
                    path: None,
                    line: None,
                },
            ],
        };

        // ACT & ASSERT: Should be able to access all fields
        assert_eq!(pr_data.pr.number, 123);
        assert_eq!(pr_data.comments.len(), 1);
        assert_eq!(pr_data.comments[0].body, "LGTM");
    }

    // Note: Integration tests for gh CLI commands would require mocking or a test GitHub repo
    // For now, we test the data structures and serialization
    // In production, these would be tested with mock gh CLI responses
}
