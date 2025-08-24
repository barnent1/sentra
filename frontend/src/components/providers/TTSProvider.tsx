'use client';

import { useEffect } from 'react';
import { useDashboardStore } from '@/stores/dashboardStore';
import { ttsService } from '@/utils/ttsService';

interface TTSProviderProps {
  children: React.ReactNode;
}

export function TTSProvider({ children }: TTSProviderProps) {
  const { notifications, ttsConfig } = useDashboardStore();

  useEffect(() => {
    // Handle new notifications with TTS
    const unsubscribe = useDashboardStore.subscribe(
      (state) => state.notifications,
      (newNotifications, prevNotifications) => {
        // Find new notifications
        const newNotifs = newNotifications.filter(
          notif => !prevNotifications.find(prev => prev.id === notif.id)
        );

        // Speak new notifications
        newNotifs.forEach(notification => {
          if (notification.ttsEnabled) {
            ttsService.speakNotification(notification, ttsConfig);
          }
        });
      }
    );

    return unsubscribe;
  }, [ttsConfig]);

  return <>{children}</>;
}