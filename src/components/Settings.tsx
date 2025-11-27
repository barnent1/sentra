'use client';

import { useState, useEffect } from 'react';
import { X, Settings as SettingsIcon, Volume2, Globe, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSettings, saveSettings, type Settings as SettingsType } from '@/lib/settings';
import { speakNotification } from '@/services/quetrex-api';
import '@/lib/i18n'; // Initialize i18n

// Toast notification types
type ToastType = 'success' | 'error';
interface Toast {
  type: ToastType;
  message: string;
}

// Voice compatibility:
// TTS API (/v1/audio/speech) - 9 voices: alloy, ash, coral, echo, fable, nova, onyx, sage, shimmer
// Realtime API (/v1/realtime) - 10 voices: alloy, ash, ballad, coral, echo, sage, shimmer, verse, marin, cedar
// Shared voices (work with both): alloy, ash, coral, echo, sage, shimmer
// TTS only: fable, nova, onyx
// Realtime only: ballad, verse, marin, cedar
const VOICES = [
  { id: 'alloy', name: 'Alloy', description: 'Balanced, Neutral ⭐', ttsCompatible: true, realtimeCompatible: true },
  { id: 'ash', name: 'Ash', description: 'Expressive, Emotional Range', ttsCompatible: true, realtimeCompatible: true },
  { id: 'ballad', name: 'Ballad', description: 'Expressive, Warm Tones', ttsCompatible: false, realtimeCompatible: true },
  { id: 'cedar', name: 'Cedar', description: 'Natural, Conversational', ttsCompatible: false, realtimeCompatible: true },
  { id: 'coral', name: 'Coral', description: 'Expressive, Tuneable Emotions', ttsCompatible: true, realtimeCompatible: true },
  { id: 'echo', name: 'Echo', description: 'Male, Clear & Direct', ttsCompatible: true, realtimeCompatible: true },
  { id: 'fable', name: 'Fable', description: 'British, Expressive', ttsCompatible: true, realtimeCompatible: false },
  { id: 'marin', name: 'Marin', description: 'Professional, Clear', ttsCompatible: false, realtimeCompatible: true },
  { id: 'nova', name: 'Nova', description: 'Female, Warm & Friendly', ttsCompatible: true, realtimeCompatible: false },
  { id: 'onyx', name: 'Onyx', description: 'Deep Male, Authoritative', ttsCompatible: true, realtimeCompatible: false },
  { id: 'sage', name: 'Sage', description: 'Expressive, Accent Control', ttsCompatible: true, realtimeCompatible: true },
  { id: 'shimmer', name: 'Shimmer', description: 'Female, Soft & Gentle', ttsCompatible: true, realtimeCompatible: true },
  { id: 'verse', name: 'Verse', description: 'Expressive, Enhanced Tones', ttsCompatible: false, realtimeCompatible: true },
];

