/**
 * Voice Initializer Component
 *
 * Initializes voice notifications with OpenAI API key from settings on app load.
 * Runs once when the app starts and reinitializes when settings change.
 *
 * This component is mounted in the root layout to ensure voice notifications
 * are always available throughout the app.
 */

'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import {
  initVoiceNotifications,
  cleanupVoiceNotifications,
} from '@/lib/voice-notifications';

export function VoiceInitializer() {
  const { user, loading: authLoading } = useAuth();
  const { settings, isLoading } = useSettings();
  const initializedRef = useRef(false);
  const lastApiKeyRef = useRef<string>('');

  useEffect(() => {
    // Skip if auth is still loading or user is not authenticated
    if (authLoading || !user) return;

    // Skip if still loading settings
    if (isLoading) return;

    // Skip if no OpenAI API key
    if (!settings.openaiApiKey) {
      console.log('[VoiceInitializer] No OpenAI API key configured, skipping voice initialization');
      return;
    }

    // Check if we need to reinitialize (key changed)
    const keyChanged = lastApiKeyRef.current !== settings.openaiApiKey;

    if (!initializedRef.current || keyChanged) {
      console.log('[VoiceInitializer] Initializing voice notifications...');

      // Clean up any existing voice queue
      cleanupVoiceNotifications();

      // Initialize with new settings
      initVoiceNotifications(settings.openaiApiKey, settings.voice);

      // Mark as initialized
      initializedRef.current = true;
      lastApiKeyRef.current = settings.openaiApiKey;

      console.log('[VoiceInitializer] Voice notifications initialized with voice:', settings.voice);
    }

    // Cleanup on unmount
    return () => {
      if (initializedRef.current) {
        console.log('[VoiceInitializer] Cleaning up voice notifications');
        cleanupVoiceNotifications();
        initializedRef.current = false;
        lastApiKeyRef.current = '';
      }
    };
  }, [user, authLoading, settings.openaiApiKey, settings.voice, isLoading]);

  // This component doesn't render anything
  return null;
}
