'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Mic, MessageSquare, Keyboard } from 'lucide-react';
import { getSettings, chatWithArchitect, getProjectContext, type ConversationMessage } from '@/lib/tauri';
import { RealtimeConversation } from '@/lib/openai-realtime';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ArchitectChatProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  projectPath?: string;
}

export function ArchitectChat({ isOpen, onClose, projectName, projectPath }: ArchitectChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiKeysConfigured, setApiKeysConfigured] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [textMode, setTextMode] = useState(false);
  const [currentInput, setCurrentInput] = useState('');

  const voiceConversationRef = useRef<RealtimeConversation | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const conversationTextRef = useRef<string>('');

  useEffect(() => {
    if (isOpen) {
      checkApiKeys();
      setMessages([]);
      conversationTextRef.current = '';
      setTextMode(false);
      startVoiceMode();
    } else {
      cleanupVoiceMode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, projectName]);

  useEffect(() => {
    return () => {
      cleanupVoiceMode();
    };
  }, []);

  const checkApiKeys = async () => {
    try {
      const settings = await getSettings();
      const hasKeys = settings.openaiApiKey && settings.anthropicApiKey;
      setApiKeysConfigured(!!hasKeys);
    } catch (error) {
      console.error('Failed to check API keys:', error);
      setApiKeysConfigured(false);
    }
  };

  const startVoiceMode = async () => {
    try {
      const settings = await getSettings();
      if (!settings.openaiApiKey) {
        console.log('OpenAI API key not configured');
        return;
      }

      console.log('🎙️ Starting Realtime voice mode for:', projectName);

      // Initialize audio context for playback
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });

      // Get project context if path is available
      let projectContext = '';
      if (projectPath) {
        try {
          projectContext = await getProjectContext(projectPath);
          console.log('📚 Loaded project context');
        } catch (error) {
          console.error('Failed to load project context:', error);
        }
      }

      // Create Realtime conversation
      const conversation = new RealtimeConversation({
        projectName,
        projectContext,
        onUserTranscript: (text) => {
          console.log('📝 User transcript received:', text);
          // Add user message to ref
          conversationTextRef.current += `User: ${text}\n\n`;
          // Add to messages state for UI
          setMessages((prev) => [...prev, { role: 'user', content: text, timestamp: new Date() }]);
        },
        onResponse: (text) => {
          // Add AI response to messages (text transcript)
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'assistant') {
              // Append to existing message
              conversationTextRef.current += text;
              return [
                ...prev.slice(0, -1),
                { ...last, content: last.content + text },
              ];
            } else {
              // New message - add prefix
              conversationTextRef.current += `Sentra: ${text}`;
              return [...prev, { role: 'assistant', content: text, timestamp: new Date() }];
            }
          });
        },
        onAudioPlay: (audioData) => {
          // Queue audio for playback
          console.log('🔊 Audio chunk received, queue length:', audioQueueRef.current.length);
          audioQueueRef.current.push(audioData);
          if (!isPlayingRef.current) {
            console.log('🎵 Starting audio playback');
            playNextAudio();
          }
        },
        onError: (error) => {
          console.error('Voice error:', error);
          setErrorMessage(error);
          setIsProcessing(false);
          setIsListening(false);
        },
        onConversationComplete: async () => {
          // Handoff detected - create spec and spawn agent
          console.log('🤝 Creating spec and spawning agent...');
          await handleConversationHandoff();
        },
      });

      voiceConversationRef.current = conversation;

      // Connect to WebSocket proxy
      setIsProcessing(true);
      await conversation.connect();

      // Get greeting from Sentra FIRST
      await conversation.getGreeting();

      // Wait for greeting audio to finish playing (4 second delay to prevent echo)
      await new Promise(resolve => setTimeout(resolve, 4000));

      // Now start recording - the RealtimeConversation class will automatically:
      // - Pause recording when Sentra speaks (to prevent echo)
      // - Resume recording after she finishes (with 1.5 second buffer)
      // - Use VAD (Voice Activity Detection) to detect when you're speaking
      setIsListening(true);
      await conversation.startRecording();

      setIsProcessing(false);
    } catch (error) {
      console.error('Failed to start voice mode:', error);
      setErrorMessage('Failed to start voice conversation. Check that the proxy is running.');
      setIsProcessing(false);
    }
  };

  const playNextAudio = async () => {
    console.log('🎵 playNextAudio called, queue length:', audioQueueRef.current.length);

    if (!audioContextRef.current || audioQueueRef.current.length === 0) {
      console.log('🔇 Stopping playback - no context or empty queue');
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;
    const audioData = audioQueueRef.current.shift()!;
    console.log('🎵 Playing audio chunk, size:', audioData.byteLength);

    try {
      // Convert PCM16 to AudioBuffer
      const pcm16 = new Int16Array(audioData);
      const floatData = new Float32Array(pcm16.length);

      // Convert Int16 to Float32
      for (let i = 0; i < pcm16.length; i++) {
        floatData[i] = pcm16[i] / (pcm16[i] < 0 ? 0x8000 : 0x7fff);
      }

      const audioBuffer = audioContextRef.current.createBuffer(1, floatData.length, 24000);
      audioBuffer.getChannelData(0).set(floatData);

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);

      source.onended = () => {
        console.log('✅ Audio chunk finished');
        // Play next audio chunk immediately
        playNextAudio();
      };

      // Start immediately without delay
      console.log('▶️ Starting audio source');
      source.start(0);
    } catch (error) {
      console.error('❌ Failed to play audio:', error);
      isPlayingRef.current = false;
      playNextAudio(); // Try next chunk
    }
  };

  const cleanupVoiceMode = () => {
    if (voiceConversationRef.current) {
      voiceConversationRef.current.cleanup();
      voiceConversationRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsListening(false);
    setIsProcessing(false);
  };

  const toggleTextMode = () => {
    if (!textMode) {
      // Switching to text mode - clean up voice
      cleanupVoiceMode();
    } else {
      // Switching back to voice mode
      startVoiceMode();
    }
    setTextMode(!textMode);
  };

  const handleSendText = async () => {
    if (!currentInput.trim() || !apiKeysConfigured) return;

    const userMessage: Message = {
      role: 'user',
      content: currentInput,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setCurrentInput('');
    setIsProcessing(true);

    try {
      const settings = await getSettings();
      const conversationHistory: ConversationMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      conversationHistory.push({ role: 'user', content: userMessage.content });

      const response = await chatWithArchitect(
        projectName,
        userMessage.content,
        conversationHistory,
        settings.anthropicApiKey
      );

      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      setErrorMessage('Failed to get response. Please check your API key.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConversationHandoff = async () => {
    console.log('🤝 handleConversationHandoff called');

    const conversationText = conversationTextRef.current.trim();
    console.log('📝 Conversation text length:', conversationText.length);

    if (!conversationText) {
      console.error('No conversation to hand off');
      setErrorMessage('No conversation to hand off');
      return;
    }

    try {
      console.log('📝 Getting settings...');
      const settings = await getSettings();

      console.log('📝 Creating spec from conversation...');
      const prompt = `Based on this conversation about the "${projectName}" project, create a detailed specification:

Conversation:
${conversationText}

Please provide a technical specification summarizing the requirements and implementation approach.`;

      console.log('🤖 Calling Anthropic to create spec...');
      const spec = await chatWithArchitect(projectName, prompt, [], settings.anthropicApiKey);

      console.log('✅ Spec created');
      console.log('Spec:', spec);

      // Save the spec using new versioning system
      if (projectPath) {
        console.log('💾 Saving spec...');
        const { saveSpec } = await import('@/lib/tauri');
        const specInfo = await saveSpec(projectName, projectPath, spec);
        console.log(`✅ Spec saved: ${specInfo.title} (v${specInfo.version})`);
      }

      // Clean up voice mode first
      console.log('🧹 Cleaning up voice conversation...');
      cleanupVoiceMode();

      // Small delay to ensure cleanup completes
      await new Promise(resolve => setTimeout(resolve, 500));

      // Close the voice dialog
      console.log('🚪 Closing voice dialog...');
      onClose();
      console.log('✅ Voice dialog closed');
    } catch (error) {
      console.error('❌ Failed to create spec and spawn agent:', error);
      setErrorMessage(`Failed to complete handoff: ${error}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-violet-500/20 rounded-lg w-full max-w-3xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            {textMode ? (
              <MessageSquare className="w-6 h-6 text-violet-400" />
            ) : (
              <Mic className="w-6 h-6 text-violet-400" />
            )}
            <div>
              <h2 className="text-xl font-semibold text-white">Sentra</h2>
              <p className="text-sm text-slate-400">{projectName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTextMode}
              className="text-slate-400 hover:text-white transition-colors p-2"
              title={textMode ? 'Switch to voice mode' : 'Switch to text mode'}
            >
              {textMode ? <Mic className="w-5 h-5" /> : <Keyboard className="w-5 h-5" />}
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {textMode ? (
            /* Text Mode - Show Chat History */
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-violet-500/20 border border-violet-500/30 text-white'
                        : 'bg-slate-800 border border-slate-700 text-slate-200'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-violet-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-violet-400 rounded-full animate-pulse delay-75"></div>
                      <div className="w-2 h-2 bg-violet-400 rounded-full animate-pulse delay-150"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Voice Mode - Show Simple Status */
            <div className="h-full flex flex-col items-center justify-center">
              {!apiKeysConfigured ? (
                <div className="text-center">
                  <div className="text-slate-400 text-lg mb-2">API Keys Not Configured</div>
                  <p className="text-slate-500 text-sm">
                    Please configure your OpenAI and Anthropic API keys in Settings first.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-8">
                    {isListening && (
                      <div className="relative">
                        <div className="w-32 h-32 rounded-full bg-green-500/20 border-4 border-green-500/50 flex items-center justify-center">
                          <Mic className="w-16 h-16 text-green-400" />
                        </div>
                        <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping"></div>
                      </div>
                    )}
                    {isProcessing && !isListening && (
                      <div className="w-32 h-32 rounded-full bg-violet-500/20 border-4 border-violet-500/50 flex items-center justify-center">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-violet-400 rounded-full animate-pulse"></div>
                          <div className="w-3 h-3 bg-violet-400 rounded-full animate-pulse delay-75"></div>
                          <div className="w-3 h-3 bg-violet-400 rounded-full animate-pulse delay-150"></div>
                        </div>
                      </div>
                    )}
                    {!isListening && !isProcessing && (
                      <div className="w-32 h-32 rounded-full bg-slate-700/50 border-4 border-slate-600 flex items-center justify-center">
                        <Mic className="w-16 h-16 text-slate-500" />
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    {isListening && (
                      <>
                        <div className="text-green-400 text-xl font-medium mb-2">Listening...</div>
                        <p className="text-slate-400 text-sm max-w-md">
                          Speak naturally. I&apos;ll detect when you stop automatically.
                        </p>
                      </>
                    )}
                    {isProcessing && !isListening && (
                      <>
                        <div className="text-violet-400 text-xl font-medium mb-2">
                          Sentra is thinking...
                        </div>
                        <p className="text-slate-400 text-sm max-w-md">Processing your message</p>
                      </>
                    )}
                    {!isListening && !isProcessing && (
                      <>
                        <div className="text-slate-400 text-xl font-medium mb-2">Sentra is ready</div>
                        <p className="text-slate-400 text-sm max-w-md">
                          Starting conversation...
                        </p>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 border-t border-slate-700">
          {errorMessage && (
            <div className="mb-3 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
              {errorMessage}
            </div>
          )}

          {textMode && (
            /* Text Mode Input */
            <div className="flex gap-2">
              <input
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendText()}
                placeholder="Type your message..."
                className="flex-1 bg-slate-800 border border-violet-500/20 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
                disabled={isProcessing}
              />
              <button
                onClick={handleSendText}
                disabled={isProcessing || !currentInput.trim()}
                className="px-6 py-2 bg-violet-500 hover:bg-violet-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
