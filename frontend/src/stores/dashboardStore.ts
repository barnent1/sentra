import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { 
  Project, 
  Agent, 
  Task, 
  NotificationMessage, 
  VoiceMeeting, 
  DashboardState, 
  CodeDiff, 
  AgentConversation,
  TTSConfig 
} from '@/types';

interface DashboardStore extends DashboardState {
  // Data
  projects: Project[];
  agents: Agent[];
  tasks: Task[];
  codeDiffs: CodeDiff[];
  conversations: AgentConversation[];
  
  // Voice & TTS
  ttsConfig: TTSConfig;
  voiceMeetings: VoiceMeeting[];
  
  // WebSocket connection
  wsConnected: boolean;
  wsReconnecting: boolean;
  
  // Actions
  setProjects: (projects: Project[]) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  setAgents: (agents: Agent[]) => void;
  updateAgent: (agentId: string, updates: Partial<Agent>) => void;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  
  // UI Actions
  setSelectedProject: (projectId: string | null) => void;
  setActivePanel: (panel: DashboardState['activePanel']) => void;
  toggleSidebar: () => void;
  
  // Notifications
  addNotification: (notification: NotificationMessage) => void;
  removeNotification: (notificationId: string) => void;
  clearNotifications: () => void;
  
  // Voice & Meetings
  startVoiceMeeting: (meeting: VoiceMeeting) => void;
  endVoiceMeeting: () => void;
  updateVoiceMeeting: (updates: Partial<VoiceMeeting>) => void;
  updateTTSConfig: (config: Partial<TTSConfig>) => void;
  
  // Code & Conversations
  addCodeDiff: (diff: CodeDiff) => void;
  addConversation: (conversation: AgentConversation) => void;
  updateConversation: (conversationId: string, updates: Partial<AgentConversation>) => void;
  
  // WebSocket
  setWSConnected: (connected: boolean) => void;
  setWSReconnecting: (reconnecting: boolean) => void;
}

export const useDashboardStore = create<DashboardStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    selectedProject: null,
    activePanel: 'dashboard',
    sidebarCollapsed: false,
    notifications: [],
    voiceMeetingActive: false,
    currentMeeting: null,
    
    // Data
    projects: [],
    agents: [],
    tasks: [],
    codeDiffs: [],
    conversations: [],
    
    // Voice & TTS
    ttsConfig: {
      enabled: true,
      voice: 'default',
      speed: 1.0,
      pitch: 1.0,
      volume: 0.8,
      persona: {
        name: 'Assistant',
        voice: 'default',
        personality: 'professional',
        expertise: [],
        communicationStyle: 'direct'
      },
      contextFiltering: {
        focusMode: false,
        meetingMode: false,
        travelMode: false,
        priority: 'high'
      },
      deviceRouting: {
        desktop: true,
        mobile: true,
        tablet: true,
        preferredDevice: 'auto'
      }
    },
    voiceMeetings: [],
    
    // WebSocket
    wsConnected: false,
    wsReconnecting: false,
    
    // Actions
    setProjects: (projects) => set({ projects }),
    
    updateProject: (projectId, updates) => set((state) => ({
      projects: state.projects.map(p => 
        p.id === projectId ? { ...p, ...updates } : p
      )
    })),
    
    setAgents: (agents) => set({ agents }),
    
    updateAgent: (agentId, updates) => set((state) => ({
      agents: state.agents.map(a => 
        a.id === agentId ? { ...a, ...updates } : a
      )
    })),
    
    setTasks: (tasks) => set({ tasks }),
    
    addTask: (task) => set((state) => ({
      tasks: [task, ...state.tasks]
    })),
    
    updateTask: (taskId, updates) => set((state) => ({
      tasks: state.tasks.map(t => 
        t.id === taskId ? { ...t, ...updates } : t
      )
    })),
    
    // UI Actions
    setSelectedProject: (projectId) => set({ selectedProject: projectId }),
    
    setActivePanel: (panel) => set({ activePanel: panel }),
    
    toggleSidebar: () => set((state) => ({ 
      sidebarCollapsed: !state.sidebarCollapsed 
    })),
    
    // Notifications
    addNotification: (notification) => set((state) => ({
      notifications: [notification, ...state.notifications.slice(0, 9)] // Keep max 10
    })),
    
    removeNotification: (notificationId) => set((state) => ({
      notifications: state.notifications.filter(n => n.id !== notificationId)
    })),
    
    clearNotifications: () => set({ notifications: [] }),
    
    // Voice & Meetings
    startVoiceMeeting: (meeting) => set({
      voiceMeetingActive: true,
      currentMeeting: meeting,
      voiceMeetings: [...get().voiceMeetings, meeting]
    }),
    
    endVoiceMeeting: () => set((state) => ({
      voiceMeetingActive: false,
      currentMeeting: state.currentMeeting ? {
        ...state.currentMeeting,
        status: 'completed',
        endTime: new Date().toISOString()
      } : null
    })),
    
    updateVoiceMeeting: (updates) => set((state) => ({
      currentMeeting: state.currentMeeting ? { ...state.currentMeeting, ...updates } : null,
      voiceMeetings: state.voiceMeetings.map(m => 
        m.id === state.currentMeeting?.id ? { ...m, ...updates } : m
      )
    })),
    
    updateTTSConfig: (config) => set((state) => ({
      ttsConfig: { ...state.ttsConfig, ...config }
    })),
    
    // Code & Conversations
    addCodeDiff: (diff) => set((state) => ({
      codeDiffs: [diff, ...state.codeDiffs.slice(0, 49)] // Keep max 50
    })),
    
    addConversation: (conversation) => set((state) => ({
      conversations: [conversation, ...state.conversations]
    })),
    
    updateConversation: (conversationId, updates) => set((state) => ({
      conversations: state.conversations.map(c => 
        c.id === conversationId ? { ...c, ...updates } : c
      )
    })),
    
    // WebSocket
    setWSConnected: (connected) => set({ wsConnected: connected }),
    
    setWSReconnecting: (reconnecting) => set({ wsReconnecting: reconnecting }),
  }))
);

// Selectors for better performance
export const useProjects = () => useDashboardStore(state => state.projects);
export const useAgents = () => useDashboardStore(state => state.agents);
export const useSelectedProject = () => useDashboardStore(state => {
  const selectedId = state.selectedProject;
  return selectedId ? state.projects.find(p => p.id === selectedId) : null;
});
export const useProjectTasks = (projectId: string) => useDashboardStore(state => 
  state.tasks.filter(t => t.projectId === projectId)
);
export const useProjectAgents = (projectId: string) => useDashboardStore(state => {
  const project = state.projects.find(p => p.id === projectId);
  return project ? project.agents : [];
});
export const useNotifications = () => useDashboardStore(state => state.notifications);
export const useVoiceMeeting = () => useDashboardStore(state => state.currentMeeting);
export const useTTSConfig = () => useDashboardStore(state => state.ttsConfig);