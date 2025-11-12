/**
 * OpenAI Voice conversation using standard HTTP APIs
 * Uses: Whisper (STT) + GPT-4 + TTS
 * This approach works in browsers and is simpler than Realtime API
 */

export interface VoiceConfig {
  apiKey: string;
  projectName: string;
  projectContext?: string;
  onResponse: (text: string, audio: ArrayBuffer) => void;
  onError: (error: string) => void;
}

export class VoiceConversation {
  private config: VoiceConfig;
  private conversationHistory: Array<{ role: string; content: string }> = [];
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private silenceTimer: NodeJS.Timeout | null = null;
  private vadCheckInterval: NodeJS.Timeout | null = null;
  private stream: MediaStream | null = null;

  constructor(config: VoiceConfig) {
    this.config = config;

    // Build system prompt with project context
    let systemContent = `You are Sentra, an expert software architect AI assistant. You're having a natural conversation about the "${config.projectName}" project.

Your personality:
- Friendly, experienced colleague - talk naturally and conversationally
- You're named Sentra (the AI architect)
- LISTEN MORE than you ask - absorb what the user tells you
- When the user is clearly explaining their requirements, acknowledge and absorb the information
- Only ask clarifying questions when something is genuinely unclear or ambiguous
- Use casual, natural language
- Keep responses SHORT - this is voice, not text

Your approach:
1. Greet the user naturally and introduce yourself as Sentra
2. When the user explains features, LISTEN and acknowledge what they said
3. If they're on a roll explaining things, let them continue - don't interrupt with questions
4. Only ask questions when there's a genuine gap in understanding
5. Summarize what you've heard periodically to confirm understanding
6. If the user asks about project status, use the project context below to answer

Keep responses VERY brief and conversational. You're having a voice chat, not writing documentation. Aim for 1-2 sentences max per response.`;

    // Add project context if available
    if (config.projectContext && config.projectContext.trim().length > 0) {
      systemContent += `\n\n# Project Context\n${config.projectContext}`;
    }

    // Initialize with Sentra's personality
    this.conversationHistory.push({
      role: 'system',
      content: systemContent,
    });
  }

  async startRecording(): Promise<void> {
    try {
      // Reuse existing stream or create new one
      if (!this.stream) {
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        // Handle track ending unexpectedly
        this.stream.getAudioTracks().forEach(track => {
          track.onended = () => {
            console.error('⚠️ Microphone track ended unexpectedly');
            this.stopVAD();
            this.isRecording = false;
            this.stream = null;
            this.config.onError('Microphone access lost. Please try again.');
          };
        });

        // Set up audio context and analyser for VAD (only once)
        if (!this.audioContext) {
          this.audioContext = new AudioContext();
        }
        const source = this.audioContext.createMediaStreamSource(this.stream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        source.connect(this.analyser);
      }

      this.mediaRecorder = new MediaRecorder(this.stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        // Only process if we have audio data
        if (this.audioChunks.length === 0) {
          console.warn('⚠️ No audio data captured, skipping transcription');
          return;
        }

        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });

        // Check if audio blob has data
        if (audioBlob.size === 0) {
          console.warn('⚠️ Audio blob is empty, skipping transcription');
          return;
        }

        await this.processUserSpeech(audioBlob);
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      console.log('🎙️ Recording started with auto-silence detection');

      // Start monitoring for silence
      this.startVAD();
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.config.onError('Failed to access microphone');
    }
  }

