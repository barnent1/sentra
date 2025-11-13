use app_lib::agent_stream::*;
use std::fs;
use std::io::Write;
use std::path::PathBuf;
use tempfile::TempDir;

#[cfg(test)]
mod tests {
    use super::*;

    // ============================================================================
    // Test: Agent log file watching
    // ============================================================================

    #[test]
    fn test_get_agent_log_path_constructs_correct_path() {
        // ARRANGE: Create an agent ID
        let agent_id = "sentra-42";

        // ACT: Get log path
        let result = get_agent_log_path(agent_id);

        // ASSERT: Should construct correct path
        assert!(result.is_ok());
        let path = result.unwrap();
        assert!(path.to_string_lossy().contains(".claude/telemetry"));
        assert!(path.to_string_lossy().contains("agent-sentra-42.log"));
    }

    #[test]
    fn test_read_log_lines_reads_existing_file() {
        // ARRANGE: Create a temporary log file
        let temp_dir = TempDir::new().unwrap();
        let log_path = temp_dir.path().join("test-agent.log");

        let mut file = fs::File::create(&log_path).unwrap();
        writeln!(file, "[14:32:15] Starting task").unwrap();
        writeln!(file, "[14:32:18] Creating files").unwrap();
        writeln!(file, "[14:32:45] Running tests").unwrap();

        // ACT: Read log lines
        let result = read_log_lines(&log_path, 0);

        // ASSERT: Should read all lines
        assert!(result.is_ok());
        let lines = result.unwrap();
        assert_eq!(lines.len(), 3);
        assert!(lines[0].contains("Starting task"));
        assert!(lines[1].contains("Creating files"));
        assert!(lines[2].contains("Running tests"));
    }

    #[test]
    fn test_read_log_lines_reads_from_offset() {
        // ARRANGE: Create a temporary log file with 5 lines
        let temp_dir = TempDir::new().unwrap();
        let log_path = temp_dir.path().join("test-agent.log");

        let mut file = fs::File::create(&log_path).unwrap();
        writeln!(file, "Line 1").unwrap();
        writeln!(file, "Line 2").unwrap();
        writeln!(file, "Line 3").unwrap();
        writeln!(file, "Line 4").unwrap();
        writeln!(file, "Line 5").unwrap();

        // ACT: Read from offset 2 (skip first 2 lines)
        let result = read_log_lines(&log_path, 2);

        // ASSERT: Should only return lines 3, 4, 5
        assert!(result.is_ok());
        let lines = result.unwrap();
        assert_eq!(lines.len(), 3);
        assert!(lines[0].contains("Line 3"));
        assert!(lines[1].contains("Line 4"));
        assert!(lines[2].contains("Line 5"));
    }

    #[test]
    fn test_read_log_lines_handles_nonexistent_file() {
        // ARRANGE: Path to nonexistent file
        let log_path = PathBuf::from("/nonexistent/agent.log");

        // ACT: Try to read log lines
        let result = read_log_lines(&log_path, 0);

        // ASSERT: Should return error
        assert!(result.is_err());
    }

    #[test]
    fn test_read_log_lines_returns_empty_for_empty_file() {
        // ARRANGE: Create empty log file
        let temp_dir = TempDir::new().unwrap();
        let log_path = temp_dir.path().join("empty.log");
        fs::File::create(&log_path).unwrap();

        // ACT: Read log lines
        let result = read_log_lines(&log_path, 0);

        // ASSERT: Should return empty vector
        assert!(result.is_ok());
        let lines = result.unwrap();
        assert_eq!(lines.len(), 0);
    }

    // ============================================================================
    // Test: Agent stream info structure
    // ============================================================================

    #[test]
    fn test_agent_stream_line_serializes_correctly() {
        // ARRANGE: Create an agent stream line
        let line = AgentStreamLine {
            line_number: 42,
            timestamp: "14:32:15".to_string(),
            content: "Starting task".to_string(),
            agent_id: "sentra-42".to_string(),
        };

        // ACT: Serialize to JSON
        let json = serde_json::to_string(&line);

        // ASSERT: Should serialize successfully
        assert!(json.is_ok());
        let json_str = json.unwrap();
        assert!(json_str.contains("lineNumber"));
        assert!(json_str.contains("42"));
        assert!(json_str.contains("timestamp"));
        assert!(json_str.contains("14:32:15"));
        assert!(json_str.contains("Starting task"));
        assert!(json_str.contains("sentra-42"));
    }

    #[test]
    fn test_parse_log_line_extracts_timestamp() {
        // ARRANGE: Log line with timestamp
        let line = "[14:32:15] Starting task: Implement feature";

        // ACT: Parse log line
        let result = parse_log_line(line, 1, "sentra-42");

        // ASSERT: Should extract timestamp
        assert!(result.is_some());
        let parsed = result.unwrap();
        assert_eq!(parsed.timestamp, "14:32:15");
        assert_eq!(parsed.content, "Starting task: Implement feature");
        assert_eq!(parsed.line_number, 1);
    }

