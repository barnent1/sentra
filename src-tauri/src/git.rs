use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// Represents a single git commit
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GitCommit {
    pub hash: String,
    pub short_hash: String,
    pub author: String,
    pub email: String,
    pub date: String,
    pub message: String,
}

/// Represents git status information
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GitStatus {
    pub current_branch: String,
    pub ahead: usize,
    pub behind: usize,
    pub modified_files: Vec<String>,
    pub staged_files: Vec<String>,
    pub untracked_files: Vec<String>,
}

/// Represents a file change in a diff
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GitDiffFile {
    pub path: String,
    pub additions: usize,
    pub deletions: usize,
    pub status: String, // "added", "modified", "deleted"
}

/// Represents a git diff result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GitDiff {
    pub commit_hash: Option<String>,
    pub files: Vec<GitDiffFile>,
    pub total_additions: usize,
    pub total_deletions: usize,
    pub patch: String, // Full diff text
}

/// Get the last N commits from a git repository
#[tauri::command]
pub fn get_git_log(project_path: String, limit: usize) -> Result<Vec<GitCommit>, String> {
    let path = PathBuf::from(shellexpand::tilde(&project_path).to_string());

    // Open the repository
    let repo = git2::Repository::open(&path)
        .map_err(|e| format!("Failed to open git repository at {}: {}", project_path, e))?;

    // Get the HEAD reference
    let head = repo.head()
        .map_err(|e| format!("Failed to get HEAD: {}", e))?;

    // Get the commit that HEAD points to (verify it exists)
    let _head_commit = head.peel_to_commit()
        .map_err(|e| format!("Failed to get HEAD commit: {}", e))?;

    // Create a revwalk starting from HEAD
    let mut revwalk = repo.revwalk()
        .map_err(|e| format!("Failed to create revwalk: {}", e))?;

    revwalk.push_head()
        .map_err(|e| format!("Failed to push HEAD to revwalk: {}", e))?;

    // Collect commits
    let mut commits = Vec::new();
    for (i, oid_result) in revwalk.enumerate() {
        if i >= limit {
            break;
        }

        let oid = oid_result.map_err(|e| format!("Failed to get commit OID: {}", e))?;
        let commit = repo.find_commit(oid)
            .map_err(|e| format!("Failed to find commit: {}", e))?;

        let hash = commit.id().to_string();
        let short_hash = commit.as_object().short_id()
            .map_err(|e| format!("Failed to get short hash: {}", e))?
            .as_str()
            .ok_or("Short hash is not valid UTF-8")?
            .to_string();

        let author = commit.author();
        let author_name = author.name().unwrap_or("Unknown").to_string();
        let author_email = author.email().unwrap_or("").to_string();

        let timestamp = commit.time().seconds();
        let datetime = chrono::DateTime::from_timestamp(timestamp, 0)
            .ok_or("Invalid timestamp")?;
        let date = datetime.format("%Y-%m-%d %H:%M:%S").to_string();

        let message = commit.message().unwrap_or("").to_string();

        commits.push(GitCommit {
            hash,
            short_hash,
            author: author_name,
            email: author_email,
            date,
            message,
        });
    }

    Ok(commits)
}

