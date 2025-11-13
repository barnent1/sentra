use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use chrono::{DateTime, Utc};
use regex::Regex;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SpecMetadata {
    pub id: String,
    pub title: String,
    pub project: String,
    pub created: String,
    pub updated: String,
    pub versions: Vec<SpecVersion>,
    pub latest: String,
    pub approved: Option<String>,
    pub github_issue_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SpecVersion {
    pub version: u32,
    pub file: String,
    pub created: String,
    pub size: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SpecInfo {
    pub id: String,
    pub title: String,
    pub project: String,
    pub file_path: String,
    pub version: u32,
    pub created: String,
    pub is_latest: bool,
    pub is_approved: bool,
    pub github_issue_url: Option<String>,
}

/// Extract title from markdown content (first # heading)
fn extract_title_from_markdown(content: &str) -> Option<String> {
    let re = Regex::new(r"^#\s+(.+)$").unwrap();

    for line in content.lines() {
        if let Some(captures) = re.captures(line.trim()) {
            if let Some(title) = captures.get(1) {
                return Some(title.as_str().trim().to_string());
            }
        }
    }

    None
}

/// Sanitize text to create URL-safe slug
fn sanitize_slug(text: &str) -> String {
    let mut slug = text.to_lowercase();

    // Replace spaces and underscores with hyphens
    slug = slug.replace(' ', "-").replace('_', "-");

    // Remove special characters (keep only alphanumeric and hyphens)
    slug = slug.chars()
        .filter(|c| c.is_alphanumeric() || *c == '-')
        .collect();

    // Remove multiple consecutive hyphens
    while slug.contains("--") {
        slug = slug.replace("--", "-");
    }

    // Trim hyphens from start and end
    slug = slug.trim_matches('-').to_string();

    // Truncate to 50 characters
    if slug.len() > 50 {
        slug = slug.chars().take(50).collect();
        slug = slug.trim_end_matches('-').to_string();
    }

    // Fallback if empty
    if slug.is_empty() {
        slug = "untitled-spec".to_string();
    }

    slug
}

/// Generate base name from title
fn generate_base_name(title: &str) -> String {
    sanitize_slug(title)
}

/// Get next version filename for a spec
fn get_next_version_filename(
    base_name: &str,
    specs_dir: &Path,
) -> Result<String, String> {
    let today = chrono::Local::now().format("%Y%m%d").to_string();

    // Check if any versions exist for today
    let base_pattern = format!("{}.spec.{}", base_name, today);

    if !specs_dir.exists() {
        // First version ever
        return Ok(format!("{}.spec.{}.md", base_name, today));
    }

    let mut today_versions = Vec::new();

    // Scan directory for matching files
    if let Ok(entries) = fs::read_dir(specs_dir) {
        for entry in entries.flatten() {
            if let Some(filename) = entry.file_name().to_str() {
                if filename.starts_with(&base_pattern) {
                    today_versions.push(filename.to_string());
                }
            }
        }
    }

    if today_versions.is_empty() {
        // First version today
        Ok(format!("{}.spec.{}.md", base_name, today))
    } else {
        // Find highest version number
        let mut max_version = 1;
        for filename in &today_versions {
            // Parse version from filename (e.g., .v2.md)
            if let Some(v_pos) = filename.rfind(".v") {
                let v_str = &filename[v_pos + 2..filename.len() - 3]; // Between .v and .md
                if let Ok(v) = v_str.parse::<u32>() {
                    max_version = max_version.max(v);
                }
            }
        }

        let next_version = max_version + 1;
        Ok(format!("{}.spec.{}.v{}.md", base_name, today, next_version))
    }
}

/// Load metadata from JSON file
fn load_metadata(metadata_path: &Path) -> Result<SpecMetadata, String> {
    if !metadata_path.exists() {
        return Err("Metadata file does not exist".to_string());
    }

    let content = fs::read_to_string(metadata_path)
        .map_err(|e| format!("Failed to read metadata: {}", e))?;

    let metadata: SpecMetadata = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse metadata: {}", e))?;

    Ok(metadata)
}

/// Save metadata to JSON file
fn save_metadata(metadata_path: &Path, metadata: &SpecMetadata) -> Result<(), String> {
    let content = serde_json::to_string_pretty(metadata)
        .map_err(|e| format!("Failed to serialize metadata: {}", e))?;

    fs::write(metadata_path, content)
        .map_err(|e| format!("Failed to write metadata: {}", e))?;

    Ok(())
}

/// Save a spec (creates new version if exists, or new spec if not)
#[tauri::command]
pub fn save_spec(
    project_name: String,
    project_path: String,
    spec_content: String,
    spec_title: Option<String>,
) -> Result<SpecInfo, String> {
    let path = PathBuf::from(shellexpand::tilde(&project_path).to_string());
    let project_slug = sanitize_slug(&project_name);
    let specs_dir = path.join(".sentra/specs").join(&project_slug);
    let metadata_dir = specs_dir.join(".metadata");

    // Create directories if they don't exist
    fs::create_dir_all(&specs_dir)
        .map_err(|e| format!("Failed to create specs directory: {}", e))?;
    fs::create_dir_all(&metadata_dir)
        .map_err(|e| format!("Failed to create metadata directory: {}", e))?;

    // Extract or use provided title
    let title = spec_title
        .or_else(|| extract_title_from_markdown(&spec_content))
        .unwrap_or_else(|| "Untitled Spec".to_string());

    let base_name = generate_base_name(&title);
    let metadata_path = metadata_dir.join(format!("{}.json", base_name));

    // Get next version filename
    let filename = get_next_version_filename(&base_name, &specs_dir)?;
    let spec_path = specs_dir.join(&filename);

    // Write spec file
    fs::write(&spec_path, &spec_content)
        .map_err(|e| format!("Failed to write spec file: {}", e))?;

    let file_size = spec_path.metadata()
        .map(|m| m.len())
        .unwrap_or(0);

    let now: DateTime<Utc> = Utc::now();
    let now_str = now.to_rfc3339();

    // Parse version number from filename
    let version_num = if filename.contains(".v") {
        let v_pos = filename.rfind(".v").unwrap();
        let v_str = &filename[v_pos + 2..filename.len() - 3];
        v_str.parse::<u32>().unwrap_or(1)
    } else {
        1
    };

    // Load or create metadata
    let mut metadata = if metadata_path.exists() {
        load_metadata(&metadata_path)?
    } else {
        SpecMetadata {
            id: base_name.clone(),
            title: title.clone(),
            project: project_slug.clone(),
            created: now_str.clone(),
            updated: now_str.clone(),
            versions: Vec::new(),
            latest: filename.clone(),
            approved: None,
            github_issue_url: None,
        }
    };

    // Add new version to metadata
    metadata.versions.push(SpecVersion {
        version: version_num,
        file: filename.clone(),
        created: now_str.clone(),
        size: file_size,
    });

    metadata.updated = now_str.clone();
    metadata.latest = filename.clone();

    // Save updated metadata
    save_metadata(&metadata_path, &metadata)?;

    // Return spec info
    Ok(SpecInfo {
        id: base_name,
        title,
        project: project_slug,
        file_path: spec_path.to_string_lossy().to_string(),
        version: version_num,
        created: now_str,
        is_latest: true,
        is_approved: false,
        github_issue_url: None,
    })
}

/// List all specs for a project (returns latest version of each)
#[tauri::command]
pub fn list_specs(
    project_name: String,
    project_path: String,
) -> Result<Vec<SpecInfo>, String> {
    let path = PathBuf::from(shellexpand::tilde(&project_path).to_string());
    let project_slug = sanitize_slug(&project_name);
    let specs_dir = path.join(".sentra/specs").join(&project_slug);
    let metadata_dir = specs_dir.join(".metadata");

    if !metadata_dir.exists() {
        return Ok(Vec::new());
    }

    let mut specs = Vec::new();

    // Read all metadata files
    if let Ok(entries) = fs::read_dir(&metadata_dir) {
        for entry in entries.flatten() {
            if let Some(filename) = entry.file_name().to_str() {
                if filename.ends_with(".json") {
                    let metadata_path = metadata_dir.join(filename);
                    if let Ok(metadata) = load_metadata(&metadata_path) {
                        let is_approved = metadata.approved.is_some();
                        specs.push(SpecInfo {
                            id: metadata.id,
                            title: metadata.title,
                            project: metadata.project,
                            file_path: specs_dir.join(&metadata.latest).to_string_lossy().to_string(),
                            version: metadata.versions.len() as u32,
                            created: metadata.created,
                            is_latest: true,
                            is_approved,
                            github_issue_url: metadata.github_issue_url,
                        });
                    }
                }
            }
        }
    }

    // Sort by creation date (newest first)
    specs.sort_by(|a, b| b.created.cmp(&a.created));

    Ok(specs)
}

/// Get a specific spec (content + metadata)
#[tauri::command]
pub fn get_spec(
    project_name: String,
    project_path: String,
    spec_id: String,
    version_file: Option<String>,
) -> Result<(String, SpecInfo), String> {
    let path = PathBuf::from(shellexpand::tilde(&project_path).to_string());
    let project_slug = sanitize_slug(&project_name);
    let specs_dir = path.join(".sentra/specs").join(&project_slug);
    let metadata_dir = specs_dir.join(".metadata");
    let metadata_path = metadata_dir.join(format!("{}.json", spec_id));

    let metadata = load_metadata(&metadata_path)?;

    // Determine which version to load
    let filename = version_file.unwrap_or(metadata.latest.clone());
    let spec_path = specs_dir.join(&filename);

    // Read spec content
    let content = fs::read_to_string(&spec_path)
        .map_err(|e| format!("Failed to read spec file: {}", e))?;

    // Find version info
    let version_info = metadata.versions.iter()
        .find(|v| v.file == filename)
        .cloned();

    let version_num = version_info.as_ref().map(|v| v.version).unwrap_or(1);
    let is_latest = filename == metadata.latest;
    let is_approved = metadata.approved.as_ref() == Some(&filename);

    let spec_info = SpecInfo {
        id: metadata.id,
        title: metadata.title,
        project: metadata.project,
        file_path: spec_path.to_string_lossy().to_string(),
        version: version_num,
        created: version_info.map(|v| v.created).unwrap_or(metadata.created.clone()),
        is_latest,
        is_approved,
        github_issue_url: metadata.github_issue_url,
    };

    Ok((content, spec_info))
}

/// Get all versions for a specific spec
#[tauri::command]
pub fn get_spec_versions(
    project_name: String,
    project_path: String,
    spec_id: String,
) -> Result<Vec<SpecVersion>, String> {
    let path = PathBuf::from(shellexpand::tilde(&project_path).to_string());
    let project_slug = sanitize_slug(&project_name);
    let metadata_dir = path.join(".sentra/specs").join(&project_slug).join(".metadata");
    let metadata_path = metadata_dir.join(format!("{}.json", spec_id));

    let metadata = load_metadata(&metadata_path)?;
    Ok(metadata.versions)
}

/// Approve a specific version of a spec
#[tauri::command]
pub fn approve_spec_version(
    project_name: String,
    project_path: String,
    spec_id: String,
    version_file: String,
    github_issue_url: Option<String>,
) -> Result<(), String> {
    let path = PathBuf::from(shellexpand::tilde(&project_path).to_string());
    let project_slug = sanitize_slug(&project_name);
    let metadata_dir = path.join(".sentra/specs").join(&project_slug).join(".metadata");
    let metadata_path = metadata_dir.join(format!("{}.json", spec_id));

    let mut metadata = load_metadata(&metadata_path)?;

    // Verify version exists
    if !metadata.versions.iter().any(|v| v.file == version_file) {
        return Err("Version not found".to_string());
    }

    metadata.approved = Some(version_file);
    metadata.github_issue_url = github_issue_url;
    metadata.updated = Utc::now().to_rfc3339();

    save_metadata(&metadata_path, &metadata)?;

    Ok(())
}

/// Delete a spec or specific version
#[tauri::command]
pub fn delete_spec(
    project_name: String,
    project_path: String,
    spec_id: String,
    version_file: Option<String>,
) -> Result<(), String> {
    let path = PathBuf::from(shellexpand::tilde(&project_path).to_string());
    let project_slug = sanitize_slug(&project_name);
    let specs_dir = path.join(".sentra/specs").join(&project_slug);
    let metadata_dir = specs_dir.join(".metadata");
    let metadata_path = metadata_dir.join(format!("{}.json", spec_id));

    if let Some(version_file) = version_file {
        // Delete specific version
        let mut metadata = load_metadata(&metadata_path)?;

        // Remove version from metadata
        metadata.versions.retain(|v| v.file != version_file);

        if metadata.versions.is_empty() {
            // No versions left, delete entire spec
            fs::remove_file(&metadata_path)
                .map_err(|e| format!("Failed to delete metadata: {}", e))?;
        } else {
            // Update latest if we deleted it
            if metadata.latest == version_file {
                metadata.latest = metadata.versions.last()
                    .map(|v| v.file.clone())
                    .unwrap_or_default();
            }

            // Clear approval if we deleted approved version
            if metadata.approved.as_ref() == Some(&version_file) {
                metadata.approved = None;
                metadata.github_issue_url = None;
            }

            metadata.updated = Utc::now().to_rfc3339();
            save_metadata(&metadata_path, &metadata)?;
        }

        // Delete file
        let spec_path = specs_dir.join(&version_file);
        if spec_path.exists() {
            fs::remove_file(&spec_path)
                .map_err(|e| format!("Failed to delete spec file: {}", e))?;
        }
    } else {
        // Delete entire spec (all versions + metadata)
        let metadata = load_metadata(&metadata_path)?;

        // Delete all version files
        for version in &metadata.versions {
            let spec_path = specs_dir.join(&version.file);
            if spec_path.exists() {
                fs::remove_file(&spec_path).ok();
            }
        }

        // Delete metadata
        fs::remove_file(&metadata_path)
            .map_err(|e| format!("Failed to delete metadata: {}", e))?;
    }

    Ok(())
}

/// Migrate old pending-spec.md to new versioned structure
#[tauri::command]
pub fn migrate_pending_spec(
    project_name: String,
    project_path: String,
) -> Result<Option<SpecInfo>, String> {
    let path = PathBuf::from(shellexpand::tilde(&project_path).to_string());
    let old_spec_path = path.join(".sentra/specs/pending-spec.md");

    if !old_spec_path.exists() {
        return Ok(None);
    }

    // Read old spec
    let content = fs::read_to_string(&old_spec_path)
        .map_err(|e| format!("Failed to read pending spec: {}", e))?;

    // Save as new versioned spec
    let spec_info = save_spec(project_name, project_path, content, None)?;

    // Delete old pending spec
    fs::remove_file(&old_spec_path).ok();

    Ok(Some(spec_info))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_title_from_markdown() {
        let content = "# User Authentication System\n\nThis is the spec...";
        assert_eq!(
            extract_title_from_markdown(content),
            Some("User Authentication System".to_string())
        );
    }

    #[test]
    fn test_extract_title_no_heading() {
        let content = "This is a spec without a heading";
        assert_eq!(extract_title_from_markdown(content), None);
    }

    #[test]
    fn test_sanitize_slug() {
        assert_eq!(sanitize_slug("User Authentication System"), "user-authentication-system");
        assert_eq!(sanitize_slug("Payment Gateway (Stripe)"), "payment-gateway-stripe");
        assert_eq!(sanitize_slug("   Multiple   Spaces   "), "multiple-spaces");
        assert_eq!(sanitize_slug("Special!@#$%Characters"), "specialcharacters");
    }

    #[test]
    fn test_sanitize_slug_truncation() {
        let long_title = "This is a very long title that should be truncated to exactly fifty characters maximum";
        let slug = sanitize_slug(long_title);
        assert!(slug.len() <= 50);
    }

    #[test]
    fn test_sanitize_slug_empty() {
        assert_eq!(sanitize_slug(""), "untitled-spec");
        assert_eq!(sanitize_slug("!@#$%"), "untitled-spec");
    }
}
