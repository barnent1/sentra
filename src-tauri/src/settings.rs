use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub user_name: String,
    pub voice: String,
    pub openai_api_key: String,
    pub anthropic_api_key: String,
    pub notifications_enabled: bool,
    pub notify_on_completion: bool,
    pub notify_on_failure: bool,
    pub notify_on_start: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Settings {
            user_name: "".to_string(),
            voice: "nova".to_string(),
            openai_api_key: "".to_string(),
            anthropic_api_key: "".to_string(),
            notifications_enabled: true,
            notify_on_completion: true,
            notify_on_failure: true,
            notify_on_start: false,
        }
    }
}

fn get_settings_path() -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or("Could not find home directory")?;
    let settings_dir = home.join(".claude/sentra");

    // Create directory if it doesn't exist
    if !settings_dir.exists() {
        fs::create_dir_all(&settings_dir)
            .map_err(|e| format!("Failed to create settings directory: {}", e))?;
    }

    Ok(settings_dir.join("settings.json"))
}

/// Get current settings
#[tauri::command]
pub fn get_settings() -> Result<Settings, String> {
    let settings_file = get_settings_path()?;

    if !settings_file.exists() {
        return Ok(Settings::default());
    }

    let content = fs::read_to_string(&settings_file)
        .map_err(|e| format!("Failed to read settings: {}", e))?;

    let settings: Settings = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse settings: {}", e))?;

    Ok(settings)
}

/// Save settings
#[tauri::command]
pub fn save_settings(settings: Settings) -> Result<(), String> {
    let settings_file = get_settings_path()?;

    let json = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;

    fs::write(&settings_file, json)
        .map_err(|e| format!("Failed to write settings: {}", e))?;

    Ok(())
}

/// Speak a notification using OpenAI TTS
#[tauri::command]
pub async fn speak_notification(message: String, voice: String, api_key: String) -> Result<(), String> {
    if api_key.is_empty() {
        return Err("OpenAI API key not configured".to_string());
    }

    // Call OpenAI TTS API
    let client = reqwest::Client::new();

    let body = serde_json::json!({
        "model": "tts-1-hd",
        "input": message,
        "voice": voice
    });

    let response = client
        .post("https://api.openai.com/v1/audio/speech")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Failed to call OpenAI API: {}", e))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("OpenAI API error: {}", error_text));
    }

    let audio_data = response.bytes().await
        .map_err(|e| format!("Failed to get audio data: {}", e))?;

    // Save to temp file and play
    let temp_file = std::env::temp_dir().join("sentra-notification.mp3");
    fs::write(&temp_file, audio_data)
        .map_err(|e| format!("Failed to write audio file: {}", e))?;

    // Play the audio file using afplay (macOS)
    std::process::Command::new("afplay")
        .arg(&temp_file)
        .spawn()
        .map_err(|e| format!("Failed to play audio: {}", e))?;

    Ok(())
}
