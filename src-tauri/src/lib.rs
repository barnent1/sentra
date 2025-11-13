mod commands;
mod watcher;
mod settings;
mod architect;
mod realtime_proxy;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
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
      commands::get_active_agents,
      commands::get_dashboard_stats,
      commands::get_telemetry_logs,
      commands::get_project_memory,
      commands::stop_agent,
      commands::get_project_context,
      commands::save_pending_spec,
      commands::approve_spec,
      commands::reject_spec,
      commands::create_github_issue,
      settings::get_settings,
      settings::save_settings,
      settings::speak_notification,
      architect::chat_with_architect,
      architect::transcribe_audio,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
