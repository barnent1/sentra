'use client';

import { useEffect } from 'react';
import { useDashboardStore } from '@/stores/dashboardStore';
import { Sidebar } from '@/components/layout/Sidebar';
import { MainContent } from '@/components/layout/MainContent';
import { StatusBar } from '@/components/layout/StatusBar';
import { VoiceMeetingModal } from '@/components/voice/VoiceMeetingModal';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';
import { useWindowSize } from '@/hooks/useWindowSize';

// Mock data for development
const mockProjects = [
  {
    id: 'proj-1',
    name: 'E-Commerce Platform',
    description: 'Next.js e-commerce platform with AI recommendations',
    status: 'active' as const,
    progress: 75,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T15:30:00Z',
    agents: [
      {
        id: 'james-1',
        name: 'James',
        type: 'james' as const,
        status: 'busy' as const,
        currentTask: 'Implementing checkout flow',
        lastActivity: '2024-01-20T15:25:00Z',
        health: {
          status: 'healthy' as const,
          uptime: 99.5,
          memoryUsage: 65,
          cpuUsage: 45,
          errors: 0,
          lastHealthCheck: '2024-01-20T15:30:00Z'
        },
        capabilities: ['frontend', 'react', 'typescript', 'ui/ux'],
        performance: {
          tasksCompleted: 23,
          averageTaskTime: 2.5,
          successRate: 96,
          efficiency: 92
        }
      },
      {
        id: 'sarah-1',
        name: 'Sarah',
        type: 'sarah' as const,
        status: 'online' as const,
        currentTask: 'API optimization',
        lastActivity: '2024-01-20T15:20:00Z',
        health: {
          status: 'healthy' as const,
          uptime: 98.8,
          memoryUsage: 58,
          cpuUsage: 32,
          errors: 1,
          lastHealthCheck: '2024-01-20T15:30:00Z'
        },
        capabilities: ['backend', 'nodejs', 'databases', 'apis'],
        performance: {
          tasksCompleted: 31,
          averageTaskTime: 1.8,
          successRate: 94,
          efficiency: 89
        }
      }
    ],
    timeline: [],
    metrics: {
      tasksTotal: 45,
      tasksCompleted: 34,
      tasksInProgress: 8,
      tasksFailed: 3,
      codeQuality: 92,
      testCoverage: 85,
      deploymentFrequency: 12,
      leadTime: 4.2,
      cycleTime: 2.1,
      changeFailureRate: 0.05,
      meanTimeToRecovery: 1.3
    }
  },
  {
    id: 'proj-2',
    name: 'Mobile Banking App',
    description: 'React Native banking application with biometric auth',
    status: 'active' as const,
    progress: 45,
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-20T14:15:00Z',
    agents: [
      {
        id: 'mike-1',
        name: 'Mike',
        type: 'mike' as const,
        status: 'online' as const,
        currentTask: 'Timeline optimization',
        lastActivity: '2024-01-20T14:10:00Z',
        health: {
          status: 'healthy' as const,
          uptime: 99.9,
          memoryUsage: 42,
          cpuUsage: 28,
          errors: 0,
          lastHealthCheck: '2024-01-20T15:30:00Z'
        },
        capabilities: ['project-management', 'timeline', 'coordination', 'optimization'],
        performance: {
          tasksCompleted: 18,
          averageTaskTime: 3.2,
          successRate: 100,
          efficiency: 95
        }
      }
    ],
    timeline: [],
    metrics: {
      tasksTotal: 62,
      tasksCompleted: 28,
      tasksInProgress: 12,
      tasksFailed: 2,
      codeQuality: 88,
      testCoverage: 78,
      deploymentFrequency: 8,
      leadTime: 5.1,
      cycleTime: 2.8,
      changeFailureRate: 0.08,
      meanTimeToRecovery: 1.8
    }
  },
  {
    id: 'proj-3',
    name: 'AI Analytics Dashboard',
    description: 'Real-time analytics dashboard with ML insights',
    status: 'planning' as const,
    progress: 15,
    createdAt: '2024-01-18T12:00:00Z',
    updatedAt: '2024-01-20T11:45:00Z',
    agents: [],
    timeline: [],
    metrics: {
      tasksTotal: 78,
      tasksCompleted: 12,
      tasksInProgress: 3,
      tasksFailed: 0,
      codeQuality: 95,
      testCoverage: 90,
      deploymentFrequency: 2,
      leadTime: 3.5,
      cycleTime: 1.9,
      changeFailureRate: 0.02,
      meanTimeToRecovery: 0.8
    }
  }
];

export default function Dashboard() {
  const { 
    setProjects, 
    setSelectedProject, 
    sidebarCollapsed, 
    voiceMeetingActive,
    selectedProject 
  } = useDashboardStore();
  const { width } = useWindowSize();
  
  const isMobile = width ? width < 768 : false;
  const isTablet = width ? width >= 768 && width < 1024 : false;

  useEffect(() => {
    // Load mock data
    setProjects(mockProjects);
    
    // Auto-select first project
    if (mockProjects.length > 0 && !selectedProject) {
      setSelectedProject(mockProjects[0].id);
    }
  }, [setProjects, setSelectedProject, selectedProject]);

  return (
    <div className="h-full flex bg-gray-50">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar collapsed={sidebarCollapsed} />
      )}
      
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 ${!isMobile ? 'ml-0' : ''}`}>
        {/* Status Bar */}
        <StatusBar />
        
        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          <MainContent />
        </main>
        
        {/* Mobile Bottom Navigation */}
        {isMobile && <MobileBottomNav />}
      </div>
      
      {/* Voice Meeting Modal */}
      {voiceMeetingActive && <VoiceMeetingModal />}
      
      {/* Notification Center */}
      <NotificationCenter />
    </div>
  );
}