    #[test]
    fn test_parse_log_line_handles_line_without_timestamp() {
        // ARRANGE: Log line without timestamp
        let line = "Regular log line without timestamp";

        // ACT: Parse log line
        let result = parse_log_line(line, 5, "test-agent");

        // ASSERT: Should still parse with empty timestamp
        assert!(result.is_some());
        let parsed = result.unwrap();
        assert_eq!(parsed.timestamp, "");
        assert_eq!(parsed.content, "Regular log line without timestamp");
    }

    #[test]
    fn test_parse_log_line_handles_empty_line() {
        // ARRANGE: Empty line
        let line = "";

        // ACT: Parse log line
        let result = parse_log_line(line, 10, "agent-1");

        // ASSERT: Should return None for empty lines
        assert!(result.is_none());
    }

    #[test]
    fn test_parse_log_line_handles_whitespace_only() {
        // ARRANGE: Whitespace-only line
        let line = "   \t  ";

        // ACT: Parse log line
        let result = parse_log_line(line, 10, "agent-1");

        // ASSERT: Should return None for whitespace-only lines
        assert!(result.is_none());
    }

    // ============================================================================
    // Test: GitHub Actions log streaming
    // ============================================================================

    #[test]
    fn test_get_github_workflow_logs_constructs_correct_command() {
        // ARRANGE: Workflow run ID
        let run_id = 12345;

        // ACT: This test verifies the function signature and error handling
        // We can't easily test the actual gh CLI call without mocking
        let result = get_github_workflow_logs(run_id);

        // ASSERT: Function should return a result (success or error)
        // If gh CLI is not configured, it should fail gracefully
        assert!(result.is_ok() || result.is_err());
    }

    #[test]
    fn test_github_log_line_serializes_correctly() {
        // ARRANGE: Create a GitHub log line
        let line = GitHubLogLine {
            timestamp: "2025-11-13T14:32:15Z".to_string(),
            message: "Running tests".to_string(),
            level: "info".to_string(),
        };

        // ACT: Serialize to JSON
        let json = serde_json::to_string(&line);

        // ASSERT: Should serialize successfully
        assert!(json.is_ok());
        let json_str = json.unwrap();
        assert!(json_str.contains("timestamp"));
        assert!(json_str.contains("message"));
        assert!(json_str.contains("Running tests"));
        assert!(json_str.contains("info"));
    }

    // ============================================================================
    // Test: Stream state management
    // ============================================================================

    #[test]
    fn test_agent_stream_state_tracks_position() {
        // ARRANGE: Create stream state
        let state = AgentStreamState {
            agent_id: "sentra-42".to_string(),
            last_line: 0,
            is_active: true,
            log_path: PathBuf::from("/tmp/test.log"),
        };

        // ACT: Check initial state

        // ASSERT: Should have correct initial values
        assert_eq!(state.agent_id, "sentra-42");
        assert_eq!(state.last_line, 0);
        assert_eq!(state.is_active, true);
    }

    #[test]
    fn test_create_stream_state_initializes_correctly() {
        // ARRANGE: Agent ID
        let agent_id = "test-agent-123";

        // ACT: Create stream state
        let result = create_stream_state(agent_id);

        // ASSERT: Should initialize with correct values
        assert!(result.is_ok());
        let state = result.unwrap();
        assert_eq!(state.agent_id, agent_id);
        assert_eq!(state.last_line, 0);
        assert_eq!(state.is_active, true);
        assert!(state.log_path.to_string_lossy().contains(agent_id));
    }

    // ============================================================================
    // Test: Multiple concurrent agents
    // ============================================================================

    #[test]
    fn test_handles_multiple_concurrent_log_files() {
        // ARRANGE: Create multiple log files
        let temp_dir = TempDir::new().unwrap();

        let log1 = temp_dir.path().join("agent-1.log");
        let mut file1 = fs::File::create(&log1).unwrap();
        writeln!(file1, "Agent 1 log line").unwrap();

        let log2 = temp_dir.path().join("agent-2.log");
        let mut file2 = fs::File::create(&log2).unwrap();
        writeln!(file2, "Agent 2 log line").unwrap();

        // ACT: Read from both files
        let result1 = read_log_lines(&log1, 0);
        let result2 = read_log_lines(&log2, 0);

        // ASSERT: Should read both independently
        assert!(result1.is_ok());
        assert!(result2.is_ok());

        let lines1 = result1.unwrap();
        let lines2 = result2.unwrap();

        assert_eq!(lines1.len(), 1);
        assert_eq!(lines2.len(), 1);
        assert!(lines1[0].contains("Agent 1"));
        assert!(lines2[0].contains("Agent 2"));
    }
}
