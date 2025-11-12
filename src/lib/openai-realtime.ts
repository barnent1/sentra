/**
 * OpenAI Realtime API client using WebSocket proxy
 * This provides MUCH faster voice conversations with ~1-2 second latency
 */

export interface RealtimeConfig {
  projectName: string;
  projectContext?: string;
  onResponse: (text: string) => void;
  onUserTranscript: (text: string) => void;
  onError: (error: string) => void;
  onAudioPlay: (audio: ArrayBuffer) => void;
  onConversationComplete?: () => void;
}

export class RealtimeConversation {
  private config: RealtimeConfig;
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private isRecording = false;
  private sessionId: string | null = null;
  private isSpeaking = false;

  constructor(config: RealtimeConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Connect to our local WebSocket proxy
      this.ws = new WebSocket('ws://localhost:9001');

      this.ws.onopen = () => {
        console.log('🔌 Connected to Realtime API');

        // Configure session with instructions
        this.sendSessionUpdate();
        resolve();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(new Error('Failed to connect to Realtime API'));
      };

      this.ws.onmessage = (event) => {
        this.handleServerMessage(event.data);
      };

      this.ws.onclose = () => {
        console.log('🔌 Disconnected from Realtime API');
      };
    });
  }

  private sendSessionUpdate() {
    const instructions = `You are Sentra, an expert software architect AI assistant. You're having a natural conversation about the "${this.config.projectName}" project.

Your role:
- You help users articulate their requirements and create technical specifications
- You DON'T write code or implement features yourself
- After gathering requirements, you'll hand off to a coding agent who will do the implementation

Your personality:
- Friendly, experienced colleague - talk naturally and conversationally
- LISTEN MORE than you ask - absorb what the user tells you
- Only ask clarifying questions when something is genuinely unclear
- Keep responses SHORT - 1-2 sentences max
- Never repeat yourself or ramble

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

    this.send({
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: instructions + projectContextAddition,
        voice: 'alloy',
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1',
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.6,  // Increased from 0.5 - less sensitive to prevent false positives
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
        },
      },
    });
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

        case 'conversation.item.created':
          // Item added to conversation
          break;

        case 'response.audio.delta':
          // Streaming audio from the assistant
          if (event.delta) {
            // Pause recording while Sentra is speaking to prevent echo
            if (this.isRecording && !this.isSpeaking) {
              console.log('🔇 Pausing recording - Sentra is speaking');
              this.isSpeaking = true;
              this.pauseRecording();
            }

            const audioData = this.base64ToArrayBuffer(event.delta);
            this.config.onAudioPlay(audioData);
          }
          break;

        case 'response.audio.done':
          // Audio playback complete - resume recording
          if (this.isSpeaking) {
            console.log('🎤 Resuming recording - Sentra finished speaking');
            this.isSpeaking = false;
            // Longer delay to ensure audio finishes playing and prevent echo
            setTimeout(() => {
              this.resumeRecording();
            }, 1500);  // Increased from 1000ms to 1500ms
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

          // Ensure recording is resumed if it was paused
          if (this.isSpeaking) {
            this.isSpeaking = false;
            setTimeout(() => {
              this.resumeRecording();
            }, 1500);  // Increased from 1000ms to 1500ms
          }
          break;

        case 'input_audio_buffer.speech_started':
          console.log('🎤 User started speaking');
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
          console.error('❌ Server error:', event.error);
          this.config.onError(event.error.message || 'Unknown error');
          break;
      }
    } catch (error) {
      console.error('Error parsing server message:', error);
    }
  }

  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  async startRecording(): Promise<void> {
    try {
      // Get microphone access
      if (!this.stream) {
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 24000, // Realtime API expects 24kHz
            channelCount: 1,
          },
        });
      }

      this.audioContext = new AudioContext({ sampleRate: 24000 });
      const source = this.audioContext.createMediaStreamSource(this.stream);

      // Use ScriptProcessorNode to capture raw PCM data
      const processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (event) => {
        if (!this.isRecording) return;

        const inputData = event.inputBuffer.getChannelData(0);

        // Convert Float32Array to Int16Array (PCM16)
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        // Send audio to Realtime API
        const base64Audio = this.arrayBufferToBase64(pcm16.buffer);
        this.send({
          type: 'input_audio_buffer.append',
          audio: base64Audio,
        });
      };

      source.connect(processor);
      processor.connect(this.audioContext.destination);

      this.isRecording = true;
      console.log('🎙️ Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.config.onError('Failed to access microphone');
    }
  }

  stopRecording(): void {
    this.isRecording = false;
    console.log('🛑 Recording stopped');
  }

  pauseRecording(): void {
    if (this.isRecording) {
      console.log('⏸️  Pausing recording (was recording)');
      this.isRecording = false;
    } else {
      console.log('⏸️  Pause requested but not recording');
    }
  }

  resumeRecording(): void {
    if (!this.isRecording && this.audioContext && this.stream) {
      console.log('▶️  Resuming recording');
      this.isRecording = true;
    } else {
      console.log('▶️  Resume requested but already recording or missing context', {
        isRecording: this.isRecording,
        hasContext: !!this.audioContext,
        hasStream: !!this.stream
      });
    }
  }

  async getGreeting(): Promise<void> {
    // Send a message to trigger the greeting
    this.send({
      type: 'response.create',
      response: {
        modalities: ['text', 'audio'],
        instructions: 'Say a brief, friendly greeting like "Hi there! What can I help you with today?" Keep it under 10 words.',
      },
    });
  }

  cleanup(): void {
    this.stopRecording();

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
