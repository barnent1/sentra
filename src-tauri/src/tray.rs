use tauri::{
    AppHandle, Manager, Runtime,
    tray::{TrayIconBuilder, TrayIconEvent, MouseButton, MouseButtonState},
};
use tauri_plugin_positioner::{Position, WindowExt};

/// Setup system tray icon with menu
pub fn setup_tray<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    // For now, use the default icon and template mode for proper macOS rendering
    // The sentra-translucent.png can be set as the app icon in tauri.conf.json
    let icon = app.default_window_icon().unwrap().clone();

    // Build the tray icon
    let _tray = TrayIconBuilder::new()
        .icon(icon)
        .icon_as_template(true)  // macOS: render as template (adapts to light/dark mode)
        .tooltip("Sentra - AI Agent Control Center")
        .on_tray_icon_event(|tray, event| {
            tauri_plugin_positioner::on_tray_event(tray.app_handle(), &event);

            match event {
                TrayIconEvent::Click {
                    button: MouseButton::Left,
                    button_state: MouseButtonState::Up,
                    ..
                } => {
                    let app = tray.app_handle();

                    // Toggle the menu bar window
                    if let Some(window) = app.get_webview_window("menubar") {
                        if window.is_visible().unwrap_or(false) {
                            let _ = window.hide();
                        } else {
                            let _ = window.show();
                            let _ = window.set_focus();

                            // Position window below tray icon
                            #[cfg(target_os = "macos")]
                            let _ = window.move_window(Position::TrayCenter);
                        }
                    }
                }
                _ => {}
            }
        })
        .build(app)?;

    Ok(())
}

/// Commands for menu bar window control
#[tauri::command]
pub fn show_menubar_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("menubar") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;

        #[cfg(target_os = "macos")]
        window.move_window(Position::TrayCenter).map_err(|e| e.to_string())?;

        Ok(())
    } else {
        Err("Menubar window not found".to_string())
    }
}

#[tauri::command]
pub fn hide_menubar_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("menubar") {
        window.hide().map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("Menubar window not found".to_string())
    }
}

#[tauri::command]
pub fn toggle_menubar_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("menubar") {
        if window.is_visible().unwrap_or(false) {
            hide_menubar_window(app)
        } else {
            show_menubar_window(app)
        }
    } else {
        Err("Menubar window not found".to_string())
    }
}

#[tauri::command]
pub fn show_main_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;

        // Hide menubar window when showing main
        let _ = hide_menubar_window(app);

        Ok(())
    } else {
        Err("Main window not found".to_string())
    }
}

#[tauri::command]
pub fn quit_app(app: AppHandle) -> Result<(), String> {
    app.exit(0);
    Ok(())
}
