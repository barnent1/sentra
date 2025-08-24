import { TTSConfig, VoicePersona, NotificationMessage } from '@/types';

interface ElevenLabsConfig {
  apiKey: string;
  baseUrl: string;
  defaultVoiceId: string;
}

class TTSService {
  private config: ElevenLabsConfig;
  private audioContext: AudioContext | null = null;
  private isSupported: boolean;
  private deviceInfo: { type: 'desktop' | 'mobile' | 'tablet'; os: string };

  constructor() {
    this.config = {
      apiKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '',
      baseUrl: 'https://api.elevenlabs.io/v1',
      defaultVoiceId: 'ErXwobaYiN019PkySvjV', // Professional female voice
    };

    this.isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    this.deviceInfo = this.detectDevice();
    
    if (this.isSupported && typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private detectDevice(): { type: 'desktop' | 'mobile' | 'tablet'; os: string } {
    if (typeof window === 'undefined') {
      return { type: 'desktop', os: 'unknown' };
    }

    const userAgent = navigator.userAgent;
    
    // Detect device type
    let type: 'desktop' | 'mobile' | 'tablet' = 'desktop';
    if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
      if (/iPad/i.test(userAgent)) {
        type = 'tablet';
      } else {
        type = 'mobile';
      }
    }

    // Detect OS
    let os = 'unknown';
    if (/Windows/i.test(userAgent)) os = 'windows';
    else if (/Mac/i.test(userAgent)) os = 'macos';
    else if (/Android/i.test(userAgent)) os = 'android';
    else if (/iPhone|iPad/i.test(userAgent)) os = 'ios';
    else if (/Linux/i.test(userAgent)) os = 'linux';

    return { type, os };
  }

  async synthesizeText(
    text: string, 
    persona: VoicePersona,
    config: TTSConfig
  ): Promise<string | null> {
    if (!this.config.apiKey) {
      console.warn('ElevenLabs API key not configured, falling back to browser TTS');
      return this.fallbackTTS(text, config);
    }

    try {
      const voiceId = this.getVoiceIdForPersona(persona);
      const response = await fetch(`${this.config.baseUrl}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.config.apiKey,
        },
        body: JSON.stringify({
          text: this.preprocessText(text, persona),
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
            style: this.getStyleForPersona(persona),
            use_speaker_boost: true,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.statusText}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      return audioUrl;
    } catch (error) {
      console.error('ElevenLabs TTS failed:', error);
      return this.fallbackTTS(text, config);
    }
  }

  private async fallbackTTS(text: string, config: TTSConfig): Promise<string | null> {
    if (!this.isSupported) return null;

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = config.speed;
      utterance.pitch = config.pitch;
      utterance.volume = config.volume;
      
      // Try to find a suitable voice
      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.lang.startsWith('en') && 
        (voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('woman'))
      ) || voices[0];
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => resolve(null);
      utterance.onerror = () => resolve(null);
      
      speechSynthesis.speak(utterance);
    });
  }

  private getVoiceIdForPersona(persona: VoicePersona): string {
    const voiceMap: Record<string, string> = {
      'professional': 'ErXwobaYiN019PkySvjV', // Professional female
      'conversational': 'AZnzlk1XvdvUeBnXmlld', // Friendly female
      'technical': '29vD33N1CtxCmqQRPOHJ', // Clear male
      'creative': 'ThT5KcBeYPX3keUQqHPh', // Expressive female
    };
    
    return voiceMap[persona.personality] || this.config.defaultVoiceId;
  }

  private getStyleForPersona(persona: VoicePersona): number {
    const styleMap: Record<string, number> = {
      'professional': 0.3,
      'conversational': 0.7,
      'technical': 0.2,
      'creative': 0.8,
    };
    
    return styleMap[persona.personality] || 0.5;
  }

  private preprocessText(text: string, persona: VoicePersona): string {
    // Add persona-specific modifications
    switch (persona.communicationStyle) {
      case 'direct':
        return text;
      case 'collaborative':
        return `Just wanted to let you know that ${text.toLowerCase()}`;
      case 'analytical':
        return `Based on current data, ${text.toLowerCase()}`;
      case 'supportive':
        return `Great news! ${text}`;
      default:
        return text;
    }
  }

  async speakNotification(
    notification: NotificationMessage,
    ttsConfig: TTSConfig
  ): Promise<void> {
    if (!ttsConfig.enabled || !this.shouldPlayNotification(notification, ttsConfig)) {
      return;
    }

    const text = this.formatNotificationText(notification);
    const audioUrl = await this.synthesizeText(text, ttsConfig.persona, ttsConfig);
    
    if (audioUrl) {
      await this.playAudio(audioUrl, ttsConfig);
      URL.revokeObjectURL(audioUrl);
    }
  }

  private shouldPlayNotification(
    notification: NotificationMessage,
    ttsConfig: TTSConfig
  ): boolean {
    // Check device routing
    if (!ttsConfig.deviceRouting[this.deviceInfo.type]) {
      return false;
    }

    // Check priority filtering
    const priorityMap = { low: 1, medium: 2, high: 3, critical: 4 };
    const notificationPriority = priorityMap[notification.priority];
    const minPriority = ttsConfig.contextFiltering.priority === 'all' ? 1 :
                       ttsConfig.contextFiltering.priority === 'high' ? 3 :
                       ttsConfig.contextFiltering.priority === 'critical' ? 4 : 2;

    if (notificationPriority < minPriority) {
      return false;
    }

    // Check context modes
    if (ttsConfig.contextFiltering.focusMode && notification.priority !== 'critical') {
      return false;
    }

    if (ttsConfig.contextFiltering.meetingMode && notification.type !== 'error') {
      return false;
    }

    if (ttsConfig.contextFiltering.travelMode && notification.priority === 'low') {
      return false;
    }

    return true;
  }

  private formatNotificationText(notification: NotificationMessage): string {
    const timeAgo = this.getRelativeTime(notification.timestamp);
    
    switch (notification.type) {
      case 'success':
        return `Good news! ${notification.message}`;
      case 'error':
        return `Alert: ${notification.message}`;
      case 'warning':
        return `Warning: ${notification.message}`;
      default:
        return notification.message;
    }
  }

  private getRelativeTime(timestamp: string): string {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }

  private async playAudio(audioUrl: string, config: TTSConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl);
      audio.volume = config.volume;
      audio.onended = () => resolve();
      audio.onerror = (e) => reject(e);
      audio.play().catch(reject);
    });
  }

  async testVoice(persona: VoicePersona, config: TTSConfig): Promise<void> {
    const testText = this.getTestTextForPersona(persona);
    const audioUrl = await this.synthesizeText(testText, persona, config);
    
    if (audioUrl) {
      await this.playAudio(audioUrl, config);
      URL.revokeObjectURL(audioUrl);
    }
  }

  private getTestTextForPersona(persona: VoicePersona): string {
    const testTexts: Record<string, string> = {
      'professional': 'Hello, I am your professional assistant. I will keep you updated on project progress.',
      'conversational': 'Hey there! I am here to help you stay connected with your team.',
      'technical': 'System status update: All agents are operational and running efficiently.',
      'creative': 'Exciting news! Your creative projects are making great progress.',
    };
    
    return testTexts[persona.personality] || testTexts.professional;
  }

  getDeviceInfo() {
    return this.deviceInfo;
  }

  isAudioSupported(): boolean {
    return this.isSupported;
  }
}

export const ttsService = new TTSService();