  private startVAD(): void {
    if (!this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let consecutiveSilentFrames = 0;
    let hasDetectedSpeech = false;

    // Check audio levels every 100ms
    this.vadCheckInterval = setInterval(() => {
      if (!this.analyser || !this.isRecording) {
        this.stopVAD();
        return;
      }

      this.analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((acc, val) => acc + val, 0) / bufferLength;

      // Speech threshold - adjust based on testing
      const SPEECH_THRESHOLD = 30;
      const SILENCE_THRESHOLD = 20;

      if (average > SPEECH_THRESHOLD) {
        // Detected speech
        hasDetectedSpeech = true;
        consecutiveSilentFrames = 0;

        // Clear any pending silence timer
        if (this.silenceTimer) {
          clearTimeout(this.silenceTimer);
          this.silenceTimer = null;
        }
      } else if (average < SILENCE_THRESHOLD && hasDetectedSpeech) {
        // Silence after speech
        consecutiveSilentFrames++;

        // If we've had 15 consecutive silent frames (~1.5 seconds), stop recording
        if (consecutiveSilentFrames >= 15 && !this.silenceTimer) {
          console.log('🔇 Silence detected, stopping in 0.5s...');
          this.silenceTimer = setTimeout(() => {
            console.log('⏱️ Auto-stopping recording');
            this.stopRecording();
          }, 500);
        }
      }
    }, 100);
  }

  private stopVAD(): void {
    if (this.vadCheckInterval) {
      clearInterval(this.vadCheckInterval);
      this.vadCheckInterval = null;
    }
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.stopVAD();
      this.isRecording = false;

      this.mediaRecorder.stop();
      console.log('🛑 Recording stopped');

      // DON'T stop the tracks - we'll reuse them for the next recording
      // This prevents the "MediaStreamTrack ended due to capture failure" error
    }
  }

  private async processUserSpeech(audioBlob: Blob): Promise<void> {
    try {
      // Step 1: Transcribe speech to text using Whisper
      console.log('🎧 Transcribing audio...');
      let transcript: string;
      try {
        transcript = await this.transcribeAudio(audioBlob);
        console.log('📝 Transcript:', transcript);
      } catch (error) {
        console.error('Transcription error:', error);
        this.config.onError(`Failed to transcribe audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return;
      }

      if (!transcript || transcript.trim().length === 0) {
        console.log('Empty transcript, skipping');
        return;
      }

      // Add user message to history
      this.conversationHistory.push({
        role: 'user',
        content: transcript,
      });

      // Step 2: Get GPT-4 response
      console.log('🤔 Getting AI response...');
      let aiResponse: string;
      try {
        aiResponse = await this.getAIResponse();
        console.log('💬 AI Response:', aiResponse);
      } catch (error) {
        console.error('AI response error:', error);
        this.config.onError(`Failed to get AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return;
      }

      // Add assistant message to history
      this.conversationHistory.push({
        role: 'assistant',
        content: aiResponse,
      });

      // Step 3: Convert response to speech
      console.log('🔊 Converting to speech...');
      let audioData: ArrayBuffer;
      try {
        audioData = await this.textToSpeech(aiResponse);
      } catch (error) {
        console.error('TTS error:', error);
        this.config.onError(`Failed to convert to speech: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return;
      }

      // Notify with both text and audio
      this.config.onResponse(aiResponse, audioData);
    } catch (error) {
      console.error('Error processing speech:', error);
      this.config.onError('Failed to process speech');
    }
  }

  private async transcribeAudio(audioBlob: Blob): Promise<string> {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.status}`);
    }

    const data = await response.json();
    return data.text;
  }

  private async getAIResponse(): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: this.conversationHistory,
        temperature: 0.8,
        max_tokens: 150, // Reduced for faster responses in voice chat
      }),
    });

    if (!response.ok) {
      throw new Error(`AI response failed: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async textToSpeech(text: string): Promise<ArrayBuffer> {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: 'tts-1', // Use faster TTS model instead of tts-1-hd
        voice: 'nova',
        input: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`TTS failed: ${response.status}`);
    }

    return response.arrayBuffer();
  }

  // Get initial greeting from Sentra
  async getGreeting(): Promise<{ text: string; audio: ArrayBuffer }> {
    try {
      // Ask Sentra to introduce itself
      this.conversationHistory.push({
        role: 'user',
        content: 'Please introduce yourself briefly and ask what I\'d like to work on.',
      });

      const greeting = await this.getAIResponse();

      this.conversationHistory.push({
        role: 'assistant',
        content: greeting,
      });

      const audio = await this.textToSpeech(greeting);

      return { text: greeting, audio };
    } catch (error) {
      console.error('Failed to get greeting:', error);
      throw error;
    }
  }

  getConversationHistory() {
    return this.conversationHistory.filter((m) => m.role !== 'system');
  }

  cleanup(): void {
    this.stopVAD();
    this.stopRecording();

    // Stop all stream tracks when conversation ends
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
