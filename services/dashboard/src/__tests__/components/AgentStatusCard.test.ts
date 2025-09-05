/**
 * Unit tests for AgentStatusCard component
 * Following SENTRA project standards: strict TypeScript with branded types
 */

import { describe, it, expect, beforeEach, vi } from '@jest/globals';
import { mount, VueWrapper } from '@vue/test-utils';
import AgentStatusCard from '../../components/agents/AgentStatusCard.vue';
import type { AgentInstance, EvolutionDna, Task, AgentInstanceId, EvolutionDnaId, TaskId, ProjectContextId } from '@sentra/types';
import type { AgentMetrics } from '../../stores/agents';

// Mock date to make tests deterministic
const mockDate = new Date('2024-01-15T10:00:00Z');
vi.useFakeTimers();
vi.setSystemTime(mockDate);

describe('AgentStatusCard Component', () => {
  let wrapper: VueWrapper<any>;
  let mockAgent: AgentInstance;
  let mockDna: EvolutionDna;
  let mockTask: Task;
  let mockMetrics: AgentMetrics;

  beforeEach(() => {
    mockAgent = {
      id: 'agent-123' as AgentInstanceId,
      evolutionDnaId: 'dna-456' as EvolutionDnaId,
      name: 'TestAgent',
      role: 'Developer',
      status: 'active',
      spawnedAt: new Date('2024-01-01T00:00:00Z'),
      lastActiveAt: new Date('2024-01-15T09:45:00Z'), // 15 minutes ago
      performanceHistory: [],
      metadata: {},
    };

    mockDna = {
      id: 'dna-456' as EvolutionDnaId,
      patternType: 'analytical',
      genetics: {
        complexity: 0.75,
        adaptability: 0.82,
        successRate: 0.88,
        transferability: 0.65,
        stability: 0.91,
        novelty: 0.55,
      },
      performance: {
        successRate: 0.88,
        averageTaskCompletionTime: 120,
        codeQualityScore: 0.85,
        userSatisfactionRating: 4.2,
        adaptationSpeed: 0.7,
        errorRecoveryRate: 0.8,
      },
      projectContext: {
        projectType: 'web-app',
        techStack: ['typescript', 'react'],
        complexity: 'medium',
        teamSize: 5,
        timeline: '6 months',
        requirements: ['scalable', 'maintainable'],
      },
      generation: 3,
      embedding: [0.1, 0.2, 0.3],
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-15T00:00:00Z'),
    };

    mockTask = {
      id: 'task-789' as TaskId,
      title: 'Implement authentication system',
      description: 'Build secure authentication with JWT tokens',
      status: 'in_progress',
      priority: 'high',
      assignedAgentId: mockAgent.id,
      projectContextId: 'context-123' as ProjectContextId,
      dependencies: [],
      estimatedDuration: 240,
      createdAt: new Date('2024-01-15T08:00:00Z'),
      updatedAt: new Date('2024-01-15T09:00:00Z'),
    };

    mockMetrics = {
      successRate: 0.92,
      tasksCompleted: 15,
      averageCompletionTime: 105,
      qualityScore: 0.87,
    };
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('Basic Rendering', () => {
    it('should render agent information correctly', () => {
      wrapper = mount(AgentStatusCard, {
        props: {
          agent: mockAgent,
          dna: mockDna,
          metrics: mockMetrics,
        },
      });

      expect(wrapper.text()).toContain('TestAgent');
      expect(wrapper.text()).toContain('Developer');
      expect(wrapper.text()).toContain('Gen 3');
    });

    it('should display status indicator with correct color', () => {
      wrapper = mount(AgentStatusCard, {
        props: {
          agent: mockAgent,
        },
      });

      const statusIndicator = wrapper.find('.w-3.h-3.rounded-full');
      expect(statusIndicator.classes()).toContain('bg-green-500'); // active status
    });

    it('should display status badge with proper styling', () => {
      wrapper = mount(AgentStatusCard, {
        props: {
          agent: mockAgent,
        },
      });

      const statusBadge = wrapper.find('.px-2.py-1.text-xs.font-medium.rounded-full');
      expect(statusBadge.text()).toBe('Active');
      expect(statusBadge.classes()).toContain('bg-green-100');
      expect(statusBadge.classes()).toContain('text-green-800');
    });
  });

  describe('Status Variants', () => {
    const statusTests = [
      {
        status: 'active' as const,
        indicatorClass: 'bg-green-500',
        badgeClasses: ['bg-green-100', 'text-green-800'],
        badgeText: 'Active',
      },
      {
        status: 'inactive' as const,
        indicatorClass: 'bg-yellow-500',
        badgeClasses: ['bg-yellow-100', 'text-yellow-800'],
        badgeText: 'Inactive',
      },
      {
        status: 'archived' as const,
        indicatorClass: 'bg-gray-500',
        badgeClasses: ['bg-gray-100', 'text-gray-800'],
        badgeText: 'Archived',
      },
    ];

    statusTests.forEach(({ status, indicatorClass, badgeClasses, badgeText }) => {
      it(`should display ${status} status correctly`, () => {
        wrapper = mount(AgentStatusCard, {
          props: {
            agent: { ...mockAgent, status },
          },
        });

        const indicator = wrapper.find('.w-3.h-3.rounded-full');
        expect(indicator.classes()).toContain(indicatorClass);

        const badge = wrapper.find('.px-2.py-1.text-xs.font-medium.rounded-full');
        expect(badge.text()).toBe(badgeText);
        badgeClasses.forEach(cls => {
          expect(badge.classes()).toContain(cls);
        });
      });
    });
  });

  describe('Current Task Display', () => {
    it('should display current task when provided', () => {
      wrapper = mount(AgentStatusCard, {
        props: {
          agent: mockAgent,
          currentTask: mockTask,
          taskProgress: 65,
        },
      });

      expect(wrapper.text()).toContain('Current Task');
      expect(wrapper.text()).toContain('Implement authentication system');
      expect(wrapper.text()).toContain('65%');

      const progressBar = wrapper.find('.bg-blue-600.h-2.rounded-full');
      expect(progressBar.attributes('style')).toContain('width: 65%');
    });

    it('should not display task section when no current task', () => {
      wrapper = mount(AgentStatusCard, {
        props: {
          agent: mockAgent,
        },
      });

      expect(wrapper.text()).not.toContain('Current Task');
    });

    it('should handle zero progress correctly', () => {
      wrapper = mount(AgentStatusCard, {
        props: {
          agent: mockAgent,
          currentTask: mockTask,
          taskProgress: 0,
        },
      });

      expect(wrapper.text()).toContain('0%');
      const progressBar = wrapper.find('.bg-blue-600.h-2.rounded-full');
      expect(progressBar.attributes('style')).toContain('width: 0%');
    });

    it('should handle complete progress correctly', () => {
      wrapper = mount(AgentStatusCard, {
        props: {
          agent: mockAgent,
          currentTask: mockTask,
          taskProgress: 100,
        },
      });

      expect(wrapper.text()).toContain('100%');
      const progressBar = wrapper.find('.bg-blue-600.h-2.rounded-full');
      expect(progressBar.attributes('style')).toContain('width: 100%');
    });
  });

  describe('Performance Metrics', () => {
    it('should display metrics when provided', () => {
      wrapper = mount(AgentStatusCard, {
        props: {
          agent: mockAgent,
          metrics: mockMetrics,
        },
      });

      expect(wrapper.text()).toContain('92%'); // success rate
      expect(wrapper.text()).toContain('15'); // tasks completed
      expect(wrapper.text()).toContain('Success Rate');
      expect(wrapper.text()).toContain('Tasks Done');
    });

    it('should display zero values when metrics are missing', () => {
      wrapper = mount(AgentStatusCard, {
        props: {
          agent: mockAgent,
        },
      });

      expect(wrapper.text()).toContain('0%');
      expect(wrapper.text()).toContain('0');
      expect(wrapper.text()).toContain('Success Rate');
      expect(wrapper.text()).toContain('Tasks Done');
    });

    it('should handle partial metrics', () => {
      wrapper = mount(AgentStatusCard, {
        props: {
          agent: mockAgent,
          metrics: {
            successRate: 0.85,
            // tasksCompleted missing
          } as AgentMetrics,
        },
      });

      expect(wrapper.text()).toContain('85%'); // success rate
      expect(wrapper.text()).toContain('0'); // tasks completed defaults to 0
    });
  });

  describe('DNA Genetics Display', () => {
    it('should display genetic markers when DNA is provided', () => {
      wrapper = mount(AgentStatusCard, {
        props: {
          agent: mockAgent,
          dna: mockDna,
        },
      });

      expect(wrapper.text()).toContain('Complexity');
      expect(wrapper.text()).toContain('75.0%'); // 0.75 * 100
      expect(wrapper.text()).toContain('Adaptability');
      expect(wrapper.text()).toContain('82.0%'); // 0.82 * 100
      expect(wrapper.text()).toContain('Stability');
      expect(wrapper.text()).toContain('91.0%'); // 0.91 * 100
    });

    it('should not display genetics when DNA is not provided', () => {
      wrapper = mount(AgentStatusCard, {
        props: {
          agent: mockAgent,
        },
      });

      expect(wrapper.text()).not.toContain('Complexity');
      expect(wrapper.text()).not.toContain('Adaptability');
      expect(wrapper.text()).not.toContain('Stability');
    });
  });

  describe('Last Active Time', () => {
    it('should display "Just now" for very recent activity', () => {
      const veryRecentAgent = {
        ...mockAgent,
        lastActiveAt: new Date('2024-01-15T09:59:30Z'), // 30 seconds ago
      };

      wrapper = mount(AgentStatusCard, {
        props: {
          agent: veryRecentAgent,
        },
      });

      expect(wrapper.text()).toContain('Just now');
    });

    it('should display minutes for recent activity', () => {
      wrapper = mount(AgentStatusCard, {
        props: {
          agent: mockAgent, // 15 minutes ago
        },
      });

      expect(wrapper.text()).toContain('15m ago');
    });

    it('should display hours for older activity', () => {
      const hoursAgoAgent = {
        ...mockAgent,
        lastActiveAt: new Date('2024-01-15T07:00:00Z'), // 3 hours ago
      };

      wrapper = mount(AgentStatusCard, {
        props: {
          agent: hoursAgoAgent,
        },
      });

      expect(wrapper.text()).toContain('3h ago');
    });

    it('should display days for very old activity', () => {
      const daysAgoAgent = {
        ...mockAgent,
        lastActiveAt: new Date('2024-01-13T10:00:00Z'), // 2 days ago
      };

      wrapper = mount(AgentStatusCard, {
        props: {
          agent: daysAgoAgent,
        },
      });

      expect(wrapper.text()).toContain('2d ago');
    });
  });

  describe('Event Emissions', () => {
    it('should emit view-details event when View Details button is clicked', async () => {
      wrapper = mount(AgentStatusCard, {
        props: {
          agent: mockAgent,
        },
      });

      const viewDetailsButton = wrapper.findAll('button').find(btn => 
        btn.text().includes('View Details')
      );
      expect(viewDetailsButton).toBeDefined();

      await viewDetailsButton!.trigger('click');

      expect(wrapper.emitted('view-details')).toBeTruthy();
      expect(wrapper.emitted('view-details')![0]).toEqual([mockAgent.id]);
    });

    it('should emit manage-agent event when Manage button is clicked', async () => {
      wrapper = mount(AgentStatusCard, {
        props: {
          agent: mockAgent,
        },
      });

      const manageButton = wrapper.findAll('button').find(btn => 
        btn.text().includes('Manage')
      );
      expect(manageButton).toBeDefined();

      await manageButton!.trigger('click');

      expect(wrapper.emitted('manage-agent')).toBeTruthy();
      expect(wrapper.emitted('manage-agent')![0]).toEqual([mockAgent.id]);
    });
  });

  describe('Dark Mode Support', () => {
    it('should include dark mode classes', () => {
      wrapper = mount(AgentStatusCard, {
        props: {
          agent: mockAgent,
        },
      });

      const cardElement = wrapper.find('.bg-white');
      expect(cardElement.classes()).toContain('dark:bg-gray-800');

      const agentName = wrapper.find('.text-lg.font-semibold');
      expect(agentName.classes()).toContain('dark:text-white');
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined generation gracefully', () => {
      const dnaWithoutGeneration = { ...mockDna, generation: undefined } as any;
      wrapper = mount(AgentStatusCard, {
        props: {
          agent: mockAgent,
          dna: dnaWithoutGeneration,
        },
      });

      expect(wrapper.text()).toContain('Gen 1'); // defaults to 1
    });

    it('should handle extreme genetic values', () => {
      const extremeDna = {
        ...mockDna,
        genetics: {
          complexity: 1.0,
          adaptability: 0.0,
          successRate: 0.999,
          transferability: 0.001,
          stability: 1.0,
          novelty: 0.5,
        },
      };

      wrapper = mount(AgentStatusCard, {
        props: {
          agent: mockAgent,
          dna: extremeDna,
        },
      });

      expect(wrapper.text()).toContain('100.0%'); // complexity
      expect(wrapper.text()).toContain('0.0%'); // adaptability
      expect(wrapper.text()).toContain('100.0%'); // stability
    });

    it('should handle very long agent names', () => {
      const longNameAgent = {
        ...mockAgent,
        name: 'VeryLongAgentNameThatMightCauseLayoutIssues',
      };

      wrapper = mount(AgentStatusCard, {
        props: {
          agent: longNameAgent,
        },
      });

      expect(wrapper.text()).toContain(longNameAgent.name);
    });
  });
});