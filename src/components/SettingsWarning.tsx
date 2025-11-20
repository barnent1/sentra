/**
 * Settings Warning Component
 *
 * Displays a warning banner when required API keys are not configured.
 * Guides users to the settings page to configure their keys.
 *
 * Usage:
 * ```typescript
 * <SettingsWarning />
 * ```
 */

'use client';

import { AlertCircle, Settings } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';

interface SettingsWarningProps {
  requiredKeys?: ('openai' | 'anthropic' | 'github')[];
  featureName?: string;
  onOpenSettings?: () => void;
}

export function SettingsWarning({
  requiredKeys = ['openai', 'anthropic'],
  featureName = 'voice features',
  onOpenSettings,
}: SettingsWarningProps) {
  const { settings, isLoading } = useSettings();

  // Don't show while loading
  if (isLoading) return null;

  // Check which required keys are missing
  const missingKeys: string[] = [];

  if (requiredKeys.includes('openai') && !settings.openaiApiKey) {
    missingKeys.push('OpenAI API key');
  }

  if (requiredKeys.includes('anthropic') && !settings.anthropicApiKey) {
    missingKeys.push('Anthropic API key');
  }

  if (requiredKeys.includes('github') && !settings.githubToken) {
    missingKeys.push('GitHub token');
  }

  // Don't show if all required keys are present
  if (missingKeys.length === 0) return null;

  return (
    <div
      className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-amber-300 font-medium mb-1">API Keys Not Configured</h3>
          <p className="text-amber-200/80 text-sm mb-3">
            The following API keys are required for {featureName}:{' '}
            <span className="font-medium">{missingKeys.join(', ')}</span>
          </p>
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-lg transition-colors text-amber-200 text-sm font-medium"
            aria-label="Open settings to configure API keys"
          >
            <Settings className="w-4 h-4" />
            Configure in Settings
          </button>
        </div>
      </div>
    </div>
  );
}
