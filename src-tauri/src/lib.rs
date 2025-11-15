mod commands;
mod watcher;
mod settings;
mod architect;
mod realtime_proxy;
mod specs;
mod git;
mod agents;
mod pr;
mod activity;
mod tray;
pub mod templates;
pub mod agent_stream;
pub mod performance;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_positioner::init())
    .plugin(tauri_plugin_updater::Builder::new().build())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Setup system tray
      if let Err(e) = tray::setup_tray(&app.handle()) {
        eprintln!("Failed to setup system tray: {}", e);
      }

      // Start file watcher for reactive updates
      let app_handle = app.handle().clone();
      std::thread::spawn(move || {
        if let Err(e) = watcher::start_file_watcher(app_handle) {
          eprintln!("Failed to start file watcher: {}", e);
        }
      });

      // Start Realtime API proxy
      let app_handle = app.handle().clone();
      tauri::async_runtime::spawn(async move {
        // Get OpenAI API key from settings
        match settings::get_settings() {
          Ok(settings_value) => {
            if !settings_value.openai_api_key.is_empty() {
              let api_key = settings_value.openai_api_key.clone();
              if let Err(e) = realtime_proxy::start_realtime_proxy(9001, api_key).await {
                eprintln!("Failed to start Realtime API proxy: {}", e);
              }
            } else {
              println!("⚠️  OpenAI API key not configured. Realtime API proxy not started.");
            }
          }
          Err(e) => {
            eprintln!("Failed to load settings for Realtime API proxy: {}", e);
          }
        }
      });

      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      commands::get_projects,
      commands::get_dashboard_stats,
      commands::get_telemetry_logs,
      commands::get_project_memory,
      commands::stop_agent,
      commands::get_project_context,
      commands::save_pending_spec,
      commands::approve_spec,
      commands::reject_spec,
      commands::create_github_issue,
      commands::get_costs,
      commands::create_project,
      commands::select_directory,
      commands::set_project_muted,
      settings::get_settings,
      settings::save_settings,
      settings::speak_notification,
      architect::chat_with_architect,
      architect::transcribe_audio,
      specs::save_spec,
      specs::list_specs,
      specs::get_spec,
      specs::get_spec_versions,
      specs::approve_spec_version,
      specs::delete_spec,
      specs::migrate_pending_spec,
      git::get_git_log,
      git::get_git_diff,
      git::get_git_status,
      agents::get_active_agents,
      pr::get_pull_request,
      pr::get_pr_diff,
      pr::approve_pull_request,
      pr::request_changes_pull_request,
      pr::merge_pull_request,
      activity::get_activity_events,
      activity::add_activity_event,
      activity::clear_activity_events,
      tray::show_menubar_window,
      tray::hide_menubar_window,
      tray::toggle_menubar_window,
      tray::show_main_window,
      tray::quit_app,
      agent_stream::start_agent_stream,
      agent_stream::stop_agent_stream,
      agent_stream::stream_github_workflow_logs,
      agent_stream::get_agent_logs,
      templates::get_templates_command,
      templates::get_template_command,
      performance::get_performance_metrics,
      performance::get_slow_operations_command,
      performance::clear_performance_metrics,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
