/**
 * OpenAI Realtime API client using WebRTC transport
 * WebRTC provides native echo cancellation and lower latency than WebSocket
 * This implementation follows OpenAI's official WebRTC pattern
 *
 * AUDIO PLAYBACK ARCHITECTURE:
 * - Uses HTMLAudioElement for simple, reliable audio playback
 * - Explicit .play() calls ensure playback works after pause/interruption
 */

// Realtime API supported voices (as of 2025)
// These are the ONLY voices that work with /v1/realtime
const REALTIME_VOICES = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse', 'marin', 'cedar'] as const;
type RealtimeVoice = typeof REALTIME_VOICES[number];

function isRealtimeVoice(voice: string): voice is RealtimeVoice {
  return REALTIME_VOICES.includes(voice as RealtimeVoice);
}

export interface RealtimeConfig {
  projectName: string;
  projectContext?: string;
  voice?: string;  // OpenAI Realtime voice - will be validated against REALTIME_VOICES
  onResponse: (text: string) => void;
  onUserTranscript: (text: string) => void;
  onError: (error: string) => void;
  onAudioPlay: (audio: ArrayBuffer) => void;
  onAudioPlaybackComplete?: () => void;  // Called when all audio chunks finish playing
  onConversationComplete?: () => void;
}

export class RealtimeConversation {
  private config: RealtimeConfig;
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private stream: MediaStream | null = null;
  private isRecording = false;
  private sessionId: string | null = null;
  private ephemeralToken: string | null = null;
  // Audio playback: HTMLAudioElement
  private remoteAudioElement: HTMLAudioElement | null = null;
  private isPlayingAudio = false;
  // Bug #7 Fix: Track if AI is actively responding to avoid cancelling non-existent responses
  private isAIResponding = false;
  // Bug #7 Enhancement: Track response ID to ensure we only cancel valid responses
  private currentResponseId: string | null = null;
  private responseStartTime: number = 0;

