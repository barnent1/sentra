use serde::{Deserialize, Serialize};
use std::fs::File;
use std::io::{BufRead, BufReader};
use std::path::PathBuf;
use std::process::Command;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::{AppHandle, Emitter};

/// Represents a single line from an agent's log output
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentStreamLine {
    pub line_number: usize,
    pub timestamp: String,
    pub content: String,
    pub agent_id: String,
}

/// Represents a line from GitHub Actions workflow logs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitHubLogLine {
    pub timestamp: String,
    pub message: String,
    pub level: String,
}

/// State tracking for an active agent stream
#[derive(Debug, Clone)]
pub struct AgentStreamState {
    pub agent_id: String,
    pub last_line: usize,
    pub is_active: bool,
    pub log_path: PathBuf,
}

/// Get the path to an agent's log file
pub fn get_agent_log_path(agent_id: &str) -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or("Could not find home directory")?;
    let log_path = home
        .join(".claude")
        .join("telemetry")
        .join(format!("agent-{}.log", agent_id));
    Ok(log_path)
}

/// Read log lines from a file starting from a given offset
pub fn read_log_lines(path: &PathBuf, from_line: usize) -> Result<Vec<String>, String> {
    let file =
        File::open(path).map_err(|e| format!("Failed to open log file: {}", e))?;
    let reader = BufReader::new(file);

    let lines: Vec<String> = reader
        .lines()
        .skip(from_line)
        .filter_map(|line| line.ok())
        .collect();

    Ok(lines)
}

/// Parse a log line to extract timestamp and content
pub fn parse_log_line(
    line: &str,
    line_number: usize,
    agent_id: &str,
) -> Option<AgentStreamLine> {
    let trimmed = line.trim();

    // Skip empty lines
    if trimmed.is_empty() {
        return None;
    }

    // Extract timestamp if present (format: [HH:MM:SS])
    let timestamp_regex = regex::Regex::new(r"^\[(\d{2}:\d{2}:\d{2})\]").ok()?;

    if let Some(captures) = timestamp_regex.captures(trimmed) {
        let timestamp = captures.get(1)?.as_str().to_string();
        let content = trimmed[captures.get(0)?.end()..].trim().to_string();

        Some(AgentStreamLine {
            line_number,
            timestamp,
            content,
            agent_id: agent_id.to_string(),
        })
    } else {
        // No timestamp, return line as-is
        Some(AgentStreamLine {
            line_number,
            timestamp: String::new(),
            content: trimmed.to_string(),
            agent_id: agent_id.to_string(),
        })
    }
}

/// Create a new stream state for an agent
pub fn create_stream_state(agent_id: &str) -> Result<AgentStreamState, String> {
    let log_path = get_agent_log_path(agent_id)?;

    Ok(AgentStreamState {
        agent_id: agent_id.to_string(),
        last_line: 0,
        is_active: true,
        log_path,
    })
}

/// Start streaming logs for a local agent (file watching)
#[tauri::command]
pub fn start_agent_stream(
    app: AppHandle,
    agent_id: String,
) -> Result<(), String> {
    let state = create_stream_state(&agent_id)?;
    let state_arc = Arc::new(Mutex::new(state));

    // Spawn a background thread to poll the log file
    let agent_id_clone = agent_id.clone();
    let state_clone = state_arc.clone();

    std::thread::spawn(move || {
        loop {
            // Check if stream is still active
            let is_active = {
                let state = state_clone.lock().unwrap();
                state.is_active
            };

            if !is_active {
                break;
            }

            // Read new log lines
            let (log_path, last_line) = {
                let state = state_clone.lock().unwrap();
                (state.log_path.clone(), state.last_line)
            };

            if log_path.exists() {
                match read_log_lines(&log_path, last_line) {
                    Ok(new_lines) if !new_lines.is_empty() => {
                        // Parse and emit new lines
                        let mut parsed_lines = Vec::new();

                        for (i, line) in new_lines.iter().enumerate() {
                            if let Some(parsed) = parse_log_line(
                                line,
                                last_line + i + 1,
                                &agent_id_clone,
                            ) {
                                parsed_lines.push(parsed);
                            }
                        }

                        // Update state
                        {
                            let mut state = state_clone.lock().unwrap();
                            state.last_line += new_lines.len();
                        }

                        // Emit event to frontend
                        if !parsed_lines.is_empty() {
                            let _ = app.emit("agent-stream-update", parsed_lines);
                        }
                    }
                    _ => {}
                }
            }

            // Poll every 1 second
            std::thread::sleep(Duration::from_secs(1));
        }
    });

    Ok(())
}

/// Stop streaming logs for an agent
#[tauri::command]
pub fn stop_agent_stream(agent_id: String) -> Result<(), String> {
    // In a real implementation, we would store active streams in a global state
    // and set is_active to false here. For now, this is a placeholder.
    log::info!("Stopping stream for agent: {}", agent_id);
    Ok(())
}

/// Get logs from GitHub Actions workflow
pub fn get_github_workflow_logs(run_id: u64) -> Result<Vec<GitHubLogLine>, String> {
    // Use gh CLI to get workflow logs
    let output = Command::new("gh")
        .args(&[
            "run",
            "view",
            &run_id.to_string(),
            "--log",
        ])
        .output()
        .map_err(|e| format!("Failed to execute gh command: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("gh run view failed: {}", stderr));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);

    // Parse log output into structured lines
    let log_lines: Vec<GitHubLogLine> = stdout
        .lines()
        .filter(|line| !line.trim().is_empty())
        .map(|line| {
            // Parse GitHub Actions log format
            // Simplified parsing - in production would be more robust
            GitHubLogLine {
                timestamp: chrono::Utc::now().to_rfc3339(),
                message: line.to_string(),
                level: "info".to_string(),
            }
        })
        .collect();

    Ok(log_lines)
}

/// Stream logs from a GitHub Actions workflow (for remote agents)
#[tauri::command]
pub fn stream_github_workflow_logs(
    app: AppHandle,
    run_id: u64,
    _agent_id: String,
) -> Result<(), String> {
    // Spawn background task to poll GitHub Actions logs
    tauri::async_runtime::spawn(async move {
        loop {
            // Poll every 5 seconds
            tokio::time::sleep(Duration::from_secs(5)).await;

            // Fetch new logs
            match get_github_workflow_logs(run_id) {
                Ok(logs) => {
                    if !logs.is_empty() {
                        // Emit to frontend
                        let _ = app.emit("github-logs-update", logs);
                    }
                }
                Err(e) => {
                    log::error!("Failed to fetch GitHub logs: {}", e);
                    break;
                }
            }
        }
    });

    Ok(())
}

/// Get current log content for an agent
#[tauri::command]
pub fn get_agent_logs(agent_id: String, max_lines: usize) -> Result<Vec<AgentStreamLine>, String> {
    let log_path = get_agent_log_path(&agent_id)?;

    if !log_path.exists() {
        return Ok(vec![]);
    }

    let all_lines = read_log_lines(&log_path, 0)?;

    // Take last max_lines
    let start_index = if all_lines.len() > max_lines {
        all_lines.len() - max_lines
    } else {
        0
    };

    let lines_to_parse: Vec<String> = all_lines.into_iter().skip(start_index).collect();

    let parsed_lines: Vec<AgentStreamLine> = lines_to_parse
        .iter()
        .enumerate()
        .filter_map(|(i, line)| parse_log_line(line, start_index + i + 1, &agent_id))
        .collect();

    Ok(parsed_lines)
}
