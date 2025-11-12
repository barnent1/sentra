use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConversationMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Serialize)]
struct ClaudeRequest {
    model: String,
    max_tokens: u32,
    messages: Vec<ClaudeMessage>,
    system: String,
}

#[derive(Debug, Serialize)]
struct ClaudeMessage {
    role: String,
    content: String,
}

#[derive(Debug, Deserialize)]
struct ClaudeResponse {
    content: Vec<ClaudeContent>,
}

#[derive(Debug, Deserialize)]
struct ClaudeContent {
    text: String,
}

/// Send a message to Claude API and get a response
#[tauri::command]
pub async fn chat_with_architect(
    project_name: String,
    message: String,
    conversation_history: Vec<ConversationMessage>,
    anthropic_api_key: String,
) -> Result<String, String> {
    let client = reqwest::Client::new();

    // Build the system prompt
    let system_prompt = format!(
        r#"You are an expert software architect having a natural conversation about the "{}" project.

Conversational Style:
- Talk like a friendly, experienced colleague - natural and conversational
- Ask ONE question at a time when you need more information
- Listen and respond to what the user says before asking the next question
- Don't bombard with multiple questions or lists of questions
- Use casual, natural language like "What did you have in mind?" not formal lists

Your Approach:
1. When the user mentions a feature, have a natural back-and-forth to understand it
2. Ask clarifying questions ONE AT A TIME as they come up naturally
3. Once you understand the feature well, offer to create GitHub issues
4. Keep the conversation flowing naturally - like chatting with a human architect

Example Natural Flow:
User: "I want to add user authentication"
You: "Nice! What kind of authentication were you thinking - email/password, social logins, or something else?"
[Wait for response, then continue naturally]

Keep it conversational, brief, and human. Don't list out options or ask multiple questions at once."#,
        project_name
    );

    // Build messages array from conversation history
    let mut messages: Vec<ClaudeMessage> = conversation_history
        .iter()
        .map(|msg| ClaudeMessage {
            role: msg.role.clone(),
            content: msg.content.clone(),
        })
        .collect();

    // Add the current message
    messages.push(ClaudeMessage {
        role: "user".to_string(),
        content: message,
    });

    let request_body = ClaudeRequest {
        model: "claude-sonnet-4-20250514".to_string(),
        max_tokens: 2048,
        messages,
        system: system_prompt,
    };

    let response = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", anthropic_api_key)
        .header("anthropic-version", "2023-06-01")
        .header("content-type", "application/json")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("Failed to send request: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response
            .text()
            .await
            .unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("API request failed ({}): {}", status, error_text));
    }

    let claude_response: ClaudeResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    let response_text = claude_response
        .content
        .first()
        .map(|c| c.text.clone())
        .unwrap_or_else(|| "No response from Claude".to_string());

    Ok(response_text)
}

/// Transcribe audio using OpenAI Whisper API
#[tauri::command]
pub async fn transcribe_audio(
    audio_data: Vec<u8>,
    openai_api_key: String,
) -> Result<String, String> {
    let client = reqwest::Client::new();

    // Create multipart form with audio file
    let audio_part = reqwest::multipart::Part::bytes(audio_data)
        .file_name("audio.webm")
        .mime_str("audio/webm")
        .map_err(|e| format!("Failed to create audio part: {}", e))?;

    let form = reqwest::multipart::Form::new()
        .part("file", audio_part)
        .text("model", "whisper-1");

    let response = client
        .post("https://api.openai.com/v1/audio/transcriptions")
        .header("Authorization", format!("Bearer {}", openai_api_key))
        .multipart(form)
        .send()
        .await
        .map_err(|e| format!("Failed to send request: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response
            .text()
            .await
            .unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!(
            "Transcription request failed ({}): {}",
            status, error_text
        ));
    }

    #[derive(Deserialize)]
    struct WhisperResponse {
        text: String,
    }

    let whisper_response: WhisperResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    Ok(whisper_response.text)
}