  constructor(config: RealtimeConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    try {
      // Create audio element BEFORE connection (in browser context, not SSR)
      // This prevents garbage collection and matches proven working pattern
      if (!this.remoteAudioElement) {
        this.remoteAudioElement = new Audio();
        this.remoteAudioElement.autoplay = true;
        this.remoteAudioElement.volume = 1.0;
        this.remoteAudioElement.muted = false;
        this.remoteAudioElement.style.display = 'none';
        document.body.appendChild(this.remoteAudioElement);
        console.log('✅ Audio element created (autoplay=true, attached to DOM)');
      }

      console.log('🔐 Requesting ephemeral token...');

      // Get OpenAI API key from Tauri settings
      let apiKey: string | undefined;
      try {
        // Check if Tauri is available (in desktop app)
        if (typeof window !== 'undefined' && '__TAURI__' in window) {
          const { invoke } = await import('@tauri-apps/api/core');
          const settings = await invoke<{ openaiApiKey: string }>('get_settings');
          apiKey = settings.openaiApiKey;
          console.log('✅ Retrieved API key from Tauri settings');
        }
      } catch (error) {
        console.warn('Failed to get settings from Tauri, will use server fallback:', error);
      }

      // Get ephemeral token from our server endpoint
      // Pass API key if we got it from Tauri, otherwise server will use env var
      const tokenResponse = await fetch('/api/realtime-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token endpoint error:', {
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          body: errorText
        });
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        throw new Error(errorData.error || 'Failed to obtain ephemeral token');
      }

      const tokenData = await tokenResponse.json();
      console.log('Token response:', { hasClientSecret: !!tokenData.client_secret, hasExpiresAt: !!tokenData.expires_at });

      const { client_secret } = tokenData;
      if (!client_secret) {
        console.error('Missing client_secret in response:', tokenData);
        throw new Error('Invalid token response - missing client_secret');
      }

      this.ephemeralToken = client_secret;

      console.log('✅ Ephemeral token obtained');

      // Get microphone access with echo cancellation enabled
      console.log('🎤 Requesting microphone access...');
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,  // CRITICAL for preventing echo
          noiseSuppression: true,
          autoGainControl: true,
          // Let browser negotiate sample rate with OpenAI (typically 48kHz for WebRTC Opus)
          // Forcing 24kHz can cause negotiation failures
          channelCount: 1,
        },
      });

      console.log('✅ Microphone access granted');

      // Create RTCPeerConnection
      this.peerConnection = new RTCPeerConnection();

      // Add local audio track to peer connection
      const audioTrack = this.stream.getAudioTracks()[0];
      this.peerConnection.addTrack(audioTrack, this.stream);

      console.log('✅ Audio track added to peer connection');

      // Create data channel for events (must be done before creating offer)
      this.dataChannel = this.peerConnection.createDataChannel('oai-events');
      this.setupDataChannel();

      console.log('✅ Data channel created');

      // Handle remote audio track from OpenAI
      this.peerConnection.ontrack = async (event) => {
        console.log('🔊 Received remote audio track from OpenAI');
        const remoteStream = event.streams[0];

        // Validate stream has audio tracks
        const audioTracks = remoteStream.getAudioTracks();
        if (audioTracks.length === 0) {
          console.error('❌ No audio tracks in remote stream');
          this.config.onError('No audio tracks in remote stream from OpenAI');
          return;
        }

        console.log(`✅ Remote stream has ${audioTracks.length} audio track(s)`);

        // Ensure track is enabled
        const audioTrack = audioTracks[0];
        if (!audioTrack.enabled) {
          audioTrack.enabled = true;
          console.log('✅ Audio track enabled');
        }

        // Setup HTMLAudioElement playback
        this.setupHTMLAudioPlayback(remoteStream);
      };

      // Monitor connection state
      this.peerConnection.onconnectionstatechange = () => {
        console.log('🔌 Connection state:', this.peerConnection?.connectionState);

        if (this.peerConnection?.connectionState === 'connected') {
          console.log('✅ WebRTC connection established');
        } else if (
          this.peerConnection?.connectionState === 'failed' ||
          this.peerConnection?.connectionState === 'disconnected'
        ) {
          this.config.onError('WebRTC connection failed or disconnected');
        }
      };

      // Create and set local offer
      console.log('📝 Creating offer...');
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      console.log('✅ Local description set');

      // Send offer to OpenAI and get answer
      console.log('🔄 Exchanging SDP with OpenAI...');
      const sdpResponse = await fetch(
        `https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.ephemeralToken}`,
            'Content-Type': 'application/sdp',
          },
          body: offer.sdp,
        }
      );

      if (!sdpResponse.ok) {
        throw new Error(`SDP exchange failed: ${sdpResponse.statusText}`);
      }

      const answerSdp = await sdpResponse.text();

      // Set remote description with the answer
      await this.peerConnection.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp,
      });

      console.log('✅ Remote description set');

      // Wait for connection to be established
      await this.waitForConnection();

      console.log('🔌 Connected to Realtime API via WebRTC');

      // Configure session with instructions
      this.sendSessionUpdate();
    } catch (error) {
      console.error('Failed to connect:', error);
      this.config.onError(
        error instanceof Error ? error.message : 'Failed to connect to Realtime API'
      );
      throw error;
    }
  }

  private setupDataChannel(): void {
    if (!this.dataChannel) return;

    this.dataChannel.onopen = () => {
      console.log('✅ Data channel opened');
    };

    this.dataChannel.onclose = () => {
      console.log('🔌 Data channel closed');
    };

    this.dataChannel.onerror = (error) => {
      console.error('Data channel error:', error);
      this.config.onError('Data channel error');
    };

    this.dataChannel.onmessage = (event) => {
      this.handleServerMessage(event.data);
    };
  }

  private async waitForConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.peerConnection) {
        reject(new Error('No peer connection'));
        return;
      }

      // Set timeout for connection
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 30000); // 30 second timeout

      const checkConnection = () => {
        if (!this.peerConnection) {
          clearTimeout(timeout);
          reject(new Error('Peer connection lost'));
          return;
        }

        const state = this.peerConnection.connectionState;

        if (state === 'connected') {
          clearTimeout(timeout);
          resolve();
        } else if (state === 'failed' || state === 'closed') {
          clearTimeout(timeout);
          reject(new Error(`Connection ${state}`));
        }
      };

      this.peerConnection.onconnectionstatechange = checkConnection;
      checkConnection(); // Check immediately in case already connected
    });
  }

  /**
   * Sets up HTMLAudioElement-based audio playback
   *
   * @param remoteStream - MediaStream from WebRTC peer connection
   */
  private setupHTMLAudioPlayback(remoteStream: MediaStream): void {
    console.log('🎵 Setting up HTMLAudioElement playback');

    // Create audio element if not already created
    if (!this.remoteAudioElement) {
      this.remoteAudioElement = new Audio();
      this.remoteAudioElement.autoplay = true;
      this.remoteAudioElement.volume = 1.0;
      this.remoteAudioElement.muted = false;
      this.remoteAudioElement.style.display = 'none';
      document.body.appendChild(this.remoteAudioElement);
      console.log('✅ Audio element created (autoplay=true, attached to DOM)');
    }

    // Set up playback lifecycle tracking
    this.remoteAudioElement.onplay = () => {
      console.log('🔊 Audio playback started');
      this.isPlayingAudio = true;
    };

    this.remoteAudioElement.onpause = () => {
      console.log('⏸️  Audio playback paused');
      this.isPlayingAudio = false;
    };

    this.remoteAudioElement.onended = () => {
      console.log('✅ Audio playback ended');
      this.isPlayingAudio = false;
    };

    this.remoteAudioElement.onerror = (error) => {
      console.error('❌ Audio playback error:', error);
      this.isPlayingAudio = false;
    };

    // Assign stream to audio element (autoplay already set)
    // This is the proven working pattern from all successful WebRTC examples
    this.remoteAudioElement.srcObject = remoteStream;

    // Explicitly call play() - WKWebView may ignore autoplay attribute for MediaStream
    this.remoteAudioElement.play().then(() => {
      console.log('✅ Audio playback started via explicit play() call');
    }).catch((error) => {
      console.error('❌ HTMLAudioElement.play() failed:', error);
      console.warn('⚠️  This confirms WKWebView audio limitation');
    });

    console.log('✅ Audio stream connected to audio element');

    // Optional: Diagnostic logging after a delay
    setTimeout(() => {
      if (this.remoteAudioElement && !this.remoteAudioElement.paused) {
        console.log('✅ Audio is playing successfully');
      } else if (this.remoteAudioElement?.paused) {
        console.warn('⚠️  Audio element paused - may need user interaction to start');
      }
    }, 1000);
  }

  private sendSessionUpdate() {
    const instructions = `You are Sentra, an expert software architect AI assistant. You're having a natural conversation about the "${this.config.projectName}" project.

Your role:
- You help users articulate their requirements and create technical specifications
- You DON'T write code or implement features yourself
- After gathering requirements, you'll hand off to a coding agent who will do the implementation

Your personality:
- Friendly, upbeat, and enthusiastic - you LOVE helping people build things!
- Warm and encouraging - make users feel excited about their ideas
- LISTEN MORE than you ask - absorb what the user tells you
- Only ask clarifying questions when something is genuinely unclear
- Keep responses SHORT - 1-2 sentences max
- Never repeat yourself or ramble
- Use a positive, energetic tone without being over-the-top

How to start:
- When the user first speaks, simply acknowledge and let them tell you what they want to build
- Say something brief like "Got it, tell me more" or "Sounds good, what else?"

Your conversation flow:
1. User explains features → acknowledge briefly and let them continue
2. If unclear → ask ONE specific question
3. When they seem done → ask "Anything else?" or "Is that everything?"
4. ONLY if they explicitly say "no" (in response to your question), "I'm done", "nothing else", "that's all", or "that's everything" → say EXACTLY: "Sounds good! I'll write up a spec and pass this to an agent to build it out."

CRITICAL RULES:
- NEVER trigger the handoff phrase unless the user explicitly confirms they're done
- DO NOT trigger on ambiguous phrases like "that's it" which could mean agreement, not completion
- If the user is still adding details, just acknowledge and keep listening
- Don't assume they're done - wait for them to tell you
- That exact handoff phrase triggers the spec creation - only use it when you're certain they're done

Keep every response under 10 words. This is a voice conversation, be brief!`;

    const projectContextAddition = this.config.projectContext
      ? `\n\n# Project Context\n${this.config.projectContext}`
      : '';

    // Validate and fallback voice selection
    let selectedVoice = this.config.voice || 'alloy';
    if (!isRealtimeVoice(selectedVoice)) {
      console.warn(`⚠️  Voice '${selectedVoice}' is not supported by Realtime API. Supported voices: ${REALTIME_VOICES.join(', ')}`);
      console.warn(`⚠️  Falling back to 'alloy' voice`);
      selectedVoice = 'alloy';
    }

    const sessionConfig = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: instructions + projectContextAddition,
        voice: selectedVoice,
        input_audio_transcription: {
          model: 'whisper-1',
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,  // OpenAI default
          prefix_padding_ms: 300,  // OpenAI default
          // Bug #4 Fix: Increase silence duration to allow for natural pauses
          // 500ms was too aggressive and cut off user mid-sentence
          silence_duration_ms: 1200,  // 1.2 seconds for natural speech pauses
        },
      },
    };

    console.log('Sending session.update with config:', JSON.stringify(sessionConfig, null, 2));
    this.send(sessionConfig);
  }

  private handleServerMessage(data: string) {
    try {
      const event = JSON.parse(data);
      console.log('← Server event:', event.type);

      switch (event.type) {
        case 'session.created':
          this.sessionId = event.session.id;
          console.log('✅ Session created:', this.sessionId);
          break;

        case 'response.created':
          // Bug #7 Fix: Mark that AI is starting a response
          this.isAIResponding = true;
          this.currentResponseId = event.response?.id || null;
          this.responseStartTime = Date.now();
          console.log('🤖 AI response started:', this.currentResponseId);
          break;

        case 'conversation.item.created':
          // Item added to conversation
          break;

        case 'output_audio_buffer.started':
          // Audio needs explicit .play() call to restart after being paused during user speech
          // Autoplay doesn't work when resuming after manual pause
          console.log('🎵 AI audio transmission started');
          if (this.remoteAudioElement) {
            this.remoteAudioElement.play().then(() => {
              console.log('✅ Audio playback started via explicit play() call');
            }).catch((error) => {
              console.error('❌ Failed to start audio playback:', error);
            });
          }
          break;

        case 'response.audio.delta':
          // With WebRTC, audio is streamed through the remote track automatically
          // NOTE: These delta events are NOT sent when using WebRTC transport
          // Audio playback is triggered by output_audio_buffer.started instead
          // We keep this handler for fallback/debugging purposes only
          if (event.delta) {
            const audioData = this.base64ToArrayBuffer(event.delta);
            this.config.onAudioPlay(audioData);
          }
          break;

        case 'response.audio.done':
          // Bug #5 Fix: Track when audio playback actually completes
          // Wait for the audio element to finish playing before resuming mic
          console.log('📡 Audio transmission complete from server');

          if (this.remoteAudioElement) {
            // Wait for audio to finish playing
            const waitForPlayback = () => {
              if (!this.remoteAudioElement) {
                console.log('⚠️  Audio element removed, resuming immediately');
                return;
              }

              // Check if audio is still playing
              if (!this.remoteAudioElement.paused && !this.remoteAudioElement.ended) {
                console.log('⏳ Waiting for audio playback to complete...');
                // Wait for 'ended' event
                this.remoteAudioElement.onended = () => {
                  console.log('✅ Audio playback completed');
                  this.isPlayingAudio = false;

                  // Bug #5 Fix: Add safety delay after playback before next input
                  setTimeout(() => {
                    console.log('🎤 Ready for next user input');
                    if (this.config.onAudioPlaybackComplete) {
                      this.config.onAudioPlaybackComplete();
                    }
                  }, 800); // 800ms safety delay
                };
              } else {
                console.log('✅ Audio already finished playing');
                this.isPlayingAudio = false;

                // Add safety delay even if already finished
                setTimeout(() => {
                  console.log('🎤 Ready for next user input');
                  if (this.config.onAudioPlaybackComplete) {
                    this.config.onAudioPlaybackComplete();
                  }
                }, 800);
              }
            };

            waitForPlayback();
          } else {
            console.log('⚠️  No audio element, resuming immediately');
            if (this.config.onAudioPlaybackComplete) {
              this.config.onAudioPlaybackComplete();
            }
          }
          break;

        case 'response.audio_transcript.delta':
          // Text transcript of what the assistant is saying
          if (event.delta) {
            console.log('📝 Transcript delta:', event.delta);
            this.config.onResponse(event.delta);
          }
          break;

        case 'response.audio_transcript.done':
          // Full transcript complete - check for handoff trigger
          if (event.transcript) {
            console.log('✅ Full transcript:', event.transcript);
            const lowerTranscript = event.transcript.toLowerCase();

            // Check for the handoff phrase
            if (
              lowerTranscript.includes('pass this to an agent') ||
              lowerTranscript.includes('hand this to an agent')
            ) {
              console.log('🤝 Handoff phrase detected - initiating agent creation');
              if (this.config.onConversationComplete) {
                setTimeout(() => {
                  this.config.onConversationComplete!();
                }, 1500); // Small delay to let audio finish
              }
            }
          }
          break;

        case 'response.done':
          // Response complete
          console.log('✅ Response complete');
          // Bug #7 Fix: Mark that AI response is no longer active
          this.isAIResponding = false;
          this.currentResponseId = null;
          this.responseStartTime = 0;
          // Parent will start recording when audio playback finishes
          break;

        case 'response.cancelled':
          // Bug #7 Fix: Mark that AI response was cancelled
          this.isAIResponding = false;
          this.currentResponseId = null;
          this.responseStartTime = 0;
          console.log('🛑 AI response was cancelled');
          break;

        case 'input_audio_buffer.speech_started':
          console.log('🎤 User started speaking');

          // Bug #2 Fix: Interrupt AI when user starts speaking
          // This prevents echo loops and allows natural conversation flow
          if (this.isPlayingAudio) {
            console.log('🛑 Interrupting AI response - user is speaking');

            // Pause audio playback immediately
            if (this.remoteAudioElement) {
              this.remoteAudioElement.pause();
              console.log('✅ Audio element paused');
            }

            this.isPlayingAudio = false;

            // Bug #7 Enhanced Fix: Only send response.cancel if AI response is truly active
            // Add timing check to avoid race condition where response.created arrived but
            // OpenAI server hasn't fully activated the response yet
            if (this.isAIResponding && this.currentResponseId) {
              const timeSinceResponseStart = Date.now() - this.responseStartTime;

              // Only cancel if response has been active for at least 100ms
              // This prevents race condition with response.created event
              if (timeSinceResponseStart >= 100) {
                console.log(`📤 Sending response.cancel for response ${this.currentResponseId} (active for ${timeSinceResponseStart}ms)`);
                this.send({
                  type: 'response.cancel'
                });
              } else {
                console.log(`⏳ Response too new (${timeSinceResponseStart}ms), skipping cancel - will stop naturally`);
              }
            } else {
              console.log('📢 User started speaking (no AI response to cancel)');
            }

            console.log('✅ User has the floor');
          }
          break;

        case 'input_audio_buffer.speech_stopped':
          console.log('🛑 User stopped speaking');
          break;

        case 'conversation.item.input_audio_transcription.completed':
          // User's speech transcribed
          if (event.transcript) {
            console.log('📝 User said:', event.transcript);
            this.config.onUserTranscript(event.transcript);
          }
          break;

        case 'error':
          // Bug #7 Enhanced Fix: Handle response_cancel_not_active gracefully
          const errorCode = event.error?.code;
          const errorMessage = event.error?.message || event.message || JSON.stringify(event);

          if (errorCode === 'response_cancel_not_active') {
            // This is a benign race condition error that occurs when:
            // 1. User interrupts AI very quickly after response.created
            // 2. OpenAI server hasn't fully activated the response yet
            // 3. Our cancel request arrives before the response is cancellable
            // The response will stop naturally, so we can safely ignore this.
            // DO NOT log to console - it confuses users and is not actionable.
            // Just silently ignore - the timing check above (100ms threshold) prevents most of these.
            return;
          } else {
            // Actual error - log and propagate
            console.error('❌ Server error:', JSON.stringify(event, null, 2));
            this.config.onError(errorMessage);
          }
          break;
      }
    } catch (error) {
      console.error('Error parsing server message:', error);
    }
  }

  private send(data: any) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(data));
    } else {
      console.warn('Data channel not ready, cannot send:', data.type);
    }
  }

  async startRecording(): Promise<void> {
    // With WebRTC, audio capture is handled automatically via the peer connection
    // The microphone track is already added to the peer connection in connect()
    // We just need to mark that recording is active
    this.isRecording = true;
    console.log('🎙️ Recording started (WebRTC handles audio capture automatically)');
  }

  stopRecording(): void {
    this.isRecording = false;
    console.log('🛑 Recording stopped');
  }

  pauseRecording(): void {
    // Bug #3 Fix: Actually disable the microphone hardware, not just a boolean flag
    if (this.stream) {
      const audioTrack = this.stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = false;
        console.log('⏸️  Microphone disabled (hardware muted)');
        this.isRecording = false;
      } else {
        console.log('⏸️  No audio track found to pause');
      }
    } else {
      console.log('⏸️  Pause requested but no stream available');
    }
  }

  resumeRecording(): void {
    // Bug #3 Fix: Actually enable the microphone hardware, not just a boolean flag
    if (this.stream) {
      const audioTrack = this.stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = true;
        console.log('▶️  Microphone enabled (hardware unmuted)');
        this.isRecording = true;
      } else {
        console.log('▶️  No audio track found to resume');
      }
    } else {
      console.log('▶️  Resume requested but no stream available');
    }
  }

  async getGreeting(userName?: string): Promise<void> {
    // Determine time of day for greeting
    const hour = new Date().getHours();
    let timeOfDay = 'Morning';
    if (hour >= 12 && hour < 17) {
      timeOfDay = 'Afternoon';
    } else if (hour >= 17) {
      timeOfDay = 'Evening';
    }

    // Build the greeting instruction with context
    const nameGreeting = userName ? ` ${userName}` : '';
    const projectContext = this.config.projectName ? ` with ${this.config.projectName}` : '';

    const instruction = `Say a natural, friendly greeting using this as a reference but feel free to vary it: "Good ${timeOfDay}${nameGreeting}, how can I help you${projectContext} today?" Keep it conversational and brief (under 15 words). You can change the wording to sound more natural and authentic - don't repeat the exact same greeting every time.`;

    // Send a message to trigger the greeting
    this.send({
      type: 'response.create',
      response: {
        modalities: ['text', 'audio'],
        instructions: instruction,
      },
    });
  }

  cleanup(): void {
    this.stopRecording();

    // Bug #7 Fix: Reset response tracking state
    this.isAIResponding = false;
    this.currentResponseId = null;
    this.responseStartTime = 0;

    // Bug #6 Fix: Clean up remote audio element to prevent memory leaks
    if (this.remoteAudioElement) {
      try {
        console.log('🧹 Cleaning up audio element');
        // Pause playback
        this.remoteAudioElement.pause();

        // Remove all event listeners by setting to null
        this.remoteAudioElement.onplay = null;
        this.remoteAudioElement.onpause = null;
        this.remoteAudioElement.onended = null;
        this.remoteAudioElement.onerror = null;

        // Clear the source
        this.remoteAudioElement.srcObject = null;

        // Remove from DOM if attached
        if (this.remoteAudioElement.parentNode) {
          this.remoteAudioElement.parentNode.removeChild(this.remoteAudioElement);
          console.log('✅ Audio element removed from DOM');
        }

        this.remoteAudioElement = null;
        this.isPlayingAudio = false;
        console.log('✅ Audio element cleaned up');
      } catch (error) {
        console.error('Error cleaning up audio element:', error);
      }
    }

    // Close data channel
    if (this.dataChannel) {
      try {
        if (this.dataChannel.readyState === 'open') {
          this.dataChannel.close();
        }
      } catch (error) {
        // Silently ignore errors during cleanup
      } finally {
        this.dataChannel = null;
      }
    }

    // Close peer connection
    if (this.peerConnection) {
      try {
        this.peerConnection.close();
      } catch (error) {
        // Silently ignore errors during cleanup
      } finally {
        this.peerConnection = null;
      }
    }

    // Stop media stream
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    console.log('🧹 Cleanup complete');
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