/// Get git diff for a specific commit or unstaged changes
#[tauri::command]
pub fn get_git_diff(project_path: String, commit_hash: Option<String>) -> Result<GitDiff, String> {
    let path = PathBuf::from(shellexpand::tilde(&project_path).to_string());

    let repo = git2::Repository::open(&path)
        .map_err(|e| format!("Failed to open git repository: {}", e))?;

    let diff = if let Some(hash) = &commit_hash {
        // Get diff for a specific commit (commit vs parent)
        let oid = git2::Oid::from_str(hash)
            .map_err(|e| format!("Invalid commit hash: {}", e))?;

        let commit = repo.find_commit(oid)
            .map_err(|e| format!("Failed to find commit: {}", e))?;

        let commit_tree = commit.tree()
            .map_err(|e| format!("Failed to get commit tree: {}", e))?;

        let parent_tree = if commit.parent_count() > 0 {
            Some(commit.parent(0)
                .map_err(|e| format!("Failed to get parent commit: {}", e))?
                .tree()
                .map_err(|e| format!("Failed to get parent tree: {}", e))?)
        } else {
            None
        };

        repo.diff_tree_to_tree(
            parent_tree.as_ref(),
            Some(&commit_tree),
            None,
        ).map_err(|e| format!("Failed to create diff: {}", e))?
    } else {
        // Get unstaged changes (working directory vs index)
        let head = repo.head()
            .map_err(|e| format!("Failed to get HEAD: {}", e))?;
        let head_tree = head.peel_to_tree()
            .map_err(|e| format!("Failed to get HEAD tree: {}", e))?;

        repo.diff_tree_to_workdir_with_index(Some(&head_tree), None)
            .map_err(|e| format!("Failed to create diff: {}", e))?
    };

    // Collect file changes
    let mut files = Vec::new();

    diff.foreach(
        &mut |delta, _progress| {
            let status = match delta.status() {
                git2::Delta::Added => "added",
                git2::Delta::Modified => "modified",
                git2::Delta::Deleted => "deleted",
                _ => "unknown",
            };

            let path = delta.new_file().path()
                .and_then(|p| p.to_str())
                .unwrap_or("unknown")
                .to_string();

            files.push(GitDiffFile {
                path,
                additions: 0, // Will be updated in line callback
                deletions: 0,
                status: status.to_string(),
            });

            true
        },
        None,
        None,
        None,
    ).map_err(|e| format!("Failed to iterate diff: {}", e))?;

    // Get stats for each file
    let stats = diff.stats()
        .map_err(|e| format!("Failed to get diff stats: {}", e))?;

    let total_additions = stats.insertions();
    let total_deletions = stats.deletions();

    // Get full patch text
    let mut patch = String::new();
    diff.print(git2::DiffFormat::Patch, |_delta, _hunk, line| {
        let content = std::str::from_utf8(line.content()).unwrap_or("");
        patch.push_str(content);
        true
    }).map_err(|e| format!("Failed to print diff: {}", e))?;

    Ok(GitDiff {
        commit_hash,
        files,
        total_additions,
        total_deletions,
        patch,
    })
}

