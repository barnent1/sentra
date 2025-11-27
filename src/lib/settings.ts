/**
 * Database-backed settings system for Quetrex web app
 * Uses authenticated API endpoints with encrypted storage
 */

import { fetchWithAuth } from '@/services/api';

export interface Settings {
  userName: string;
  voice: string;
  openaiApiKey: string;
  anthropicApiKey: string;
  githubToken: string;
  githubRepoOwner: string;
  githubRepoName: string;
  notificationsEnabled: boolean;
  notifyOnCompletion: boolean;
  notifyOnFailure: boolean;
  notifyOnStart: boolean;
  language: string;
}

// Backend settings structure
interface BackendSettings {
  openaiApiKey?: string;
  anthropicApiKey?: string;
  githubToken?: string;
  githubRepoOwner?: string;
  githubRepoName?: string;
  voiceSettings?: {
    voiceId: string;
    userName?: string;
  };
  notificationSettings?: {
    enabled: boolean;
    onCompletion: boolean;
    onFailure: boolean;
    onStart: boolean;
  };
  language?: string;
}

const DEFAULT_SETTINGS: Settings = {
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
};

/**
 * Transform backend settings to frontend format
 */
function transformBackendToFrontend(backend: BackendSettings): Settings {
  return {
    userName: backend.voiceSettings?.userName || '',
    voice: backend.voiceSettings?.voiceId || 'alloy',
    openaiApiKey: backend.openaiApiKey || '',
    anthropicApiKey: backend.anthropicApiKey || '',
    githubToken: backend.githubToken || '',
    githubRepoOwner: backend.githubRepoOwner || '',
    githubRepoName: backend.githubRepoName || '',
    notificationsEnabled: backend.notificationSettings?.enabled ?? true,
    notifyOnCompletion: backend.notificationSettings?.onCompletion ?? true,
    notifyOnFailure: backend.notificationSettings?.onFailure ?? true,
    notifyOnStart: backend.notificationSettings?.onStart ?? false,
    language: backend.language || 'en',
  };
}

/**
 * Transform frontend settings to backend format
 */
function transformFrontendToBackend(frontend: Settings): BackendSettings {
  return {
    openaiApiKey: frontend.openaiApiKey || undefined,
    anthropicApiKey: frontend.anthropicApiKey || undefined,
    githubToken: frontend.githubToken || undefined,
    githubRepoOwner: frontend.githubRepoOwner || undefined,
    githubRepoName: frontend.githubRepoName || undefined,
    voiceSettings: {
      voiceId: frontend.voice,
      userName: frontend.userName || undefined,
    },
    notificationSettings: {
      enabled: frontend.notificationsEnabled,
      onCompletion: frontend.notifyOnCompletion,
      onFailure: frontend.notifyOnFailure,
      onStart: frontend.notifyOnStart,
    },
    language: frontend.language,
  };
}

/**
 * Get user settings from database
 */
export async function getSettings(): Promise<Settings> {
  if (typeof window === 'undefined') {
    // Server-side rendering
    return DEFAULT_SETTINGS;
  }

  try {
    const response = await fetchWithAuth('/api/settings');

    if (!response.ok) {
      console.error('Failed to fetch settings:', response.statusText);
      return DEFAULT_SETTINGS;
    }

    const data: BackendSettings = await response.json();
    return transformBackendToFrontend(data);
  } catch (error) {
    console.error('Failed to load settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save user settings to database (with encryption)
 */
export async function saveSettings(settings: Settings): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('Cannot save settings on server');
  }

  try {
    const backendData = transformFrontendToBackend(settings);

    const response = await fetchWithAuth('/api/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'Failed to save settings');
    }
  } catch (error) {
    console.error('Failed to save settings:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to save settings');
  }
}
