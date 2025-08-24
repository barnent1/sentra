import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useDashboardStore } from '@/stores/dashboardStore';
import { WebSocketMessage, NotificationMessage } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export const useWebSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const {
    setWSConnected,
    setWSReconnecting,
    updateProject,
    updateAgent,
    updateTask,
    addNotification,
    addCodeDiff,
    addConversation,
    updateConversation,
    updateVoiceMeeting,
    projects,
    agents,
    tasks,
    ttsConfig,
  } = useDashboardStore();

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
    
    socketRef.current = io(wsUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
    });

    const socket = socketRef.current;

    // Connection events
    socket.on('connect', () => {
      console.log('WebSocket connected');
      setWSConnected(true);
      setWSReconnecting(false);
      
      addNotification({
        id: uuidv4(),
        type: 'success',
        title: 'Connected',
        message: 'Real-time updates enabled',
        timestamp: new Date().toISOString(),
        priority: 'low',
        ttsEnabled: false,
        crossDeviceSync: true,
      });
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setWSConnected(false);
    });

    socket.on('reconnect', () => {
      console.log('WebSocket reconnected');
      setWSConnected(true);
      setWSReconnecting(false);
    });

    socket.on('reconnecting', () => {
      console.log('WebSocket reconnecting...');
      setWSReconnecting(true);
    });

    socket.on('reconnect_failed', () => {
      console.log('WebSocket reconnection failed');
      setWSConnected(false);
      setWSReconnecting(false);
      
      addNotification({
        id: uuidv4(),
        type: 'error',
        title: 'Connection Lost',
        message: 'Unable to connect to real-time updates',
        timestamp: new Date().toISOString(),
        priority: 'high',
        ttsEnabled: true,
        crossDeviceSync: true,
      });
    });

    // Message handling
    socket.on('message', (message: WebSocketMessage) => {
      handleWebSocketMessage(message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleWebSocketMessage = (message: WebSocketMessage) => {
    console.log('WebSocket message:', message);

    switch (message.type) {
      case 'project_update':
        updateProject(message.payload.id, message.payload);
        
        if (message.payload.status === 'completed') {
          addNotification({
            id: uuidv4(),
            type: 'success',
            title: 'Project Completed',
            message: `${message.payload.name} has been completed successfully`,
            timestamp: message.timestamp,
            projectId: message.payload.id,
            priority: 'high',
            ttsEnabled: ttsConfig.enabled,
            crossDeviceSync: true,
          });
        }
        break;

      case 'agent_status':
        updateAgent(message.payload.id, message.payload);
        
        if (message.payload.status === 'error') {
          addNotification({
            id: uuidv4(),
            type: 'error',
            title: 'Agent Error',
            message: `${message.payload.name} encountered an error`,
            timestamp: message.timestamp,
            agentId: message.payload.id,
            priority: 'high',
            ttsEnabled: ttsConfig.enabled && ttsConfig.contextFiltering.priority !== 'critical',
            crossDeviceSync: true,
          });
        } else if (message.payload.status === 'online' && message.payload.wasOffline) {
          addNotification({
            id: uuidv4(),
            type: 'info',
            title: 'Agent Online',
            message: `${message.payload.name} is back online`,
            timestamp: message.timestamp,
            agentId: message.payload.id,
            priority: 'medium',
            ttsEnabled: ttsConfig.enabled,
            crossDeviceSync: true,
          });
        }
        break;

      case 'task_update':
        updateTask(message.payload.id, message.payload);
        
        if (message.payload.status === 'completed') {
          const agent = agents.find(a => a.id === message.payload.agentId);
          const project = projects.find(p => p.id === message.payload.projectId);
          
          addNotification({
            id: uuidv4(),
            type: 'success',
            title: 'Task Completed',
            message: `${agent?.name || 'Agent'} completed "${message.payload.title}" for ${project?.name || 'project'}`,
            timestamp: message.timestamp,
            projectId: message.payload.projectId,
            agentId: message.payload.agentId,
            priority: 'medium',
            ttsEnabled: ttsConfig.enabled,
            crossDeviceSync: true,
          });
        } else if (message.payload.status === 'failed') {
          addNotification({
            id: uuidv4(),
            type: 'error',
            title: 'Task Failed',
            message: `Task "${message.payload.title}" failed`,
            timestamp: message.timestamp,
            projectId: message.payload.projectId,
            agentId: message.payload.agentId,
            priority: 'high',
            ttsEnabled: ttsConfig.enabled,
            crossDeviceSync: true,
          });
        }
        break;

      case 'timeline_event':
        // Add to project timeline
        const project = projects.find(p => p.id === message.payload.projectId);
        if (project) {
          updateProject(project.id, {
            timeline: [...project.timeline, message.payload],
            updatedAt: message.timestamp,
          });
        }
        break;

      case 'notification':
        addNotification({
          ...message.payload,
          ttsEnabled: message.payload.ttsEnabled && ttsConfig.enabled,
        });
        break;

      case 'voice_event':
        if (message.payload.type === 'meeting_update') {
          updateVoiceMeeting(message.payload.meeting);
        }
        break;

      default:
        console.warn('Unknown WebSocket message type:', message.type);
    }
  };

  const sendMessage = (type: string, payload: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('message', {
        type,
        payload,
        timestamp: new Date().toISOString(),
      });
    }
  };

  return {
    sendMessage,
    isConnected: socketRef.current?.connected || false,
  };
};