/**
 * Unit tests for ApprovalCard component (PWA Mobile)
 * Following SENTRA project standards: strict TypeScript with branded types
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { vi } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import ApprovalCard from '../../components/approvals/ApprovalCard.vue';
import type { ApprovalRequest, ApprovalRequestId, AgentInstanceId } from '@/types';

// Helper functions to create branded types
const createApprovalRequestId = (id: string): ApprovalRequestId => id as ApprovalRequestId;
const createAgentInstanceId = (id: string): AgentInstanceId => id as AgentInstanceId;

// Mock child components
vi.mock('../../components/approvals/TimeRemaining.vue', () => ({
  default: { template: '<div data-testid="time-remaining">5m remaining</div>' }
}));

vi.mock('../../components/approvals/MoreOptions.vue', () => ({
  default: { template: '<div data-testid="more-options">⋮</div>' }
}));

vi.mock('../../components/approvals/ContextSummary.vue', () => ({
  default: { template: '<div data-testid="context-summary">Context</div>' }
}));

vi.mock('../../components/approvals/RiskIndicators.vue', () => ({
  default: { template: '<div data-testid="risk-indicators">Medium Risk</div>' }
}));

vi.mock('../../components/ui/ApprovalButton.vue', () => ({
  default: { 
    template: '<button class="approval-button" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
    props: ['variant', 'disabled', 'loading'],
    emits: ['click']
  }
}));

describe('ApprovalCard Component', () => {
  let wrapper: VueWrapper<any>;
  let mockApproval: ApprovalRequest;

  beforeEach(() => {
    mockApproval = {
      id: createApprovalRequestId('approval-123'),
      agentId: createAgentInstanceId('agent-456789'),
      decisionType: 'code_deployment',
      title: 'Deploy authentication system',
      description: 'Deploy the new JWT-based authentication system to production environment',
      priority: 'high',
      requestedAt: new Date('2024-01-15T10:00:00Z'),
      expiresAt: new Date('2024-01-15T10:30:00Z'),
      requiredApprovers: 1,
      currentApprovers: [],
      context: {
        riskAssessment: {
          overallRisk: 'medium',
          securityRisk: true,
          dataLossRisk: false,
          performanceRisk: true,
          availabilityRisk: false,
          mitigations: ['backup-deployment', 'monitoring-enabled']
        },
        testResults: {
          unitTests: { passed: 40, failed: 2, skipped: 0, coverage: 94 },
          integrationTests: { passed: 25, failed: 0, skipped: 0, coverage: 88 },
          performanceTests: { passed: 10, failed: 0, skipped: 0, coverage: 75 },
          securityTests: { passed: 8, failed: 0, skipped: 0, coverage: 95 }
        },
      },
    };
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('Basic Rendering', () => {
    it('should render approval information correctly', () => {
      wrapper = mount(ApprovalCard, {
        props: {
          approval: mockApproval,
        },
      });

      expect(wrapper.text()).toContain('CODE DEPLOYMENT');
      expect(wrapper.text()).toContain('Deploy authentication system');
      expect(wrapper.text()).toContain('Deploy the new JWT-based authentication system');
      expect(wrapper.text()).toContain('Agent 456789');
    });

    it('should display priority indicator', () => {
      wrapper = mount(ApprovalCard, {
        props: {
          approval: mockApproval,
        },
      });

      const priorityDot = wrapper.find('.w-3.h-3.rounded-full');
      expect(priorityDot.classes()).toContain('bg-yellow-500'); // high priority

      const card = wrapper.find('.approval-card');
      expect(card.classes()).toContain('border-l-4');
      expect(card.classes()).toContain('border-yellow-500');
    });
  });

  describe('Priority Variants', () => {
    const priorityTests = [
      {
        priority: 'emergency' as const,
        expectedDotColor: 'bg-red-500',
        expectedBorderColor: 'border-red-500',
      },
      {
        priority: 'critical' as const,
        expectedDotColor: 'bg-orange-500',
        expectedBorderColor: 'border-orange-500',
      },
      {
        priority: 'high' as const,
        expectedDotColor: 'bg-yellow-500',
        expectedBorderColor: 'border-yellow-500',
      },
      {
        priority: 'medium' as const,
        expectedDotColor: 'bg-blue-500',
        expectedBorderColor: 'border-blue-500',
      },
      {
        priority: 'low' as const,
        expectedDotColor: 'bg-gray-400',
        expectedBorderColor: 'border-gray-400',
      },
    ];

    priorityTests.forEach(({ priority, expectedDotColor, expectedBorderColor }) => {
      it(`should display ${priority} priority correctly`, () => {
        wrapper = mount(ApprovalCard, {
          props: {
            approval: { ...mockApproval, priority },
          },
        });

        const priorityDot = wrapper.find('.w-3.h-3.rounded-full');
        expect(priorityDot.classes()).toContain(expectedDotColor);

        const card = wrapper.find('.approval-card');
        expect(card.classes()).toContain(expectedBorderColor);
      });
    });
  });

  describe('Action Buttons', () => {
    it('should render all action buttons', () => {
      wrapper = mount(ApprovalCard, {
        props: {
          approval: mockApproval,
        },
      });

      const buttons = wrapper.findAll('.approval-button');
      expect(buttons).toHaveLength(3); // Approve, Reject, View Details

      expect(wrapper.text()).toContain('Approve');
      expect(wrapper.text()).toContain('Reject');
    });

    it('should emit approve event when approve button is clicked', async () => {
      wrapper = mount(ApprovalCard, {
        props: {
          approval: mockApproval,
        },
      });

      const approveButton = wrapper.findAll('.approval-button').find(btn => 
        btn.text().includes('Approve')
      );
      expect(approveButton).toBeDefined();

      await approveButton!.trigger('click');

      expect(wrapper.emitted('approve')).toBeTruthy();
      expect(wrapper.emitted('approve')).toHaveLength(1);
    });

    it('should emit reject event when reject button is clicked', async () => {
      wrapper = mount(ApprovalCard, {
        props: {
          approval: mockApproval,
        },
      });

      const rejectButton = wrapper.findAll('.approval-button').find(btn => 
        btn.text().includes('Reject')
      );
      expect(rejectButton).toBeDefined();

      await rejectButton!.trigger('click');

      expect(wrapper.emitted('reject')).toBeTruthy();
      expect(wrapper.emitted('reject')).toHaveLength(1);
    });

    it('should emit view-details event when view details button is clicked', async () => {
      wrapper = mount(ApprovalCard, {
        props: {
          approval: mockApproval,
        },
      });

      const viewDetailsButton = wrapper.findAll('.approval-button')[2]; // Third button
      if (viewDetailsButton) {
        await viewDetailsButton.trigger('click');
      }

      expect(wrapper.emitted('view-details')).toBeTruthy();
      expect(wrapper.emitted('view-details')).toHaveLength(1);
    });
  });

  describe('Processing States', () => {
    it('should disable buttons when processing', () => {
      wrapper = mount(ApprovalCard, {
        props: {
          approval: mockApproval,
          isProcessing: true,
        },
      });

      const buttons = wrapper.findAll('.approval-button');
      buttons.forEach(button => {
        expect(button.attributes('disabled')).toBe('');
      });
    });

    it('should show loading state for approve button', () => {
      wrapper = mount(ApprovalCard, {
        props: {
          approval: mockApproval,
          isApproving: true,
        },
      });

      const approveButton = wrapper.findAll('.approval-button').find(btn => 
        btn.text().includes('Approve')
      );
      expect(approveButton?.attributes('loading')).toBe('true');
    });

    it('should show loading state for reject button', () => {
      wrapper = mount(ApprovalCard, {
        props: {
          approval: mockApproval,
          isRejecting: true,
        },
      });

      const rejectButton = wrapper.findAll('.approval-button').find(btn => 
        btn.text().includes('Reject')
      );
      expect(rejectButton?.attributes('loading')).toBe('true');
    });

    it('should apply opacity when processing', () => {
      wrapper = mount(ApprovalCard, {
        props: {
          approval: mockApproval,
          isProcessing: true,
        },
      });

      const card = wrapper.find('.approval-card');
      expect(card.classes()).toContain('opacity-60');
    });
  });

  describe('Touch Gestures', () => {
    it('should handle touch start event', async () => {
      wrapper = mount(ApprovalCard, {
        props: {
          approval: mockApproval,
        },
      });

      const card = wrapper.find('.approval-card');
      
      // Mock touch event
      const touchEvent = new TouchEvent('touchstart', {
        touches: [
          new Touch({
            identifier: 0,
            target: card.element,
            clientX: 100,
            clientY: 200,
          })
        ]
      });

      await card.trigger('touchstart', { touches: [{ clientX: 100, clientY: 200 }] });
      
      // Touch start should be handled without errors
      expect(wrapper.vm.touchStartX).toBe(100);
      expect(wrapper.vm.touchStartY).toBe(200);
      expect(wrapper.vm.isTouching).toBe(true);
    });

    it('should detect swipe right for approve', async () => {
      wrapper = mount(ApprovalCard, {
        props: {
          approval: mockApproval,
        },
      });

      const card = wrapper.find('.approval-card');

      // Simulate swipe right
      await card.trigger('touchstart', { 
        touches: [{ clientX: 50, clientY: 200 }] 
      });
      
      await card.trigger('touchmove', { 
        touches: [{ clientX: 200, clientY: 200 }] 
      });

      expect(wrapper.vm.swipeAction).toBe('approve');
    });

    it('should detect swipe left for reject', async () => {
      wrapper = mount(ApprovalCard, {
        props: {
          approval: mockApproval,
        },
      });

      const card = wrapper.find('.approval-card');

      // Simulate swipe left
      await card.trigger('touchstart', { 
        touches: [{ clientX: 200, clientY: 200 }] 
      });
      
      await card.trigger('touchmove', { 
        touches: [{ clientX: 50, clientY: 200 }] 
      });

      expect(wrapper.vm.swipeAction).toBe('reject');
    });

    it('should not trigger swipe on vertical gestures', async () => {
      wrapper = mount(ApprovalCard, {
        props: {
          approval: mockApproval,
        },
      });

      const card = wrapper.find('.approval-card');

      // Simulate vertical swipe
      await card.trigger('touchstart', { 
        touches: [{ clientX: 100, clientY: 100 }] 
      });
      
      await card.trigger('touchmove', { 
        touches: [{ clientX: 100, clientY: 300 }] 
      });

      expect(wrapper.vm.swipeAction).toBe(null);
    });

    it('should emit approve on swipe right release', async () => {
      vi.useFakeTimers();
      
      wrapper = mount(ApprovalCard, {
        props: {
          approval: mockApproval,
        },
      });

      const card = wrapper.find('.approval-card');

      // Simulate full swipe gesture
      await card.trigger('touchstart', { 
        touches: [{ clientX: 50, clientY: 200 }] 
      });
      
      await card.trigger('touchmove', { 
        touches: [{ clientX: 200, clientY: 200 }] 
      });
      
      await card.trigger('touchend');

      // Fast-forward timers for the delayed emit
      vi.advanceTimersByTime(200);

      expect(wrapper.emitted('approve')).toBeTruthy();
      
      vi.useRealTimers();
    });

    it('should disable touch gestures when processing', async () => {
      wrapper = mount(ApprovalCard, {
        props: {
          approval: mockApproval,
          isProcessing: true,
        },
      });

      const card = wrapper.find('.approval-card');

      await card.trigger('touchstart', { 
        touches: [{ clientX: 50, clientY: 200 }] 
      });

      expect(wrapper.vm.isTouching).toBe(false);
    });
  });

  describe('Time Formatting', () => {
    it('should format time correctly for different intervals', () => {
      const now = new Date('2024-01-15T10:30:00Z');
      vi.setSystemTime(now);

      const testCases = [
        { 
          requestedAt: new Date('2024-01-15T10:29:30Z'), 
          expected: 'Just now' 
        },
        { 
          requestedAt: new Date('2024-01-15T10:25:00Z'), 
          expected: '5m ago' 
        },
        { 
          requestedAt: new Date('2024-01-15T08:30:00Z'), 
          expected: '2h ago' 
        },
        { 
          requestedAt: new Date('2024-01-13T10:30:00Z'), 
          expected: '2d ago' 
        },
      ];

      testCases.forEach(({ requestedAt, expected }) => {
        wrapper = mount(ApprovalCard, {
          props: {
            approval: { ...mockApproval, requestedAt },
          },
        });

        expect(wrapper.text()).toContain(expected);
        
        if (wrapper) wrapper.unmount();
      });
    });
  });

  describe('Agent Name Display', () => {
    it('should display shortened agent ID', () => {
      wrapper = mount(ApprovalCard, {
        props: {
          approval: { ...mockApproval, agentId: createAgentInstanceId('agent-abcdef123456') },
        },
      });

      expect(wrapper.text()).toContain('Agent 123456');
    });
  });

  describe('Context and Risk Display', () => {
    it('should render context summary when provided', () => {
      wrapper = mount(ApprovalCard, {
        props: {
          approval: mockApproval,
        },
      });

      expect(wrapper.find('[data-testid="context-summary"]').exists()).toBe(true);
    });

    it('should render risk indicators when risk assessment exists', () => {
      wrapper = mount(ApprovalCard, {
        props: {
          approval: mockApproval,
        },
      });

      expect(wrapper.find('[data-testid="risk-indicators"]').exists()).toBe(true);
    });

    it('should not render risk indicators when no risk assessment', () => {
      const approvalWithoutRisk: ApprovalRequest = {
        ...mockApproval,
        context: {
          ...mockApproval.context!
        },
      };

      wrapper = mount(ApprovalCard, {
        props: {
          approval: approvalWithoutRisk,
        },
      });

      expect(wrapper.find('[data-testid="risk-indicators"]').exists()).toBe(false);
    });
  });

  describe('Swipe Action Visual Feedback', () => {
    it('should show approve overlay when swiping right', async () => {
      wrapper = mount(ApprovalCard, {
        props: {
          approval: mockApproval,
        },
      });

      // Set swipe action directly
      await wrapper.setData({ swipeAction: 'approve' });

      const overlay = wrapper.find('.absolute.inset-0');
      expect(overlay.exists()).toBe(true);
      expect(overlay.classes()).toContain('bg-green-500');
      expect(overlay.text()).toContain('Release to Approve');
    });

    it('should show reject overlay when swiping left', async () => {
      wrapper = mount(ApprovalCard, {
        props: {
          approval: mockApproval,
        },
      });

      // Set swipe action directly
      await wrapper.setData({ swipeAction: 'reject' });

      const overlay = wrapper.find('.absolute.inset-0');
      expect(overlay.exists()).toBe(true);
      expect(overlay.classes()).toContain('bg-red-500');
      expect(overlay.text()).toContain('Release to Reject');
    });

    it('should not show overlay when no swipe action', () => {
      wrapper = mount(ApprovalCard, {
        props: {
          approval: mockApproval,
        },
      });

      const overlay = wrapper.find('.absolute.inset-0');
      expect(overlay.exists()).toBe(false);
    });
  });

  describe('Decision Type Display', () => {
    it('should format decision type correctly', () => {
      const testCases = [
        { 
          decisionType: 'code_deployment', 
          expected: 'CODE DEPLOYMENT' 
        },
        { 
          decisionType: 'resource_allocation', 
          expected: 'RESOURCE ALLOCATION' 
        },
        { 
          decisionType: 'critical_system_change', 
          expected: 'CRITICAL SYSTEM CHANGE' 
        },
      ];

      testCases.forEach(({ decisionType, expected }) => {
        wrapper = mount(ApprovalCard, {
          props: {
            approval: { ...mockApproval, decisionType: decisionType as any },
          },
        });

        expect(wrapper.text()).toContain(expected);
        
        if (wrapper) wrapper.unmount();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for touch interactions', () => {
      wrapper = mount(ApprovalCard, {
        props: {
          approval: mockApproval,
        },
      });

      const card = wrapper.find('.approval-card');
      expect(card.attributes('role')).toBe('button');
      expect(card.attributes('tabindex')).toBe('0');
    });

    it('should support keyboard navigation', async () => {
      wrapper = mount(ApprovalCard, {
        props: {
          approval: mockApproval,
        },
      });

      const card = wrapper.find('.approval-card');
      await card.trigger('keydown.enter');

      // Should focus or activate the card
      expect(card.element).toBe(document.activeElement);
    });
  });
});