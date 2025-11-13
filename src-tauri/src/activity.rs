use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;

/// Type of activity event
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ActivityEventType {
    Commit,
    AgentStart,
    AgentComplete,
    Build,
    Error,
}

/// Activity event metadata (flexible JSON object)
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ActivityMetadata {
    #[serde(flatten)]
    pub data: HashMap<String, serde_json::Value>,
}

/// Single activity event in the feed
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ActivityEvent {
    pub id: String,
    pub timestamp: String, // ISO 8601 format
    pub project: String,
    pub event_type: ActivityEventType,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<ActivityMetadata>,
}

/// In-memory activity store (per-project)
/// Format: HashMap<ProjectName, Vec<ActivityEvent>>
static ACTIVITY_STORE: Mutex<Option<HashMap<String, Vec<ActivityEvent>>>> = Mutex::new(None);

/// Initialize the activity store
fn init_store() {
    let mut store = ACTIVITY_STORE.lock().unwrap();
    if store.is_none() {
        *store = Some(HashMap::new());
    }
}

/// Get recent activity events for a project or all projects
///
/// # Arguments
/// * `limit` - Maximum number of events to return (default: 50, max: 200)
/// * `project` - Optional project name filter. If None, returns events from all projects
///
/// # Returns
/// Vec of ActivityEvent sorted by timestamp (most recent first)
#[tauri::command]
pub fn get_activity_events(limit: Option<usize>, project: Option<String>) -> Vec<ActivityEvent> {
    init_store();

    let store = ACTIVITY_STORE.lock().unwrap();
    let store_map = store.as_ref().unwrap();

    let effective_limit = limit.unwrap_or(50).min(200);

    // Collect events from all projects or specific project
    let mut events: Vec<ActivityEvent> = if let Some(ref proj) = project {
        // Get events for specific project
        store_map
            .get(proj)
            .map(|events| events.clone())
            .unwrap_or_default()
    } else {
        // Get events from all projects
        store_map
            .values()
            .flat_map(|events| events.clone())
            .collect()
    };

    // Sort by timestamp descending (most recent first)
    events.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));

    // Limit results
    events.truncate(effective_limit);

    events
}

/// Add a new activity event
///
/// # Arguments
/// * `project` - Project name
/// * `event_type` - Type of event
/// * `message` - Human-readable message
/// * `metadata` - Optional metadata (key-value pairs)
///
/// # Returns
/// The created ActivityEvent
#[tauri::command]
pub fn add_activity_event(
    project: String,
    event_type: ActivityEventType,
    message: String,
    metadata: Option<HashMap<String, serde_json::Value>>,
) -> Result<ActivityEvent, String> {
    init_store();

    // Generate unique ID (timestamp + random)
    let id = format!(
        "{}-{}",
        chrono::Utc::now().timestamp_millis(),
        uuid::Uuid::new_v4().to_string()[..8].to_string()
    );

    // Get current timestamp in ISO 8601 format
    let timestamp = chrono::Utc::now().to_rfc3339();

    // Create metadata struct
    let metadata_struct = metadata.map(|data| ActivityMetadata { data });

    let event = ActivityEvent {
        id,
        timestamp,
        project: project.clone(),
        event_type,
        message,
        metadata: metadata_struct,
    };

    // Add to store
    let mut store = ACTIVITY_STORE.lock().unwrap();
    let store_map = store.as_mut().unwrap();

    let project_events = store_map.entry(project).or_insert_with(Vec::new);
    project_events.push(event.clone());

    // Keep only last 200 events per project to prevent unbounded growth
    if project_events.len() > 200 {
        project_events.drain(0..project_events.len() - 200);
    }

    Ok(event)
}

