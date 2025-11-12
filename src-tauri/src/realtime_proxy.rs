use futures_util::{SinkExt, StreamExt};
use std::sync::Arc;
use tokio::net::TcpListener;
use tokio_tungstenite::{accept_async, connect_async, tungstenite::Message};
use tokio_tungstenite::tungstenite::handshake::client::generate_key;

/// Start a WebSocket server that proxies connections to OpenAI's Realtime API
pub async fn start_realtime_proxy(port: u16, api_key: String) -> Result<(), Box<dyn std::error::Error>> {
    let addr = format!("127.0.0.1:{}", port);
    let listener = TcpListener::bind(&addr).await?;
    println!("🎙️ Realtime API proxy listening on {}", addr);

    let api_key = Arc::new(api_key);

    while let Ok((stream, _)) = listener.accept().await {
        let api_key = Arc::clone(&api_key);

        tokio::spawn(async move {
            if let Err(e) = handle_connection(stream, api_key).await {
                eprintln!("Error handling connection: {}", e);
            }
        });
    }

    Ok(())
}

async fn handle_connection(
    stream: tokio::net::TcpStream,
    api_key: Arc<String>,
) -> Result<(), Box<dyn std::error::Error>> {
    // Accept WebSocket connection from frontend
    let ws_stream = accept_async(stream).await?;
    println!("🔌 Frontend connected");

    let (mut frontend_tx, mut frontend_rx) = ws_stream.split();

    // Connect to OpenAI Realtime API
    let openai_url = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01";

    println!("🔄 Connecting to OpenAI Realtime API...");
    let request = tokio_tungstenite::tungstenite::http::Request::builder()
        .uri(openai_url)
        .header("Host", "api.openai.com")
        .header("Connection", "Upgrade")
        .header("Upgrade", "websocket")
        .header("Sec-WebSocket-Version", "13")
        .header("Sec-WebSocket-Key", generate_key())
        .header("Authorization", format!("Bearer {}", api_key.as_str()))
        .header("OpenAI-Beta", "realtime=v1")
        .body(())?;

    let (openai_stream, response) = match connect_async(request).await {
        Ok(result) => result,
        Err(e) => {
            eprintln!("❌ Failed to connect to OpenAI: {}", e);
            return Err(e.into());
        }
    };
    println!("🔌 Connected to OpenAI Realtime API (status: {:?})", response.status());

    let (mut openai_tx, mut openai_rx) = openai_stream.split();

    // Bidirectional forwarding
    let frontend_to_openai = async {
        while let Some(msg) = frontend_rx.next().await {
            match msg {
                Ok(Message::Text(text)) => {
                    println!("→ Frontend: {}", text);
                    if let Err(e) = openai_tx.send(Message::Text(text)).await {
                        eprintln!("Error forwarding to OpenAI: {}", e);
                        break;
                    }
                }
                Ok(Message::Binary(data)) => {
                    println!("→ Frontend: Binary ({} bytes)", data.len());
                    if let Err(e) = openai_tx.send(Message::Binary(data)).await {
                        eprintln!("Error forwarding to OpenAI: {}", e);
                        break;
                    }
                }
                Ok(Message::Close(_)) => {
                    println!("Frontend closed connection");
                    break;
                }
                Err(e) => {
                    eprintln!("Error receiving from frontend: {}", e);
                    break;
                }
                _ => {}
            }
        }
    };

    let openai_to_frontend = async {
        while let Some(msg) = openai_rx.next().await {
            match msg {
                Ok(Message::Text(text)) => {
                    println!("← OpenAI: {}", text);
                    if let Err(e) = frontend_tx.send(Message::Text(text)).await {
                        eprintln!("Error forwarding to frontend: {}", e);
                        break;
                    }
                }
                Ok(Message::Binary(data)) => {
                    println!("← OpenAI: Binary ({} bytes)", data.len());
                    if let Err(e) = frontend_tx.send(Message::Binary(data)).await {
                        eprintln!("Error forwarding to frontend: {}", e);
                        break;
                    }
                }
                Ok(Message::Close(_)) => {
                    println!("OpenAI closed connection");
                    break;
                }
                Err(e) => {
                    eprintln!("Error receiving from OpenAI: {}", e);
                    break;
                }
                _ => {}
            }
        }
    };

    // Run both forwarding tasks concurrently
    tokio::select! {
        _ = frontend_to_openai => {},
        _ = openai_to_frontend => {},
    }

    println!("Connection closed");
    Ok(())
}