/// Get current git status
#[tauri::command]
pub fn get_git_status(project_path: String) -> Result<GitStatus, String> {
    let path = PathBuf::from(shellexpand::tilde(&project_path).to_string());

    let repo = git2::Repository::open(&path)
        .map_err(|e| format!("Failed to open git repository: {}", e))?;

    // Get current branch
    let head = repo.head()
        .map_err(|e| format!("Failed to get HEAD: {}", e))?;

    let current_branch = if head.is_branch() {
        head.shorthand().unwrap_or("unknown").to_string()
    } else {
        "HEAD (detached)".to_string()
    };

    // Calculate ahead/behind
    let (ahead, behind) = if let Ok(local_branch) = repo.find_branch(&current_branch, git2::BranchType::Local) {
        if let Ok(upstream) = local_branch.upstream() {
            let local_oid = local_branch.get().target().ok_or("No local OID")?;
            let upstream_oid = upstream.get().target().ok_or("No upstream OID")?;

            repo.graph_ahead_behind(local_oid, upstream_oid)
                .unwrap_or((0, 0))
        } else {
            (0, 0)
        }
    } else {
        (0, 0)
    };

    // Get file status
    let statuses = repo.statuses(None)
        .map_err(|e| format!("Failed to get repository status: {}", e))?;

    let mut modified_files = Vec::new();
    let mut staged_files = Vec::new();
    let mut untracked_files = Vec::new();

    for entry in statuses.iter() {
        let path = entry.path().unwrap_or("unknown").to_string();
        let status = entry.status();

        if status.contains(git2::Status::WT_MODIFIED)
            || status.contains(git2::Status::WT_DELETED)
            || status.contains(git2::Status::WT_RENAMED) {
            modified_files.push(path.clone());
        }

        if status.contains(git2::Status::INDEX_NEW)
            || status.contains(git2::Status::INDEX_MODIFIED)
            || status.contains(git2::Status::INDEX_DELETED)
            || status.contains(git2::Status::INDEX_RENAMED) {
            staged_files.push(path.clone());
        }

        if status.contains(git2::Status::WT_NEW) {
            untracked_files.push(path);
        }
    }

    Ok(GitStatus {
        current_branch,
        ahead,
        behind,
        modified_files,
        staged_files,
        untracked_files,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::process::Command;

    // Helper function to create a temporary git repository for testing
    fn create_test_repo() -> (tempfile::TempDir, String) {
        let temp_dir = tempfile::tempdir().expect("Failed to create temp directory");
        let repo_path = temp_dir.path().to_string_lossy().to_string();

        // Initialize git repo
        Command::new("git")
            .args(&["init"])
            .current_dir(&repo_path)
            .output()
            .expect("Failed to init git repo");

        // Configure git user
        Command::new("git")
            .args(&["config", "user.name", "Test User"])
            .current_dir(&repo_path)
            .output()
            .expect("Failed to configure git user");

        Command::new("git")
            .args(&["config", "user.email", "test@example.com"])
            .current_dir(&repo_path)
            .output()
            .expect("Failed to configure git email");

        (temp_dir, repo_path)
    }

    fn add_test_commit(repo_path: &str, file_name: &str, content: &str, message: &str) {
        let file_path = PathBuf::from(repo_path).join(file_name);
        fs::write(&file_path, content).expect("Failed to write test file");

        Command::new("git")
            .args(&["add", file_name])
            .current_dir(repo_path)
            .output()
            .expect("Failed to git add");

        Command::new("git")
            .args(&["commit", "-m", message])
            .current_dir(repo_path)
            .output()
            .expect("Failed to git commit");
    }

    #[test]
    fn test_get_git_log_returns_commits() {
        // ARRANGE: Create a test repo with commits
        let (_temp_dir, repo_path) = create_test_repo();

        add_test_commit(&repo_path, "file1.txt", "content 1", "First commit");
        add_test_commit(&repo_path, "file2.txt", "content 2", "Second commit");
        add_test_commit(&repo_path, "file3.txt", "content 3", "Third commit");

        // ACT: Get git log
        let result = get_git_log(repo_path, 10);

        // ASSERT: Should return 3 commits
        assert!(result.is_ok());
        let commits = result.unwrap();
        assert_eq!(commits.len(), 3);

        // Commits should be in reverse chronological order
        assert_eq!(commits[0].message, "Third commit\n");
        assert_eq!(commits[1].message, "Second commit\n");
        assert_eq!(commits[2].message, "First commit\n");
    }

    #[test]
    fn test_get_git_log_respects_limit() {
        // ARRANGE: Create repo with multiple commits
        let (_temp_dir, repo_path) = create_test_repo();

        add_test_commit(&repo_path, "file1.txt", "content 1", "Commit 1");
        add_test_commit(&repo_path, "file2.txt", "content 2", "Commit 2");
        add_test_commit(&repo_path, "file3.txt", "content 3", "Commit 3");
        add_test_commit(&repo_path, "file4.txt", "content 4", "Commit 4");

        // ACT: Get only 2 commits
        let result = get_git_log(repo_path, 2);

        // ASSERT: Should return only 2 most recent commits
        assert!(result.is_ok());
        let commits = result.unwrap();
        assert_eq!(commits.len(), 2);
        assert_eq!(commits[0].message, "Commit 4\n");
        assert_eq!(commits[1].message, "Commit 3\n");
    }

    #[test]
    fn test_get_git_log_includes_author_info() {
        // ARRANGE
        let (_temp_dir, repo_path) = create_test_repo();
        add_test_commit(&repo_path, "file1.txt", "content", "Test commit");

        // ACT
        let result = get_git_log(repo_path, 1);

        // ASSERT
        assert!(result.is_ok());
        let commits = result.unwrap();
        assert_eq!(commits.len(), 1);
        assert_eq!(commits[0].author, "Test User");
        assert_eq!(commits[0].email, "test@example.com");
        assert!(!commits[0].hash.is_empty());
        assert!(!commits[0].short_hash.is_empty());
        assert!(!commits[0].date.is_empty());
    }

    #[test]
    fn test_get_git_log_fails_on_non_git_directory() {
        // ARRANGE: Create a non-git directory
        let temp_dir = tempfile::tempdir().expect("Failed to create temp directory");
        let path = temp_dir.path().to_string_lossy().to_string();

        // ACT
        let result = get_git_log(path.clone(), 10);

        // ASSERT: Should fail
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Failed to open git repository"));
    }

    #[test]
    fn test_get_git_status_shows_current_branch() {
        // ARRANGE
        let (_temp_dir, repo_path) = create_test_repo();
        add_test_commit(&repo_path, "file1.txt", "content", "Initial commit");

        // ACT
        let result = get_git_status(repo_path);

        // ASSERT
        assert!(result.is_ok());
        let status = result.unwrap();
        assert_eq!(status.current_branch, "master");
        assert_eq!(status.ahead, 0);
        assert_eq!(status.behind, 0);
    }

    #[test]
    fn test_get_git_status_detects_modified_files() {
        // ARRANGE
        let (_temp_dir, repo_path) = create_test_repo();
        add_test_commit(&repo_path, "file1.txt", "original content", "Initial commit");

        // Modify the file
        let file_path = PathBuf::from(&repo_path).join("file1.txt");
        fs::write(&file_path, "modified content").expect("Failed to modify file");

        // ACT
        let result = get_git_status(repo_path);

        // ASSERT
        assert!(result.is_ok());
        let status = result.unwrap();
        assert_eq!(status.modified_files.len(), 1);
        assert!(status.modified_files.contains(&"file1.txt".to_string()));
    }

    #[test]
    fn test_get_git_status_detects_staged_files() {
        // ARRANGE
        let (_temp_dir, repo_path) = create_test_repo();
        add_test_commit(&repo_path, "file1.txt", "content", "Initial commit");

        // Create and stage a new file
        let file_path = PathBuf::from(&repo_path).join("file2.txt");
        fs::write(&file_path, "new content").expect("Failed to create file");

        Command::new("git")
            .args(&["add", "file2.txt"])
            .current_dir(&repo_path)
            .output()
            .expect("Failed to git add");

        // ACT
        let result = get_git_status(repo_path);

        // ASSERT
        assert!(result.is_ok());
        let status = result.unwrap();
        assert_eq!(status.staged_files.len(), 1);
        assert!(status.staged_files.contains(&"file2.txt".to_string()));
    }

    #[test]
    fn test_get_git_status_detects_untracked_files() {
        // ARRANGE
        let (_temp_dir, repo_path) = create_test_repo();
        add_test_commit(&repo_path, "file1.txt", "content", "Initial commit");

        // Create an untracked file
        let file_path = PathBuf::from(&repo_path).join("untracked.txt");
        fs::write(&file_path, "untracked content").expect("Failed to create file");

        // ACT
        let result = get_git_status(repo_path);

        // ASSERT
        assert!(result.is_ok());
        let status = result.unwrap();
        assert_eq!(status.untracked_files.len(), 1);
        assert!(status.untracked_files.contains(&"untracked.txt".to_string()));
    }

    #[test]
    fn test_get_git_diff_for_commit() {
        // ARRANGE
        let (_temp_dir, repo_path) = create_test_repo();
        add_test_commit(&repo_path, "file1.txt", "line 1\nline 2\n", "First commit");
        add_test_commit(&repo_path, "file1.txt", "line 1\nline 2\nline 3\n", "Second commit");

        // Get the hash of the second commit
        let commits = get_git_log(repo_path.clone(), 1).unwrap();
        let commit_hash = commits[0].hash.clone();

        // ACT
        let result = get_git_diff(repo_path, Some(commit_hash.clone()));

        // ASSERT
        assert!(result.is_ok());
        let diff = result.unwrap();
        assert_eq!(diff.commit_hash, Some(commit_hash));
        assert!(diff.total_additions > 0);
        assert!(!diff.patch.is_empty());
    }

    #[test]
    fn test_get_git_diff_for_unstaged_changes() {
        // ARRANGE
        let (_temp_dir, repo_path) = create_test_repo();
        add_test_commit(&repo_path, "file1.txt", "original\n", "Initial commit");

        // Modify file without staging
        let file_path = PathBuf::from(&repo_path).join("file1.txt");
        fs::write(&file_path, "original\nmodified\n").expect("Failed to modify file");

        // ACT
        let result = get_git_diff(repo_path, None);

        // ASSERT
        assert!(result.is_ok());
        let diff = result.unwrap();
        assert!(diff.commit_hash.is_none());
        assert!(diff.total_additions > 0);
        assert!(!diff.patch.is_empty());
        assert!(diff.files.len() > 0);
    }

    #[test]
    fn test_get_git_diff_shows_file_changes() {
        // ARRANGE
        let (_temp_dir, repo_path) = create_test_repo();
        add_test_commit(&repo_path, "file1.txt", "content\n", "Initial commit");

        // Modify and create files
        let file1_path = PathBuf::from(&repo_path).join("file1.txt");
        fs::write(&file1_path, "modified content\n").expect("Failed to modify file");

        let file2_path = PathBuf::from(&repo_path).join("file2.txt");
        fs::write(&file2_path, "new file\n").expect("Failed to create file");

        // ACT
        let result = get_git_diff(repo_path, None);

        // ASSERT
        assert!(result.is_ok());
        let diff = result.unwrap();
        assert!(diff.files.len() >= 1); // At least file1.txt should be in diff

        // Check that file1.txt is marked as modified
        let file1_diff = diff.files.iter().find(|f| f.path == "file1.txt");
        assert!(file1_diff.is_some());
    }
}
