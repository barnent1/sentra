'use client';

import { useState, useEffect } from 'react';
import { X, Settings as SettingsIcon, Volume2 } from 'lucide-react';
import { getSettings, saveSettings, speakNotification, type Settings as SettingsType } from '@/lib/tauri';

const VOICES = [
  { id: 'alloy', name: 'Alloy', description: 'Balanced, Neutral' },
  { id: 'echo', name: 'Echo', description: 'Male, Clear & Direct' },
  { id: 'fable', name: 'Fable', description: 'British, Expressive' },
  { id: 'onyx', name: 'Onyx', description: 'Deep Male, Authoritative' },
  { id: 'nova', name: 'Nova', description: 'Female, Warm & Friendly ⭐' },
  { id: 'shimmer', name: 'Shimmer', description: 'Female, Soft & Gentle' },
];

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Settings({ isOpen, onClose }: SettingsProps) {
  const [settings, setSettings] = useState<SettingsType>({
    userName: '',
    voice: 'nova',
    openaiApiKey: '',
    anthropicApiKey: '',
    githubToken: '',
    githubRepoOwner: '',
    githubRepoName: '',
    notificationsEnabled: true,
    notifyOnCompletion: true,
    notifyOnFailure: true,
    notifyOnStart: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingVoice, setTestingVoice] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  async function loadSettings() {
    try {
      setLoading(true);
      const data = await getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      console.log('Saving settings:', settings);
      await saveSettings(settings);
      console.log('Settings saved successfully');
      onClose();
    } catch (error) {
      console.error('Failed to save settings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to save settings: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleTestVoice() {
    if (!settings.openaiApiKey) {
      alert('Please enter your OpenAI API key first');
      return;
    }

    try {
      setTestingVoice(true);
      const message = `Hey ${settings.userName || 'there'}, this is a test of the ${
        VOICES.find((v) => v.id === settings.voice)?.name || 'selected'
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
                  placeholder="sentra"
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
                    />
                    <div className="flex-1">
                      <div className="text-white font-medium">{voice.name}</div>
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
          </div>
        )}
      </div>
    </div>
  );
}