/// Clear all activity events (for testing or cleanup)
#[tauri::command]
pub fn clear_activity_events(project: Option<String>) -> Result<(), String> {
    init_store();

    let mut store = ACTIVITY_STORE.lock().unwrap();
    let store_map = store.as_mut().unwrap();

    if let Some(proj) = project {
        // Clear specific project
        store_map.remove(&proj);
    } else {
        // Clear all projects
        store_map.clear();
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Mutex;

    // Mutex to ensure tests run serially (not in parallel)
    // This prevents test interference since they share global state
    static TEST_MUTEX: Mutex<()> = Mutex::new(());

    // Helper to clear store before each test
    fn setup() -> std::sync::MutexGuard<'static, ()> {
        let guard = TEST_MUTEX.lock().unwrap();
        let _ = clear_activity_events(None);
        guard
    }

    #[test]
    fn test_add_activity_event_creates_event_with_all_fields() {
        // ARRANGE
        let _guard = setup();
        let mut metadata = HashMap::new();
        metadata.insert("author".to_string(), serde_json::json!("Claude"));
        metadata.insert("hash".to_string(), serde_json::json!("abc123"));

        // ACT
        let result = add_activity_event(
            "sentra".to_string(),
            ActivityEventType::Commit,
            "feat: add voice queue".to_string(),
            Some(metadata.clone()),
        );

        // ASSERT
        assert!(result.is_ok());
        let event = result.unwrap();
        assert!(!event.id.is_empty());
        assert!(!event.timestamp.is_empty());
        assert_eq!(event.project, "sentra");
        assert_eq!(event.event_type, ActivityEventType::Commit);
        assert_eq!(event.message, "feat: add voice queue");
        assert!(event.metadata.is_some());

        let event_metadata = event.metadata.unwrap();
        assert_eq!(event_metadata.data.get("author").unwrap(), "Claude");
        assert_eq!(event_metadata.data.get("hash").unwrap(), "abc123");
    }

    #[test]
    fn test_add_activity_event_without_metadata() {
        // ARRANGE
        let _guard = setup();

        // ACT
        let result = add_activity_event(
            "sentra".to_string(),
            ActivityEventType::Build,
            "Build completed".to_string(),
            None,
        );

        // ASSERT
        assert!(result.is_ok());
        let event = result.unwrap();
        assert!(event.metadata.is_none());
    }

    #[test]
    fn test_add_activity_event_generates_unique_ids() {
        // ARRANGE
        let _guard = setup();

        // ACT
        let event1 = add_activity_event(
            "sentra".to_string(),
            ActivityEventType::Commit,
            "First commit".to_string(),
            None,
        ).unwrap();

        let event2 = add_activity_event(
            "sentra".to_string(),
            ActivityEventType::Commit,
            "Second commit".to_string(),
            None,
        ).unwrap();

        // ASSERT
        assert_ne!(event1.id, event2.id);
    }

    #[test]
    fn test_get_activity_events_returns_empty_for_new_project() {
        // ARRANGE
        let _guard = setup();

        // ACT
        let events = get_activity_events(Some(50), Some("nonexistent".to_string()));

        // ASSERT
        assert_eq!(events.len(), 0);
    }

    #[test]
    fn test_get_activity_events_returns_all_events_for_project() {
        // ARRANGE
        let _guard = setup();
        add_activity_event(
            "sentra".to_string(),
            ActivityEventType::Commit,
            "Event 1".to_string(),
            None,
        ).unwrap();

        add_activity_event(
            "sentra".to_string(),
            ActivityEventType::Build,
            "Event 2".to_string(),
            None,
        ).unwrap();

        add_activity_event(
            "workcell".to_string(),
            ActivityEventType::Commit,
            "Event 3".to_string(),
            None,
        ).unwrap();

        // ACT
        let events = get_activity_events(Some(50), Some("sentra".to_string()));

        // ASSERT
        assert_eq!(events.len(), 2);
        assert!(events.iter().all(|e| e.project == "sentra"));
    }

    #[test]
    fn test_get_activity_events_returns_all_projects_when_no_filter() {
        // ARRANGE
        let _guard = setup();
        add_activity_event(
            "sentra".to_string(),
            ActivityEventType::Commit,
            "Event 1".to_string(),
            None,
        ).unwrap();

        add_activity_event(
            "workcell".to_string(),
            ActivityEventType::Commit,
            "Event 2".to_string(),
            None,
        ).unwrap();

        add_activity_event(
            "aidio".to_string(),
            ActivityEventType::Build,
            "Event 3".to_string(),
            None,
        ).unwrap();

        // ACT
        let events = get_activity_events(None, None);

        // ASSERT
        assert_eq!(events.len(), 3);
        assert!(events.iter().any(|e| e.project == "sentra"));
        assert!(events.iter().any(|e| e.project == "workcell"));
        assert!(events.iter().any(|e| e.project == "aidio"));
    }

    #[test]
    fn test_get_activity_events_sorts_by_timestamp_descending() {
        // ARRANGE
        let _guard = setup();

        // Add events with slight delay to ensure different timestamps
        add_activity_event(
            "sentra".to_string(),
            ActivityEventType::Commit,
            "First event".to_string(),
            None,
        ).unwrap();

        std::thread::sleep(std::time::Duration::from_millis(10));

        add_activity_event(
            "sentra".to_string(),
            ActivityEventType::Commit,
            "Second event".to_string(),
            None,
        ).unwrap();

        std::thread::sleep(std::time::Duration::from_millis(10));

        add_activity_event(
            "sentra".to_string(),
            ActivityEventType::Commit,
            "Third event".to_string(),
            None,
        ).unwrap();

        // ACT
        let events = get_activity_events(None, Some("sentra".to_string()));

        // ASSERT
        assert_eq!(events.len(), 3);
        // Most recent should be first
        assert_eq!(events[0].message, "Third event");
        assert_eq!(events[1].message, "Second event");
        assert_eq!(events[2].message, "First event");
    }

    #[test]
    fn test_get_activity_events_respects_limit() {
        // ARRANGE
        let _guard = setup();

        // Add 10 events
        for i in 0..10 {
            add_activity_event(
                "sentra".to_string(),
                ActivityEventType::Commit,
                format!("Event {}", i),
                None,
            ).unwrap();
        }

        // ACT
        let events = get_activity_events(Some(5), Some("sentra".to_string()));

        // ASSERT
        assert_eq!(events.len(), 5);
    }

    #[test]
    fn test_get_activity_events_default_limit_is_50() {
        // ARRANGE
        let _guard = setup();

        // Add 60 events
        for i in 0..60 {
            add_activity_event(
                "sentra".to_string(),
                ActivityEventType::Commit,
                format!("Event {}", i),
                None,
            ).unwrap();
        }

        // ACT
        let events = get_activity_events(None, Some("sentra".to_string()));

        // ASSERT
        assert_eq!(events.len(), 50);
    }

    #[test]
    fn test_get_activity_events_max_limit_is_200() {
        // ARRANGE
        let _guard = setup();

        // Add 250 events
        for i in 0..250 {
            add_activity_event(
                "sentra".to_string(),
                ActivityEventType::Commit,
                format!("Event {}", i),
                None,
            ).unwrap();
        }

        // ACT
        let events = get_activity_events(Some(300), Some("sentra".to_string()));

        // ASSERT
        assert_eq!(events.len(), 200);
    }

    #[test]
    fn test_add_activity_event_limits_per_project_to_200() {
        // ARRANGE
        let _guard = setup();

        // ACT - Add 250 events to same project
        for i in 0..250 {
            add_activity_event(
                "sentra".to_string(),
                ActivityEventType::Commit,
                format!("Event {}", i),
                None,
            ).unwrap();
        }

        // ASSERT
        let events = get_activity_events(Some(300), Some("sentra".to_string()));
        assert_eq!(events.len(), 200);

        // Should keep the most recent 200 events
        assert_eq!(events[0].message, "Event 249"); // Most recent
        assert_eq!(events[199].message, "Event 50"); // Oldest kept
    }

    #[test]
    fn test_clear_activity_events_clears_specific_project() {
        // ARRANGE
        let _guard = setup();
        add_activity_event(
            "sentra".to_string(),
            ActivityEventType::Commit,
            "Sentra event".to_string(),
            None,
        ).unwrap();

        add_activity_event(
            "workcell".to_string(),
            ActivityEventType::Commit,
            "Workcell event".to_string(),
            None,
        ).unwrap();

        // ACT
        let result = clear_activity_events(Some("sentra".to_string()));

        // ASSERT
        assert!(result.is_ok());
        let sentra_events = get_activity_events(None, Some("sentra".to_string()));
        let workcell_events = get_activity_events(None, Some("workcell".to_string()));

        assert_eq!(sentra_events.len(), 0);
        assert_eq!(workcell_events.len(), 1);
    }

    #[test]
    fn test_clear_activity_events_clears_all_projects() {
        // ARRANGE
        let _guard = setup();
        add_activity_event(
            "sentra".to_string(),
            ActivityEventType::Commit,
            "Sentra event".to_string(),
            None,
        ).unwrap();

        add_activity_event(
            "workcell".to_string(),
            ActivityEventType::Commit,
            "Workcell event".to_string(),
            None,
        ).unwrap();

        // ACT
        let result = clear_activity_events(None);

        // ASSERT
        assert!(result.is_ok());
        let all_events = get_activity_events(None, None);
        assert_eq!(all_events.len(), 0);
    }

    #[test]
    fn test_activity_event_type_serialization() {
        // ARRANGE & ACT
        let _guard = setup();
        let commit_type = ActivityEventType::Commit;
        let agent_start_type = ActivityEventType::AgentStart;
        let agent_complete_type = ActivityEventType::AgentComplete;
        let build_type = ActivityEventType::Build;
        let error_type = ActivityEventType::Error;

        // ASSERT - should serialize to snake_case
        assert_eq!(
            serde_json::to_string(&commit_type).unwrap(),
            r#""commit""#
        );
        assert_eq!(
            serde_json::to_string(&agent_start_type).unwrap(),
            r#""agent_start""#
        );
        assert_eq!(
            serde_json::to_string(&agent_complete_type).unwrap(),
            r#""agent_complete""#
        );
        assert_eq!(
            serde_json::to_string(&build_type).unwrap(),
            r#""build""#
        );
        assert_eq!(
            serde_json::to_string(&error_type).unwrap(),
            r#""error""#
        );
    }

    #[test]
    fn test_activity_event_serialization_omits_none_metadata() {
        // ARRANGE
        let _guard = setup();
        let event = add_activity_event(
            "sentra".to_string(),
            ActivityEventType::Build,
            "Build completed".to_string(),
            None,
        ).unwrap();

        // ACT
        let json = serde_json::to_string(&event).unwrap();

        // ASSERT - metadata field should not be present in JSON
        assert!(!json.contains("metadata"));
    }

    #[test]
    fn test_activity_event_timestamp_is_iso8601() {
        // ARRANGE
        let _guard = setup();

        // ACT
        let event = add_activity_event(
            "sentra".to_string(),
            ActivityEventType::Commit,
            "Test".to_string(),
            None,
        ).unwrap();

        // ASSERT - should be valid ISO 8601 format
        let parsed = chrono::DateTime::parse_from_rfc3339(&event.timestamp);
        assert!(parsed.is_ok());
    }
}