const LANGUAGES = [
  { id: 'en', name: 'English', nativeName: 'English' },
  { id: 'es', name: 'Spanish', nativeName: 'Español' },
];

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Settings({ isOpen, onClose }: SettingsProps) {
  const { t, i18n } = useTranslation();
  const [settings, setSettings] = useState<SettingsType>({
    userName: '',
    voice: 'alloy',  // Default to 'alloy' - works with both TTS and Realtime APIs
    openaiApiKey: '',
    anthropicApiKey: '',
    githubToken: '',
    githubRepoOwner: '',
    githubRepoName: '',
    notificationsEnabled: true,
    notifyOnCompletion: true,
    notifyOnFailure: true,
    notifyOnStart: false,
    language: 'en',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingVoice, setTestingVoice] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  async function loadSettings() {
    try {
      setLoading(true);
      const data = await getSettings();
      setSettings(data);
      // Update i18n language if it differs from current
      if (data.language && data.language !== i18n.language) {
        await i18n.changeLanguage(data.language);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      setToast(null);

      // Update i18n language before saving
      if (settings.language && settings.language !== i18n.language) {
        await i18n.changeLanguage(settings.language);
      }

      await saveSettings(settings);

      // Show success toast
      setToast({
        type: 'success',
        message: 'Settings saved successfully',
      });

      // Close modal after short delay to show success message
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Failed to save settings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Show error toast
      setToast({
        type: 'error',
        message: `Failed to save settings: ${errorMessage}`,
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleTestVoice() {
    if (!settings.openaiApiKey) {
      alert('Please enter your OpenAI API key first');
      return;
    }

    // Check if selected voice is TTS-compatible
    const selectedVoice = VOICES.find((v) => v.id === settings.voice);
    if (!selectedVoice?.ttsCompatible) {
      alert(`The ${selectedVoice?.name} voice is only available in the Realtime API and cannot be previewed. It will work during actual voice conversations.`);
      return;
    }

    try {
      setTestingVoice(true);
      const message = `Hey ${settings.userName || 'there'}, this is a test of the ${
        selectedVoice.name
      } voice. Agent forty-two just completed a task successfully.`;

      await speakNotification(message, settings.voice, settings.openaiApiKey);
    } catch (error) {
      console.error('Failed to test voice:', error);
      alert('Failed to test voice. Check your API key.');
    } finally {
      setTestingVoice(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-violet-500/20 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-6 h-6 text-violet-400" />
            <h2 className="text-2xl font-semibold text-white">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Close settings modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-400">Loading settings...</div>
        ) : (
          <div className="space-y-6">
            {/* User Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={settings.userName}
                onChange={(e) => setSettings({ ...settings, userName: e.target.value })}
                placeholder="e.g., Glen"
                className="w-full bg-slate-800 border border-violet-500/20 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
              />
              <p className="text-xs text-slate-500 mt-1">
                Used in voice notifications: &quot;Hey Glen, agent completed...&quot;
              </p>
            </div>

            {/* Language Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-violet-400" />
                  <span>Language</span>
                </div>
              </label>
              <div className="space-y-2">
                {LANGUAGES.map((language) => (
                  <label
                    key={language.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      settings.language === language.id
                        ? 'bg-violet-500/10 border-violet-500/50'
                        : 'bg-slate-800/50 border-slate-700/50 hover:border-violet-500/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="language"
                      value={language.id}
                      checked={settings.language === language.id}
                      onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                      className="text-violet-500 focus:ring-violet-500"
                      aria-label={language.name}
                    />
                    <div className="flex-1">
                      <div className="text-white font-medium">{language.nativeName}</div>
                      <div className="text-xs text-slate-400">{language.name}</div>
                    </div>
                  </label>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Select your preferred language for the interface
              </p>
            </div>

            {/* OpenAI API Key */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                OpenAI API Key
              </label>
              <input
                type="password"
                value={settings.openaiApiKey}
                onChange={(e) => setSettings({ ...settings, openaiApiKey: e.target.value })}
                placeholder="sk-proj-..."
                className="w-full bg-slate-800 border border-violet-500/20 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 font-mono text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">
                For voice transcription (Whisper) and TTS. Get one at{' '}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-400 hover:text-violet-300"
                >
                  platform.openai.com
                </a>
              </p>
            </div>

            {/* Anthropic API Key */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Anthropic API Key
              </label>
              <input
                type="password"
                value={settings.anthropicApiKey}
                onChange={(e) => setSettings({ ...settings, anthropicApiKey: e.target.value })}
                placeholder="sk-ant-api03-..."
                className="w-full bg-slate-800 border border-violet-500/20 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 font-mono text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">
                For Architect AI conversations. Get one at{' '}
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-400 hover:text-violet-300"
                >
                  console.anthropic.com
                </a>
              </p>
            </div>

            {/* GitHub Token */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                GitHub Personal Access Token
              </label>
              <input
                type="password"
                value={settings.githubToken}
                onChange={(e) => setSettings({ ...settings, githubToken: e.target.value })}
                placeholder="ghp_..."
                className="w-full bg-slate-800 border border-violet-500/20 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 font-mono text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">
                For creating GitHub issues from approved specs. Needs &apos;repo&apos; scope. Get one at{' '}
                <a
                  href="https://github.com/settings/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-400 hover:text-violet-300"
                >
                  github.com/settings/tokens
                </a>
              </p>
            </div>

            {/* GitHub Repo */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  GitHub Repo Owner
                </label>
                <input
                  type="text"
                  value={settings.githubRepoOwner}
                  onChange={(e) => setSettings({ ...settings, githubRepoOwner: e.target.value })}
                  placeholder="barnent1"
                  className="w-full bg-slate-800 border border-violet-500/20 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  GitHub Repo Name
                </label>
                <input
                  type="text"
                  value={settings.githubRepoName}
                  onChange={(e) => setSettings({ ...settings, githubRepoName: e.target.value })}
                  placeholder="quetrex"
                  className="w-full bg-slate-800 border border-violet-500/20 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
                />
              </div>
            </div>

            {/* Voice Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Voice
              </label>
              <div className="space-y-2">
                {VOICES.map((voice) => (
                  <label
                    key={voice.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      settings.voice === voice.id
                        ? 'bg-violet-500/10 border-violet-500/50'
                        : 'bg-slate-800/50 border-slate-700/50 hover:border-violet-500/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="voice"
                      value={voice.id}
                      checked={settings.voice === voice.id}
                      onChange={(e) => setSettings({ ...settings, voice: e.target.value })}
                      className="text-violet-500 focus:ring-violet-500"
                      aria-label={voice.name}
                    />
                    <div className="flex-1">
                      <div className="text-white font-medium">
                        {voice.name}
                        {!voice.realtimeCompatible && (
                          <span className="ml-2 text-xs text-amber-400/80 font-normal">
                            (TTS only - not for voice chat)
                          </span>
                        )}
                        {!voice.ttsCompatible && voice.realtimeCompatible && (
                          <span className="ml-2 text-xs text-violet-400/80 font-normal">
                            (Voice chat only - no preview)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">{voice.description}</div>
                    </div>
                  </label>
                ))}
              </div>
              <button
                onClick={handleTestVoice}
                disabled={testingVoice || !settings.openaiApiKey}
                className="mt-3 flex items-center gap-2 px-4 py-2 bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/50 rounded-lg text-violet-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Volume2 className="w-4 h-4" />
                {testingVoice ? 'Testing...' : 'Test Voice'}
              </button>
              <p className="text-xs text-slate-500 mt-2">
                Some voices are only available in real-time conversations and cannot be previewed.
              </p>
            </div>

            {/* Notification Preferences */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Notification Preferences
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notificationsEnabled}
                    onChange={(e) =>
                      setSettings({ ...settings, notificationsEnabled: e.target.checked })
                    }
                    className="w-4 h-4 text-violet-500 focus:ring-violet-500 rounded"
                  />
                  <span className="text-white">Enable voice notifications</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer ml-7">
                  <input
                    type="checkbox"
                    checked={settings.notifyOnCompletion}
                    onChange={(e) =>
                      setSettings({ ...settings, notifyOnCompletion: e.target.checked })
                    }
                    disabled={!settings.notificationsEnabled}
                    className="w-4 h-4 text-violet-500 focus:ring-violet-500 rounded disabled:opacity-50"
                  />
                  <span className="text-slate-300">Notify when agents complete</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer ml-7">
                  <input
                    type="checkbox"
                    checked={settings.notifyOnFailure}
                    onChange={(e) =>
                      setSettings({ ...settings, notifyOnFailure: e.target.checked })
                    }
                    disabled={!settings.notificationsEnabled}
                    className="w-4 h-4 text-violet-500 focus:ring-violet-500 rounded disabled:opacity-50"
                  />
                  <span className="text-slate-300">Notify when agents fail</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer ml-7">
                  <input
                    type="checkbox"
                    checked={settings.notifyOnStart}
                    onChange={(e) =>
                      setSettings({ ...settings, notifyOnStart: e.target.checked })
                    }
                    disabled={!settings.notificationsEnabled}
                    className="w-4 h-4 text-violet-500 focus:ring-violet-500 rounded disabled:opacity-50"
                  />
                  <span className="text-slate-300">Notify when agents start</span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-700">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-violet-500 hover:bg-violet-600 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>

            {/* Toast Notification */}
            {toast && (
              <div
                className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${
                  toast.type === 'success'
                    ? 'bg-green-500/10 border border-green-500/50'
                    : 'bg-red-500/10 border border-red-500/50'
                }`}
              >
                {toast.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                )}
                <span
                  className={`text-sm ${
                    toast.type === 'success' ? 'text-green-300' : 'text-red-300'
                  }`}
                >
                  {toast.message}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
