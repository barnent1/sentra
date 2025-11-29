'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import Image from 'next/image';
import { Settings as SettingsIcon, Volume2, Globe, CheckCircle, AlertCircle, ArrowLeft, Bot } from 'lucide-react';
import { getSettings, saveSettings, type Settings as SettingsType } from '@/lib/settings';
import { speakNotification } from '@/services/quetrex-api';

// Toast notification types
type ToastType = 'success' | 'error';
interface Toast {
  type: ToastType;
  message: string;
}

// Voice compatibility:
// TTS API (/v1/audio/speech) - 9 voices: alloy, ash, coral, echo, fable, nova, onyx, sage, shimmer
// Realtime API (/v1/realtime) - 10 voices: alloy, ash, ballad, coral, echo, sage, shimmer, verse, marin, cedar
const VOICES = [
  { id: 'alloy', name: 'Alloy', description: 'Balanced, Neutral', ttsCompatible: true, realtimeCompatible: true },
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

// Default agent names
const DEFAULT_AGENTS = [
  { id: 'orchestrator', defaultName: 'Orchestrator', description: 'Plans work, coordinates agents' },
  { id: 'test-writer', defaultName: 'Test Writer', description: 'Writes tests first (TDD)' },
  { id: 'implementation', defaultName: 'Implementation', description: 'Makes tests pass' },
  { id: 'code-reviewer', defaultName: 'Code Reviewer', description: 'Finds bugs before production' },
  { id: 'security-auditor', defaultName: 'Security Auditor', description: 'OWASP Top 10 audits' },
  { id: 'architect', defaultName: 'Architect', description: 'Voice-first feature planning' },
  { id: 'refactoring', defaultName: 'Refactoring', description: 'Improves code quality' },
];

interface AgentSettings {
  [key: string]: string;
}

interface ExtendedSettings extends SettingsType {
  agentNames?: AgentSettings;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<ExtendedSettings>({
    userName: '',
    voice: 'alloy',
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
    agentNames: {},
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingVoice, setTestingVoice] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'api' | 'agents' | 'notifications'>('general');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  async function loadSettings() {
    try {
      setLoading(true);
      const data = await getSettings();
      // Initialize agent names with defaults if not set
      const agentNames: AgentSettings = {};
      DEFAULT_AGENTS.forEach(agent => {
        agentNames[agent.id] = data.agentNames?.[agent.id] || agent.defaultName;
      });
      setSettings({ ...data, agentNames });
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
      await saveSettings(settings);
      setToast({ type: 'success', message: 'Settings saved successfully' });
    } catch (error) {
      console.error('Failed to save settings:', error);
      setToast({ type: 'error', message: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  }

  async function handleTestVoice() {
    if (!settings.openaiApiKey) {
      setToast({ type: 'error', message: 'Please enter your OpenAI API key first' });
      return;
    }

    const selectedVoice = VOICES.find((v) => v.id === settings.voice);
    if (!selectedVoice?.ttsCompatible) {
      setToast({ type: 'error', message: `${selectedVoice?.name} is only available in real-time conversations` });
      return;
    }

    try {
      setTestingVoice(true);
      const message = `Hey ${settings.userName || 'there'}, this is a test of the ${selectedVoice.name} voice.`;
      await speakNotification(message, settings.voice, settings.openaiApiKey);
    } catch (error) {
      console.error('Failed to test voice:', error);
      setToast({ type: 'error', message: 'Failed to test voice. Check your API key.' });
    } finally {
      setTestingVoice(false);
    }
  }

  function updateAgentName(agentId: string, name: string) {
    setSettings({
      ...settings,
      agentNames: {
        ...settings.agentNames,
        [agentId]: name,
      },
    });
  }

  function resetAgentNames() {
    const agentNames: AgentSettings = {};
    DEFAULT_AGENTS.forEach(agent => {
      agentNames[agent.id] = agent.defaultName;
    });
    setSettings({ ...settings, agentNames });
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B]">
      {/* Header */}
      <header className="border-b border-[#27272A] bg-[#18181B]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="flex items-center gap-3 mb-8">
          <SettingsIcon className="w-8 h-8 text-violet-400" />
          <h1 className="text-2xl font-bold text-white">Settings</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-[#27272A]">
          {[
            { id: 'general', label: 'General' },
            { id: 'api', label: 'API Keys' },
            { id: 'agents', label: 'Agents' },
            { id: 'notifications', label: 'Notifications' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'text-violet-400 border-violet-400'
                  : 'text-gray-400 border-transparent hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Toast */}
        {toast && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              toast.type === 'success'
                ? 'bg-green-500/10 border border-green-500/50'
                : 'bg-red-500/10 border border-red-500/50'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400" />
            )}
            <span className={toast.type === 'success' ? 'text-green-300' : 'text-red-300'}>
              {toast.message}
            </span>
          </div>
        )}

        <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-6">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* User Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={settings.userName}
                  onChange={(e) => setSettings({ ...settings, userName: e.target.value })}
                  placeholder="e.g., Glen"
                  className="w-full bg-[#27272A] border border-[#3F3F46] rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  AI will use this name when speaking to you: &quot;Hey Glen, the task is complete...&quot;
                </p>
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-violet-400" />
                    <span>Language</span>
                  </div>
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                  className="w-full bg-[#27272A] border border-[#3F3F46] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </div>

              {/* Voice Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-violet-400" />
                    <span>Architect Voice</span>
                  </div>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {VOICES.map((voice) => (
                    <label
                      key={voice.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        settings.voice === voice.id
                          ? 'bg-violet-500/10 border-violet-500/50'
                          : 'bg-[#27272A] border-[#3F3F46] hover:border-violet-500/30'
                      }`}
                    >
                      <input
                        type="radio"
                        name="voice"
                        value={voice.id}
                        checked={settings.voice === voice.id}
                        onChange={(e) => setSettings({ ...settings, voice: e.target.value })}
                        className="text-violet-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium text-sm truncate">
                          {voice.name}
                          {!voice.realtimeCompatible && (
                            <span className="ml-1 text-xs text-amber-400">(TTS only)</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 truncate">{voice.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
                <button
                  onClick={handleTestVoice}
                  disabled={testingVoice || !settings.openaiApiKey}
                  className="mt-3 flex items-center gap-2 px-4 py-2 bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/50 rounded-lg text-violet-300 transition disabled:opacity-50"
                >
                  <Volume2 className="w-4 h-4" />
                  {testingVoice ? 'Testing...' : 'Test Voice'}
                </button>
              </div>
            </div>
          )}

          {/* API Keys Tab */}
          {activeTab === 'api' && (
            <div className="space-y-6">
              {/* OpenAI API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  value={settings.openaiApiKey}
                  onChange={(e) => setSettings({ ...settings, openaiApiKey: e.target.value })}
                  placeholder="sk-proj-..."
                  className="w-full bg-[#27272A] border border-[#3F3F46] rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  For voice (Whisper, TTS, Realtime).{' '}
                  <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300">
                    Get one here
                  </a>
                </p>
              </div>

              {/* Anthropic API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Anthropic API Key
                </label>
                <input
                  type="password"
                  value={settings.anthropicApiKey}
                  onChange={(e) => setSettings({ ...settings, anthropicApiKey: e.target.value })}
                  placeholder="sk-ant-api03-..."
                  className="w-full bg-[#27272A] border border-[#3F3F46] rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  For Architect AI conversations.{' '}
                  <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300">
                    Get one here
                  </a>
                </p>
              </div>

              {/* GitHub Token */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  GitHub Personal Access Token
                </label>
                <input
                  type="password"
                  value={settings.githubToken}
                  onChange={(e) => setSettings({ ...settings, githubToken: e.target.value })}
                  placeholder="ghp_..."
                  className="w-full bg-[#27272A] border border-[#3F3F46] rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  For creating GitHub issues. Needs &apos;repo&apos; scope.{' '}
                  <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300">
                    Get one here
                  </a>
                </p>
              </div>

              {/* GitHub Repo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    GitHub Repo Owner
                  </label>
                  <input
                    type="text"
                    value={settings.githubRepoOwner}
                    onChange={(e) => setSettings({ ...settings, githubRepoOwner: e.target.value })}
                    placeholder="barnent1"
                    className="w-full bg-[#27272A] border border-[#3F3F46] rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    GitHub Repo Name
                  </label>
                  <input
                    type="text"
                    value={settings.githubRepoName}
                    onChange={(e) => setSettings({ ...settings, githubRepoName: e.target.value })}
                    placeholder="quetrex"
                    className="w-full bg-[#27272A] border border-[#3F3F46] rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Agents Tab */}
          {activeTab === 'agents' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-white">Agent Names</h3>
                  <p className="text-sm text-gray-500">
                    Customize how agents introduce themselves
                  </p>
                </div>
                <button
                  onClick={resetAgentNames}
                  className="text-sm text-gray-400 hover:text-white transition"
                >
                  Reset to defaults
                </button>
              </div>

              <div className="space-y-3">
                {DEFAULT_AGENTS.map((agent) => (
                  <div key={agent.id} className="flex items-center gap-4 p-4 bg-[#27272A] rounded-lg">
                    <Bot className="w-5 h-5 text-violet-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={settings.agentNames?.[agent.id] || agent.defaultName}
                        onChange={(e) => updateAgentName(agent.id, e.target.value)}
                        className="w-full bg-transparent border-b border-[#3F3F46] text-white focus:outline-none focus:border-violet-500 pb-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">{agent.description}</p>
                    </div>
                    <span className="text-xs text-gray-600 font-mono">{agent.id}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Voice Notifications</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notificationsEnabled}
                      onChange={(e) => setSettings({ ...settings, notificationsEnabled: e.target.checked })}
                      className="w-5 h-5 rounded border-[#3F3F46] bg-[#27272A] text-violet-500 focus:ring-violet-500"
                    />
                    <div>
                      <span className="text-white font-medium">Enable voice notifications</span>
                      <p className="text-xs text-gray-500">AI will speak status updates aloud</p>
                    </div>
                  </label>

                  <div className={`ml-8 space-y-3 ${!settings.notificationsEnabled ? 'opacity-50' : ''}`}>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifyOnCompletion}
                        onChange={(e) => setSettings({ ...settings, notifyOnCompletion: e.target.checked })}
                        disabled={!settings.notificationsEnabled}
                        className="w-4 h-4 rounded border-[#3F3F46] bg-[#27272A] text-violet-500 focus:ring-violet-500"
                      />
                      <span className="text-gray-300">Notify when agents complete</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifyOnFailure}
                        onChange={(e) => setSettings({ ...settings, notifyOnFailure: e.target.checked })}
                        disabled={!settings.notificationsEnabled}
                        className="w-4 h-4 rounded border-[#3F3F46] bg-[#27272A] text-violet-500 focus:ring-violet-500"
                      />
                      <span className="text-gray-300">Notify when agents fail</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifyOnStart}
                        onChange={(e) => setSettings({ ...settings, notifyOnStart: e.target.checked })}
                        disabled={!settings.notificationsEnabled}
                        className="w-4 h-4 rounded border-[#3F3F46] bg-[#27272A] text-violet-500 focus:ring-violet-500"
                      />
                      <span className="text-gray-300">Notify when agents start</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex gap-3 pt-6 mt-6 border-t border-[#27272A]">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
            <Link
              href="/dashboard"
              className="px-6 py-2 bg-[#27272A] hover:bg-[#3F3F46] text-white rounded-lg transition text-center"
            >
              Cancel
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
