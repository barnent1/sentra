/**
 * Settings Hook with React Query
 *
 * Provides cached access to user settings with automatic refresh.
 * Uses React Query for efficient caching and background updates.
 *
 * Usage:
 * ```typescript
 * const { settings, isLoading, error, refetch } = useSettings();
 *
 * if (settings.openaiApiKey) {
 *   // Use OpenAI API
 * }
 * ```
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { getSettings, type Settings } from '@/lib/settings';

export interface UseSettingsResult {
  settings: Settings;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch and cache user settings
 *
 * Features:
 * - Automatic caching with React Query
 * - Auto-refresh on window focus (disabled by default in QueryProvider)
 * - Returns default settings on error or when not authenticated
 * - TypeScript strict mode compliant
 */
export function useSettings(): UseSettingsResult {
  const { user, loading: authLoading } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const settings = await getSettings();
      return settings;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnMount: true, // Refetch when component mounts
    refetchOnReconnect: true, // Refetch when reconnecting
    retry: 1, // Retry once on failure
    enabled: !authLoading && !!user, // Only fetch if user is authenticated
  });

  // Default settings for loading state or error state
  const defaultSettings: Settings = {
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

  return {
    settings: data || defaultSettings,
    isLoading,
    error: error as Error | null,
    refetch: () => {
      refetch();
    },
  };
}
