'use client';

import { useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useDashboardStore } from '@/stores/dashboardStore';

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { sendMessage } = useWebSocket();
  const { wsConnected, addNotification } = useDashboardStore();

  useEffect(() => {
    // Initialize connection and subscribe to updates
    if (wsConnected) {
      sendMessage('subscribe', {
        channels: ['projects', 'agents', 'tasks', 'notifications', 'voice']
      });
    }
  }, [wsConnected, sendMessage]);

  return <>{children}</>;
}