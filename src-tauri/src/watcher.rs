use notify::{Error as NotifyError, Event, RecursiveMode, Watcher};
use notify_debouncer_full::{new_debouncer, DebounceEventResult};
use std::sync::Arc;
use std::time::Duration;
use tauri::{AppHandle, Emitter};

use crate::commands;

/// Start watching Claude directories for changes
pub fn start_file_watcher(app_handle: AppHandle) -> Result<(), NotifyError> {
    let home = dirs::home_dir().expect("Could not find home directory");
    let claude_dir = home.join(".claude");
    let tracked_projects_file = claude_dir.join("tracked-projects.txt");
    let telemetry_dir = claude_dir.join("telemetry");

    // Clone app_handle for the closure
    let app_handle = Arc::new(app_handle);
    let app_clone = Arc::clone(&app_handle);

    // Create a debounced watcher (waits 500ms after changes stop)
    let mut debouncer = new_debouncer(
        Duration::from_millis(500),
        None,
        move |result: DebounceEventResult| {
            match result {
                Ok(events) => {
                    for event in events {
                        handle_file_event(&app_clone, &event.event);
                    }
                }
                Err(errors) => {
                    eprintln!("File watcher errors: {:?}", errors);
                }
            }
        },
    )?;

    // Watch tracked-projects.txt
    if tracked_projects_file.exists() {
        debouncer
            .watcher()
            .watch(&tracked_projects_file, RecursiveMode::NonRecursive)?;
        println!("Watching: {}", tracked_projects_file.display());
    }

    // Watch telemetry directory
    if telemetry_dir.exists() {
        debouncer
            .watcher()
            .watch(&telemetry_dir, RecursiveMode::Recursive)?;
        println!("Watching: {}", telemetry_dir.display());
    }

    // Keep the debouncer alive by leaking it
    // This is intentional - we want the watcher to run for the app's lifetime
    std::mem::forget(debouncer);

    Ok(())
}

/// Handle file system events and emit updates to frontend
fn handle_file_event(app_handle: &AppHandle, event: &Event) {
    let path = match event.paths.first() {
        Some(p) => p,
        None => return,
    };

    let path_str = path.to_string_lossy();

    // Tracked projects file changed
    if path_str.contains("tracked-projects.txt") {
        if let Ok(projects) = commands::get_projects() {
            let _ = app_handle.emit("projects-updated", projects);
            println!("📊 Emitted projects-updated event");
        }

        // Also update stats when projects change
        if let Ok(stats) = commands::get_dashboard_stats() {
            let _ = app_handle.emit("stats-updated", stats);
            println!("📈 Emitted stats-updated event");
        }
    }

    // Telemetry log changed
    if path_str.contains("telemetry") && path_str.ends_with(".log") {
        if let Ok(agents) = commands::get_active_agents() {
            let _ = app_handle.emit("agents-updated", agents);
            println!("🤖 Emitted agents-updated event");
        }

        if let Ok(stats) = commands::get_dashboard_stats() {
            let _ = app_handle.emit("stats-updated", stats);
            println!("📈 Emitted stats-updated event");
        }
    }
}
